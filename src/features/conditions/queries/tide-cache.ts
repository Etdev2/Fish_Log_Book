/**
 * IndexedDB persistence for the fetched tide series, via the existing `meta` store
 * (`src/lib/offline/db.ts`) — one more key, no new store, no migration. This is what makes
 * the tide screen usable offline and on a flaky connection: the last successful fetch
 * survives a reload even with no network at all.
 *
 * The staleness predicate is a plain pure function (`isTideCacheFresh`) so the decision of
 * "do we even need to hit the network" is unit-testable without touching IndexedDB.
 */
import { readMeta, writeMeta } from "@/lib/offline/db";
import { instant, type Instant } from "@/core/units";
import type { TidePredictionSeries } from "@/core/rules/tide";

/** One key per station so a future station switch never reads another station's cache. */
function cacheKey(stationId: string): string {
  return `tide-cache:${stationId}`;
}

interface StoredTideCache {
  readonly series: TidePredictionSeries;
  /** Epoch ms this cache entry was written — distinct from `series.retrievedAt`, which is
   *  when NOAA produced the data. They're normally equal for a freshly-written cache, but
   *  keeping them separate leaves room for a future "re-validated, same data" write that
   *  doesn't change provenance. */
  readonly cachedAt: number;
}

export interface TideCacheEntry {
  readonly series: TidePredictionSeries;
  readonly cachedAt: Instant;
}

export async function readTideCache(stationId: string): Promise<TideCacheEntry | null> {
  const stored = await readMeta<StoredTideCache>(cacheKey(stationId));
  if (!stored) return null;
  return { series: stored.series, cachedAt: instant(stored.cachedAt) };
}

export async function writeTideCache(stationId: string, series: TidePredictionSeries): Promise<void> {
  const entry: StoredTideCache = { series, cachedAt: Date.now() };
  await writeMeta(cacheKey(stationId), entry);
}

/** A day of hourly-plus-hilo data ages very little on its own; NOAA's predictions for a
 *  given hour do not change. What actually goes stale is the WINDOW: it was fetched
 *  yesterday-through-plus-7-days, so it self-invalidates as "now" walks toward its edge. */
export const TIDE_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
/** Refuse to call a cache "fresh enough" once fewer than this much future window remains —
 *  the whole point of re-fetching ahead of the edge instead of at it. */
export const TIDE_CACHE_MIN_FUTURE_MARGIN_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Pure — no IndexedDB, no clock reads. `nowMs`, `cachedAtMs` and `seriesEndMs` are all
 * plain epoch-ms numbers so this is trivial to unit test with fixed values.
 */
export function isTideCacheFresh(params: {
  readonly cachedAtMs: number;
  readonly seriesEndMs: number;
  readonly nowMs: number;
}): boolean {
  const { cachedAtMs, seriesEndMs, nowMs } = params;
  const age = nowMs - cachedAtMs;
  if (age > TIDE_CACHE_MAX_AGE_MS) return false;
  if (seriesEndMs - nowMs < TIDE_CACHE_MIN_FUTURE_MARGIN_MS) return false;
  return true;
}
