import { describe, expect, it } from "vitest";

import {
  DEFAULT_CHART_HEIGHT,
  MS_PER_PIXEL,
  PLOT_TOP,
  atFromScrollLeft,
  localDayIndex,
  makeYFor,
  plotHeightFor,
  scrollLeftFor,
  visibleLabelFlags,
} from "./tide-chart-geometry";
import { metres } from "@/core/units";

const SERIES_START = Date.UTC(2026, 7, 28, 8, 0, 0);

describe("scroll <-> time", () => {
  it("round-trips an instant through the scroll position it centres on", () => {
    for (const offsetHours of [0, 1, 6, 23.5, 47, 120]) {
      const at = SERIES_START + offsetHours * 3_600_000;
      expect(atFromScrollLeft(scrollLeftFor(at, SERIES_START), SERIES_START)).toBeCloseTo(at, 3);
    }
  });

  it("moves forward in time as the track scrolls right", () => {
    const early = atFromScrollLeft(100, SERIES_START);
    const later = atFromScrollLeft(200, SERIES_START);
    expect(later).toBeGreaterThan(early);
    // Sub-millisecond: the operands are epoch milliseconds, where a double has about
    // 1e-4 ms of resolution left. Nothing on screen is a fraction of a millisecond.
    expect(later - early).toBeCloseTo(100 * MS_PER_PIXEL, 3);
  });

  it("keeps a whole day exactly one day's width apart", () => {
    const day = 86_400_000;
    const oneDayOn = scrollLeftFor(SERIES_START + day, SERIES_START) - scrollLeftFor(SERIES_START, SERIES_START);
    expect(oneDayOn).toBeCloseTo(day / MS_PER_PIXEL, 6);
  });
});

describe("visibleLabelFlags", () => {
  it("keeps labels that clear the minimum gap", () => {
    expect(visibleLabelFlags([0, 100, 200], 78)).toEqual([true, true, true]);
  });

  it("drops the later of two labels that would overlap", () => {
    expect(visibleLabelFlags([0, 40, 200], 78)).toEqual([true, false, true]);
  });

  it("measures each gap from the last label actually kept, not the last one seen", () => {
    // 0 keeps; 40 drops; 90 is 90 from the kept label at 0, so it keeps too — measuring
    // from the dropped 40 would have thrown away a label with room to spare.
    expect(visibleLabelFlags([0, 40, 90], 78)).toEqual([true, false, true]);
  });

  it("has nothing to thin in an empty chart", () => {
    expect(visibleLabelFlags([], 78)).toEqual([]);
  });
});

describe("plot box", () => {
  it("gives the curve every pixel the viewport has left over", () => {
    expect(plotHeightFor(500)).toBe(500 - PLOT_TOP - 30);
    expect(plotHeightFor(DEFAULT_CHART_HEIGHT)).toBeGreaterThan(0);
  });

  it("never collapses the plot, however short the viewport claims to be", () => {
    expect(plotHeightFor(0)).toBeGreaterThan(0);
    expect(plotHeightFor(-100)).toBeGreaterThan(0);
  });

  it("scales heights into the measured box, high water at the top", () => {
    const yFor = makeYFor(0, 2, 400);
    expect(yFor(metres(2))).toBeCloseTo(PLOT_TOP, 6);
    expect(yFor(metres(0))).toBeCloseTo(PLOT_TOP + plotHeightFor(400), 6);
    expect(yFor(metres(1))).toBeLessThan(yFor(metres(0)));
  });
});

describe("localDayIndex", () => {
  it("counts station calendar days, not 24-hour blocks", () => {
    const zone = "America/Los_Angeles";
    // 08:00 UTC on the 28th is 01:00 local on the 28th; 08:00 UTC on the 29th is the 29th.
    expect(localDayIndex(SERIES_START, SERIES_START, zone)).toBe(0);
    expect(localDayIndex(SERIES_START + 86_400_000, SERIES_START, zone)).toBe(1);
    // 20:00 UTC on the 28th is still 13:00 local the same day.
    expect(localDayIndex(SERIES_START + 12 * 3_600_000, SERIES_START, zone)).toBe(0);
  });
});
