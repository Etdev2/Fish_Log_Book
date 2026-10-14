import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import { tideSeries } from "@/core/rules/tide";

import { isoDay, sliceSeries, viewWindowAround } from "./view-window";

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
