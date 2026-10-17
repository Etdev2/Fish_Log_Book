import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import { tideSeries, type TidePredictionSample } from "@/core/rules/tide";

import { cacheCoversNow, isCacheFresh, trimToRange, windowAround } from "./use-tide-series";
import { hourlyCovers, withHourly } from "./use-week-hourly";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = DAY / 24;

function build(fetchedAt: number, opts: { turnsFrom: number; turnsTo: number; hourlyFrom: number; hourlyTo: number }) {
  const samples: TidePredictionSample[] = [];
  for (let t = opts.hourlyFrom; t <= opts.hourlyTo; t += HOUR) samples.push({ at: instant(t), height: metres(1), turn: null });
  for (let t = opts.turnsFrom; t <= opts.turnsTo; t += 6 * HOUR + 7)
    samples.push({ at: instant(t), height: metres(0.5), turn: samples.length % 2 ? "high" : "low" });
  samples.sort((a, b) => Number(a.at) - Number(b.at));
  return tideSeries({
    station: { id: "9410580", name: "Newport Bay", timeZone: "America/Los_Angeles", datum: "MLLW" },
    samples,
    provider: "noaa-coops",
    retrievedAt: instant(fetchedAt),
  });
}

function fetched(at: number) {
  const w = windowAround(at);
  return build(at, { turnsFrom: w.turnsFromMs, turnsTo: w.turnsToMs, hourlyFrom: w.fromMs, hourlyTo: w.toMs });
}

const T0 = Date.UTC(2026, 9, 16, 19);

describe("cached turn coverage against the current day (Codex P2, #163)", () => {
  it("is fresh right after fetching", () => {
    expect(isCacheFresh(fetched(T0), T0)).toBe(true);
  });

  it("stays a full year ahead for days after the fetch, thanks to the overlap", () => {
    expect(isCacheFresh(fetched(T0), T0 + 4 * DAY)).toBe(true);
  });

  it("is stale when the turns no longer reach today + 365 d", () => {
    const old = build(T0, { turnsFrom: T0 - 365 * DAY, turnsTo: T0 + 365 * DAY, hourlyFrom: T0 - 2 * DAY, hourlyTo: T0 + 7 * DAY });
    expect(isCacheFresh(old, T0 + 3 * DAY)).toBe(false);
  });

  it("drops an offline cache that does not cover now", () => {
    const series = fetched(T0);
    expect(cacheCoversNow(series, T0)).toBe(true);
    expect(cacheCoversNow(series, T0 + 400 * DAY)).toBe(false);
  });

  it("trims to today ±365 d", () => {
    const trimmed = trimToRange(fetched(T0), T0);
    expect(Number(trimmed.samples.at(-1)!.at) - T0).toBeLessThanOrEqual(366 * DAY);
    expect(T0 - Number(trimmed.samples[0].at)).toBeLessThanOrEqual(366 * DAY);
  });
});

describe("hourly detail for a distant week (Codex P1)", () => {
  it("knows a far week has only turns, and merges fetched hourly points in", () => {
    const series = fetched(T0);
    const from = T0 + 200 * DAY;
    const to = from + 7 * DAY;
    expect(hourlyCovers(series, from, to)).toBe(false);
    const extra: TidePredictionSample[] = [];
    for (let t = from - DAY; t <= to + DAY; t += HOUR) extra.push({ at: instant(t), height: metres(0.9), turn: null });
    const merged = withHourly(series, extra);
    expect(hourlyCovers(merged, from, to)).toBe(true);
    expect(merged.samples.filter((s) => s.turn !== null).length).toBe(series.samples.filter((s) => s.turn !== null).length);
  });
});
