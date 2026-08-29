import { describe, expect, it } from "vitest";
import { metresFromMillimetres, millisFromMinutes, sourced } from "@/core/units";

describe("unit constructors", () => {
  it("converts millimetres to metres", () => {
    expect(metresFromMillimetres(1277)).toBeCloseTo(1.277, 6);
  });

  it("converts minutes to a millisecond duration", () => {
    expect(millisFromMinutes(60)).toBe(3_600_000);
  });

  it("sourced() builds the provenance wrapper", () => {
    const s = sourced(1.2, "estimated", "test basis");
    expect(s).toEqual({ value: 1.2, certainty: "estimated", basis: "test basis" });
  });
});
