/**
 * The catch record as the local store holds it (spec §39, reconciled with the schema in
 * `supabase/migrations/20260828120000_v1_core_schema.sql`).
 *
 * These names are the *column* names, snake_case, deliberately. This object is the
 * insert payload the outbox carries to PostgREST unchanged (ADR 004 §3); a camelCase
 * mirror would mean a mapping layer whose only job is to be wrong once.
 *
 * Every field the schema declares NOT NULL is non-optional here, so a row that cannot
 * be inserted cannot be constructed.
 */

export type ResolutionState = "unresolved" | "confirmed" | "dismissed";
export type DismissedReason = "mistap" | "not_a_fish_waypoint" | "duplicate";
export type Outcome = "landed" | "lost" | "missed_bite" | "short_bite";
export type Disposition = "kept" | "released" | "n/a";
export type CaptureMode = "live" | "backfill";
export type WaterClass = "salt" | "fresh";

/**
 * Gear on a catch (spec §14). One catch, many pieces of gear, each with a role — the
 * spec is explicit that a single `gear_id` is the wrong shape.
 *
 * `label` and `detail` are a SNAPSHOT taken at the moment of the catch (spec §15). The
 * angler edits or deletes a tackle item six months later and this row still says what
 * was actually tied on. `tackle_item_id` keeps the live link for "how has this jig
 * performed"; the snapshot keeps the history honest when the link dies.
 */
export type GearRole =
  | "rod"
  | "reel"
  | "main_line"
  | "leader"
  | "hook"
  | "lure"
  | "jig"
  | "bait"
  | "weight"
  | "terminal";

export interface CatchGear {
  readonly id: string;
  readonly catch_id: string;
  readonly angler_id: string;
  readonly tackle_item_id: string | null;
  readonly role: GearRole;
  readonly label: string;
  readonly detail: string | null;
  readonly created_at: string;
  readonly deleted_at: string | null;
}

export interface CatchRecord {
  readonly id: string;
  readonly angler_id: string;
  readonly trip_id: string;
  readonly caught_at: string;
  readonly caught_tz: string;
  readonly local_date: string;

  readonly lat: number | null;
  readonly lng: number | null;
  readonly gps_accuracy_m: number | null;

  readonly resolution_state: ResolutionState;
  readonly dismissed_reason: DismissedReason | null;
  readonly resolved_at: string | null;

  readonly species_id: string | null;
  /** Free text for a fish not in the vocabulary (spec §5). Never a substitute for an id. */
  readonly species_other: string | null;
  readonly outcome: Outcome | null;
  readonly disposition: Disposition | null;
  readonly quantity: number;
  readonly length_mm: number | null;
  readonly weight_g: number | null;
  readonly size_estimated: boolean;

  readonly spot_id: string | null;
  readonly platform: string | null;
  readonly depth_fished_m: number | null;
  readonly rig_id: string | null;
  readonly rig_revision: number | null;
  /** Which rod slot this fish came on, for "how has Rod 2 done today". */
  readonly rig_slot: number | null;
  readonly inherited_fields: readonly string[];

  /**
   * The location preset this catch was logged against, and a copy of what it said at
   * that moment (spec §10, §17). The id is the live link; the copied values are the
   * history, and they are what survives the preset being edited or deleted later.
   */
  readonly location_condition_id: string | null;
  readonly location_name: string | null;
  readonly current_term: CurrentTerm | null;
  readonly current_strength: CurrentStrength | null;
  readonly structure_type_ids: readonly string[];
  /** Bottom depth at the spot. `depth_fished_m` above is where the fish actually was. */
  readonly bottom_depth_m: number | null;
  readonly water_color_id: string | null;
  readonly water_clarity_id: string | null;

  readonly presentation: string | null;
  readonly notes: string | null;
  readonly tags: readonly string[];
  readonly favorite: boolean;

  /**
   * Fish Legal §18: the regulation pack reading at log time. Written by the app from
   * the day-and-species card, stored verbatim, never rewritten when the law changes.
   * Null = nothing verified was knowable (same stance as "No verified data").
   */
  readonly regulation_snapshot: Record<string, unknown> | null;
  readonly capture_mode: CaptureMode;
  readonly client_created_at: string;
  readonly created_at: string;
  readonly client_updated_at: string;
  readonly deleted_at: string | null;
}

export interface TripRecord {
  readonly id: string;
  readonly angler_id: string;
  readonly spot_id: string | null;
  readonly water_class: WaterClass;
  readonly started_at: string;
  readonly started_tz: string;
  readonly ended_at: string | null;
  readonly ended_tz: string | null;
  readonly local_date: string;
  readonly platform: string | null;
  readonly notes: string | null;
  readonly capture_mode: CaptureMode;
  readonly client_created_at: string;
  readonly created_at: string;
  readonly client_updated_at: string;
  readonly deleted_at: string | null;
}

/**
 * A rod setup — one rigged rod, ready to fish (spec §6).
 *
 * This is D21a's sticky rig generalised from one standing rig per trip to N of them,
 * one per `slot` (Rod 1, Rod 2, …). It stays **append-only**: re-rigging Rod 1 inserts
 * revision n+1 of slot 1 rather than editing revision n. That is the whole of spec §10 —
 * changing today's leader at 10am cannot rewrite what the 8am fish was caught on,
 * because the 8am catch still points at the revision that was standing when it happened.
 *
 * A second table was deliberately not created for this. Two answers to "what was I
 * fishing with" is exactly the drift ADR 003 exists to prevent.
 */
export type SetupType =
  | "flyline"
  | "surface_iron"
  | "yo_yo"
  | "knife_jig"
  | "slow_pitch"
  | "dropper_loop"
  | "trolling"
  | "bottom"
  | "bait_rig"
  | "custom";

/** Gear on a rod setup: the same shape as gear on a catch, minus the catch it is on. */
export type SetupGear = Omit<CatchGear, "catch_id" | "id" | "created_at" | "deleted_at">;

export interface RigRecord {
  readonly id: string;
  readonly angler_id: string;
  readonly trip_id: string;
  /** Rod 1, Rod 2, … Stable for the life of the trip; revisions accrue within a slot. */
  readonly slot: number;
  /** The angler's own name for it — "40 lb Flyline". Falls back to "Rod {slot}". */
  readonly name: string | null;
  readonly setup_type: SetupType | null;
  readonly revision: number;
  readonly effective_from: string;
  readonly spot_id: string | null;
  readonly platform: string | null;
  readonly depth_fished_m: number | null;
  readonly live_bait: boolean;
  readonly gear: readonly SetupGear[];
  readonly created_at: string;
  /** Retired rods stop being offered when logging, without losing their history. */
  readonly retired_at: string | null;
}

/**
 * Observed conditions at a place being fished today (spec §11–§13).
 *
 * **Angler observations, not instrument readings.** `current_term` is the fishing term
 * for which way the water is pushing relative to the spot — uphill, downhill, inshore,
 * offshore — and is deliberately never reconciled with a measured current vector. The
 * ontology already reserved exactly these four values for exactly this reason.
 *
 * Unlike a rod setup this is mutable: it is a preset describing right now, and the
 * history lives on the catch's own immutable `condition_snapshot`. Editing "West End"
 * at noon does not touch the 8am fish, because the 8am fish copied what it needed.
 */
export type CurrentTerm = "uphill" | "downhill" | "inshore" | "offshore" | "unknown";
export type CurrentStrength = "none" | "light" | "moderate" | "strong" | "very_strong";

export interface LocationConditionRecord {
  readonly id: string;
  readonly angler_id: string;
  readonly trip_id: string;
  readonly spot_id: string | null;
  /** "West End". The one field that has to be filled in. */
  readonly name: string;
  readonly current_term: CurrentTerm | null;
  readonly current_strength: CurrentStrength | null;
  /** Several are normal — "Rocky + Kelp" is one place, not two (spec §13). */
  readonly structure_type_ids: readonly string[];
  /** Bottom depth here. NOT the depth a fish was caught at — see spec §13. */
  readonly bottom_depth_m: number | null;
  readonly water_color_id: string | null;
  readonly water_clarity_id: string | null;
  readonly notes: string | null;
  readonly created_at: string;
  readonly client_updated_at: string;
  readonly deleted_at: string | null;
}
