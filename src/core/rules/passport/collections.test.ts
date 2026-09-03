import { describe, expect, it } from "vitest";

import { speciesById } from "@/core/ontology/species";

import {
  COLLECTIONS,
  GROUP_SPECIES_IDS,
  collectionById,
  collectionsForRegion,
  validateCollections,
} from "./collections";
import { collectionProgress } from "./selectors";

describe("collection definitions", () => {
  it("names no species the ontology does not have, and no species twice (Ticket 2)", () => {
    expect(validateCollections()).toEqual([]);
  });

  it("ships something to collect", () => {
    expect(COLLECTIONS.length).toBeGreaterThan(0);
    for (const collection of COLLECTIONS) {
      expect(collection.species.length).toBeGreaterThan(1);
    }
  });

  it("never puts a group entry in a collection — 'Rockfish' is history, not a slot", () => {
    for (const collection of COLLECTIONS) {
      for (const entry of collection.species) {
        expect(GROUP_SPECIES_IDS.has(entry.speciesId)).toBe(false);
      }
    }
  });

  it("never requires a protected species, so every collection is legally completable (spec §11)", () => {
    for (const collection of COLLECTIONS) {
      for (const entry of collection.species) {
        const species = speciesById(entry.speciesId);
        expect(species).not.toBeNull();
        if (species?.takeStatus === "protected") {
          expect(entry.required).toBe(false);
          expect(entry.informationalOnly).toBe(true);
        }
      }
    }
  });

  it("carries the protected fish it knows about rather than hiding them", () => {
    // If this ever reaches zero the derivation above has quietly stopped working.
    const informational = COLLECTIONS.flatMap((c) => c.species).filter((s) => s.informationalOnly);
    expect(informational.length).toBeGreaterThan(0);
  });

  it("ships regional collections, built from the region ontology (founder, 2026-09-03)", () => {
    const regional = COLLECTIONS.filter((c) => c.collectionType === "region");
    expect(regional.length).toBeGreaterThan(5);
    for (const collection of regional) {
      expect(collection.regionId).not.toBeNull();
      expect(collection.species.length).toBeGreaterThan(1);
    }
  });

  it("keeps region out of qualification — the species list is the geography (§48.1)", () => {
    // collectionProgress takes caught species and group ids. It has no region parameter,
    // and this test exists so nobody adds one: a catch carries no region (§45.1).
    const socal = COLLECTIONS.find((c) => c.regionId === "southern_california");
    expect(socal).toBeDefined();

    const required = socal!.species.filter((s) => s.required).map((s) => s.speciesId);
    const progress = collectionProgress(socal!, new Set(required), GROUP_SPECIES_IDS);
    expect(progress.complete).toBe(true);
  });

  it("has no collection per groundfish management area — those are regulatory, not places", () => {
    for (const collection of COLLECTIONS) {
      expect(collection.id.startsWith("region-ca-gma")).toBe(false);
    }
  });

  it("orders an angler's own region first without hiding the rest", () => {
    const ordered = collectionsForRegion("florida");
    expect(ordered).toHaveLength(COLLECTIONS.length);
    expect(ordered[0].regionId).toBe("florida");
  });

  it("completes when every required species is caught, protected ones notwithstanding", () => {
    const bass = collectionById("bass");
    expect(bass).not.toBeNull();

    const required = bass!.species.filter((s) => s.required).map((s) => s.speciesId);
    const progress = collectionProgress(bass!, new Set(required), GROUP_SPECIES_IDS);
    expect(progress.complete).toBe(true);
    expect(progress.caught).toBe(required.length);
  });

  it("is versioned, so finishing a collection cannot be undone by a later edit", () => {
    for (const collection of COLLECTIONS) {
      expect(collection.version).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("the sea basses are not bass (founder correction, 2026-09-03)", () => {
  const idsIn = (collectionId: string) =>
    collectionById(collectionId)!.species.map((s) => s.speciesId);

  it("moves white seabass out of Bass and into Croaker, where Sciaenidae belongs", () => {
    expect(idsIn("bass")).not.toContain("white_seabass");
    expect(idsIn("croaker")).toContain("white_seabass");
  });

  it("moves black sea bass out of Bass and into Grouper, where Serranidae belongs", () => {
    expect(idsIn("bass")).not.toContain("black_sea_bass");
    expect(idsIn("grouper")).toContain("black_sea_bass");
  });

  it("moves giant sea bass with them, still protected and still not required", () => {
    expect(idsIn("bass")).not.toContain("giant_sea_bass");
    const giant = collectionById("grouper")!.species.find((s) => s.speciesId === "giant_sea_bass");
    expect(giant?.informationalOnly).toBe(true);
    expect(giant?.required).toBe(false);
  });

  it("leaves Bass holding only actual bass", () => {
    for (const id of idsIn("bass")) {
      expect(id).toMatch(/bass$/);
    }
  });

  it("ships the Marlin and Pelagic collections", () => {
    expect(idsIn("marlin")).toEqual(
      expect.arrayContaining(["blue_marlin", "black_marlin", "striped_marlin", "white_marlin"]),
    );
    expect(idsIn("pelagic")).toEqual(expect.arrayContaining(["bluefin_tuna", "dorado", "wahoo"]));
  });
});
