/**
 * The chart's view window (ADR 011): a short slice of a long `TidePredictionSeries`.
 *
 * `TideTimeline` lays the series out at a fixed pixels-per-hour, which is right for a week
 * and absurd for two years. Rather than teach the chart about zoom, the screen hands it a
 * slice. One sample either side of the window is kept so the curve reaches the edges
 * instead of starting at the first turn inside it.
 */
import { tideSeries, type TidePredictionSeries } from "@/core/rules/tide";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days shown before and after the anchor. Matches the original week-long window. */
export const VIEW_BEFORE_MS = 2 * DAY_MS;
export const VIEW_AFTER_MS = 5 * DAY_MS;

export function viewWindowAround(anchorMs: number): { fromMs: number; toMs: number } {
  return { fromMs: anchorMs - VIEW_BEFORE_MS, toMs: anchorMs + VIEW_AFTER_MS };
}

export function sliceSeries(
  series: TidePredictionSeries,
  fromMs: number,
  toMs: number,
): TidePredictionSeries {
  const samples = series.samples;
  let first = samples.findIndex((s) => Number(s.at) >= fromMs);
  if (first === -1) first = samples.length - 1;
  let last = first;
  while (last + 1 < samples.length && Number(samples[last + 1].at) <= toMs) last++;
  const start = Math.max(0, first - 1);
  const end = Math.min(samples.length - 1, last + 1);
  if (start === 0 && end === samples.length - 1) return series;
  return tideSeries({
    station: series.station,
    samples: samples.slice(start, end + 1),
    provider: series.provider,
    retrievedAt: series.retrievedAt,
  });
}

/**
 * `YYYY-MM-DD` on the station's calendar, for `<input type="date">` min/max/value. The
 * chart's date bar divides days in the station's zone, so the picker must too — a UTC day
 * runs ahead of a Pacific one every evening.
 */
export function isoDay(ms: number, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}
