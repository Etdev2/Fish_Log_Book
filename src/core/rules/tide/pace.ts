/**
 * `paceAt` — "is the water moving unusually fast right now, for here".
 *
 * `|rate|` over a tidal cycle is roughly sinusoidal: 0 at a turn, ~peak at mid-leg, with a
 * time-average around 0.64 of the peak. That shape makes `ratio = |rate| / medianPeakRate`
 * a poor classifier on its own — bands centred on 1.0 would file most of the day under
 * "slow" and almost nothing under "fast", backwards from what is being asked. So the
 * `PaceClass` is decided by PERCENTILE: where does the current |rate| fall in the
 * distribution of |rate| sampled across the whole loaded series. `ratio` is kept on the
 * type because it is still a useful, differently-shaped number a UI may want, but it does
 * not drive the classification.
 *
 * The distribution is sampled at a fixed wall-clock interval (`DISTRIBUTION_STEP`, 10 min)
 * rather than at the raw prediction samples, because the fixture (and any live NOAA feed)
 * mixes hourly samples with extra points inserted exactly at turns — sampling the raw
 * points would over-weight slack water in the distribution.
 *
 * This normalises against the loaded prediction window only, not the station's long-run
 * climatology — see the `basis` string on the returned `Sourced<TidePace>`. It cannot yet
 * say "fast for this station in September".
 */
import type { Instant, Millis, MetresPerHour, Sourced } from "@/core/units";
import { metresPerHour, sourced } from "@/core/units";
import type { TidePredictionSeries } from "./source";
import { turnsIn } from "./turns";
import { rateAt } from "./height";
import { RATE_WINDOW } from "./constants";

export type PaceClass = "very-slow" | "slow" | "normal" | "fast" | "very-fast";

export interface TidePace {
  readonly class: PaceClass;
  /** |rate| / baseline.medianPeakRate. Informational — NOT what `class` is derived from. */
  readonly ratio: number;
  /** Percentile (0..100) of |rate| within the distribution sampled across the series. */
  readonly percentile: number;
  readonly baseline: {
    readonly source: "series";
    readonly sampleCount: number;
    readonly medianPeakRate: MetresPerHour;
  };
}

const DISTRIBUTION_STEP: Millis = (10 * 60_000) as Millis;

function median(nums: readonly number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Peak |rate| within each flood/ebb leg (the span between two consecutive turns). */
function legPeakRates(s: TidePredictionSeries, rateWindow: Millis): number[] {
  const turns = turnsIn(s, s.samples[0].at, s.samples[s.samples.length - 1].at);
  const peaks: number[] = [];
  for (let i = 0; i < turns.length - 1; i++) {
    const legSamples = s.samples.filter((x) => x.at >= turns[i].at && x.at <= turns[i + 1].at);
    let peak = 0;
    for (const sample of legSamples) {
      const r = rateAt(s, sample.at, rateWindow);
      if (r !== null) peak = Math.max(peak, Math.abs(r.value));
    }
    peaks.push(peak);
  }
  return peaks;
}

/** |rate| sampled every `DISTRIBUTION_STEP` across the series, for the percentile rank. */
function rateDistribution(s: TidePredictionSeries, rateWindow: Millis): number[] {
  const first = s.samples[0].at;
  const last = s.samples[s.samples.length - 1].at;
  const values: number[] = [];
  for (let t = first as number; t <= last; t += DISTRIBUTION_STEP) {
    const r = rateAt(s, t as Instant, rateWindow);
    if (r !== null) values.push(Math.abs(r.value));
  }
  return values;
}

function percentileRank(distribution: readonly number[], value: number): number {
  if (distribution.length === 0) return 50;
  const notGreater = distribution.filter((v) => v <= value).length;
  return (notGreater / distribution.length) * 100;
}

function classify(percentile: number): PaceClass {
  if (percentile < 10) return "very-slow";
  if (percentile < 30) return "slow";
  if (percentile < 70) return "normal";
  if (percentile < 90) return "fast";
  return "very-fast";
}

export function paceAt(
  s: TidePredictionSeries,
  at: Instant,
  rate: MetresPerHour,
  options?: { rateWindow?: Millis },
): Sourced<TidePace> {
  const rateWindow = options?.rateWindow ?? RATE_WINDOW;
  const peaks = legPeakRates(s, rateWindow);
  const medianPeak = median(peaks);
  const ratio = medianPeak > 0 ? Math.abs(rate) / medianPeak : 0;

  const distribution = rateDistribution(s, rateWindow);
  const percentile = percentileRank(distribution, Math.abs(rate));
  const cls = classify(percentile);

  return sourced(
    {
      class: cls,
      ratio,
      percentile,
      baseline: {
        source: "series",
        sampleCount: peaks.length,
        medianPeakRate: metresPerHour(medianPeak),
      },
    },
    "estimated",
    "Estimated by ranking the current rate of height change against the distribution of " +
      "rates sampled across this loaded prediction window, not the station's long-run " +
      "climatology — this cannot yet say a tide is fast \"for September at this station\".",
  );
}
