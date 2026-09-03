/**
 * The Phase 1 badge catalog (passport spec §12, as trimmed by §47.3).
 *
 * Seven of the founder's ten ship here. The three that do not are not oversights:
 *
 * - **New Waters I** needs a fishing region on a catch. There is none, and no geometry to
 *   derive one from — §45.1 cut it from Phase 1.
 * - **Photo Journal I** was cut on cost with the media table (§45.2).
 * - **Night Bite** needs a sunrise/sunset library that is not yet a dependency (§47.3).
 *   `src/core/rules/astro/` can already do the arithmetic; wiring it is a later slice.
 *
 * The eighth badge here is not the founder's — **Days on the Water** is the blank-trip
 * rule from §46, added so an honest fishless day is worth recording.
 *
 * No streak badges, ever (spec §12): weather decides whether an angler fishes this week,
 * and a mechanic that punishes a blown-out weekend is a mechanic that teaches people to
 * stop logging.
 */

import type { BadgeDefinition } from "./types";

export const BADGE_RULE_VERSION = 1;

const badge = (
  definition: Omit<BadgeDefinition, "slug" | "ruleVersion" | "active">,
): BadgeDefinition => ({
  ...definition,
  slug: definition.id,
  ruleVersion: BADGE_RULE_VERSION,
  active: true,
});

export const BADGES: readonly BadgeDefinition[] = [
  badge({
    id: "first-catch",
    name: "First catch",
    description: "Log your first fish.",
    category: "milestone",
    tier: 1,
    ruleType: "catch_count",
    ruleConfig: { threshold: 1 },
    iconKey: "hook",
  }),
  badge({
    id: "species-explorer-i",
    name: "Species Explorer I",
    description: "Catch 5 different species.",
    category: "exploration",
    tier: 1,
    ruleType: "unique_species",
    ruleConfig: { threshold: 5 },
    iconKey: "compass",
  }),
  badge({
    id: "species-explorer-ii",
    name: "Species Explorer II",
    description: "Catch 10 different species.",
    category: "exploration",
    tier: 2,
    ruleType: "unique_species",
    ruleConfig: { threshold: 10 },
    iconKey: "compass",
  }),
  badge({
    id: "species-explorer-iii",
    name: "Species Explorer III",
    description: "Catch 25 different species.",
    category: "exploration",
    tier: 3,
    ruleType: "unique_species",
    ruleConfig: { threshold: 25 },
    iconKey: "compass",
  }),
  badge({
    id: "freshwater-explorer",
    name: "Freshwater Explorer",
    description: "Catch 5 different freshwater species.",
    category: "exploration",
    tier: 1,
    ruleType: "unique_species_in_water",
    ruleConfig: { threshold: 5, waterClass: "fresh" },
    iconKey: "river",
  }),
  badge({
    id: "saltwater-explorer",
    name: "Saltwater Explorer",
    description: "Catch 10 different saltwater species.",
    category: "exploration",
    tier: 1,
    ruleType: "unique_species_in_water",
    ruleConfig: { threshold: 10, waterClass: "salt" },
    iconKey: "wave",
  }),
  badge({
    id: "responsible-release-i",
    name: "Responsible Release I",
    description: "Release 10 fish.",
    category: "stewardship",
    tier: 1,
    ruleType: "released_count",
    ruleConfig: { threshold: 10 },
    iconKey: "release",
  }),
  badge({
    id: "days-on-the-water-i",
    name: "Days on the Water I",
    description: "Finish 5 trips. Blank days count — they are still fishing.",
    category: "stewardship",
    tier: 1,
    ruleType: "trip_count",
    ruleConfig: { threshold: 5 },
    iconKey: "boat",
  }),
];

export function badgeById(id: string): BadgeDefinition | null {
  return BADGES.find((b) => b.id === id) ?? null;
}
