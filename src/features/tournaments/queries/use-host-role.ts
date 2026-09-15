"use client";

import { useEffect, useState } from "react";

import { isHostRole, type HostRole } from "@/core/tournaments/host-role";
import { createClient } from "@/lib/supabase/client";

import { hasSupabaseBrowserConfig } from "../demo-store";

/**
 * Which role, if any, the signed-in angler holds over this tournament.
 *
 * It goes through `my_tournament_host_role` rather than reading `tournament` and
 * `organization_member` from the client, for a reason worth writing down: a non-member's
 * select on `tournament` returns no rows, so "you are not a host" and "no such tournament"
 * arrive as the same empty result. The screen would have to guess between sending somebody
 * to the public page and telling them the event does not exist.
 *
 * The function answers only about the caller — a role or null, never who else is on the
 * team, never whether the tournament exists — so a stranger who tries an id learns exactly
 * what they already knew.
 */
export type HostRoleLoad =
  | { readonly state: "loading" }
  /** Settled. `role` is null for an entrant, a spectator, or a signed-out visitor. */
  | { readonly state: "ready"; readonly role: HostRole | null }
  | { readonly state: "error"; readonly message: string };

export function useHostRole(tournamentId: string): HostRoleLoad {
  const [load, setLoad] = useState<HostRoleLoad>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoad({ state: "loading" });

      // On-device demo data has no organisation and no membership behind it. The founder
      // is looking at tournaments he created, so he is the owner of them.
      if (!hasSupabaseBrowserConfig()) {
        setLoad({ state: "ready", role: "OWNER" });
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("my_tournament_host_role", {
          target_tournament_id: tournamentId,
        });

        if (cancelled) return;
        if (error) {
          setLoad({ state: "error", message: error.message });
          return;
        }

        // A signed-out visitor, an entrant and a stranger all land here. That is not an
        // error and must not read as one: null is the ordinary answer.
        setLoad({ state: "ready", role: isHostRole(data) ? data : null });
      } catch (cause) {
        if (cancelled) return;
        setLoad({
          state: "error",
          message:
            cause instanceof Error ? cause.message : "Your access to this tournament could not be checked.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  return load;
}
