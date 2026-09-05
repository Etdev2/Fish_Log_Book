/**
 * Rendering a catch. `core/` holds SI; every pound, inch and foot is produced here
 * (ADR 006 §2–§3, mirroring `features/conditions/format.ts`).
 */

import { celsiusToFahrenheit, hpaToInHg, mpsToKnots } from "@/core/rules/catch/measurement";
import {
  gramsToPoundsOunces,
  gramsToWeight,
  metresToDepth,
  millimetresToLength,
  type DepthUnit,
  type LengthUnit,
  type WeightUnit,
} from "@/core/rules/catch/measurement";
import type { CatchRecord, GearRole } from "@/core/rules/catch/types";

export type UnitSystem = "imperial" | "metric";

export const weightUnitFor = (system: UnitSystem): WeightUnit =>
  system === "metric" ? "kg" : "lb";
export const lengthUnitFor = (system: UnitSystem): LengthUnit =>
  system === "metric" ? "cm" : "in";
export const depthUnitFor = (system: UnitSystem): DepthUnit => (system === "metric" ? "m" : "ft");

/**
 * Weight for display. Imperial shows ounces only under a pound, where they are the
 * whole story; above that "12.3 lb" reads faster on a moving boat than "12 lb 5 oz".
 */
export function formatWeight(grams: number | null, system: UnitSystem): string | null {
  if (grams === null) return null;
  if (system === "metric") return `${round(gramsToWeight(grams, "kg"), 2)} kg`;
  const { lb, oz } = gramsToPoundsOunces(grams);
  if (lb === 0) return `${round(oz, 1)} oz`;
  return `${round(gramsToWeight(grams, "lb"), 1)} lb`;
}

export function formatLength(mm: number | null, system: UnitSystem): string | null {
  if (mm === null) return null;
  const unit = lengthUnitFor(system);
  return `${round(millimetresToLength(mm, unit), 1)} ${unit}`;
}

export function formatDepth(metres: number | null, system: UnitSystem): string | null {
  if (metres === null) return null;
  const unit = depthUnitFor(system);
  return `${Math.round(metresToDepth(metres, unit))} ${unit}`;
}

/** "8:42 PM" in the zone the catch was recorded in, not the reader's current one. */
export function formatTemperature(celsius: number | null, system: UnitSystem): string | null {
  if (celsius === null) return null;
  return system === "metric"
    ? `${celsius.toFixed(1)}°C`
    : `${Math.round(celsiusToFahrenheit(celsius))}°F`;
}

export function formatPressure(hpa: number | null, system: UnitSystem): string | null {
  if (hpa === null) return null;
  return system === "metric" ? `${Math.round(hpa)} hPa` : `${hpaToInHg(hpa).toFixed(2)} inHg`;
}

/** Wind in knots for both systems: it is how marine forecasts talk, everywhere. */
export function formatWindSpeed(mps: number | null): string | null {
  if (mps === null) return null;
  return `${Math.round(mpsToKnots(mps))} kt`;
}

/**
 * A clock time in a given zone.
 *
 * The zone falls back to the device's when it is not a real IANA name. That guard is not
 * theoretical: a caller passed the literal string `"local"`, `Intl` threw a RangeError,
 * and because this runs inside a render it took the whole catch record down to a blank
 * page — visible only on catches that HAD a GPS fix, because only those carry the sun
 * times that reached this call. A time label is never worth losing the record over.
 */
export function formatClock(isoInstant: string, zone: string): string {
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const at = new Date(isoInstant);

  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone: zone }).format(at);
  } catch {
    // Unknown zone: the device's own is a better answer than no page.
    return new Intl.DateTimeFormat(undefined, options).format(at);
  }
}

/** "Thursday, 20 August" — a heading, so the year only when it is not this one. */
export function formatDayHeading(localDate: string, today: string): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const sameYear = localDate.slice(0, 4) === today.slice(0, 4);
  if (localDate === today) return "Today";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(date);
}

export const GEAR_ROLE_LABEL: Record<GearRole, string> = {
  rod: "Rod",
  reel: "Reel",
  main_line: "Main line",
  leader: "Leader",
  hook: "Hook",
  lure: "Lure",
  jig: "Jig",
  bait: "Bait",
  weight: "Weight",
  terminal: "Terminal",
};

export const DISPOSITION_LABEL: Record<string, string> = {
  kept: "Kept",
  released: "Released",
  "n/a": "n/a",
};

export const OUTCOME_LABEL: Record<string, string> = {
  landed: "Landed",
  lost: "Lost",
  missed_bite: "Missed bite",
  short_bite: "Short bite",
};

/**
 * The one-line summary under a catch card's species. Measurements first because that is
 * what an angler scans for, then how it was caught.
 */
export function summaryLine(record: CatchRecord, system: UnitSystem): readonly string[] {
  const parts: string[] = [];
  const weight = formatWeight(record.weight_g, system);
  const length = formatLength(record.length_mm, system);
  if (weight) parts.push(record.size_estimated ? `~${weight}` : weight);
  if (length) parts.push(length);
  if (record.quantity > 1) parts.push(`×${record.quantity}`);
  const depth = formatDepth(record.depth_fished_m, system);
  if (depth) parts.push(depth);
  return parts;
}

function round(value: number, places: number): string {
  return value.toFixed(places).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
