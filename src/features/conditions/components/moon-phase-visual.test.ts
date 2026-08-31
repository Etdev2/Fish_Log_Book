import { describe, expect, it } from "vitest";

import { moonLightPath } from "./moon-phase-visual";

describe("moonLightPath", () => {
  it("collapses the illuminated shape at new moon", () => {
    expect(moonLightPath(0)).toContain("A 42.000 42 0 0 0 50 8");
  });

  it("uses a straight terminator at quarter moon", () => {
    expect(moonLightPath(0.5)).toContain("A 0.000 42 0 0 0 50 8");
  });

  it("opens the second arc into a full disc at full moon", () => {
    expect(moonLightPath(1)).toContain("A 42.000 42 0 0 1 50 8");
  });

  it("clamps values outside the physical illumination range", () => {
    expect(moonLightPath(-1)).toBe(moonLightPath(0));
    expect(moonLightPath(2)).toBe(moonLightPath(1));
  });
});
