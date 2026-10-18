import { describe, expect, it } from "vitest";

import { tideSeries } from "@/core/rules/tide";
import { instant, metres } from "@/core/units";
import { nextResolved, type Resolved } from "./use-tide-series";

const start = Date.UTC(2026, 9, 18, 0, 0, 0);

function series(retrievedAt: number) {
  return tideSeries({
    station: { id: "9410580", name: "Newport Bay Entrance", timeZone: "America/Los_Angeles", datum: "MLLW" },
    samples: [{ at: instant(start), height: metres(1), turn: null }],
    provider: "noaa-coops",
    retrievedAt: instant(retrievedAt),
  });
}

function resolved(source: Resolved["source"], retrievedAt: number, stationId = "9410580"): Resolved {
  return { stationId, series: series(retrievedAt), source, stale: false, error: null };
}

describe("which tide resolution to keep", () => {
  it("keeps 'live' when the next run only reads back the series just fetched", () => {
    const live = resolved("live", start);
    expect(nextResolved(live, resolved("cache", start))).toBe(live);
  });

  it("takes a different cached series", () => {
    const later = resolved("cache", start + 1);
    expect(nextResolved(resolved("live", start), later)).toBe(later);
  });

  it("takes a newer live fetch over an older cache", () => {
    const live = resolved("live", start + 1);
    expect(nextResolved(resolved("cache", start), live)).toBe(live);
  });

  it("takes another station's answer", () => {
    const other = resolved("cache", start, "9410170");
    expect(nextResolved(resolved("live", start), other)).toBe(other);
  });

  it("takes the first answer", () => {
    const first = resolved("cache", start);
    expect(nextResolved(null, first)).toBe(first);
  });
});
