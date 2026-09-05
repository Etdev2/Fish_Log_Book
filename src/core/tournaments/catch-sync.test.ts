import { describe, expect, it } from "vitest";

import { reconcileTournamentCatch, type TournamentCatchPayload } from "./catch-sync";

const base: TournamentCatchPayload = {
  tournamentId: "t1",
  clientGeneratedId: "11111111-1111-4111-8111-111111111111",
  entryId: "e1",
  teamId: null,
  tournamentBoatId: null,
  speciesId: "yellowtail",
  speciesOther: null,
  caughtAtDevice: "2026-09-05T17:00:00.000Z",
  lengthMm: 800,
  weightG: 9000,
  disposition: "RELEASED",
};

describe("reconcileTournamentCatch", () => {
  it("inserts when the client id has never been seen", () => {
    expect(reconcileTournamentCatch(null, base)).toEqual({ kind: "INSERT" });
  });

  it("treats an identical retry as an idempotent replay", () => {
    expect(reconcileTournamentCatch(base, { ...base })).toEqual({ kind: "IDEMPOTENT_REPLAY" });
  });

  it("flags changed factual payload instead of silently overwriting", () => {
    expect(reconcileTournamentCatch(base, { ...base, weightG: 9500 })).toEqual({
      kind: "CONFLICT",
      differingFields: ["weightG"],
    });
  });

  it("does not confuse a different tournament/client identity with a replay", () => {
    expect(
      reconcileTournamentCatch(base, {
        ...base,
        clientGeneratedId: "22222222-2222-4222-8222-222222222222",
      }),
    ).toEqual({ kind: "INSERT" });
  });
});
