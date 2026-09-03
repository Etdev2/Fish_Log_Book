import { describe, expect, it } from "vitest";

import vectors from "../vectors/achievements.json";
import type { CatchRecord, Disposition, Outcome, ResolutionState, TripRecord } from "../catch/types";
import { BADGES, badgeById } from "./catalog";
import { evaluateBadge, evaluateBadges, newlyEarned, type EvaluationInput } from "./evaluate";

interface VectorCatch {
  id: string;
  species: string | null;
  at: string;
  disposition?: string | null;
  state?: string;
  outcome?: string;
  deleted?: boolean;
}

interface VectorTrip {
  id: string;
  started: string;
  ended?: string;
  open?: boolean;
  deleted?: boolean;
}

function expandCatch(v: VectorCatch): CatchRecord {
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
    client_created_at: v.at,
    created_at: v.at,
    client_updated_at: v.at,
    deleted_at: v.deleted === true ? v.at : null,
  };
}

function expandTrip(v: VectorTrip): TripRecord {
  return {
    id: v.id,
    angler_id: "angler",
    spot_id: null,
    water_class: "salt",
    started_at: v.started,
    started_tz: "America/Los_Angeles",
    ended_at: v.open === true ? null : (v.ended ?? null),
    ended_tz: null,
    local_date: v.started.slice(0, 10),
    platform: null,
    notes: null,
    capture_mode: "live",
    client_created_at: v.started,
    created_at: v.started,
    client_updated_at: v.started,
    deleted_at: v.deleted === true ? v.started : null,
  };
}

const WATER = vectors.waterClass as Record<string, "salt" | "fresh">;

function inputFor(catches: VectorCatch[], trips: VectorTrip[]): EvaluationInput {
  return {
    catches: catches.map(expandCatch),
    trips: trips.map(expandTrip),
    knownSpeciesIds: new Set(Object.keys(WATER)),
    waterClassOf: (id) => WATER[id] ?? null,
  };
}

describe("badge evaluation", () => {
  for (const vector of vectors.cases) {
    it(vector.name, () => {
      const definition = badgeById(vector.badge);
      expect(definition).not.toBeNull();

      const standing = evaluateBadge(definition!, inputFor(vector.catches, vector.trips));
      expect(standing.earned).toBe(vector.expect.earned);
      expect(standing.current).toBe(vector.expect.current);
      expect(standing.threshold).toBe(vector.expect.threshold);
      expect(standing.awardedAt).toBe(vector.expect.awardedAt);
      expect(standing.qualifyingSourceIds).toEqual(vector.expect.sources);
    });
  }

  it("re-running produces an identical result — no duplicate awards (spec §13, §37)", () => {
    const vector = vectors.cases[3];
    const input = inputFor(vector.catches, vector.trips);
    expect(evaluateBadges(BADGES, input)).toEqual(evaluateBadges(BADGES, input));
  });

  it("does not care what order the records arrive in, which is what makes sync merges safe", () => {
    const vector = vectors.cases[3];
    const forwards = inputFor(vector.catches, vector.trips);
    const backwards = inputFor([...vector.catches].reverse(), [...vector.trips].reverse());
    expect(evaluateBadges(BADGES, backwards)).toEqual(evaluateBadges(BADGES, forwards));
  });

  it("revokes an award when its only qualifying catch is deleted (spec §13)", () => {
    const earned = evaluateBadge(badgeById("first-catch")!, inputFor(
      [{ id: "c1", species: "kelp_bass", at: "2026-03-01T14:00:00.000Z" }], [],
    ));
    expect(earned.earned).toBe(true);

    const revoked = evaluateBadge(badgeById("first-catch")!, inputFor(
      [{ id: "c1", species: "kelp_bass", at: "2026-03-01T14:00:00.000Z", deleted: true }], [],
    ));
    expect(revoked.earned).toBe(false);
    expect(revoked.awardedAt).toBeNull();
  });

  it("keeps the award's real date, not the moment it was evaluated", () => {
    const standing = evaluateBadge(badgeById("first-catch")!, inputFor(
      [{ id: "c1", species: "kelp_bass", at: "2020-07-04T14:00:00.000Z" }], [],
    ));
    expect(standing.awardedAt).toBe("2020-07-04T14:00:00.000Z");
  });
});

describe("newlyEarned", () => {
  it("reports only what crossed the line on this save (spec §14)", () => {
    const before = evaluateBadges(BADGES, inputFor([], []));
    const after = evaluateBadges(BADGES, inputFor(
      [{ id: "c1", species: "kelp_bass", at: "2026-03-01T14:00:00.000Z" }], [],
    ));

    const fresh = newlyEarned(before, after);
    expect(fresh.map((s) => s.badgeId)).toEqual(["first-catch"]);
  });

  it("stays silent when nothing changed, so no modal stacks on a repeat catch", () => {
    const standing = evaluateBadges(BADGES, inputFor(
      [{ id: "c1", species: "kelp_bass", at: "2026-03-01T14:00:00.000Z" }], [],
    ));
    expect(newlyEarned(standing, standing)).toEqual([]);
  });
});

describe("the catalog", () => {
  it("ships eight badges on five rule shapes (spec §47.3 plus the blank-trip rule)", () => {
    expect(BADGES).toHaveLength(8);
    expect(new Set(BADGES.map((b) => b.ruleType)).size).toBe(5);
  });

  it("has no streak badge, and never will (spec §12)", () => {
    for (const badge of BADGES) {
      expect(badge.ruleType).not.toContain("streak");
      expect(badge.description.toLowerCase()).not.toContain("streak");
    }
  });

  it("rewards an honest blank day, which is what ROADMAP Part 3 asked for", () => {
    const trips = badgeById("days-on-the-water-i");
    expect(trips?.ruleType).toBe("trip_count");

    // Five finished trips, not one fish between them.
    const standing = evaluateBadge(trips!, inputFor([], [
      { id: "t1", started: "2026-03-01T06:00:00.000Z", ended: "2026-03-01T12:00:00.000Z" },
      { id: "t2", started: "2026-03-08T06:00:00.000Z", ended: "2026-03-08T12:00:00.000Z" },
      { id: "t3", started: "2026-03-15T06:00:00.000Z", ended: "2026-03-15T12:00:00.000Z" },
      { id: "t4", started: "2026-03-22T06:00:00.000Z", ended: "2026-03-22T12:00:00.000Z" },
      { id: "t5", started: "2026-03-29T06:00:00.000Z", ended: "2026-03-29T12:00:00.000Z" },
    ]));
    expect(standing.earned).toBe(true);
  });

  it("carries no badge that needs a photo, a region, or a package we do not have", () => {
    const ids = BADGES.map((b) => b.id);
    expect(ids).not.toContain("photo-journal-i");
    expect(ids).not.toContain("new-waters-i");
    expect(ids).not.toContain("night-bite");
  });
});
