import { describe, expect, it } from "vitest";

import { speciesById } from "@/core/ontology/species";

import { NEW_JERSEY } from "./new-jersey-pack";
import { NEW_YORK } from "./new-york-pack";
import { packForRegion } from "./packs";
import { regulationCard } from "./reg-engine";
import { RHODE_ISLAND } from "./rhode-island-pack";

const TODAY = "2026-09-03";

describe("Atlantic wave 2 — RI / NY / NJ", () => {
  it("every pack rule species exists in the vocabulary", () => {
    for (const bundle of [RHODE_ISLAND, NEW_YORK, NEW_JERSEY]) {
      for (const r of bundle.rules) {
        if (r.speciesId) expect(speciesById(r.speciesId), r.id).not.toBeNull();
      }
    }
  });

  it("Settings regions resolve the three packs", () => {
    expect(packForRegion("rhode_island")?.data.pack.id).toBe(RHODE_ISLAND.pack.id);
    expect(packForRegion("new_york")?.data.pack.id).toBe(NEW_YORK.pack.id);
    expect(packForRegion("new_jersey")?.data.pack.id).toBe(NEW_JERSEY.pack.id);
    expect(packForRegion("northeast")?.shortCode).toBe("MA");
  });

  it("RI stripers 28–31 @1; tautog 3 on Sep 3; cod prohibited", () => {
    const sb = regulationCard(RHODE_ISLAND, "ri-statewide", "striped_bass", TODAY, "boat");
    expect(sb!.bagDaily).toBe(1);
    expect(sb!.minSizeIn).toBe(28);
    expect(sb!.maxSizeIn).toBe(31);
    expect(regulationCard(RHODE_ISLAND, "ri-statewide", "tautog", TODAY, "boat")!.bagDaily).toBe(3);
    expect(regulationCard(RHODE_ISLAND, "ri-statewide", "atlantic_cod", TODAY, "boat")!.verdict).toBe("release");
  });

  it("NY marine fluke is 19.5in on Sep 3; BSB 6; LIS tautog closed in September", () => {
    const fluke = regulationCard(NEW_YORK, "ny-marine", "summer_flounder", TODAY, "boat");
    expect(fluke!.minSizeIn).toBe(19.5);
    expect(fluke!.bagDaily).toBe(3);
    expect(regulationCard(NEW_YORK, "ny-marine", "black_sea_bass", TODAY, "boat")!.bagDaily).toBe(6);
    const tog = regulationCard(NEW_YORK, "ny-lis", "tautog", TODAY, "boat");
    expect(tog!.verdict).toBe("release");
  });

  it("NY scup platform-splits: shore 9.5in, boat 11in", () => {
    expect(regulationCard(NEW_YORK, "ny-marine", "scup", TODAY, "shore")!.minSizeIn).toBe(9.5);
    expect(regulationCard(NEW_YORK, "ny-marine", "scup", TODAY, "boat")!.minSizeIn).toBe(11);
  });

  it("NJ fluke 18in @3; BSB 1-fish summer window; tautog 1 in September", () => {
    const fluke = regulationCard(NEW_JERSEY, "nj-marine", "summer_flounder", TODAY, "boat");
    expect(fluke!.minSizeIn).toBe(18);
    expect(fluke!.bagDaily).toBe(3);
    expect(regulationCard(NEW_JERSEY, "nj-ibsp", "summer_flounder", TODAY, "shore")!.minSizeIn).toBe(16);
    expect(regulationCard(NEW_JERSEY, "nj-marine", "black_sea_bass", TODAY, "boat")!.bagDaily).toBe(1);
    expect(regulationCard(NEW_JERSEY, "nj-marine", "tautog", TODAY, "boat")!.bagDaily).toBe(1);
  });
  it("NY Spanish 14 @15; king 23 @3; red drum max 27", () => {
    const sm = regulationCard(NEW_YORK, "ny-marine", "spanish_mackerel", TODAY, "boat");
    expect(sm!.minSizeIn).toBe(14);
    expect(sm!.bagDaily).toBe(15);
    expect(regulationCard(NEW_YORK, "ny-marine", "king_mackerel", TODAY, "boat")!.minSizeIn).toBe(23);
    expect(regulationCard(NEW_YORK, "ny-marine", "red_drum", TODAY, "boat")!.maxSizeIn).toBe(27);
  });

  it("NJ cobia 43 @1; Spanish 14 @10; king 23 @3", () => {
    const cobia = regulationCard(NEW_JERSEY, "nj-marine", "cobia", TODAY, "boat");
    expect(cobia!.minSizeIn).toBe(43);
    expect(cobia!.bagDaily).toBe(1);
    expect(regulationCard(NEW_JERSEY, "nj-marine", "spanish_mackerel", TODAY, "boat")!.bagDaily).toBe(10);
    expect(regulationCard(NEW_JERSEY, "nj-marine", "king_mackerel", TODAY, "boat")!.minSizeIn).toBe(23);
  });
});
