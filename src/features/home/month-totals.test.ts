import { describe, expect, it } from "vitest";

import type { CatchRecord } from "@/core/rules/catch/types";

import { fishInMonth, isOnTheWater } from "./month-totals";

const NOW = "2026-10-12T21:12:00.000Z";

function record(overrides: Partial<CatchRecord> = {}): CatchRecord {
  return {
    id: "c1",
    angler_id: "a1",
    trip_id: "t1",
    caught_at: NOW,
    caught_tz: "America/Los_Angeles",
    local_date: "2026-10-12",
    lat: null,
    lng: null,
    gps_accuracy_m: null,
    resolution_state: "confirmed",
    dismissed_reason: null,
    resolved_at: NOW,
    species_id: "bluefin_tuna",
    species_other: null,
    outcome: "landed",
    disposition: "kept",
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
    client_created_at: NOW,
    created_at: NOW,
    client_updated_at: NOW,
    deleted_at: null,
    ...overrides,
  };
}

const quickMark = { resolution_state: "unresolved", resolved_at: null, species_id: null, outcome: null } as const;
const misTap = { resolution_state: "dismissed", dismissed_reason: "mistap" } as const;

describe("fishInMonth (D22: only confirmed, landed fish count)", () => {
  it("counts confirmed landed fish by quantity", () => {
    expect(fishInMonth([record({ quantity: 3 }), record({ id: "c2" })], "2026-10")).toBe(4);
  });

  it("leaves out open quick marks, dismissed mis-taps, lost fish and deleted records", () => {
    const catches = [
      record({ id: "landed" }),
      record({ id: "quick", ...quickMark }),
      record({ id: "mistap", ...misTap }),
      record({ id: "lost", outcome: "lost" }),
      record({ id: "deleted", deleted_at: NOW }),
    ];
    expect(fishInMonth(catches, "2026-10")).toBe(1);
  });

  it("only counts the asked month", () => {
    expect(fishInMonth([record(), record({ id: "c2", local_date: "2026-09-30" })], "2026-10")).toBe(1);
  });
});

describe("isOnTheWater", () => {
  it("keeps quick marks but drops dismissed mis-taps and deleted records", () => {
    expect(isOnTheWater(record(quickMark))).toBe(true);
    expect(isOnTheWater(record(misTap))).toBe(false);
    expect(isOnTheWater(record({ deleted_at: NOW }))).toBe(false);
  });
});
