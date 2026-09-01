/**
 * The catch rules that both clients must agree on (ADR 003 §3). Pure, no I/O, vector
 * -policed by `src/core/rules/vectors/catch-rules.json`.
 *
 * Everything here answers one of three questions:
 *   - which fields does a new catch inherit, and from where (D21a, spec §6/§7);
 *   - is this row allowed to exist (spec §40);
 *   - which calendar day does it belong to (ontology §2.1).
 */

import type {
  CatchGear,
  CatchRecord,
  Disposition,
  GearRole,
  LocationConditionRecord,
  Outcome,
  RigRecord,
} from "./types";

// ---------------------------------------------------------------------------------
// Day bucketing (ontology §2.1)
// ---------------------------------------------------------------------------------

/**
 * The local calendar date an instant belongs to, in `zone`.
 *
 * A 01:30 halibut belongs to the 30th if that is what the clock on the boat said, not
 * to whatever UTC thinks. `Intl` does the zone arithmetic — hand-rolling an offset table
 * is how DST bugs get written.
 */
export function localDateOf(isoInstant: string, zone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(isoInstant));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// ---------------------------------------------------------------------------------
// Rig inheritance (D21a, spec §6)
// ---------------------------------------------------------------------------------

/** The catch fields a standing rig can supply. */
export const INHERITABLE_FIELDS = ["spot_id", "platform", "depth_fished_m"] as const;
export type InheritableField = (typeof INHERITABLE_FIELDS)[number];

export interface InheritedRig {
  readonly spot_id: string | null;
  readonly platform: string | null;
  readonly depth_fished_m: number | null;
  readonly gear: readonly CatchGear[];
  readonly rig_id: string | null;
  readonly rig_revision: number | null;
  readonly rig_slot: number | null;
  /** Which of the above came from the rig rather than the angler's thumb. */
  readonly inherited_fields: readonly string[];
}

const EMPTY_RIG: InheritedRig = {
  spot_id: null,
  platform: null,
  depth_fished_m: null,
  gear: [],
  rig_id: null,
  rig_revision: null,
  rig_slot: null,
  inherited_fields: [],
};

/**
 * Apply the standing rig to a partially-filled catch.
 *
 * A value the angler typed always wins; the rig only fills what is absent. The fields
 * the rig supplied are recorded in `inherited_fields`, because an inherited value is a
 * weaker claim than a typed one and the UI has to be able to say so.
 */
export function applyRig(
  typed: {
    spot_id?: string | null;
    platform?: string | null;
    depth_fished_m?: number | null;
    gear?: readonly CatchGear[];
  },
  rig: RigRecord | null,
  catchId: string,
  nowIso: string,
): InheritedRig {
  if (!rig) {
    return {
      ...EMPTY_RIG,
      spot_id: typed.spot_id ?? null,
      platform: typed.platform ?? null,
      depth_fished_m: typed.depth_fished_m ?? null,
      gear: typed.gear ?? [],
    };
  }

  const inherited: string[] = [];
  const take = <K extends InheritableField>(field: K, typedValue: unknown) => {
    if (typedValue !== undefined && typedValue !== null) return typedValue;
    const fromRig = rig[field];
    if (fromRig !== null && fromRig !== undefined) inherited.push(field);
    return fromRig ?? null;
  };

  // Order matters: `inherited_fields` is rendered to the angler as "these came from the
  // rig", so it is built in the order the fields read on screen, not in evaluation order.
  const spot_id = take("spot_id", typed.spot_id) as string | null;
  const platform = take("platform", typed.platform) as string | null;
  const depth_fished_m = take("depth_fished_m", typed.depth_fished_m) as number | null;

  const gear: readonly CatchGear[] =
    typed.gear && typed.gear.length > 0
      ? typed.gear
      : rig.gear.map((item, index) => {
          return {
            ...item,
            id: `${catchId}-gear-${index}`,
            catch_id: catchId,
            created_at: nowIso,
            deleted_at: null,
          };
        });
  if ((!typed.gear || typed.gear.length === 0) && rig.gear.length > 0) inherited.push("gear");

  return {
    spot_id,
    platform,
    depth_fished_m,
    gear,
    rig_id: rig.id,
    rig_revision: rig.revision,
    rig_slot: rig.slot,
    inherited_fields: inherited,
  };
}

// ---------------------------------------------------------------------------------
// Location conditions (spec §10, §11, §17)
// ---------------------------------------------------------------------------------

/** The observed-condition fields a catch copies from the location it was logged at. */
export interface InheritedLocation {
  readonly location_condition_id: string | null;
  readonly location_name: string | null;
  readonly spot_id: string | null;
  readonly current_term: LocationConditionRecord["current_term"];
  readonly current_strength: LocationConditionRecord["current_strength"];
  readonly structure_type_ids: readonly string[];
  readonly bottom_depth_m: number | null;
  readonly water_color_id: string | null;
  readonly water_clarity_id: string | null;
}

export const NO_LOCATION: InheritedLocation = {
  location_condition_id: null,
  location_name: null,
  spot_id: null,
  current_term: null,
  current_strength: null,
  structure_type_ids: [],
  bottom_depth_m: null,
  water_color_id: null,
  water_clarity_id: null,
};

/**
 * Copy a location preset onto a catch.
 *
 * This is a **copy, not a reference**, and that is the entire point of spec §10. The id
 * is kept so "how has West End fished" can still join; every value beside it is frozen
 * at the moment of the catch, so editing the preset at noon — or deleting it next week —
 * cannot retell what the 8am fish was caught in.
 *
 * `structure_type_ids` is copied by value for the same reason. "Rocky + Kelp" is one
 * place, and the array is what makes it one place rather than two rows (spec §13).
 */
export function applyLocation(location: LocationConditionRecord | null): InheritedLocation {
  if (!location) return NO_LOCATION;
  return {
    location_condition_id: location.id,
    location_name: location.name,
    spot_id: location.spot_id,
    current_term: location.current_term,
    current_strength: location.current_strength,
    structure_type_ids: [...location.structure_type_ids],
    bottom_depth_m: location.bottom_depth_m,
    water_color_id: location.water_color_id,
    water_clarity_id: location.water_clarity_id,
  };
}

/**
 * The rods on offer when logging: the newest revision of each slot, minus any slot whose
 * newest revision retires it.
 *
 * The order of those two steps is the whole correctness of this function. Filtering
 * retired *rows* first and then taking the newest of what is left resurrects the rod:
 * putting Rod 1 away writes revision 2 with `retired_at` set, revision 1 is not retired,
 * and the rod comes straight back onto the log screen. Retirement is a property of the
 * slot as of its latest revision, never of an individual row.
 */
export function activeRodSetups(
  rigs: readonly RigRecord[],
  tripId: string,
): readonly RigRecord[] {
  const latestBySlot = new Map<number, RigRecord>();
  for (const rig of rigs) {
    if (rig.trip_id !== tripId) continue;
    const seen = latestBySlot.get(rig.slot);
    if (!seen || rig.revision > seen.revision) latestBySlot.set(rig.slot, rig);
  }
  return [...latestBySlot.values()]
    .filter((rig) => rig.retired_at === null)
    .sort((a, b) => a.slot - b.slot);
}

/** The display name for a rod: the angler's own, or the slot it sits in. */
export function rodSetupLabel(rig: Pick<RigRecord, "slot" | "name">): string {
  const named = rig.name?.trim();
  return named && named !== "" ? named : `Rod ${rig.slot}`;
}

/** The next free slot number, so adding a rod never collides with a live one. */
export function nextRodSlot(rigs: readonly RigRecord[], tripId: string): number {
  const used = rigs.filter((r) => r.trip_id === tripId).map((r) => r.slot);
  return used.length === 0 ? 1 : Math.max(...used) + 1;
}

// ---------------------------------------------------------------------------------
// Repeat and duplicate (spec §6, §7)
// ---------------------------------------------------------------------------------

/**
 * Fields a repeat/duplicate carries over. Everything about *how* you were fishing
 * repeats; everything about *this particular fish* does not.
 *
 * Weight, length and notes are deliberately absent: the second fish is a different fish,
 * and copying its predecessor's 84 lb forward would manufacture data. That is the whole
 * reason this list is written down rather than being a spread of the previous row.
 */
export const REPEATED_FIELDS = [
  "species_id",
  "species_other",
  "spot_id",
  "platform",
  "depth_fished_m",
  "presentation",
  "disposition",
  "outcome",
  "tags",
  "rig_id",
  "location_condition_id",
] as const;

export interface RepeatSeed {
  readonly species_id: string | null;
  readonly species_other: string | null;
  readonly spot_id: string | null;
  readonly platform: string | null;
  readonly depth_fished_m: number | null;
  readonly presentation: string | null;
  readonly disposition: Disposition | null;
  readonly outcome: Outcome | null;
  readonly tags: readonly string[];
  readonly gear: readonly CatchGear[];
  /** Smart defaults (spec §16): same rod, same place, offered — never assumed. */
  readonly rod_setup_id: string | null;
  readonly location_condition_id: string | null;
}

/**
 * What "+ Log another" starts from. The caller mints a new id and a new timestamp — this
 * function deliberately cannot, so there is no way to produce a repeat that silently
 * shares its parent's identity or moment.
 */
export function repeatSeedFrom(previous: CatchRecord, gear: readonly CatchGear[]): RepeatSeed {
  return {
    species_id: previous.species_id,
    species_other: previous.species_other,
    spot_id: previous.spot_id,
    platform: previous.platform,
    depth_fished_m: previous.depth_fished_m,
    presentation: previous.presentation,
    disposition: previous.disposition,
    outcome: previous.outcome,
    tags: previous.tags,
    gear,
    rod_setup_id: previous.rig_id,
    location_condition_id: previous.location_condition_id,
  };
}

// ---------------------------------------------------------------------------------
// Integrity (spec §40)
// ---------------------------------------------------------------------------------

export type ValidationError =
  | "quantity_below_one"
  | "negative_weight"
  | "negative_length"
  | "negative_depth"
  | "invalid_timestamp"
  | "confirmed_needs_outcome"
  | "dismissed_needs_reason"
  | "reason_without_dismissal"
  | "resolved_state_mismatch";

/**
 * The client-side half of the database's CHECK constraints. Duplicated on purpose: the
 * constraints are the truth (ADR 003 §3) and this is the fast, local, legible failure so
 * an angler learns at the glass instead of at flush time, six hours later.
 *
 * Returned as a list, not a throw: a form shows every problem at once.
 */
export function validateCatch(record: CatchRecord): readonly ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Number.isInteger(record.quantity) || record.quantity < 1) errors.push("quantity_below_one");
  if (record.weight_g !== null && record.weight_g < 0) errors.push("negative_weight");
  if (record.length_mm !== null && record.length_mm < 0) errors.push("negative_length");
  if (record.depth_fished_m !== null && record.depth_fished_m < 0) errors.push("negative_depth");
  if (Number.isNaN(Date.parse(record.caught_at))) errors.push("invalid_timestamp");

  if (record.resolution_state === "confirmed" && record.outcome === null) {
    errors.push("confirmed_needs_outcome");
  }
  if (record.resolution_state === "dismissed" && record.dismissed_reason === null) {
    errors.push("dismissed_needs_reason");
  }
  if (record.resolution_state !== "dismissed" && record.dismissed_reason !== null) {
    errors.push("reason_without_dismissal");
  }
  if ((record.resolution_state === "unresolved") !== (record.resolved_at === null)) {
    errors.push("resolved_state_mismatch");
  }

  return errors;
}

/**
 * D22: a resolved mark never returns to unresolved, and no job resolves one. Only a
 * human moves a mark. Mirrors `tg_catch_resolution_guard`.
 */
export function canTransitionResolution(
  from: CatchRecord["resolution_state"],
  to: CatchRecord["resolution_state"],
): boolean {
  if (from === to) return true;
  return to !== "unresolved";
}

// ---------------------------------------------------------------------------------
// Countability (D22 / spec §12)
// ---------------------------------------------------------------------------------

/**
 * Whether a row may appear in a rate. An unresolved mark is not yet a fact: it is
 * excluded from every denominator until a human says what it was, and a 2023 mark still
 * sitting unresolved in 2027 stays excluded. That is correct, not a bug.
 */
export function isCountable(record: CatchRecord): boolean {
  return (
    record.deleted_at === null &&
    record.resolution_state === "confirmed" &&
    record.outcome === "landed"
  );
}

/** Gear roles in the order a rig reads top to bottom, rod first. */
export const GEAR_ROLE_ORDER: readonly GearRole[] = [
  "rod",
  "reel",
  "main_line",
  "leader",
  "hook",
  "lure",
  "jig",
  "bait",
  "weight",
  "terminal",
];

export function sortGear(gear: readonly CatchGear[]): readonly CatchGear[] {
  return [...gear].sort(
    (a, b) => GEAR_ROLE_ORDER.indexOf(a.role) - GEAR_ROLE_ORDER.indexOf(b.role),
  );
}
