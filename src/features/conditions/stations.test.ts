import { describe, expect, it } from "vitest";

import { DEFAULT_STATION_ID, TIDE_STATIONS, stationById, stationsByRegion } from "./stations";
import { TIDE_STATION } from "./tide-fixture";

describe("the tide station catalog", () => {
  it("has no duplicate ids", () => {
    const ids = TIDE_STATIONS.map((s) => s.id);
    expect(ids.filter((v, i) => ids.indexOf(v) !== i)).toEqual([]);
  });

  it("defaults to the one station with a bundled offline fixture", () => {
    // If these ever drift apart, the fixture would be offered under another station's
    // name — the one failure this feature must never have.
    expect(DEFAULT_STATION_ID).toBe(TIDE_STATION);
    expect(stationById(DEFAULT_STATION_ID)).not.toBeNull();
  });

  it("gives every station a real IANA time zone and plausible coordinates", () => {
    for (const station of TIDE_STATIONS) {
      expect(() =>
        new Intl.DateTimeFormat(undefined, { timeZone: station.timeZone }).format(new Date()),
      ).not.toThrow();
      expect(Math.abs(station.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(station.longitude)).toBeLessThanOrEqual(180);
    }
  });

  it("uses NOAA's numeric station id format", () => {
    for (const station of TIDE_STATIONS) {
      expect(station.id).toMatch(/^\d{7}$/);
    }
  });

  it("covers both coasts and the Gulf", () => {
    const regions = new Set(TIDE_STATIONS.map((s) => s.region));
    expect(regions.has("Southern California")).toBe(true);
    expect(regions.has("Washington")).toBe(true);
    expect(regions.has("Texas")).toBe(true);
    expect(regions.has("Maine")).toBe(true);
  });

  it("groups without losing anybody", () => {
    const grouped = stationsByRegion().flatMap(([, list]) => list);
    expect(grouped).toHaveLength(TIDE_STATIONS.length);
  });

  it("returns null for a station it does not ship", () => {
    expect(stationById("0000000")).toBeNull();
  });
});
