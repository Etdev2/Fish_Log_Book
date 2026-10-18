import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import { heightAt, tideSeries, type TidePredictionSample } from "@/core/rules/tide";

import {
  inWindow,
  renderWindowAround,
  windowSeries,
  RENDER_DAYS,
  RENDER_MARGIN_DAYS,
} from "./tide-view-window";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const TODAY = Date.UTC(2026, 9, 18, 17);
const START = TODAY - 730 * DAY;
const END = TODAY + 730 * DAY;

describe("renderWindowAround", () => {
  it("draws nine days, with at least 3.5 either side of the read-head, anywhere in the range", () => {
    for (let k = 0; k <= 1460; k += 37) {
      const at = START + k * DAY + (k % 7) * HOUR;
      const w = renderWindowAround(at, START, END);
      expect(inWindow(at, w)).toBe(true);
      if (w.from > START) expect(at - w.from).toBeGreaterThanOrEqual(RENDER_MARGIN_DAYS * DAY);
      if (w.to < END) expect(w.to - at).toBeGreaterThanOrEqual(RENDER_MARGIN_DAYS * DAY);
      expect(w.to - w.from).toBeLessThanOrEqual(RENDER_DAYS * DAY);
    }
  });

  it("reaches the −730 d end and the +730 d end of the range", () => {
    const first = renderWindowAround(START, START, END);
    expect(first.from).toBe(START);
    expect(inWindow(START, first)).toBe(true);
    const last = renderWindowAround(END, START, END);
    expect(last.to).toBe(END);
    expect(inWindow(END, last)).toBe(true);
  });

  it("holds still while the read-head moves within a two-day step", () => {
    const a = renderWindowAround(TODAY, START, END);
    const b = renderWindowAround(TODAY + 6 * HOUR, START, END);
    expect(b).toEqual(a);
  });

  it("returns a short range whole (the bundled sample)", () => {
    expect(renderWindowAround(START + DAY, START, START + 5 * DAY)).toEqual({ from: START, to: START + 5 * DAY });
  });
});

describe("windowSeries", () => {
  const station = { id: "9410580", name: "Newport Bay", timeZone: "America/Los_Angeles", datum: "MLLW" } as const;
  // High/lows every ~6 h across the whole range, like the hilo request.
  const turns: TidePredictionSample[] = Array.from({ length: 1461 * 4 }, (_, i) => ({
    at: instant(START + i * 6 * HOUR),
    height: metres(i % 2 === 0 ? 0.2 : 1.6),
    turn: i % 2 === 0 ? "low" : "high",
  }));
  const base = tideSeries({ station, samples: turns, provider: "noaa-coops", retrievedAt: instant(TODAY) });

  it("holds only the slice, not the range", () => {
    const w = renderWindowAround(TODAY, START, END);
    const slice = windowSeries(base, [], w);
    expect(slice.samples.length).toBeLessThan(base.samples.length / 100);
    expect(Number(slice.samples[0].at)).toBeGreaterThanOrEqual(w.from);
    expect(Number(slice.samples[slice.samples.length - 1].at)).toBeLessThanOrEqual(w.to);
    expect(slice.station.id).toBe("9410580");
  });

  it("works at both ends of the range", () => {
    for (const edge of [START, END]) {
      const w = renderWindowAround(edge, START, END);
      const slice = windowSeries(base, [], w);
      expect(heightAt(slice, instant(edge))).not.toBeNull();
    }
  });

  it("lays real hourly points between the turns, and a turn wins a collision", () => {
    const w = renderWindowAround(TODAY, START, END);
    const hourly: TidePredictionSample[] = [];
    for (let t = w.from; t <= w.to; t += HOUR) hourly.push({ at: instant(t), height: metres(1), turn: null });
    const slice = windowSeries(base, hourly, w);
    expect(slice.samples.length).toBeGreaterThan(8 * 24);
    const turnsInWindow = turns.filter((s) => Number(s.at) >= w.from && Number(s.at) <= w.to).length;
    expect(slice.samples.filter((s) => s.turn !== null)).toHaveLength(turnsInWindow);
    for (let i = 1; i < slice.samples.length; i++) {
      expect(Number(slice.samples[i].at)).toBeGreaterThan(Number(slice.samples[i - 1].at));
    }
  });

  it("labels a stretch with no hourly points 'high/low turns only', and one with them 'hourly'", () => {
    const w = renderWindowAround(TODAY, START, END);
    const noon = instant(TODAY + 1 * HOUR + 17 * 60_000);
    const turnsOnly = heightAt(windowSeries(base, [], w), noon);
    expect(turnsOnly?.certainty).toBe("interpolated");
    expect(turnsOnly?.basis).toMatch(/high\/low turns only/);

    const hourly: TidePredictionSample[] = [];
    for (let t = w.from; t <= w.to; t += HOUR) hourly.push({ at: instant(t), height: metres(1), turn: null });
    const withHourly = heightAt(windowSeries(base, hourly, w), noon);
    expect(withHourly?.certainty).toBe("interpolated");
    expect(withHourly?.basis).toMatch(/hourly/);
    expect(withHourly?.basis).not.toMatch(/turns only/);
  });
});
