"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getDemoTournament, hasSupabaseBrowserConfig } from "./demo-store";
import { fetchTournamentFacts } from "./queries/tournament-facts";
import {
  PUBLIC_TOURNAMENT_COLUMNS,
  TOURNAMENT_COLUMNS,
  toTournamentRecord,
  type TournamentRecord,
} from "./types";

/**
 * One loader for every tournament detail screen.
 *
 * Each of the five screens used to fetch the tournament its own way, which is how they
 * ended up with five different loading messages, three different error sentences, and two
 * of them reading `localStorage` **during render** — a demo tournament that exists on the
 * phone renders as "not found" in the server's HTML and then swaps to the real thing on
 * hydration, which React reports as a mismatch and the founder experiences as a flash of
 * "Tournament not found on this device."
 *
 * The fix is the boring one: fetch in an effect, hold three explicit states, and let every
 * screen render the same skeleton and the same error card.
 */

export type TournamentLoad =
  | { readonly state: "loading" }
  | { readonly state: "error"; readonly message: string }
  | { readonly state: "ready"; readonly tournament: TournamentRecord };

export function useTournament(tournamentId: string): TournamentLoad {
  const [load, setLoad] = useState<TournamentLoad>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Yield once before any `setState`. Without it the demo branch below would set state
      // synchronously inside the effect body, which is a cascading render and is the exact
      // shape `react-hooks/set-state-in-effect` exists to catch.
      await Promise.resolve();
      if (cancelled) return;
      // Back to the skeleton whenever the id changes, so a second tournament never paints
      // for a moment with the first one's name.
      setLoad({ state: "loading" });

      if (!hasSupabaseBrowserConfig()) {
        const demo = getDemoTournament(tournamentId);
        setLoad(
          demo
            ? { state: "ready", tournament: demo }
            : {
                state: "error",
                message:
                  "This tournament is not saved on this phone. Demo tournaments live on the device that created them.",
              },
        );
        return;
      }

      try {
        const supabase = createClient();

        /*
          Two places a tournament can be read from, and both are needed.

          `tournament` is the real row and row-level security limits it to members of the
          owning organisation. `public_tournament` is the projection everyone else reads.
          Querying only the first — which this loader did — meant that tapping a public
          event from the event calendar, as somebody who does not belong to the host's
          organisation, produced "That tournament is not there, or it is not shared with
          you." The event was public. It was on the calendar. It just was not theirs.

          Reading from `tournament` at all is what "you host this" means here, so the
          fallback also settles the badge.
        */
        const ownRow = await supabase
          .from("tournament")
          .select(TOURNAMENT_COLUMNS)
          .eq("id", tournamentId)
          .is("deleted_at", null)
          .maybeSingle();

        if (cancelled) return;

        let row: unknown = ownRow.data ?? null;
        let hosting = row !== null;

        if (row === null) {
          const publicRow = await supabase
            .from("public_tournament")
            .select(PUBLIC_TOURNAMENT_COLUMNS)
            .eq("id", tournamentId)
            .maybeSingle();
          if (cancelled) return;
          row = publicRow.data ?? null;
          hosting = false;

          if (row === null) {
            // Report the members-only error only if there was one; otherwise the honest
            // answer is that no event with this id is visible to this viewer.
            setLoad({
              state: "error",
              message:
                ownRow.error?.message ??
                publicRow.error?.message ??
                "That tournament is not there, or it is not shared with you.",
            });
            return;
          }
        }

        /*
          The pot and the field size are not columns on the row, and the detail screen has
          to show them: a card in the list that carries the prize pool, linking to a page
          that does not, reads as the page having lost the number.

          Fetched after the row rather than beside it so a viewer who cannot read the
          finances still gets the tournament. Facts degrade to "not known"; the tournament
          does not.
        */
        const facts = await fetchTournamentFacts(supabase, [tournamentId]);
        if (cancelled) return;

        setLoad({
          state: "ready",
          // Narrowed, not cast. A column renamed in a migration or hidden by a policy used
          // to satisfy `as TournamentRecord` and surface three screens later as an empty
          // card; `toTournamentRecord` gives every missing field a defined, safe value.
          tournament: toTournamentRecord(row, {
            prize_pool_minor: facts.pools.has(tournamentId)
              ? (facts.pools.get(tournamentId) ?? null)
              : null,
            entrant_count: facts.entrantCounts.get(tournamentId) ?? 0,
            hosting,
          }),
        });
      } catch (cause) {
        if (cancelled) return;
        setLoad({
          state: "error",
          message: cause instanceof Error ? cause.message : "The tournament could not be loaded.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  return load;
}

/** True when the app is running without a Supabase connection, i.e. on-device demo data. */
export function useDemoMode(): boolean {
  return !hasSupabaseBrowserConfig();
}
