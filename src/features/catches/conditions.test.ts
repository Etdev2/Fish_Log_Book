import { describe, expect, it } from "vitest";

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
