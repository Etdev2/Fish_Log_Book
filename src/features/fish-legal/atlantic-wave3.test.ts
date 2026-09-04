import { describe, expect, it } from "vitest";

import { speciesById } from "@/core/ontology/species";

import { CONNECTICUT } from "./connecticut-pack";
import { MAINE } from "./maine-pack";
import { NEW_HAMPSHIRE } from "./new-hampshire-pack";
import { packForRegion } from "./packs";
import { regulationCard } from "./reg-engine";

const TODAY = "2026-09-03";

describe("Atlantic wave 3 — CT / NH / ME", () => {
  it("every pack rule species exists in the vocabulary", () => {
    for (const bundle of [CONNECTICUT, NEW_HAMPSHIRE, MAINE]) {
      for (const r of bundle.rules) {
        if (r.speciesId) expect(speciesById(r.speciesId), r.id).not.toBeNull();
      }
    }
  });

  it("Settings regions resolve the three packs", () => {
    expect(packForRegion("connecticut")?.data.pack.id).toBe(CONNECTICUT.pack.id);
    expect(packForRegion("new_hampshire")?.data.pack.id).toBe(NEW_HAMPSHIRE.pack.id);
    expect(packForRegion("maine")?.data.pack.id).toBe(MAINE.pack.id);
    expect(packForRegion("northeast")?.shortCode).toBe("MA");
  });

  it("CT stripers 28–31 @1; tautog closed Sep 3; fluke 19.5 @3; BSB 4", () => {
    const sb = regulationCard(CONNECTICUT, "ct-lis", "striped_bass", TODAY, "boat");
    expect(sb!.bagDaily).toBe(1);
    expect(sb!.minSizeIn).toBe(28);
    expect(sb!.maxSizeIn).toBe(31);
    expect(regulationCard(CONNECTICUT, "ct-lis", "tautog", TODAY, "boat")!.verdict).toBe("release");
    const fluke = regulationCard(CONNECTICUT, "ct-lis", "summer_flounder", TODAY, "boat");
    expect(fluke!.minSizeIn).toBe(19.5);
    expect(fluke!.bagDaily).toBe(3);
    expect(regulationCard(CONNECTICUT, "ct-lis", "black_sea_bass", TODAY, "boat")!.bagDaily).toBe(4);
  });

  it("CT scup platform-splits: shore 9.5in, boat 11in", () => {
    expect(regulationCard(CONNECTICUT, "ct-lis", "scup", TODAY, "shore")!.minSizeIn).toBe(9.5);
    expect(regulationCard(CONNECTICUT, "ct-lis", "scup", TODAY, "boat")!.minSizeIn).toBe(11);
  });

  it("NH stripers slot @1; BSB 16.5 @4; cod open Sep 3 @1; shad prohibited", () => {
    const sb = regulationCard(NEW_HAMPSHIRE, "nh-coast", "striped_bass", TODAY, "boat");
    expect(sb!.bagDaily).toBe(1);
    expect(sb!.minSizeIn).toBe(28);
    expect(regulationCard(NEW_HAMPSHIRE, "nh-coast", "black_sea_bass", TODAY, "boat")!.minSizeIn).toBe(16.5);
    const cod = regulationCard(NEW_HAMPSHIRE, "nh-coast", "atlantic_cod", TODAY, "boat");
    expect(cod!.bagDaily).toBe(1);
    expect(cod!.minSizeIn).toBe(23);
    expect(regulationCard(NEW_HAMPSHIRE, "nh-coast", "american_shad", TODAY, "boat")!.verdict).toBe("release");
  });

  it("ME stripers slot @1; BSB 13 @10 on Sep 3; Kennebec harvest Jul–Nov", () => {
    const sb = regulationCard(MAINE, "me-coast", "striped_bass", TODAY, "boat");
    expect(sb!.bagDaily).toBe(1);
    expect(sb!.minSizeIn).toBe(28);
    expect(sb!.maxSizeIn).toBe(31);
    const bsb = regulationCard(MAINE, "me-coast", "black_sea_bass", TODAY, "boat");
    expect(bsb!.minSizeIn).toBe(13);
    expect(bsb!.bagDaily).toBe(10);
    const ken = regulationCard(MAINE, "me-kennebec", "striped_bass", TODAY, "boat");
    expect(ken!.bagDaily).toBe(1);
    expect(regulationCard(MAINE, "me-coast", "atlantic_wolffish", TODAY, "boat")!.verdict).toBe("release");
  });
  it("CT red drum 27 max @1; American shad prohibited on LIS", () => {
    const rd = regulationCard(CONNECTICUT, "ct-lis", "red_drum", TODAY, "boat");
    expect(rd!.maxSizeIn).toBe(27);
    expect(rd!.bagDaily).toBe(1);
    expect(regulationCard(CONNECTICUT, "ct-lis", "american_shad", TODAY, "boat")!.verdict).toBe("release");
  });
});
