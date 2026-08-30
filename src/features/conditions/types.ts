/**
 * View-only types for the conditions feature (ADR 006 §1).
 *
 * The astro seam this file used to stub (`DaylightSpan`, `SunEvents`, `MoonPhase`) is now
 * real: `@/core/rules/astro` merged (biostat/astro-rules), so `tide-chart.tsx` imports
 * those shapes from there directly. `MoonPhaseName` is kept here as a named alias for the
 * inline union on `MoonPhase["name"]`, since `format.ts`'s label map needs a type to key on.
 */
import type { MoonPhase } from "@/core/rules/astro";

export type MoonPhaseName = MoonPhase["name"];
