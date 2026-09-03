/** `pace.ts` against `src/core/rules/vectors/tide-pace.json`. ADR 003 §4. */
import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import vectors from "../vectors/tide-pace.json";
import { PACE_BANDS, paceAt } from "./pace";
import { metresPerHour } from "@/core/units";
import { tideSeries, type TidePredictionSample, type TideStation } from "./source";

const samples: TidePredictionSample[] = vectors.samples.map(([at, h, turn]) => ({
  at: instant(at as number),
  height: metres(h as number),
  turn: turn as "high" | "low" | null,
}));
const series = tideSeries({
  station: vectors.station as TideStation,
  samples,
  provider: "fixture",
  retrievedAt: null,
});
const TOL = vectors.tolerance;

describe("tide pace vectors (ADR 003 §4)", () => {
  it("the published band cut points are the ones in the vector file", () => {
    expect(PACE_BANDS.map((b) => ({ class: b.class, maxPercentile: b.maxPercentile })))
      .toEqual(vectors.bands);
  });

  it("the baseline describes the fixed-interval distribution, not the legs", () => {
    const c0 = vectors.cases[0];
    const got = paceAt(series, instant(c0.at), metresPerHour(c0.rateMPerHour));
    expect(got).not.toBeNull();
    expect(got!.value.baseline.sampleInterval as number).toBe(vectors.distributionStepMs);
    expect(got!.value.baseline.sampleCount).toBe(vectors.distributionSize);
    expect(got!.value.baseline.legCount).toBe(vectors.legCount);
    expect(Math.abs((got!.value.baseline.medianPeakRate as number) - vectors.medianPeakRate))
      .toBeLessThan(TOL);
  });

  it("percentile and class match an independent ranking", () => {
    for (const c of vectors.cases) {
      const got = paceAt(series, instant(c.at), metresPerHour(c.rateMPerHour));
      expect(got, JSON.stringify(c)).not.toBeNull();
      expect(Math.abs(got!.value.percentile - c.percentile), JSON.stringify(c)).toBeLessThan(TOL);
      expect(got!.value.class, JSON.stringify(c)).toBe(c.class);
      expect(Math.abs(got!.value.ratio - c.ratio), JSON.stringify(c)).toBeLessThan(TOL);
    }
  });
});
