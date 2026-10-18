"use client";

import { useEffect, useMemo, useState } from "react";

import type { TidePredictionSample } from "@/core/rules/tide";

import { blockBounds, blockIndexAt, blocksCovering } from "./hourly-blocks";
import { fetchHourlySamples } from "./noaa-tides";
import { listHourlyBlocks, pruneHourlyBlocks, readHourlyBlock, writeHourlyBlock } from "./tide-cache";

/**
 * Real NOAA hourly predictions for the part of the range on screen, and nothing else.
 *
 * The high/low series covers the whole ±730 days; this fills in the hourly points between
 * the turns for the blocks the render window touches (ADR 011). Each block is read from the
 * device if it was seen before, else fetched once and saved — so scrolling back over water
 * you have already looked at costs nothing, and works offline. A block that cannot be
 * fetched leaves that stretch on the high/low curve, which the readout labels as such.
 */

/** Held for the life of the page so a remount never re-reads or re-fetches. */
const memory = new Map<string, readonly TidePredictionSample[]>();
const inFlight = new Set<string>();
const known = new Map<string, Set<number>>();

const memoryKey = (stationId: string, index: number) => `${stationId}:${index}`;

function knownBlocks(stationId: string): Set<number> {
  let set = known.get(stationId);
  if (!set) {
    set = new Set();
    known.set(stationId, set);
  }
  return set;
}

export interface HourlyBlocks {
  /** Hourly samples for the blocks the window touches that are loaded, ascending. */
  readonly samples: readonly TidePredictionSample[];
  /** Every block index held on this device for the station (memory or storage). */
  readonly cachedBlocks: readonly number[];
  /** True while a block the window needs is still being read or fetched. */
  readonly loading: boolean;
}

export function useHourlyBlocks(stationId: string, fromMs: number, toMs: number, enabled: boolean): HourlyBlocks {
  const [version, setVersion] = useState(0);
  const needed = useMemo(() => blocksCovering(fromMs, toMs), [fromMs, toMs]);

  // Which blocks the device already holds, so the Dates sheet can say so before any scroll.
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const set = knownBlocks(stationId);
      for (const index of listHourlyBlocks(stationId)) set.add(index);
      setVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [stationId]);

  useEffect(() => {
    if (!enabled) return;
    // Deliberately not aborted when the window moves on: a block that finishes after the
    // angler has scrolled past is still worth having on the device.
    const load = async (index: number) => {
      const key = memoryKey(stationId, index);
      if (memory.has(key) || inFlight.has(key)) return;
      inFlight.add(key);
      try {
        let samples: readonly TidePredictionSample[] | null = readHourlyBlock(stationId, index);
        if (samples === null) {
          const { fromMs: begin, lastDayMs, endMs } = blockBounds(index);
          const fetched = await fetchHourlySamples(stationId, begin, lastDayMs);
          samples = fetched.filter((s) => (s.at as number) >= begin && (s.at as number) < endMs);
          if (samples.length === 0) return;
          writeHourlyBlock(stationId, index, begin, samples);
          knownBlocks(stationId).add(index);
          const kept = pruneHourlyBlocks(stationId, blockIndexAt(Date.now()));
          const set = knownBlocks(stationId);
          for (const held of [...set]) if (!kept.includes(held)) set.delete(held);
        }
        memory.set(key, samples);
        knownBlocks(stationId).add(index);
        setVersion((v) => v + 1);
      } catch {
        // Offline or NOAA said no: the stretch stays on the high/low curve, and is labelled.
      } finally {
        inFlight.delete(key);
      }
    };

    for (const index of needed) void load(index);
  }, [stationId, needed, enabled]);

  return useMemo(() => {
    const samples: TidePredictionSample[] = [];
    let loading = false;
    for (const index of needed) {
      const block = memory.get(memoryKey(stationId, index));
      if (block) samples.push(...block);
      else loading = true;
    }
    return { samples, cachedBlocks: [...knownBlocks(stationId)].sort((a, b) => a - b), loading };
    // `version` is the signal that the module-level memory changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, needed, version]);
}
