import { describe, expect, it } from "vitest";

import { speciesById } from "@/core/ontology/species";

import { COLLECTIONS, GROUP_SPECIES_IDS, collectionById, validateCollections } from "./collections";
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

  it("has no geographic collections — spec §45.1 cut them from Phase 1", () => {
    for (const collection of COLLECTIONS) {
      expect(["family", "habitat"]).toContain(collection.collectionType);
    }
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
