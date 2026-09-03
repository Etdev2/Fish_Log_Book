/**
 * Slam evaluation: group the log by day, ask what each day produced.
 *
 * Pure, like every other rule here — a function of the catches handed in, so an edit or a
 * delete recalculates and re-running cannot award twice.
 *
 * "One day" is `catch.local_date`, which the catch already stores, computed in the
 * catch's own timezone at log time. That is the right clock: a trip that runs past
 * midnight splits, which is what "in one day" means to a tournament and to an angler, and
 * flying between timezones cannot retroactively merge two days into a slam.
 */

import { isCountable } from "../catch/rules";
import type { CatchRecord } from "../catch/types";
import type { SlamDefinition, SlamDay, SlamStanding } from "./types";

/** speciesId → the categories it can fill, for one definition. */
function categoryIndex(definition: SlamDefinition): ReadonlyMap<string, string> {
  const index = new Map<string, string>();
  for (const category of definition.categories) {
    for (const speciesId of category.speciesIds) {
      // First category wins if a species is listed twice; `validateSlams` rejects that
      // case outright so it cannot happen in shipped data.
      if (!index.has(speciesId)) index.set(speciesId, category.id);
    }
  }
  return index;
}

export function evaluateSlam(
  definition: SlamDefinition,
  catches: readonly CatchRecord[],
): SlamStanding {
  const index = categoryIndex(definition);

  // day → category → the catch that filled it first
  const byDay = new Map<string, Map<string, string>>();

  for (const record of catches) {
    if (!isCountable(record)) continue;
    if (record.species_id === null) continue;

    const categoryId = index.get(record.species_id);
    if (categoryId === undefined) continue;

    const day = byDay.get(record.local_date) ?? new Map<string, string>();
    if (!day.has(categoryId)) day.set(categoryId, record.id);
    byDay.set(record.local_date, day);
  }

  const days: SlamDay[] = [];
  let closest: SlamStanding["closest"] = null;

  for (const [localDate, filled] of byDay) {
    if (filled.size >= definition.requiredCategories) {
      days.push({
        localDate,
        // Sorted so the same day always reads the same way, here and in a second client.
        categoryIds: [...filled.keys()].sort(),
        catchIds: [...filled.values()].sort(),
      });
      continue;
    }
    if (closest === null || filled.size > closest.have) {
      closest = { localDate, have: filled.size };
    }
  }

  days.sort((a, b) => (a.localDate < b.localDate ? 1 : a.localDate > b.localDate ? -1 : 0));

  return {
    slamId: definition.id,
    achieved: days.length > 0,
    days,
    closest: days.length > 0 ? null : closest,
    required: definition.requiredCategories,
  };
}

export function evaluateSlams(
  definitions: readonly SlamDefinition[],
  catches: readonly CatchRecord[],
): readonly SlamStanding[] {
  return definitions.map((definition) => evaluateSlam(definition, catches));
}
