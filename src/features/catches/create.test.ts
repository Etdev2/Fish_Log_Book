import { describe, expect, it } from "vitest";

import { repeatSeedFrom } from "@/core/rules/catch/rules";
import type { CatchGear, CatchRecord } from "@/core/rules/catch/types";
import { captureModeFor, draftFromRecord, draftFromRepeatSeed, draftGearFrom, EMPTY_DRAFT } from "./create";

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
  presentation: "yo-yo",
  notes: "meter marks at 250",
  tags: ["night bite"],
  favorite: false,
  regulation_snapshot: null,
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

describe("captureModeFor (Historical §1, D24)", () => {
  const ZONE = "America/Los_Angeles";

  it("calls a catch live when it happens on the angler's own today", () => {
    // 2026-08-20 21:12Z is 14:12 PDT the same day.
    expect(captureModeFor("2026-08-20T14:00:00.000Z", "2026-08-20T21:12:00.000Z", ZONE)).toBe("live");
    expect(captureModeFor("2026-08-20T21:12:00.000Z", "2026-08-20T21:12:00.000Z", ZONE)).toBe("live");
  });

  it("calls yesterday a backfill, even five minutes into today", () => {
    // PDT from this era is UTC-7: 06:55Z is 23:55 the previous local day, and 07:00Z is
    // local midnight snapping over. Five wall-minutes apart, different day → backfill.
    expect(captureModeFor("2026-08-21T06:55:00.000Z", "2026-08-21T07:00:00.000Z", ZONE)).toBe("backfill");
  });

  it("compares the DAY, not the instant spread", () => {
    // Same UTC afternoon spread across a PDT midnight boundary is still a backfill.
    expect(captureModeFor("2026-08-21T06:30:00.000Z", "2026-08-22T06:30:00.000Z", ZONE)).toBe("backfill");
  });
});

describe("draftFromRecord (Historical §3 edit-in-place)", () => {
  it("round-trips every draft field off one save", () => {
    const draft = draftFromRecord(record, gear);
    expect(draft.speciesId).toBe("bluefin_tuna");
    expect(draft.weightG).toBe(38102);
    expect(draft.lengthMm).toBe(900);
    expect(draft.disposition).toBe("released");
    expect(draft.presentation).toBe("yo-yo");
    expect(draft.notes).toBe("meter marks at 250");
    expect(draft.tags).toEqual(["night bite"]);
    expect(draft.outcome).toBe("landed");
    expect(draft.gear).toEqual([
      { role: "jig", label: "Nomad Streaker 200g", detail: "Pink", tackleItemId: "t-1" },
    ]);
    expect(draft.caughtAt).toBe(NOW);
  });

  it("starts with no unsaved photos (spec §10 re-attach is explicit)", () => {
    expect(draftFromRecord(record, gear).photos).toEqual([]);
  });

  it("seeds the conditions block from the snapshot, so an untouched block survives edit", () => {
    const draft = draftFromRecord(record, gear, {
      waterTempC: 18.4,
      pressureHpa: 1013.2,
      windSpeedMs: 4.1,
      windDirDeg: 225,
    });
    expect(draft.waterTempC).toBe(18.4);
    expect(draft.windDirDeg).toBe(225);
  });

  it("leaves the conditions block empty when there is no snapshot input", () => {
    const draft = draftFromRecord(record, gear);
    expect(draft.waterTempC).toBeNull();
    expect(draft.pressureHpa).toBeNull();
    expect(draft.windSpeedMs).toBeNull();
    expect(draft.windDirDeg).toBeNull();
  });
});
