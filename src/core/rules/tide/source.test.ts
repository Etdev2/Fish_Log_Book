import { describe, expect, it } from "vitest";
import { instant, metres } from "@/core/units";
import { tideSeries } from "./source";

const STATION = { id: "9410580", name: "Newport Bay Entrance", timeZone: "America/Los_Angeles", datum: "MLLW" as const };

describe("tideSeries", () => {
  it("throws on empty samples", () => {
    expect(() => tideSeries({ station: STATION, samples: [], provider: "fixture" })).toThrow();
  });

  it("throws on non-ascending samples", () => {
    const samples = [
      { at: instant(2000), height: metres(1), turn: null },
      { at: instant(1000), height: metres(1), turn: null },
    ];
    expect(() => tideSeries({ station: STATION, samples, provider: "fixture" })).toThrow();
  });

  it("throws on duplicate (non-strictly-ascending) instants", () => {
    const samples = [
      { at: instant(1000), height: metres(1), turn: null },
      { at: instant(1000), height: metres(1.1), turn: null },
    ];
    expect(() => tideSeries({ station: STATION, samples, provider: "fixture" })).toThrow();
  });

  it("accepts strictly ascending, non-empty samples", () => {
    const samples = [
      { at: instant(1000), height: metres(1), turn: null },
      { at: instant(2000), height: metres(1.2), turn: null },
    ];
    const series = tideSeries({ station: STATION, samples, provider: "fixture" });
    expect(series.samples).toHaveLength(2);
    expect(series.retrievedAt).toBeNull();
  });
});
