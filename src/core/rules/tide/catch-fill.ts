/**
 * One-time tide capture for a catch, from a cached series (founder Historical spec §6).
 *
 * This lives in `core/rules/tide` because it converts `Sourced<T>` readings into plain
 * stored numbers — ADR 006 §5 confines that unwrapping to the rules layer; features
 * receive numbers and never re-derive them.
 *
 * The rule this file exists to honour: a catch's tide is **captured once, at exactly the
 * catch moment, and never recomputed afterwards**. If the cached series does not cover
 * the catch moment the answer is `null` and the UI says *pending* — nothing here
 * estimates from a neighbouring day, and nothing calls slack what was not measured
 * (spec §19).
 */
import { instant } from "@/core/units";
import { heightAt } from "./height";
import { dailyRange, readTideAt } from "./state";
import type { TidePredictionSeries } from "./source";

export interface CatchTideFill {
  readonly heightM: number;
  /** Signed: + flood, − ebb (schema R7: never called "current"). */
  readonly rateMPerHr: number;
  readonly state: "flood" | "ebb" | "slack";
  /** 0–100 through the bounding flood/ebb leg, or null when a bounding turn is unknown. */
  readonly pctThroughCycle: number | null;
  readonly twelfthsHour: 1 | 2 | 3 | 4 | 5 | 6 | null;
  /** Day's range around the catch, or null when the 24h window is not fully covered. */
  readonly rangeM: number | null;
  /** [minutesFromCatch, heightM], 15-minute steps across catch ± 3h. */
  readonly curve: readonly (readonly [number, number])[];
  /**
   * Certainty of the underlying series values, carried so the panel can say
   * "interpolated" out loud instead of implying every digit was published.
   */
  readonly certainty: "published" | "interpolated";
}

const HOUR_MS = 3_600_000;
const CURVE_STEP_MS = 15 * 60_000;
const CURVE_HALF_SPAN_MS = 3 * HOUR_MS;

/**
 * Everything the snapshot row needs, or `null` when the cached series does not cover
 * `atMs` (a catch last month, a catch tomorrow). `null` is a first-class, honest answer
 * — the caller renders "pending", not an error and certainly not a fabricated curve.
 */
export function catchTideFillAt(
  series: TidePredictionSeries,
  atMs: number,
): CatchTideFill | null {
  if (!Number.isFinite(atMs)) return null;
  const at = instant(atMs);
  const reading = readTideAt(series, at);
  if (reading === null) return null;

  // Range of the day containing the catch, so "1.4 m of a 2.1 m tide" is meaningful
  // without knowing which side of midnight the bite was on.
  const range = dailyRange(
    series,
    instant(atMs - 12 * HOUR_MS),
    instant(atMs + 12 * HOUR_MS),
  );

  const state: CatchTideFill["state"] =
    reading.motion === "rising"
      ? "flood"
      : reading.motion === "falling"
        ? "ebb"
        : // "near-slack" and "slack" both record as slack: the schema has three states,
          // and NEAR_SLACK_BELOW (0.15 m/h) is the engine's own honesty band for "this
          // is not measurably moving".
          "slack";

  // The mini-curve: what the water was doing around the catch, frozen at capture time.
  // Points outside the series' ends are simply absent rather than extrapolated.
  const curve: [number, number][] = [];
  for (
    let offset = -CURVE_HALF_SPAN_MS;
    offset <= CURVE_HALF_SPAN_MS;
    offset += CURVE_STEP_MS
  ) {
    const height = heightAt(series, instant(atMs + offset));
    if (height !== null) {
      curve.push([Math.round(offset / 60_000), Math.round(height.value * 1000) / 1000]);
    }
  }

  return {
    heightM: Math.round(reading.height.value * 1000) / 1000,
    rateMPerHr: Math.round(reading.rate.value * 1000) / 1000,
    state,
    pctThroughCycle:
      reading.cycleProgress === null ? null : Math.round(reading.cycleProgress * 10_000) / 100,
    twelfthsHour: reading.ruleOfTwelfthsHour,
    rangeM: range === null ? null : Math.round(range.value * 1000) / 1000,
    curve,
    certainty:
      reading.height.certainty === "published" && reading.rate.certainty === "published"
        ? "published"
        : "interpolated",
  };
}

/** True when `atMs` sits inside the series' sampled window — cheaper than a full read. */
export function seriesCoversAt(series: TidePredictionSeries, atMs: number): boolean {
  return heightAt(series, instant(atMs)) !== null;
}
