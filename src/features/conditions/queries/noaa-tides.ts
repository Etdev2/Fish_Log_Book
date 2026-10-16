/**
 * Live tide predictions from NOAA CO-OPS.
 *
 * The request shape is not guesswork: `tide-fixture.ts` records the exact call a previous
 * session used to fetch the bundled snapshot — `product=predictions`, `interval=h` for the
 * hourly curve and `interval=hilo` for the exact turning points, merged, with
 * `time_zone=gmt` so every timestamp arrives already UTC. This reproduces that call for
 * any station and any window.
 *
 * **What has not been verified.** The machine that wrote this file has no route to
 * `api.tidesandcurrents.noaa.gov`, so the parser was written against NOAA's documented
 * response and the recorded shape of that earlier fetch, and has NOT been run against the
 * live service. It is therefore defensive on purpose: anything it cannot parse is a
 * failure that falls back to cache, and never a half-built curve. A wrong tide is worse
 * than no tide — the same stance Fish Legal takes with "no verified data".
 *
 * **Verified 2026-10-13 (FL-1, #135):** the live endpoint answers this exact shape for
 * station 9410580, for both `h` and `hilo`, with `access-control-allow-origin: *`.
 *
 * No API key, no account, no quota published for this volume (see docs/finance). The
 * documented per-request data length for `product=predictions` is 10 years for
 * `interval=hilo` and 1 year for every other interval (verified against the API docs and a
 * live request on 2026-10-14; the server rejects hilo beyond 3655 days). So the two-year
 * turn window is ONE request, and only the hourly curve is ever chunked (ADR 011).
 */

import { instant, metres } from "@/core/units";
import { tideSeries, type TidePredictionSample, type TidePredictionSeries } from "@/core/rules/tide";

import type { TideStation } from "../stations";

const ENDPOINT = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

/** NOAA asks callers to identify themselves rather than send an anonymous flood. */
const APPLICATION = "fish-log-book";

export class TideFetchError extends Error {}

const DAY_MS = 24 * 60 * 60 * 1000;

/** NOAA's documented data-length limit for `h` (and every non-hilo) prediction interval: one year. */
export const MAX_REQUEST_MS = 365 * DAY_MS;

/**
 * NOAA's documented limit for `interval=hilo` predictions: 10 years. The live service
 * enforces "3655 days"; 3650 keeps a margin for leap days and inclusive end dates.
 */
export const MAX_HILO_REQUEST_MS = 3650 * DAY_MS;

/** Per-request data length for each interval this module requests. */
export function maxRequestMs(interval: "h" | "hilo"): number {
  return interval === "hilo" ? MAX_HILO_REQUEST_MS : MAX_REQUEST_MS;
}

/**
 * Split `[fromMs, toMs]` into consecutive chunks no longer than `maxMs`. The API's dates
 * are whole UTC days and inclusive, so each chunk after the first starts on the day after
 * the previous chunk ends; overlap at a day edge would only be de-duplicated anyway.
 */
export function chunkWindow(fromMs: number, toMs: number, maxMs: number = MAX_REQUEST_MS): FetchWindow[] {
  if (!(toMs >= fromMs)) return [];
  const chunks: FetchWindow[] = [];
  let start = fromMs;
  while (start <= toMs) {
    const end = Math.min(toMs, start + maxMs - DAY_MS);
    chunks.push({ fromMs: start, toMs: end });
    start = end + DAY_MS;
  }
  return chunks;
}

/** `YYYYMMDD` in UTC, which is what the API's date parameters expect alongside `time_zone=gmt`. */
function apiDate(atMs: number): string {
  const d = new Date(atMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

/**
 * NOAA returns `t` as "YYYY-MM-DD HH:mm" with no zone marker. With `time_zone=gmt` that
 * is UTC, so the `Z` is added rather than letting the runtime guess local time — the bug
 * this avoids would shift every tide by the device's offset.
 */
function parseUtc(t: string): number {
  return Date.parse(`${t.replace(" ", "T")}:00Z`);
}

interface RawPrediction {
  t?: unknown;
  v?: unknown;
  type?: unknown;
}

function samplesFrom(rows: readonly RawPrediction[]): TidePredictionSample[] {
  const out: TidePredictionSample[] = [];
  for (const row of rows) {
    if (typeof row.t !== "string" || typeof row.v !== "string") continue;
    const at = parseUtc(row.t);
    const height = Number.parseFloat(row.v);
    if (Number.isNaN(at) || Number.isNaN(height)) continue;
    out.push({
      at: instant(at),
      height: metres(height),
      turn: row.type === "H" ? "high" : row.type === "L" ? "low" : null,
    });
  }
  return out;
}

async function getPredictions(
  stationId: string,
  interval: "h" | "hilo",
  beginMs: number,
  endMs: number,
  signal?: AbortSignal,
): Promise<RawPrediction[]> {
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({
    product: "predictions",
    application: APPLICATION,
    station: stationId,
    datum: "MLLW",
    time_zone: "gmt",
    units: "metric",
    interval,
    format: "json",
    begin_date: apiDate(beginMs),
    end_date: apiDate(endMs),
  }).toString();

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new TideFetchError(`NOAA returned ${response.status} for station ${stationId}`);
  }

  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null) {
    throw new TideFetchError("NOAA returned a body that was not an object");
  }
  // The API reports its own errors in a 200 with an `error` object.
  const asRecord = body as { error?: { message?: string }; predictions?: unknown };
  if (asRecord.error) {
    throw new TideFetchError(asRecord.error.message ?? `NOAA rejected station ${stationId}`);
  }
  if (!Array.isArray(asRecord.predictions)) {
    throw new TideFetchError(`NOAA returned no predictions for station ${stationId}`);
  }
  return asRecord.predictions as RawPrediction[];
}

/**
 * Merge the hourly curve with the exact turning points.
 *
 * The two calls overlap: a hilo turn often lands within the same minute as an hourly
 * sample, and `tideSeries` requires strictly ascending, unique instants. Where they
 * collide the turning point wins — it is the one carrying the high/low mark, and it is the
 * value an angler actually reads off the chart.
 */
export function mergeSamples(
  hourly: readonly TidePredictionSample[],
  turns: readonly TidePredictionSample[],
): TidePredictionSample[] {
  const byInstant = new Map<number, TidePredictionSample>();
  for (const sample of hourly) byInstant.set(sample.at as number, sample);
  for (const sample of turns) byInstant.set(sample.at as number, sample);
  return [...byInstant.values()].sort((a, b) => (a.at as number) - (b.at as number));
}

export interface FetchWindow {
  readonly fromMs: number;
  /** End of the hourly curve. */
  readonly toMs: number;
  /** Start of the high/low turns, when they should reach further back than the hourly curve. */
  readonly turnsFromMs?: number;
  /** End of the high/low turns, when they should reach further than the hourly curve. */
  readonly turnsToMs?: number;
}

/**
 * Sequential, not parallel: kind to a free public API. With the default window this is one
 * hourly request and one hilo request; chunking only engages for windows past the limit.
 */
async function getChunked(
  stationId: string,
  interval: "h" | "hilo",
  window: FetchWindow,
  signal?: AbortSignal,
): Promise<RawPrediction[]> {
  const rows: RawPrediction[] = [];
  for (const chunk of chunkWindow(window.fromMs, window.toMs, maxRequestMs(interval))) {
    rows.push(...(await getPredictions(stationId, interval, chunk.fromMs, chunk.toMs, signal)));
  }
  return rows;
}

/** Fetch one station's predictions for a window and shape them for the chart. */
export async function fetchTideSeries(
  station: TideStation,
  window: FetchWindow,
  signal?: AbortSignal,
): Promise<TidePredictionSeries> {
  // FL-1 (±365 d): one hilo request spans the whole turn window — well inside NOAA's 10-year
  // hilo limit — while the hourly curve stays a short near window (1-year limit, and a
  // year of hourly points would crawl on an old phone).
  const turnWindow = {
    fromMs: window.turnsFromMs ?? window.fromMs,
    toMs: window.turnsToMs ?? window.toMs,
  };
  const hourly = await getChunked(station.id, "h", window, signal);
  const turns = await getChunked(station.id, "hilo", turnWindow, signal);

  const samples = mergeSamples(samplesFrom(hourly), samplesFrom(turns));
  if (samples.length === 0) {
    throw new TideFetchError(`No usable predictions came back for station ${station.id}`);
  }

  return tideSeries({
    station: {
      id: station.id,
      name: station.name,
      timeZone: station.timeZone,
      datum: "MLLW",
    },
    samples,
    provider: "noaa-coops",
    retrievedAt: instant(Date.now()),
  });
}
