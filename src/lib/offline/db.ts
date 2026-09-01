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

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { Mutation, SyncEntity } from "@/core/sync/outbox";

/** Bump only with a migration in `upgrade` below. */
const DB_VERSION = 1;
const DB_NAME = "fish-log-book";

export const ENTITY_STORES = [
  "trip",
  "trip_rig",
  "catch",
  "catch_gear",
  "condition_snapshot",
] as const;

export type EntityStore = (typeof ENTITY_STORES)[number];

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
  outbox: { key: string; value: Mutation; indexes: { by_state: string } };
  meta: { key: string; value: unknown };
  /** Photo blobs, kept out of the row so a list query never drags megabytes with it. */
  media: { key: string; value: { id: string; catch_id: string; blob: Blob; created_at: string } };
}

let dbPromise: Promise<IDBPDatabase<FishLogDB>> | null = null;

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export function getDb(): Promise<IDBPDatabase<FishLogDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FishLogDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
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

        db.createObjectStore("meta");
        db.createObjectStore("media", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
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
