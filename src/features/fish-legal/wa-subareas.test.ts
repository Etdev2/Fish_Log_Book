import { describe, expect, it } from "vitest";

import { speciesById } from "@/core/ontology/species";
import { regionById } from "@/core/ontology/regions";

import { packForRegion } from "./packs";
import { regulationCard } from "./reg-engine";
import { WASHINGTON } from "./washington-pack";

const TODAY = "2026-09-03";

describe("Washington v8 — Marine Area Settings regions", () => {
  it("every rule species exists in the vocabulary", () => {
    for (const r of WASHINGTON.rules) {
      if (r.speciesId) expect(speciesById(r.speciesId), r.id).not.toBeNull();
    }
  });

  it("pack version 8 and the coast region still resolves to MA 1–4", () => {
    expect(WASHINGTON.pack.version).toBe(8);
    expect(packForRegion("washington")?.primaryAreaId).toBe("wa-ma-1-4-coastal");
    expect(packForRegion("washington")?.data.pack.version).toBe(8);
  });

  it("each Marine Area is a selectable Settings region with its own focus area", () => {
    const MAS = [
      ["wa_ma_1_4", "wa-ma-1-4-coastal"],
      ["wa_ma_4_east", "wa-ma4-east"],
      ["wa_ma_5", "wa-ma-5"],
      ["wa_ma_6", "wa-ma-6"],
      ["wa_ma_7", "wa-ma-7"],
      ["wa_ma_8_1", "wa-ma-8-1"],
      ["wa_ma_8_2", "wa-ma-8-2"],
      ["wa_ma_9", "wa-ma-9"],
      ["wa_ma_10", "wa-ma-10"],
      ["wa_ma_11", "wa-ma-11"],
      ["wa_ma_12", "wa-ma-12"],
      ["wa_ma_13", "wa-ma-13"],
    ] as const;
    for (const [id, area] of MAS) {
      expect(regionById(id), id).not.toBeNull();
      const bundle = packForRegion(id);
      expect(bundle, id).not.toBeNull();
      expect(bundle!.primaryAreaId, id).toBe(area);
      expect(bundle!.jurisdictionLabel, id).toContain("WDFW");
    }
  });

  it("MA 5 allows the first 3 black/blue rockfish west of Slip Point in season", () => {
    const card = regulationCard(WASHINGTON, "wa-ma-5", "black_rockfish", TODAY, "boat");
    expect(card!.bagDaily).toBe(3);
    expect(regulationCard(WASHINGTON, "wa-ma-5", "rockfish", TODAY, "boat")!.bagDaily).toBe(3);
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

  it("MA 9/10 Seattle-side halibut is 1/day on Sep 3 (fall window), not the coastal 9-fish bag", () => {
    const seattle = packForRegion("wa_ma_10")!;
    const card = regulationCard(seattle.data, seattle.primaryAreaId, "pacific_halibut", TODAY, "boat");
    expect(card!.bagDaily).toBe(1);
    expect(card!.verdict).not.toBe("release");
    const coast = regulationCard(WASHINGTON, "wa-ma-1-4-coastal", "lingcod", TODAY, "boat");
    expect(coast!.bagDaily).toBe(2);
  });

  it("does not apply the Sound 15-bottomfish / rockfish-closed template to MA 5 or MA 12", () => {
    expect(regulationCard(WASHINGTON, "wa-ma-5", "rockfish", TODAY, "boat")!.verdict).not.toBe("release");
    expect(regulationCard(WASHINGTON, "wa-ma-12", "cabezon", TODAY, "boat")!.verdict).toBe("release");
    expect(regulationCard(WASHINGTON, "wa-ma-9", "rockfish", TODAY, "boat")!.verdict).toBe("release");
  });
});
