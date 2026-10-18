import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import type { TidePredictionSample } from "@/core/rules/tide";

import { chunkRange, mergeSamples, HORIZON_DAYS, MAX_REQUEST_DAYS } from "./noaa-tides";
import { windowAround } from "./use-tide-series";

const DAY = 24 * 60 * 60 * 1000;
const days = (c: { fromMs: number; toMs: number }) => (c.toMs - c.fromMs) / DAY + 1;

/**
 * The parser and the merge, tested against NOAA's documented response shape and the shape
 * recorded in `tide-fixture.ts` from a real fetch.
 *
 * Stated plainly: this has NOT been run against the live API — the machine that wrote it
 * has no route to tidesandcurrents.noaa.gov. These pin the mapping so that when it does
 * reach the real service the failure modes are the ones we chose, not a silent wrong curve.
 */
const sample = (atMs: number, m: number, turn: "high" | "low" | null): TidePredictionSample => ({
  at: instant(atMs),
  height: metres(m),
  turn,
});

describe("merging the hourly curve with the turning points", () => {
  it("keeps both sets, in ascending order", () => {
    const merged = mergeSamples(
      [sample(3_000, 1.1, null), sample(1_000, 1.0, null)],
      [sample(2_000, 1.6, "high")],
    );
    expect(merged.map((s) => s.at as number)).toEqual([1_000, 2_000, 3_000]);
  });

  it("lets the turning point win a collision — it carries the high/low mark", () => {
    const merged = mergeSamples(
      [sample(1_000, 1.0, null)],
      [sample(1_000, 1.63, "high")],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].turn).toBe("high");
    expect(merged[0].height as number).toBeCloseTo(1.63);
  });

  it("produces strictly ascending instants, which tideSeries requires", () => {
    const merged = mergeSamples(
      [sample(1_000, 1, null), sample(2_000, 2, null), sample(3_000, 3, null)],
      [sample(2_000, 2.2, "low"), sample(1_500, 1.5, "high")],
    );
    for (let i = 1; i < merged.length; i++) {
      expect(merged[i].at as number).toBeGreaterThan(merged[i - 1].at as number);
    }
  });

  it("survives an empty turning-point list", () => {
    expect(mergeSamples([sample(1_000, 1, null)], [])).toHaveLength(1);
  });
});

describe("chunking a long range (ADR 011: no request over one year)", () => {
  it("keeps a short range as a single request", () => {
    const from = Date.UTC(2026, 9, 18);
    expect(chunkRange(from, from + 6 * DAY)).toHaveLength(1);
  });

  it("splits today -2 d … today +365 d into two requests, none over 365 days", () => {
    const today = Date.UTC(2026, 9, 18, 15, 30);
    const chunks = chunkRange(today - 2 * DAY, today + HORIZON_DAYS * DAY);
    expect(chunks).toHaveLength(2);
    for (const c of chunks) expect(days(c)).toBeLessThanOrEqual(MAX_REQUEST_DAYS);
  });

  it("covers every day with no gap and no overlap, across the year boundary", () => {
    const from = Date.UTC(2026, 11, 20, 8); // Dec 20 2026
    const to = Date.UTC(2027, 11, 20, 8); // Dec 20 2027
    const chunks = chunkRange(from, to, 100);
    expect(chunks[0].fromMs).toBe(Date.UTC(2026, 11, 20));
    expect(chunks[chunks.length - 1].toMs).toBe(Date.UTC(2027, 11, 20));
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].fromMs - chunks[i - 1].toMs).toBe(DAY);
    }
    expect(chunks.reduce((n, c) => n + days(c), 0)).toBe(366);
  });

  it("allows exactly 365 days in one request and splits at 366", () => {
    const from = Date.UTC(2026, 0, 1);
    expect(chunkRange(from, from + 364 * DAY)).toHaveLength(1);
    expect(chunkRange(from, from + 365 * DAY)).toHaveLength(2);
  });
});

describe("the fetch window", () => {
  it("asks for hourly across the near week and turns a year out", () => {
    const now = Date.UTC(2026, 9, 18, 12);
    const w = windowAround(now);
    expect(w.fromMs).toBe(now - 2 * DAY);
    expect(w.toMs).toBe(now + 5 * DAY);
    expect(w.turnsToMs).toBe(now + 365 * DAY);
    for (const c of chunkRange(w.fromMs, w.turnsToMs)) expect(days(c)).toBeLessThanOrEqual(365);
    for (const c of chunkRange(w.fromMs, w.toMs)) expect(days(c)).toBeLessThanOrEqual(365);
  });
});
