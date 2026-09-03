import { describe, expect, it } from "vitest";

import { applyUpgrade, type UpgradeDb } from "./db";

/**
 * The schema ladder must land the same set of stores whatever version the device is
 * coming from. IndexedDB fires `upgrade` ONCE with the device's actual old version, so
 * a v1 device has to fall through every later block; an early return after handling the
 * newest version silently skips the stores of every version added afterwards.
 */
const EXPECTED_STORES = [
  "trip",
  "trip_rig",
  "catch",
  "catch_gear",
  "condition_snapshot",
  "outbox",
  "meta",
  "media",
  "location_condition",
] as const;

function stubDb() {
  const stores = new Set<string>();
  const indexes = new Map<string, string[]>();
  const db = {
    objectStoreNames: { contains: (n: string) => stores.has(n) },
    createObjectStore(name: string) {
      if (stores.has(name)) throw new Error(`duplicate createObjectStore: ${name}`);
      stores.add(name);
      return {
        createIndex(index: string) {
          indexes.set(name, [...(indexes.get(name) ?? []), index]);
        },
      };
    },
  } as unknown as UpgradeDb;
  return { db, stores, indexes };
}

describe("offline db schema ladder", () => {
  it("a fresh install (v0) creates every store", () => {
    const { db, stores } = stubDb();
    applyUpgrade(db, 0);
    expect([...stores].sort()).toEqual([...EXPECTED_STORES].sort());
  });

  it("a v1 device gains exactly the stores added after v1", () => {
    const { db, stores } = stubDb();
    applyUpgrade(db, 1);
    expect([...stores]).toEqual(["location_condition"]);
  });

  it("a v1 device ends up with the same schema as a fresh install", () => {
    // The stores v1 actually shipped — a historical fact, so it is safe to pin here.
    // This is the test that catches an early `return` in the ladder: seed a device as
    // it existed on v1, run the upgrade it would really get, and require it to arrive
    // at the same schema as a device installing today.
    const V1_STORES = [
      "trip",
      "trip_rig",
      "catch",
      "catch_gear",
      "condition_snapshot",
      "outbox",
      "meta",
      "media",
    ];

    const fresh = stubDb();
    applyUpgrade(fresh.db, 0);

    const device = stubDb();
    for (const name of V1_STORES) device.db.createObjectStore(name as never);
    applyUpgrade(device.db, 1);

    expect([...device.stores].sort()).toEqual([...fresh.stores].sort());
  });

  it("is idempotent — re-running the newest version creates nothing", () => {
    const { db, stores } = stubDb();
    applyUpgrade(db, 0);
    const after = [...stores].sort();
    expect(() => applyUpgrade(db, 2)).not.toThrow();
    expect([...stores].sort()).toEqual(after);
  });

  it("indexes the queries the app actually makes", () => {
    const { db, indexes } = stubDb();
    applyUpgrade(db, 0);
    expect(indexes.get("catch")).toEqual(["by_trip", "by_local_date"]);
    expect(indexes.get("outbox")).toEqual(["by_state"]);
    expect(indexes.get("location_condition")).toEqual(["by_trip"]);
  });
});
