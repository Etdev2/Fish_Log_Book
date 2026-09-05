/**
 * Moon phase: illumination, age, and a name.
 *
 * Computed locally rather than bought. The periodic terms are the low-precision lunar phase
 * angle from Jean Meeus, *Astronomical Algorithms* (2nd ed., 1998), chapter 48 equation 48.4,
 * with the lunar and solar mean arguments from chapter 47. Implemented directly rather than
 * pulled from a package, for the ADR 003 §3 reason: `core/rules/` is written once and a
 * future Swift client reimplements it from `src/core/rules/vectors/astro.json`.
 *
 * ## Accuracy, stated rather than assumed
 *
 * Measured against the U.S. Naval Observatory's tabulated phase instants for 2000, 2026 and
 * 2050 - 148 of them. Illuminated fraction is out by at most 0.0034, a third of a percentage
 * point. The instant of new moon is recovered to within 30 minutes, so `ageDays` is good to
 * about 0.02 days. All 148 tabulated quarter instants fall inside the matching quarter-name
 * window defined below.
 *
 * Two things this deliberately does not model:
 * - The moon's ecliptic latitude. Equation 48.4 works from the difference in ecliptic
 *   *longitude*, so at a new moon it reports the disc as exactly 0.000 lit, whereas the true
 *   figure is a few thousandths because the moon usually passes above or below the sun
 *   rather than across it. This is below the resolution of any sentence a UI would write.
 * - Topocentric parallax. We report the geocentric phase. An observer on the surface sees a
 *   phase angle differing by up to about a degree; the effect on illumination is under 0.01.
 */
import { julianCentury, norm360 } from "./solar";
import type { Instant } from "@/core/units";
import type { MoonPhase } from "./types";

const DEG = Math.PI / 180;
const MS_PER_DAY = 86_400_000;

/** Mean synodic month, days. The average new-moon-to-new-moon interval. */
export const MEAN_SYNODIC_MONTH_DAYS = 29.530588853;

const MEAN_PHASE_RATE_DEG_PER_DAY = 360 / MEAN_SYNODIC_MONTH_DAYS;

/**
 * Position in the lunation, degrees: 0 at new moon, 90 at first quarter, 180 at full,
 * 270 at last quarter. This is the sun-moon elongation in ecliptic longitude, corrected.
 */
function lunationAngleDeg(atMs: number): number {
  const t = julianCentury(atMs);

  // Mean elongation of the moon from the sun (Meeus 47.2).
  const d =
    297.8501921 +
    445267.1114034 * t -
    0.0018819 * t * t +
    (t * t * t) / 545868 -
    (t * t * t * t) / 113065000;
  // Sun's mean anomaly (47.3).
  const m = 357.5291092 + 35999.0502909 * t - 0.0001536 * t * t + (t * t * t) / 24490000;
  // Moon's mean anomaly (47.4).
  const mp =
    134.9633964 +
    477198.8675055 * t +
    0.0087414 * t * t +
    (t * t * t) / 69699 -
    (t * t * t * t) / 14712000;

  const dR = d * DEG;
  const mR = m * DEG;
  const mpR = mp * DEG;

  // Meeus 48.4 gives the phase angle i = 180 - D - (these terms). We want the elongation,
  // which is 180 - i, so the same terms enter with the opposite sign.
  const corrections =
    6.289 * Math.sin(mpR) -
    2.1 * Math.sin(mR) +
    1.274 * Math.sin(2 * dR - mpR) +
    0.658 * Math.sin(2 * dR) +
    0.214 * Math.sin(2 * mpR) +
    0.11 * Math.sin(dR);

  return norm360(d + corrections);
}

/** The same angle mapped to (-180, 180], so it can be driven to zero at a new moon. */
function signedLunationAngleDeg(atMs: number): number {
  const a = lunationAngleDeg(atMs);
  return a > 180 ? a - 360 : a;
}

/**
 * Instant of the new moon that precedes `atMs`.
 *
 * Secant-style iteration: step back by the current lunation angle divided by the mean rate,
 * then correct. The true rate varies by about +/-15% across a lunation, so each pass cuts
 * the error by roughly that factor; five passes take a first guess that can be most of a day
 * out down to well under a minute.
 */
function precedingNewMoonMs(atMs: number): number {
  let t = atMs - (lunationAngleDeg(atMs) / MEAN_PHASE_RATE_DEG_PER_DAY) * MS_PER_DAY;
  for (let i = 0; i < 5; i++) {
    t -= (signedLunationAngleDeg(t) / MEAN_PHASE_RATE_DEG_PER_DAY) * MS_PER_DAY;
  }
  return t;
}

/**
 * The eight phase names, as equal eighths of the lunation angle.
 *
 * **This is a convention, and an arbitrary one — say so in the UI.** "New moon", "first
 * quarter", "full moon" and "last quarter" are strictly *instants*, not stretches of time:
 * the moon is exactly full for no longer than it is exactly noon. Almanacs, including the
 * USNO's, reserve those four words for the instant and call everything else crescent or
 * gibbous.
 *
 * A chart needs a word for every moment, so we widen each of the four instants into a
 * window and split the lunation into eight equal 45-degree slices, each quarter name
 * centred on its true instant:
 *
 *     new              337.5 - 22.5      about 3.7 days wide, +/- 1.8 days from the instant
 *     waxing-crescent   22.5 - 67.5
 *     first-quarter     67.5 - 112.5     illumination roughly 31% to 69%
 *     waxing-gibbous   112.5 - 157.5
 *     full             157.5 - 202.5     about 3.7 days wide
 *     waning-gibbous   202.5 - 247.5
 *     last-quarter     247.5 - 292.5
 *     waning-crescent  292.5 - 337.5
 *
 * The slices are on the lunation *angle*, not on age in days, so the name maps predictably
 * onto what the moon looks like: illumination is a function of that angle.
 *
 * The cost is real and the UI must not hide it. This calls the moon "full" for nearly four
 * days, including two days either side when it is visibly not full. `illumination` is the
 * honest number and should be shown next to the name — never the name alone.
 *
 * Boundaries are half-open: a value exactly on 22.5 is `waxing-crescent`, not `new`.
 */
export function phaseName(lunationDeg: number): MoonPhase["name"] {
  const shifted = norm360(lunationDeg + 22.5);
  const eighth = Math.floor(shifted / 45) % 8;
  return (
    [
      "new",
      "waxing-crescent",
      "first-quarter",
      "waxing-gibbous",
      "full",
      "waning-gibbous",
      "last-quarter",
      "waning-crescent",
    ] as const
  )[eighth];
}

/**
 * Illumination, age and phase name at a UTC instant. No location: the phase of the moon is
 * very nearly the same for everyone on Earth, which is exactly why we do not pay for it.
 *
 * `ageDays` is the time actually elapsed since the preceding new moon. Note that it can
 * read slightly above the 29.53-day mean quoted in the interface: real lunations run
 * anywhere from 29.27 to 29.83 days, and clamping the number to the mean would be a
 * fabrication. Treat 0..29.9 as the true range.
 */
/**
 * The two raw lunar numbers a catch stores, from a moment in time.
 *
 * One definition, because two callers need it and they must not drift: the snapshot
 * writes these at log time, and the record screen computes the same pair for older
 * catches whose snapshot predates the app storing them. Both must produce the same
 * answer for the same instant — which they do, because the moon's phase depends on
 * nothing but when.
 *
 * Phase angle is the correlate; illumination is for display (ontology §3). Age in days
 * maps onto the synodic month, 29.53 days over 360°.
 */
export function moonReading(atMs: number): {
  readonly phaseAngleDeg: number;
  readonly illuminationFraction: number;
} {
  const moon = moonPhaseAt(atMs as Instant);
  return {
    phaseAngleDeg: Math.round((moon.ageDays / MEAN_SYNODIC_MONTH_DAYS) * 360 * 1000) / 1000,
    illuminationFraction: Math.round(moon.illumination * 10_000) / 10_000,
  };
}

export function moonPhaseAt(at: Instant): MoonPhase {
  const atMs: number = at;
  const lunationDeg = lunationAngleDeg(atMs);

  // i is the phase angle sun-moon-Earth; illumination is (1 + cos i) / 2 (Meeus 48.1).
  // i = 180 - lunation angle, so cos i = -cos(lunation), giving (1 - cos(lunation)) / 2.
  const illumination = Math.min(1, Math.max(0, (1 - Math.cos(lunationDeg * DEG)) / 2));

  let ageDays = (atMs - precedingNewMoonMs(atMs)) / MS_PER_DAY;
  // Within seconds of a new moon the iteration can land a hair past `at`; the preceding new
  // moon is then a whole lunation earlier.
  if (ageDays < 0) ageDays += MEAN_SYNODIC_MONTH_DAYS;

  return { illumination, ageDays, name: phaseName(lunationDeg) };
}
