import { describe, expect, it } from "vitest";

import { autoName } from "./types";

/**
 * Founder request 2026-09-01: blank name box = the name is the buttons pushed.
 * The pinned example is the founder's own words: hooks tapped as Owner / 2/0 / J-hook
 * must read "Hook Owner 2/0 J-hook".
 */
describe("autoName", () => {
  it("composes the founder's exact hook example", () => {
    expect(autoName("hooks", { brand: "Owner", size: "2/0", style: "J-hook" })).toBe(
      "Hook Owner 2/0 J-hook",
    );
  });

  it("works taps-only: category with no buttons is still a name", () => {
    expect(autoName("hooks", {})).toBe("Hook");
    expect(autoName("other", {})).toBe("Gear");
  });

  it("skips blank attributes instead of leaving holes", () => {
    expect(autoName("jigs", { brand: "Tady", weight: "", style: "Surface iron" })).toBe(
      "Jig Tady Surface iron",
    );
  });

  it("orders size before style for hooks, matching the founder's wording", () => {
    // Field order in the registry is brand/style/size; the NAME order is brand/size/style.
    expect(autoName("hooks", { style: "Circle", brand: "Owner", size: "4/0" })).toBe(
      "Hook Owner 4/0 Circle",
    );
  });

  it("composes sinkers as style + weight", () => {
    expect(autoName("sinkers-weights", { style: "Pyramid", weight: "4 oz" })).toBe(
      "Sinker Pyramid 4 oz",
    );
  });

  it("trims button values that spilled extra space", () => {
    expect(autoName("line", { brand: "  Izorline  ", poundTest: "40 lb" })).toBe(
      "Line Izorline 40 lb",
    );
  });
});
