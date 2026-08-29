/**
 * Branded SI scalars for `src/core/`. See ADR 006 §2–§3.
 *
 * `core/` is SI and only SI: metres, metres-per-hour, epoch-milliseconds. Feet, ft/hr and
 * localized strings are produced in `features/conditions/format.ts`, never here.
 *
 * There is deliberately NO conversion between `MetresPerHour` and `Knots` in this module.
 * `MetresPerHour` is the rate of TIDE HEIGHT change; `Knots` is the speed of WATER CURRENT.
 * They are physically unrelated quantities that happen to both be "rate-ish" — a tide can
 * be rising fast while the current at a given station is slack, and vice versa. Adding a
 * conversion here would make it trivial to accidentally render a height rate as a current
 * speed. Per ADR 006 §4, that requires an ADR superseding this one, not a helper function.
 */

declare const brand: unique symbol;
type Unit<T extends string> = number & { readonly [brand]: T };

/** UTC epoch-milliseconds. The only time representation in `core/`. */
export type Instant = Unit<"epoch-ms">;
/** A duration in milliseconds. */
export type Millis = Unit<"ms">;
/** Height above a tide station's datum. */
export type Metres = Unit<"m">;
/** Rate of tide HEIGHT change. Never a current speed. */
export type MetresPerHour = Unit<"m/h">;
/** Speed of WATER. `core/rules/tide/` never produces this. */
export type Knots = Unit<"kn">;
/** Degrees, latitude/longitude or bearing depending on context. */
export type Degrees = Unit<"deg">;

/** How a value was obtained, for `Sourced<T>`. See ADR 006 §5. */
export type Certainty = "published" | "interpolated" | "estimated";

/**
 * Wraps a derived value with its provenance. Presentation may read `.value` only through
 * `features/conditions/components/sourced-value.tsx` (ADR 006 §5); everywhere else under
 * `features/**` reading `.value` directly is an ESLint tripwire.
 */
export interface Sourced<T> {
  readonly value: T;
  readonly certainty: Certainty;
  /** Phrase the UI must render beside the value, e.g. "estimated from height predictions". */
  readonly basis: string;
}

export function sourced<T>(value: T, certainty: Certainty, basis: string): Sourced<T> {
  return { value, certainty, basis };
}

// ---- Constructors / casts. Ergonomic edges only — no arithmetic helpers that would blur
// the distinction the branding exists to enforce. ----

export function instant(epochMs: number): Instant {
  return epochMs as Instant;
}

export function millis(ms: number): Millis {
  return ms as Millis;
}

export function metres(m: number): Metres {
  return m as Metres;
}

export function metresPerHour(mPerH: number): MetresPerHour {
  return mPerH as MetresPerHour;
}

export function knots(kn: number): Knots {
  return kn as Knots;
}

export function degrees(deg: number): Degrees {
  return deg as Degrees;
}

/** Millimetres, as NOAA CO-OPS wire data arrives — converted at the fixture/query boundary. */
export function metresFromMillimetres(mm: number): Metres {
  return metres(mm / 1000);
}

/** Minutes, as offsets sometimes arrive on the wire — converted to a duration. */
export function millisFromMinutes(min: number): Millis {
  return millis(min * 60_000);
}
