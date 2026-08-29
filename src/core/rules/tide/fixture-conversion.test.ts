import { describe, expect, it } from "vitest";
import { instant } from "@/core/units";
import { tideSeries } from "./source";
import { convertFixturePoints, FIXTURE_STATION } from "./test-support";

describe("wire fixture conversion", () => {
  it("converts fixture-shaped points (mm -> Metres, minute offsets -> Instant) cleanly into a validated series", () => {
    const base = Date.UTC(2026, 8, 1);
    const samples = convertFixturePoints();

    // mm -> Metres
    expect(samples[0].height).toBeCloseTo(0.376, 6);
    // minute offsets -> Instant, relative to the base instant
    expect(samples[0].at).toBe(instant(base));
    expect(samples[1].at).toBe(instant(base + 62 * 60_000));

    const series = tideSeries({ station: FIXTURE_STATION, samples, provider: "fixture" });
    expect(series.samples).toHaveLength(samples.length);
    expect(series.provider).toBe("fixture");
  });
});
