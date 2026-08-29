/**
 * Sun events and daylight shading.
 *
 * Accuracy, thresholds and the simplifications behind them are documented in `./solar.ts`.
 * Short version: sun event times land within about a minute of the U.S. Naval Observatory
 * inside roughly +/-65 degrees of latitude, which is ample for answering "was that tide
 * turn in daylight".
 */
import {
  CIVIL_TWILIGHT_ALTITUDE_DEG,
  SUNRISE_ALTITUDE_DEG,
  crossingUtcMs,
  localSolarDayStartUtcMs,
  solarAltitudeDeg,
  solarNoonUtcMs,
} from "./solar";
import { instant, type Instant } from "@/core/units";
import type { DaylightPhase, DaylightSpan, GeoPoint, SunEvents } from "./types";

/**
 * Sunrise, sunset, civil dawn, civil dusk and solar noon for the local solar day
 * containing `at`.
 *
 * "The local solar day" is bounded by local mean solar midnight at this longitude, not by a
 * civil calendar date — `core/` has no timezone database (ADR 006 §3). Anywhere with a
 * sensible time zone the two agree; the ordering dawn -> sunrise -> noon -> sunset -> dusk
 * always holds within one solar day, which is what callers actually rely on.
 *
 * Any of the four horizon events is `null` when the sun does not cross that altitude on
 * this day: polar night, midnight sun, or continuous twilight. That is why the type allows
 * null. Returning a plausible-looking timestamp instead would be a lie that the UI has no
 * way to detect. Solar noon always exists — the sun is always somewhere on the meridian,
 * even if it is below the horizon when it gets there.
 */
export function sunEventsFor(at: Instant, where: GeoPoint): SunEvents {
  const lat: number = where.latitude;
  const lon: number = where.longitude;
  const dayStart = localSolarDayStartUtcMs(at, lon);

  const event = (altitudeDeg: number, direction: 1 | -1) => {
    const r = crossingUtcMs(dayStart, lat, lon, altitudeDeg, direction);
    return r.kind === "crosses" ? instant(r.atMs) : null;
  };

  return {
    sunrise: event(SUNRISE_ALTITUDE_DEG, 1),
    sunset: event(SUNRISE_ALTITUDE_DEG, -1),
    civilDawn: event(CIVIL_TWILIGHT_ALTITUDE_DEG, 1),
    civilDusk: event(CIVIL_TWILIGHT_ALTITUDE_DEG, -1),
    solarNoon: instant(Math.round(solarNoonUtcMs(dayStart, lon))),
  };
}

function phaseAt(atMs: number, latDeg: number, lonDeg: number): DaylightPhase {
  const altitude = solarAltitudeDeg(atMs, latDeg, lonDeg);
  if (altitude > SUNRISE_ALTITUDE_DEG) return "day";
  if (altitude > CIVIL_TWILIGHT_ALTITUDE_DEG) return "civil-twilight";
  return "night";
}

/**
 * How coarsely we walk the range looking for a phase change, before bisecting.
 *
 * The shortest possible civil twilight is at the equator at an equinox, where the sun drops
 * through the 5.167-degree band between -0.833 and -6 at very nearly 15 degrees per hour:
 * about 21 minutes. A 5-minute step therefore cannot step over a whole phase.
 *
 * The one case it can miss is a grazing crossing that lasts less than 5 minutes, which
 * happens only within a day or two of the start or end of the polar day/night season at
 * latitudes above about 65 degrees. Missing a 4-minute sunrise inside the Arctic Circle is
 * not a defect this app needs to fix.
 */
const SCAN_STEP_MS = 5 * 60_000;

/**
 * Bisection runs all the way down to the millisecond.
 *
 * Not for accuracy — the sun's position is not known to anything like that precision. It is
 * so the answer is *deterministic*: bisected to the last millisecond, a boundary is the
 * unique instant at which the phase changes, and does not depend on where the caller's range
 * happened to start. Stopping a second early made `daylightSpans(a, c)` disagree by a few
 * hundred milliseconds with `daylightSpans(a, b) ++ daylightSpans(b, c)`, which would have
 * been a nasty surprise for anything that keys or caches on a boundary. Twenty extra
 * halvings per boundary cost nothing.
 */
const BISECT_RESOLUTION_MS = 1;

/**
 * First instant in `(lo, hi]` whose phase differs from `phase`.
 *
 * Precondition: `phaseAt(lo) === phase` and `phaseAt(hi) !== phase`.
 */
function firstChangeAfter(
  lo: number,
  hi: number,
  phase: DaylightPhase,
  latDeg: number,
  lonDeg: number,
): number {
  let low = lo;
  let high = hi;
  while (high - low > BISECT_RESOLUTION_MS) {
    const mid = low + Math.floor((high - low) / 2);
    if (phaseAt(mid, latDeg, lonDeg) === phase) low = mid;
    else high = mid;
  }
  return high;
}

/**
 * Background shading for the chart: night / civil twilight / day across `[from, to]`.
 *
 * The contract, which matters more than any single event time, because the chart paints
 * straight from this list and does no date arithmetic of its own:
 *
 * - Sorted ascending, and every span has `from < to`.
 * - Contiguous and gap-free: each span's `to` is the next span's `from`, exactly.
 * - No overlaps.
 * - The first span starts at `from` and the last ends at `to`. Nothing outside is returned.
 * - Adjacent spans never share a phase.
 * - An empty or reversed range returns `[]`.
 *
 * Polar cases fall out of this rather than being special-cased: a single span of `day`
 * covers a midnight-sun range, a single span of `night` covers a deep polar-night range.
 *
 * This walks the range at 5-minute steps and bisects each phase change, rather than
 * stitching together per-day sunrise/sunset lists. Stitching is where gap-and-overlap bugs
 * live, and it needs a special case for every polar situation; scanning the sun's actual
 * altitude has neither problem. Cost is roughly 400 cheap trigonometric evaluations per day
 * of range, so a week-long chart is trivial. A decade-long range would not be; nothing asks
 * for one, and if something ever does, that is the moment to cache by day rather than to
 * make the scan coarser.
 */
export function daylightSpans(
  from: Instant,
  to: Instant,
  where: GeoPoint,
): readonly DaylightSpan[] {
  const start: number = from;
  const end: number = to;
  if (!(end > start)) return [];

  const lat: number = where.latitude;
  const lon: number = where.longitude;

  const raw: { from: number; to: number; phase: DaylightPhase }[] = [];
  let spanStart = start;
  let currentPhase = phaseAt(start, lat, lon);
  let t = start;

  while (t < end) {
    const next = Math.min(t + SCAN_STEP_MS, end);
    // A single step can in principle contain more than one change; loop until the step's
    // far end agrees with the phase we are currently tracking.
    let guard = 0;
    while (phaseAt(next, lat, lon) !== currentPhase && guard++ < 8) {
      const boundary = firstChangeAfter(t, next, currentPhase, lat, lon);
      raw.push({ from: spanStart, to: boundary, phase: currentPhase });
      spanStart = boundary;
      currentPhase = phaseAt(boundary, lat, lon);
      t = boundary;
    }
    t = next;
  }
  raw.push({ from: spanStart, to: end, phase: currentPhase });

  // Drop zero-length spans (a boundary landing exactly on `from` or `to`) and merge any
  // neighbours that ended up with the same phase. Dropping a zero-length span cannot open
  // a gap, because it covered no time.
  const out: DaylightSpan[] = [];
  for (const span of raw) {
    if (span.to <= span.from) continue;
    const last = out[out.length - 1];
    if (last && last.phase === span.phase) {
      out[out.length - 1] = { from: last.from, to: instant(span.to), phase: last.phase };
    } else {
      out.push({ from: instant(span.from), to: instant(span.to), phase: span.phase });
    }
  }
  return out;
}
