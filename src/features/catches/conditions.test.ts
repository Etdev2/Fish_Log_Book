import { describe, expect, it } from "vitest";

import { moonReading } from "@/core/rules/astro";

import { buildCatchSnapshot } from "./conditions";

/**
 * The moon does not need a position (founder report, 2026-09-04). These pin that, because
 * the bug they hit was a deliberate-looking `null` that a future tidy-up could reinstate.
 */
const AT = "2026-09-04T18:30:00.000Z";

const input = (lat: number | null, lng: number | null) => ({
  catchId: "catch-1",
  tripId: "trip-1",
  observedAt: AT,
  waterClass: "salt" as const,
  lat,
  lng,
  manualEnvironment: null,
});

describe("lunar data on a catch", () => {
  it("computes the moon with no GPS fix — its phase is the same everywhere on Earth", () => {
    const snapshot = buildCatchSnapshot(input(null, null), "live");
    expect(snapshot.moon_phase_angle_deg).not.toBeNull();
    expect(snapshot.moon_illumination_fraction).not.toBeNull();
  });

  it("still skips the sun without a fix — that one genuinely needs a position", () => {
    const snapshot = buildCatchSnapshot(input(null, null), "live");
    expect(snapshot.sunrise_utc).toBeNull();
    expect(snapshot.sunset_utc).toBeNull();
  });

  it("gives the same moon with or without a fix, for the same moment", () => {
    const withFix = buildCatchSnapshot(input(33.6, -118.0), "live");
    const without = buildCatchSnapshot(input(null, null), "live");
    expect(without.moon_illumination_fraction).toBe(withFix.moon_illumination_fraction);
    expect(without.moon_phase_angle_deg).toBe(withFix.moon_phase_angle_deg);
  });

  it("says in the provenance that the moon was computed and the sun was not", () => {
    const snapshot = buildCatchSnapshot(input(null, null), "live");
    expect(JSON.stringify(snapshot.provenance)).toContain("moon computed on device");
  });

  it("leaves the moon null when the timestamp itself is unusable", () => {
    const snapshot = buildCatchSnapshot(
      { ...input(null, null), observedAt: "not-a-date" },
      "live",
    );
    expect(snapshot.moon_illumination_fraction).toBeNull();
  });

  it("reports illumination as a fraction and the angle in degrees", () => {
    const snapshot = buildCatchSnapshot(input(33.6, -118.0), "live");
    expect(snapshot.moon_illumination_fraction).toBeGreaterThanOrEqual(0);
    expect(snapshot.moon_illumination_fraction).toBeLessThanOrEqual(1);
    expect(snapshot.moon_phase_angle_deg).toBeGreaterThanOrEqual(0);
    expect(snapshot.moon_phase_angle_deg).toBeLessThan(361);
  });
});

describe("the moon on an older catch", () => {
  /**
   * Founder request, 2026-09-04: a past record showed no lunar data at all. Catches logged
   * before the app stored the moon — and every catch logged without a fix, back when sun
   * and moon were skipped together — carry nulls that no enrichment pass will ever fill.
   *
   * They do not need one. The moon is a function of the instant, so the reading computed
   * at view time is the same number that would have been written at log time. These pin
   * that equivalence, because it is the whole justification for computing it late.
   */
  it("computes the same reading now as the snapshot would have stored then", () => {
    const snapshot = buildCatchSnapshot(input(33.6, -118.0), "live");
    const late = moonReading(Date.parse(AT));

    expect(late.phaseAngleDeg).toBe(snapshot.moon_phase_angle_deg);
    expect(late.illuminationFraction).toBe(snapshot.moon_illumination_fraction);
  });

  it("is identical for a backfilled catch and a live one at the same moment", () => {
    const live = buildCatchSnapshot(input(null, null), "live");
    const backfilled = buildCatchSnapshot(input(null, null), "backfill");
    expect(backfilled.moon_illumination_fraction).toBe(live.moon_illumination_fraction);
  });

  it("moves across a month, so it is a real reading and not a constant", () => {
    const readings = ["2026-09-02", "2026-09-09", "2026-09-16", "2026-09-23"].map(
      (d) => moonReading(Date.parse(`${d}T18:00:00.000Z`)).illuminationFraction,
    );
    expect(new Set(readings).size).toBe(readings.length);
  });
});
