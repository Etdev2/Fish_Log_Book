/**
 * Loads a `TidePredictionSeries` for the chart. `loadTideSeries()` is the live entry point:
 * fetch NOAA CO-OPS through `/api/tide`, fall back to a cached copy, fall back to the
 * embedded fixture (only while its window still covers "now"), fall back to an honest
 * empty series. `TideStation`/`TidePredictionSample` are the input contract every one of
 * those sources satisfies unchanged (ADR 006 §2), so nothing above this file needs to
 * change no matter which source won.
 *
 * The fixture's millimetres are wire data; they are converted to `Metres` here and never
 * seen again (ADR 006 §3).
 *
 * Fallback chain, in this exact order:
 *   1. Cache exists and is fresh enough → use it, no network call.
 *   2. Fresh fetch succeeds → use it, cache it.
 *   3. Fetch fails but a stale cache exists → use the stale cache (still honest — its own
 *      `retrievedAt` is unchanged, so `describeTideProvenance` reports it as cached, not live).
 *   4. No cache, no network → the fixture, but only while its window covers "now".
 *   5. Otherwise → an honest empty series (`samples: []`); the screen already renders that
 *      as "No tide predictions loaded" rather than indexing into nothing.
 */
import { degrees, instant, metresFromMillimetres } from "@/core/units";
import { tideSeries, type TidePredictionSeries, type TideStation } from "@/core/rules/tide";
import type { GeoPoint } from "@/core/rules/astro";
import { TIDE_BASE_UTC, TIDE_POINTS, TIDE_RETRIEVED_AT_UTC, TIDE_SELECTED_MINUTES, TIDE_STATION, TIDE_STATION_NAME } from "../tide-fixture";
import { parseTideWirePayload, type TideWirePayload } from "./tide-wire";
import { isTideCacheFresh, readTideCache, writeTideCache } from "./tide-cache";

/** Presentation metadata only — never read inside `core/rules/tide/` maths (ADR 006 §2). */
export const STATION_TIME_ZONE = "America/Los_Angeles";

/** Newport Bay Entrance, CA — for `sunEventsFor`/`daylightSpans`, not part of the engine's `TideStation`. */
export const STATION_LOCATION: GeoPoint = { latitude: degrees(33.6047), longitude: degrees(-117.883) };

/** The fixture's own anchor for the demo read-head, chosen at fetch time to sit near "now". */
export const TIDE_SELECTED_AT = instant(TIDE_BASE_UTC + TIDE_SELECTED_MINUTES * 60_000);

let fixtureSeries: TidePredictionSeries | null = null;

/** The embedded NOAA CO-OPS fixture as a `TidePredictionSeries`. Memoized: it's static data. */
export function loadTideSeriesFixture(): TidePredictionSeries {
  if (fixtureSeries) return fixtureSeries;
  fixtureSeries = tideSeries({
    station: {
      id: TIDE_STATION,
      name: TIDE_STATION_NAME,
      timeZone: STATION_TIME_ZONE,
      datum: "MLLW",
    },
    samples: TIDE_POINTS.map(([minutes, millimetres, mark]) => ({
      at: instant(TIDE_BASE_UTC + minutes * 60_000),
      height: metresFromMillimetres(millimetres),
      turn: mark === "H" ? "high" : mark === "L" ? "low" : null,
    })),
    provider: "fixture",
    retrievedAt: instant(TIDE_RETRIEVED_AT_UTC),
  });
  return fixtureSeries;
}

/** The fixture's last sample instant — computed from `TIDE_POINTS` rather than restated,
 *  so the window check can never drift out of sync with the data it's guarding. */
function fixtureWindowEndMs(): number {
  const [minutes] = TIDE_POINTS[TIDE_POINTS.length - 1];
  return TIDE_BASE_UTC + minutes * 60_000;
}

/**
 * Pure and exported for testing: does the embedded fixture's window actually cover `nowMs`?
 * The fixture's data window ends 2026-09-04 23:00 UTC — past that instant the fixture would
 * be silently wrong rather than merely offline, so it must self-disable instead of being
 * used as a last resort.
 */
export function fixtureCoversInstant(nowMs: number): boolean {
  return nowMs >= TIDE_BASE_UTC && nowMs <= fixtureWindowEndMs();
}

function defaultStation(stationId: string): TideStation {
  return { id: stationId, name: TIDE_STATION_NAME, timeZone: STATION_TIME_ZONE, datum: "MLLW" };
}

/** The honest "nothing loaded" series — built directly rather than through `tideSeries()`,
 *  which deliberately rejects empty input (ADR 006 §2 comment on `source.ts`); this is the
 *  one place in the app allowed to hold an empty series, and `TideScreen`/`CatchTidePanel`
 *  already guard on `samples.length` for it. */
function emptyTideSeries(stationId: string): TidePredictionSeries {
  return { station: defaultStation(stationId), samples: [], provider: "noaa-coops", retrievedAt: null };
}

/** How long after `retrievedAt` a series still counts as "just fetched this session" rather
 *  than "a cache from earlier" — derived from `retrievedAt` per the provenance rule (ADR
 *  006 §2: no widening `TidePredictionSeries.provider` for a third UI state). */
const LIVE_RETRIEVAL_WINDOW_MS = 60_000;

/**
 * Pure, exported for testing. Turns `provider`/`retrievedAt` into the three states the UI
 * actually needs to render honestly, without adding a state to the stored contract.
 */
export function describeTideProvenance(
  series: TidePredictionSeries,
  nowMs: number,
): "live" | "cached" | "fixture" {
  if (series.provider === "fixture") return "fixture";
  if (series.retrievedAt !== null && nowMs - Number(series.retrievedAt) < LIVE_RETRIEVAL_WINDOW_MS) {
    return "live";
  }
  return "cached";
}

async function fetchTideWirePayload(stationId: string): Promise<TideWirePayload | null> {
  try {
    const res = await fetch(`/api/tide?station=${encodeURIComponent(stationId)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as TideWirePayload;
  } catch {
    return null;
  }
}

/**
 * The live entry point. See the fallback chain documented at the top of this file. Never
 * throws — every failure mode (network, malformed payload, no cache, expired fixture) ends
 * in a value the screen can render, per the house rule that a data-source change must not
 * turn into a white screen.
 */
export async function loadTideSeries(stationId: string = TIDE_STATION): Promise<TidePredictionSeries> {
  const nowMs = Date.now();

  const cacheEntry = await readTideCache(stationId).catch(() => null);
  if (cacheEntry) {
    const seriesEndMs = Number(cacheEntry.series.samples[cacheEntry.series.samples.length - 1]?.at ?? 0);
    if (
      cacheEntry.series.samples.length > 0 &&
      isTideCacheFresh({ cachedAtMs: Number(cacheEntry.cachedAt), seriesEndMs, nowMs })
    ) {
      return cacheEntry.series;
    }
  }

  const payload = await fetchTideWirePayload(stationId);
  if (payload !== null) {
    const parsed = parseTideWirePayload(payload);
    if (parsed.ok) {
      const series = tideSeries({
        station: defaultStation(stationId),
        samples: parsed.samples,
        provider: "noaa-coops",
        retrievedAt: instant(nowMs),
      });
      await writeTideCache(stationId, series).catch(() => {});
      return series;
    }
  }

  if (cacheEntry && cacheEntry.series.samples.length > 0) {
    return cacheEntry.series;
  }

  if (fixtureCoversInstant(nowMs)) {
    return loadTideSeriesFixture();
  }

  return emptyTideSeries(stationId);
}
