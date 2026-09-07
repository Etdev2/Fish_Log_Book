import { describe, expect, it } from "vitest";

import {
  buildOrder,
  canCheckOut,
  crewProblems,
  orphanedDivisionIds,
  type CrewMember,
  type EventOption,
} from "./registration";

const tunaJackpot = {
  id: "d-tuna",
  name: "Biggest Tuna",
  description: "Heaviest single tuna.",
  kind: "JACKPOT" as const,
  entryFeeMinor: 10000,
  poolMinor: 420000,
  participantCount: 34,
};

const marlinJackpot = {
  id: "d-marlin",
  name: "Largest Marlin",
  description: "Released marlin count on length.",
  kind: "JACKPOT" as const,
  entryFeeMinor: 15000,
  poolMinor: 300000,
  participantCount: 20,
};

const juniorDivision = {
  id: "d-junior",
  name: "Junior",
  description: "Under 16 on the day.",
  kind: "DIVISION" as const,
  entryFeeMinor: null,
  poolMinor: null,
  participantCount: 6,
};

function events(): EventOption[] {
  return [
    {
      id: "e1",
      name: "Offshore Tuna Jackpot",
      entryFeeMinor: 40000,
      currency: "USD",
      divisions: [tunaJackpot, marlinJackpot, juniorDivision],
    },
    { id: "e2", name: "Saturday Yellowtail", entryFeeMinor: 25000, currency: "USD", divisions: [] },
    { id: "e3", name: "Club Fun Day", entryFeeMinor: 0, currency: "USD", divisions: [] },
    { id: "e4", name: "Unpriced Invitational", entryFeeMinor: null, currency: "USD", divisions: [] },
  ];
}

describe("buildOrder", () => {
  it("puts several events and several jackpots on one order with one total", () => {
    // The whole point of ADR 010 §1: this is one payment, not five.
    const result = buildOrder(events(), {
      eventIds: ["e1", "e2"],
      divisionIds: ["d-tuna", "d-marlin"],
    });
    expect(result.problem).toBeNull();
    expect(result.draft?.lines.map((line) => line.description)).toEqual([
      "Offshore Tuna Jackpot",
      "Offshore Tuna Jackpot — Biggest Tuna",
      "Offshore Tuna Jackpot — Largest Marlin",
      "Saturday Yellowtail",
    ]);
    expect(result.draft?.totalMinor).toBe(40000 + 10000 + 15000 + 25000);
  });

  it("marks jackpot lines as JACKPOT and side pots as SIDE_POT", () => {
    const withSidePot = events();
    withSidePot[0] = {
      ...withSidePot[0],
      divisions: [{ ...tunaJackpot, id: "d-side", kind: "SIDE_POT" as const }],
    };
    const result = buildOrder(withSidePot, { eventIds: ["e1"], divisionIds: ["d-side"] });
    expect(result.draft?.lines.map((line) => line.itemType)).toEqual([
      "TOURNAMENT_ENTRY",
      "SIDE_POT",
    ]);
  });

  it("charges nothing for a division that is included in the entry", () => {
    const result = buildOrder(events(), { eventIds: ["e1"], divisionIds: ["d-junior"] });
    expect(result.draft?.lines).toHaveLength(1);
    expect(result.draft?.totalMinor).toBe(40000);
  });

  it("does not bill a jackpot whose event was removed", () => {
    // Tick a jackpot, then drop the event. The bill must follow the event.
    const result = buildOrder(events(), { eventIds: ["e2"], divisionIds: ["d-tuna"] });
    expect(result.draft?.totalMinor).toBe(25000);
    expect(result.draft?.lines).toHaveLength(1);
  });

  it("bills a genuinely free event as zero, and says so", () => {
    const result = buildOrder(events(), { eventIds: ["e3"], divisionIds: [] });
    expect(result.draft?.totalMinor).toBe(0);
    expect(result.draft?.lines).toHaveLength(1);
    expect(result.unpricedEventIds).toEqual([]);
  });

  it("reports an unpriced event rather than charging zero for it", () => {
    // Null fee is "the host has not said", which must not be quietly rendered as settled.
    const result = buildOrder(events(), { eventIds: ["e4"], divisionIds: [] });
    expect(result.unpricedEventIds).toEqual(["e4"]);
    expect(result.draft?.lines).toHaveLength(0);
    expect(result.draft?.totalMinor).toBe(0);
  });

  it("refuses to add up two currencies instead of inventing a rate", () => {
    const mixed = events();
    mixed[1] = { ...mixed[1], currency: "EUR" };
    const result = buildOrder(mixed, { eventIds: ["e1", "e2"], divisionIds: [] });
    expect(result.problem).toBe("mixed-currency");
    expect(result.draft).toBeNull();
  });

  it("has nothing to charge for when no event is chosen", () => {
    expect(buildOrder(events(), { eventIds: [], divisionIds: ["d-tuna"] }).problem).toBe("no-events");
  });
});

describe("orphanedDivisionIds", () => {
  it("finds jackpots left ticked under an event that is no longer selected", () => {
    expect(orphanedDivisionIds(events(), { eventIds: ["e2"], divisionIds: ["d-tuna", "d-junior"] })).toEqual([
      "d-tuna",
      "d-junior",
    ]);
  });

  it("finds none when every choice still belongs somewhere", () => {
    expect(orphanedDivisionIds(events(), { eventIds: ["e1"], divisionIds: ["d-tuna"] })).toEqual([]);
  });
});

describe("crewProblems", () => {
  const member = (over: Partial<CrewMember> = {}): CrewMember => ({
    id: "m1",
    displayName: "Sam Rivera",
    email: null,
    phone: null,
    isCaptain: false,
    ...over,
  });

  it("accepts a boat of one who is their own captain", () => {
    expect(crewProblems([member({ isCaptain: true, phone: "949-555-0113" })])).toEqual([]);
  });

  it("insists on exactly one captain", () => {
    expect(crewProblems([member()])).toContainEqual({ kind: "no-captain" });
    expect(
      crewProblems([
        member({ id: "a", isCaptain: true, phone: "9495550113" }),
        member({ id: "b", isCaptain: true, phone: "9495550114" }),
      ]),
    ).toContainEqual({ kind: "many-captains" });
  });

  it("insists the captain can be reached — this is the 4am cancellation call", () => {
    expect(crewProblems([member({ isCaptain: true })])).toContainEqual({ kind: "captain-no-phone" });
    expect(crewProblems([member({ isCaptain: true, phone: "12345" })])).toContainEqual({
      kind: "captain-no-phone",
    });
  });

  it("accepts a phone number written the way a person writes one", () => {
    // Not a format check: international numbers, spaces, and "(cell)" are all real.
    for (const phone of ["+44 7700 900123", "(949) 555-0113", "949.555.0113 cell"]) {
      expect(crewProblems([member({ isCaptain: true, phone })])).toEqual([]);
    }
  });

  it("names which crew member has no name", () => {
    const problems = crewProblems([
      member({ id: "cap", isCaptain: true, phone: "9495550113" }),
      member({ id: "blank", displayName: "   " }),
    ]);
    expect(problems).toContainEqual({ kind: "blank-name", memberId: "blank" });
  });
});

describe("canCheckOut", () => {
  const crew: CrewMember[] = [
    { id: "cap", displayName: "Sam", email: null, phone: "9495550113", isCaptain: true },
  ];

  it("needs a valid crew, a buildable order, and the refund policy acknowledged", () => {
    const build = buildOrder(events(), { eventIds: ["e1"], divisionIds: [] });
    expect(canCheckOut({ crew, build, refundPolicyAcknowledged: true })).toBe(true);
    expect(canCheckOut({ crew, build, refundPolicyAcknowledged: false })).toBe(false);
  });

  it("blocks on a crew problem even when the money is fine", () => {
    const build = buildOrder(events(), { eventIds: ["e1"], divisionIds: [] });
    expect(
      canCheckOut({
        crew: [{ ...crew[0], phone: null }],
        build,
        refundPolicyAcknowledged: true,
      }),
    ).toBe(false);
  });

  it("still requires the policy on a free entry", () => {
    // Withdrawal rules apply to a free event too; "it cost nothing" is not consent.
    const build = buildOrder(events(), { eventIds: ["e3"], divisionIds: [] });
    expect(canCheckOut({ crew, build, refundPolicyAcknowledged: false })).toBe(false);
    expect(canCheckOut({ crew, build, refundPolicyAcknowledged: true })).toBe(true);
  });

  it("blocks when the order could not be built at all", () => {
    const build = buildOrder(events(), { eventIds: [], divisionIds: [] });
    expect(canCheckOut({ crew, build, refundPolicyAcknowledged: true })).toBe(false);
  });
});
