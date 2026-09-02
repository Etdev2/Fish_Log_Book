import { describe, expect, it } from "vitest";

import { TIDE_CACHE_MAX_AGE_MS, TIDE_CACHE_MIN_FUTURE_MARGIN_MS, isTideCacheFresh } from "./tide-cache";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("isTideCacheFresh", () => {
  it("is fresh when just written and the window still has plenty of future coverage", () => {
    const now = Date.UTC(2026, 8, 2, 12, 0, 0);
    expect(
      isTideCacheFresh({ cachedAtMs: now - HOUR, seriesEndMs: now + 7 * DAY, nowMs: now }),
    ).toBe(true);
  });

  it("is stale once the cache is older than the max age, even with plenty of window left", () => {
    const now = Date.UTC(2026, 8, 2, 12, 0, 0);
    expect(
      isTideCacheFresh({
        cachedAtMs: now - (TIDE_CACHE_MAX_AGE_MS + HOUR),
        seriesEndMs: now + 7 * DAY,
        nowMs: now,
      }),
    ).toBe(false);
  });

  it("is stale once the window's remaining future coverage drops below the minimum margin", () => {
    const now = Date.UTC(2026, 8, 2, 12, 0, 0);
    expect(
      isTideCacheFresh({
        cachedAtMs: now - HOUR,
        seriesEndMs: now + TIDE_CACHE_MIN_FUTURE_MARGIN_MS - HOUR,
        nowMs: now,
      }),
    ).toBe(false);
  });

  it("is stale once the window has already ended", () => {
    const now = Date.UTC(2026, 8, 2, 12, 0, 0);
    expect(isTideCacheFresh({ cachedAtMs: now - HOUR, seriesEndMs: now - HOUR, nowMs: now })).toBe(false);
  });
});
