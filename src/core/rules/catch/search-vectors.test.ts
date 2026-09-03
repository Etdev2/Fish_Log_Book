/**
 * `search.ts` against `src/core/rules/vectors/catch-search.json`. ADR 003 §4.
 *
 * The vector carries only the fields the module reads; the rest of `CatchRecord` comes
 * from the base below, so the file stays about behaviour rather than schema shape.
 */
import { describe, expect, it } from "vitest";

import vectors from "../vectors/catch-search.json";
import type { CatchGear, CatchRecord, Disposition, GearRole, ResolutionState } from "./types";
import {
  filterCatches,
  groupByLocalDate,
  sortByMostRecent,
  tokenize,
  type CatchFilters,
  type LogView,
  type SearchableCatch,
} from "./search";

const BASE: CatchRecord = {
  id: "", angler_id: "angler-1", trip_id: "", caught_at: "", caught_tz: "America/Los_Angeles",
  local_date: "", lat: null, lng: null, gps_accuracy_m: null,
  resolution_state: "unresolved", dismissed_reason: null, resolved_at: null,
  species_id: null, species_other: null, outcome: null, disposition: null, quantity: 1,
  length_mm: null, weight_g: null, size_estimated: false,
  spot_id: null, platform: null, depth_fished_m: null, rig_id: null, rig_revision: null,
  rig_slot: null, inherited_fields: [],
  location_condition_id: null, location_name: null, current_term: null, current_strength: null,
  structure_type_ids: [], bottom_depth_m: null, water_color_id: null, water_clarity_id: null,
  presentation: null, notes: null, tags: [], favorite: false,
  regulation_snapshot: null, capture_mode: "live", client_created_at: "2026-09-01T00:00:00Z",
  created_at: "2026-09-01T00:00:00Z", client_updated_at: "2026-09-01T00:00:00Z", deleted_at: null,
};

const items: SearchableCatch[] = vectors.items.map((v) => ({
  record: {
    ...BASE,
    id: v.id, caught_at: v.caught_at, local_date: v.local_date, trip_id: v.trip_id,
    species_id: v.species_id, species_other: v.species_other, spot_id: v.spot_id,
    disposition: v.disposition as Disposition | null,
    resolution_state: v.resolution_state as ResolutionState,
    favorite: v.favorite, deleted_at: v.deleted_at, notes: v.notes,
    presentation: v.presentation, platform: v.platform, tags: v.tags,
  },
  speciesName: v.speciesName,
  spotName: v.spotName,
  gear: v.gear.map((g, i): CatchGear => ({
    id: `${v.id}-g${i}`, catch_id: v.id, angler_id: "angler-1", tackle_item_id: null,
    role: g.role as GearRole, label: g.label, detail: g.detail,
    created_at: v.caught_at, deleted_at: null,
  })),
}));

const ids = (list: readonly SearchableCatch[]) => list.map((i) => i.record.id);

describe("catch search vectors (ADR 003 §4)", () => {
  it("tokenize", () => {
    for (const c of vectors.tokenize) {
      expect(tokenize(c.query), JSON.stringify(c)).toEqual(c.expected);
    }
  });

  it("filterCatches", () => {
    for (const c of vectors.filterCatches) {
      const filters: CatchFilters = {
        query: c.filters.query,
        view: c.filters.view as LogView,
        speciesId: c.filters.speciesId,
        spotId: c.filters.spotId,
        tripId: c.filters.tripId,
        disposition: c.filters.disposition as Disposition | null,
        fromDate: c.filters.fromDate,
        toDate: c.filters.toDate,
      };
      expect(ids(filterCatches(items, filters)), c.name).toEqual(c.expectedIds);
    }
  });

  it("sortByMostRecent puts newest first and breaks ties on the UUIDv7 id", () => {
    const live = items.filter((i) => i.record.deleted_at === null);
    expect(ids(sortByMostRecent(live))).toEqual(vectors.sortByMostRecent.expectedIds);
  });

  it("groupByLocalDate is newest day first, newest fish first within a day", () => {
    const live = items.filter((i) => i.record.deleted_at === null);
    expect(groupByLocalDate(live).map((g) => ({ date: g.date, ids: ids(g.items) })))
      .toEqual(vectors.groupByLocalDate);
  });
});
