import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import type { TidePredictionSeries } from "@/core/rules/tide";
import { describeTideProvenance, fixtureCoversInstant, loadTideSeriesFixture } from "./tide-series";

const STATION = { id: "9410580", name: "Newport Bay Entrance", timeZone: "America/Los_Angeles", datum: "MLLW" as const };

function seriesWith(provider: TidePredictionSeries["provider"], retrievedAt: number | null): TidePredictionSeries {
  return {
    station: STATION,
    samples: [{ at: instant(0), height: metres(1), turn: null }],
    provider,
    retrievedAt: retrievedAt === null ? null : instant(retrievedAt),
  };
}

describe("fixtureCoversInstant", () => {
  const fixture = loadTideSeriesFixture();
  const windowStart = Number(fixture.samples[0].at);
  const windowEnd = Number(fixture.samples[fixture.samples.length - 1].at);

  it("covers the fixture's own first and last sample instants", () => {
    expect(fixtureCoversInstant(windowStart)).toBe(true);
    expect(fixtureCoversInstant(windowEnd)).toBe(true);
  });

  it("covers the documented window end, 2026-09-04 23:00 UTC", () => {
    expect(fixtureCoversInstant(Date.UTC(2026, 8, 4, 23, 0, 0))).toBe(true);
  });

  it("does not cover an instant before the window starts", () => {
    expect(fixtureCoversInstant(windowStart - 1)).toBe(false);
  });

  it("self-disables the moment the window ends — the whole point of the check", () => {
    expect(fixtureCoversInstant(windowEnd + 1)).toBe(false);
    expect(fixtureCoversInstant(Date.UTC(2026, 8, 5, 0, 0, 0))).toBe(false);
  });
});

describe("describeTideProvenance", () => {
  it("is always 'fixture' for the fixture provider, regardless of retrievedAt", () => {
    const now = Date.now();
    expect(describeTideProvenance(seriesWith("fixture", now), now)).toBe("fixture");
    expect(describeTideProvenance(seriesWith("fixture", null), now)).toBe("fixture");
  });

  it("is 'live' for a noaa-coops series retrieved moments ago", () => {
    const now = Date.UTC(2026, 8, 2, 12, 0, 0);
    expect(describeTideProvenance(seriesWith("noaa-coops", now - 5_000), now)).toBe("live");
  });

  it("is 'cached' for a noaa-coops series retrieved long enough ago", () => {
    const now = Date.UTC(2026, 8, 2, 12, 0, 0);
    expect(describeTideProvenance(seriesWith("noaa-coops", now - 10 * 60 * 1000), now)).toBe("cached");
  });

  it("is 'cached' for a noaa-coops series with no recorded retrieval time", () => {
    const now = Date.now();
    expect(describeTideProvenance(seriesWith("noaa-coops", null), now)).toBe("cached");
  });
});
