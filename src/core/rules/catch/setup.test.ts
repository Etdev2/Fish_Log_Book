import { describe, expect, it } from "vitest";

import { activeRodSetups, applyLocation, nextRodSlot, rodSetupLabel } from "./rules";
import type { LocationConditionRecord, RigRecord } from "./types";

const NOW = "2026-09-01T16:00:00.000Z";

function rig(overrides: Partial<RigRecord> = {}): RigRecord {
  return {
    id: "r1",
    angler_id: "a1",
    trip_id: "t1",
    slot: 1,
    name: null,
    setup_type: "flyline",
    revision: 1,
    effective_from: NOW,
    spot_id: null,
    platform: null,
    depth_fished_m: null,
    live_bait: false,
    gear: [],
    created_at: NOW,
    retired_at: null,
    ...overrides,
  };
}

function location(overrides: Partial<LocationConditionRecord> = {}): LocationConditionRecord {
  return {
    id: "l1",
    angler_id: "a1",
    trip_id: "t1",
    spot_id: null,
    name: "West End",
    current_term: "uphill",
    current_strength: "strong",
    structure_type_ids: ["rocky_point", "kelp_edge"],
    bottom_depth_m: 54.86,
    water_color_id: "blue",
    water_clarity_id: "clear",
    notes: null,
    created_at: NOW,
    client_updated_at: NOW,
    deleted_at: null,
    ...overrides,
  };
}

describe("activeRodSetups", () => {
  it("shows the newest version of each rod, never an old one", () => {
    const rods = activeRodSetups(
      [
        rig({ id: "a", slot: 1, revision: 1 }),
        rig({ id: "b", slot: 1, revision: 2 }),
        rig({ id: "c", slot: 2, revision: 1 }),
      ],
      "t1",
    );
    expect(rods.map((r) => r.id)).toEqual(["b", "c"]);
  });

  it("orders by rod number, not by when they were rigged", () => {
    const rods = activeRodSetups([rig({ id: "a", slot: 3 }), rig({ id: "b", slot: 1 })], "t1");
    expect(rods.map((r) => r.slot)).toEqual([1, 3]);
  });

  it("drops a rod that was put away", () => {
    const rods = activeRodSetups(
      [rig({ id: "a", slot: 1, revision: 1 }), rig({ id: "b", slot: 1, revision: 2, retired_at: NOW })],
      "t1",
    );
    expect(rods).toHaveLength(0);
  });

  it("never leaks another trip's rods", () => {
    expect(activeRodSetups([rig({ trip_id: "other" })], "t1")).toHaveLength(0);
  });
});

describe("rodSetupLabel", () => {
  it("prefers the angler's own name", () => {
    expect(rodSetupLabel({ slot: 1, name: "40 lb Flyline" })).toBe("40 lb Flyline");
  });

  it("falls back to the slot", () => {
    expect(rodSetupLabel({ slot: 2, name: null })).toBe("Rod 2");
  });

  it("treats a whitespace-only name as no name", () => {
    expect(rodSetupLabel({ slot: 3, name: "   " })).toBe("Rod 3");
  });
});

describe("nextRodSlot", () => {
  it("starts at Rod 1", () => {
    expect(nextRodSlot([], "t1")).toBe(1);
  });

  it("never reuses a slot, even a retired one", () => {
    expect(nextRodSlot([rig({ slot: 1 }), rig({ slot: 2, retired_at: NOW })], "t1")).toBe(3);
  });

  it("is unaffected by another trip", () => {
    expect(nextRodSlot([rig({ slot: 9, trip_id: "other" })], "t1")).toBe(1);
  });
});

describe("applyLocation — the copy that makes history honest (spec §10)", () => {
  it("copies every observed value onto the catch", () => {
    const applied = applyLocation(location());
    expect(applied.location_name).toBe("West End");
    expect(applied.current_term).toBe("uphill");
    expect(applied.current_strength).toBe("strong");
    expect(applied.bottom_depth_m).toBe(54.86);
    expect(applied.water_color_id).toBe("blue");
  });

  it("keeps the id so 'how has West End fished' can still join", () => {
    expect(applyLocation(location()).location_condition_id).toBe("l1");
  });

  it("copies structure by VALUE, so editing the preset cannot retell the fish", () => {
    const preset = location();
    const applied = applyLocation(preset);
    // Mutating the source array must not reach the catch's copy.
    (preset.structure_type_ids as string[]).push("wreck");
    expect(applied.structure_type_ids).toEqual(["rocky_point", "kelp_edge"]);
  });

  it("keeps 'Rocky + Kelp' as one place rather than two", () => {
    expect(applyLocation(location()).structure_type_ids).toHaveLength(2);
  });

  it("claims nothing when no location was chosen", () => {
    const applied = applyLocation(null);
    expect(applied.location_condition_id).toBeNull();
    expect(applied.current_term).toBeNull();
    expect(applied.structure_type_ids).toEqual([]);
  });

  it("keeps water depth separate from anything about the fish (spec §13)", () => {
    // bottom_depth_m is the only depth this function touches; depth_fished_m is the
    // rod's business and must never be filled in from the spot's bottom.
    const applied = applyLocation(location({ bottom_depth_m: 182.88 })) as unknown as Record<string, unknown>;
    expect(applied.bottom_depth_m).toBe(182.88);
    expect(applied.depth_fished_m).toBeUndefined();
  });
});

/**
 * The smart-default rule the sheet applies (spec §16). Kept here as a plain predicate so
 * the intent is testable without mounting React: preselect only when there is nothing to
 * choose between, and never guess among several.
 */
function defaultSelection<T extends { id: string }>(
  options: readonly T[],
  seeded: string | null,
): string | null {
  if (seeded) return seeded;
  return options.length === 1 ? options[0].id : null;
}

describe("smart defaults (spec §16)", () => {
  it("preselects the only rod, because there is nothing to choose between", () => {
    expect(defaultSelection([{ id: "r1" }], null)).toBe("r1");
  });

  it("guesses nothing when several rods are out", () => {
    expect(defaultSelection([{ id: "r1" }, { id: "r2" }], null)).toBeNull();
  });

  it("prefers what the previous catch used over the single-option rule", () => {
    expect(defaultSelection([{ id: "r1" }, { id: "r2" }], "r2")).toBe("r2");
  });

  it("selects nothing when nothing is set up", () => {
    expect(defaultSelection([], null)).toBeNull();
  });
});
