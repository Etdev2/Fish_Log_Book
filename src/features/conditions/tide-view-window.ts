/**
 * The tide chart draws a week at a time. The loaded series now runs a year ahead, and the
 * timeline lays out every sample it is given, so the screen slices a 7-day view window
 * out of the full series and moves that window when the angler steps or jumps (ADR 011).
 */

import { instant } from "@/core/units";
import { tideSeries, type TidePredictionSeries } from "@/core/rules/tide";

const DAY_MS = 24 * 60 * 60 * 1000;

export const VIEW_DAYS = 7;

export interface ViewWindow {
  readonly from: number;
  readonly to: number;
}

/**
 * A `VIEW_DAYS`-wide window centred on `centreAt`, slid inward so it never leaves
 * `[start, end]`. A series no longer than the window is returned whole.
 */
export function viewWindowAround(centreAt: number, start: number, end: number): ViewWindow {
  const width = VIEW_DAYS * DAY_MS;
  if (end - start <= width) return { from: start, to: end };
  const from = Math.max(start, Math.min(end - width, centreAt - width / 2));
  return { from, to: from + width };
}

export function inWindow(at: number, window: ViewWindow): boolean {
  return at >= window.from && at <= window.to;
}

/** The samples inside the window, as a series. Falls back to the whole series if none are. */
export function sliceSeries(series: TidePredictionSeries, window: ViewWindow): TidePredictionSeries {
  const samples = series.samples.filter((s) => inWindow(Number(s.at), window));
  if (samples.length === 0) return series;
  return tideSeries({
    station: series.station,
    samples,
    provider: series.provider,
    retrievedAt: series.retrievedAt === null ? null : instant(Number(series.retrievedAt)),
  });
}
