/**
 * Solar position, the NOAA way.
 *
 * This is the algorithm published as NOAA's Solar Calculator spreadsheet (Global Monitoring
 * Laboratory, gml.noaa.gov/grad/solcalc/), which is itself the low-precision solar theory
 * from Jean Meeus, *Astronomical Algorithms* (2nd ed., 1998), chapters 22, 25 and 28. It is
 * implemented here directly rather than pulled from a package because ADR 003 §3 makes
 * `core/rules/` written-once code that a future Swift client reimplements from the published
 * vectors in `src/core/rules/vectors/`. A JavaScript dependency cannot cross that boundary.
 *
 * ## Accuracy, stated rather than assumed
 *
 * Measured, not hoped for. Checked against 514 sun events published by the U.S. Naval
 * Observatory across 108 location-days: ten places from Singapore to Tromso (69.6 N), on
 * dates from 1905 to 2050. Worst disagreement was 34 seconds. The USNO publishes to the
 * whole minute, so up to 30 of those seconds are its own rounding; the genuine disagreement
 * is under 4 seconds everywhere in that sample.
 *
 * Take the working figure as better than a minute, over 1900-2100. That is far more than a
 * fishing app needs. The question this answers is "does that tide turn fall in daylight",
 * and a minute of slop never changes the answer.
 *
 * Beyond about 65 degrees of latitude the event *times* degrade: the sun meets the horizon
 * at a very shallow angle there, so a small altitude error becomes a large time error, and
 * NOAA itself warns the spreadsheet may be several minutes out. The *presence or absence*
 * of a sunrise stays reliable, which is the part that matters for shading a chart, and the
 * polar vectors check it.
 *
 * Three deliberate simplifications, all standard for this algorithm:
 * - Terrestrial Time (TT) is approximated by UT. The two differ by about 69 seconds in
 *   2026, which moves the sun about 0.0008 degrees and event times by well under a second.
 * - Refraction is handled by convention, not by modelling: the horizon crossing is taken at
 *   a geometric altitude of -0.833 degrees (34' of mean atmospheric refraction plus 16' of
 *   solar semidiameter). Real refraction varies with temperature and pressure; on a cold,
 *   high-pressure morning the true sunrise can be a minute or two earlier than we say.
 * - Observer elevation is ignored. Sea level is the right assumption for a fishing app.
 *
 * No `Date`, no `Intl`, no timezone. Everything is UTC epoch-milliseconds (ADR 006 §3).
 */

const DEG = Math.PI / 180;

export const MS_PER_DAY = 86_400_000;
export const MS_PER_MINUTE = 60_000;

/** Julian Day number of the Unix epoch, 1970-01-01T00:00:00Z. */
const JULIAN_DAY_AT_UNIX_EPOCH = 2_440_587.5;
/** Julian Day number of J2000.0, 2000-01-01T12:00:00 TT. */
const JULIAN_DAY_AT_J2000 = 2_451_545.0;

/**
 * Geometric altitude of the sun's upper limb at the conventional horizon crossing:
 * 34 arcminutes of mean refraction plus 16 arcminutes of solar semidiameter.
 */
export const SUNRISE_ALTITUDE_DEG = -0.833;
/** Civil twilight, by international convention: sun centre 6 degrees below the horizon. */
export const CIVIL_TWILIGHT_ALTITUDE_DEG = -6;

export function norm360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/** Julian centuries since J2000.0. */
export function julianCentury(atMs: number): number {
  return (atMs / MS_PER_DAY + JULIAN_DAY_AT_UNIX_EPOCH - JULIAN_DAY_AT_J2000) / 36525;
}

export interface SolarPosition {
  /** Apparent declination of the sun, degrees. */
  readonly declinationDeg: number;
  /** Equation of time (apparent solar time minus mean solar time), minutes. */
  readonly equationOfTimeMin: number;
}

/** NOAA Solar Calculator, columns T through V. */
export function solarPosition(atMs: number): SolarPosition {
  const t = julianCentury(atMs);

  // Geometric mean longitude and mean anomaly of the sun.
  const meanLongDeg = norm360(280.46646 + t * (36000.76983 + t * 0.0003032));
  const meanAnomDeg = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const meanAnomRad = meanAnomDeg * DEG;

  // Eccentricity of Earth's orbit.
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  // Equation of the centre: the correction from mean to true anomaly.
  const centreDeg =
    Math.sin(meanAnomRad) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * meanAnomRad) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * meanAnomRad) * 0.000289;

  const trueLongDeg = meanLongDeg + centreDeg;

  // Nutation and aberration, to the precision this algorithm carries.
  const omegaRad = (125.04 - 1934.136 * t) * DEG;
  const apparentLongDeg = trueLongDeg - 0.00569 - 0.00478 * Math.sin(omegaRad);

  const meanObliqDeg = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliqCorrDeg = meanObliqDeg + 0.00256 * Math.cos(omegaRad);

  const declinationDeg =
    Math.asin(Math.sin(obliqCorrDeg * DEG) * Math.sin(apparentLongDeg * DEG)) / DEG;

  const y = Math.tan((obliqCorrDeg / 2) * DEG) ** 2;
  const equationOfTimeMin =
    4 *
    (y * Math.sin(2 * meanLongDeg * DEG) -
      2 * eccentricity * Math.sin(meanAnomRad) +
      4 * eccentricity * y * Math.sin(meanAnomRad) * Math.cos(2 * meanLongDeg * DEG) -
      0.5 * y * y * Math.sin(4 * meanLongDeg * DEG) -
      1.25 * eccentricity * eccentricity * Math.sin(2 * meanAnomRad)) /
    DEG;

  return { declinationDeg, equationOfTimeMin };
}

/**
 * Geometric altitude of the sun above the horizon, degrees, at a UTC instant.
 *
 * "Geometric" means unrefracted, which is the right pairing for the -0.833 and -6 degree
 * thresholds above: those constants already contain the refraction assumption.
 */
export function solarAltitudeDeg(atMs: number, latDeg: number, lonDeg: number): number {
  const { declinationDeg, equationOfTimeMin } = solarPosition(atMs);

  const utcMinutesOfDay = (((atMs % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY) / MS_PER_MINUTE;
  const trueSolarTimeMin = utcMinutesOfDay + equationOfTimeMin + 4 * lonDeg;
  // Hour angle: 0 at local apparent noon, +/-180 at local apparent midnight.
  const hourAngleDeg = ((((trueSolarTimeMin / 4 - 180) % 360) + 540) % 360) - 180;

  const cosZenith =
    Math.sin(latDeg * DEG) * Math.sin(declinationDeg * DEG) +
    Math.cos(latDeg * DEG) * Math.cos(declinationDeg * DEG) * Math.cos(hourAngleDeg * DEG);

  return 90 - Math.acos(Math.min(1, Math.max(-1, cosZenith))) / DEG;
}

export type HourAngleResult =
  | { readonly kind: "crosses"; readonly hourAngleDeg: number }
  /** The sun never gets that low on this day — midnight sun, for the -0.833 threshold. */
  | { readonly kind: "always-above" }
  /** The sun never gets that high on this day — polar night, for the -0.833 threshold. */
  | { readonly kind: "always-below" };

/**
 * Half the length of the sun's day arc above `altitudeDeg`, as an hour angle in degrees.
 *
 * Returns a discriminated result rather than null so callers can tell "the sun is up all
 * day" apart from "the sun never rises". Reporting a plausible-looking timestamp for either
 * would be worse than reporting nothing, which is why `SunEvents` allows null.
 */
export function hourAngleFor(
  altitudeDeg: number,
  latDeg: number,
  declDeg: number,
): HourAngleResult {
  const denom = Math.cos(latDeg * DEG) * Math.cos(declDeg * DEG);

  // At (or within a hair of) a pole the day arc is degenerate: the sun sits at a nearly
  // constant altitude equal to its declination and simply does not cross anything today.
  if (Math.abs(denom) < 1e-9) {
    const poleAltitude = latDeg >= 0 ? declDeg : -declDeg;
    return poleAltitude > altitudeDeg ? { kind: "always-above" } : { kind: "always-below" };
  }

  const cosH =
    (Math.sin(altitudeDeg * DEG) - Math.sin(latDeg * DEG) * Math.sin(declDeg * DEG)) / denom;

  if (cosH > 1) return { kind: "always-below" };
  if (cosH < -1) return { kind: "always-above" };
  return { kind: "crosses", hourAngleDeg: Math.acos(cosH) / DEG };
}

/**
 * UTC midnight of the *local mean solar day* containing `atMs` at this longitude.
 *
 * `core/` has no timezone database (ADR 006 §3), so "which day is it" is answered by
 * longitude rather than by a civil time zone: the day boundary is local mean solar
 * midnight. For anywhere with a sane time zone the two agree, and for a sun calculation
 * the solar day is the more meaningful one anyway. It also means daylight saving cannot
 * affect this engine at all — there is no local clock here to spring forward.
 */
export function localSolarDayStartUtcMs(atMs: number, lonDeg: number): number {
  const shifted = atMs + lonDeg * 4 * MS_PER_MINUTE;
  return Math.floor(shifted / MS_PER_DAY) * MS_PER_DAY;
}

/** Local apparent noon (sun on the meridian) for the local solar day starting at `dayStartUtcMs`. */
export function solarNoonUtcMs(dayStartUtcMs: number, lonDeg: number): number {
  let t = dayStartUtcMs + (720 - 4 * lonDeg) * MS_PER_MINUTE;
  for (let i = 0; i < 2; i++) {
    const { equationOfTimeMin } = solarPosition(t);
    t = dayStartUtcMs + (720 - 4 * lonDeg - equationOfTimeMin) * MS_PER_MINUTE;
  }
  return t;
}

/** +1 for a morning crossing (rise, dawn), -1 for an evening one (set, dusk). */
export type CrossingDirection = 1 | -1;

export type CrossingResult =
  | { readonly kind: "crosses"; readonly atMs: number }
  | { readonly kind: "always-above" }
  | { readonly kind: "always-below" };

/**
 * When the sun crosses `altitudeDeg` on the local solar day starting at `dayStartUtcMs`.
 *
 * Three passes: guess at solar noon, then re-evaluate the sun's declination and the
 * equation of time at the estimated crossing and solve again. The third pass moves the
 * answer by well under a second at temperate latitudes.
 */
export function crossingUtcMs(
  dayStartUtcMs: number,
  latDeg: number,
  lonDeg: number,
  altitudeDeg: number,
  direction: CrossingDirection,
): CrossingResult {
  let t = solarNoonUtcMs(dayStartUtcMs, lonDeg);
  for (let i = 0; i < 3; i++) {
    const { declinationDeg, equationOfTimeMin } = solarPosition(t);
    const ha = hourAngleFor(altitudeDeg, latDeg, declinationDeg);
    if (ha.kind !== "crosses") return ha;
    t =
      dayStartUtcMs +
      (720 - 4 * (lonDeg + direction * ha.hourAngleDeg) - equationOfTimeMin) * MS_PER_MINUTE;
  }
  return { kind: "crosses", atMs: Math.round(t) };
}
