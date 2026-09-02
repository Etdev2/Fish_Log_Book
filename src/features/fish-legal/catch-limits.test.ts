import { describe, expect, it } from "vitest";

import type { CatchRecord } from "@/core/rules/catch/types";
import { limitCheckForLog, limitLines, talliedKeptToday } from "./catch-limits";
import { SOCAL } from "./reg-data";

const ZONE = "America/Los_Angeles";

function catchAt(
  id: string,
  species: string | null,
  kept: boolean,
  when: string,
  quantity = 1,
): CatchRecord {
  return {
    id,
    angler_id: "a",
    trip_id: "trip-1",
    caught_at: when,
    caught_tz: "America/Los_Angeles",
    local_date: when.slice(0, 10),
    lat: null,
    lng: null,
    gps_accuracy_m: null,
    resolution_state: "confirmed",
    dismissed_reason: null,
    resolved_at: null,
    species_id: species,
    species_other: null,
    outcome: "landed" as const,
    disposition: kept ? "kept" : "released",
    quantity,
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
    capture_mode: "live" as const,
    client_created_at: when,
    created_at: when,
    client_updated_at: when,
    deleted_at: null,
  } as CatchRecord;
}

describe("talliedKeptToday (spec §12)", () => {
  it("counts only kept fish on the local day; release, other-day, and deleted rows never enter", () => {
    const rows = [
      catchAt("1", "yellowtail", true, "2026-09-01T10:00:00Z"),
      catchAt("2", "yellowtail", true, "2026-09-01T16:00:00Z"),
      catchAt("3", "yellowtail", false, "2026-09-01T12:00:00Z"),
      catchAt("4", "vermilion_rockfish", true, "2026-09-01T11:00:00Z"),
      catchAt("5", "blue_rockfish", true, "2026-09-01T11:05:00Z"),
      catchAt("6", "yellowtail", true, "2026-08-31T23:30:00Z"), // Aug 31 local
      { ...catchAt("7", "yellowtail", true, "2026-09-01T13:00:00Z"), deleted_at: "2026-09-01T13:30:00Z" },
      catchAt("8", null, true, "2026-09-01T14:00:00Z"),
    ];
    const tallies = talliedKeptToday(rows, "2026-09-01", ZONE);
    expect(tallies.get("yellowtail")).toBe(2);
    expect(tallies.get("vermilion_rockfish")).toBe(1);
    expect(tallies.size).toBe(3);
  });

  it("respects quantity on a single row", () => {
    const tallies = talliedKeptToday(
      [catchAt("1", "blue_rockfish", true, "2026-09-01T09:00:00Z", 3)],
      "2026-09-01",
      ZONE,
    );
    expect(tallies.get("blue_rockfish")).toBe(3);
  });
});

describe("limitLines (spec §12, §6 aggregate)", () => {
  const bundle = { pack: SOCAL.pack, areas: SOCAL.areas, groups: SOCAL.groups, rules: SOCAL.rules };

  it("surfaces the RCG group combination against its shared 10", () => {
    const kept = new Map<string, number>([["blue_rockfish", 4], ["gopher_rockfish", 4]]);
    const lines = limitLines(bundle, "2026-09-01", kept);
    const rcg = lines.find((l) => l.id === "rcg-complex");
    expect(rcg).toMatchObject({ limit: 10, retained: 8, state: "room" });
  });

  it("trips a species cap inside a group even when the combination is fine", () => {
    const kept = new Map<string, number>([["copper_rockfish", 1]]);
    const lines = limitLines(bundle, "2026-09-01", kept);
    const copper = lines.find((l) => l.id === "copper_rockfish");
    expect(copper).toMatchObject({ limit: 1, retained: 1, state: "reached" });
    const rcg = lines.find((l) => l.id === "rcg-complex");
    expect(rcg?.state).toBe("room");
  });

  it("marks 'over' when retained exceeds the limit (noticed late, still logged)", () => {
    const kept = new Map<string, number>([["yellowtail", 11]]);
    const lines = limitLines(bundle, "2026-09-01", kept);
    expect(lines.find((l) => l.id === "yellowtail")).toMatchObject({ limit: 10, retained: 11, state: "over" });
  });
});

describe("limitCheckForLog", () => {
  const bundle = { pack: SOCAL.pack, areas: SOCAL.areas, groups: SOCAL.groups, rules: SOCAL.rules };

  it("returns both the species line and the aggregate line for an RCG member", () => {
    const kept = new Map<string, number>([["vermilion_rockfish", 1], ["blue_rockfish", 6]]);
    const lines = limitCheckForLog(bundle, "vermilion_rockfish", kept);
    expect(lines.map((l) => l.id).sort()).toEqual(["rcg-complex", "vermilion_rockfish"]);
  });

  it("returns nothing for a species the pack doesn't limit", () => {
    expect(limitCheckForLog(bundle, "not_a_species", new Map())).toEqual([]);
  });
});
