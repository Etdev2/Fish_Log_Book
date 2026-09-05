import { describe, expect, it } from "vitest";

import { broughtBackRevision, canBringBack, quiverEntries, quiverKeyOf } from "./quiver";
import type { RigRecord } from "./types";

const T1 = "2026-06-01T16:00:00.000Z";
const T2 = "2026-07-01T16:00:00.000Z";
const T3 = "2026-08-01T16:00:00.000Z";

function rig(overrides: Partial<RigRecord> = {}): RigRecord {
  return {
    id: "r1",
    angler_id: "a1",
    trip_id: "t1",
    slot: 1,
    name: null,
    setup_type: "flyline",
    revision: 1,
    effective_from: T1,
    spot_id: null,
    platform: null,
    depth_fished_m: null,
    live_bait: false,
    gear: [],
    created_at: T1,
    retired_at: null,
    ...overrides,
  };
}

describe("quiverKeyOf", () => {
  it("uses the lineage id when there is one", () => {
    expect(quiverKeyOf(rig({ quiver_id: "q1" }))).toBe("q1");
  });

  it("falls back to trip and slot for a row that predates the field", () => {
    // Core must stay total for a row arriving from a sync path without the column.
    expect(quiverKeyOf(rig({ trip_id: "t9", slot: 3 }))).toBe("t9:3");
    expect(quiverKeyOf(rig({ quiver_id: "" }))).toBe("t1:1");
  });
});

describe("quiverEntries", () => {
  it("shows a rod put away and brought back three times exactly once", () => {
    // The whole point of the lineage id. Six rows, one rod.
    const rigs = [
      rig({ id: "a", quiver_id: "q1", revision: 1, trip_id: "t1", effective_from: T1 }),
      rig({ id: "b", quiver_id: "q1", revision: 2, trip_id: "t1", retired_at: T1 }),
      rig({ id: "c", quiver_id: "q1", revision: 3, trip_id: "t2", effective_from: T2 }),
      rig({ id: "d", quiver_id: "q1", revision: 4, trip_id: "t2", retired_at: T2 }),
      rig({ id: "e", quiver_id: "q1", revision: 5, trip_id: "t3", effective_from: T3 }),
      rig({ id: "f", quiver_id: "q1", revision: 6, trip_id: "t3", retired_at: T3 }),
    ];
    const entries = quiverEntries(rigs, "t4");
    expect(entries).toHaveLength(1);
    expect(entries[0].latest.id).toBe("f");
  });

  it("keeps one lineage across two trips as one entry", () => {
    const entries = quiverEntries(
      [
        rig({ id: "a", quiver_id: "q1", trip_id: "t1", revision: 1 }),
        rig({ id: "b", quiver_id: "q1", trip_id: "t2", revision: 2 }),
      ],
      "t3",
    );
    expect(entries).toHaveLength(1);
  });

  it("does not merge two unnamed rods from different trips", () => {
    // They look identical. They are not the same rod, and nothing in the data says so.
    const entries = quiverEntries(
      [
        rig({ id: "a", quiver_id: "q1", trip_id: "t1", name: null }),
        rig({ id: "b", quiver_id: "q2", trip_id: "t2", name: null }),
      ],
      "t3",
    );
    expect(entries).toHaveLength(2);
  });

  it("groups a legacy row with no lineage id by trip and slot", () => {
    const entries = quiverEntries(
      [
        rig({ id: "a", trip_id: "t1", slot: 1, revision: 1 }),
        rig({ id: "b", trip_id: "t1", slot: 1, revision: 2 }),
        rig({ id: "c", trip_id: "t1", slot: 2, revision: 1 }),
      ],
      "t2",
    );
    expect(entries).toHaveLength(2);
  });

  it("takes the newest revision even when it is the retired one", () => {
    // Filtering retired rows first and then taking the newest resurrects a rod that was
    // put away — the trap activeRodSetups documents.
    const entries = quiverEntries(
      [
        rig({ id: "a", quiver_id: "q1", revision: 1, retired_at: null }),
        rig({ id: "b", quiver_id: "q1", revision: 2, retired_at: T2 }),
      ],
      "t2",
    );
    expect(entries[0].latest.id).toBe("b");
    expect(entries[0].latest.retired_at).toBe(T2);
  });

  it("sorts most recently used first", () => {
    const entries = quiverEntries(
      [
        rig({ id: "old", quiver_id: "q1", effective_from: T1 }),
        rig({ id: "new", quiver_id: "q2", effective_from: T3 }),
        rig({ id: "mid", quiver_id: "q3", effective_from: T2 }),
      ],
      "t9",
    );
    expect(entries.map((e) => e.latest.id)).toEqual(["new", "mid", "old"]);
  });

  it("names an unnamed lineage from the setup, never 'Rod {slot}'", () => {
    const [entry] = quiverEntries(
      [
        rig({
          quiver_id: "q1",
          name: null,
          slot: 4,
          setup_type: "yo_yo",
          gear: [
            { angler_id: "a1", tackle_item_id: null, role: "reel", label: "Star drag", detail: "30" },
          ],
        }),
      ],
      "t2",
    );
    expect(entry.label).toBe("yo_yo · Star drag, 30");
    expect(entry.label).not.toContain("Rod 4");
  });

  it("prefers the angler's own name", () => {
    const [entry] = quiverEntries([rig({ quiver_id: "q1", name: "40 lb Yo-Yo Stick" })], "t2");
    expect(entry.label).toBe("40 lb Yo-Yo Stick");
  });
});

describe("canBringBack", () => {
  it("is false while the rod is already on today's boat", () => {
    const rigs = [rig({ id: "a", quiver_id: "q1", trip_id: "today", retired_at: null })];
    const [entry] = quiverEntries(rigs, "today");
    expect(entry.in_todays_setup).toBe(true);
    expect(canBringBack(entry)).toBe(false);
  });

  it("is true once it has been put away", () => {
    const rigs = [
      rig({ id: "a", quiver_id: "q1", trip_id: "today", revision: 1 }),
      rig({ id: "b", quiver_id: "q1", trip_id: "today", revision: 2, retired_at: T2 }),
    ];
    const [entry] = quiverEntries(rigs, "today");
    expect(canBringBack(entry)).toBe(true);
  });
});

describe("broughtBackRevision", () => {
  const latest = rig({
    id: "old",
    quiver_id: "q1",
    trip_id: "t1",
    slot: 2,
    revision: 4,
    retired_at: T2,
    name: "40 lb Yo-Yo Stick",
    live_bait: true,
    gear: [{ angler_id: "a1", tackle_item_id: null, role: "hook", label: "6/0 circle", detail: null }],
  });

  it("carries the whole setup forward so nothing is rebuilt", () => {
    const next = broughtBackRevision(latest, { id: "new", tripId: "t5", slot: 1, nowIso: T3 });
    expect(next.name).toBe("40 lb Yo-Yo Stick");
    expect(next.gear).toEqual(latest.gear);
    expect(next.live_bait).toBe(true);
    expect(next.quiver_id).toBe("q1");
  });

  it("lands on today's trip, in a fresh slot, not retired", () => {
    const next = broughtBackRevision(latest, { id: "new", tripId: "t5", slot: 1, nowIso: T3 });
    expect(next.id).toBe("new");
    expect(next.trip_id).toBe("t5");
    expect(next.slot).toBe(1);
    expect(next.revision).toBe(5);
    expect(next.retired_at).toBeNull();
    expect(next.effective_from).toBe(T3);
  });

  it("leaves the revision it came from untouched", () => {
    // A fish logged against revision 4 must keep saying the rod was put away then.
    broughtBackRevision(latest, { id: "new", tripId: "t5", slot: 1, nowIso: T3 });
    expect(latest.retired_at).toBe(T2);
    expect(latest.revision).toBe(4);
  });

  it("adopts the fallback key for a legacy row, so the lineage exists from now on", () => {
    const legacy = rig({ id: "old", trip_id: "t7", slot: 3, revision: 1 });
    const next = broughtBackRevision(legacy, { id: "new", tripId: "t8", slot: 1, nowIso: T3 });
    expect(next.quiver_id).toBe("t7:3");
  });
});
