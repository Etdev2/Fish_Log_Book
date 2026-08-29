/**
 * View-only types for the conditions feature (ADR 006 §1).
 *
 * `DaylightSpan`, `SunEvents` and `MoonPhase` mirror the SHAPE that
 * `src/core/rules/astro/index.ts` will export (ADR 006 §2) — that module is being written
 * on another branch and is not importable from here yet. Components in this feature take
 * these types as props so they compile and render today against `astro-fixture.ts`'s
 * placeholder values; when the real module merges, only the caller that currently reads
 * `astro-fixture.ts` needs to change to read `@/core/rules/astro` instead. Do not import
 * from `src/core/rules/astro` — see the worklog for this branch.
 */
import type { Instant } from "@/core/units";

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

export type MoonPhaseName =
  | "new"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent";

export interface MoonPhase {
  /** 0..1 */
  readonly illumination: number;
  /** 0..29.53 */
  readonly ageDays: number;
  readonly name: MoonPhaseName;
}
