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

/** A week around now: enough for the chart's window and for planning the next trip. */
function windowAround(nowMs: number) {
  const day = 24 * 60 * 60 * 1000;
  return { fromMs: nowMs - 2 * day, toMs: nowMs + 5 * day };
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

  if (cached !== null && ageOf(cached, now) < CACHE_FRESH_MS) {
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
