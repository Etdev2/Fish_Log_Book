export type ScoringFamily =
  | "BIGGEST_FISH"
  | "TOTAL_WEIGHT"
  | "BEST_N_WEIGHT"
  | "TOTAL_LENGTH"
  | "BIGGEST_LENGTH"
  | "POINTS"
  | "SPECIES_POINTS"
  | "SPECIES_MULTIPLIER"
  | "EVERY_FISH_COUNTS";

export interface EligibleCatch {
  id: string;
  entryId: string;
  speciesId: string | null;
  weightG: number | null;
  lengthMm: number | null;
  approved: boolean;
  disqualified: boolean;
  points?: number;
}

export interface AppliedPenalty {
  id: string;
  entryId: string;
  type: "POINT_DEDUCTION" | "WEIGHT_DEDUCTION" | "TIME_PENALTY" | "CATCH_REMOVAL" | "DISQUALIFICATION" | "CUSTOM";
  points?: number;
  weightG?: number;
  catchId?: string;
  active: boolean;
}

export interface ScoreRule {
  family: ScoringFamily;
  bestN?: number;
  speciesPoints?: Readonly<Record<string, number>>;
  speciesMultiplier?: Readonly<Record<string, number>>;
}

export interface OfficialStanding {
  entryId: string;
  score: number;
  eligibleCatchCount: number;
  penaltyPoints: number;
  penaltyWeightG: number;
  disqualified: boolean;
  rank: number;
}

function rawScore(catches: readonly EligibleCatch[], rule: ScoreRule): number {
  switch (rule.family) {
    case "BIGGEST_FISH":
      return Math.max(0, ...catches.map((c) => c.weightG ?? 0));
    case "TOTAL_WEIGHT":
    case "EVERY_FISH_COUNTS":
      return catches.reduce((sum, c) => sum + (c.weightG ?? 0), 0);
    case "BEST_N_WEIGHT": {
      const n = Math.max(1, rule.bestN ?? 1);
      return catches.map((c) => c.weightG ?? 0).sort((a, b) => b - a).slice(0, n).reduce((a, b) => a + b, 0);
    }
    case "TOTAL_LENGTH":
      return catches.reduce((sum, c) => sum + (c.lengthMm ?? 0), 0);
    case "BIGGEST_LENGTH":
      return Math.max(0, ...catches.map((c) => c.lengthMm ?? 0));
    case "POINTS":
      return catches.reduce((sum, c) => sum + (c.points ?? 0), 0);
    case "SPECIES_POINTS":
      return catches.reduce((sum, c) => sum + (c.speciesId ? rule.speciesPoints?.[c.speciesId] ?? 0 : 0), 0);
    case "SPECIES_MULTIPLIER":
      return catches.reduce((sum, c) => {
        const base = c.points ?? c.weightG ?? c.lengthMm ?? 0;
        const multiplier = c.speciesId ? rule.speciesMultiplier?.[c.speciesId] ?? 1 : 1;
        return sum + base * multiplier;
      }, 0);
  }
}

export function computeOfficialStandings(
  entryIds: readonly string[],
  catches: readonly EligibleCatch[],
  penalties: readonly AppliedPenalty[],
  rule: ScoreRule,
): OfficialStanding[] {
  const rows = entryIds.map((entryId) => {
    const entryPenalties = penalties.filter((p) => p.entryId === entryId && p.active);
    const removedCatchIds = new Set(entryPenalties.filter((p) => p.type === "CATCH_REMOVAL" && p.catchId).map((p) => p.catchId!));
    const eligible = catches.filter(
      (c) => c.entryId === entryId && c.approved && !c.disqualified && !removedCatchIds.has(c.id),
    );
    const penaltyPoints = entryPenalties
      .filter((p) => p.type === "POINT_DEDUCTION")
      .reduce((sum, p) => sum + Math.abs(p.points ?? 0), 0);
    const penaltyWeightG = entryPenalties
      .filter((p) => p.type === "WEIGHT_DEDUCTION")
      .reduce((sum, p) => sum + Math.abs(p.weightG ?? 0), 0);
    const disqualified = entryPenalties.some((p) => p.type === "DISQUALIFICATION");
    const base = rawScore(eligible, rule);
    const score = disqualified ? 0 : Math.max(0, base - penaltyPoints - penaltyWeightG);
    return { entryId, score, eligibleCatchCount: eligible.length, penaltyPoints, penaltyWeightG, disqualified, rank: 0 };
  });

  rows.sort((a, b) => {
    if (a.disqualified !== b.disqualified) return a.disqualified ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    if (b.eligibleCatchCount !== a.eligibleCatchCount) return b.eligibleCatchCount - a.eligibleCatchCount;
    return a.entryId.localeCompare(b.entryId);
  });

  let previous: OfficialStanding | null = null;
  let rank = 0;
  return rows.map((row, index) => {
    if (!previous || row.score !== previous.score || row.disqualified !== previous.disqualified || row.eligibleCatchCount !== previous.eligibleCatchCount) {
      rank = index + 1;
    }
    const ranked = { ...row, rank };
    previous = ranked;
    return ranked;
  });
}
