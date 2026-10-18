"use client";

/**
 * A small on-device cache of fetched tide predictions.
 *
 * localStorage rather than IndexedDB on purpose: a week of predictions for one station is
 * a few kilobytes, it is regenerable from the network, and it is not the durable record
 * the log is — putting it in the offline database would mean a schema version bump to
 * store something we would happily lose.
 *
 * What it buys is the thing that matters offshore: the tide you looked up in the marina
 * is still there when the signal is not.
 */

import { instant, metres } from "@/core/units";
import { tideSeries, type TidePredictionSample, type TidePredictionSeries } from "@/core/rules/tide";

/**
 * v2: the cached series is now ±730 days of high/lows. A v1 week-long entry must not pass as
 * fresh, and a v2 entry from before that widening fails `coversWindow` and is refetched.
 */
const KEY_PREFIX = "flb.tide-cache.v2.";

/** Beyond this a cached series is still shown, but labelled as old. */
export const CACHE_FRESH_MS = 12 * 60 * 60 * 1000;

interface CachedShape {
  readonly stationId: string;
  readonly stationName: string;
  readonly timeZone: string;
  readonly retrievedAtMs: number;
  /** [instantMs, metres, "H" | "L" | ""] — compact, because this is a string in storage. */
  readonly samples: readonly [number, number, string][];
}

export function cacheKey(stationId: string): string {
  return `${KEY_PREFIX}${stationId}`;
}

export function writeTideCache(series: TidePredictionSeries): void {
  try {
    const payload: CachedShape = {
      stationId: series.station.id,
      stationName: series.station.name,
      timeZone: series.station.timeZone,
      retrievedAtMs: (series.retrievedAt as number | null) ?? Date.now(),
      samples: series.samples.map((s) => [
        s.at as number,
        s.height as number,
        s.turn === "high" ? "H" : s.turn === "low" ? "L" : "",
      ]),
    };
    localStorage.setItem(cacheKey(series.station.id), JSON.stringify(payload));
  } catch {
    // A full or blocked storage costs us the cache, never the reading on screen.
  }
}

export function readTideCache(stationId: string): TidePredictionSeries | null {
  try {
    const raw = localStorage.getItem(cacheKey(stationId));
    if (raw === null) return null;

    const parsed = JSON.parse(raw) as CachedShape;
    if (!Array.isArray(parsed.samples) || parsed.samples.length === 0) return null;

    return tideSeries({
      station: {
        id: parsed.stationId,
        name: parsed.stationName,
        timeZone: parsed.timeZone,
        datum: "MLLW",
      },
      samples: parsed.samples.map(([at, height, turn]) => ({
        at: instant(at),
        height: metres(height),
        turn: turn === "H" ? "high" : turn === "L" ? "low" : null,
      })),
      provider: "noaa-coops",
      retrievedAt: instant(parsed.retrievedAtMs),
    });
  } catch {
    // Corrupt or half-written cache reads as no cache, never as a broken chart.
    return null;
  }
}

export function clearTideCache(stationId: string): void {
  try {
    localStorage.removeItem(cacheKey(stationId));
  } catch {
    // Nothing to do.
  }
}

/* ── Hourly blocks ─────────────────────────────────────────────────────────────────────
 * The base series above holds every high/low across the whole ±730-day range plus the
 * near week of hourly points. Hourly detail for anywhere else is cached a block at a time
 * (see `hourly-blocks.ts`) as the angler scrolls there. A block is ~670 samples, ~8 KB. */

const HOURLY_PREFIX = "flb.tide-hourly.v2.";

/** Past this many blocks per station (~4.3 years) the farthest from today are dropped. */
export const MAX_HOURLY_BLOCKS = 60;

function hourlyKey(stationId: string, index: number): string {
  return `${HOURLY_PREFIX}${stationId}.${index}`;
}

interface HourlyShape {
  readonly fromMs: number;
  /** [minutes after fromMs, metres] — NOAA's hourly points are on whole minutes. */
  readonly s: readonly [number, number][];
}

export function writeHourlyBlock(
  stationId: string,
  index: number,
  fromMs: number,
  samples: readonly TidePredictionSample[],
): void {
  try {
    const payload: HourlyShape = {
      fromMs,
      s: samples.map((p) => [Math.round(((p.at as number) - fromMs) / 60_000), p.height as number]),
    };
    localStorage.setItem(hourlyKey(stationId, index), JSON.stringify(payload));
  } catch {
    // Quota or private mode: the block stays in memory for this session and is refetched next time.
  }
}

export function readHourlyBlock(stationId: string, index: number): TidePredictionSample[] | null {
  try {
    const raw = localStorage.getItem(hourlyKey(stationId, index));
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as HourlyShape;
    if (!Array.isArray(parsed.s) || parsed.s.length === 0 || typeof parsed.fromMs !== "number") return null;
    return parsed.s.map(([minutes, height]) => ({
      at: instant(parsed.fromMs + minutes * 60_000),
      height: metres(height),
      turn: null,
    }));
  } catch {
    return null;
  }
}

/** Block indexes held on this device for a station, ascending. */
export function listHourlyBlocks(stationId: string): number[] {
  const prefix = `${HOURLY_PREFIX}${stationId}.`;
  const found: number[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === null || !key.startsWith(prefix)) continue;
      const index = Number(key.slice(prefix.length));
      if (Number.isInteger(index)) found.push(index);
    }
  } catch {
    // No storage, no blocks.
  }
  return found.sort((a, b) => a - b);
}

/** Drop the blocks farthest from `nearIndex` until at most `MAX_HOURLY_BLOCKS` remain. Returns what is left. */
export function pruneHourlyBlocks(stationId: string, nearIndex: number): number[] {
  const held = listHourlyBlocks(stationId);
  if (held.length <= MAX_HOURLY_BLOCKS) return held;
  const keep = [...held].sort((a, b) => Math.abs(a - nearIndex) - Math.abs(b - nearIndex)).slice(0, MAX_HOURLY_BLOCKS);
  const keepSet = new Set(keep);
  try {
    for (const index of held) if (!keepSet.has(index)) localStorage.removeItem(hourlyKey(stationId, index));
  } catch {
    // Nothing to do.
  }
  return keep.sort((a, b) => a - b);
}
