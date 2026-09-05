"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getDemoTournament, hasSupabaseBrowserConfig, type DemoTournament } from "./demo-store";

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
  | { readonly state: "ready"; readonly tournament: DemoTournament };

const SELECT_COLUMNS =
  "id,name,status,visibility,starts_at,ends_at,organization_id,active_rule_set_version_id,active_scoring_version_id,active_verification_policy_version_id,active_boundary_version_id";

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
        const { data, error } = await supabase
          .from("tournament")
          .select(SELECT_COLUMNS)
          .eq("id", tournamentId)
          .is("deleted_at", null)
          .maybeSingle();

        if (cancelled) return;
        if (error) setLoad({ state: "error", message: error.message });
        else if (!data) setLoad({ state: "error", message: "That tournament is not there, or it is not shared with you." });
        else setLoad({ state: "ready", tournament: data as DemoTournament });
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
