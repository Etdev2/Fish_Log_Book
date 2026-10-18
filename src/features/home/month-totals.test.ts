import { describe, expect, it } from "vitest";

import type { CatchRecord } from "@/core/rules/catch/types";

import { fishInMonth, fishedDays, isOnTheWater, weekOf } from "./month-totals";

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
    expect(fishInMonth([record({ quantity: 3 }), record({ id: "c2" })], "2026-10", "UTC")).toBe(4);
  });

  it("leaves out open quick marks, dismissed mis-taps, lost fish and deleted records", () => {
    const catches = [
      record({ id: "landed" }),
      record({ id: "quick", ...quickMark }),
      record({ id: "mistap", ...misTap }),
      record({ id: "lost", outcome: "lost" }),
      record({ id: "deleted", deleted_at: NOW }),
    ];
    expect(fishInMonth(catches, "2026-10", "UTC")).toBe(1);
  });

  it("only counts the asked month", () => {
    expect(fishInMonth([record(), record({ id: "c2", caught_at: "2026-09-30T12:00:00.000Z", local_date: "2026-09-30" })], "2026-10", "UTC")).toBe(1);
  });
});

describe("isOnTheWater", () => {
  it("keeps quick marks but drops dismissed mis-taps and deleted records", () => {
    expect(isOnTheWater(record(quickMark))).toBe(true);
    expect(isOnTheWater(record(misTap))).toBe(false);
    expect(isOnTheWater(record({ deleted_at: NOW }))).toBe(false);
  });
});

describe("fished days and month totals use the viewer's zone", () => {
  // Caught 23:30 on Oct 31 in Los Angeles: stored local_date is Oct 31, but in UTC it is Nov 1.
  const travelled = record({ caught_at: "2026-11-01T06:30:00.000Z", local_date: "2026-10-31" });

  it("buckets a catch by its instant, like the calendar", () => {
    expect([...fishedDays([travelled], [], "UTC")]).toEqual(["2026-11-01"]);
    expect([...fishedDays([travelled], [], "America/Los_Angeles")]).toEqual(["2026-10-31"]);
  });

  it("counts the fish in the month the viewer sees", () => {
    expect(fishInMonth([travelled], "2026-11", "UTC")).toBe(1);
    expect(fishInMonth([travelled], "2026-10", "UTC")).toBe(0);
  });

  it("leaves out dismissed mis-taps and deleted trips", () => {
    const trip = { deleted_at: NOW, started_at: NOW } as unknown as Parameters<typeof fishedDays>[1][number];
    expect(fishedDays([record(misTap)], [trip], "UTC").size).toBe(0);
  });
});

describe("weekOf", () => {
  it("runs Monday to Sunday around today", () => {
    expect(weekOf("2026-10-17").map((d) => d.key)).toEqual([
      "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18",
    ]);
  });

  it("keeps seven distinct days across a daylight-saving change", () => {
    // US clocks spring forward on Sunday, March 8, 2026.
    const keys = weekOf("2026-03-07").map((d) => d.key);
    expect(keys).toEqual([
      "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06", "2026-03-07", "2026-03-08",
    ]);
  });

  it("names each day for a screen reader", () => {
    expect(weekOf("2026-10-17")[5]).toEqual({
      key: "2026-10-17",
      letter: "S",
      dayOfMonth: "17",
      spoken: "Saturday, October 17",
    });
  });
});
