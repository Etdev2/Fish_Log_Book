/**
 * Opt-in check against the real NOAA service: `NOAA_LIVE=1 npx vitest run noaa-tides.live`.
 * Skipped in CI so the gate never depends on a third-party API being up.
 */
import { describe, expect, it } from "vitest";

import { stationById } from "../stations";
import { fetchTideSeries } from "./noaa-tides";
import { windowAround } from "./use-tide-series";

const DAY = 24 * 60 * 60 * 1000;

/**
 * FL-1 acceptance spot-checks (#135): station 9410580, MLLW, metric, GMT, hilo. Times are
 * UTC; heights in metres.
 */
const SPOT_CHECKS: Record<string, readonly (readonly [string, "high" | "low", number])[]> = {
  "2025-10-20": [["04:00", "high", 1.432], ["09:46", "low", 0.323], ["15:59", "high", 1.729], ["22:32", "low", 0.076]],
  "2026-10-16": [["02:43", "low", 0.242], ["19:18", "high", 1.44]],
  "2027-10-15": [["04:24", "high", 1.403], ["10:00", "low", 0.375], ["16:13", "high", 1.789], ["22:52", "low", 0.013]],
};

describe.skipIf(process.env.NOAA_LIVE !== "1")("live NOAA CO-OPS", () => {
  it("returns a year of turns either side of now plus a week of hourly detail", async () => {
    const station = stationById("9410580")!;
    const now = Date.now();
    const series = await fetchTideSeries(station, windowAround(now));
    const first = Number(series.samples[0].at);
    const last = Number(series.samples.at(-1)!.at);
    const turns = series.samples.filter((s) => s.turn !== null).length;
    console.log(`samples=${series.samples.length} turns=${turns} first=${new Date(first).toISOString()} last=${new Date(last).toISOString()}`);
    expect(now - first).toBeGreaterThan(363 * DAY);
    expect(last - now).toBeGreaterThan(363 * DAY);
    expect(turns).toBeGreaterThan(2500);
  }, 60_000);

  it("matches the ticket's spot-check turns", async () => {
    const station = stationById("9410580")!;
    // Fixed window so the 2025 and 2027 dates stay in range whenever this is run.
    const series = await fetchTideSeries(station, {
      fromMs: Date.UTC(2026, 9, 16),
      toMs: Date.UTC(2026, 9, 17),
      turnsFromMs: Date.UTC(2025, 9, 16),
      turnsToMs: Date.UTC(2027, 9, 16),
    });
    for (const [day, expected] of Object.entries(SPOT_CHECKS)) {
      const got = series.samples
        .filter((s) => s.turn !== null && new Date(Number(s.at)).toISOString().startsWith(day))
        .map((s) => [new Date(Number(s.at)).toISOString().slice(11, 16), s.turn, Number(s.height)] as const);
      console.log(day, JSON.stringify(got));
      expect(got).toEqual(expected);
    }
  }, 60_000);
});
