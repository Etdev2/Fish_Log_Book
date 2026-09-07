/**
 * Reading a price a person typed, into the integer minor units the schema stores.
 *
 * Every money column in this schema is `bigint` minor units, and every screen that takes a
 * price takes it as text. This is the one place that crossing happens, so it is the one
 * place a rounding error could be introduced — which is why it does not go near a float.
 *
 * `Math.round(Number("40.10") * 100)` looks fine and mostly is, but binary floating point
 * cannot hold most decimal fractions exactly, and the failures are quiet: `1.005 * 100` is
 * `100.49999999999999`, which rounds to 10049 rather than 10050. Splitting the string on
 * its decimal point and padding the fraction is exact for every input, always.
 */

export type MoneyParse =
  | { readonly ok: true; readonly minor: number }
  | { readonly ok: false; readonly reason: "not-a-number" | "negative" | "too-precise" | "too-large" };

/** A price is at most this many minor units — roughly ten million dollars. Beyond that it
 *  is a typo, and refusing it is friendlier than accepting a fee nobody meant. */
const MAX_MINOR = 1_000_000_000;

export function parseMoneyToMinor(raw: string): MoneyParse {
  const trimmed = raw.trim().replace(/[$,\s]/g, "");
  if (trimmed === "") return { ok: false, reason: "not-a-number" };
  if (trimmed.startsWith("-")) return { ok: false, reason: "negative" };
  if (!/^\d*(?:\.\d*)?$/.test(trimmed)) return { ok: false, reason: "not-a-number" };

  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > 2) return { ok: false, reason: "too-precise" };
  if (whole === "" && fraction === "") return { ok: false, reason: "not-a-number" };

  const minor = Number(`${whole || "0"}${fraction.padEnd(2, "0")}`);
  if (!Number.isSafeInteger(minor)) return { ok: false, reason: "too-large" };
  if (minor > MAX_MINOR) return { ok: false, reason: "too-large" };
  return { ok: true, minor };
}

/** Minor units back into the text a price field should show. The exact inverse. */
export function minorToInput(minor: number | null): string {
  if (minor === null) return "";
  const whole = Math.trunc(minor / 100);
  const cents = Math.abs(minor % 100);
  return cents === 0 ? String(whole) : `${whole}.${String(cents).padStart(2, "0")}`;
}
