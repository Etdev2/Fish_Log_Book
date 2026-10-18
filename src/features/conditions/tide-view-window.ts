/**
 * The chart scrolls continuously across today ± 730 days, but only a few days around the
 * read-head are ever drawn or held as points (ADR 011). This picks that slice.
 *
 * The slice moves in whole two-day steps rather than following every pixel, so scrubbing
 * does not rebuild the curve on every frame, and it always keeps at least 3.5 days of drawn
 * curve on either side of the read-head — far more than a phone screen (under a day) shows.
 */

import { instant } from "@/core/units";
import { tideSeries, type TidePredictionSample, type TidePredictionSeries } from "@/core/rules/tide";

import { mergeSamples } from "./queries/noaa-tides";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days drawn at once. */
export const RENDER_DAYS = 9;
/** The slice start snaps to multiples of this many days. */
export const RENDER_STEP_DAYS = 2;
/** The least drawn on either side of the read-head. */
export const RENDER_MARGIN_DAYS = 3.5;

export interface ViewWindow {
  readonly from: number;
  readonly to: number;
}

/**
 * The slice to draw for a read-head at `at`, clipped to `[start, end]`. A range no longer
 * than the slice is returned whole.
 */
export function renderWindowAround(at: number, start: number, end: number): ViewWindow {
  if (end - start <= RENDER_DAYS * DAY_MS) return { from: start, to: end };
  const step = RENDER_STEP_DAYS * DAY_MS;
  const snapped = Math.floor((at - RENDER_MARGIN_DAYS * DAY_MS) / step) * step;
  const from = Math.max(start, snapped);
  return { from, to: Math.min(end, snapped + RENDER_DAYS * DAY_MS) };
}

export function inWindow(at: number, window: ViewWindow): boolean {
  return at >= window.from && at <= window.to;
}

/**
 * The series the slice is drawn from: the high/low backbone for the whole slice, with real
 * NOAA hourly points laid between them wherever they are loaded. A turn wins where the two
 * land on the same instant. With no hourly points the slice is turns only, and the readout
 * says so (`heightAt` labels which it is).
 */
export function windowSeries(
  base: TidePredictionSeries,
  hourly: readonly TidePredictionSample[],
  window: ViewWindow,
): TidePredictionSeries {
  const within = (s: TidePredictionSample) => inWindow(Number(s.at), window);
  const backbone = base.samples.filter(within);
  if (backbone.length === 0) return base;
  const samples = mergeSamples(hourly.filter(within), backbone);
  return tideSeries({
    station: base.station,
    samples,
    provider: base.provider,
    retrievedAt: base.retrievedAt === null ? null : instant(Number(base.retrievedAt)),
  });
}
