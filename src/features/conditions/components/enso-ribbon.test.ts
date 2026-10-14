import { describe, expect, it } from "vitest";

import { monthTitle } from "./enso-ribbon";

describe("ENSO ribbon labels", () => {
  it("names observed months with their ONI", () => {
    expect(monthTitle({ year: 2015, month: 12, phase: "el-nino", basis: "observed", oni: 2.64, probability: null })).toBe(
      "Dec 2015: El Niño (ONI +2.64 °C)",
    );
  });
  it("names outlook months with their probability", () => {
    expect(monthTitle({ year: 2027, month: 4, phase: "neutral", basis: "outlook", oni: null, probability: 54 })).toBe(
      "Apr 2027: Neutral 54% (CPC outlook)",
    );
  });
  it("says plainly when there is no forecast", () => {
    expect(monthTitle({ year: 2028, month: 1, phase: null, basis: "none", oni: null, probability: null })).toMatch(/no ENSO forecast/);
  });
});
