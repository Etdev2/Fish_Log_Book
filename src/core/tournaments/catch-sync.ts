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
