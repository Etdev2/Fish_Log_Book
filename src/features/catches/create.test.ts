import { describe, expect, it } from "vitest";

import { repeatSeedFrom } from "@/core/rules/catch/rules";
import type { CatchGear, CatchRecord } from "@/core/rules/catch/types";
import { draftFromRepeatSeed, draftGearFrom, EMPTY_DRAFT } from "./create";

const NOW = "2026-08-20T21:12:00.000Z";

const record: CatchRecord = {
  id: "c1",
  angler_id: "a1",
  trip_id: "t1",
  caught_at: NOW,
  caught_tz: "America/Los_Angeles",
  local_date: "2026-08-20",
  lat: null,
  lng: null,
  gps_accuracy_m: null,
  resolution_state: "confirmed",
  dismissed_reason: null,
  resolved_at: NOW,
  species_id: "bluefin_tuna",
  species_other: null,
  outcome: "landed",
  disposition: "released",
  quantity: 1,
  length_mm: 900,
  weight_g: 38102,
  size_estimated: false,
  spot_id: "spot-1",
  platform: "boat",
  depth_fished_m: 76.2,
  rig_id: null,
  rig_revision: null,
  inherited_fields: [],
  presentation: "yo-yo",
  notes: "meter marks at 250",
  tags: ["night bite"],
  favorite: false,
  capture_mode: "live",
  client_created_at: NOW,
  created_at: NOW,
  client_updated_at: NOW,
  deleted_at: null,
};

const gear: CatchGear[] = [
  {
    id: "g1",
    catch_id: "c1",
    angler_id: "a1",
    tackle_item_id: "t-1",
    role: "jig",
    label: "Nomad Streaker 200g",
    detail: "Pink",
    created_at: NOW,
    deleted_at: null,
  },
];

/**
 * These pin a bug that shipped once and was caught in the browser, not by the compiler:
 * `RepeatSeed` speaks the schema's column names and `CatchDraft` speaks the form's field
 * names, and spreading one into the other type-checks while dropping every value. The
 * effect was a Duplicate that opened with no species filled in.
 */
describe("draftFromRepeatSeed", () => {
  const draft = draftFromRepeatSeed(repeatSeedFrom(record, gear));

  it("carries the species across the naming boundary", () => {
    expect(draft.speciesId).toBe("bluefin_tuna");
  });

  it("carries depth, disposition, presentation and tags", () => {
    expect(draft.depthM).toBe(76.2);
    expect(draft.disposition).toBe("released");
    expect(draft.presentation).toBe("yo-yo");
    expect(draft.tags).toEqual(["night bite"]);
  });

  it("carries gear in the form's shape", () => {
    expect(draft.gear).toEqual([
      { role: "jig", label: "Nomad Streaker 200g", detail: "Pink", tackleItemId: "t-1" },
    ]);
  });

  it("does NOT carry this fish's own measurements or notes", () => {
    expect(draft.weightG).toBeNull();
    expect(draft.lengthMm).toBeNull();
    expect(draft.notes).toBeNull();
  });

  it("leaves no snake_case key behind on the draft", () => {
    const snakeKeys = Object.keys(draft).filter((key) => key.includes("_"));
    expect(snakeKeys).toEqual([]);
  });

  it("always produces a valid outcome, even from a seed with none", () => {
    const seed = { ...repeatSeedFrom(record, gear), outcome: null };
    expect(draftFromRepeatSeed(seed).outcome).toBe("landed");
  });
});

describe("draftGearFrom", () => {
  it("keeps the tackle link alongside the snapshot label", () => {
    expect(draftGearFrom(gear)[0]).toEqual({
      role: "jig",
      label: "Nomad Streaker 200g",
      detail: "Pink",
      tackleItemId: "t-1",
    });
  });

  it("survives an empty rig", () => {
    expect(draftGearFrom([])).toEqual([]);
  });
});

describe("EMPTY_DRAFT", () => {
  it("is a landed single fish with nothing else claimed", () => {
    expect(EMPTY_DRAFT.quantity).toBe(1);
    expect(EMPTY_DRAFT.outcome).toBe("landed");
    expect(EMPTY_DRAFT.speciesId).toBeNull();
    expect(EMPTY_DRAFT.sizeEstimated).toBe(false);
  });
});
