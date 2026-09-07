"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import {
  getDemoEntries,
  getDemoTournaments,
  hasSupabaseBrowserConfig,
} from "../demo-store";
import type { TournamentEvent } from "../event-card";
import {
  PUBLIC_TOURNAMENT_COLUMNS,
  TOURNAMENT_COLUMNS,
  toTournamentRecord,
  type TournamentRecord,
} from "../types";
import { fetchTournamentFacts } from "./tournament-facts";

/**
 * One load of "every event I can see", for every screen that shows events.
 *
 * The event calendar, the list and My Tournaments are three views of one question, so they
 * share one loader rather than each writing their own Supabase call. That is not only less
 * code: it is the only way the three screens can agree about what "entered" means, and
 * disagreeing about that is exactly the kind of thing an angler reads as the app being
 * broken.
 *
 * Two data paths, one shape. With Supabase configured it reads the real tables; without it
 * — which is every environment today — it reads the seeded demo store. `TournamentEvent`
 * is the shape both produce, so no screen below this line knows which one it got.
 */

export type EventsLoad =
  | { readonly state: "loading" }
  | { readonly state: "error"; readonly message: string }
  | { readonly state: "ready"; readonly events: readonly TournamentEvent[]; readonly demo: boolean };

function fromDemo(row: TournamentRecord, enteredIds: ReadonlySet<string>): TournamentEvent {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    visibility: row.visibility,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    location_name: row.location_name,
    registration_closes_at: row.registration_closes_at,
    entry_fee_minor: row.entry_fee_minor,
    prize_pool_minor: row.prize_pool_minor,
    currency: row.currency,
    refund_policy: row.refund_policy,
    entrant_count: row.entrant_count,
    entered: enteredIds.has(row.id),
    hosting: row.hosting,
  };
}

export function useEvents(): { readonly load: EventsLoad; readonly retry: () => void } {
  const [load, setLoad] = useState<EventsLoad>({ state: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Yield once before touching storage, so the first paint is the same on the server
      // and the client and hydration has nothing to disagree about.
      await Promise.resolve();
      if (cancelled) return;

      if (!hasSupabaseBrowserConfig()) {
        const entered = new Set(getDemoEntries().map((entry) => entry.tournament_id));
        setLoad({
          state: "ready",
          demo: true,
          events: getDemoTournaments().map((row) => fromDemo(row, entered)),
        });
        return;
      }

      try {
        const supabase = createClient();
        const [ownedResult, publicResult] = await Promise.all([
          supabase.from("tournament").select(TOURNAMENT_COLUMNS).is("deleted_at", null),
          supabase
            .from("public_tournament")
            .select(PUBLIC_TOURNAMENT_COLUMNS)
            .eq("visibility", "PUBLIC")
            .order("starts_at", { ascending: true })
            .limit(200),
        ]);

        if (cancelled) return;
        const failure = ownedResult.error ?? publicResult.error;
        if (failure) {
          setLoad({ state: "error", message: failure.message });
          return;
        }

        /*
          Rows you can read from `tournament` itself are your organisation's, which is what
          hosting means here; `public_tournament` is everything else on offer. An event in
          both is yours, so the public copy is dropped rather than listed twice.
        */
        const owned = ((ownedResult.data ?? []) as unknown[]).map((row) =>
          toTournamentRecord(row, { hosting: true }),
        );
        const ownedIds = new Set(owned.map((row) => row.id));
        const open = ((publicResult.data ?? []) as unknown[])
          .map((row) => toTournamentRecord(row))
          .filter((row) => !ownedIds.has(row.id));

        const rows = [...owned, ...open];
        const facts = await fetchTournamentFacts(
          supabase,
          rows.map((row) => row.id),
        );
        if (cancelled) return;

        const events: TournamentEvent[] = rows.map((row) => ({
          id: row.id,
          name: row.name,
          status: row.status,
          visibility: row.visibility,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          location_name: row.location_name,
          registration_closes_at: row.registration_closes_at,
          entry_fee_minor: row.entry_fee_minor,
          // Absent means the pot is not readable from here — "—", never "$0".
          prize_pool_minor: facts.pools.has(row.id) ? (facts.pools.get(row.id) ?? null) : null,
          currency: row.currency,
          refund_policy: row.refund_policy,
          entrant_count: facts.entrantCounts.get(row.id) ?? 0,
          entered: facts.enteredIds.has(row.id),
          hosting: row.hosting,
        }));

        setLoad({ state: "ready", events, demo: false });
      } catch (cause) {
        if (cancelled) return;
        setLoad({
          state: "error",
          message: cause instanceof Error ? cause.message : "Events could not be loaded.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { load, retry };
}
