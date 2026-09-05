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
import { tideSeries, type TidePredictionSeries } from "@/core/rules/tide";

const KEY_PREFIX = "flb.tide-cache.v1.";

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
