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
  const runs = blockRuns(hourlyBlocks);
  const base = series === null ? null : baseHourlySpan(series);
  return { turns, hourly: base === null ? runs : mergeSpans([...runs, base]) };
}

/**
 * The hourly stretch already inside the base series (the up-front −2 d … +7 d fetch, or the
 * whole bundled fixture): first to last sample that is not a high/low turn. `toMs` is
 * exclusive like block runs, so it sits one millisecond past the last sample.
 */
export function baseHourlySpan(series: TidePredictionSeries): Span | null {
  let fromMs = Number.POSITIVE_INFINITY;
  let toMs = Number.NEGATIVE_INFINITY;
  for (const sample of series.samples) {
    if (sample.turn !== null) continue;
    const at = Number(sample.at);
    if (at < fromMs) fromMs = at;
    if (at > toMs) toMs = at;
  }
  return fromMs > toMs ? null : { fromMs, toMs: toMs + 1 };
}

function mergeSpans(spans: readonly Span[]): Span[] {
  const sorted = [...spans].sort((a, b) => a.fromMs - b.fromMs);
  const out: Span[] = [];
  for (const span of sorted) {
    const last = out[out.length - 1];
    if (last && span.fromMs <= last.toMs) {
      out[out.length - 1] = { fromMs: last.fromMs, toMs: Math.max(last.toMs, span.toMs) };
    } else out.push(span);
  }
  return out;
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
