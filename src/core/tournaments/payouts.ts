export interface PrizePlacement {
  rank: number;
  percentageBps: number;
}

export interface FinalResultRecipient {
  rank: number;
  entryId?: string;
  teamId?: string;
  boatId?: string;
}

export interface DraftPayoutInstruction {
  rank: number;
  amountMinor: number;
  entryId?: string;
  teamId?: string;
  boatId?: string;
  status: "DRAFT";
}

export interface ApprovedPayoutInstruction extends Omit<DraftPayoutInstruction, "status"> {
  status: "APPROVED";
  approvedBy: string;
  approvedAt: string;
  approvalReason: string;
}

export function buildDraftPayoutInstructions(
  fundedAmountMinor: number,
  placements: readonly PrizePlacement[],
  recipients: readonly FinalResultRecipient[],
): DraftPayoutInstruction[] {
  if (!Number.isInteger(fundedAmountMinor) || fundedAmountMinor < 0) throw new Error("funded amount must be a non-negative integer");
  const totalBps = placements.reduce((sum, p) => sum + p.percentageBps, 0);
  if (totalBps > 10000) throw new Error("prize allocation exceeds 100%");

  return placements.map((placement) => {
    const recipient = recipients.find((r) => r.rank === placement.rank);
    if (!recipient) throw new Error(`missing final result recipient for rank ${placement.rank}`);
    const targetCount = [recipient.entryId, recipient.teamId, recipient.boatId].filter(Boolean).length;
    if (targetCount !== 1) throw new Error(`rank ${placement.rank} must have exactly one payout recipient`);
    return {
      rank: placement.rank,
      amountMinor: Math.floor((fundedAmountMinor * placement.percentageBps) / 10000),
      entryId: recipient.entryId,
      teamId: recipient.teamId,
      boatId: recipient.boatId,
      status: "DRAFT" as const,
    };
  });
}

export function approvePayoutInstruction(
  draft: DraftPayoutInstruction,
  approval: { actorId: string; approvedAt: string; reason: string },
): ApprovedPayoutInstruction {
  if (!approval.actorId) throw new Error("payout approval requires an actor");
  if (!approval.reason.trim()) throw new Error("payout approval requires a reason");
  if (Number.isNaN(Date.parse(approval.approvedAt))) throw new Error("payout approval requires a valid timestamp");
  return {
    ...draft,
    status: "APPROVED",
    approvedBy: approval.actorId,
    approvedAt: approval.approvedAt,
    approvalReason: approval.reason.trim(),
  };
}

export function canSubmitPayout(status: "DRAFT" | "APPROVED" | "SUBMITTED" | "CONFIRMED" | "FAILED" | "CANCELLED" | "REVERSED"): boolean {
  return status === "APPROVED";
}
