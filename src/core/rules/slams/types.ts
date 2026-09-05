/**
 * Slams — several species, one day (founder request 2026-09-03).
 *
 * A slam is not a collection. A collection is a lifetime set an angler fills in over
 * years; a slam is a *day*. Catch a yellowtail, a white seabass and a halibut across three
 * seasons and you have three good days. Catch them between sunrise and sunset and you have
 * the Island Trifecta. The whole feature is that one constraint.
 *
 * The shape is a pool, not a checklist, because that is how the real ones are written. The
 * IGFA Inshore Grand Slam is *any three* of bonefish, permit, snook and tarpon — not four
 * fixed slots. So a slam is a set of categories plus how many distinct ones a day must
 * produce, which expresses both "these exact three fish" (three categories, need three)
 * and "any three of these four" (four categories, need three) without a second model.
 */

import type { RegionId } from "@/core/ontology/regions";

/**
 * One qualifying slot. A category can be a single species (white seabass) or a whole
 * group ("any tuna", "any billfish") — the offshore slams are written in groups, and an
 * angler who lands two different tunas has filled the tuna slot once, not twice.
 */
export interface SlamCategory {
  readonly id: string;
  readonly label: string;
  readonly speciesIds: readonly string[];
}

export type SlamTier = "trifecta" | "grand-slam" | "super-grand-slam";

export interface SlamDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tier: SlamTier;
  readonly categories: readonly SlamCategory[];
  /** Distinct categories a single local day must produce. */
  readonly requiredCategories: number;
  /**
   * Where this slam is *shown*, never where it counts.
   *
   * Qualification is decided by the fish alone, which is what lets slams exist while
   * spec §45.1 keeps region off the catch record: nobody catches a tarpon in Orange County
   * or a white seabass off Montauk, so the species list is the geography. Region only
   * decides which slams surface first for an angler who has told Settings where they fish
   * — the "picker of defaults, never a filter" stance of ADR 007 §4.
   */
  readonly regions: readonly RegionId[];
  /** Where the rule comes from. Invented slams and real ones must be tellable apart. */
  readonly source: string;
  readonly version: number;
}

/** A day on which a slam was completed. */
export interface SlamDay {
  readonly localDate: string;
  readonly categoryIds: readonly string[];
  readonly catchIds: readonly string[];
}

export interface SlamStanding {
  readonly slamId: string;
  readonly achieved: boolean;
  /** Every day it was done, most recent first. Doing it twice is worth seeing. */
  readonly days: readonly SlamDay[];
  /**
   * The closest an angler has come without finishing, for the day that got furthest.
   * Null once achieved — at that point the near misses are no longer the story.
   */
  readonly closest: { readonly localDate: string; readonly have: number } | null;
  readonly required: number;
}
