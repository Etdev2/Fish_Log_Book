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
 * **Geographic collections work after all** (founder request 2026-09-03), and for the reason
 * slams do (§48.1): the species list is the geography. A catch still carries no region, and
 * none is inferred — a Southern California collection is simply the species an angler meets
 * there, and filling it is evidence enough. The region-shaped hole §45.1 left was never
 * about collections; it was about claiming a *catch* happened in a region, which nothing
 * here does. Membership comes from `popularSpeciesIds`, the researched starter list the
 * species picker already uses, so there is one region vocabulary and not two.
 */

import { REGIONS, popularSpeciesIds, type RegionId } from "@/core/ontology/regions";
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
  type: "family" | "habitat" | "region";
  members: readonly Species[];
  /** Ids asserted by hand, kept for validation. Empty for derived families. */
  asserted?: readonly string[];
  /** Regional collections only — used to order them, never to qualify a catch. */
  regionId?: RegionId;
}

/*
 * Founder correction, 2026-09-03: the "sea basses" are not bass.
 *
 * White seabass is a croaker — *Atractoscion nobilis*, family Sciaenidae, and the biggest
 * one on this coast. Black sea bass is *Centropristis striata*, family Serranidae, which is
 * the grouper family. Giant sea bass moves with them for the same reason rather than being
 * left behind in a collection its own name argues against; it stays informational-only
 * wherever it sits, because it is protected.
 */
const BASS = [
  "kelp_bass", "barred_sand_bass", "spotted_sand_bass",
  "largemouth_bass", "smallmouth_bass", "striped_bass",
];
const GROUPER = [
  "black_sea_bass", "giant_sea_bass", "red_grouper", "black_grouper", "gag_grouper",
  "scamp", "warsaw_grouper", "speckled_hind", "goliath_grouper", "hapuu",
];
const MARLIN = ["blue_marlin", "black_marlin", "striped_marlin", "white_marlin"];
const PELAGIC = [
  "bluefin_tuna", "yellowfin_tuna", "bigeye_tuna", "skipjack_tuna", "false_albacore",
  "atlantic_bonito", "pacific_bonito", "dorado", "wahoo", "cobia",
  "blue_marlin", "black_marlin", "striped_marlin", "white_marlin", "sailfish", "swordfish",
  "king_mackerel", "spanish_mackerel", "sierra_mackerel", "yellowtail",
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
    description: "The croaker family — corbina, the drums, and the biggest of them all.",
    type: "family",
    // Derived members plus white seabass, which is a croaker however it is marketed.
    members: [...rollUpFamily("croaker"), ...namedFamily(["white_seabass"])],
    asserted: ["white_seabass"],
  },
  {
    id: "grouper",
    name: "Grouper and sea bass",
    description: "The Serranidae — groupers proper, and the sea basses that belong with them.",
    type: "family",
    members: namedFamily(GROUPER),
    asserted: GROUPER,
  },
  {
    id: "marlin",
    name: "Marlin",
    description: "Blue, black, striped and white. A day's run for one bite.",
    type: "family",
    members: namedFamily(MARLIN),
    asserted: MARLIN,
  },
  {
    id: "pelagic",
    name: "Pelagic",
    description: "Blue water: the tunas, billfish, dorado and wahoo that live away from the bottom.",
    type: "habitat",
    members: namedFamily(PELAGIC),
    asserted: PELAGIC,
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

/**
 * Regional collections (founder request 2026-09-03), generated from the region ontology.
 *
 * Two regions are deliberately excluded. `custom` leads with no species by design, and the
 * five `ca_gma_*` entries are Fish Legal's groundfish management areas — regulatory splits
 * of one coastline, not places with their own fish. A collection per management area would
 * be five near-identical lists and a wrong idea about what a region is.
 *
 * The lists run 8-12 species, which is the right size for something an angler can actually
 * finish. That is not a coincidence: they are the picker's "common here" chips, chosen to
 * be a welcome mat rather than a taxonomy.
 */
const REGIONAL_EXCLUDED = new Set<string>(["custom"]);

const REGIONAL: readonly Definition[] = REGIONS.filter(
  (region) => !REGIONAL_EXCLUDED.has(region.id) && !region.id.startsWith("ca_gma_"),
).map((region) => ({
  id: `region-${region.id.replace(/_/g, "-")}`,
  name: region.label,
  description: `The fish you meet around ${region.label}. ${region.hint}`,
  type: "region" as const,
  members: namedFamily(popularSpeciesIds(region.id as RegionId)),
  asserted: popularSpeciesIds(region.id as RegionId),
  regionId: region.id as RegionId,
}));

export const COLLECTIONS: readonly CollectionDefinition[] = [...DEFINITIONS, ...REGIONAL].filter(
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
    regionId: d.regionId ?? null,
    species: toEntries(d.members),
  }),
);

/**
 * An angler's own region first, then everything else — the same stance as slams. Region
 * orders the list; it never decides what counts.
 */
export function collectionsForRegion(regionId: string): readonly CollectionDefinition[] {
  const mine = COLLECTIONS.filter((c) => c.regionId === regionId);
  const families = COLLECTIONS.filter((c) => c.regionId === null);
  const otherRegions = COLLECTIONS.filter((c) => c.regionId !== null && c.regionId !== regionId);
  return [...mine, ...families, ...otherRegions];
}

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
