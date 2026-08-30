/**
 * Loads a `TidePredictionSeries` for the chart. Fixture now, a live NOAA CO-OPS fetch
 * later — `TideStation`/`TidePredictionSample` are the input contract that fetch must
 * satisfy unchanged (ADR 006 §2), so nothing above this file needs to change when it does.
 *
 * The fixture's millimetres are wire data; they are converted to `Metres` here and never
 * seen again (ADR 006 §3).
 */
import { degrees, instant, metresFromMillimetres } from "@/core/units";
import { tideSeries, type TidePredictionSeries } from "@/core/rules/tide";
import type { GeoPoint } from "@/core/rules/astro";
import { TIDE_BASE_UTC, TIDE_POINTS, TIDE_STATION, TIDE_STATION_NAME } from "../tide-fixture";

/** Presentation metadata only — never read inside `core/rules/tide/` maths (ADR 006 §2). */
export const STATION_TIME_ZONE = "America/Los_Angeles";

/** Newport Bay Entrance, CA — for `sunEventsFor`/`daylightSpans`, not part of the engine's `TideStation`. */
export const STATION_LOCATION: GeoPoint = { latitude: degrees(33.6047), longitude: degrees(-117.883) };

let cached: TidePredictionSeries | null = null;

/** The embedded NOAA CO-OPS fixture as a `TidePredictionSeries`. Memoized: it's static data. */
export function loadTideSeriesFixture(): TidePredictionSeries {
  if (cached) return cached;
  cached = tideSeries({
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
    retrievedAt: null,
  });
  return cached;
}
