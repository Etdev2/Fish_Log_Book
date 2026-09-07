"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import {
  getDemoEntries,
  getDemoTournaments,
  hasSupabaseBrowserConfig,
  type DemoTournament,
} from "../demo-store";
import type { TournamentEvent } from "../event-card";

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

/*
  One literal, deliberately not assembled from pieces: supabase-js parses this string at
  the type level to shape the row it returns, and a concatenated expression is just
  `string` to it, which collapses the result type into an error type.
*/
const LIST_COLUMNS =
  "id,name,status,visibility,starts_at,ends_at,location_name,registration_closes_at,entry_fee_minor,currency,created_at";

function fromDemo(row: DemoTournament, enteredIds: ReadonlySet<string>): TournamentEvent {
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
    entrant_count: row.entrant_count,
    entered: enteredIds.has(row.id),
    hosting: row.hosting,
  };
}

/** A Supabase row plus the two joins the card needs, flattened. */
interface RemoteRow {
  id: string;
  name: string;
  status: string;
  visibility: string;
  starts_at: string | null;
  ends_at: string | null;
  location_name: string | null;
  registration_closes_at: string | null;
  entry_fee_minor: number | null;
  currency: string | null;
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
        const [ownedResult, publicResult, poolResult, entryResult] = await Promise.all([
          supabase.from("tournament").select(LIST_COLUMNS).is("deleted_at", null),
          supabase
            .from("public_tournament")
            .select(LIST_COLUMNS)
            .eq("visibility", "PUBLIC")
            .order("starts_at", { ascending: true })
            .limit(200),
          // The pot, summed per event. `funded_amount_minor` counts money actually taken,
          // which is the only number honest enough to print beside the word "prize pool".
          supabase.from("prize_pool").select("tournament_id,funded_amount_minor"),
          supabase.from("tournament_entry").select("tournament_id").is("deleted_at", null),
        ]);

        if (cancelled) return;
        const failure = ownedResult.error ?? publicResult.error;
        if (failure) {
          setLoad({ state: "error", message: failure.message });
          return;
        }

        const owned = (ownedResult.data ?? []) as RemoteRow[];
        const ownedIds = new Set(owned.map((row) => row.id));
        const open = ((publicResult.data ?? []) as RemoteRow[]).filter((row) => !ownedIds.has(row.id));

        // A pool query the viewer cannot read is a missing number, never a broken page:
        // RLS hides other organisations' finances by design.
        const pools = new Map<string, number>();
        for (const row of (poolResult.data ?? []) as { tournament_id: string; funded_amount_minor: number }[]) {
          pools.set(row.tournament_id, (pools.get(row.tournament_id) ?? 0) + Number(row.funded_amount_minor ?? 0));
        }

        const counts = new Map<string, number>();
        for (const row of (entryResult.data ?? []) as { tournament_id: string }[]) {
          counts.set(row.tournament_id, (counts.get(row.tournament_id) ?? 0) + 1);
        }

        const events: TournamentEvent[] = [...owned, ...open].map((row) => ({
          id: row.id,
          name: row.name,
          status: row.status,
          visibility: row.visibility,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          location_name: row.location_name,
          registration_closes_at: row.registration_closes_at,
          entry_fee_minor: row.entry_fee_minor,
          prize_pool_minor: pools.get(row.id) ?? null,
          currency: row.currency ?? "USD",
          entrant_count: counts.get(row.id) ?? null,
          // Entered and hosting both need the signed-in angler, which arrives with the
          // registration work. Until then the honest answer is "not known here" rather
          // than a guess that would put somebody else's event in your My Tournaments.
          entered: false,
          hosting: ownedIds.has(row.id),
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
