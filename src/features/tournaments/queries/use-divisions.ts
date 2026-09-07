"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { DivisionOption } from "@/core/tournaments/registration";

import { getDemoDivisions, hasSupabaseBrowserConfig } from "../demo-store";

/**
 * The jackpots and side pots an event offers, for the registration form.
 *
 * This existed only as a seeded demo list read straight from the component, which meant
 * that against a real database the founder's headline feature — "register for the biggest
 * tuna jackpot, register for the largest marlin" — would have silently rendered nothing.
 * Not an error, not an empty state: no jackpot section at all, on every event, with no
 * indication that anything was missing. Silent absence is the worst failure a feature can
 * have, because nobody reports it.
 *
 * Two hops, because the price and the pot live in different places by design:
 * `tournament_division` holds what a buy-in costs, and `prize_pool` holds what has actually
 * been collected. Joining them is what produces "Biggest Tuna · $100 · $4,200 in the pot".
 */

export type DivisionsLoad =
  | { readonly state: "loading" }
  | { readonly state: "ready"; readonly byTournament: ReadonlyMap<string, readonly DivisionOption[]> };

const DIVISION_COLUMNS = "id,tournament_id,name,description,kind,entry_fee_minor,prize_pool_id";

interface DivisionRow {
  id: string;
  tournament_id: string;
  name: string;
  description: string | null;
  kind: string;
  entry_fee_minor: number | string | null;
  prize_pool_id: string | null;
}

function kindOf(raw: string): DivisionOption["kind"] {
  return raw === "JACKPOT" || raw === "SIDE_POT" ? raw : "DIVISION";
}

function minorOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useDivisions(tournamentIds: readonly string[]): DivisionsLoad {
  const [load, setLoad] = useState<DivisionsLoad>({ state: "loading" });
  // Stable key, so the effect re-runs when the SET of events changes rather than on every
  // render that happens to build a new array with the same ids in it.
  const key = [...tournamentIds].sort().join(",");

  const read = useCallback(async (ids: readonly string[]): Promise<ReadonlyMap<string, readonly DivisionOption[]>> => {
    const byTournament = new Map<string, DivisionOption[]>();
    if (ids.length === 0) return byTournament;

    if (!hasSupabaseBrowserConfig()) {
      for (const id of ids) {
        byTournament.set(
          id,
          getDemoDivisions(id).map((division) => ({
            id: division.id,
            name: division.name,
            description: division.description,
            kind: division.kind,
            entryFeeMinor: division.entry_fee_minor,
            poolMinor: division.pool_minor,
            participantCount: division.participant_count,
          })),
        );
      }
      return byTournament;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tournament_division")
      .select(DIVISION_COLUMNS)
      .in("tournament_id", ids)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true });

    // A division list that fails to load is an empty one, not a broken page: an angler can
    // still enter the event itself, which is the thing they came to do.
    if (error || !data) return byTournament;

    const rows = data as unknown as DivisionRow[];
    const poolIds = rows.map((row) => row.prize_pool_id).filter((id): id is string => Boolean(id));

    const pools = new Map<string, { funded: number; entries: number }>();
    if (poolIds.length > 0) {
      const [poolResult, entryResult] = await Promise.all([
        supabase.from("prize_pool").select("id,funded_amount_minor").in("id", poolIds),
        supabase
          .from("prize_pool_entry")
          .select("prize_pool_id")
          .in("prize_pool_id", poolIds)
          .eq("participation_status", "ACTIVE"),
      ]);
      for (const pool of (poolResult.data ?? []) as { id: string; funded_amount_minor: unknown }[]) {
        const funded = Number(pool.funded_amount_minor ?? 0);
        pools.set(pool.id, { funded: Number.isFinite(funded) ? funded : 0, entries: 0 });
      }
      for (const row of (entryResult.data ?? []) as { prize_pool_id: string }[]) {
        const pool = pools.get(row.prize_pool_id);
        if (pool) pool.entries += 1;
      }
    }

    for (const row of rows) {
      const pool = row.prize_pool_id ? pools.get(row.prize_pool_id) : undefined;
      const option: DivisionOption = {
        id: row.id,
        name: row.name,
        description: row.description,
        kind: kindOf(row.kind),
        entryFeeMinor: minorOrNull(row.entry_fee_minor),
        // No pool row means the pot is not readable or not created — "New pot", never "$0".
        poolMinor: pool ? pool.funded : null,
        participantCount: pool ? pool.entries : null,
      };
      const bucket = byTournament.get(row.tournament_id);
      if (bucket) bucket.push(option);
      else byTournament.set(row.tournament_id, [option]);
    }
    return byTournament;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ids = key === "" ? [] : key.split(",");

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const byTournament = await read(ids);
        if (!cancelled) setLoad({ state: "ready", byTournament });
      } catch {
        // Same reasoning as the query error above: no jackpots beats no registration form.
        if (!cancelled) setLoad({ state: "ready", byTournament: new Map() });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, read]);

  return load;
}
