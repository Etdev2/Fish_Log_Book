"use client";

import {
  applyLocation,
  applyRig,
  localDateOf,
  type RepeatSeed,
} from "@/core/rules/catch/rules";
import type {
  CatchGear,
  CatchRecord,
  Disposition,
  GearRole,
  Outcome,
} from "@/core/rules/catch/types";
import { uuidv7 } from "@/core/sync/uuid";
import { snapshotForNewCatch } from "@/features/fish-legal/regulation-snapshot";
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
  /** The rod setup this fish came on (spec §15 step 2). Null = not recorded. */
  readonly rodSetupId: string | null;
  /** The location preset it was logged at (spec §15 step 3). Null = not recorded. */
  readonly locationId: string | null;
  /** Photos to attach once the catch exists. Never on the save path (spec §25). */
  readonly photos: readonly File[];
  /** Set when editing or when the angler corrected the time; otherwise now. */
  readonly caughtAt?: string;
  /** Angler-entered conditions (founder §2). Canonical SI; each optional. */
  readonly waterTempC?: number | null;
  readonly pressureHpa?: number | null;
  readonly windSpeedMs?: number | null;
  readonly windDirDeg?: number | null;
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
    // Smart defaults (spec §16): the next fish is usually on the same rod, at the same
    // place. Carried forward as a visible pre-selection, never silently assumed.
    rodSetupId: seed.rod_setup_id,
    locationId: seed.location_condition_id,
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

/**
 * Record + its gear rows → the editable draft (founder Historical spec §3: existing
 * catches ARE editable). The inverse of the save path, written out field by field for
 * the same reason `draftFromRepeatSeed` is: a spread silently drops fields.
 */
export function draftFromRecord(
  record: CatchRecord,
  gear: readonly CatchGear[],
  /**
   * The record's snapshot manual-environment values, if the caller has them: editing
   * round-trips them so an untouched "Conditions at the catch" block does not silently
   * blank the angler's earlier entries on save. SI units, same as the draft fields.
   */
  snapshotEnv?: {
    readonly waterTempC: number | null;
    readonly pressureHpa: number | null;
    readonly windSpeedMs: number | null;
    readonly windDirDeg: number | null;
  } | null,
): CatchDraft {
  return {
    speciesId: record.species_id,
    speciesOther: record.species_other,
    quantity: record.quantity ?? 1,
    weightG: record.weight_g,
    lengthMm: record.length_mm,
    sizeEstimated: record.size_estimated,
    depthM: record.depth_fished_m,
    disposition: record.disposition,
    outcome: (record.outcome ?? "landed") as Outcome,
    presentation: record.presentation,
    notes: record.notes,
    tags: record.tags,
    gear: gear
      .filter((g) => g.catch_id === record.id && g.deleted_at === null)
      .map((g) => ({ role: g.role, label: g.label, detail: g.detail, tackleItemId: g.tackle_item_id })),
    /** The catch's rig row is history; re-selecting changes it. Wire the id through so
     *  the sheet can show what this fish actually came on. */
    rodSetupId: record.rig_id,
    locationId: record.location_condition_id,
    photos: [],
    caughtAt: record.caught_at,
    waterTempC: snapshotEnv?.waterTempC ?? null,
    pressureHpa: snapshotEnv?.pressureHpa ?? null,
    windSpeedMs: snapshotEnv?.windSpeedMs ?? null,
    windDirDeg: snapshotEnv?.windDirDeg ?? null,
  };
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
  rodSetupId: null,
  locationId: null,
  photos: [],
  waterTempC: null,
  pressureHpa: null,
  windSpeedMs: null,
  windDirDeg: null,
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
 * D24 honesty at row level: a catch typed in for another day is a reconstruction entry,
 * not a live one — `capture_mode = 'backfill'` and the snapshot carries the matching
 * `snapshot_basis` downstream. Days are compared in the angler's own zone: 23:30 UTC on
 * the west coast is still "this afternoon" to the person holding the rod.
 */
export function captureModeFor(
  caughtAtIso: string,
  nowIso: string,
  zone: string,
): "live" | "backfill" {
  return localDateOf(caughtAtIso, zone) !== localDateOf(nowIso, zone) ? "backfill" : "live";
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
  const isBackfill = captureModeFor(caughtAt, nowIso, zone) === "backfill";
  const tripId = await tripForCatch(state, caughtAt);
  const catchId = uuidv7();

  // The chosen rod, or the standing one if the angler did not pick. `latestRigOf` is
  // the fallback for a trip with a single rig and no Setup page visit.
  const rig =
    (draft.rodSetupId
      ? (state.rigs.find((r) => r.id === draft.rodSetupId) ?? null)
      : null) ?? latestRigOf(state, tripId);
  const location = draft.locationId
    ? (state.locations.find((l) => l.id === draft.locationId && l.deleted_at === null) ?? null)
    : null;

  const typedGear = gearRows(draft, catchId, nowIso);
  const inherited = applyRig(
    { depth_fished_m: draft.depthM, gear: typedGear },
    rig,
    catchId,
    nowIso,
  );
  // A copy, not a reference (spec §10): editing the preset later cannot retell this fish.
  const observed = applyLocation(location);

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
    spot_id: observed.spot_id ?? inherited.spot_id,
    platform: inherited.platform,
    depth_fished_m: inherited.depth_fished_m,
    rig_id: inherited.rig_id,
    rig_revision: inherited.rig_revision,
    rig_slot: inherited.rig_slot,
    inherited_fields: inherited.inherited_fields,
    location_condition_id: observed.location_condition_id,
    location_name: observed.location_name,
    current_term: observed.current_term,
    current_strength: observed.current_strength,
    structure_type_ids: observed.structure_type_ids,
    bottom_depth_m: observed.bottom_depth_m,
    water_color_id: observed.water_color_id,
    water_clarity_id: observed.water_clarity_id,
    presentation: draft.presentation,
    notes: draft.notes,
    tags: draft.tags,
    favorite: false,
    regulation_snapshot: (() => { const s = snapshotForNewCatch(draft.speciesId, localDateOf(caughtAt, zone)); return s ? { ...s } as Record<string, unknown> : null; })(),
    capture_mode: isBackfill ? "backfill" : "live",
    client_created_at: nowIso,
    created_at: nowIso,
    client_updated_at: nowIso,
    deleted_at: null,
  };

  await saveCatch({ record, gear: inherited.gear, isNew: true });

  // Both of these run after the catch is durable and neither can undo it (spec §21).
  if (draft.photos.length > 0) await attachPhotos(catchId, draft.photos);
  await attachSnapshot(record, draft);

  return { catchId, tripId };
}

/**
 * Resolve an unresolved quick mark into a real catch (D22, spec §5).
 *
 * **This updates the mark in place; it does not create a second row.** An earlier version
 * routed "say what this was" through `logCatch`, which quietly produced a duplicate and
 * left the original mark sitting in the queue forever. The mark IS the fish — the angler
 * recorded it at the moment it happened, and resolving is finishing that record, not
 * writing a new one.
 *
 * Everything the mark already captured is preserved: its original `caught_at`, its trip,
 * its position fix, its capture mode, and the `condition_snapshot` already attached to
 * its id. The angler is filling in what the button could not know, and nothing observed
 * is overwritten by something typed later.
 *
 * D22's one-way rule still holds: this moves `unresolved -> confirmed` and there is no
 * path back.
 */
/**
 * Edit in place (Historical spec §3). Everything the sheet can say is rewritten from the
 * draft; everything it cannot — id, trip, creation stamps, the position fix — is kept
 * exactly. `client_updated_at` moves; provenance fields (`capture_mode`, the snapshot's
 * basis) do not: editing a backfilled catch does not turn it into a live one, and the
 * outbox patch carries only changed fields (ADR 004 §3).
 */
export async function updateCatchFromDraft(
  state: LogSnapshot,
  existing: CatchRecord,
  draft: CatchDraft,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const zone = currentZone();
  const caughtAt = draft.caughtAt ?? existing.caught_at;

  const rig =
    (draft.rodSetupId
      ? (state.rigs.find((r) => r.id === draft.rodSetupId) ?? null)
      : null) ?? latestRigOf(state, existing.trip_id);
  const location = draft.locationId
    ? (state.locations.find((l) => l.id === draft.locationId && l.deleted_at === null) ?? null)
    : null;

  const typedGear = gearRows({ ...draft }, existing.id, nowIso);
  const inherited = applyRig(
    { depth_fished_m: draft.depthM, gear: typedGear },
    rig,
    existing.id,
    nowIso,
  );
  const observed = applyLocation(location);

  const record: CatchRecord = {
    ...existing,
    caught_at: caughtAt,
    caught_tz: zone,
    local_date: localDateOf(caughtAt, zone),
    species_id: draft.speciesId,
    species_other: draft.speciesOther,
    outcome: draft.outcome,
    disposition: draft.disposition,
    quantity: draft.quantity,
    length_mm: draft.lengthMm,
    weight_g: draft.weightG,
    size_estimated: draft.sizeEstimated,
    spot_id: observed.spot_id ?? inherited.spot_id,
    platform: inherited.platform,
    depth_fished_m: inherited.depth_fished_m,
    rig_id: inherited.rig_id,
    rig_revision: inherited.rig_revision,
    rig_slot: inherited.rig_slot,
    inherited_fields: inherited.inherited_fields,
    location_condition_id: observed.location_condition_id,
    location_name: observed.location_name,
    current_term: observed.current_term,
    current_strength: observed.current_strength,
    structure_type_ids: observed.structure_type_ids,
    bottom_depth_m: observed.bottom_depth_m,
    water_color_id: observed.water_color_id,
    water_clarity_id: observed.water_clarity_id,
    presentation: draft.presentation,
    notes: draft.notes,
    tags: draft.tags,
    // §18 snapshot refreshes on edit: same law the angler alleges today for THIS species
    // on the CATCH's day. Pack version survival is the historical record.
    regulation_snapshot: (() => {
      const s = draft.speciesId && existing.species_id !== null || draft.speciesId
        ? (() => {
            const sz = draft.speciesId
              ? snapshotForNewCatch(draft.speciesId, localDateOf(caughtAt, zone))
              : null;
            return sz ? ({ ...sz } as Record<string, unknown>) : null;
          })()
        : existing.regulation_snapshot;
      return s;
    })(),
    client_updated_at: nowIso,
  };

  await saveCatch({ record, gear: typedGear, isNew: false });

  // Manual environment edits patch the snapshot too, like a fix arriving late (D24):
  // the snapshot row is the record's weather page, and editing the catch edits its page.
  const snapshot = state.snapshots.find((s) => s.catch_id === existing.id && s.deleted_at === null);
  const manualEnv = {
    waterTempC: draft.waterTempC ?? null,
    pressureHpa: draft.pressureHpa ?? null,
    windSpeedMs: draft.windSpeedMs ?? null,
    windDirDeg: draft.windDirDeg ?? null,
  };
  if (snapshot && Object.values(manualEnv).some((v) => v !== null)) {
    await saveConditionSnapshot({
      ...(snapshot as unknown as Record<string, unknown>),
      water_temp_c: manualEnv.waterTempC,
      pressure_hpa: manualEnv.pressureHpa,
      wind_speed_ms: manualEnv.windSpeedMs,
      wind_dir_deg: manualEnv.windDirDeg,
      client_updated_at: nowIso,
    } as unknown as { id: string } & Record<string, unknown>);
  }
}

export async function resolveMark(
  state: LogSnapshot,
  markId: string,
  draft: CatchDraft,
): Promise<LogResult> {
  const mark = state.catches.find((c) => c.id === markId);
  if (!mark) throw new Error(`no mark ${markId} to resolve`);
  if (mark.resolution_state !== "unresolved") {
    // Already answered — resolving twice is a no-op, not an error at the glass.
    return { catchId: mark.id, tripId: mark.trip_id };
  }

  const nowIso = new Date().toISOString();
  const rig =
    (draft.rodSetupId ? (state.rigs.find((r) => r.id === draft.rodSetupId) ?? null) : null) ??
    (mark.rig_id ? (state.rigs.find((r) => r.id === mark.rig_id) ?? null) : null);
  const location = draft.locationId
    ? (state.locations.find((l) => l.id === draft.locationId && l.deleted_at === null) ?? null)
    : null;

  const typedGear = gearRows(draft, mark.id, nowIso);
  const inherited = applyRig(
    { depth_fished_m: draft.depthM, gear: typedGear },
    rig,
    mark.id,
    nowIso,
  );
  const observed = applyLocation(location);

  const resolved: CatchRecord = {
    ...mark,
    // Answered now.
    resolution_state: "confirmed",
    resolved_at: nowIso,
    species_id: draft.speciesId,
    species_other: draft.speciesOther,
    outcome: draft.outcome,
    disposition: draft.disposition,
    quantity: draft.quantity,
    length_mm: draft.lengthMm,
    weight_g: draft.weightG,
    size_estimated: draft.sizeEstimated,
    presentation: draft.presentation,
    notes: draft.notes,
    tags: draft.tags,
    // Rod and place: what the angler picked now, falling back to what the mark inherited
    // at the time. A `null` from an untouched picker never erases what was captured.
    rig_id: inherited.rig_id ?? mark.rig_id,
    rig_revision: inherited.rig_revision ?? mark.rig_revision,
    rig_slot: inherited.rig_slot ?? mark.rig_slot,
    depth_fished_m: inherited.depth_fished_m ?? mark.depth_fished_m,
    platform: inherited.platform ?? mark.platform,
    inherited_fields: inherited.inherited_fields,
    location_condition_id: observed.location_condition_id ?? mark.location_condition_id,
    location_name: observed.location_name ?? mark.location_name,
    current_term: observed.current_term ?? mark.current_term,
    current_strength: observed.current_strength ?? mark.current_strength,
    structure_type_ids:
      observed.structure_type_ids.length > 0
        ? observed.structure_type_ids
        : mark.structure_type_ids,
    bottom_depth_m: observed.bottom_depth_m ?? mark.bottom_depth_m,
    water_color_id: observed.water_color_id ?? mark.water_color_id,
    water_clarity_id: observed.water_clarity_id ?? mark.water_clarity_id,
    spot_id: observed.spot_id ?? mark.spot_id,
    client_updated_at: nowIso,
    // Deliberately NOT touched: caught_at, caught_tz, local_date, trip_id, lat, lng,
    // gps_accuracy_m, capture_mode, client_created_at, created_at. Those are what the
    // mark observed, and typing a species later does not change when or where it was.
  };

  await saveCatch({ record: resolved, gear: inherited.gear, isNew: false });
  if (draft.photos.length > 0) await attachPhotos(mark.id, draft.photos);
  return { catchId: mark.id, tripId: mark.trip_id };
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

  // A mark inherits the standing rod and the last location just like a catch does.
  // The angler tapped one button; that is not a reason for the record to be poorer.
  const rig = latestRigOf(state, tripId);
  const inherited = applyRig({}, rig, catchId, nowIso);
  const observed = applyLocation(mostRecentLocation(state, tripId));

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
    spot_id: observed.spot_id ?? inherited.spot_id,
    platform: inherited.platform,
    depth_fished_m: inherited.depth_fished_m,
    rig_id: inherited.rig_id,
    rig_revision: inherited.rig_revision,
    rig_slot: inherited.rig_slot,
    inherited_fields: inherited.inherited_fields,
    location_condition_id: observed.location_condition_id,
    location_name: observed.location_name,
    current_term: observed.current_term,
    current_strength: observed.current_strength,
    structure_type_ids: observed.structure_type_ids,
    bottom_depth_m: observed.bottom_depth_m,
    water_color_id: observed.water_color_id,
    water_clarity_id: observed.water_clarity_id,
    presentation: null,
    notes: null,
    tags: [],
    regulation_snapshot: null,
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
async function attachSnapshot(
  record: CatchRecord,
  draft?: CatchDraft,
): Promise<void> {
  try {
    const snapshot = buildCatchSnapshot(
      {
        catchId: record.id,
        tripId: record.trip_id,
        observedAt: record.caught_at,
        waterClass: "salt",
        lat: record.lat,
        lng: record.lng,
        manualEnvironment:
          draft &&
          [draft.waterTempC, draft.pressureHpa, draft.windSpeedMs, draft.windDirDeg].some(
            (v) => v !== null && v !== undefined,
          )
            ? {
                waterTempC: draft.waterTempC ?? null,
                pressureHpa: draft.pressureHpa ?? null,
                windSpeedMs: draft.windSpeedMs ?? null,
                windDirDeg: draft.windDirDeg ?? null,
              }
            : null,
      },
      record.capture_mode,
    );
    await saveConditionSnapshot(snapshot as unknown as { id: string } & Record<string, unknown>);
  } catch {
    // The catch stands. Enrichment is retried server-side.
  }
}

/** The location the angler most recently set up, for a mark that names none. */
function mostRecentLocation(state: LogSnapshot, tripId: string) {
  return (
    state.locations
      .filter((l) => l.trip_id === tripId && l.deleted_at === null)
      .sort((a, b) => (a.client_updated_at < b.client_updated_at ? 1 : -1))[0] ?? null
  );
}

function round5(value: number): number {
  return Math.round(value * 100_000) / 100_000;
}
