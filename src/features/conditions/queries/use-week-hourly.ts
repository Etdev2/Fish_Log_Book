"use client";

import { useEffect, useMemo, useState } from "react";

import { tideSeries, type TidePredictionSample, type TidePredictionSeries } from "@/core/rules/tide";

import { fetchHourlySamples, mergeSamples } from "./noaa-tides";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** True when the series' hourly points span [fromMs, toMs] (to within one hour each end). */
export function hourlyCovers(series: TidePredictionSeries, fromMs: number, toMs: number): boolean {
  let first = Number.POSITIVE_INFINITY;
  let last = Number.NEGATIVE_INFINITY;
  for (const s of series.samples) {
    if (s.turn !== null) continue;
    const at = Number(s.at);
    if (at < first) first = at;
    if (at > last) last = at;
  }
  return first <= fromMs + HOUR_MS && last >= toMs - HOUR_MS;
}

/** Merge extra hourly points into a series, keeping its turns exact. */
export function withHourly(
  series: TidePredictionSeries,
  hourly: readonly TidePredictionSample[],
): TidePredictionSeries {
  if (hourly.length === 0) return series;
  const turnsAndExisting = series.samples;
  return tideSeries({
    station: series.station,
    samples: mergeSamples(hourly, turnsAndExisting),
    provider: series.provider,
    retrievedAt: series.retrievedAt,
  });
}

/** Per station + window, for the session: jumping back to a week costs no second request. */
const memory = new Map<string, readonly TidePredictionSample[]>();

export type WeekHourlyState = "ready" | "loading" | "unavailable";

/**
 * The view window's hourly curve, fetched on demand before the detailed chart renders a week
 * that the near-window fetch did not cover. While it loads the screen shows a loading state;
 * if it fails (offline) the screen says the curve is turns-only instead of passing an
 * interpolation off as a prediction.
 */
export function useWeekHourly(
  series: TidePredictionSeries,
  fromMs: number,
  toMs: number,
  enabled: boolean,
): { series: TidePredictionSeries; state: WeekHourlyState } {
  const stationId = series.station.id;
  // A day either side, so the slice's one-sample overhang is hourly too.
  const reqFrom = fromMs - DAY_MS;
  const reqTo = toMs + DAY_MS;
  const key = `${stationId}:${reqFrom}:${reqTo}`;
  const covered = !enabled || hourlyCovers(series, fromMs, toMs);
  const [result, setResult] = useState<{ key: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (covered || memory.has(key)) return;
    const controller = new AbortController();
    let cancelled = false;
    void fetchHourlySamples(stationId, reqFrom, reqTo, controller.signal).then(
      (samples) => {
        if (samples.length > 0) memory.set(key, samples);
        if (!cancelled) setResult({ key, ok: samples.length > 0 });
      },
      () => {
        if (!cancelled) setResult({ key, ok: false });
      },
    );
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [covered, key, stationId, reqFrom, reqTo]);

  return useMemo(() => {
    if (covered) return { series, state: "ready" as const };
    const cachedHourly = memory.get(key);
    if (cachedHourly !== undefined) return { series: withHourly(series, cachedHourly), state: "ready" as const };
    if (result !== null && result.key === key && !result.ok) return { series, state: "unavailable" as const };
    return { series, state: "loading" as const };
  }, [covered, key, result, series]);
}
