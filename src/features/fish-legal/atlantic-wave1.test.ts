import { describe, expect, it } from "vitest";

import { speciesById } from "@/core/ontology/species";

import { MASSACHUSETTS } from "./massachusetts-pack";
import { packForRegion } from "./packs";
import { regulationCard } from "./reg-engine";

const TODAY = "2026-09-03";

describe("Atlantic wave 1 — Massachusetts pack (DMF table, 2026-04-28)", () => {
  it("every pack rule species exists in the vocabulary", () => {
    for (const r of MASSACHUSETTS.rules) {
      if (r.speciesId) expect(speciesById(r.speciesId), r.id).not.toBeNull();
    }
  });

  it("the northeast region resolves the Massachusetts pack", () => {
    expect(packForRegion("northeast")?.data.pack.id).toBe(MASSACHUSETTS.pack.id);
  });

  it("striped bass keeps the 28–31 slot, 1/day", () => {
    const card = regulationCard(MASSACHUSETTS, "ma-statewide", "striped_bass", TODAY, "boat");
    expect(card).not.toBeNull();
    expect(card!.bagDaily).toBe(1);
    expect(card!.minSizeIn).toBe(28);
    expect(card!.maxSizeIn).toBe(31);
  });

  it("tautog reads the seasonal ladder — 3/day on the September window", () => {
    const card = regulationCard(MASSACHUSETTS, "ma-statewide", "tautog", TODAY, "boat");
    expect(card!.bagDaily).toBe(3);
    expect(card!.minSizeIn).toBe(16);
    // …and 3/day again on the April window, 1/day in June
    expect(regulationCard(MASSACHUSETTS, "ma-statewide", "tautog", "2026-06-15", "boat")!.bagDaily).toBe(1);
  });

  it("scup platform-splits: shore 9.5in, boat 11in", () => {
    const shore = regulationCard(MASSACHUSETTS, "ma-statewide", "scup", "2026-09-10", "shore");
    const boat = regulationCard(MASSACHUSETTS, "ma-statewide", "scup", "2026-09-10", "boat");
    expect(shore!.minSizeIn).toBe(9.5);
    expect(boat!.minSizeIn).toBe(11);
  });

  it("SNE cod is prohibited outright; WGOM cod is a fall 1-fish window", () => {
    const sne = regulationCard(MASSACHUSETTS, "ma-sne", "atlantic_cod", TODAY, "boat");
    expect(sne!.verdict).toBe("release");
    const gom = regulationCard(MASSACHUSETTS, "ma-wgom", "atlantic_cod", "2026-09-20", "boat");
    expect(gom!.bagDaily).toBe(1);
    expect(gom!.minSizeIn).toBe(23);
  });

  it("summer flounder closes after Sep 23 (no year-round row stands)", () => {
    const card = regulationCard(MASSACHUSETTS, "ma-statewide", "summer_flounder", "2026-10-15", "boat");
    expect(card).not.toBeNull();
    expect(card!.verdict).toBe("release");
  });

  it("ocean pout is release regardless", () => {
    const card = regulationCard(MASSACHUSETTS, "ma-statewide", "ocean_pout", TODAY, "boat");
    expect(card!.verdict).toBe("release");
  });
});
