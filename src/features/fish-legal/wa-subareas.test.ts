import { describe, expect, it } from "vitest";

import { speciesById } from "@/core/ontology/species";

import { packForRegion } from "./packs";
import { regulationCard } from "./reg-engine";
import { WASHINGTON } from "./washington-pack";

const TODAY = "2026-09-03";

describe("Washington v7 — remaining Marine Area pamphlet tables", () => {
  it("every rule species exists in the vocabulary", () => {
    for (const r of WASHINGTON.rules) {
      if (r.speciesId) expect(speciesById(r.speciesId), r.id).not.toBeNull();
    }
  });

  it("pack version 7 and washington still resolves", () => {
    expect(WASHINGTON.pack.version).toBe(7);
    expect(packForRegion("washington")?.data.pack.version).toBe(7);
  });

  it("MA 5 allows the first 3 black/blue rockfish west of Slip Point in season", () => {
    const card = regulationCard(WASHINGTON, "wa-ma-5", "black_rockfish", TODAY, "boat");
    expect(card!.bagDaily).toBe(3);
  });

  it("MA 6 Pacific cod is 2/day; rockfish is release", () => {
    expect(regulationCard(WASHINGTON, "wa-ma-6", "pacific_cod", TODAY, "boat")!.bagDaily).toBe(2);
    expect(regulationCard(WASHINGTON, "wa-ma-6", "rockfish", TODAY, "boat")!.verdict).toBe("release");
  });

  it("MA 11 and 12 halibut are closed; MA 12 lingcod is closed", () => {
    expect(regulationCard(WASHINGTON, "wa-ma-11", "pacific_halibut", TODAY, "boat")!.verdict).toBe("release");
    expect(regulationCard(WASHINGTON, "wa-ma-12", "pacific_halibut", TODAY, "boat")!.verdict).toBe("release");
    expect(regulationCard(WASHINGTON, "wa-ma-12", "lingcod", TODAY, "boat")!.verdict).toBe("release");
  });

  it("MA 12 flatfish 15/day; MA 8-1 lingcod 1 in the May–June window", () => {
    expect(regulationCard(WASHINGTON, "wa-ma-12", "flatfish", TODAY, "boat")!.bagDaily).toBe(15);
    expect(regulationCard(WASHINGTON, "wa-ma-8-1", "lingcod", "2026-05-20", "boat")!.bagDaily).toBe(1);
  });
});
