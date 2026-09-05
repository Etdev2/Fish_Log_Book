export type PenaltyType =
  | "POINT_DEDUCTION"
  | "WEIGHT_DEDUCTION"
  | "TIME_PENALTY"
  | "CATCH_REMOVAL"
  | "DISQUALIFICATION"
  | "CUSTOM";

export interface PenaltyRecord {
  readonly id: string;
  readonly targetType: "CATCH" | "ENTRY" | "TEAM" | "BOAT";
  readonly targetId: string;
  readonly type: PenaltyType;
  readonly pointsDelta?: number;
  readonly weightDeltaG?: number;
  readonly timePenaltySeconds?: number;
  readonly reversesPenaltyId?: string;
}

export interface EffectivePenaltyState {
  readonly active: readonly PenaltyRecord[];
  readonly reversedIds: ReadonlySet<string>;
  readonly pointsDelta: number;
  readonly weightDeltaG: number;
  readonly timePenaltySeconds: number;
  readonly catchRemoved: boolean;
  readonly disqualified: boolean;
}

export function foldPenalties(records: readonly PenaltyRecord[]): EffectivePenaltyState {
  const byId = new Map(records.map((record) => [record.id, record] as const));
  const reversedIds = new Set<string>();

  for (const record of records) {
    if (!record.reversesPenaltyId) continue;
    const original = byId.get(record.reversesPenaltyId);
    if (!original) throw new Error(`Missing reversed penalty: ${record.reversesPenaltyId}`);
    if (original.targetType !== record.targetType || original.targetId !== record.targetId) {
      throw new Error("Penalty reversal must target the same subject");
    }
    reversedIds.add(original.id);
  }

  const active = records.filter((record) => !record.reversesPenaltyId && !reversedIds.has(record.id));

  return {
    active,
    reversedIds,
    pointsDelta: active.reduce((sum, record) => sum + (record.pointsDelta ?? 0), 0),
    weightDeltaG: active.reduce((sum, record) => sum + (record.weightDeltaG ?? 0), 0),
    timePenaltySeconds: active.reduce((sum, record) => sum + (record.timePenaltySeconds ?? 0), 0),
    catchRemoved: active.some((record) => record.type === "CATCH_REMOVAL"),
    disqualified: active.some((record) => record.type === "DISQUALIFICATION"),
  };
}

export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DENIED" | "WITHDRAWN";

const DISPUTE_TRANSITIONS: Readonly<Record<DisputeStatus, readonly DisputeStatus[]>> = {
  OPEN: ["UNDER_REVIEW", "WITHDRAWN"],
  UNDER_REVIEW: ["RESOLVED", "DENIED", "WITHDRAWN"],
  RESOLVED: [],
  DENIED: [],
  WITHDRAWN: [],
};

export function canTransitionDispute(from: DisputeStatus, to: DisputeStatus): boolean {
  return DISPUTE_TRANSITIONS[from].includes(to);
}

export function requireDisputeTransition(from: DisputeStatus, to: DisputeStatus): void {
  if (!canTransitionDispute(from, to)) {
    throw new Error(`Invalid dispute transition: ${from} -> ${to}`);
  }
}
