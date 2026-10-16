"use client";

import { useEffect, useMemo, useState } from "react";

import type { TidePredictionSeries } from "@/core/rules/tide";

import { useTideStationPreference } from "../station-preference";
import { DEFAULT_STATION_ID, stationById, type TideStation } from "../stations";
import { fetchTideSeries } from "./noaa-tides";
import { CACHE_FRESH_MS, readTideCache, writeTideCache } from "./tide-cache";
import { loadTideSeriesFixture } from "./tide-series";

/**
 * Where the numbers on the chart came from. Shown to the angler, not just logged.
 *
 * The distinction that matters is `fixture`: the bundled snapshot belongs to Newport Bay
 * and to no other station. It is offered only when Newport Bay is the chosen station.
 * Drawing it under another station's name would be the worst failure this feature has —
 * a confident, wrong tide — so the loader returns nothing and says so instead.
 */
export type TideSource = "live" | "cache" | "fixture" | "none";

interface Resolved {
  readonly stationId: string;
  readonly series: TidePredictionSeries | null;
  readonly source: TideSource;
  readonly stale: boolean;
  readonly error: string | null;
}

export interface TideReading {
  readonly series: TidePredictionSeries | null;
  readonly station: TideStation | null;
  readonly source: TideSource;
  /** True when the data is older than the freshness window but still the best we have. */
  readonly stale: boolean;
  readonly loading: boolean;
  /** Plain-language reason the live fetch did not happen or did not work. */
  readonly error: string | null;
}

/** How far either side of today the turns reach. Et's FL-1 ask (2026-10-16): ±365 days. */
export const TURNS_BACK_DAYS = 365;
export const TURNS_AHEAD_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The hourly curve covers this much before and after now. */
export const HOURLY_BACK_MS = 2 * DAY_MS;
export const HOURLY_AHEAD_MS = 7 * DAY_MS;

/**
 * Hourly detail for the near week; high/low turns a year back and a year out, in ONE hilo
 * request (NOAA's hilo limit is 10 years). Predictions are astronomical, so a turn a year
 * out is as trustworthy as one tomorrow.
 */
export function windowAround(nowMs: number) {
  return {
    fromMs: nowMs - HOURLY_BACK_MS,
    toMs: nowMs + HOURLY_AHEAD_MS,
    turnsFromMs: nowMs - TURNS_BACK_DAYS * DAY_MS,
    turnsToMs: nowMs + TURNS_AHEAD_DAYS * DAY_MS,
  };
}

/** The cached hourly curve must still reach this far past now to count as fresh. */
const HOURLY_MARGIN_MS = 2 * DAY_MS;

/**
 * Fresh means: young enough, AND the hourly curve still reaches past now. The turns
 * outlast a week easily; the hourly near window does not, because it moves with the clock.
 */
export function isCacheFresh(series: TidePredictionSeries, nowMs: number): boolean {
  if (ageOf(series, nowMs) >= CACHE_FRESH_MS) return false;
  let lastHourly = Number.NEGATIVE_INFINITY;
  for (const sample of series.samples) {
    if (sample.turn === null) lastHourly = Math.max(lastHourly, Number(sample.at));
  }
  return lastHourly >= nowMs + HOURLY_MARGIN_MS;
}

function ageOf(series: TidePredictionSeries, nowMs: number): number {
  const retrieved = series.retrievedAt as number | null;
  return retrieved === null ? Number.POSITIVE_INFINITY : nowMs - retrieved;
}

/**
 * Cache first, then the network, then whatever is left — and always say which.
 *
 * Written as one async function rather than a chain of effects so the fallback order is
 * readable in one place, and so state is set only from its resolution. Nothing here runs
 * during render: the cache read, the clock and the network all live inside the effect.
 */
async function resolveSeries(
  station: TideStation,
  signal: AbortSignal,
): Promise<Resolved> {
  const now = Date.now();
  const cached = readTideCache(station.id);

  if (cached !== null && isCacheFresh(cached, now)) {
    return { stationId: station.id, series: cached, source: "cache", stale: false, error: null };
  }

  try {
    const series = await fetchTideSeries(station, windowAround(now), signal);
    writeTideCache(series);
    return { stationId: station.id, series, source: "live", stale: false, error: null };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Could not reach NOAA";

    // Offline in the marina is the normal case, not an exception: an old cache still
    // beats an empty chart, as long as the badge admits how old it is.
    if (cached !== null) {
      return { stationId: station.id, series: cached, source: "cache", stale: true, error };
    }
    if (station.id === DEFAULT_STATION_ID) {
      return {
        stationId: station.id,
        series: loadTideSeriesFixture(),
        source: "fixture",
        stale: true,
        error,
      };
    }
    return { stationId: station.id, series: null, source: "none", stale: false, error };
  }
}

export function useTideSeries(): TideReading {
  const [stationId] = useTideStationPreference();
  const station = useMemo(() => stationById(stationId), [stationId]);
  const [resolved, setResolved] = useState<Resolved | null>(null);

  useEffect(() => {
    if (station === null) return;

    const controller = new AbortController();
    let cancelled = false;

    // setState only from the resolution — an effect body that sets state synchronously
    // costs an extra render pass, and the lint rule that catches it is right.
    void resolveSeries(station, controller.signal).then((next) => {
      if (!cancelled) setResolved(next);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [station]);

  return useMemo((): TideReading => {
    // A result for the previous station is not this station's answer.
    const current = resolved !== null && resolved.stationId === station?.id ? resolved : null;

    if (current === null) {
      return {
        series: null,
        station,
        source: "none",
        stale: false,
        loading: station !== null,
        error: null,
      };
    }

    return {
      series: current.series,
      station,
      source: current.source,
      stale: current.stale,
      loading: false,
      error: current.error,
    };
  }, [resolved, station]);
}

/** One line for the badge, so every screen says the same thing about provenance. */
export function tideSourceLabel(reading: TideReading): string {
  if (reading.loading) return "Loading predictions…";
  switch (reading.source) {
    case "live":
      return "Live from NOAA";
    case "cache":
      return reading.stale ? "Saved on this device — old" : "Saved on this device";
    case "fixture":
      return "Bundled sample — not a live reading";
    case "none":
      return "No predictions for this station";
  }
}
