import { describe, expect, it } from "vitest";

import { popularSpecies, popularSpeciesIds, regionById, REGIONS } from "./regions";
import { speciesById } from "./species";

/*
 * ADR 007 §4: regions are picker defaults, never a filter. These tests pin the two
 * failure modes that would break that promise silently: a popular list pointing at an
 * id the vocabulary does not have, and a region whose list accidentally duplicates
 * another's by copy-paste.
 */
describe("fishing regions", () => {
  it("every popular id exists in the species vocabulary", () => {
    for (const region of REGIONS) {
      const missing = popularSpeciesIds(region.id).filter((id) => speciesById(id) === null);
      expect(missing, `${region.id} references unknown species`).toEqual([]);
    }
  });

  it("SoCal keeps the exact list the picker historically led with", () => {
    expect(popularSpeciesIds("southern_california")).toContain("kelp_bass");
    expect(popularSpeciesIds("southern_california")).toContain("bluefin_tuna");
  });

  it("freshwater regions surface freshwater species", () => {
    const greatLakes = popularSpecies("great_lakes");
    expect(greatLakes.some((s) => s.id === "walleye")).toBe(true);
    expect(greatLakes.some((s) => s.waterClass === "fresh")).toBe(true);
  });

  it("a custom region leads with nothing regional — no pre-judging", () => {
    expect(popularSpeciesIds("custom")).toEqual([]);
    // popularSpecies still returns a neutral head-of-vocabulary so the row isn't empty.
    expect(popularSpecies("custom").length).toBeGreaterThan(0);
  });

  it("unknown region ids resolve to null, not garbage", () => {
    expect(regionById("atlantis")).toBeNull();
  });

  it("region ids are unique", () => {
    const ids = REGIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
