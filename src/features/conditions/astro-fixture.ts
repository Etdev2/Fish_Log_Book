/**
 * Placeholder sun/moon data behind the seam described in `types.ts`.
 *
 * `src/core/rules/astro/**` (biostat's lane) is not in this branch yet. Everything here is
 * a hand-authored stand-in scoped to the tide fixture's window (Newport Beach, CA, Aug 31
 * – Sep 3 2026) so the day/night shading and moon components have something real to render
 * and can be checked for contrast and layout today. None of this is an astronomical
 * calculation to be trusted — when `@/core/rules/astro` merges, this file is deleted and
 * its two callers in `tide-chart.tsx` switch to `sunEventsFor` / `daylightSpans` /
 * `moonPhaseAt` instead. Nothing else about the seam changes.
 */
import { instant } from "@/core/units";
import type { DaylightPhase, DaylightSpan, MoonPhase, MoonPhaseName } from "./types";

const PACIFIC_UTC_OFFSET_HOURS = -7; // PDT. Fixture window never crosses the DST boundary.

/** UTC instant for a Pacific-local wall-clock time on the given (UTC) calendar date. */
function localInstant(year: number, monthIndex: number, day: number, hour: number, minute: number) {
  return instant(Date.UTC(year, monthIndex, day, hour - PACIFIC_UTC_OFFSET_HOURS, minute));
}

// Flat, approximate early-September Newport Beach times (33.6°N) for every day the
// fixture touches. A real implementation varies these minute-by-minute per day; this
// fixture does not need to, since it exists only to prove the shading/legend render.
const CIVIL_DAWN = { hour: 6, minute: 7 };
const SUNRISE = { hour: 6, minute: 33 };
const SUNSET = { hour: 19, minute: 16 };
const CIVIL_DUSK = { hour: 19, minute: 42 };

interface Boundary {
  readonly at: number;
  readonly phaseAfter: DaylightPhase;
}

function boundariesForDay(year: number, monthIndex: number, day: number): Boundary[] {
  return [
    { at: localInstant(year, monthIndex, day, CIVIL_DAWN.hour, CIVIL_DAWN.minute), phaseAfter: "civil-twilight" },
    { at: localInstant(year, monthIndex, day, SUNRISE.hour, SUNRISE.minute), phaseAfter: "day" },
    { at: localInstant(year, monthIndex, day, SUNSET.hour, SUNSET.minute), phaseAfter: "civil-twilight" },
    { at: localInstant(year, monthIndex, day, CIVIL_DUSK.hour, CIVIL_DUSK.minute), phaseAfter: "night" },
  ];
}

/**
 * Fixture stand-in for `daylightSpans(from, to, where)`: sorted, contiguous, gap-free
 * spans covering `[from, to]`, per the interface ADR 006 §2 fixes. `where` is accepted for
 * signature parity with the future real function but unused — this fixture is hardcoded
 * to one location.
 */
export function daylightSpansFixture(from: number, to: number): readonly DaylightSpan[] {
  // One day of padding either side covers any `[from, to]` this app requests without
  // walking off the array of hardcoded days.
  const start = new Date(from);
  const boundaries: Boundary[] = [];
  for (let offset = -1; offset <= 4; offset++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + offset));
    boundaries.push(...boundariesForDay(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  boundaries.sort((a, b) => a.at - b.at);

  const spans: DaylightSpan[] = [];
  let phase: DaylightPhase = "night"; // true before the first civil dawn in the padded range
  let cursor = boundaries[0]?.at ?? from;
  for (const boundary of boundaries) {
    if (boundary.at > cursor) {
      const spanFrom = Math.max(cursor, from);
      const spanTo = Math.min(boundary.at, to);
      if (spanFrom < spanTo) spans.push({ from: instant(spanFrom), to: instant(spanTo), phase });
    }
    phase = boundary.phaseAfter;
    cursor = boundary.at;
  }
  if (cursor < to) {
    const spanFrom = Math.max(cursor, from);
    if (spanFrom < to) spans.push({ from: instant(spanFrom), to: instant(to), phase });
  }
  return spans;
}

const REFERENCE_NEW_MOON_UTC = Date.UTC(2026, 7, 12, 15, 37); // a real new-moon instant, for shape only
const SYNODIC_MONTH_DAYS = 29.530588853;

function moonPhaseName(ageDays: number): MoonPhaseName {
  const fraction = ageDays / SYNODIC_MONTH_DAYS;
  if (fraction < 0.03 || fraction > 0.97) return "new";
  if (fraction < 0.22) return "waxing-crescent";
  if (fraction < 0.28) return "first-quarter";
  if (fraction < 0.47) return "waxing-gibbous";
  if (fraction < 0.53) return "full";
  if (fraction < 0.72) return "waning-gibbous";
  if (fraction < 0.78) return "last-quarter";
  return "waning-crescent";
}

/** Fixture stand-in for `moonPhaseAt(at)`. A real synodic-month approximation, not a claim of precision. */
export function moonPhaseFixture(at: number): MoonPhase {
  const daysSinceReference = (at - REFERENCE_NEW_MOON_UTC) / 86_400_000;
  const ageDays = ((daysSinceReference % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const illumination = (1 - Math.cos((2 * Math.PI * ageDays) / SYNODIC_MONTH_DAYS)) / 2;
  return { illumination, ageDays, name: moonPhaseName(ageDays) };
}
