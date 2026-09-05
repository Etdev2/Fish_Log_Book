export const TOURNAMENT_STATUSES = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "READY",
  "LIVE",
  "PAUSED",
  "COMPLETED",
  "RESULTS_PENDING",
  "FINAL",
  "CANCELLED",
] as const;

export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

const ALLOWED: Readonly<Record<TournamentStatus, readonly TournamentStatus[]>> = {
  DRAFT: ["REGISTRATION_OPEN", "CANCELLED"],
  REGISTRATION_OPEN: ["REGISTRATION_CLOSED", "CANCELLED"],
  REGISTRATION_CLOSED: ["READY", "REGISTRATION_OPEN", "CANCELLED"],
  READY: ["LIVE", "CANCELLED"],
  LIVE: ["PAUSED", "COMPLETED"],
  PAUSED: ["LIVE", "COMPLETED", "CANCELLED"],
  COMPLETED: ["RESULTS_PENDING"],
  RESULTS_PENDING: ["FINAL"],
  FINAL: [],
  CANCELLED: [],
};

export function canTransitionTournament(
  from: TournamentStatus,
  to: TournamentStatus,
): boolean {
  return ALLOWED[from].includes(to);
}

export interface FrozenCompetitionVersions {
  readonly ruleSetVersionId: string | null;
  readonly scoringVersionId: string | null;
  readonly verificationPolicyVersionId: string | null;
  readonly boundaryVersionId: string | null;
}

export function hasAllLiveVersions(versions: FrozenCompetitionVersions): boolean {
  return (
    versions.ruleSetVersionId !== null &&
    versions.scoringVersionId !== null &&
    versions.verificationPolicyVersionId !== null &&
    versions.boundaryVersionId !== null
  );
}

export function validateTournamentTransition(input: {
  readonly from: TournamentStatus;
  readonly to: TournamentStatus;
  readonly versions: FrozenCompetitionVersions;
}): { readonly ok: true } | { readonly ok: false; readonly reason: string } {
  if (!canTransitionTournament(input.from, input.to)) {
    return { ok: false, reason: `Invalid tournament transition: ${input.from} -> ${input.to}` };
  }

  if (input.to === "LIVE" && !hasAllLiveVersions(input.versions)) {
    return {
      ok: false,
      reason: "LIVE requires frozen rule, scoring, verification, and boundary versions.",
    };
  }

  return { ok: true };
}
