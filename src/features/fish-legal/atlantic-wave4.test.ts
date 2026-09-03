import { describe, expect, it } from "vitest";

import { speciesById } from "@/core/ontology/species";

import { DELAWARE } from "./delaware-pack";
import { GEORGIA } from "./georgia-pack";
import { MARYLAND } from "./maryland-pack";
import { NORTH_CAROLINA } from "./north-carolina-pack";
import { packForRegion } from "./packs";
import { regulationCard } from "./reg-engine";
import { SOUTH_CAROLINA } from "./south-carolina-pack";
import { VIRGINIA } from "./virginia-pack";

const TODAY = "2026-09-03";
const BUNDLES = [DELAWARE, MARYLAND, VIRGINIA, NORTH_CAROLINA, SOUTH_CAROLINA, GEORGIA];

describe("Atlantic wave 4 — DE / MD / VA / NC / SC / GA", () => {
  it("every pack rule species exists in the vocabulary", () => {
    for (const bundle of BUNDLES) {
      for (const r of bundle.rules) {
        if (r.speciesId) expect(speciesById(r.speciesId), r.id).not.toBeNull();
      }
    }
  });

  it("Settings regions resolve the six packs", () => {
    expect(packForRegion("delaware")?.shortCode).toBe("DE");
    expect(packForRegion("maryland")?.shortCode).toBe("MD");
    expect(packForRegion("virginia")?.shortCode).toBe("VA");
    expect(packForRegion("north_carolina")?.shortCode).toBe("NC");
    expect(packForRegion("south_carolina")?.shortCode).toBe("SC");
    expect(packForRegion("georgia")?.shortCode).toBe("GA");
  });

  it("DE tautog 16 @4 on Sep 3; fluke 17.5 @4; stripers slot @1", () => {
    expect(regulationCard(DELAWARE, "de-tidal", "tautog", TODAY, "boat")!.bagDaily).toBe(4);
    expect(regulationCard(DELAWARE, "de-tidal", "summer_flounder", TODAY, "boat")!.minSizeIn).toBe(17.5);
    expect(regulationCard(DELAWARE, "de-tidal", "striped_bass", TODAY, "boat")!.bagDaily).toBe(1);
  });

  it("MD ocean stripers 28–31; Bay 19–24 on Sep 3; fluke 17.5 @4", () => {
    const ocean = regulationCard(MARYLAND, "md-atlantic", "striped_bass", TODAY, "boat");
    expect(ocean!.minSizeIn).toBe(28);
    const bay = regulationCard(MARYLAND, "md-chesapeake", "striped_bass", TODAY, "boat");
    expect(bay!.minSizeIn).toBe(19);
    expect(bay!.maxSizeIn).toBe(24);
    expect(regulationCard(MARYLAND, "md-atlantic", "summer_flounder", TODAY, "boat")!.minSizeIn).toBe(17.5);
  });

  it("VA coastal stripers open Sep 3; BSB bag 15", () => {
    expect(regulationCard(VIRGINIA, "va-coast", "striped_bass", TODAY, "boat")!.bagDaily).toBe(1);
    expect(regulationCard(VIRGINIA, "va-coast", "black_sea_bass", TODAY, "boat")!.bagDaily).toBe(15);
  });

  it("NC flounder open Sep 1–14; red drum 18–27 @1; tarpon prohibited", () => {
    const fl = regulationCard(NORTH_CAROLINA, "nc-coastal", "southern_flounder", TODAY, "boat");
    expect(fl!.bagDaily).toBe(1);
    expect(regulationCard(NORTH_CAROLINA, "nc-coastal", "red_drum", TODAY, "boat")!.bagDaily).toBe(1);
    expect(regulationCard(NORTH_CAROLINA, "nc-coastal", "atlantic_tarpon", TODAY, "boat")!.verdict).toBe("release");
  });

  it("SC red drum 18–25 @1; stripers closed Sep 3", () => {
    const rd = regulationCard(SOUTH_CAROLINA, "sc-state-waters", "red_drum", TODAY, "boat");
    expect(rd!.minSizeIn).toBe(18);
    expect(rd!.maxSizeIn).toBe(25);
    expect(rd!.bagDaily).toBe(1);
    expect(regulationCard(SOUTH_CAROLINA, "sc-state-waters", "striped_bass", TODAY, "boat")!.verdict).toBe("release");
  });

  it("GA red drum 14–23 @5; cobia open @1", () => {
    const rd = regulationCard(GEORGIA, "ga-state-waters", "red_drum", TODAY, "boat");
    expect(rd!.bagDaily).toBe(5);
    expect(rd!.minSizeIn).toBe(14);
    expect(regulationCard(GEORGIA, "ga-state-waters", "cobia", TODAY, "boat")!.bagDaily).toBe(1);
  });
});
