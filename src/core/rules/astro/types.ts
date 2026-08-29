/**
 * The public shapes of the astro engine, fixed by ADR 006 §2. Re-exported from `./index`,
 * which is the only path anything outside this folder may import.
 *
 * They live in their own module so `sun.ts` and `moon.ts` can name them without importing
 * the barrel that imports them back.
 */
import type { Degrees, Instant } from "@/core/units";

export interface GeoPoint {
  readonly latitude: Degrees;
  readonly longitude: Degrees;
}

export type DaylightPhase = "night" | "civil-twilight" | "day";

export interface DaylightSpan {
  readonly from: Instant;
  readonly to: Instant;
  readonly phase: DaylightPhase;
}

export interface SunEvents {
  readonly sunrise: Instant | null;
  readonly sunset: Instant | null;
  readonly civilDawn: Instant | null;
  readonly civilDusk: Instant | null;
  readonly solarNoon: Instant;
}

export interface MoonPhase {
  /** Fraction of the moon's disc lit as seen from Earth, 0..1. */
  readonly illumination: number;
  /** Days elapsed since the preceding new moon. See `moon.ts` on the upper bound. */
  readonly ageDays: number;
  readonly name:
    | "new"
    | "waxing-crescent"
    | "first-quarter"
    | "waxing-gibbous"
    | "full"
    | "waning-gibbous"
    | "last-quarter"
    | "waning-crescent";
}
