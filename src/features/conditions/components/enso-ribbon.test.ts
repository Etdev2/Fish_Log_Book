import { describe, expect, it } from "vitest";

import { monthSpans, monthTitle, stepMonthKey } from "./enso-ribbon";

describe("ENSO ribbon labels", () => {
  it("names observed months with their ONI", () => {
    expect(monthTitle({ year: 2015, month: 12, phase: "el-nino", basis: "observed", oni: 2.64, probability: null })).toBe(
      "Dec 2015: El Niño (ONI +2.64 °C)",
    );
  });
  it("names outlook months with their probability", () => {
    expect(monthTitle({ year: 2027, month: 4, phase: "neutral", basis: "outlook", oni: null, probability: 54 })).toBe(
      "Apr 2027: Neutral 54% (CPC outlook, RONI)",
    );
  });
  it("says plainly when there is no forecast", () => {
    expect(monthTitle({ year: 2028, month: 1, phase: null, basis: "none", oni: null, probability: null })).toMatch(/no ENSO forecast/);
  });
  it("calls the month between the last observation and the outlook a gap, not 'too far out'", () => {
    expect(monthTitle({ year: 2026, month: 9, phase: null, basis: "none", oni: null, probability: null })).toMatch(/no ENSO value yet/);
  });
});

describe("ENSO ribbon time scale", () => {
  it("sizes each month by its overlap with the range, so partial end months are narrower", () => {
    const m = (year: number, month: number) => ({ year, month, phase: null, basis: "none" as const, oni: null, probability: null });
    const from = Date.UTC(2026, 0, 16);
    const to = Date.UTC(2026, 2, 8);
    const spans = monthSpans([m(2026, 1), m(2026, 2), m(2026, 3)], from, to);
    const day = 86_400_000;
    expect(spans).toEqual([16 * day, 28 * day, 7 * day]);
    expect(spans.reduce((a, b) => a + b, 0)).toBe(to - from);
  });
});

describe("stepping through months with the 48px buttons", () => {
  const month = (year: number, m: number) =>
    ({ year, month: m, phase: null, basis: "none", oni: null, probability: null }) as const;
  const months = [month(2026, 11), month(2026, 12), month(2027, 1)];

  it("moves one month either way, across a year end", () => {
    expect(stepMonthKey(months, "2026-12", 1)).toBe("2027-1");
    expect(stepMonthKey(months, "2026-12", -1)).toBe("2026-11");
  });

  it("stops at the ends of the loaded range", () => {
    expect(stepMonthKey(months, "2026-11", -1)).toBe("2026-11");
    expect(stepMonthKey(months, "2027-1", 1)).toBe("2027-1");
  });

  it("has nothing to step through when no months are loaded", () => {
    expect(stepMonthKey([], "2026-11", 1)).toBeNull();
  });
});
