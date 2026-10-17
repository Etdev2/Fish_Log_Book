"use client";

import { useEffect, useMemo, useState } from "react";

import { tideSeries, type TidePredictionSeries } from "@/core/rules/tide";

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
// 3 d back so the default week view (2 d before today's station noon) is fully hourly.
export const HOURLY_BACK_MS = 3 * DAY_MS;
export const HOURLY_AHEAD_MS = 7 * DAY_MS;

/**
 * Extra turns fetched past +365 d so a cache stays a full year ahead of the current day for
 * its whole freshness lifetime (Codex P2 on c2fc171, #163). The screen trims to today ±365.
 */
export const TURNS_OVERLAP_MS = CACHE_FRESH_MS;

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
    turnsToMs: nowMs + TURNS_AHEAD_DAYS * DAY_MS + TURNS_OVERLAP_MS,
  };
}

/** The cached hourly curve must still reach this far past now to count as fresh. */
const HOURLY_MARGIN_MS = 2 * DAY_MS;

/** Turns are ~6 h apart; an end within this of the target still counts as reaching it. */
const TURN_EDGE_SLACK_MS = DAY_MS;

function extents(series: TidePredictionSeries) {
  let lastHourly = Number.NEGATIVE_INFINITY;
  let firstTurn = Number.POSITIVE_INFINITY;
  let lastTurn = Number.NEGATIVE_INFINITY;
  for (const sample of series.samples) {
    const at = Number(sample.at);
    if (sample.turn === null) lastHourly = Math.max(lastHourly, at);
    else {
      firstTurn = Math.min(firstTurn, at);
      lastTurn = Math.max(lastTurn, at);
    }
  }
  return { lastHourly, firstTurn, lastTurn };
}

/**
 * Fresh means: young enough, the hourly curve still reaches past now, AND the turns still
 * cover today ±365 d measured from the CURRENT day, not the day the cache was written
 * (Codex P2 on c2fc171; overlaps #163). Otherwise the advertised range silently shrinks.
 */
export function isCacheFresh(series: TidePredictionSeries, nowMs: number): boolean {
  if (ageOf(series, nowMs) >= CACHE_FRESH_MS) return false;
  const { lastHourly, firstTurn, lastTurn } = extents(series);
  if (lastHourly < nowMs + HOURLY_MARGIN_MS) return false;
  if (firstTurn > nowMs - TURNS_BACK_DAYS * DAY_MS + TURN_EDGE_SLACK_MS) return false;
  return lastTurn >= nowMs + TURNS_AHEAD_DAYS * DAY_MS - TURN_EDGE_SLACK_MS;
}

/**
 * Whether a cached series still describes today at all (#163). An offline fallback that
 * does not reach now is old data, not a stale reading of today, so it is dropped.
 */
export function cacheCoversNow(series: TidePredictionSeries, nowMs: number): boolean {
  const first = Number(series.samples[0]?.at ?? Number.POSITIVE_INFINITY);
  const last = Number(series.samples.at(-1)?.at ?? Number.NEGATIVE_INFINITY);
  return first <= nowMs && last >= nowMs;
}

/** Trim to today ±365 d so the picker, overview and range label never advertise more. */
export function trimToRange(series: TidePredictionSeries, nowMs: number): TidePredictionSeries {
  const from = nowMs - TURNS_BACK_DAYS * DAY_MS;
  const to = nowMs + TURNS_AHEAD_DAYS * DAY_MS;
  const samples = series.samples.filter((s) => Number(s.at) >= from && Number(s.at) <= to);
  if (samples.length === series.samples.length || samples.length === 0) return series;
  return tideSeries({ station: series.station, samples, provider: series.provider, retrievedAt: series.retrievedAt });
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
    return { stationId: station.id, series: trimToRange(cached, now), source: "cache", stale: false, error: null };
  }

  try {
    const series = await fetchTideSeries(station, windowAround(now), signal);
    writeTideCache(series);
    return { stationId: station.id, series: trimToRange(series, now), source: "live", stale: false, error: null };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Could not reach NOAA";

    // Offline in the marina is the normal case, not an exception: an old cache still
    // beats an empty chart, as long as the badge admits how old it is.
    // ...but only while it still reaches today (#163): a cache that ends before now is
    // yesterday's chart, and drawing it would read as today's tide.
    if (cached !== null && cacheCoversNow(cached, now)) {
      return { stationId: station.id, series: trimToRange(cached, now), source: "cache", stale: true, error };
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
