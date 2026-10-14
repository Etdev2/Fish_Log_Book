/**
 * Opt-in check against the real NOAA service: `NOAA_LIVE=1 npx vitest run noaa-tides.live`.
 * Skipped in CI so the gate never depends on a third-party API being up.
 */
import { describe, expect, it } from "vitest";

import { stationById } from "../stations";
import { fetchTideSeries } from "./noaa-tides";
import { windowAround } from "./use-tide-series";

describe.skipIf(process.env.NOAA_LIVE !== "1")("live NOAA CO-OPS", () => {
  it("returns two years of turns plus a week of hourly detail for Newport Bay", async () => {
    const station = stationById("9410580")!;
    const now = Date.now();
    const series = await fetchTideSeries(station, windowAround(now));
    const last = Number(series.samples.at(-1)!.at);
    const turns = series.samples.filter((s) => s.turn !== null).length;
    console.log(`samples=${series.samples.length} turns=${turns} lastTurn=${new Date(last).toISOString()}`);
    expect(last - now).toBeGreaterThan(725 * 24 * 60 * 60 * 1000);
    expect(turns).toBeGreaterThan(2500);
  }, 60_000);
});
