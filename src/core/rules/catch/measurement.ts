/**
 * Measurements: what the angler types, and what gets stored (spec §23, §24).
 *
 * `core/` is SI (see `core/units.ts`). The schema stores `weight_g`, `length_mm` and
 * `depth_fished_m`, so pounds-and-ounces exist only at the two edges: parsing what was
 * typed, and rendering it back. Everything between is one number in one unit.
 *
 * Two rules here are analytics decisions, not formatting ones:
 *
 *   - **Round-tripping is lossy on purpose.** 84 lb stored as 38102 g renders back as
 *     84.0 lb, not 84. The stored value is the fact; the display precision is a choice
 *     made at the glass.
 *   - **Estimated is not measured** (spec §24). `size_estimated` travels with the value
 *     rather than being inferred later from a round number, because "80 lb" from a
 *     boga grip and "about 80" from an eyeball are different observations and a future
 *     correlation must be able to weight them differently.
 */

export type WeightUnit = "lb" | "kg";
export type LengthUnit = "in" | "cm";
export type DepthUnit = "ft" | "m";

const GRAMS_PER_LB = 453.59237;
const GRAMS_PER_OZ = 28.349523125;
const GRAMS_PER_KG = 1000;
const MM_PER_IN = 25.4;
const MM_PER_CM = 10;
const M_PER_FT = 0.3048;

/** Guards every parse. NaN, Infinity and negatives are not measurements (spec §40). */
function finitePositive(value: number): number | null {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Pounds (and optional ounces) or kilograms to whole grams.
 * Ounces are accepted alongside pounds because that is how a scale reads out; they are
 * not a separate unit choice.
 */
export function weightToGrams(value: number, unit: WeightUnit, ounces = 0): number | null {
  const whole = finitePositive(value);
  const oz = finitePositive(ounces);
  if (whole === null || oz === null) return null;
  if (unit === "kg") {
    if (oz > 0) return null; // kg-and-ounces is not a thing anybody means
    return Math.round(whole * GRAMS_PER_KG);
  }
  return Math.round(whole * GRAMS_PER_LB + oz * GRAMS_PER_OZ);
}

export function gramsToWeight(grams: number, unit: WeightUnit): number {
  return unit === "kg" ? grams / GRAMS_PER_KG : grams / GRAMS_PER_LB;
}

/** Grams as pounds and remainder ounces, for imperial display. */
export function gramsToPoundsOunces(grams: number): { lb: number; oz: number } {
  const totalOunces = grams / GRAMS_PER_OZ;
  const lb = Math.floor(totalOunces / 16);
  const oz = totalOunces - lb * 16;
  // 15.97 oz displayed to one decimal is "16.0 oz", which reads as a bug. Carry it.
  if (Math.round(oz * 10) / 10 >= 16) return { lb: lb + 1, oz: 0 };
  return { lb, oz: Math.round(oz * 10) / 10 };
}

export function lengthToMillimetres(value: number, unit: LengthUnit): number | null {
  const length = finitePositive(value);
  if (length === null) return null;
  return Math.round(length * (unit === "cm" ? MM_PER_CM : MM_PER_IN));
}

export function millimetresToLength(mm: number, unit: LengthUnit): number {
  return unit === "cm" ? mm / MM_PER_CM : mm / MM_PER_IN;
}

/** Depth is stored as fractional metres (numeric(6,2)), not rounded to whole units. */
export function depthToMetres(value: number, unit: DepthUnit): number | null {
  const depth = finitePositive(value);
  if (depth === null) return null;
  return Math.round(depth * (unit === "m" ? 1 : M_PER_FT) * 100) / 100;
}

export function metresToDepth(m: number, unit: DepthUnit): number {
  return unit === "m" ? m : m / M_PER_FT;
}

/**
 * Parse a typed measurement string. Deliberately forgiving about what a wet thumb
 * produces — "84", "84.5", " 84 ", "84lb" — and deliberately strict about everything
 * else, because a silently-misparsed weight is worse than a rejected one.
 *
 * Returns `null` for empty input (the field is optional) and `undefined` for input that
 * was typed but is not a number, so a caller can tell "left blank" from "typed wrong".
 */
export function parseMeasurement(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  // Strip a trailing unit the angler may have typed; the unit comes from the toggle.
  const numeric = trimmed.replace(/\s*(lb|lbs|kg|in|cm|ft|m|oz)\s*$/i, "").trim();
  if (numeric === "" || !/^\d*\.?\d+$/.test(numeric)) return undefined;
  const parsed = Number.parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/*
 * Environmental weather measurements (founder "Historical Catch" spec §2). Same rule
 * as length/weight: typed in the angler's unit, stored SI-canonical so a Hawaii
 * pressure and a North-Sea pressure mean the same number.
 */

/** Fahrenheit on the keypad, Celsius in the row. */
export function fahrenheitToCelsius(f: number): number {
  return (f - 32) * (5 / 9);
}
export function celsiusToFahrenheit(c: number): number {
  return c * (9 / 5) + 32;
}

/** inHg on the keypad (US marine forecasts), hectopascals in the row. */
export function inHgToHpa(inHg: number): number {
  return inHg * 33.8639;
}
export function hpaToInHg(hpa: number): number {
  return hpa / 33.8639;
}

/** Knots on the keypad (how boats talk), metres/second in the row (how sync talks). */
export function knotsToMps(knots: number): number {
  return knots * 0.514444;
}
export function mpsToKnots(mps: number): number {
  return mps / 0.514444;
}

/** 16-point compass label for a direction in degrees. Undefined input is honest data. */
export function compassLabel(deg: number | null): string | null {
  if (deg === null || !Number.isFinite(deg)) return null;
  const points = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return points[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}
