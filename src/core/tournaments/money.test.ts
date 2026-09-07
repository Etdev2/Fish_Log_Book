import { describe, expect, it } from "vitest";

import { minorToInput, parseMoneyToMinor } from "./money";

describe("parseMoneyToMinor", () => {
  it("reads whole dollars and cents exactly", () => {
    expect(parseMoneyToMinor("40")).toEqual({ ok: true, minor: 4000 });
    expect(parseMoneyToMinor("40.10")).toEqual({ ok: true, minor: 4010 });
    expect(parseMoneyToMinor("40.1")).toEqual({ ok: true, minor: 4010 });
    expect(parseMoneyToMinor(".5")).toEqual({ ok: true, minor: 50 });
  });

  it("does not go through a float, so the classic rounding bug cannot happen", () => {
    // Math.round(1.005 * 100) is 100 in IEEE 754, not 101. This must be 101.
    expect(parseMoneyToMinor("1.005")).toEqual({ ok: false, reason: "too-precise" });
    expect(parseMoneyToMinor("1.01")).toEqual({ ok: true, minor: 101 });
    expect(parseMoneyToMinor("8.165")).toEqual({ ok: false, reason: "too-precise" });
  });

  it("accepts a price written the way a person writes one", () => {
    expect(parseMoneyToMinor("$250")).toEqual({ ok: true, minor: 25000 });
    expect(parseMoneyToMinor(" 1,250.00 ")).toEqual({ ok: true, minor: 125000 });
  });

  it("treats free as a real price, not as empty", () => {
    expect(parseMoneyToMinor("0")).toEqual({ ok: true, minor: 0 });
    expect(parseMoneyToMinor("0.00")).toEqual({ ok: true, minor: 0 });
  });

  it("refuses what is not a price rather than guessing", () => {
    expect(parseMoneyToMinor("")).toEqual({ ok: false, reason: "not-a-number" });
    expect(parseMoneyToMinor("free")).toEqual({ ok: false, reason: "not-a-number" });
    expect(parseMoneyToMinor("40.00.00")).toEqual({ ok: false, reason: "not-a-number" });
    expect(parseMoneyToMinor("-40")).toEqual({ ok: false, reason: "negative" });
  });

  it("refuses an implausible number rather than storing a typo as a fee", () => {
    expect(parseMoneyToMinor("99999999999")).toEqual({ ok: false, reason: "too-large" });
  });
});

describe("minorToInput", () => {
  it("is the exact inverse for anything the parser accepts", () => {
    for (const value of ["0", "40", "40.10", "1250", "0.05", "9.99"]) {
      const parsed = parseMoneyToMinor(value);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) throw new Error("unreachable");
      expect(parseMoneyToMinor(minorToInput(parsed.minor))).toEqual(parsed);
    }
  });

  it("shows an unset price as an empty field, not as zero", () => {
    // Null is "not priced"; zero is "free". A field pre-filled with 0 would turn every
    // unpriced draft into a free event the first time somebody saved it.
    expect(minorToInput(null)).toBe("");
    expect(minorToInput(0)).toBe("0");
  });
});
