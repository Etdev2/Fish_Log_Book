import { describe, expect, it } from "vitest";

import {
  canTransitionTournament,
  validateTournamentTransition,
  type FrozenCompetitionVersions,
} from "./lifecycle";

const frozen: FrozenCompetitionVersions = {
  ruleSetVersionId: "rules-1",
  scoringVersionId: "score-1",
  verificationPolicyVersionId: "verify-1",
  boundaryVersionId: "boundary-1",
};

describe("tournament lifecycle", () => {
  it("allows the canonical happy path", () => {
    const path = [
      "DRAFT",
      "REGISTRATION_OPEN",
      "REGISTRATION_CLOSED",
      "READY",
      "LIVE",
      "COMPLETED",
      "RESULTS_PENDING",
      "FINAL",
    ] as const;

    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransitionTournament(path[i], path[i + 1])).toBe(true);
    }
  });

  it("keeps FINAL terminal", () => {
    expect(canTransitionTournament("FINAL", "LIVE")).toBe(false);
    expect(canTransitionTournament("FINAL", "CANCELLED")).toBe(false);
  });

  it("requires frozen official configuration before going LIVE", () => {
    expect(
      validateTournamentTransition({
        from: "READY",
        to: "LIVE",
        versions: { ...frozen, boundaryVersionId: null },
      }),
    ).toEqual({
      ok: false,
      reason: "LIVE requires frozen rule, scoring, verification, and boundary versions.",
    });

    expect(
      validateTournamentTransition({ from: "READY", to: "LIVE", versions: frozen }),
    ).toEqual({ ok: true });
  });

  it("rejects lifecycle skips", () => {
    expect(
      validateTournamentTransition({ from: "DRAFT", to: "LIVE", versions: frozen }).ok,
    ).toBe(false);
  });
});
