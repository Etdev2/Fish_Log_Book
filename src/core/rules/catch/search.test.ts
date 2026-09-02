import { describe, expect, it } from "vitest";

import {
  filterCatches,
  groupByLocalDate,
  matchesQuery,
  NO_FILTERS,
  sortByMostRecent,
  tokenize,
  type SearchableCatch,
} from "./search";
import type { CatchGear, CatchRecord } from "./types";

const NOW = "2026-08-20T21:12:00.000Z";

function record(overrides: Partial<CatchRecord> = {}): CatchRecord {
  return {
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

function item(overrides: Partial<CatchRecord> = {}, extra: Partial<SearchableCatch> = {}): SearchableCatch {
  return {
    record: record(overrides),
    speciesName: "Bluefin tuna",
    spotName: "Catalina",
    gear: [],
    ...extra,
  };
}

const gear = (label: string, detail: string | null = null): CatchGear => ({
  id: "g1",
  catch_id: "c1",
  angler_id: "a1",
  tackle_item_id: null,
  role: "jig",
  label,
  detail,
  created_at: NOW,
  deleted_at: null,
});

describe("tokenize", () => {
  it("splits on runs of whitespace and drops empties", () => {
    expect(tokenize("  bluefin   streaker ")).toEqual(["bluefin", "streaker"]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("matchesQuery", () => {
  it("matches on species", () => {
    expect(matchesQuery(item(), "bluefin")).toBe(true);
  });

  it("is case insensitive", () => {
    expect(matchesQuery(item(), "BLUEFIN")).toBe(true);
  });

  it("matches on gear label", () => {
    expect(matchesQuery(item({}, { gear: [gear("Nomad Streaker 200g")] }), "streaker")).toBe(true);
  });

  it("matches on spot", () => {
    expect(matchesQuery(item(), "catalina")).toBe(true);
  });

  it("matches on notes and tags", () => {
    expect(matchesQuery(item({ notes: "meter marks at 250" }), "meter")).toBe(true);
    expect(matchesQuery(item({ tags: ["night bite"] }), "night")).toBe(true);
  });

  it("matches the angler's own species text", () => {
    expect(
      matchesQuery(item({ species_other: "something silver" }, { speciesName: null }), "silver"),
    ).toBe(true);
  });

  it("requires every token, but not all in one field", () => {
    const subject = item({}, { gear: [gear("Nomad Streaker 200g")] });
    expect(matchesQuery(subject, "bluefin streaker")).toBe(true);
    expect(matchesQuery(subject, "bluefin flatfall")).toBe(false);
  });

  it("an empty query matches everything", () => {
    expect(matchesQuery(item(), "")).toBe(true);
  });
});

describe("filterCatches", () => {
  it("hides soft-deleted rows", () => {
    expect(filterCatches([item({ deleted_at: NOW })], NO_FILTERS)).toHaveLength(0);
  });

  it("favorites view keeps only favorites", () => {
    const items = [item({ id: "a", favorite: true }), item({ id: "b" })];
    const result = filterCatches(items, { ...NO_FILTERS, view: "favorites" });
    expect(result.map((i) => i.record.id)).toEqual(["a"]);
  });

  it("needs-details view is the unresolved queue (D22)", () => {
    const items = [
      item({ id: "a", resolution_state: "unresolved", outcome: null, resolved_at: null }),
      item({ id: "b" }),
    ];
    const result = filterCatches(items, { ...NO_FILTERS, view: "needs_details" });
    expect(result.map((i) => i.record.id)).toEqual(["a"]);
  });

  it("filters by species, trip and disposition", () => {
    const items = [
      item({ id: "a", species_id: "yellowtail", disposition: "released", trip_id: "t2" }),
      item({ id: "b" }),
    ];
    expect(filterCatches(items, { ...NO_FILTERS, speciesId: "yellowtail" })).toHaveLength(1);
    expect(filterCatches(items, { ...NO_FILTERS, disposition: "released" })).toHaveLength(1);
    expect(filterCatches(items, { ...NO_FILTERS, tripId: "t2" })).toHaveLength(1);
  });

  it("filters by an inclusive date range", () => {
    const items = [
      item({ id: "a", local_date: "2026-08-19" }),
      item({ id: "b", local_date: "2026-08-20" }),
      item({ id: "c", local_date: "2026-08-21" }),
    ];
    const result = filterCatches(items, {
      ...NO_FILTERS,
      fromDate: "2026-08-20",
      toDate: "2026-08-21",
    });
    expect(result.map((i) => i.record.id)).toEqual(["b", "c"]);
  });

  it("combines a view with a query", () => {
    const items = [
      item({ id: "a", favorite: true, species_id: "yellowtail" }, { speciesName: "Yellowtail" }),
      item({ id: "b", favorite: true }),
    ];
    const result = filterCatches(items, { ...NO_FILTERS, view: "favorites", query: "yellow" });
    expect(result.map((i) => i.record.id)).toEqual(["a"]);
  });
});

describe("ordering", () => {
  it("sorts newest first", () => {
    const items = [
      item({ id: "old", caught_at: "2026-08-20T10:00:00.000Z" }),
      item({ id: "new", caught_at: "2026-08-20T20:00:00.000Z" }),
    ];
    expect(sortByMostRecent(items).map((i) => i.record.id)).toEqual(["new", "old"]);
  });

  it("breaks ties on the id, which is mint-ordered", () => {
    const items = [
      item({ id: "0198d9c1-9800-7000-8000-00000000000a" }),
      item({ id: "0198d9c1-9800-7000-8000-00000000000b" }),
    ];
    expect(sortByMostRecent(items)[0].record.id.endsWith("b")).toBe(true);
  });

  it("groups by local date, newest day first", () => {
    const items = [
      item({ id: "a", local_date: "2026-08-19" }),
      item({ id: "b", local_date: "2026-08-20" }),
      item({ id: "c", local_date: "2026-08-20" }),
    ];
    const days = groupByLocalDate(items);
    expect(days.map((d) => d.date)).toEqual(["2026-08-20", "2026-08-19"]);
    expect(days[0].items).toHaveLength(2);
  });
});
