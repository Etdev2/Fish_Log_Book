import { describe, expect, it } from "vitest";

import { REG_AREAS, RCA_50FM_LINE } from "./reg-data";
import { distanceToLineM, distanceToRingM, pointInRing, sideOfLine } from "./geospatial";

const SOUTHERN = REG_AREAS.find((a) => a.id === "ca-gma-southern")!.polygon!;
const CCA = REG_AREAS.find((a) => a.id === "cca-santa-barbara")!.polygon!;

describe("pointInRing — 'am I inside the agency's area' (spec §8)", () => {
  it("places Long Beach harbor inside the Southern Management Area", () => {
    expect(pointInRing([-118.2, 33.71], SOUTHERN)).toBe(true);
  });

  it("places the Farallon Islands outside it", () => {
    expect(pointInRing([-123.0, 37.7], SOUTHERN)).toBe(false);
  });

  it("places a boat inside the CCA box and one near Dana Point outside", () => {
    expect(pointInRing([-119.6, 33.4], CCA)).toBe(true);
    expect(pointInRing([-117.7, 33.45], CCA)).toBe(false);
  });
});

describe("sideOfLine — inshore/offshore of the RCA (spec §9)", () => {
  const line = RCA_50FM_LINE.points;

  it("reads the coastline side as inshore", () => {
    // Redondo Beach pier area: well east of the 50-fm line.
    expect(sideOfLine([-118.4, 33.83], line)).toBe("inshore");
  });

  it("reads blue water past the line as offshore", () => {
    expect(sideOfLine([-119.6, 33.4], line)).toBe("offshore");
  });
});

describe("boundary proximity (spec §9's approaching-boundary warning)", () => {
  it("measures a few hundred meters, not a few kilometers, near the CCA corner", () => {
    // ~0.005° east of the CCA east wall at 33.4°N ≈ 460 m.
    const d = distanceToRingM([-118.83, 33.4], CCA);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(800);
  });

  it("measures meaningful kilometers offshore of the RCA line", () => {
    const d = distanceToLineM([-119.6, 33.4], RCA_50FM_LINE.points);
    expect(d).toBeGreaterThan(5_000);
    expect(d).toBeLessThan(80_000);
  });
});
