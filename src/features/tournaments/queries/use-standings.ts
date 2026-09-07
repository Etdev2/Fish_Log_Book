"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { getDemoStandings, hasSupabaseBrowserConfig } from "../demo-store";

/**
 * The standings, from wherever they actually live.
 *
 * Before this, every screen that showed standings did `demoMode ? getDemoStandings(id) : []`.
 * Against a real database that is an empty array on every load, rendered as "Nothing has
 * been scored yet — approved catches will appear here." Which is a sentence that is not
 * true: nothing would ever have appeared there, because nothing was ever asked for. A
 * plausible empty state over a missing query is worse than an error, because nobody
 * reports it — the leaderboard just looks like a quiet tournament.
 *
 * The production source is `public_leaderboard`, which is the projection of `standing`
 * rows whose score computation is COMPLETE. It carries a rank, a score and a
 * disqualification flag but no names — those are in `public_tournament_entry` — and no
 * species or weight, because a standing is a *total*, not a fish. The demo seed happens to
 * know the winning fish for each row, so that stays optional and the screens print it when
 * they have it.
 */

export interface StandingRow {
  readonly rank: number;
  readonly displayName: string;
  /** The number the ranking is on — pounds in the demo, the computed score in production. */
  readonly score: number;
  /** Unit for `score`, when there is a meaningful one. Null prints the bare number. */
  readonly scoreUnit: string | null;
  /** The fish behind the row, when the source knows it. A standing usually does not. */
  readonly detail: string | null;
  /** False while a review behind the row is still open. */
  readonly official: boolean;
}

export type StandingsLoad =
  | { readonly state: "loading" }
  | { readonly state: "ready"; readonly rows: readonly StandingRow[] }
  /** The tournament server answered, and it said no. Distinct from "nobody has scored". */
  | { readonly state: "error"; readonly message: string };

export function useStandings(tournamentId: string): StandingsLoad {
  const [load, setLoad] = useState<StandingsLoad>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (!hasSupabaseBrowserConfig()) {
        setLoad({
          state: "ready",
          rows: getDemoStandings(tournamentId).map((row) => ({
            rank: row.rank,
            displayName: row.display_name,
            score: row.weight_lb,
            scoreUnit: "lb",
            detail: row.species,
            official: row.official,
          })),
        });
        return;
      }

      try {
        const supabase = createClient();
        const [boardResult, entryResult] = await Promise.all([
          supabase
            .from("public_leaderboard")
            .select("tournament_entry_id,rank,score_numeric,is_disqualified,division_id")
            .eq("tournament_id", tournamentId)
            .order("rank", { ascending: true }),
          supabase
            .from("public_tournament_entry")
            .select("id,display_name")
            .eq("tournament_id", tournamentId),
        ]);

        if (cancelled) return;
        if (boardResult.error) {
          setLoad({ state: "error", message: boardResult.error.message });
          return;
        }

        const names = new Map<string, string>();
        for (const row of (entryResult.data ?? []) as { id: string; display_name: string }[]) {
          if (typeof row.display_name === "string") names.set(row.id, row.display_name);
        }

        const rows = ((boardResult.data ?? []) as {
          tournament_entry_id: string;
          rank: number;
          score_numeric: unknown;
          is_disqualified: boolean;
          division_id: string | null;
        }[])
          // Overall standings only. Division boards are their own screen; mixing them into
          // one list would show the same angler three times with three different ranks.
          .filter((row) => row.division_id === null)
          .map((row) => {
            const score = Number(row.score_numeric);
            return {
              rank: row.rank,
              // An entry whose identity is not public still has a rank, and dropping the
              // row would renumber the board. "Entry 4" is honest; a blank name is not.
              displayName: names.get(row.tournament_entry_id) ?? `Entry ${row.rank}`,
              score: Number.isFinite(score) ? score : 0,
              scoreUnit: null,
              detail: null,
              official: !row.is_disqualified,
            };
          });

        setLoad({ state: "ready", rows });
      } catch (cause) {
        if (cancelled) return;
        setLoad({
          state: "error",
          message: cause instanceof Error ? cause.message : "The standings could not be loaded.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  return load;
}
