import { describe, expect, it } from "vitest";

import { fixtureSeries } from "./test-support";
import { catchTideFillAt, seriesCoversAt } from "./catch-fill";

/**
 * The fixture-like series runs 2026-09-01T00:00Z for 13 hours: low 0.296 m at 01:02,
 * high 1.277 m at 07:00, low 0.433 m at 12:40 (all UTC), hourly interpolation between.
 */
const BASE_UTC = Date.UTC(2026, 8, 1, 0, 0, 0);
const series = fixtureSeries();

describe("catchTideFillAt (Historical spec §6: capture once, never recompute)", () => {
  it("reads a rising tide as flood, with signed positive rate", () => {
    // 05:00Z, mid-flood between the 01:02 low and the 07:00 high.
    const fill = catchTideFillAt(series, BASE_UTC + 300 * 60_000);
    expect(fill).not.toBeNull();
    expect(fill!.state).toBe("flood");
    expect(fill!.rateMPerHr).toBeGreaterThan(0);
    expect(fill!.heightM).toBeCloseTo(1.036, 3);
  });

  it("reads a falling tide as ebb, with signed negative rate", () => {
    // 11:00Z, mid-ebb toward the 12:40 low.
    const fill = catchTideFillAt(series, BASE_UTC + 660 * 60_000);
    expect(fill!.state).toBe("ebb");
    expect(fill!.rateMPerHr).toBeLessThan(0);
  });

  it("reads the turn as slack — and never calls it that without the measurement", () => {
    // Exactly the published high at 07:00: the rate is ~0 at the crest.
    const fill = catchTideFillAt(series, BASE_UTC + 420 * 60_000);
    expect(fill!.state).toBe("slack");
  });

  it("places the catch through its cycle and names the twelfths hour", () => {
    const fill = catchTideFillAt(series, BASE_UTC + 300 * 60_000);
    expect(fill!.pctThroughCycle).toBeGreaterThan(0);
    expect(fill!.pctThroughCycle).toBeLessThan(100);
    expect(fill!.twelfthsHour).toBeGreaterThanOrEqual(1);
    expect(fill!.twelfthsHour).toBeLessThanOrEqual(6);
  });

  it("carries the day's range so 'X of a Y-metre tide' is displayable", () => {
    const fill = catchTideFillAt(series, BASE_UTC + 300 * 60_000);
    expect(fill!.rangeM).toBeCloseTo(1.277 - 0.296, 2);
  });

  it("writes a 25-point ±3h curve at 15-minute steps when the window is fully covered", () => {
    const fill = catchTideFillAt(series, BASE_UTC + 390 * 60_000);
    expect(fill).not.toBeNull();
    expect(fill!.curve.length).toBe(25);
    expect(fill!.curve[0][0]).toBe(-180);
    expect(fill!.curve[12][0]).toBe(0);
    expect(fill!.curve[24][0]).toBe(180);
  });

  it("clips the curve at the series' ends instead of extrapolating", () => {
    // 01:00Z: the −3h side of the 15-minute grid reaches before the series starts.
    // The first grid point with data is −60 (abs minute 0, the first sample).
    const fill = catchTideFillAt(series, BASE_UTC + 60 * 60_000);
    expect(fill).not.toBeNull();
    expect(fill!.curve[0][0]).toBe(-60); // nothing before the first sample
    expect(fill!.curve.length).toBeLessThan(25);
  });

  it("answers null — pending — for a moment outside the cached window", () => {
    expect(catchTideFillAt(series, BASE_UTC + 4 * 24 * 3_600_000)).toBeNull();
    expect(catchTideFillAt(series, BASE_UTC - 3_600_000)).toBeNull();
  });

  it("answers null for a nonsense instant", () => {
    expect(catchTideFillAt(series, Number.NaN)).toBeNull();
  });

  it("does not claim interpolated numbers were published", () => {
    const fill = catchTideFillAt(series, BASE_UTC + 300 * 60_000);
    expect(fill!.certainty).toBe("interpolated");
  });
});

describe("seriesCovers", () => {
  it("agrees with the fill's pending boundary", () => {
    expect(seriesCoversAt(series, BASE_UTC + 300 * 60_000)).toBe(true);
    expect(seriesCoversAt(series, BASE_UTC + 4 * 24 * 3_600_000)).toBe(false);
  });
});
