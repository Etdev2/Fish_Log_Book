/**
 * What is actually on the device, as opposed to what the chart could ask for. The Dates
 * sheet reads this so it never promises a day that would need the network.
 */

import type { TidePredictionSeries } from "@/core/rules/tide";

import { blockRuns, type Span } from "./hourly-blocks";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CacheCoverage {
  /** First and last instant of the high/low predictions held, or null with no cache. */
  readonly turns: Span | null;
  /** Spans of hourly detail held (each a run of whole blocks). */
  readonly hourly: readonly Span[];
}

export function coverageOf(series: TidePredictionSeries | null, hourlyBlocks: readonly number[]): CacheCoverage {
  const turns =
    series === null || series.samples.length === 0
      ? null
      : { fromMs: Number(series.samples[0].at), toMs: Number(series.samples[series.samples.length - 1].at) };
  return { turns, hourly: blockRuns(hourlyBlocks) };
}

/**
 * True when the cached series reaches (within `toleranceMs`) both ends of the window we
 * want. A cache written by an older build that only ran a year ahead fails this, so it is
 * refetched instead of passing as fresh and quietly capping the chart at +365 days.
 */
export function coversWindow(
  series: TidePredictionSeries,
  fromMs: number,
  toMs: number,
  toleranceMs: number = DAY_MS,
): boolean {
  const first = Number(series.samples[0].at);
  const last = Number(series.samples[series.samples.length - 1].at);
  return first <= fromMs + toleranceMs && last >= toMs - toleranceMs;
}

/** Whether `[fromMs, toMs]` has hourly detail on the device end to end. */
export function hourlyCovers(coverage: CacheCoverage, fromMs: number, toMs: number): boolean {
  return coverage.hourly.some((span) => span.fromMs <= fromMs && span.toMs > toMs);
}
