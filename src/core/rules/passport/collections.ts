/**
 * The Phase 1 collection definitions (passport spec §11, Ticket 2).
 *
 * Two rules shape this file.
 *
 * **Membership is data, computed from the ontology.** Spec §11 forbids hard-coding species
 * lists inside components; it does not ask for a second copy of the taxonomy. So the
 * roll-up families (rockfish, croaker, surfperch) are *derived* from `species.rollsUpTo`,
 * which the ontology already carries, and only the families the ontology cannot express —
 * bass, tuna, flatfish, and the rest — are named by id. Those named ids are validated
 * against the ontology by `validateCollections`, which the test runs: a typo or a species
 * deleted from the vocabulary fails the build rather than producing a slot nobody can fill.
 *
 * **Nobody is ever asked to catch a fish they may not take.** `informationalOnly` is not
 * hand-maintained — it is derived from `takeStatus === "protected"`. A protected fish still
 * appears in its family so an angler learns it exists, and it is excluded from the
 * denominator, so every collection here can be finished legally (spec §11, §4.5).
 *
 * Geographic collections are absent on purpose. Spec §45.1 cut them from Phase 1: there is
 * no region on a catch and no region geometry to derive one from.
 */

import { SPECIES, speciesById, type Species } from "@/core/ontology/species";

import type { CollectionDefinition, CollectionSpecies } from "./types";

/** Bumped when a definition's membership changes. Progress readings record it. */
export const COLLECTION_RULE_VERSION = 1;

/** Group entries ("Rockfish") are history, never a collection slot — spec §10. */
export const GROUP_SPECIES_IDS: ReadonlySet<string> = new Set(
  SPECIES.filter((s) => s.isGroup).map((s) => s.id),
);

const eligible = (s: Species): boolean => !s.isGroup;

function toEntries(species: readonly Species[]): readonly CollectionSpecies[] {
  return species
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : 1))
    .map((s, i) => ({
      speciesId: s.id,
      // Derived, never hand-set: a protected fish is shown but never required.
      required: s.takeStatus !== "protected",
      informationalOnly: s.takeStatus === "protected",
      sortOrder: i,
    }));
}

/** Everything that rolls up to a group id — the ontology's own family relationship. */
function rollUpFamily(groupId: string): readonly Species[] {
  return SPECIES.filter((s) => eligible(s) && s.rollsUpTo === groupId);
}

/** A family the ontology cannot express, named by id and validated against it. */
function namedFamily(ids: readonly string[]): readonly Species[] {
  return ids
    .map((id) => speciesById(id))
    .filter((s): s is Species => s !== null && eligible(s));
}

interface Definition {
  id: string;
  name: string;
  description: string;
  type: "family" | "habitat";
  members: readonly Species[];
  /** Ids asserted by hand, kept for validation. Empty for derived families. */
  asserted?: readonly string[];
}

const BASS = [
  "kelp_bass", "barred_sand_bass", "spotted_sand_bass", "largemouth_bass",
  "smallmouth_bass", "striped_bass", "black_sea_bass", "white_seabass", "giant_sea_bass",
];
const TUNA = ["bluefin_tuna", "yellowfin_tuna", "bigeye_tuna", "skipjack_tuna"];
const SALMON_TROUT = [
  "chinook_salmon", "coho_salmon", "pink_salmon", "chum_salmon", "sockeye_salmon",
  "steelhead", "lake_trout", "brown_trout", "dolly_varden",
];
const SHARKS_RAYS = [
  "leopard_shark", "horn_shark", "thresher_shark", "spiny_dogfish", "sixgill_shark",
  "bat_ray", "round_stingray", "shovelnose_guitarfish",
];
const FLATFISH = [
  "california_halibut", "pacific_halibut", "atlantic_halibut", "pacific_sanddab",
  "summer_flounder", "southern_flounder", "winter_flounder", "yellowtail_flounder",
  "american_plaice", "witch_flounder", "windowpane_flounder",
];

const DEFINITIONS: readonly Definition[] = [
  {
    id: "bass",
    name: "Bass",
    description: "The bass an angler meets across salt and fresh water.",
    type: "family",
    members: namedFamily(BASS),
    asserted: BASS,
  },
  {
    id: "rockfish",
    name: "Rockfish",
    description: "The rockfish complex, one species at a time.",
    type: "family",
    members: rollUpFamily("rockfish"),
  },
  {
    id: "tuna",
    name: "Tuna",
    description: "The tunas, for the days the water goes blue.",
    type: "family",
    members: namedFamily(TUNA),
    asserted: TUNA,
  },
  {
    id: "salmon-and-trout",
    name: "Salmon and trout",
    description: "Salmon, steelhead, and the larger trout.",
    type: "family",
    members: namedFamily(SALMON_TROUT),
    asserted: SALMON_TROUT,
  },
  {
    id: "flatfish",
    name: "Flatfish",
    description: "Halibut, flounder, sanddab, and the rest of the flat ones.",
    type: "family",
    members: namedFamily(FLATFISH),
    asserted: FLATFISH,
  },
  {
    id: "sharks-and-rays",
    name: "Sharks and rays",
    description: "Sharks, rays, and skates.",
    type: "family",
    members: namedFamily(SHARKS_RAYS),
    asserted: SHARKS_RAYS,
  },
  {
    id: "croaker",
    name: "Croaker",
    description: "The croaker family, corbina included.",
    type: "family",
    members: rollUpFamily("croaker"),
  },
  {
    id: "surfperch",
    name: "Surfperch",
    description: "The surfperch, for anglers who fish the sand.",
    type: "family",
    members: rollUpFamily("surfperch"),
  },
  {
    id: "freshwater",
    name: "Freshwater",
    description: "Everything the lakes and rivers hold.",
    type: "habitat",
    members: SPECIES.filter((s) => eligible(s) && s.waterClass === "fresh"),
  },
];

export const COLLECTIONS: readonly CollectionDefinition[] = DEFINITIONS.filter(
  // A one-species collection is not a collection.
  (d) => d.members.length > 1,
).map(
  (d): CollectionDefinition => ({
    id: d.id,
    slug: d.id,
    name: d.name,
    description: d.description,
    collectionType: d.type,
    version: COLLECTION_RULE_VERSION,
    active: true,
    species: toEntries(d.members),
  }),
);

export function collectionById(id: string): CollectionDefinition | null {
  return COLLECTIONS.find((c) => c.id === id) ?? null;
}

/** Every species that appears in any collection, for the grid's family filter. */
export function collectionsForSpecies(speciesId: string): readonly CollectionDefinition[] {
  return COLLECTIONS.filter((c) => c.species.some((s) => s.speciesId === speciesId));
}

/**
 * Ticket 2's validation. Run by the test, not at import time — a definition problem should
 * fail a build with a readable list, not blank the app on a boat.
 */
export function validateCollections(): readonly string[] {
  const problems: string[] = [];

  for (const definition of DEFINITIONS) {
    for (const id of definition.asserted ?? []) {
      const species = speciesById(id);
      if (species === null) {
        problems.push(`${definition.id}: "${id}" is not in the species ontology`);
      } else if (species.isGroup) {
        problems.push(`${definition.id}: "${id}" is a group entry and cannot fill a slot`);
      }
    }
  }

  for (const collection of COLLECTIONS) {
    const seen = new Set<string>();
    for (const entry of collection.species) {
      if (seen.has(entry.speciesId)) {
        problems.push(`${collection.id}: "${entry.speciesId}" appears twice`);
      }
      seen.add(entry.speciesId);
    }
    if (!collection.species.some((s) => s.required)) {
      problems.push(`${collection.id}: nothing is required, so it can never be completed`);
    }
  }

  const ids = COLLECTIONS.map((c) => c.id);
  for (const id of ids) {
    if (ids.indexOf(id) !== ids.lastIndexOf(id)) problems.push(`duplicate collection id "${id}"`);
  }

  return problems;
}
