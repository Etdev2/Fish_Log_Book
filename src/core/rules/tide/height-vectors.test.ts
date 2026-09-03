/**
 * `height.ts` against `src/core/rules/vectors/tide-height.json`.
 *
 * At a sample instant the expected height is NOAA's own published prediction. Between
 * samples it comes from an independent implementation of Fritsch & Carlson (1980), not
 * from this code. ADR 003 §4.
 */
import { describe, expect, it } from "vitest";

import { instant, metres, millis } from "@/core/units";
import vectors from "../vectors/tide-height.json";
import { heightAt, rateAt } from "./height";
import { tideSeries, type TidePredictionSample, type TideStation } from "./source";

const station = vectors.station as TideStation;
const samples: TidePredictionSample[] = vectors.samples.map(([at, h, turn]) => ({
  at: instant(at as number),
  height: metres(h as number),
  turn: turn as "high" | "low" | null,
}));
const series = tideSeries({ station, samples, provider: "fixture", retrievedAt: null });
const TOL = vectors.tolerance;

describe("tide height vectors (ADR 003 §4)", () => {
  it("reads the published NOAA value exactly at a sample instant", () => {
    for (const c of vectors.heightAtSample) {
      const got = heightAt(series, instant(c.at));
      expect(got, JSON.stringify(c)).not.toBeNull();
      expect(got!.value).toBeCloseTo(c.expectedM, 12);
      expect(got!.certainty).toBe(c.certainty);
    }
  });

  it("matches an independent Fritsch-Carlson interpolation between samples", () => {
    for (const c of vectors.heightBetweenSamples) {
      const got = heightAt(series, instant(c.at));
      expect(got, JSON.stringify(c)).not.toBeNull();
      expect(Math.abs(got!.value - c.expectedM), JSON.stringify(c)).toBeLessThan(TOL);
      expect(got!.certainty).toBe(c.certainty);
    }
  });

  it("never leaves the range of the bracketing samples (the monotonicity guarantee)", () => {
    for (const c of vectors.heightBetweenSamples) {
      const [lo, hi] = c.boundedBy;
      const got = heightAt(series, instant(c.at))!;
      expect(got.value, JSON.stringify(c)).toBeGreaterThanOrEqual(lo - TOL);
      expect(got.value, JSON.stringify(c)).toBeLessThanOrEqual(hi + TOL);
    }
  });

  it("returns null outside the loaded series", () => {
    for (const c of vectors.outOfRange) {
      expect(heightAt(series, instant(c.at)), JSON.stringify(c)).toBeNull();
    }
  });

  it("rateAt matches the independent centred difference", () => {
    for (const c of vectors.rateAt) {
      const got = rateAt(series, instant(c.at), millis(c.windowMs));
      expect(got, JSON.stringify(c)).not.toBeNull();
      expect(Math.abs(got!.value - c.expectedMPerHour), JSON.stringify(c)).toBeLessThan(TOL);
    }
  });
});
