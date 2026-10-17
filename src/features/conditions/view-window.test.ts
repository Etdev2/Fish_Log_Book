import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import { tideSeries } from "@/core/rules/tide";

import {
  compactRange,
  dailyRanges,
  hasHourly,
  isoDay,
  placeMonthLabels,
  sliceSeries,
  stationNoonOf,
  viewWindowAround,
  ZOOM_SPAN_DAYS,
} from "./view-window";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const BASE = Date.UTC(2026, 9, 1);

/** Two years of six-hourly samples — the shape of a turns-only long-range series. */
const long = tideSeries({
  station: { id: "9410580", name: "Newport Bay Entrance", timeZone: "America/Los_Angeles", datum: "MLLW" },
  samples: Array.from({ length: 4 * 730 }, (_, i) => ({
    at: instant(BASE + i * 6 * HOUR),
    height: metres(i % 2 === 0 ? 0.2 : 1.6),
    turn: i % 2 === 0 ? ("low" as const) : ("high" as const),
  })),
  provider: "noaa-coops",
  retrievedAt: instant(BASE),
});

describe("the chart's view window", () => {
  it("slices a two-year series down to about a week around the anchor", () => {
    const anchor = BASE + 500 * DAY;
    const { fromMs, toMs } = viewWindowAround(anchor);
    const view = sliceSeries(long, fromMs, toMs);
    expect(view.samples.length).toBeLessThan(40);
    expect(Number(view.samples[0].at)).toBeLessThanOrEqual(fromMs);
    expect(Number(view.samples.at(-1)!.at)).toBeGreaterThanOrEqual(toMs);
  });

  it("keeps station and provenance, so the stale badge still tells the truth", () => {
    const view = sliceSeries(long, BASE + 10 * DAY, BASE + 17 * DAY);
    expect(view.station).toEqual(long.station);
    expect(view.retrievedAt).toEqual(long.retrievedAt);
  });

  it("returns the series untouched when the window covers all of it", () => {
    expect(sliceSeries(long, BASE - DAY, BASE + 800 * DAY)).toBe(long);
  });

  it("clamps an anchor past the end to the last samples rather than throwing", () => {
    const view = sliceSeries(long, BASE + 900 * DAY, BASE + 907 * DAY);
    expect(view.samples.length).toBeGreaterThan(0);
  });

  it("formats day bounds for a date input on the station's calendar", () => {
    expect(isoDay(BASE + 12 * 60 * 60 * 1000, "America/Los_Angeles")).toBe("2026-10-01");
    // 00:00 UTC Oct 1 is still Sep 30 in Pacific time.
    expect(isoDay(BASE, "America/Los_Angeles")).toBe("2026-09-30");
    // 6 p.m. PDT Oct 1 is already Oct 2 in UTC; the station day must not jump ahead.
    expect(isoDay(BASE + 25 * 60 * 60 * 1000, "America/Los_Angeles")).toBe("2026-10-01");
  });
});

describe("dailyRanges", () => {
  it("groups turns by station day and keeps the extremes", () => {
    const at = (iso: string) => instant(Date.parse(iso));
    const series = tideSeries({
      station: { id: "9410580", name: "Newport Bay", timeZone: "America/Los_Angeles", datum: "MLLW" },
      samples: [
        // 2026-10-16 02:43 UTC is still Oct 15 in Pacific time.
        { at: at("2026-10-16T02:43:00Z"), height: metres(0.242), turn: "low" },
        { at: at("2026-10-16T09:00:00Z"), height: metres(0.9), turn: null },
        { at: at("2026-10-16T19:18:00Z"), height: metres(1.44), turn: "high" },
        { at: at("2026-10-17T03:10:00Z"), height: metres(0.31), turn: "low" },
      ],
      provider: "noaa-coops",
      retrievedAt: instant(0),
    });
    const days = dailyRanges(series, "America/Los_Angeles");
    expect(days.map((d) => d.day)).toEqual(["2026-10-15", "2026-10-16"]);
    expect(days[1]).toMatchObject({ lowM: 0.31, highM: 1.44 });
    expect(hasHourly(series)).toBe(true);
  });

  it("sizes the zoom levels as week, month and year", () => {
    expect(ZOOM_SPAN_DAYS).toEqual({ week: 7, month: 31, year: 365 });
  });
});

describe("today on the station calendar (picker showed yesterday in Pacific time)", () => {
  const LA = "America/Los_Angeles";
  it("Fri Oct 16 2026 5:25 PM PDT is Oct 16, not Oct 15", () => {
    const now = Date.parse("2026-10-17T00:25:00Z");
    expect(isoDay(stationNoonOf(now, LA), LA)).toBe("2026-10-16");
  });
  it("early morning PDT is still the same station day", () => {
    const now = Date.parse("2026-10-16T08:00:00Z"); // 1 AM PDT
    expect(isoDay(stationNoonOf(now, LA), LA)).toBe("2026-10-16");
  });
  it("anchors at local noon", () => {
    expect(new Date(stationNoonOf(Date.parse("2026-10-17T00:25:00Z"), LA)).toISOString()).toBe("2026-10-16T19:00:00.000Z");
    expect(new Date(stationNoonOf(Date.parse("2026-01-10T00:00:00Z"), LA)).toISOString()).toBe("2026-01-09T20:00:00.000Z");
  });
});

describe("toolbar range label fits a phone", () => {
  it("is compact", () => {
    const label = compactRange(Date.parse("2025-10-16T20:00:00Z"), Date.parse("2027-10-16T20:00:00Z"), "America/Los_Angeles");
    expect(label).toBe("Oct 16 '25 – Oct 16 '27");
    expect(label.length).toBeLessThanOrEqual(24);
  });
});

describe("year-view month labels never overlap", () => {
  const charPx = 9.6;
  const dayPx = 390 / 365;
  // Oct 16 2026 start, then month starts through Oct 2027.
  const starts = [
    { index: 0, label: "Oct" },
    { index: 16, label: "Nov" },
    { index: 46, label: "Dec" },
    { index: 77, label: "Jan '27" },
    { index: 108, label: "Feb" },
    { index: 136, label: "Mar" },
    { index: 167, label: "Apr" },
  ];
  const kept = placeMonthLabels(starts, dayPx, charPx);
  it("keeps January (the year) and spaces the rest", () => {
    expect(kept.map((k) => k.label)).toContain("Jan '27");
    for (let i = 1; i < kept.length; i++) {
      const prevRight = kept[i - 1].index * dayPx + 4 + kept[i - 1].label.length * charPx;
      expect(kept[i].index * dayPx).toBeGreaterThanOrEqual(prevRight);
    }
  });
  it("keeps every label in month view where they fit", () => {
    expect(placeMonthLabels(starts, 390 / 31, charPx)).toHaveLength(starts.length);
  });
});
