/**
 * Fishing regions — the picker-of-defaults, never a filter (ADR 007 §4,
 * founder requirements 2026-09-01).
 *
 * The design principle is the founder's own: no region is part of the data model. A
 * catch records species, time, GPS, and conditions; the region only decides which
 * species chips surface first before the angler has history. Every species stays
 * searchable in every region, and "Common" stops mattering the moment Recent exists.
 *
 * The lists below are honest starter sets, researched against public fishery sources
 * (state DFW target lists, FWC, Hawaii DLNR-adjacent sportfishing references), and kept
 * deliberately short — a curated welcome mat, not a taxonomy. `needs_review` on the
 * vocabulary rows carries the "check me" flag forward.
 */

import { speciesById, SPECIES, type Species } from "./species";

export type RegionId =
  | "southern_california"
  | "northern_california"
  | "florida"
  | "hawaii"
  | "cabo_baja"
  | "gulf_coast"
  | "northeast"
  | "great_lakes"
  /** California inland waters (CDFW statewide defaults; named waters override). */
  | "california_freshwater"
  /** Angler-defined home water: nothing is pre-judged, Recent builds the picture. */
  | "custom";

export interface Region {
  readonly id: RegionId;
  readonly label: string;
  /** One honest line for the settings card. */
  readonly hint: string;
}

export const REGIONS: readonly Region[] = [
  { id: "southern_california", label: "Southern California", hint: "Kelp bed, reef and offshore staples." },
  { id: "northern_california", label: "Northern California", hint: "Salmon, stripers, halibut, rockfish." },
  { id: "florida", label: "Florida", hint: "Snook, redfish, tarpon, reef and bluewater." },
  { id: "hawaii", label: "Hawaii", hint: "Ahi, ono, mahi, ulua, marlin." },
  { id: "cabo_baja", label: "Cabo / Baja", hint: "Marlin, dorado, tuna, roosterfish." },
  { id: "gulf_coast", label: "Gulf Coast", hint: "Redfish, specks, snapper, cobia." },
  { id: "northeast", label: "Northeast", hint: "Stripers, blues, fluke, tog, cod." },
  { id: "great_lakes", label: "Great Lakes", hint: "Walleye, salmon and trout, perch, bass." },
  { id: "california_freshwater", label: "California — Freshwater", hint: "Lakes, rivers, Delta: bass, trout, striper, sturgeon." },
  { id: "custom", label: "Custom / anywhere else", hint: "No regional suggestions — search finds everything." },
];

const BY_REGION: Record<RegionId, readonly string[]> = {
  southern_california: [
    "kelp_bass",
    "barred_sand_bass",
    "california_halibut",
    "barred_surfperch",
    "spotfin_croaker",
    "rockfish",
    "lingcod",
    "california_sheephead",
    "yellowtail",
    "white_seabass",
    "pacific_bonito",
    "bluefin_tuna",
  ],
  california_freshwater: [
    "largemouth_bass",
    "smallmouth_bass",
    "trout",
    "striped_bass",
    "catfish",
    "white_sturgeon",
    "steelhead",
  ],
  northern_california: [
    "striped_bass",
    "chinook_salmon",
    "pacific_halibut",
    "lingcod",
    "rockfish",
    "california_halibut",
    "leopard_shark",
    "white_sturgeon",
    "coho_salmon",
  ],
  florida: [
    "common_snook",
    "red_drum",
    "spotted_seatrout",
    "atlantic_tarpon",
    "gray_snapper",
    "sheepshead",
    "red_snapper",
    "gag_grouper",
    "king_mackerel",
    "cobia",
    "permit",
    "atlantic_bonefish",
  ],
  hawaii: [
    "yellowfin_tuna",
    "skipjack_tuna",
    "wahoo",
    "dorado",
    "blue_marlin",
    "striped_marlin",
    "giant_trevally",
    "bluefin_trevally",
    "green_jobfish",
  ],
  cabo_baja: [
    "striped_marlin",
    "blue_marlin",
    "dorado",
    "yellowfin_tuna",
    "wahoo",
    "yellowtail",
    "roosterfish",
    "sierra_mackerel",
  ],
  gulf_coast: [
    "red_drum",
    "spotted_seatrout",
    "southern_flounder",
    "red_snapper",
    "atlantic_tarpon",
    "sheepshead",
    "cobia",
    "king_mackerel",
    "spanish_mackerel",
    "greater_amberjack",
  ],
  northeast: [
    "striped_bass",
    "bluefish",
    "summer_flounder",
    "black_sea_bass",
    "tautog",
    "atlantic_cod",
    "pollock",
    "false_albacore",
    "weakfish",
  ],
  great_lakes: [
    "walleye",
    "yellow_perch",
    "smallmouth_bass",
    "largemouth_bass",
    "lake_trout",
    "steelhead",
    "brown_trout",
    "chinook_salmon",
    "coho_salmon",
    "muskellunge",
    "northern_pike",
    "black_crappie",
  ],
  custom: [],
};

export function regionById(id: string): Region | null {
  return REGIONS.find((region) => region.id === id) ?? null;
}

/** The species ids a region leads with. `custom` deliberately leads with nothing. */
export function popularSpeciesIds(regionId: RegionId): readonly string[] {
  return BY_REGION[regionId];
}

/**
 * The picker's "Common" chips for a region: the region's list resolved to species.
 * A custom region gets the vocabulary head — alphabet-clean and region-neutral.
 */
export function popularSpecies(regionId: RegionId): readonly Species[] {
  const ids = BY_REGION[regionId];
  if (ids.length === 0) {
    return [...SPECIES].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 12);
  }
  return ids.map((id) => speciesById(id)).filter((s): s is Species => s !== null);
}
