import { describe, expect, it } from "vitest";

import vectors from "./vectors/setup-progress.json";
import {
  SETUP_STEPS,
  allStepsDone,
  observedSteps,
  setupSteps,
  stepsToLatch,
  type SetupStepId,
} from "./setup-progress";
import type { CatchRecord, LocationConditionRecord, RigRecord } from "./catch/types";

const NOW = "2026-09-04T16:00:00.000Z";

interface VectorLocation {
  named?: boolean;
  deleted?: boolean;
  current_term?: string;
  current_strength?: string;
  structure_type_ids?: string[];
  bottom_depth_m?: number;
  water_color_id?: string;
  water_clarity_id?: string;
}

function location(spec: VectorLocation, index: number): LocationConditionRecord {
  return {
    id: `l${index}`,
    angler_id: "a1",
    trip_id: "t1",
    name: spec.named ? `Spot ${index}` : "",
    current_term: (spec.current_term as LocationConditionRecord["current_term"]) ?? null,
    current_strength: (spec.current_strength as LocationConditionRecord["current_strength"]) ?? null,
    structure_type_ids: spec.structure_type_ids ?? [],
    bottom_depth_m: spec.bottom_depth_m ?? null,
    water_color_id: spec.water_color_id ?? null,
    water_clarity_id: spec.water_clarity_id ?? null,
    spot_id: null,
    notes: null,
    created_at: NOW,
    client_updated_at: NOW,
    deleted_at: spec.deleted ? NOW : null,
  } as LocationConditionRecord;
}

function rig(retired: boolean): RigRecord {
  return {
    id: "r1",
    angler_id: "a1",
    trip_id: "t1",
    slot: 1,
    name: null,
    setup_type: null,
    revision: 1,
    effective_from: NOW,
    spot_id: null,
    platform: null,
    depth_fished_m: null,
    live_bait: false,
    gear: [],
    created_at: NOW,
    retired_at: retired ? NOW : null,
  };
}

function catchRecord(state: string, deleted: boolean): CatchRecord {
  return { id: "c1", state, deleted_at: deleted ? NOW : null } as unknown as CatchRecord;
}

describe("setup progress vectors", () => {
  for (const vector of vectors.cases) {
    it(vector.name, () => {
      const log = vector.log as {
        locations: VectorLocation[];
        tackleItemCount: number;
        rigs: number;
        rigsRetired?: boolean;
        catches: number;
        catchState?: string;
        catchDeleted?: boolean;
      };

      const observed = observedSteps({
        locations: log.locations.map(location),
        tackleItemCount: log.tackleItemCount,
        rigs: log.rigs > 0 ? [rig(log.rigsRetired ?? false)] : [],
        catches:
          log.catches > 0
            ? [catchRecord(log.catchState ?? "confirmed", log.catchDeleted ?? false)]
            : [],
      });

      const latched = new Set(vector.latched as SetupStepId[]);
      const steps = setupSteps(latched, observed);

      expect(steps.filter((s) => s.done).map((s) => s.id).sort()).toEqual(
        [...(vector.expectDone as SetupStepId[])].sort(),
      );
      expect([...stepsToLatch(latched, observed)].sort()).toEqual(
        [...(vector.expectLatch as SetupStepId[])].sort(),
      );
      expect(allStepsDone(steps)).toBe(vector.expectAllDone);
    });
  }
});

describe("setup progress copy", () => {
  it("keeps the founder's order and gives every step a label, hint and destination", () => {
    const steps = setupSteps(new Set(), new Set());
    expect(steps.map((s) => s.id)).toEqual([...SETUP_STEPS]);
    for (const step of steps) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.hint.length).toBeGreaterThan(0);
      expect(step.href.startsWith("/")).toBe(true);
    }
  });

  it("never un-completes a latched step, whatever the log says", () => {
    // The property the whole design rests on, asserted directly rather than only via a
    // vector: latching is one-way.
    for (const id of SETUP_STEPS) {
      const steps = setupSteps(new Set([id]), new Set());
      expect(steps.find((s) => s.id === id)!.done).toBe(true);
    }
  });
});
