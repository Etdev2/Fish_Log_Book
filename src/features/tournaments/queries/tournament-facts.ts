"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The three facts about a tournament that do not live on its own row.
 *
 * The pot is summed from `prize_pool`, the field size is counted from `tournament_entry`,
 * and whether *you* are in it comes from the identity rows that name you. Every screen in
 * the section needs some of these, so they are fetched in one place — the alternative is
 * each screen inventing its own definition of "entered", and three screens disagreeing
 * about that reads to an angler as the app being broken.
 *
 * **Every one of these degrades to "not known" rather than throwing.** Row-level security
 * hides other organisations' finances by design, so a viewer who cannot read `prize_pool`
 * is the normal case, not an error. A missing pot renders as "—"; it must never take the
 * events list down with it, and it must never render as `$0`.
 */

export interface TournamentFacts {
  /** Pot per tournament id, in minor units. Absent means not readable, not zero. */
  readonly pools: ReadonlyMap<string, number>;
  readonly entrantCounts: ReadonlyMap<string, number>;
  /** Tournament ids the signed-in angler holds an entry in. */
  readonly enteredIds: ReadonlySet<string>;
}

export const EMPTY_FACTS: TournamentFacts = {
  pools: new Map(),
  entrantCounts: new Map(),
  enteredIds: new Set(),
};

export async function fetchTournamentFacts(
  supabase: SupabaseClient,
  tournamentIds?: readonly string[],
): Promise<TournamentFacts> {
  const scope = tournamentIds && tournamentIds.length > 0 ? tournamentIds : null;

  const poolQuery = supabase.from("prize_pool").select("tournament_id,funded_amount_minor");
  const entryQuery = supabase.from("tournament_entry").select("id,tournament_id").is("deleted_at", null);

  const [poolResult, entryResult, enteredIds] = await Promise.all([
    scope ? poolQuery.in("tournament_id", scope) : poolQuery,
    scope ? entryQuery.in("tournament_id", scope) : entryQuery,
    fetchEnteredIds(supabase),
  ]);

  const pools = new Map<string, number>();
  for (const row of (poolResult.data ?? []) as { tournament_id: string; funded_amount_minor: unknown }[]) {
    // `funded_amount_minor` is a bigint, which PostgREST sends as a string once it exceeds
    // a safe integer. Adding those as strings would concatenate them into a nonsense pot.
    const amount = Number(row.funded_amount_minor ?? 0);
    if (!Number.isFinite(amount)) continue;
    pools.set(row.tournament_id, (pools.get(row.tournament_id) ?? 0) + amount);
  }

  const entrantCounts = new Map<string, number>();
  for (const row of (entryResult.data ?? []) as { tournament_id: string }[]) {
    entrantCounts.set(row.tournament_id, (entrantCounts.get(row.tournament_id) ?? 0) + 1);
  }

  return { pools, entrantCounts, enteredIds };
}

/**
 * Which tournaments the signed-in angler is in.
 *
 * Two hops, because an entry's identity rows are what name a person and they do not carry
 * the tournament: identities claimed by this angler → their entry ids → those entries'
 * tournaments. Signed out, the answer is "none", which is correct rather than an error —
 * the whole app is usable signed out.
 *
 * This is what "My tournaments" counts. Before it existed the events loader hardcoded
 * `entered: false` for every real row, so a signed-in angler with ten entries would have
 * seen an empty My Tournaments and no error explaining why.
 */
async function fetchEnteredIds(supabase: SupabaseClient): Promise<ReadonlySet<string>> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return new Set();

  const { data: identities, error: identityError } = await supabase
    .from("tournament_entry_identity")
    .select("tournament_entry_id")
    .eq("claimed_angler_id", userId);
  if (identityError || !identities || identities.length === 0) return new Set();

  const entryIds = (identities as { tournament_entry_id: string }[])
    .map((row) => row.tournament_entry_id)
    .filter((id): id is string => typeof id === "string");
  if (entryIds.length === 0) return new Set();

  const { data: entries, error: entryError } = await supabase
    .from("tournament_entry")
    .select("tournament_id")
    .in("id", entryIds)
    .is("deleted_at", null);
  if (entryError || !entries) return new Set();

  return new Set(
    (entries as { tournament_id: string }[])
      .map((row) => row.tournament_id)
      .filter((id): id is string => typeof id === "string"),
  );
}
