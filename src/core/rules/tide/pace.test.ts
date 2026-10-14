import { describe, expect, it } from "vitest";
import { metresPerHour } from "@/core/units";
import { instant, metres } from "@/core/units";
import { paceAt, PACE_BASELINE_HALF_SPAN } from "./pace";
import { tideSeries } from "./source";
import { FIXTURE_STATION, fixtureSeries } from "./test-support";

/** Turns-only semidiurnal series spanning `days`, like ADR 011's two-year hilo range. */
function longTurnsSeries(days: number) {
  const start = Date.UTC(2026, 0, 1);
  const step = 6.21 * 60 * 60_000;
  const samples = [];
  for (let i = 0, t = start; t <= start + days * 86_400_000; i++, t += step) {
    const high = i % 2 === 0;
    samples.push({ at: instant(t), height: metres(high ? 1.6 : 0.2), turn: high ? ("high" as const) : ("low" as const) });
  }
  return tideSeries({ station: FIXTURE_STATION, samples, provider: "fixture" });
}

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

  it("bounds the baseline to a one-week window however long the series is", () => {
    const long = longTurnsSeries(730);
    const mid = instant(Number(long.samples[0].at) + 365 * 86_400_000);
    const { baseline } = paceAt(long, mid, metresPerHour(0.1)).value;
    const weekSamples = (2 * PACE_BASELINE_HALF_SPAN) / baseline.sampleInterval + 1;
    expect(baseline.sampleCount).toBeLessThanOrEqual(weekSamples);
    expect(baseline.legCount).toBeLessThan(40);
  });

  it("keeps a full week of baseline at the series' first instant", () => {
    const long = longTurnsSeries(730);
    const { baseline } = paceAt(long, long.samples[0].at, metresPerHour(0.1)).value;
    expect(baseline.legCount).toBeGreaterThan(20);
  });
});
