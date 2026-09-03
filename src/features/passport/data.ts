"use client";

import { useMemo } from "react";

import { BADGES } from "@/core/rules/achievements/catalog";
import { evaluateBadges } from "@/core/rules/achievements/evaluate";
import type { BadgeStanding } from "@/core/rules/achievements/types";
import { COLLECTIONS, GROUP_SPECIES_IDS } from "@/core/rules/passport/collections";
import {
  collectionProgress,
  passportTotals,
  speciesSummaries,
} from "@/core/rules/passport/selectors";
import type {
  CollectionDefinition,
  CollectionProgress,
  PassportTotals,
  SpeciesSummary,
} from "@/core/rules/passport/types";
import { SPECIES, speciesById } from "@/core/ontology/species";
import { useLog } from "@/features/catches/store";

/**
 * The passport's application layer: the one place the pure rules meet the local log.
 *
 * Reading `features/catches/store` across a feature boundary follows the precedent set by
 * the tide screen — the log store is the app's single source of catches, not an internal
 * of the catch UI, and a second copy of it would be the actual ADR 005 §3 violation.
 *
 * Everything below is derived on the client from records already in IndexedDB, which is
 * why the passport works in airplane mode (spec §4.6, §37): there is nothing to fetch.
 */

const KNOWN_SPECIES_IDS: ReadonlySet<string> = new Set(SPECIES.map((s) => s.id));

const waterClassOf = (speciesId: string): "salt" | "fresh" | null =>
  speciesById(speciesId)?.waterClass ?? null;

export interface CollectionStanding {
  readonly definition: CollectionDefinition;
  readonly progress: CollectionProgress;
}

/** A goal an angler is close to finishing — a collection or a badge (spec §8.2). */
export interface Goal {
  readonly kind: "collection" | "badge";
  readonly id: string;
  readonly name: string;
  readonly current: number;
  readonly target: number;
  readonly href: string;
}

export interface PassportView {
  readonly hydrated: boolean;
  readonly summaries: readonly SpeciesSummary[];
  readonly summaryOf: (speciesId: string) => SpeciesSummary | null;
  readonly caughtSpeciesIds: ReadonlySet<string>;
  readonly totals: PassportTotals;
  readonly collections: readonly CollectionStanding[];
  readonly badges: readonly BadgeStanding[];
  /** The three nearest to done, furthest along first. Never includes finished ones. */
  readonly nearestGoals: readonly Goal[];
}

export function usePassport(): PassportView {
  const log = useLog();

  return useMemo(() => {
    const summaries = speciesSummaries(log.catches, KNOWN_SPECIES_IDS);
    const byId = new Map(summaries.map((s) => [s.speciesId, s]));
    const caughtSpeciesIds = new Set(byId.keys());

    const collections = COLLECTIONS.map((definition) => ({
      definition,
      progress: collectionProgress(definition, caughtSpeciesIds, GROUP_SPECIES_IDS),
    }));

    const badges = evaluateBadges(BADGES, {
      catches: log.catches,
      trips: log.trips,
      knownSpeciesIds: KNOWN_SPECIES_IDS,
      waterClassOf,
    });

    const goals: Goal[] = [
      ...collections
        .filter((c) => !c.progress.complete && c.progress.required > 0)
        .map((c) => ({
          kind: "collection" as const,
          id: c.definition.id,
          name: c.definition.name,
          current: c.progress.caught,
          target: c.progress.required,
          href: `/passport/collections/${c.definition.id}`,
        })),
      ...badges
        .filter((b) => !b.earned)
        .map((b) => ({
          kind: "badge" as const,
          id: b.badgeId,
          name: BADGES.find((d) => d.id === b.badgeId)?.name ?? b.badgeId,
          current: b.current,
          target: b.threshold,
          href: "/passport/badges",
        })),
    ];

    // Nearest to done first. A goal not yet started sorts last rather than first — the
    // point of the card is "you are close", not "here are nine things you have not done".
    const nearestGoals = goals
      .filter((g) => g.current > 0)
      .sort((a, b) => b.current / b.target - a.current / a.target)
      .slice(0, 3);

    return {
      hydrated: log.hydrated,
      summaries,
      summaryOf: (speciesId: string) => byId.get(speciesId) ?? null,
      caughtSpeciesIds,
      totals: passportTotals(summaries),
      collections,
      badges,
      nearestGoals,
    };
  }, [log.catches, log.trips, log.hydrated]);
}
