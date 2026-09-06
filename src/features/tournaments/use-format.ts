"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { parseFormat, type TournamentFormat } from "@/core/tournaments/formats";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseBrowserConfig } from "./demo-store";
import { getDemoFormat, saveDemoFormat } from "./format-store";

/**
 * Reading and writing the format a tournament is scored under.
 *
 * The read is deliberately a second query rather than an embed on the tournament: the
 * tournament row already carries `active_scoring_version_id`, and asking PostgREST to embed
 * through it means guessing a foreign-key name that would break silently on a rename.
 *
 * `null` is a real answer, not a failure — a draft tournament whose host has not chosen a
 * format yet, which is what the readiness checklist on the overview is counting.
 */

export type FormatLoad =
  | { readonly state: "loading" }
  | { readonly state: "error"; readonly message: string }
  | { readonly state: "ready"; readonly format: TournamentFormat | null };

export function useFormat(tournament: {
  readonly id: string;
  readonly active_scoring_version_id: string | null;
}): FormatLoad & { readonly reload: () => void } {
  const [load, setLoad] = useState<FormatLoad>({ state: "loading" });
  const [token, setToken] = useState(0);
  const tournamentId = tournament.id;
  const versionId = tournament.active_scoring_version_id;

  const reload = useCallback(() => setToken((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      if (!hasSupabaseBrowserConfig()) {
        setLoad({ state: "ready", format: getDemoFormat(tournamentId) });
        return;
      }

      if (versionId === null) {
        setLoad({ state: "ready", format: null });
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("tournament_scoring_version")
          .select("configuration")
          .eq("id", versionId)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          setLoad({ state: "error", message: error.message });
          return;
        }
        setLoad({ state: "ready", format: parseFormat(data?.configuration) });
      } catch (cause) {
        if (cancelled) return;
        setLoad({
          state: "error",
          message: cause instanceof Error ? cause.message : "The format could not be loaded.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tournamentId, versionId, token]);

  return useMemo(() => ({ ...load, reload }), [load, reload]);
}

/**
 * Saves a format, through the RPC in production and to the device in demo mode.
 *
 * The RPC is the only write path: it appends a version rather than editing one, mirrors the
 * categories into `tournament_award_category`, repoints the tournament at the new version,
 * and refuses all of it once the tournament has started. None of those four can be done
 * safely from a phone with table grants, which is why there are no table grants.
 */
export async function saveFormat(
  tournamentId: string,
  format: TournamentFormat,
): Promise<{ readonly ok: true } | { readonly ok: false; readonly message: string }> {
  if (!hasSupabaseBrowserConfig()) {
    saveDemoFormat(tournamentId, format);
    return { ok: true };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("save_tournament_format", {
      target_tournament_id: tournamentId,
      format,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "The format could not be saved.",
    };
  }
}
