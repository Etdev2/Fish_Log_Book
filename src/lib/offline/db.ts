/**
 * The local database (ADR 004 §1). IndexedDB via `idb`, one store per syncable entity
 * plus `outbox` and `meta`.
 *
 * Two rules from the ADR are enforced by the shape of this module rather than by
 * remembering:
 *
 *   1. **Reads never touch the network.** Nothing here imports Supabase. Every screen
 *      renders from this database; the network's only job is to fill it in later.
 *   2. **A row and its outbox record are written in ONE transaction.** If the tab is
 *      killed between them, either both landed or neither did. A catch that exists
 *      locally but has no mutation queued would never sync and nobody would know — that
 *      is the quiet data-loss bug this design exists to prevent.
 *
 * `lib/` holds no domain knowledge (ADR 003 §2): this file knows about stores, keys and
 * transactions, and nothing about what a catch is.
 */

import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction, type StoreNames } from "idb";

import type { Mutation, SyncEntity } from "@/core/sync/outbox";

/** Bump only with a migration in `upgrade` below. */
const DB_VERSION = 4;
const DB_NAME = "fish-log-book";

export const ENTITY_STORES = [
  "trip",
  "trip_rig",
  "catch",
  "catch_gear",
  "condition_snapshot",
  "location_condition",
] as const;

export type EntityStore = (typeof ENTITY_STORES)[number];

/**
 * Stores that live only on this device and are NEVER queued for sync (ADR 009 §2).
 *
 * Boat Games in Phase 1 is one host phone with no server behind it. Adding these to
 * `ENTITY_STORES` would queue a mutation per row for Supabase tables that do not exist:
 * every one comes back 4xx, lands in `rejected`, and puts a permanent "needs attention"
 * badge on the angler's phone for a feature that is working perfectly. Phase 2 moves
 * them across at the same moment it adds the tables — not before.
 */
export const LOCAL_STORES = [
  "game_session",
  "game_participant",
  "game_event",
  "crew_member",
] as const;

export type LocalStore = (typeof LOCAL_STORES)[number];

/** Every syncable row carries at least these. Domain types live in `core/`. */
export interface StoredRow {
  readonly id: string;
  readonly [key: string]: unknown;
}

interface FishLogDB extends DBSchema {
  trip: { key: string; value: StoredRow };
  trip_rig: { key: string; value: StoredRow; indexes: { by_trip: string } };
  catch: { key: string; value: StoredRow; indexes: { by_trip: string; by_local_date: string } };
  catch_gear: { key: string; value: StoredRow; indexes: { by_catch: string } };
  condition_snapshot: { key: string; value: StoredRow; indexes: { by_catch: string } };
  location_condition: { key: string; value: StoredRow; indexes: { by_trip: string } };
  outbox: { key: string; value: Mutation; indexes: { by_state: string } };
  meta: { key: string; value: unknown };
  /** Photo blobs, kept out of the row so a list query never drags megabytes with it. */
  media: { key: string; value: { id: string; catch_id: string; blob: Blob; created_at: string } };

  /* Boat Games, device-local (ADR 009). Not syncable in Phase 1 — see LOCAL_STORES. */
  game_session: { key: string; value: StoredRow };
  game_participant: { key: string; value: StoredRow; indexes: { by_session: string } };
  game_event: { key: string; value: StoredRow; indexes: { by_session: string } };
  crew_member: { key: string; value: StoredRow };
}

let dbPromise: Promise<IDBPDatabase<FishLogDB>> | null = null;

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export function getDb(): Promise<IDBPDatabase<FishLogDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FishLogDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, tx) {
        /*
          Cumulative steps, each guarded by `oldVersion < n`, and NONE of them returns.

          This used to be `if (oldVersion >= 1) { …; return; }`, which was correct for v2
          and a trap for everything after it: any v3 step written below that `return`
          would never run on a device that already had the database — only on a fresh
          install. It would not error. The angler would just have a quietly wrong store.
          Flagged by the architect in ADR 008 and confirmed here before the v3 step landed.

          Additive rather than a rebuild, because a wipe-and-recreate would silently
          destroy a local-first log that has never synced anywhere.
        */
        if (oldVersion < 1) {
          createInitialStores(db);
        }

        if (oldVersion < 2 && !db.objectStoreNames.contains("location_condition")) {
          const locations = db.createObjectStore("location_condition", { keyPath: "id" });
          locations.createIndex("by_trip", "trip_id");
        }

        if (oldVersion > 0 && oldVersion < 3) {
          void backfillQuiverIds(tx);
        }

        // v4: Boat Games (ADR 009). Purely additive — four new stores, nothing existing
        // is touched, so an angler mid-trip gains the feature without risking the log.
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains("game_session")) {
            db.createObjectStore("game_session", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("game_participant")) {
            db.createObjectStore("game_participant", { keyPath: "id" })
              .createIndex("by_session", "session_id");
          }
          if (!db.objectStoreNames.contains("game_event")) {
            db.createObjectStore("game_event", { keyPath: "id" })
              .createIndex("by_session", "session_id");
          }
          if (!db.objectStoreNames.contains("crew_member")) {
            db.createObjectStore("crew_member", { keyPath: "id" });
          }
        }
      },
    });
  }
  return dbPromise;
}

/**
 * v3: every rod setup gets a `quiver_id` naming the lineage it belongs to (ADR 008).
 *
 * Existing rows have no linking data, so the best available grouping is `(trip_id, slot)`
 * — the rod as it existed within one trip. Consequence, stated plainly because it is
 * visible to the angler: a rod that was "the same rod" across two different trips becomes
 * two Quiver entries. The information to do better was never recorded.
 *
 * Runs inside the version-change transaction, so it either completes or the upgrade
 * fails and nothing is half-migrated.
 */
function backfillQuiverIds(tx: IDBPTransaction<FishLogDB, ArrayLike<StoreNames<FishLogDB>>, "versionchange">): void {
  const store = tx.objectStore("trip_rig");
  void store.getAll().then(async (rows: StoredRow[]) => {
    const byLineage = new Map<string, string>();
    for (const row of rows) {
      if (typeof row.quiver_id === "string" && row.quiver_id.length > 0) continue;
      const key = `${String(row.trip_id)}:${String(row.slot)}`;
      let quiverId = byLineage.get(key);
      if (!quiverId) {
        quiverId = crypto.randomUUID();
        byLineage.set(key, quiverId);
      }
      await store.put({ ...row, quiver_id: quiverId });
    }
  });
}

function createInitialStores(db: IDBPDatabase<FishLogDB>): void {
  {
        db.createObjectStore("trip", { keyPath: "id" });

        const rig = db.createObjectStore("trip_rig", { keyPath: "id" });
        rig.createIndex("by_trip", "trip_id");

        const catches = db.createObjectStore("catch", { keyPath: "id" });
        catches.createIndex("by_trip", "trip_id");
        // The log lists by day and the calendar counts by day; both want this index
        // rather than a full scan once a power user has 10,000 catches (spec §41).
        catches.createIndex("by_local_date", "local_date");

        const gear = db.createObjectStore("catch_gear", { keyPath: "id" });
        gear.createIndex("by_catch", "catch_id");

        const snapshots = db.createObjectStore("condition_snapshot", { keyPath: "id" });
        snapshots.createIndex("by_catch", "catch_id");

        const outbox = db.createObjectStore("outbox", { keyPath: "id" });
        outbox.createIndex("by_state", "state");

        const locations = db.createObjectStore("location_condition", { keyPath: "id" });
        locations.createIndex("by_trip", "trip_id");

        db.createObjectStore("meta");
        db.createObjectStore("media", { keyPath: "id" });
  }
}

/**
 * Write rows and their mutations atomically.
 *
 * One transaction spanning every touched store plus `outbox`. This is the function that
 * makes "saved" mean saved: when it resolves, the data is durable on the device and a
 * mutation is queued for it, or nothing happened at all.
 */
export async function commit(
  writes: readonly { store: EntityStore; row: StoredRow }[],
  mutations: readonly Mutation[],
): Promise<void> {
  const db = await getDb();
  const stores = [...new Set(writes.map((w) => w.store))];
  const tx = db.transaction([...stores, "outbox"], "readwrite");
  await Promise.all([
    ...writes.map((w) => tx.objectStore(w.store).put(w.row)),
    ...mutations.map((m) => tx.objectStore("outbox").put(m)),
  ]);
  await tx.done;
}

export async function allRows(store: EntityStore): Promise<readonly StoredRow[]> {
  const db = await getDb();
  return db.getAll(store);
}

/**
 * Write device-local rows in ONE transaction. No outbox, by design (ADR 009 §2).
 *
 * The same durability contract as `commit` minus the sync intent: when this resolves the
 * rows are on the device, and a game half-written across two transactions — a scoring
 * event saved but its session left at the old round — is not a state this can produce.
 */
export async function commitLocal(
  writes: readonly { store: LocalStore; row: StoredRow }[],
): Promise<void> {
  if (writes.length === 0) return;
  const db = await getDb();
  const stores = [...new Set(writes.map((w) => w.store))];
  const tx = db.transaction(stores, "readwrite");
  await Promise.all(writes.map((w) => tx.objectStore(w.store).put(w.row)));
  await tx.done;
}

export async function allLocalRows(store: LocalStore): Promise<readonly StoredRow[]> {
  const db = await getDb();
  return db.getAll(store);
}

/** Remove one device-local row. Used for crew members and for discarding a draft game. */
export async function deleteLocalRow(store: LocalStore, id: string): Promise<void> {
  const db = await getDb();
  await db.delete(store, id);
}

export async function rowsByIndex(
  store: EntityStore,
  index: string,
  key: string,
): Promise<readonly StoredRow[]> {
  const db = await getDb();
  return db.getAllFromIndex(store, index as never, key as never);
}

export async function allMutations(): Promise<readonly Mutation[]> {
  const db = await getDb();
  return db.getAll("outbox");
}

export async function putMutation(mutation: Mutation): Promise<void> {
  const db = await getDb();
  await db.put("outbox", mutation);
}

export async function putMedia(
  id: string,
  catchId: string,
  blob: Blob,
  createdAt: string,
): Promise<void> {
  const db = await getDb();
  await db.put("media", { id, catch_id: catchId, blob, created_at: createdAt });
}

export async function mediaFor(catchId: string): Promise<readonly { id: string; blob: Blob }[]> {
  const db = await getDb();
  const all = await db.getAll("media");
  return all.filter((m) => m.catch_id === catchId);
}

export async function deleteMedia(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("media", id);
}

export async function readMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return (await db.get("meta", key)) as T | undefined;
}

export async function writeMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put("meta", value, key);
}

/** Test/reset seam. Closes the handle so the next `getDb()` reopens cleanly. */
export async function __closeDbForTests(): Promise<void> {
  if (!dbPromise) return;
  (await dbPromise).close();
  dbPromise = null;
}

export type { Mutation, SyncEntity };
