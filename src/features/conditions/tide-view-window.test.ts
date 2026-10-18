import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import { tideSeries } from "@/core/rules/tide";

import { inWindow, sliceSeries, viewWindowAround, VIEW_DAYS } from "./tide-view-window";

const DAY = 24 * 60 * 60 * 1000;
const START = Date.UTC(2026, 9, 16);
const END = START + 367 * DAY;

describe("viewWindowAround", () => {
  it("is a week wide and centred when there is room", () => {
    const centre = START + 100 * DAY;
    const w = viewWindowAround(centre, START, END);
    expect(w.to - w.from).toBe(VIEW_DAYS * DAY);
    expect((w.from + w.to) / 2).toBe(centre);
  });

  it("slides inward at the start and the end of the range", () => {
    const first = viewWindowAround(START, START, END);
    expect(first).toEqual({ from: START, to: START + VIEW_DAYS * DAY });
    const last = viewWindowAround(END, START, END);
    expect(last).toEqual({ from: END - VIEW_DAYS * DAY, to: END });
  });

  it("can reach the last day of the year ahead", () => {
    const w = viewWindowAround(END - 1000, START, END);
    expect(inWindow(END - 1000, w)).toBe(true);
  });

  it("returns a short series whole", () => {
    expect(viewWindowAround(START + DAY, START, START + 5 * DAY)).toEqual({
      from: START,
      to: START + 5 * DAY,
    });
  });
});

describe("sliceSeries", () => {
  const hourly = Array.from({ length: 367 * 4 }, (_, i) => ({
    at: instant(START + i * 6 * 60 * 60 * 1000),
    height: metres(1),
    turn: null,
  }));
  const full = tideSeries({
    station: { id: "9410580", name: "Newport Bay", timeZone: "America/Los_Angeles", datum: "MLLW" },
    samples: hourly,
    provider: "noaa-coops",
    retrievedAt: instant(START),
  });

  it("keeps only samples inside the window, ascending", () => {
    const w = viewWindowAround(START + 200 * DAY, START, END);
    const slice = sliceSeries(full, w);
    expect(slice.samples.length).toBeLessThan(full.samples.length);
    expect(Number(slice.samples[0].at)).toBeGreaterThanOrEqual(w.from);
    expect(Number(slice.samples[slice.samples.length - 1].at)).toBeLessThanOrEqual(w.to);
    expect(slice.station.id).toBe("9410580");
    expect(slice.retrievedAt).toBe(full.retrievedAt);
  });

  it("falls back to the whole series when the window holds no samples", () => {
    expect(sliceSeries(full, { from: END + DAY, to: END + 2 * DAY })).toBe(full);
  });
});
