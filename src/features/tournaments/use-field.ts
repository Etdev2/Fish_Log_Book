"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseBrowserConfig } from "./demo-store";
import { getDemoField } from "./demo-field";
import type { FieldEntry } from "./field";

/**
 * Loads the field for a tournament — the roster, the board and the counts all come through
 * here so they cannot disagree.
 *
 * Two sources, one shape. On a device with no Supabase configured it is the seeded demo
 * field; otherwise it is `tournament_entry` with the team, the boat and the entrant's
 * display name embedded. Both hand back `FieldEntry[]` and nothing downstream knows which
 * it got.
 */

export type FieldLoad =
  | { readonly state: "loading" }
  | { readonly state: "error"; readonly message: string }
  | { readonly state: "ready"; readonly field: readonly FieldEntry[] };

/**
 * PostgREST embeds, so one round trip rather than four. `tournament_entry_identity` is a
 * list because an entry can carry more than one claim over its life (a guest who later
 * signs up); the first is the one shown.
 */
const FIELD_SELECT = `
  id,
  entry_number,
  registration_status,
  eligibility_status,
  check_in_status,
  competition_status,
  tournament_team ( name ),
  tournament_boat ( boat ( name ) ),
  tournament_entry_identity ( display_name, claimed_angler_id )
`;

interface EntryRow {
  id: string;
  entry_number: string | null;
  registration_status: string;
  eligibility_status: string;
  check_in_status: string;
  competition_status: string;
  tournament_team: { name: string } | null;
  tournament_boat: { boat: { name: string } | null } | null;
  tournament_entry_identity: Array<{ display_name: string; claimed_angler_id: string | null }> | null;
}

function toFieldEntry(row: EntryRow, viewerId: string | null): FieldEntry {
  const identity = row.tournament_entry_identity?.[0] ?? null;
  return {
    entryId: row.id,
    entryNumber: row.entry_number,
    // An entry always has an identity in practice, but the join can come back empty while
    // one is being created, and a roster row reading "undefined" is worse than one reading
    // "Entry 12".
    displayName: identity?.display_name ?? (row.entry_number ? `Entry ${row.entry_number}` : "Entry"),
    teamName: row.tournament_team?.name ?? null,
    boatName: row.tournament_boat?.boat?.name ?? null,
    registrationStatus: row.registration_status,
    eligibilityStatus: row.eligibility_status,
    checkInStatus: row.check_in_status,
    competitionStatus: row.competition_status,
    isYou: viewerId !== null && identity?.claimed_angler_id === viewerId,
    // Weights come from approved catches and scored standings, not from the entry row.
    // Until the scoring service is wired, the server-backed board is honestly empty rather
    // than filled in from something that is not a score.
    bestWeightLb: null,
    species: null,
    awaitingReview: false,
  };
}

export function useField(tournamentId: string): FieldLoad & { readonly reload: () => void } {
  const [load, setLoad] = useState<FieldLoad>({ state: "loading" });
  const [token, setToken] = useState(0);

  const reload = useCallback(() => setToken((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Yield before the first setState — `localStorage` is not there during the server
      // render, and a synchronous set inside an effect body is a cascading render.
      await Promise.resolve();
      if (cancelled) return;

      if (!hasSupabaseBrowserConfig()) {
        // Unknown ids are not an error: a tournament the founder just created has no
        // seeded field, and `getDemoField` returns their own entry alone if they have
        // entered it, which is exactly right.
        setLoad({ state: "ready", field: getDemoField(tournamentId) });
        return;
      }

      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("tournament_entry")
          .select(FIELD_SELECT)
          .eq("tournament_id", tournamentId)
          .is("deleted_at", null)
          .order("entry_number", { ascending: true });

        if (cancelled) return;
        if (error) {
          setLoad({ state: "error", message: error.message });
          return;
        }

        const viewerId = authData.user?.id ?? null;
        setLoad({
          state: "ready",
          field: ((data ?? []) as unknown as EntryRow[]).map((row) => toFieldEntry(row, viewerId)),
        });
      } catch (cause) {
        if (cancelled) return;
        setLoad({
          state: "error",
          message: cause instanceof Error ? cause.message : "The field could not be loaded.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tournamentId, token]);

  // Memoized so the returned object keeps its identity between renders. Spreading a fresh
  // object every render would defeat every `useMemo` downstream that depends on it, and
  // would re-fire any effect that lists it.
  return useMemo(() => ({ ...load, reload }), [load, reload]);
}
