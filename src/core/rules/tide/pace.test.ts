import { describe, expect, it } from "vitest";
import { metresPerHour } from "@/core/units";
import { paceAt } from "./pace";
import { fixtureSeries } from "./test-support";

describe("paceAt", () => {
  const series = fixtureSeries();
  const anyInstant = series.samples[0].at;

  it("is Sourced with certainty estimated and an honest basis", () => {
    const pace = paceAt(series, anyInstant, metresPerHour(0));
    expect(pace.certainty).toBe("estimated");
    expect(pace.basis.toLowerCase()).toContain("loaded prediction window");
    expect(pace.basis.toLowerCase()).not.toContain("climatology for this station");
  });

  it("ratio is ~1.0 exactly at the baseline median peak rate", () => {
    const baseline = paceAt(series, anyInstant, metresPerHour(0)).value.baseline.medianPeakRate;
    const pace = paceAt(series, anyInstant, baseline);
    expect(pace.value.ratio).toBeCloseTo(1, 5);
  });

  it("classifies a near-zero rate (a turn) as very-slow", () => {
    const pace = paceAt(series, anyInstant, metresPerHour(0));
    expect(pace.value.class).toBe("very-slow");
    expect(pace.value.percentile).toBeLessThan(10);
  });

  it("classifies the fastest observed rate as very-fast", () => {
    const baseline = paceAt(series, anyInstant, metresPerHour(0)).value.baseline;
    // Comfortably above the strongest leg's peak, i.e. above the whole distribution.
    const extreme = metresPerHour(baseline.medianPeakRate * 5 + 1);
    const pace = paceAt(series, anyInstant, extreme);
    expect(pace.value.class).toBe("very-fast");
    expect(pace.value.percentile).toBeGreaterThan(90);
  });

  it("exposes ratio and percentile on the type for finer-grained UI bucketing later", () => {
    const pace = paceAt(series, anyInstant, metresPerHour(0.2));
    expect(typeof pace.value.ratio).toBe("number");
    expect(typeof pace.value.percentile).toBe("number");
  });

  it("baseline.sampleCount describes the fixed-interval distribution, not the leg count", () => {
    const { baseline } = paceAt(series, anyInstant, metresPerHour(0)).value;
    // The test fixture spans ~13 hours across 2 legs, so legCount is tiny while the
    // 10-minute distribution over that span is an order of magnitude larger. A regression
    // that conflates the two (sampleCount === legCount) would fail this.
    expect(baseline.legCount).toBeGreaterThan(0);
    expect(baseline.legCount).toBeLessThan(20);
    expect(baseline.sampleCount).toBeGreaterThan(baseline.legCount * 10);
    expect(baseline.sampleInterval).toBe(10 * 60_000);
  });
});
