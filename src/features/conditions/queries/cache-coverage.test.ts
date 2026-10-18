import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import { tideSeries } from "@/core/rules/tide";

import { coverageOf, coversWindow, hourlyCovers } from "./cache-coverage";
import { BLOCK_DAYS, blockBounds, blockIndexAt, blockRuns, blocksCovering } from "./hourly-blocks";
import { windowAround } from "./use-tide-series";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 18, 17, 0);

function seriesBetween(fromMs: number, toMs: number) {
  return tideSeries({
    station: { id: "9410580", name: "Newport Bay", timeZone: "America/Los_Angeles", datum: "MLLW" },
    samples: [
      { at: instant(fromMs), height: metres(0.1), turn: "low" },
      { at: instant(toMs), height: metres(1.5), turn: "high" },
    ],
    provider: "noaa-coops",
    retrievedAt: instant(NOW),
  });
}

describe("hourly blocks", () => {
  it("puts an instant in the same block whatever it was reached from", () => {
    const b = blockBounds(blockIndexAt(NOW));
    expect(b.fromMs).toBeLessThanOrEqual(NOW);
    expect(b.endMs).toBeGreaterThan(NOW);
    expect(b.endMs - b.fromMs).toBe(BLOCK_DAYS * DAY);
    expect(blockIndexAt(b.fromMs)).toBe(blockIndexAt(b.endMs - 1));
    expect(blockIndexAt(b.endMs)).toBe(blockIndexAt(b.fromMs) + 1);
  });

  it("keeps every block request inside NOAA's one-year hourly limit", () => {
    expect(BLOCK_DAYS).toBeLessThanOrEqual(365);
    const b = blockBounds(0);
    expect((b.lastDayMs - b.fromMs) / DAY + 1).toBe(BLOCK_DAYS);
  });

  it("lists the blocks a 9-day slice touches, at both ends of the range", () => {
    for (const edge of [NOW - 730 * DAY, NOW + 730 * DAY]) {
      const blocks = blocksCovering(edge - 4 * DAY, edge + 5 * DAY);
      expect(blocks.length).toBeGreaterThanOrEqual(1);
      expect(blocks.length).toBeLessThanOrEqual(2);
      expect(blocks[0]).toBe(blockIndexAt(edge - 4 * DAY));
      expect(blocks[blocks.length - 1]).toBe(blockIndexAt(edge + 5 * DAY));
    }
  });

  it("joins adjacent blocks into one run and keeps gaps apart", () => {
    const runs = blockRuns([5, 3, 4, 9, 4]);
    expect(runs).toHaveLength(2);
    expect(runs[0]).toEqual({ fromMs: blockBounds(3).fromMs, toMs: blockBounds(5).endMs });
    expect(runs[1]).toEqual({ fromMs: blockBounds(9).fromMs, toMs: blockBounds(9).endMs });
  });
});

describe("cache coverage", () => {
  const want = windowAround(NOW);

  it("accepts a series that reaches both −730 d and +730 d", () => {
    const full = seriesBetween(want.turnsFromMs, want.turnsToMs);
    expect(coversWindow(full, want.turnsFromMs, want.turnsToMs)).toBe(true);
  });

  it("rejects a cache that stops at +365 d (the earlier one-year build)", () => {
    const yearOnly = seriesBetween(NOW - 2 * DAY, NOW + 365 * DAY);
    expect(coversWindow(yearOnly, want.turnsFromMs, want.turnsToMs)).toBe(false);
  });

  it("rejects a cache missing the −730 d end, and one missing the +730 d end", () => {
    expect(coversWindow(seriesBetween(NOW - 365 * DAY, want.turnsToMs), want.turnsFromMs, want.turnsToMs)).toBe(false);
    expect(coversWindow(seriesBetween(want.turnsFromMs, NOW + 365 * DAY), want.turnsFromMs, want.turnsToMs)).toBe(false);
  });

  it("tolerates a day of drift, so a cache from this morning still counts", () => {
    const morning = seriesBetween(want.turnsFromMs - 6 * 60 * 60 * 1000 + DAY / 2, want.turnsToMs - DAY / 2);
    expect(coversWindow(morning, want.turnsFromMs, want.turnsToMs)).toBe(true);
  });

  it("reports what is actually held, not what could be fetched", () => {
    const cov = coverageOf(seriesBetween(want.turnsFromMs, want.turnsToMs), [blockIndexAt(NOW), blockIndexAt(NOW) + 1]);
    expect(cov.turns).toEqual({ fromMs: want.turnsFromMs, toMs: want.turnsToMs });
    expect(cov.hourly).toHaveLength(1);
    expect(hourlyCovers(cov, NOW, NOW + DAY)).toBe(true);
    expect(hourlyCovers(cov, NOW + 700 * DAY, NOW + 701 * DAY)).toBe(false);
    expect(coverageOf(null, [])).toEqual({ turns: null, hourly: [] });
  });
});
