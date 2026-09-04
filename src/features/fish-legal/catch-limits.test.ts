import { describe, expect, it } from "vitest";

import type { CatchRecord } from "@/core/rules/catch/types";
import { limitCheckForLog, limitLines, talliedKeptToday, undecidedToday } from "./catch-limits";
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

describe("one line per species, and the right one for today", () => {
  /**
   * Founder-visible bug, 2026-09-04: the limits page showed white seabass twice — "3/day"
   * and "1/day" — because SoCal carries a year-round rule and a spring window as two
   * separate bag_limit rules. Two lines, one id, contradictory advice.
   */
  it("never emits two lines with the same id", () => {
    const ids = limitLines(SOCAL, "2026-09-04", new Map()).map((l) => l.id);
    expect(ids.filter((v, i) => ids.indexOf(v) !== i)).toEqual([]);
  });

  it("shows white seabass at three a day outside the spring window", () => {
    const line = limitLines(SOCAL, "2026-09-04", new Map()).find(
      (l) => l.id === "white_seabass",
    );
    expect(line?.limit).toBe(3);
  });

  it("shows one a day inside it — 15 March to 15 June south of Point Conception", () => {
    for (const day of ["2026-03-15", "2026-05-01", "2026-06-15"]) {
      const line = limitLines(SOCAL, day, new Map()).find((l) => l.id === "white_seabass");
      expect(line?.limit).toBe(1);
    }
  });

  it("is back to three the day after the window closes", () => {
    const line = limitLines(SOCAL, "2026-06-16", new Map()).find(
      (l) => l.id === "white_seabass",
    );
    expect(line?.limit).toBe(3);
  });

  it("applies the window in a later year too — seasons recur, the pack's dates do not", () => {
    const line = limitLines(SOCAL, "2027-05-01", new Map()).find(
      (l) => l.id === "white_seabass",
    );
    expect(line?.limit).toBe(1);
  });

  it("still counts what was kept against whichever line survives", () => {
    const line = limitLines(SOCAL, "2026-05-01", new Map([["white_seabass", 1]])).find(
      (l) => l.id === "white_seabass",
    );
    expect(line?.retained).toBe(1);
    expect(line?.state).toBe("reached");
  });
});

describe("fish logged without a kept-or-released answer", () => {
  /**
   * Founder report, 2026-09-04: "when I add a white seabass it does not subtract from
   * today's limits". It counted correctly when marked Kept — but the fast log flow never
   * asks, so a quickly-logged fish sat outside the tally with nothing said about it.
   * Silence is the wrong direction here: it under-reports the box.
   */
  const at = (iso: string, disposition: "kept" | "released" | null): CatchRecord =>
    ({
      id: `c-${iso}-${disposition}`,
      angler_id: "a",
      trip_id: "t",
      caught_at: iso,
      caught_tz: "America/Los_Angeles",
      local_date: iso.slice(0, 10),
      species_id: "white_seabass",
      disposition,
      quantity: 1,
      deleted_at: null,
      resolution_state: "confirmed",
      outcome: "landed",
    }) as unknown as CatchRecord;

  const DAY = "2026-09-04";
  const NOON = "2026-09-04T19:00:00.000Z"; // midday in Los Angeles
  const ZONE = "America/Los_Angeles";

  it("lists a fish with no disposition", () => {
    expect(undecidedToday([at(NOON, null)], DAY, ZONE)).toHaveLength(1);
  });

  it("does not list one that was answered either way", () => {
    expect(undecidedToday([at(NOON, "kept")], DAY, ZONE)).toEqual([]);
    expect(undecidedToday([at(NOON, "released")], DAY, ZONE)).toEqual([]);
  });

  it("does not count an unanswered fish against the bag", () => {
    const tally = talliedKeptToday([at(NOON, null)], DAY, ZONE);
    expect(tally.get("white_seabass")).toBeUndefined();
  });

  it("counts it the moment it is answered kept", () => {
    const tally = talliedKeptToday([at(NOON, "kept")], DAY, ZONE);
    expect(tally.get("white_seabass")).toBe(1);
  });

  it("is scoped to the angler's day, not UTC", () => {
    // 06:00 UTC on the 5th is still the evening of the 4th in Los Angeles.
    const lateEvening = "2026-09-05T04:00:00.000Z";
    expect(undecidedToday([at(lateEvening, null)], DAY, ZONE)).toHaveLength(1);
  });

  it("ignores deleted and dismissed rows", () => {
    const deleted = { ...at(NOON, null), deleted_at: NOON } as CatchRecord;
    const dismissed = { ...at(NOON, null), resolution_state: "dismissed" } as CatchRecord;
    expect(undecidedToday([deleted, dismissed], DAY, ZONE)).toEqual([]);
  });
});
