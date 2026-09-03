import { describe, expect, it } from "vitest";

import { speciesById } from "@/core/ontology/species";

import vectors from "../vectors/slams.json";
import type { CatchRecord, Disposition, Outcome, ResolutionState } from "../catch/types";
import { SLAMS, slamById, slamsForRegion, validateSlams } from "./catalog";
import { evaluateSlam } from "./evaluate";

interface VectorCatch {
  id: string;
  species: string;
  day: string;
  disposition?: string | null;
  state?: string;
  deleted?: boolean;
}

function expand(v: VectorCatch): CatchRecord {
  const at = `${v.day}T18:00:00.000Z`;
  return {
    id: v.id,
    angler_id: "angler",
    trip_id: "trip",
    caught_at: at,
    caught_tz: "America/Los_Angeles",
    local_date: v.day,
    lat: null,
    lng: null,
    gps_accuracy_m: null,
    resolution_state: (v.state ?? "confirmed") as ResolutionState,
    dismissed_reason: null,
    resolved_at: null,
    species_id: v.species,
    species_other: null,
    outcome: "landed" as Outcome,
    disposition: (v.disposition ?? null) as Disposition | null,
    quantity: 1,
    length_mm: null,
    weight_g: null,
    size_estimated: false,
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
    client_created_at: at,
    created_at: at,
    client_updated_at: at,
    deleted_at: v.deleted === true ? at : null,
  };
}

describe("slam evaluation", () => {
  for (const vector of vectors.cases) {
    it(vector.name, () => {
      const definition = slamById(vector.slam);
      expect(definition).not.toBeNull();

      const standing = evaluateSlam(definition!, vector.catches.map(expand));
      expect(standing.achieved).toBe(vector.expect.achieved);
      expect(standing.days.map((d) => d.localDate)).toEqual(vector.expect.days);
      expect(standing.closest?.have ?? null).toBe(vector.expect.closestHave);
    });
  }

  it("does not care what order the catches arrive in", () => {
    const vector = vectors.cases[0];
    const definition = slamById(vector.slam)!;
    const forwards = evaluateSlam(definition, vector.catches.map(expand));
    const backwards = evaluateSlam(definition, [...vector.catches].reverse().map(expand));
    expect(backwards).toEqual(forwards);
  });

  it("re-running changes nothing", () => {
    const vector = vectors.cases[0];
    const definition = slamById(vector.slam)!;
    const catches = vector.catches.map(expand);
    expect(evaluateSlam(definition, catches)).toEqual(evaluateSlam(definition, catches));
  });
});

describe("the slam catalog", () => {
  it("names no species the ontology lacks, and no protected fish anywhere", () => {
    expect(
      validateSlams((id) => {
        const species = speciesById(id);
        return species === null
          ? null
          : { isGroup: species.isGroup, takeStatus: species.takeStatus };
      }),
    ).toEqual([]);
  });

  it("never targets giant sea bass — 'sea bass' in the trifecta is white seabass", () => {
    // The one confusion most likely to put a protected fish on a target list.
    const island = slamById("socal-island-trifecta")!;
    const allSpecies = island.categories.flatMap((c) => c.speciesIds);
    expect(allSpecies).toContain("white_seabass");
    expect(allSpecies).not.toContain("giant_sea_bass");
  });

  it("carries a source for every slam, so a house rule cannot pass as IGFA's", () => {
    for (const slam of SLAMS) {
      expect(slam.source.length).toBeGreaterThan(10);
    }
  });

  it("covers both coasts", () => {
    const regions = new Set(SLAMS.flatMap((s) => s.regions as readonly string[]));
    expect(regions.has("southern_california")).toBe(true);
    expect(regions.has("florida")).toBe(true);
    expect(regions.has("northeast")).toBe(true);
    expect(regions.has("texas")).toBe(true);
  });

  it("orders an angler's own region first without hiding the rest", () => {
    const ordered = slamsForRegion("northeast");
    expect(ordered).toHaveLength(SLAMS.length);
    expect((ordered[0].regions as readonly string[])).toContain("northeast");
  });

  it("qualifies on fish alone, so it needs no region on a catch (spec §45.1)", () => {
    // A Floridian slam completed by a catch record that knows nothing about Florida.
    const standing = evaluateSlam(
      slamById("igfa-inshore-grand-slam")!,
      [
        { id: "a", species: "atlantic_tarpon", day: "2026-06-10" },
        { id: "b", species: "permit", day: "2026-06-10" },
        { id: "c", species: "common_snook", day: "2026-06-10" },
      ].map(expand),
    );
    expect(standing.achieved).toBe(true);
  });
});
