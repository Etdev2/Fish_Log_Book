import { describe, expect, it } from "vitest";

import { degrees, instant, metres, metresPerHour } from "@/core/units";
import {
  calendarDayNumber,
  calendarWeekday,
  clock,
  compactDate,
  dayLabel,
  dividerDay,
  formatCoordinates,
  formatCountdown,
  formatDurationMagnitude,
  formatHeight,
  formatLunarAge,
  formatMoonIllumination,
  formatMoonPhaseName,
  formatMotion,
  formatPace,
  formatRate,
  hourLabel,
  hourLabels,
  monthDay,
  stationHour,
  toDisplayHeight,
  toDisplayRate,
  zoneAbbreviation,
} from "./format";

/** The station zone every tide time is anchored to. */
const ZONE = "America/Los_Angeles";
/** 2026-08-28 08:00 UTC — 01:00 PDT (summer time, UTC-7). */
const SUMMER_MORNING = instant(Date.UTC(2026, 7, 28, 8, 0, 0));
/** 2026-01-15 20:00 UTC — 12:00 PST (winter time, UTC-8). */
const WINTER_NOON = instant(Date.UTC(2026, 0, 15, 20, 0, 0));

describe("unit conversion", () => {
  it("converts metres to feet with the NOAA datum factor", () => {
    expect(toDisplayHeight(metres(1), "m")).toBeCloseTo(1, 9);
    expect(toDisplayHeight(metres(1), "ft")).toBeCloseTo(3.280839895, 9);
    expect(toDisplayRate(metresPerHour(1), "ft")).toBeCloseTo(3.280839895, 9);
  });

  it("formats heights with the unit suffix", () => {
    expect(formatHeight(metres(1.036), "m")).toBe("1.04 m");
    expect(formatHeight(metres(1.036), "ft")).toBe("3.40 ft");
  });

  it("always signs the rate, with ± only at exactly zero", () => {
    expect(formatRate(metresPerHour(0.62), "m")).toBe("+0.62 m/hr");
    expect(formatRate(metresPerHour(-0.19), "m")).toBe("-0.19 m/hr");
    expect(formatRate(metresPerHour(0), "m")).toBe("±0.00 m/hr");
  });
});

describe("labels", () => {
  it("spells every motion, pace class and phase name once", () => {
    expect(formatMotion("rising")).toBe("Rising");
    expect(formatMotion("falling")).toBe("Falling");
    expect(formatMotion("near-slack")).toBe("Near slack");
    expect(formatMotion("slack")).toBe("Slack");
    expect(formatPace("very-fast")).toBe("Very fast");
    expect(formatPace("slow")).toBe("Slow");
    expect(formatMoonPhaseName("waxing-crescent")).toBe("Waxing crescent");
    expect(formatMoonPhaseName("full")).toBe("Full moon");
  });

  it("reports illumination as a whole percentage", () => {
    expect(formatMoonIllumination(0.5)).toBe("50% lit");
    expect(formatMoonIllumination(0.999)).toBe("100% lit");
  });
});

describe("clock time", () => {
  it("renders one lowercase 12-hour form, no space before am/pm", () => {
    expect(clock(SUMMER_MORNING, ZONE)).toBe("1:00am");
    expect(clock(instant(Date.UTC(2026, 7, 28, 16, 4, 0)), ZONE)).toBe("9:04am");
    expect(clock(instant(Date.UTC(2026, 7, 28, 23, 30, 0)), ZONE)).toBe("4:30pm");
  });

  it("keeps midnight and noon distinct", () => {
    expect(clock(WINTER_NOON, ZONE)).toBe("12:00pm");
    expect(clock(instant(Date.UTC(2026, 0, 15, 8, 0, 0)), ZONE)).toBe("12:00am");
  });

  it("labels the hour axis in the same form as the reading", () => {
    expect(hourLabel(SUMMER_MORNING, ZONE)).toBe("1am");
    expect(hourLabel(instant(Date.UTC(2026, 7, 28, 19, 0, 0)), ZONE)).toBe("12pm");
  });

  it("reads the zone abbreviation for the instant's own offset", () => {
    expect(zoneAbbreviation(SUMMER_MORNING, ZONE)).toBe("PDT");
    expect(zoneAbbreviation(WINTER_NOON, ZONE)).toBe("PST");
  });
});

describe("calendar dates", () => {
  it("spells the long and short day forms in the same zone", () => {
    expect(dayLabel(SUMMER_MORNING, ZONE)).toBe("Friday, August 28");
    expect(monthDay(SUMMER_MORNING, ZONE)).toBe("Aug 28");
    expect(calendarWeekday(SUMMER_MORNING, ZONE)).toBe("Fri");
    expect(calendarDayNumber(SUMMER_MORNING, ZONE)).toBe("28");
  });

  it("keeps the date control and the chart divider in the same word order", () => {
    // Intl's own weekday+day pattern would return "28 Fri"; the two helpers compose the
    // parts so both say "FRI, AUG 28" / "FRI 28" on one screen.
    expect(compactDate(SUMMER_MORNING, ZONE)).toBe("FRI, AUG 28");
    expect(dividerDay(SUMMER_MORNING, ZONE)).toBe("FRI 28");
  });

  it("reads the station hour in the station's calendar", () => {
    expect(stationHour(SUMMER_MORNING, ZONE)).toBe(1);
    expect(stationHour(instant(Date.UTC(2026, 7, 28, 7, 59, 0)), ZONE)).toBe(0);
  });
});

describe("hourLabels", () => {
  it("labels every third station hour across the window", () => {
    // Window: 2026-08-28 07:00 UTC (midnight PDT) through 2026-08-29 06:59 UTC.
    const start = Date.UTC(2026, 7, 28, 7, 0, 0);
    const end = Date.UTC(2026, 7, 29, 6, 59, 0);
    expect(hourLabels(start, end, ZONE)).toEqual([
      Date.UTC(2026, 7, 28, 10, 0, 0), // 03:00 PDT
      Date.UTC(2026, 7, 28, 13, 0, 0), // 06:00 PDT
      Date.UTC(2026, 7, 28, 16, 0, 0), // 09:00 PDT
      Date.UTC(2026, 7, 28, 19, 0, 0), // 12:00 PDT
      Date.UTC(2026, 7, 28, 22, 0, 0), // 15:00 PDT
      Date.UTC(2026, 7, 29, 1, 0, 0), // 18:00 PDT
      Date.UTC(2026, 7, 29, 4, 0, 0), // 21:00 PDT
    ]);
  });

  it("never labels midnight — the day divider tag already owns it", () => {
    // Midnight PDT is 07:00 UTC on both days; the 07:00 labels are absent above, and an
    // all-night window produces no zero-hour labels.
    const start = Date.UTC(2026, 7, 28, 7, 0, 0);
    const end = Date.UTC(2026, 7, 28, 8, 0, 0);
    expect(hourLabels(start, end, ZONE)).toEqual([]);
  });
});

describe("durations", () => {
  it("says under a minute rather than 0 min", () => {
    expect(formatDurationMagnitude(0)).toBe("under a minute");
    expect(formatDurationMagnitude(30_000)).toBe("under a minute");
  });

  it("uses minutes under an hour, h and h m above", () => {
    expect(formatDurationMagnitude(5 * 60_000)).toBe("5 min");
    expect(formatDurationMagnitude(59 * 60_000)).toBe("59 min");
    expect(formatDurationMagnitude(60 * 60_000)).toBe("1h");
    expect(formatDurationMagnitude(90 * 60_000)).toBe("1h 30m");
    expect(formatDurationMagnitude(3 * 3_600_000)).toBe("3h");
  });

  it("ignores the sign of the delta", () => {
    expect(formatDurationMagnitude(-90 * 60_000)).toBe("1h 30m");
  });

  it("composes countdowns with the direction word", () => {
    expect(formatCountdown(90 * 60_000, "slack")).toBe("1h 30m to slack");
    expect(formatCountdown(-90 * 60_000, "high")).toBe("1h 30m ago (high)");
  });
});

describe("station position and lunar age", () => {
  it("formats coordinates at NOAA's published precision", () => {
    expect(formatCoordinates(degrees(33.6047), degrees(-117.883))).toBe("33.6047° N, 117.8830° W");
    expect(formatCoordinates(degrees(-45.5), degrees(10.25))).toBe("45.5000° S, 10.2500° E");
  });

  it("reports the real elapsed lunar age, not the rounded-down average", () => {
    expect(formatLunarAge(12.36)).toBe("12.4 days since the new moon");
    expect(formatLunarAge(0)).toBe("0.0 days since the new moon");
  });
});
