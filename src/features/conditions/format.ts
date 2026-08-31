/**
 * Instant + SI -> localized strings. Every `Intl` call in this feature lives here
 * (ADR 006 §1, §3). `core/` stays SI-only; feet, ft/hr and every date/time string are
 * produced here, from the unit preference and the station's time zone respectively.
 */
import type { Degrees, Instant, Metres, MetresPerHour } from "@/core/units";
import type { UnitPreference } from "@/features/settings/units";
import type { MoonPhaseName } from "./types";
import type { TideMotion, PaceClass } from "@/core/rules/tide";

const METRES_PER_FOOT = 0.3048;

export function toDisplayHeight(value: Metres, unit: UnitPreference): number {
  return unit === "ft" ? value / METRES_PER_FOOT : value;
}

export function toDisplayRate(value: MetresPerHour, unit: UnitPreference): number {
  return unit === "ft" ? value / METRES_PER_FOOT : value;
}

/** "3.40 ft" / "1.04 m". */
export function formatHeight(value: Metres, unit: UnitPreference): string {
  const shown = toDisplayHeight(value, unit);
  return `${shown.toFixed(2)} ${unit}`;
}

/** "+0.62 ft/hr" / "-0.19 m/hr", always signed. */
export function formatRate(value: MetresPerHour, unit: UnitPreference): string {
  const shown = toDisplayRate(value, unit);
  const sign = shown > 0 ? "+" : shown < 0 ? "" : "±";
  return `${sign}${shown.toFixed(2)} ${unit}/hr`;
}

const MOTION_LABEL: Record<TideMotion, string> = {
  rising: "Rising",
  falling: "Falling",
  "near-slack": "Near slack",
  slack: "Slack",
};

export function formatMotion(motion: TideMotion): string {
  return MOTION_LABEL[motion];
}

const PACE_LABEL: Record<PaceClass, string> = {
  "very-slow": "Very slow",
  slow: "Slow",
  normal: "Normal",
  fast: "Fast",
  "very-fast": "Very fast",
};

export function formatPace(pace: PaceClass): string {
  return PACE_LABEL[pace];
}

const MOON_PHASE_LABEL: Record<MoonPhaseName, string> = {
  new: "New moon",
  "waxing-crescent": "Waxing crescent",
  "first-quarter": "First quarter",
  "waxing-gibbous": "Waxing gibbous",
  full: "Full moon",
  "waning-gibbous": "Waning gibbous",
  "last-quarter": "Last quarter",
  "waning-crescent": "Waning crescent",
};

export function formatMoonPhaseName(name: MoonPhaseName): string {
  return MOON_PHASE_LABEL[name];
}

export function formatMoonIllumination(illumination: number): string {
  return `${Math.round(illumination * 100)}% lit`;
}

// ---- Time, always in the station's local time zone. ----

export function clock(at: Instant, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone })
    .format(new Date(at))
    .replace(" ", "")
    .toLowerCase();
}

/** "PDT", "EDT", "GMT+2" — a short zone label to sit next to a clock reading. */
export function zoneAbbreviation(at: Instant, timeZone: string): string {
  const part = new Intl.DateTimeFormat("en-US", { timeZoneName: "short", timeZone })
    .formatToParts(new Date(at))
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? timeZone;
}

export function dayLabel(at: Instant, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", timeZone }).format(
    new Date(at),
  );
}

export function monthDay(at: Instant, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone }).format(new Date(at));
}

export function calendarWeekday(at: Instant, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(new Date(at));
}

/** "MON, AUG 31" — the compact date control above the timeline. */
export function compactDate(at: Instant, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone })
    .format(new Date(at))
    .toUpperCase();
}

export function calendarDayNumber(at: Instant, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone }).format(new Date(at));
}

/**
 * "3am" — the hour axis. Deliberately identical in form to `clock` above, which sets every
 * other time on this screen: a chart that labels its axis "3 AM" while the reading beside
 * it says "6:04am" is the same fact written two ways, and the eye reads that as two
 * different kinds of thing.
 */
export function hourLabel(at: Instant, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: true, timeZone })
    .format(new Date(at))
    .replace(" ", "")
    .toLowerCase();
}

/**
 * "THU 27" — the day divider tags on the chart. Composed from the same two parts, in the
 * same order, as the date control below the readout ("THU, AUG 27"): `Intl`'s own
 * weekday+day pattern for en-US returns "27 Thu", which put the two labels for the same
 * day in opposite orders on one screen.
 */
export function dividerDay(at: Instant, timeZone: string): string {
  return `${calendarWeekday(at, timeZone)} ${calendarDayNumber(at, timeZone)}`.toUpperCase();
}

export function stationHour(at: Instant, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", { hour: "2-digit", hourCycle: "h23", timeZone })
    .formatToParts(new Date(at))
    .find((part) => part.type === "hour")?.value;
  return Number(hour ?? "0");
}

/**
 * "12 min", "1h 30m", "3h" — a countdown magnitude with no direction word, so callers can
 * compose "12 min to slack" / "high in 1h 30m" without this function guessing the phrasing.
 * Natural language under an hour (no "0h"), for the reading-glasses-forgotten test.
 */
export function formatDurationMagnitude(deltaMs: number): string {
  const totalMinutes = Math.round(Math.abs(deltaMs) / 60_000);
  if (totalMinutes < 1) return "under a minute";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

/** "12 min to Slack", "1h 30m ago", built from a signed delta (target - now). */
export function formatCountdown(deltaMs: number, label: string): string {
  const magnitude = formatDurationMagnitude(deltaMs);
  return deltaMs >= 0 ? `${magnitude} to ${label}` : `${magnitude} ago (${label})`;
}

/**
 * "33.6047° N, 117.8830° W" — the station's position, for the station-details sheet.
 * Four decimals is about 11 m, which is the precision NOAA publishes a station at; more
 * digits would imply an accuracy that is not in the source.
 */
export function formatCoordinates(latitude: Degrees, longitude: Degrees): string {
  const lat = `${Math.abs(latitude).toFixed(4)}\u00B0 ${latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(longitude).toFixed(4)}\u00B0 ${longitude >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon}`;
}

/**
 * "12.4 days since the new moon". Deliberately not rounded down to fit the 29.53-day
 * average — `docs/analysis/sun-and-moon.md` §3.2 says a real lunar month runs long and the
 * engine reports the time actually elapsed, so a reading of 29.7 is correct, not a bug.
 */
export function formatLunarAge(ageDays: number): string {
  return `${ageDays.toFixed(1)} days since the new moon`;
}
