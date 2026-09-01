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
  readonly inherited_fields: readonly string[];

  readonly presentation: string | null;
  readonly notes: string | null;
  readonly tags: readonly string[];
  readonly favorite: boolean;

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
 * The sticky rig (D21a). Append-only: changing it inserts revision n+1, so a change at
 * 3pm cannot rewrite what the 11am fish was caught on.
 */
export interface RigRecord {
  readonly id: string;
  readonly angler_id: string;
  readonly trip_id: string;
  readonly revision: number;
  readonly effective_from: string;
  readonly spot_id: string | null;
  readonly platform: string | null;
  readonly depth_fished_m: number | null;
  readonly gear: readonly Omit<CatchGear, "catch_id" | "id" | "created_at" | "deleted_at">[];
  readonly created_at: string;
}
