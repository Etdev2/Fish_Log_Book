/**
 * Test-only fixture data, shaped exactly like `features/conditions/tide-fixture.ts`
 * (`[minutesFromBase, millimetres, "" | "H" | "L"]`, hourly samples plus exact turning
 * points) but NOT imported from it: `src/core/**` may not import `@/features/*` (the
 * ESLint tripwire in `eslint.config.mjs`, ADR 003 §6) even in a test file, so this is the
 * same shape of wire data duplicated for `core/rules/tide/` tests to convert.
 */
import { instant, metresFromMillimetres, millisFromMinutes } from "@/core/units";
import { tideSeries, type TidePredictionSample, type TideStation } from "./source";

const TEST_BASE_UTC = Date.UTC(2026, 8, 1, 0, 0, 0);

/** Same tuple shape and a representative slice of real values as the NOAA fixture. */
const FIXTURE_LIKE_POINTS: readonly (readonly [number, number, "" | "H" | "L"])[] = [
  [0, 376, ""],
  [62, 296, "L"],
  [120, 362, ""],
  [180, 545, ""],
  [240, 793, ""],
  [300, 1036, ""],
  [360, 1213, ""],
  [420, 1277, "H"],
  [480, 1215, ""],
  [540, 1045, ""],
  [600, 819, ""],
  [660, 603, ""],
  [720, 462, ""],
  [760, 433, "L"],
  [780, 441, ""],
];

export const FIXTURE_STATION: TideStation = {
  id: "9410580",
  name: "Newport Bay Entrance",
  timeZone: "America/Los_Angeles",
  datum: "MLLW",
};

export function fixtureLikePoints() {
  return FIXTURE_LIKE_POINTS;
}

export function convertFixturePoints(
  points: readonly (readonly [number, number, "" | "H" | "L"])[] = FIXTURE_LIKE_POINTS,
): TidePredictionSample[] {
  return points.map(([minutes, mm, mark]) => ({
    at: instant(TEST_BASE_UTC + millisFromMinutes(minutes)),
    height: metresFromMillimetres(mm),
    turn: mark === "H" ? "high" : mark === "L" ? "low" : null,
  }));
}

export function fixtureSeries() {
  return tideSeries({
    station: FIXTURE_STATION,
    samples: convertFixturePoints(),
    provider: "fixture",
    retrievedAt: null,
  });
}
