/**
 * Badge evaluation (passport spec §13).
 *
 * Deterministic and idempotent by construction: this is a pure function of the records
 * handed in, with no stored progress to reconcile. Running it twice cannot award twice,
 * an edit or a delete recalculates rather than patches, and a sync merge is just another
 * evaluation over the merged set — which is spec §13's whole list of requirements met by
 * not keeping state rather than by defending it.
 *
 * The client may run this offline for immediate feedback; the server runs the same rules
 * over the reconciled log and its answer wins (spec §13, §31).
 */

import { isCountable } from "../catch/rules";
import type { CatchRecord, TripRecord } from "../catch/types";
import type { BadgeDefinition, BadgeStanding } from "./types";

export interface EvaluationInput {
  readonly catches: readonly CatchRecord[];
  readonly trips: readonly TripRecord[];
  readonly knownSpeciesIds: ReadonlySet<string>;
  /**
   * Water class per species id. Absent ids simply never match, which is the safe
   * direction: a species we cannot classify does not silently credit either explorer.
   *
   * The SQL vocabulary allows a third value, `both`, that the TypeScript ontology does not
   * yet express. If it ever lands, spec §47.3 resolves it from `trip.water_class` — the
   * water the angler was actually in — rather than from the species.
   */
  readonly waterClassOf: (speciesId: string) => "salt" | "fresh" | null;
}

/** Chronological, ties broken on id. UUIDv7 ids are time-ordered, so this is stable. */
function chronological<T extends { id: string }>(records: readonly T[], at: (r: T) => string): T[] {
  return [...records].sort((a, b) => {
    const delta = Date.parse(at(a)) - Date.parse(at(b));
    if (Number.isNaN(delta)) return a.id < b.id ? -1 : 1;
    return delta === 0 ? (a.id < b.id ? -1 : 1) : delta;
  });
}

/**
 * A trip that counts (the §46 blank-trip rule).
 *
 * Not deleted, and ended — the angler closed it out rather than leaving it open on the
 * dashboard. Whether it produced a fish is deliberately not asked.
 */
function tripCounts(trip: TripRecord): boolean {
  return trip.deleted_at === null && trip.ended_at !== null;
}

/**
 * The ordered list of record ids that qualify for one badge, and the timestamp of each.
 * Every rule shape reduces to this, which is why five shapes cover the whole catalog.
 */
function qualifiers(
  definition: BadgeDefinition,
  input: EvaluationInput,
): readonly { id: string; at: string }[] {
  const { catches, trips, knownSpeciesIds, waterClassOf } = input;

  if (definition.ruleType === "trip_count") {
    return chronological(trips.filter(tripCounts), (t) => t.started_at).map((t) => ({
      id: t.id,
      at: t.ended_at ?? t.started_at,
    }));
  }

  const valid = chronological(catches.filter(isCountable), (c) => c.caught_at);

  if (definition.ruleType === "catch_count") {
    return valid.map((c) => ({ id: c.id, at: c.caught_at }));
  }

  if (definition.ruleType === "released_count") {
    return valid
      .filter((c) => c.disposition === "released")
      .map((c) => ({ id: c.id, at: c.caught_at }));
  }

  // The two unique-species shapes: the *first* catch of each species is the qualifier, so
  // the award lands on the day the angler actually met that fish.
  const seen = new Set<string>();
  const firsts: { id: string; at: string }[] = [];
  for (const record of valid) {
    const speciesId = record.species_id;
    if (speciesId === null || !knownSpeciesIds.has(speciesId) || seen.has(speciesId)) continue;
    if (
      definition.ruleType === "unique_species_in_water" &&
      waterClassOf(speciesId) !== definition.ruleConfig.waterClass
    ) {
      continue;
    }
    seen.add(speciesId);
    firsts.push({ id: record.id, at: record.caught_at });
  }
  return firsts;
}

/** One badge's standing. */
export function evaluateBadge(
  definition: BadgeDefinition,
  input: EvaluationInput,
): BadgeStanding {
  const matched = qualifiers(definition, input);
  const { threshold } = definition.ruleConfig;
  const earned = matched.length >= threshold;

  return {
    badgeId: definition.id,
    ruleVersion: definition.ruleVersion,
    earned,
    current: matched.length,
    threshold,
    // The record that crossed the line, not the moment the evaluation ran.
    awardedAt: earned ? matched[threshold - 1].at : null,
    qualifyingSourceIds: matched.slice(0, threshold).map((m) => m.id),
  };
}

/** Every active badge's standing, in catalog order. */
export function evaluateBadges(
  definitions: readonly BadgeDefinition[],
  input: EvaluationInput,
): readonly BadgeStanding[] {
  return definitions.filter((d) => d.active).map((d) => evaluateBadge(d, input));
}

/**
 * Badges earned by the second reading that were not earned by the first — the post-catch
 * celebration's input (spec §14).
 *
 * Returned in catalog order and deliberately as a list: §14 says queue multiple unlocks
 * into one summary rather than stacking modals on someone who is trying to log the next
 * fish.
 */
export function newlyEarned(
  before: readonly BadgeStanding[],
  after: readonly BadgeStanding[],
): readonly BadgeStanding[] {
  const had = new Set(before.filter((s) => s.earned).map((s) => s.badgeId));
  return after.filter((s) => s.earned && !had.has(s.badgeId));
}
