import { describe, expect, it } from "vitest";

import { tideSeries } from "@/core/rules/tide";
import { instant, metres } from "@/core/units";
import { seriesCoversNow } from "./tide-cache";

const HOUR = 3_600_000;
const start = Date.UTC(2026, 9, 10, 0, 0, 0);

/** A week of hourly samples from `start`, the shape the cache stores. */
const week = tideSeries({
  station: { id: "9410580", name: "Newport Bay Entrance", timeZone: "America/Los_Angeles", datum: "MLLW" },
  samples: Array.from({ length: 7 * 24 + 1 }, (_, i) => ({
    at: instant(start + i * HOUR),
    height: metres(1),
    turn: null,
  })),
  provider: "noaa-coops",
  retrievedAt: instant(start),
});

describe("whether a saved tide series still reaches now (#163)", () => {
  it("covers a moment inside its week", () => {
    expect(seriesCoversNow(week, start + 3 * 24 * HOUR)).toBe(true);
  });

  it("covers its own first and last sample", () => {
    expect(seriesCoversNow(week, start)).toBe(true);
    expect(seriesCoversNow(week, start + 7 * 24 * HOUR)).toBe(true);
  });

  it("does not cover a day after it ends, so the offline fallback skips it", () => {
    expect(seriesCoversNow(week, start + 8 * 24 * HOUR)).toBe(false);
  });

  it("does not cover a moment before it starts", () => {
    expect(seriesCoversNow(week, start - HOUR)).toBe(false);
  });
});
