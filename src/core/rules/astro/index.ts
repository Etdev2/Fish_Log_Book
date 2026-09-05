/**
 * The astro half of the tide engine (ADR 006 §2). Sun events, daylight shading, moon phase.
 *
 * This barrel is the only path anything outside `src/core/rules/astro/` may import.
 *
 * What these numbers can and cannot tell an angler is written up in plain English in
 * `docs/analysis/sun-and-moon.md`. `ux-ui` writes the on-screen copy from that file, not
 * from this one.
 */
export type { DaylightPhase, DaylightSpan, GeoPoint, MoonPhase, SunEvents } from "./types";
export { daylightSpans, sunEventsFor } from "./sun";
export { moonPhaseAt, moonReading, phaseName } from "./moon";
