import { describe, expect, it } from "vitest";

import { canTransitionDispute, foldPenalties, requireDisputeTransition } from "./adjudication";

describe("foldPenalties", () => {
  it("folds active point, weight and time penalties deterministically", () => {
    const state = foldPenalties([
      { id: "p1", targetType: "ENTRY", targetId: "e1", type: "POINT_DEDUCTION", pointsDelta: -5 },
      { id: "p2", targetType: "ENTRY", targetId: "e1", type: "WEIGHT_DEDUCTION", weightDeltaG: -250 },
      { id: "p3", targetType: "ENTRY", targetId: "e1", type: "TIME_PENALTY", timePenaltySeconds: 60 },
    ]);

    expect(state.pointsDelta).toBe(-5);
    expect(state.weightDeltaG).toBe(-250);
    expect(state.timePenaltySeconds).toBe(60);
    expect(state.active).toHaveLength(3);
  });

  it("reverses by appending a new record rather than mutating history", () => {
    const state = foldPenalties([
      { id: "p1", targetType: "ENTRY", targetId: "e1", type: "POINT_DEDUCTION", pointsDelta: -5 },
      { id: "p2", targetType: "ENTRY", targetId: "e1", type: "CUSTOM", reversesPenaltyId: "p1" },
    ]);

    expect(state.reversedIds.has("p1")).toBe(true);
    expect(state.pointsDelta).toBe(0);
    expect(state.active).toHaveLength(0);
  });

  it("rejects a reversal aimed at another subject", () => {
    expect(() =>
      foldPenalties([
        { id: "p1", targetType: "ENTRY", targetId: "e1", type: "POINT_DEDUCTION", pointsDelta: -5 },
        { id: "p2", targetType: "ENTRY", targetId: "e2", type: "CUSTOM", reversesPenaltyId: "p1" },
      ]),
    ).toThrow(/same subject/);
  });

  it("surfaces removal and disqualification as explicit scoring inputs", () => {
    const state = foldPenalties([
      { id: "p1", targetType: "CATCH", targetId: "c1", type: "CATCH_REMOVAL" },
      { id: "p2", targetType: "ENTRY", targetId: "e1", type: "DISQUALIFICATION" },
    ]);
    expect(state.catchRemoved).toBe(true);
    expect(state.disqualified).toBe(true);
  });
});

describe("dispute lifecycle", () => {
  it("permits review then resolution", () => {
    expect(canTransitionDispute("OPEN", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionDispute("UNDER_REVIEW", "RESOLVED")).toBe(true);
  });

  it("keeps terminal outcomes terminal", () => {
    expect(canTransitionDispute("RESOLVED", "OPEN")).toBe(false);
    expect(() => requireDisputeTransition("DENIED", "UNDER_REVIEW")).toThrow(/Invalid dispute transition/);
  });
});
