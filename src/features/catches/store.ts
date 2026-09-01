"use client";

import { useSyncExternalStore } from "react";

import { speciesLabel } from "@/core/ontology/species";
import { localDateOf } from "@/core/rules/catch/rules";
import type {
  CatchGear,
  CatchRecord,
  RigRecord,
  TripRecord,
} from "@/core/rules/catch/types";
import type { SearchableCatch } from "@/core/rules/catch/search";
import { backupState, type BackupState, type Mutation, type SyncEntity } from "@/core/sync/outbox";
import { uuidv7 } from "@/core/sync/uuid";
import {
  allMutations,
  allRows,
  commit,
  isIndexedDbAvailable,
  type EntityStore,
  type StoredRow,
} from "@/lib/offline/db";

/**
 * The Fish Log's read model and its write path.
 *
 * Reads come from one in-memory snapshot, hydrated once from IndexedDB and kept in step
 * by every write. `useSyncExternalStore` gives React a consistent view without a
 * provider, and the server snapshot is deliberately empty: the local database does not
 * exist during SSR, so the first paint is the same on both sides and hydration cannot
 * mismatch.
 *
 * Writes go row-and-mutation-together through `commit` (ADR 004 §1). Nothing here awaits
 * the network, and no mutation here can fail in a way that loses a catch: the durable
 * write happens first and the caller is told it succeeded the moment it lands.
 */

export interface LogSnapshot {
  readonly hydrated: boolean;
  readonly available: boolean;
  readonly catches: readonly CatchRecord[];
  readonly gear: readonly CatchGear[];
  readonly trips: readonly TripRecord[];
  readonly rigs: readonly RigRecord[];
  readonly backup: BackupState;
}

const EMPTY: LogSnapshot = {
  hydrated: false,
  available: true,
  catches: [],
  gear: [],
  trips: [],
  rigs: [],
  backup: { kind: "backed_up" },
};

let snapshot: LogSnapshot = EMPTY;
const listeners = new Set<() => void>();

function publish(next: LogSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  void hydrate();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => EMPTY;

let hydrating: Promise<void> | null = null;

/** Load the whole local log once. Idempotent and safe to call from every subscriber. */
export function hydrate(): Promise<void> {
  if (hydrating) return hydrating;
  hydrating = (async () => {
    if (!isIndexedDbAvailable()) {
      publish({ ...EMPTY, hydrated: true, available: false });
      return;
    }
    try {
      const [catches, gear, trips, rigs, mutations] = await Promise.all([
        allRows("catch"),
        allRows("catch_gear"),
        allRows("trip"),
        allRows("trip_rig"),
        allMutations(),
      ]);
      publish({
        hydrated: true,
        available: true,
        catches: catches as unknown as CatchRecord[],
        gear: gear as unknown as CatchGear[],
        trips: trips as unknown as TripRecord[],
        rigs: rigs as unknown as RigRecord[],
        backup: backupState(mutations),
      });
    } catch {
      // A browser with IndexedDB blocked (private mode on some engines, storage denied)
      // must still render the app and say plainly that nothing can be saved, rather than
      // throwing a hydration error at somebody standing on a boat.
      publish({ ...EMPTY, hydrated: true, available: false });
    }
  })();
  return hydrating;
}

/** The current snapshot, for non-React callers. Never stale: every write republishes. */
export function currentLog(): LogSnapshot {
  return snapshot;
}

export function useLog(): LogSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// --- Write path --------------------------------------------------------------------

const DEVICE_KEY = "fish-log-device-id";

function deviceId(): string {
  if (typeof localStorage === "undefined") return "unknown-device";
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const minted = uuidv7();
    localStorage.setItem(DEVICE_KEY, minted);
    return minted;
  } catch {
    return "unknown-device";
  }
}

function mutation(
  entity: SyncEntity,
  entityId: string,
  op: Mutation["op"],
  payload: Record<string, unknown>,
  nowIso: string,
): Mutation {
  return {
    id: uuidv7(),
    entity,
    entityId,
    op,
    payload,
    clientUpdatedAt: nowIso,
    deviceId: deviceId(),
    attempts: 0,
    lastError: null,
    state: "queued",
  };
}

/**
 * Persist a set of rows and queue them for sync, then republish.
 *
 * `writes` and `mutations` go into one transaction, so the local row and its sync
 * intent are never out of step.
 */
async function persist(
  writes: readonly { store: EntityStore; row: StoredRow }[],
  mutations: readonly Mutation[],
): Promise<void> {
  await commit(writes, mutations);
  await refresh();
}

async function refresh(): Promise<void> {
  const [catches, gear, trips, rigs, queued] = await Promise.all([
    allRows("catch"),
    allRows("catch_gear"),
    allRows("trip"),
    allRows("trip_rig"),
    allMutations(),
  ]);
  publish({
    hydrated: true,
    available: true,
    catches: catches as unknown as CatchRecord[],
    gear: gear as unknown as CatchGear[],
    trips: trips as unknown as TripRecord[],
    rigs: rigs as unknown as RigRecord[],
    backup: backupState(queued),
  });
}

/** The prototype has no auth session yet; every row is written for this one angler. */
export const LOCAL_ANGLER_ID = "00000000-0000-7000-8000-000000000001";

export function currentZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
}

/**
 * The open trip, or a new one.
 *
 * Spec §11 is emphatic that an angler must never be made to create a trip before logging
 * a catch, and the schema is equally emphatic that `catch.trip_id` is NOT NULL — a catch
 * outside a trip would have no denominator and break every rate (spec §12). Both hold at
 * once by making the trip implicit: the first catch of a session opens one silently, and
 * subsequent catches join it. The angler is never asked.
 *
 * "Open" means started, not ended. A trip is closed explicitly, or simply left open —
 * an abandoned trip is a real thing that happened and is not tidied up behind the user.
 */
export function openTripOf(state: LogSnapshot): TripRecord | null {
  return (
    state.trips
      .filter((trip) => trip.deleted_at === null && trip.ended_at === null)
      .sort((a, b) => (a.started_at < b.started_at ? 1 : -1))[0] ?? null
  );
}

export function latestRigOf(state: LogSnapshot, tripId: string): RigRecord | null {
  return (
    state.rigs
      .filter((rig) => rig.trip_id === tripId)
      .sort((a, b) => b.revision - a.revision)[0] ?? null
  );
}

export function gearFor(state: LogSnapshot, catchId: string): readonly CatchGear[] {
  return state.gear.filter((g) => g.catch_id === catchId && g.deleted_at === null);
}

/** The read model the log list and search work against. */
export function searchable(
  state: LogSnapshot,
  spotNameOf: (spotId: string | null) => string | null = () => null,
): readonly SearchableCatch[] {
  return state.catches.map((record) => ({
    record,
    speciesName: speciesLabel(record.species_id, record.species_other),
    spotName: spotNameOf(record.spot_id),
    gear: state.gear.filter((g) => g.catch_id === record.id && g.deleted_at === null),
  }));
}

export interface NewTripInput {
  readonly startedAt: string;
  readonly zone: string;
  readonly waterClass: TripRecord["water_class"];
}

export async function startTrip(input: NewTripInput): Promise<TripRecord> {
  const now = new Date().toISOString();
  const trip: TripRecord = {
    id: uuidv7(),
    angler_id: LOCAL_ANGLER_ID,
    spot_id: null,
    water_class: input.waterClass,
    started_at: input.startedAt,
    started_tz: input.zone,
    ended_at: null,
    ended_tz: null,
    local_date: localDateOf(input.startedAt, input.zone),
    platform: null,
    notes: null,
    capture_mode: "live",
    client_created_at: now,
    created_at: now,
    client_updated_at: now,
    deleted_at: null,
  };
  await persist(
    [{ store: "trip", row: trip as unknown as StoredRow }],
    [mutation("trip", trip.id, "insert", trip as unknown as Record<string, unknown>, now)],
  );
  return trip;
}

export async function endTrip(tripId: string): Promise<void> {
  const trip = snapshot.trips.find((t) => t.id === tripId);
  if (!trip || trip.ended_at !== null) return;
  const now = new Date().toISOString();
  const patch = { ended_at: now, ended_tz: currentZone(), client_updated_at: now };
  const updated: TripRecord = { ...trip, ...patch };
  await persist(
    [{ store: "trip", row: updated as unknown as StoredRow }],
    [mutation("trip", tripId, "patch", patch, now)],
  );
}

export interface SaveCatchInput {
  readonly record: CatchRecord;
  readonly gear: readonly CatchGear[];
  readonly isNew: boolean;
}

/**
 * The fields that actually changed, for a patch payload.
 *
 * ADR 004 §3 requires patches to carry changed fields ONLY, and calls it the single
 * highest-value cheap decision in the design: two devices editing different fields of
 * the same row then both survive, with no per-field timestamps and no CRDT. Sending the
 * whole row instead would clobber a concurrent edit to a field this device never
 * touched. Arrays are compared by value, since `tags` and `inherited_fields` are
 * rebuilt on every save and would otherwise look changed every time.
 */
function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(after)) {
    const previous = before[key];
    const same = Array.isArray(value)
      ? Array.isArray(previous) &&
        previous.length === value.length &&
        value.every((entry, index) => entry === previous[index])
      : previous === value;
    if (!same) patch[key] = value;
  }
  return patch;
}

/** Test seam for the patch-diff rule above. */
export const __changedFieldsForTests = changedFields;

/**
 * Save a catch and its gear.
 *
 * Gear rows are replaced wholesale on edit: a catch has a handful of them, and a diff
 * would be more code and more ways to be wrong for no gain the angler can perceive.
 */
export async function saveCatch({ record, gear, isNew }: SaveCatchInput): Promise<void> {
  const now = record.client_updated_at;
  const existing = snapshot.gear.filter((g) => g.catch_id === record.id);
  const removed = existing.filter((old) => !gear.some((g) => g.id === old.id));

  const writes: { store: EntityStore; row: StoredRow }[] = [
    { store: "catch", row: record as unknown as StoredRow },
    ...gear.map((g) => ({ store: "catch_gear" as EntityStore, row: g as unknown as StoredRow })),
    ...removed.map((g) => ({
      store: "catch_gear" as EntityStore,
      row: { ...g, deleted_at: now } as unknown as StoredRow,
    })),
  ];

  const previous = snapshot.catches.find((c) => c.id === record.id);
  const patch =
    isNew || !previous
      ? (record as unknown as Record<string, unknown>)
      : changedFields(
          previous as unknown as Record<string, unknown>,
          record as unknown as Record<string, unknown>,
        );

  const mutations: Mutation[] = [
    // A patch that changes nothing still queues: `client_updated_at` always moves, so
    // this is only reachable for a genuinely empty save, and an empty patch is harmless.
    mutation("catch", record.id, isNew ? "insert" : "patch", patch, now),
    ...gear.map((g) =>
      mutation("catch_gear", g.id, "insert", g as unknown as Record<string, unknown>, now),
    ),
    ...removed.map((g) => mutation("catch_gear", g.id, "delete", {}, now)),
  ];

  await persist(writes, mutations);
}

/** Soft delete (ADR 004 §4). Tombstones sync; nothing is hard-deleted from a client. */
export async function deleteCatch(catchId: string): Promise<void> {
  const record = snapshot.catches.find((c) => c.id === catchId);
  if (!record) return;
  const now = new Date().toISOString();
  await persist(
    [{ store: "catch", row: { ...record, deleted_at: now, client_updated_at: now } as unknown as StoredRow }],
    [mutation("catch", catchId, "delete", {}, now)],
  );
}

export async function toggleFavorite(catchId: string): Promise<void> {
  const record = snapshot.catches.find((c) => c.id === catchId);
  if (!record) return;
  const now = new Date().toISOString();
  const patch = { favorite: !record.favorite, client_updated_at: now };
  await persist(
    [{ store: "catch", row: { ...record, ...patch } as unknown as StoredRow }],
    [mutation("catch", catchId, "patch", patch, now)],
  );
}

/**
 * Persist a conditions snapshot and queue it. Separate from `saveCatch` because it runs
 * after the catch is already durable — it must never be able to roll one back.
 */
export async function saveConditionSnapshot(record: { id: string } & Record<string, unknown>): Promise<void> {
  const now = new Date().toISOString();
  await persist(
    [{ store: "condition_snapshot", row: record as unknown as StoredRow }],
    [mutation("condition_snapshot", record.id, "insert", record, now)],
  );
}

/**
 * These are module-level functions with no closure over render state, so the object is a
 * constant rather than something rebuilt (or memoised) on every render.
 */
export const logActions = Object.freeze({
  saveCatch,
  deleteCatch,
  toggleFavorite,
  startTrip,
  endTrip,
});
