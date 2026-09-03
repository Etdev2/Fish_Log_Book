import { describe, expect, it } from "vitest";

import vectors from "../vectors/passport.json";
import type { CatchRecord, Disposition, Outcome, ResolutionState } from "../catch/types";
import { collectionProgress, passportTotals, speciesSummaries } from "./selectors";
import type { CollectionDefinition } from "./types";

/**
 * The compact catch shape the vectors are written in. A full CatchRecord is forty fields
 * and none of the other thirty-odd change any answer here, so the vector states what
 * matters and this expands it. A second client reproduces the vectors by writing the same
 * twenty lines.
 */
interface VectorCatch {
  id: string;
  species: string | null;
  at: string;
  quantity?: number;
  disposition?: string | null;
  lengthMm?: number | null;
  weightG?: number | null;
  estimated?: boolean;
  state?: string;
  outcome?: string;
  deleted?: boolean;
}

function expand(v: VectorCatch): CatchRecord {
  return {
    id: v.id,
    angler_id: "angler",
    trip_id: "trip",
    caught_at: v.at,
    caught_tz: "America/Los_Angeles",
    local_date: v.at.slice(0, 10),
    lat: null,
    lng: null,
    gps_accuracy_m: null,
    resolution_state: (v.state ?? "confirmed") as ResolutionState,
    dismissed_reason: null,
    resolved_at: null,
    species_id: v.species,
    species_other: null,
    outcome: (v.outcome ?? "landed") as Outcome,
    disposition: (v.disposition ?? null) as Disposition | null,
    quantity: v.quantity ?? 1,
    length_mm: v.lengthMm ?? null,
    weight_g: v.weightG ?? null,
    size_estimated: v.estimated ?? false,
    spot_id: null,
    platform: null,
    depth_fished_m: null,
    rig_id: null,
    rig_revision: null,
    rig_slot: null,
    inherited_fields: [],
    location_condition_id: null,
    location_name: null,
    current_term: null,
    current_strength: null,
    structure_type_ids: [],
    bottom_depth_m: null,
    water_color_id: null,
    water_clarity_id: null,
    presentation: null,
    notes: null,
    tags: [],
    favorite: false,
    regulation_snapshot: null,
    capture_mode: "live",
    client_created_at: v.at,
    created_at: v.at,
    client_updated_at: v.at,
    deleted_at: v.deleted === true ? v.at : null,
  };
}

const KNOWN = new Set(vectors.knownSpecies);
const GROUPS = new Set(vectors.groupSpecies);

describe("speciesSummaries", () => {
  for (const vector of vectors.summaries) {
    it(vector.name, () => {
      const summaries = speciesSummaries(vector.catches.map(expand), KNOWN);
      expect(summaries).toHaveLength(vector.expect.length);

      vector.expect.forEach((want, i) => {
        const got = summaries[i];
        expect(got.speciesId).toBe(want.speciesId);
        expect(got.catchCount).toBe(want.catchCount);
        expect(got.fishCount).toBe(want.fishCount);
        expect(got.keptCount).toBe(want.keptCount);
        expect(got.releasedCount).toBe(want.releasedCount);
        expect(got.firstCatchId).toBe(want.firstCatchId);
        expect(got.latestCatchId).toBe(want.latestCatchId);
        expect(got.bestLength?.catchId ?? null).toBe(want.bestLengthCatchId);
        expect(got.bestLength?.value ?? null).toBe(want.bestLengthValue);
        expect(got.bestWeight?.catchId ?? null).toBe(want.bestWeightCatchId);
        expect(got.bestWeight?.value ?? null).toBe(want.bestWeightValue);
      });
    });
  }

  it("is deterministic regardless of input order — the same log gives the same passport", () => {
    const catches = vectors.summaries[0].catches.map(expand);
    const forwards = speciesSummaries(catches, KNOWN);
    const backwards = speciesSummaries([...catches].reverse(), KNOWN);
    expect(backwards).toEqual(forwards);
  });

  it("re-running over the same catches changes nothing (spec §37: no duplicate credit)", () => {
    const catches = vectors.summaries[0].catches.map(expand);
    expect(speciesSummaries(catches, KNOWN)).toEqual(speciesSummaries(catches, KNOWN));
  });

  it("deleting the only catch of a species removes it from the passport (spec §10)", () => {
    const [only] = vectors.summaries[0].catches;
    const live = speciesSummaries([expand(only)], KNOWN);
    expect(live).toHaveLength(1);

    const deleted = speciesSummaries([expand({ ...only, deleted: true })], KNOWN);
    expect(deleted).toHaveLength(0);
  });

  it("editing a catch from one species to another recalculates both (spec §10)", () => {
    const [original] = vectors.summaries[0].catches;
    const before = speciesSummaries([expand(original)], KNOWN);
    expect(before[0].speciesId).toBe("kelp_bass");

    const after = speciesSummaries([expand({ ...original, species: "largemouth_bass" })], KNOWN);
    expect(after).toHaveLength(1);
    expect(after[0].speciesId).toBe("largemouth_bass");
  });
});

describe("passportTotals", () => {
  for (const vector of vectors.totals) {
    it(vector.name, () => {
      const totals = passportTotals(speciesSummaries(vector.catches.map(expand), KNOWN));
      expect(totals.uniqueSpecies).toBe(vector.expect.uniqueSpecies);
      expect(totals.totalCatches).toBe(vector.expect.totalCatches);
      expect(totals.totalFish).toBe(vector.expect.totalFish);
      expect(totals.keptCount).toBe(vector.expect.keptCount);
      expect(totals.releasedCount).toBe(vector.expect.releasedCount);
      expect(totals.latestNewSpecies?.speciesId ?? null).toBe(vector.expect.latestNewSpeciesId);
    });
  }
});

describe("collectionProgress", () => {
  for (const vector of vectors.collectionProgress) {
    it(vector.name, () => {
      const definition: CollectionDefinition = {
        id: vector.definition.id,
        slug: vector.definition.id,
        name: vector.definition.id,
        description: "",
        collectionType: "family",
        version: 1,
        active: true,
        species: [
          ...vector.definition.required.map((speciesId, i) => ({
            speciesId,
            required: true,
            informationalOnly: false,
            sortOrder: i,
          })),
          ...vector.definition.informational.map((speciesId, i) => ({
            speciesId,
            required: false,
            informationalOnly: true,
            sortOrder: 100 + i,
          })),
        ],
      };

      const progress = collectionProgress(definition, new Set(vector.caught), GROUPS);
      expect(progress.caught).toBe(vector.expect.caught);
      expect(progress.required).toBe(vector.expect.required);
      expect(progress.informationalCaught).toBe(vector.expect.informationalCaught);
      expect(progress.complete).toBe(vector.expect.complete);
    });
  }

  it("a collection with nothing required is never silently complete", () => {
    const empty: CollectionDefinition = {
      id: "empty",
      slug: "empty",
      name: "Empty",
      description: "",
      collectionType: "family",
      version: 1,
      active: true,
      species: [],
    };
    expect(collectionProgress(empty, new Set(), GROUPS).complete).toBe(false);
  });
});
