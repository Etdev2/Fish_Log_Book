import { describe, expect, it } from "vitest";

import { approvePayoutInstruction, buildDraftPayoutInstructions, canSubmitPayout } from "./payouts";

describe("prize payout instructions", () => {
  it("builds deterministic draft payouts from funded pool and final ranks", () => {
    const drafts = buildDraftPayoutInstructions(
      100_00,
      [
        { rank: 1, percentageBps: 7000 },
        { rank: 2, percentageBps: 3000 },
      ],
      [
        { rank: 1, entryId: "entry-1" },
        { rank: 2, entryId: "entry-2" },
      ],
    );
    expect(drafts).toEqual([
      { rank: 1, amountMinor: 7000, entryId: "entry-1", teamId: undefined, boatId: undefined, status: "DRAFT" },
      { rank: 2, amountMinor: 3000, entryId: "entry-2", teamId: undefined, boatId: undefined, status: "DRAFT" },
    ]);
  });

  it("rejects prize allocation above 100 percent", () => {
    expect(() => buildDraftPayoutInstructions(
      10_000,
      [{ rank: 1, percentageBps: 10001 }],
      [{ rank: 1, entryId: "entry-1" }],
    )).toThrow("exceeds 100%");
  });

  it("requires exactly one recipient identity", () => {
    expect(() => buildDraftPayoutInstructions(
      10_000,
      [{ rank: 1, percentageBps: 10000 }],
      [{ rank: 1, entryId: "entry-1", teamId: "team-1" }],
    )).toThrow("exactly one payout recipient");
  });

  it("requires actor, reason, and timestamp before approval", () => {
    const draft = buildDraftPayoutInstructions(
      10_000,
      [{ rank: 1, percentageBps: 10000 }],
      [{ rank: 1, entryId: "entry-1" }],
    )[0];

    expect(() => approvePayoutInstruction(draft, { actorId: "", approvedAt: new Date().toISOString(), reason: "approved" })).toThrow();
    expect(() => approvePayoutInstruction(draft, { actorId: "admin-1", approvedAt: new Date().toISOString(), reason: "   " })).toThrow();
    expect(() => approvePayoutInstruction(draft, { actorId: "admin-1", approvedAt: "bad-date", reason: "approved" })).toThrow();
  });

  it("only allows provider submission from APPROVED state", () => {
    expect(canSubmitPayout("APPROVED")).toBe(true);
    for (const state of ["DRAFT", "SUBMITTED", "CONFIRMED", "FAILED", "CANCELLED", "REVERSED"] as const) {
      expect(canSubmitPayout(state)).toBe(false);
    }
  });
});
