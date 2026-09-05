import { describe, expect, it } from "vitest";

import { boardName, boardSubtitle, fieldSummary, rankField, searchField, type FieldEntry } from "./field";

function entry(overrides: Partial<FieldEntry> & Pick<FieldEntry, "entryId" | "displayName">): FieldEntry {
  return {
    entryNumber: null,
    teamName: null,
    boatName: null,
    registrationStatus: "CONFIRMED",
    eligibilityStatus: "ELIGIBLE",
    checkInStatus: "NOT_CHECKED_IN",
    competitionStatus: "NOT_STARTED",
    isYou: false,
    bestWeightLb: null,
    species: null,
    awaitingReview: false,
    ...overrides,
  };
}

describe("fieldSummary", () => {
  it("does not count withdrawn, rejected or cancelled entries as part of the field", () => {
    const summary = fieldSummary([
      entry({ entryId: "1", displayName: "A" }),
      entry({ entryId: "2", displayName: "B", registrationStatus: "WITHDRAWN" }),
      entry({ entryId: "3", displayName: "C", registrationStatus: "REJECTED" }),
      entry({ entryId: "4", displayName: "D", registrationStatus: "CANCELLED" }),
    ]);
    expect(summary.entered).toBe(1);
  });

  it("counts places, check-ins and who is on the board separately", () => {
    const summary = fieldSummary([
      entry({ entryId: "1", displayName: "A", checkInStatus: "CHECKED_IN", bestWeightLb: 12 }),
      entry({ entryId: "2", displayName: "B", checkInStatus: "CHECKED_IN" }),
      entry({ entryId: "3", displayName: "C", registrationStatus: "WAITLISTED" }),
      entry({ entryId: "4", displayName: "D", registrationStatus: "PENDING" }),
    ]);
    expect(summary).toMatchObject({
      entered: 4,
      confirmed: 2,
      waitlisted: 1,
      checkedIn: 2,
      onTheBoard: 1,
      needsAttention: 1,
    });
  });

  it("flags an unanswered eligibility question as needing attention", () => {
    const summary = fieldSummary([
      entry({ entryId: "1", displayName: "A", eligibilityStatus: "PENDING_REVIEW" }),
      entry({ entryId: "2", displayName: "B", eligibilityStatus: "INELIGIBLE" }),
      entry({ entryId: "3", displayName: "C", eligibilityStatus: "UNKNOWN" }),
    ]);
    expect(summary.needsAttention).toBe(2);
  });
});

describe("searchField", () => {
  const field = [
    entry({ entryId: "1", displayName: "M. Rivera", teamName: "Reel Deal", boatName: "Miss Ellie", entryNumber: "12" }),
    entry({ entryId: "2", displayName: "J. Park", boatName: "Second Wind", entryNumber: "7" }),
  ];

  it("finds an entry by the boat, the team, the person, or the number on the hull", () => {
    expect(searchField(field, "miss ellie")).toHaveLength(1);
    expect(searchField(field, "reel")).toHaveLength(1);
    expect(searchField(field, "park")).toHaveLength(1);
    expect(searchField(field, "12")).toHaveLength(1);
  });

  it("returns the whole field for an empty query", () => {
    expect(searchField(field, "   ")).toHaveLength(2);
  });
});

describe("rankField", () => {
  it("ranks by weight, heaviest first", () => {
    const ranked = rankField([
      entry({ entryId: "1", displayName: "A", bestWeightLb: 12 }),
      entry({ entryId: "2", displayName: "B", bestWeightLb: 28.6 }),
      entry({ entryId: "3", displayName: "C", bestWeightLb: 19 }),
    ]);
    expect(ranked.map((row) => [row.displayName, row.rank])).toEqual([
      ["B", 1],
      ["C", 2],
      ["A", 3],
    ]);
  });

  it("shares a place on a tie and skips the next one", () => {
    const ranked = rankField([
      entry({ entryId: "1", displayName: "A", bestWeightLb: 20 }),
      entry({ entryId: "2", displayName: "B", bestWeightLb: 20 }),
      entry({ entryId: "3", displayName: "C", bestWeightLb: 10 }),
    ]);
    expect(ranked.map((row) => row.rank)).toEqual([1, 1, 3]);
    expect(ranked.map((row) => row.tied)).toEqual([true, true, false]);
  });

  it("leaves an entry with nothing scored off the board rather than ranking it last", () => {
    const ranked = rankField([
      entry({ entryId: "1", displayName: "A", bestWeightLb: 20 }),
      entry({ entryId: "2", displayName: "B" }),
    ]);
    expect(ranked).toHaveLength(1);
  });

  it("does not rank an entry that is out of the tournament", () => {
    const ranked = rankField([
      entry({ entryId: "1", displayName: "A", bestWeightLb: 20, registrationStatus: "WITHDRAWN" }),
      entry({ entryId: "2", displayName: "B", bestWeightLb: 10 }),
    ]);
    expect(ranked.map((row) => row.displayName)).toEqual(["B"]);
  });
});

describe("board naming", () => {
  it("leads with the team, then the boat, then the person", () => {
    expect(boardName(entry({ entryId: "1", displayName: "M. Rivera", teamName: "Reel Deal", boatName: "Miss Ellie" }))).toBe("Reel Deal");
    expect(boardName(entry({ entryId: "1", displayName: "M. Rivera", boatName: "Miss Ellie" }))).toBe("Miss Ellie");
    expect(boardName(entry({ entryId: "1", displayName: "M. Rivera" }))).toBe("M. Rivera");
  });

  it("does not repeat a boat name that is also the team name", () => {
    expect(
      boardSubtitle(entry({ entryId: "1", displayName: "A. Lewis", teamName: "Bluewater", boatName: "Bluewater" })),
    ).toBe("A. Lewis");
  });

  it("never repeats the headline in the line under it", () => {
    expect(boardSubtitle(entry({ entryId: "1", displayName: "M. Rivera", teamName: "Reel Deal", boatName: "Miss Ellie" }))).toBe(
      "Miss Ellie · M. Rivera",
    );
    expect(boardSubtitle(entry({ entryId: "1", displayName: "M. Rivera", boatName: "Miss Ellie" }))).toBe("M. Rivera");
    expect(boardSubtitle(entry({ entryId: "1", displayName: "M. Rivera" }))).toBeNull();
  });
});
