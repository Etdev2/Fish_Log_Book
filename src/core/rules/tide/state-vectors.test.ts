/** `state.ts` against `src/core/rules/vectors/tide-state.json`. ADR 003 §4. */
import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import vectors from "../vectors/tide-state.json";
import { dailyRange, readTideAt } from "./state";
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

describe("tide state vectors (ADR 003 §4)", () => {
  it("readTideAt: height, rate, motion and the rule of twelfths", () => {
    for (const c of vectors.readTideAt) {
      const got = readTideAt(series, instant(c.at));
      expect(got, JSON.stringify(c)).not.toBeNull();
      expect(Math.abs((got!.height.value as number) - c.heightM), JSON.stringify(c))
        .toBeLessThan(TOL);
      expect(Math.abs((got!.rate.value as number) - c.rateMPerHour), JSON.stringify(c))
        .toBeLessThan(TOL);
      expect(got!.motion, JSON.stringify(c)).toBe(c.motion);
      expect(got!.ruleOfTwelfthsHour, JSON.stringify(c)).toBe(c.ruleOfTwelfthsHour);
      expect(got!.twelfths, JSON.stringify(c)).toBe(c.twelfths);
      if (c.cycleProgress === null) expect(got!.cycleProgress).toBeNull();
      else expect(Math.abs(got!.cycleProgress! - c.cycleProgress)).toBeLessThan(TOL);
    }
  });

  it("dailyRange spreads the extremes and reports honest certainty", () => {
    for (const c of vectors.dailyRange) {
      const got = dailyRange(series, instant(c.from), instant(c.to));
      expect(got, JSON.stringify(c)).not.toBeNull();
      expect(Math.abs((got!.value as number) - c.expectedRangeM), JSON.stringify(c))
        .toBeLessThan(TOL);
      expect(got!.certainty, JSON.stringify(c)).toBe(c.certainty);
    }
  });

  it("returns null outside the loaded series", () => {
    for (const c of vectors.outOfRange) {
      expect(readTideAt(series, instant(c.at)), JSON.stringify(c)).toBeNull();
    }
  });
});
