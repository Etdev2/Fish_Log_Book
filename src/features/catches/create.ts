"use client";

import { applyRig, localDateOf, type RepeatSeed } from "@/core/rules/catch/rules";
import type {
  CatchGear,
  CatchRecord,
  Disposition,
  GearRole,
  Outcome,
} from "@/core/rules/catch/types";
import { uuidv7 } from "@/core/sync/uuid";
import { buildCatchSnapshot } from "./conditions";
import { attachPhotos } from "./media";
import {
  currentLog,
  currentZone,
  latestRigOf,
  LOCAL_ANGLER_ID,
  openTripOf,
  saveCatch,
  saveConditionSnapshot,
  startTrip,
  type LogSnapshot,
} from "./store";

/**
 * Turning a tap into a catch.
 *
 * The ordering here is the whole offline contract (spec §21): the catch row is written
 * first and everything optional happens around it. A GPS fix that never arrives, a
 * snapshot that cannot be computed, a photo that fails to encode — none of them can stop
 * or undo the save. The catch is the fact; the rest is enrichment.
 */

export interface CatchDraft {
  readonly speciesId: string | null;
  readonly speciesOther: string | null;
  readonly quantity: number;
  readonly weightG: number | null;
  readonly lengthMm: number | null;
  readonly sizeEstimated: boolean;
  readonly depthM: number | null;
  readonly disposition: Disposition | null;
  readonly outcome: Outcome;
  readonly presentation: string | null;
  readonly notes: string | null;
  readonly tags: readonly string[];
  readonly gear: readonly { role: GearRole; label: string; detail: string | null; tackleItemId: string | null }[];
  /** Photos to attach once the catch exists. Never on the save path (spec §25). */
  readonly photos: readonly File[];
  /** Set when editing or when the angler corrected the time; otherwise now. */
  readonly caughtAt?: string;
}

/**
 * A `RepeatSeed` (column names, from `core/rules`) into a `CatchDraft` (form field names).
 *
 * Written out field by field rather than spread. The two shapes deliberately use
 * different naming — the rules layer speaks the schema, the form speaks the form — and a
 * spread between them type-checks while silently dropping every field, because excess
 * properties in a spread are not checked. That shipped once; `create.test.ts` pins it.
 */
export function draftFromRepeatSeed(seed: RepeatSeed): CatchDraft {
  return {
    ...EMPTY_DRAFT,
    speciesId: seed.species_id,
    speciesOther: seed.species_other,
    depthM: seed.depth_fished_m,
    disposition: seed.disposition,
    outcome: seed.outcome ?? "landed",
    presentation: seed.presentation,
    tags: seed.tags,
    gear: draftGearFrom(seed.gear),
    // Photos are of one particular fish and are never copied to another (spec §25).
    photos: [],
  };
}

/** Stored gear rows back into the draft shape, for duplicate and repeat. */
export function draftGearFrom(gear: readonly CatchGear[]): CatchDraft["gear"] {
  return gear.map((g) => ({
    role: g.role,
    label: g.label,
    detail: g.detail,
    tackleItemId: g.tackle_item_id,
  }));
}

export const EMPTY_DRAFT: CatchDraft = {
  speciesId: null,
  speciesOther: null,
  quantity: 1,
  weightG: null,
  lengthMm: null,
  sizeEstimated: false,
  depthM: null,
  disposition: null,
  outcome: "landed",
  presentation: null,
  notes: null,
  tags: [],
  gear: [],
  photos: [],
};

/**
 * A position fix, if one arrives at all.
 *
 * Resolved rather than rejected on failure: refused permission, no fix, and a slow warm
 * start all produce the same thing — `null`, and a catch with no coordinates, which is a
 * perfectly honest record.
 *
 * Nothing on the save path ever awaits this. See `startPositionRequest`.
 */
export function tryPosition(timeoutMs = 4_000): Promise<GeolocationPosition | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const done = (value: GeolocationPosition | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        done(position);
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}

/**
 * A position request in flight, whose current value can be read synchronously.
 *
 * This exists because of a bug worth naming: awaiting the fix at save time makes the
 * save take as long as the GPS does. On a phone that has not had a fix recently that is
 * the full timeout — four seconds of nothing happening, against a target of five to ten
 * seconds for the whole catch (spec §2), and in direct violation of spec §21: a failed
 * or slow secondary service must never hold up the catch.
 *
 * So the request is started when the sheet opens and *read*, never awaited, when the
 * angler saves. Whatever has arrived by then is used. If a fix lands afterwards it is
 * patched onto the row by `attachPositionLater`, which the angler never waits for.
 */
export interface PositionRequest {
  /** Whatever has arrived so far. Read synchronously; never blocks. */
  value: GeolocationPosition | null;
  settled: boolean;
  readonly promise: Promise<GeolocationPosition | null>;
}

export function startPositionRequest(timeoutMs = 8_000): PositionRequest {
  const request = {
    value: null as GeolocationPosition | null,
    settled: false,
  } as { value: GeolocationPosition | null; settled: boolean; promise: Promise<GeolocationPosition | null> };
  request.promise = tryPosition(timeoutMs).then((position) => {
    request.value = position;
    request.settled = true;
    return position;
  });
  return request;
}

/**
 * Fill in a fix that arrived after the catch was already saved.
 *
 * Only ever adds: if the row already has coordinates, or the fix never came, nothing
 * happens. A patch here can never remove a position or disturb anything the angler typed.
 */
export async function attachPositionLater(
  catchId: string,
  request: PositionRequest,
): Promise<void> {
  const position = await request.promise;
  if (!position) return;
  const state = currentLog();
  const record = state.catches.find((c) => c.id === catchId);
  if (!record || record.lat !== null || record.deleted_at !== null) return;
  await saveCatch({
    record: {
      ...record,
      lat: round5(position.coords.latitude),
      lng: round5(position.coords.longitude),
      gps_accuracy_m: Math.round(position.coords.accuracy * 10) / 10,
      client_updated_at: new Date().toISOString(),
    },
    gear: state.gear.filter((g) => g.catch_id === catchId && g.deleted_at === null),
    isNew: false,
  });
}

function gearRows(
  draft: CatchDraft,
  catchId: string,
  nowIso: string,
): readonly CatchGear[] {
  return draft.gear
    .filter((g) => g.label.trim() !== "")
    .map((g, index) => ({
      id: `${catchId}-gear-${index}`,
      catch_id: catchId,
      angler_id: LOCAL_ANGLER_ID,
      tackle_item_id: g.tackleItemId,
      role: g.role,
      label: g.label.trim(),
      detail: g.detail?.trim() || null,
      created_at: nowIso,
      deleted_at: null,
    }));
}

/**
 * The trip a catch belongs to, opening one if none is running (spec §11).
 *
 * The angler is never asked. `catch.trip_id` is NOT NULL because a catch without a trip
 * has no effort denominator (spec §12), and the way both facts coexist is that the trip
 * is implicit.
 */
async function tripForCatch(state: LogSnapshot, atIso: string): Promise<string> {
  const open = openTripOf(state);
  if (open) return open.id;
  const trip = await startTrip({ startedAt: atIso, zone: currentZone(), waterClass: "salt" });
  return trip.id;
}

export interface LogResult {
  readonly catchId: string;
  readonly tripId: string;
}

/**
 * Log a catch. Resolves once the row is durable locally — not once it is synced.
 *
 * `position` is passed in rather than fetched here so the caller can start the GPS
 * request while the angler is still choosing a species, and so a fix that has not
 * arrived by save time simply is not used.
 */
export async function logCatch(
  state: LogSnapshot,
  draft: CatchDraft,
  position: GeolocationPosition | null,
): Promise<LogResult> {
  const now = new Date();
  const nowIso = now.toISOString();
  const caughtAt = draft.caughtAt ?? nowIso;
  const zone = currentZone();
  const tripId = await tripForCatch(state, caughtAt);
  const catchId = uuidv7();

  const rig = latestRigOf(state, tripId);
  const typedGear = gearRows(draft, catchId, nowIso);
  const inherited = applyRig(
    { depth_fished_m: draft.depthM, gear: typedGear },
    rig,
    catchId,
    nowIso,
  );

  const record: CatchRecord = {
    id: catchId,
    angler_id: LOCAL_ANGLER_ID,
    trip_id: tripId,
    caught_at: caughtAt,
    caught_tz: zone,
    local_date: localDateOf(caughtAt, zone),
    lat: position ? round5(position.coords.latitude) : null,
    lng: position ? round5(position.coords.longitude) : null,
    gps_accuracy_m: position ? Math.round(position.coords.accuracy * 10) / 10 : null,
    // A catch logged through the full sheet is a fact the moment it is saved: the angler
    // said what it was. Only the quick mark starts life unresolved (D22).
    resolution_state: "confirmed",
    dismissed_reason: null,
    resolved_at: nowIso,
    species_id: draft.speciesId,
    species_other: draft.speciesOther,
    outcome: draft.outcome,
    disposition: draft.disposition,
    quantity: draft.quantity,
    length_mm: draft.lengthMm,
    weight_g: draft.weightG,
    size_estimated: draft.sizeEstimated,
    spot_id: inherited.spot_id,
    platform: inherited.platform,
    depth_fished_m: inherited.depth_fished_m,
    rig_id: inherited.rig_id,
    rig_revision: inherited.rig_revision,
    inherited_fields: inherited.inherited_fields,
    presentation: draft.presentation,
    notes: draft.notes,
    tags: draft.tags,
    favorite: false,
    capture_mode: "live",
    client_created_at: nowIso,
    created_at: nowIso,
    client_updated_at: nowIso,
    deleted_at: null,
  };

  await saveCatch({ record, gear: inherited.gear, isNew: true });

  // Both of these run after the catch is durable and neither can undo it (spec §21).
  if (draft.photos.length > 0) await attachPhotos(catchId, draft.photos);
  await attachSnapshot(record);

  return { catchId, tripId };
}

/**
 * The quick mark (D22) — the man-overboard button.
 *
 * Writes a row that is explicitly *not yet a fact*: no species, no outcome, excluded
 * from every rate until a human says what happened. It returns as soon as the row is
 * durable. No spinner, no network, nothing to dismiss.
 */
export async function logQuickMark(state: LogSnapshot): Promise<LogResult> {
  const nowIso = new Date().toISOString();
  const zone = currentZone();
  const tripId = await tripForCatch(state, nowIso);
  const catchId = uuidv7();

  const rig = latestRigOf(state, tripId);
  const inherited = applyRig({}, rig, catchId, nowIso);

  const record: CatchRecord = {
    id: catchId,
    angler_id: LOCAL_ANGLER_ID,
    trip_id: tripId,
    caught_at: nowIso,
    caught_tz: zone,
    local_date: localDateOf(nowIso, zone),
    lat: null,
    lng: null,
    gps_accuracy_m: null,
    resolution_state: "unresolved",
    dismissed_reason: null,
    resolved_at: null,
    species_id: null,
    species_other: null,
    outcome: null,
    disposition: null,
    quantity: 1,
    length_mm: null,
    weight_g: null,
    size_estimated: false,
    spot_id: inherited.spot_id,
    platform: inherited.platform,
    depth_fished_m: inherited.depth_fished_m,
    rig_id: inherited.rig_id,
    rig_revision: inherited.rig_revision,
    inherited_fields: inherited.inherited_fields,
    presentation: null,
    notes: null,
    tags: [],
    favorite: false,
    capture_mode: "live",
    client_created_at: nowIso,
    created_at: nowIso,
    client_updated_at: nowIso,
    deleted_at: null,
  };

  await saveCatch({ record, gear: inherited.gear, isNew: true });

  // Everything below is best-effort and deliberately not awaited: the mark is already
  // durable, and D22's whole promise is that this button never makes anybody wait.
  void (async () => {
    const request = startPositionRequest();
    await attachPositionLater(catchId, request);
    await attachSnapshot({
      ...record,
      lat: request.value ? round5(request.value.coords.latitude) : null,
      lng: request.value ? round5(request.value.coords.longitude) : null,
    });
  })();

  return { catchId, tripId };
}

/**
 * Attach the conditions snapshot. Failures are swallowed on purpose: spec §21 is
 * explicit that a failed secondary service must never cost the angler the catch, and
 * the catch is already durable by the time this runs.
 */
async function attachSnapshot(record: CatchRecord): Promise<void> {
  try {
    const snapshot = buildCatchSnapshot(
      {
        catchId: record.id,
        tripId: record.trip_id,
        observedAt: record.caught_at,
        waterClass: "salt",
        lat: record.lat,
        lng: record.lng,
      },
      record.capture_mode,
    );
    await saveConditionSnapshot(snapshot as unknown as { id: string } & Record<string, unknown>);
  } catch {
    // The catch stands. Enrichment is retried server-side.
  }
}

function round5(value: number): number {
  return Math.round(value * 100_000) / 100_000;
}
