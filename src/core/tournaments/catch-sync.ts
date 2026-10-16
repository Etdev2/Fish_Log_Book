export type TournamentSyncStatus = "PENDING" | "SYNCED" | "CONFLICT" | "FAILED";

export interface TournamentCatchIdentity {
  tournamentId: string;
  clientGeneratedId: string;
}

export interface TournamentCatchPayload extends TournamentCatchIdentity {
  entryId: string;
  teamId: string | null;
  tournamentBoatId: string | null;
  speciesId: string | null;
  speciesOther: string | null;
  caughtAtDevice: string;
  lengthMm: number | null;
  weightG: number | null;
  disposition: "KEPT" | "RELEASED" | "UNKNOWN" | null;
  /**
   * The angler's own `public.catch` row for this fish (migration 20260915120000).
   *
   * Null means a guest entrant with no account — there is no personal catch in
   * existence to point at. It is never null for an account holder's submission; the
   * database refuses that insert, because a claim with no linked fish is the duplicate
   * entry this link exists to remove.
   */
  catchId: string | null;
}

export type ReconciliationResult =
  | { kind: "INSERT" }
  | { kind: "IDEMPOTENT_REPLAY" }
  | { kind: "CONFLICT"; differingFields: readonly (keyof TournamentCatchPayload)[] };

const COMPARABLE_FIELDS: readonly (keyof TournamentCatchPayload)[] = [
  "entryId",
  "teamId",
  "tournamentBoatId",
  "speciesId",
  "speciesOther",
  "caughtAtDevice",
  "lengthMm",
  "weightG",
  "disposition",
  /*
    The link is part of the claim, so a replay carrying a DIFFERENT one is a conflict and
    not an idempotent resend. Leaving it out would let a second device quietly re-point a
    submitted claim at another fish — exactly what the immutability trigger refuses
    server-side, and the two must agree about what a conflict is.
  */
  "catchId",
];

/**
 * Pure companion to the server ingestion contract.
 * Same tournament/client id + same immutable payload is a replay, not a new catch.
 * Same id + changed factual payload is an explicit conflict and must never overwrite.
 */
export function reconcileTournamentCatch(
  existing: TournamentCatchPayload | null,
  incoming: TournamentCatchPayload,
): ReconciliationResult {
  if (existing === null) return { kind: "INSERT" };
  if (
    existing.tournamentId !== incoming.tournamentId ||
    existing.clientGeneratedId !== incoming.clientGeneratedId
  ) {
    return { kind: "INSERT" };
  }

  const differingFields = COMPARABLE_FIELDS.filter((field) => existing[field] !== incoming[field]);
  return differingFields.length === 0
    ? { kind: "IDEMPOTENT_REPLAY" }
    : { kind: "CONFLICT", differingFields };
}
