/**
 * The passport projection (spec §10, §37).
 *
 * Pure by law (ADR 003): no React, no browser, no database client. Everything is a
 * function of the catches handed in, which is what makes recalculation after an edit,
 * a delete, or a sync merge free — there is no stored progress to migrate, so it cannot
 * be wrong. It is also what lets the same rules be checked against the Swift client
 * later, from the vectors beside this file.
 */

import { isCountable } from "../catch/rules";
import type { CatchRecord } from "../catch/types";
import type {
  CollectionDefinition,
  CollectionProgress,
  PassportTotals,
  PersonalBest,
  SpeciesSummary,
} from "./types";

/**
 * Does this catch count toward the passport (spec §10)?
 *
 * `isCountable` already carries three quarters of the rule and is already tested: not
 * deleted, resolution confirmed, outcome landed. Reusing it is what keeps Quick Mark
 * honest — an unresolved quick mark is not yet a fish, so resolving one later credits
 * the species exactly once, on the record that already existed. That is spec §10's
 * "must not create double credit", enforced by construction rather than by a guard.
 *
 * The passport adds one condition of its own: the fish must be a species we recognise.
 * `species_other` free text is deliberately not enough (spec §5 keeps it a separate
 * column precisely so it can never be mistaken for an id), and an id we have never heard
 * of would produce a collection entry pointing at nothing.
 */
export function countsTowardPassport(
  record: CatchRecord,
  knownSpeciesIds: ReadonlySet<string>,
): boolean {
  return (
    isCountable(record) && record.species_id !== null && knownSpeciesIds.has(record.species_id)
  );
}

/** Milliseconds, for ordering. Unparseable timestamps sort last rather than throwing. */
const instant = (iso: string): number => {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
};

/**
 * Earlier wins; ties break on id. Ids are UUIDv7 and therefore time-ordered, so this is
 * both stable and meaningful — two fish logged in the same second keep the order they
 * were logged in.
 */
const earlier = (a: CatchRecord, b: CatchRecord): boolean => {
  const delta = instant(a.caught_at) - instant(b.caught_at);
  return delta === 0 ? a.id < b.id : delta < 0;
};

/** A bigger measurement wins; an equal one keeps the fish that got there first. */
function betterBest(
  current: PersonalBest | null,
  record: CatchRecord,
  value: number | null,
): PersonalBest | null {
  if (value === null) return current;
  if (current !== null && current.value >= value) return current;
  return {
    catchId: record.id,
    value,
    estimated: record.size_estimated,
    caughtAt: record.caught_at,
  };
}

/**
 * Summarise every species the angler has actually caught, one entry per species.
 *
 * Sorted by species id so the output is deterministic — the vectors depend on it, and so
 * does any diff a reviewer reads. Callers sort for display.
 *
 * Group entries (`rockfish` rather than `vermilion_rockfish`) are summarised like any
 * other species: spec §10 says they belong in history. What they do *not* do is satisfy a
 * collection, and that rule lives in `collectionProgress` below, not here.
 */
export function speciesSummaries(
  catches: readonly CatchRecord[],
  knownSpeciesIds: ReadonlySet<string>,
): readonly SpeciesSummary[] {
  const drafts = new Map<
    string,
    {
      speciesId: string;
      catchCount: number;
      fishCount: number;
      keptCount: number;
      releasedCount: number;
      first: CatchRecord;
      latest: CatchRecord;
      bestLength: PersonalBest | null;
      bestWeight: PersonalBest | null;
    }
  >();

  for (const record of catches) {
    if (!countsTowardPassport(record, knownSpeciesIds)) continue;
    const speciesId = record.species_id as string;
    const draft = drafts.get(speciesId);

    if (draft === undefined) {
      drafts.set(speciesId, {
        speciesId,
        catchCount: 1,
        fishCount: record.quantity,
        keptCount: record.disposition === "kept" ? 1 : 0,
        releasedCount: record.disposition === "released" ? 1 : 0,
        first: record,
        latest: record,
        bestLength: betterBest(null, record, record.length_mm),
        bestWeight: betterBest(null, record, record.weight_g),
      });
      continue;
    }

    draft.catchCount += 1;
    draft.fishCount += record.quantity;
    if (record.disposition === "kept") draft.keptCount += 1;
    if (record.disposition === "released") draft.releasedCount += 1;
    if (earlier(record, draft.first)) draft.first = record;
    if (earlier(draft.latest, record)) draft.latest = record;
    draft.bestLength = betterBest(draft.bestLength, record, record.length_mm);
    draft.bestWeight = betterBest(draft.bestWeight, record, record.weight_g);
  }

  return [...drafts.values()]
    .sort((a, b) => (a.speciesId < b.speciesId ? -1 : a.speciesId > b.speciesId ? 1 : 0))
    .map(
      (draft): SpeciesSummary => ({
        speciesId: draft.speciesId,
        catchCount: draft.catchCount,
        fishCount: draft.fishCount,
        keptCount: draft.keptCount,
        releasedCount: draft.releasedCount,
        firstCatchId: draft.first.id,
        firstCaughtAt: draft.first.caught_at,
        latestCatchId: draft.latest.id,
        latestCaughtAt: draft.latest.caught_at,
        bestLength: draft.bestLength,
        bestWeight: draft.bestWeight,
      }),
    );
}

/** The overview numbers (spec §8.2), computed from the summaries so they cannot disagree. */
export function passportTotals(summaries: readonly SpeciesSummary[]): PassportTotals {
  let totalCatches = 0;
  let totalFish = 0;
  let keptCount = 0;
  let releasedCount = 0;
  let latestNewSpecies: PassportTotals["latestNewSpecies"] = null;

  for (const summary of summaries) {
    totalCatches += summary.catchCount;
    totalFish += summary.fishCount;
    keptCount += summary.keptCount;
    releasedCount += summary.releasedCount;

    // "Newest species" is the most recent *first* catch, not the most recent catch.
    const at = instant(summary.firstCaughtAt);
    if (latestNewSpecies === null || at > instant(latestNewSpecies.caughtAt)) {
      latestNewSpecies = { speciesId: summary.speciesId, caughtAt: summary.firstCaughtAt };
    }
  }

  return {
    uniqueSpecies: summaries.length,
    totalCatches,
    totalFish,
    keptCount,
    releasedCount,
    latestNewSpecies,
  };
}

/**
 * Progress against one collection (spec §11).
 *
 * Two rules earn their place here. Informational-only species — the protected and
 * prohibited ones — are counted separately and never enter the denominator, so a
 * collection can always be finished legally. And a *group* entry never satisfies a
 * collection slot: catching "rockfish" is a real catch and shows in history, but the
 * vermilion slot stays open until the angler says which rockfish it was (spec §10).
 * The caller supplies `groupSpeciesIds`; the rule is not the ontology's to enforce.
 */
export function collectionProgress(
  definition: CollectionDefinition,
  caughtSpeciesIds: ReadonlySet<string>,
  groupSpeciesIds: ReadonlySet<string>,
): CollectionProgress {
  let caught = 0;
  let required = 0;
  let informationalCaught = 0;

  for (const entry of definition.species) {
    const has = caughtSpeciesIds.has(entry.speciesId) && !groupSpeciesIds.has(entry.speciesId);
    if (entry.informationalOnly) {
      if (has) informationalCaught += 1;
      continue;
    }
    if (entry.required) required += 1;
    if (has && entry.required) caught += 1;
  }

  return {
    collectionId: definition.id,
    caught,
    required,
    informationalCaught,
    complete: required > 0 && caught === required,
  };
}
