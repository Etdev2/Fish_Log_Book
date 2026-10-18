import { describe, expect, it } from "vitest";

import { provenanceNotice } from "./tide-provenance";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 18, 19, 0);
const zone = "America/Los_Angeles";

describe("provenanceNotice", () => {
  it("names the saved copy's date and age on the stale-cache path", () => {
    const notice = provenanceNotice({ source: "cache", retrievedAtMs: NOW - 2 * DAY, nowMs: NOW, timeZone: zone });
    expect(notice?.kind).toBe("cache");
    expect(notice?.text).toBe("Offline: showing cached NOAA predictions from Oct 16, 2 days old");
  });

  it("uses hours for a copy under a day old", () => {
    const notice = provenanceNotice({ source: "cache", retrievedAtMs: NOW - 5 * 3600_000, nowMs: NOW, timeZone: zone });
    expect(notice?.text).toContain("5 hours old");
  });

  it("says the bundled sample is not the angler's station", () => {
    const notice = provenanceNotice({ source: "fixture", retrievedAtMs: null, nowMs: NOW, timeZone: zone });
    expect(notice).toEqual({ kind: "fixture", text: "Offline: showing sample data, not your station" });
  });

  it("shows nothing on a live load", () => {
    expect(provenanceNotice({ source: "live", retrievedAtMs: NOW, nowMs: NOW, timeZone: zone })).toBeNull();
  });
});
