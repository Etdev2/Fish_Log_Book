import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import { readTideAt, tideSeries } from "@/core/rules/tide";

import { tideNowCopy, type TideNowFormat } from "./tide-now";

const HOUR = 60 * 60 * 1000;
const BASE = Date.parse("2026-10-16T12:00:00Z");

/** Hourly samples of a clean 12-hour cycle: low 0.2 m at BASE, high 1.6 m six hours later. */
const series = tideSeries({
  station: { id: "9410580", name: "Newport Bay Entrance", timeZone: "America/Los_Angeles", datum: "MLLW" },
  samples: Array.from({ length: 25 }, (_, i) => {
    const phase = (i % 12) / 12;
    const height = 0.9 - 0.7 * Math.cos(phase * 2 * Math.PI);
    const turn = i % 12 === 0 ? ("low" as const) : i % 12 === 6 ? ("high" as const) : null;
    return { at: instant(BASE + i * HOUR), height: metres(height), turn };
  }),
  provider: "noaa-coops",
  retrievedAt: instant(BASE),
});

const format: TideNowFormat = {
  clock: (ms) => new Date(ms).toISOString().slice(11, 16),
  height: (m) => `${m.toFixed(1)} m`,
  duration: (delta) => `${Math.round(delta / HOUR)}h`,
};

function copyAt(ms: number) {
  const reading = readTideAt(series, instant(ms));
  if (reading === null) throw new Error("fixture does not cover this moment");
  return tideNowCopy(reading, ms, format);
}

describe("tideNowCopy", () => {
  it("names the direction and the turn it is heading for", () => {
    const copy = copyAt(BASE + 3 * HOUR);
    expect(copy.headline).toBe("Rising toward high tide at 18:00");
    expect(copy.upcoming).toBe("High of 1.6 m in 3h.");
  });

  it("says falling on the ebb", () => {
    expect(copyAt(BASE + 9 * HOUR).headline).toBe("Falling toward low tide at 00:00");
  });

  it("puts slack at the turn it belongs to", () => {
    expect(copyAt(BASE + 6 * HOUR + 5 * 60 * 1000).headline).toMatch(/^(Slack|Nearly slack) at high tide$/);
  });

  it("fills the staff from low to high between the bounding turns", () => {
    expect(copyAt(BASE + 3 * HOUR).staffLevel).toBeCloseTo(0.5, 1);
    expect(copyAt(BASE + 5 * HOUR).staffLevel).toBeGreaterThan(0.85);
    expect(copyAt(BASE + 11 * HOUR).staffLevel).toBeLessThan(0.15);
  });
});
