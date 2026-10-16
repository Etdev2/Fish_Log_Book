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

/**
 * Zoom (FL-1, ±365 d). `week` is the detailed chart sliced around the anchor; `month` and
 * `year` are an overview of each station day's tide range, because the detailed chart lays
 * out at a fixed 560 px a day and a year of it would be 200,000 px of unreadable labels.
 */
export type TideZoom = "week" | "month" | "year";

export const ZOOM_LEVELS: readonly TideZoom[] = ["week", "month", "year"];

/** How many station days one screen width shows at each zoom. */
export const ZOOM_SPAN_DAYS: Record<TideZoom, number> = { week: 7, month: 31, year: 365 };

/** One station-calendar day's highest high and lowest low, from the turns. */
export interface DayRange {
  /** `YYYY-MM-DD` on the station's calendar. */
  readonly day: string;
  /** The first turn of that day, as an instant to anchor the week view on. */
  readonly atMs: number;
  readonly lowM: number;
  readonly highM: number;
}

/**
 * Group the series' turns by station day. Days with no turn (only possible at the very ends
 * of the window) are left out rather than drawn as zero — a missing bar is honest, a bar at
 * datum is a wrong tide.
 */
export function dailyRanges(series: TidePredictionSeries, timeZone: string): DayRange[] {
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const out: DayRange[] = [];
  let current: { day: string; atMs: number; lowM: number; highM: number } | null = null;
  for (const sample of series.samples) {
    if (sample.turn === null) continue;
    const at = Number(sample.at);
    const height = Number(sample.height);
    const day = format.format(new Date(at));
    if (current === null || current.day !== day) {
      if (current !== null) out.push(current);
      current = { day, atMs: at, lowM: height, highM: height };
    } else {
      current.lowM = Math.min(current.lowM, height);
      current.highM = Math.max(current.highM, height);
    }
  }
  if (current !== null) out.push(current);
  return out;
}

/** Whether the slice handed to the chart carries any hourly points, or only turns. */
export function hasHourly(series: TidePredictionSeries): boolean {
  return series.samples.some((s) => s.turn === null);
}
