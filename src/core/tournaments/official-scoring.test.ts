import { describe, expect, it } from "vitest";

import { computeOfficialStandings } from "./official-scoring";

const catches = [
  { id: "c1", entryId: "a", speciesId: "yellowtail", weightG: 5000, lengthMm: 700, approved: true, disqualified: false },
  { id: "c2", entryId: "a", speciesId: "yellowtail", weightG: 3000, lengthMm: 600, approved: true, disqualified: false },
  { id: "c3", entryId: "b", speciesId: "dorado", weightG: 7000, lengthMm: 800, approved: true, disqualified: false },
  { id: "c4", entryId: "b", speciesId: "dorado", weightG: 9000, lengthMm: 900, approved: false, disqualified: false },
];

describe("official tournament scoring", () => {
  it("ignores unapproved catches", () => {
    const rows = computeOfficialStandings(["a", "b"], catches, [], { family: "TOTAL_WEIGHT" });
    expect(rows.find((r) => r.entryId === "a")?.score).toBe(8000);
    expect(rows.find((r) => r.entryId === "b")?.score).toBe(7000);
  });

  it("applies catch removals before scoring without mutating catch history", () => {
    const rows = computeOfficialStandings(["a"], catches, [
      { id: "p1", entryId: "a", type: "CATCH_REMOVAL", catchId: "c1", active: true },
    ], { family: "TOTAL_WEIGHT" });
    expect(rows[0].score).toBe(3000);
    expect(rows[0].eligibleCatchCount).toBe(1);
  });

  it("applies active deductions deterministically", () => {
    const rows = computeOfficialStandings(["a"], catches, [
      { id: "p1", entryId: "a", type: "WEIGHT_DEDUCTION", weightG: 1000, active: true },
    ], { family: "TOTAL_WEIGHT" });
    expect(rows[0].score).toBe(7000);
    expect(rows[0].penaltyWeightG).toBe(1000);
  });

  it("keeps reversed penalties out of the fold", () => {
    const rows = computeOfficialStandings(["a"], catches, [
      { id: "p1", entryId: "a", type: "WEIGHT_DEDUCTION", weightG: 1000, active: false },
    ], { family: "TOTAL_WEIGHT" });
    expect(rows[0].score).toBe(8000);
  });

  it("disqualifies an entry without deleting source catches", () => {
    const rows = computeOfficialStandings(["a", "b"], catches, [
      { id: "p1", entryId: "a", type: "DISQUALIFICATION", active: true },
    ], { family: "TOTAL_WEIGHT" });
    expect(rows.find((r) => r.entryId === "a")?.disqualified).toBe(true);
    expect(rows.find((r) => r.entryId === "a")?.score).toBe(0);
    expect(rows[0].entryId).toBe("b");
  });

  it("supports best-N weight", () => {
    const rows = computeOfficialStandings(["a"], catches, [], { family: "BEST_N_WEIGHT", bestN: 1 });
    expect(rows[0].score).toBe(5000);
  });

  it("is stable under input ordering", () => {
    const forward = computeOfficialStandings(["a", "b"], catches, [], { family: "TOTAL_WEIGHT" });
    const reverse = computeOfficialStandings(["b", "a"], [...catches].reverse(), [], { family: "TOTAL_WEIGHT" });
    expect(reverse).toEqual(forward);
  });
});
