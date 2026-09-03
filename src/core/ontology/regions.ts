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
  /** CDFW Groundfish Management Areas — the founder ask (2026-09-02): California
   *  broken into its five real management units, not one "California". Additive:
   *  the plain northern/southern entries stay for anglers who don't think in GMAs. */
  | "ca_gma_northern"
  | "ca_gma_mendocino"
  | "ca_gma_san_francisco"
  | "ca_gma_central"
  | "ca_gma_southern"
  | "florida"
  | "hawaii"
  | "cabo_baja"
  | "gulf_coast"
  | "northeast"
  | "rhode_island"
  | "connecticut"
  | "new_hampshire"
  | "maine"
  | "new_york"
  | "new_jersey"
  | "great_lakes"
  /** California inland waters (CDFW statewide defaults; named waters override). */
  | "california_freshwater"
  /** Gulf + Mexico wave (2026-09-02 states expansion). Mexico splits like CA. */
  | "texas"
  | "louisiana"
  | "mississippi"
  | "alabama"
  | "baja_california"
  | "baja_california_sur"
  /** Pacific Northwest wave (2026-09-02). Alaska leads with species but ships no
   *  regulations pack yet — the honest "no verified pack" state, not a hidden one. */
  | "oregon"
  | "washington"
  | "alaska"
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
  { id: "ca_gma_northern", label: "CA · Northern GMA", hint: "OR border to Cape Mendocino (40°10′ N): rockfish closed Jan–Mar, open all depths Apr–Dec." },
  { id: "ca_gma_mendocino", label: "CA · Mendocino GMA", hint: "Cape Mendocino to Point Arena: rockfish closed Jan–Mar, open all depths Apr–Dec." },
  { id: "ca_gma_san_francisco", label: "CA · San Francisco GMA", hint: "Point Arena to Pigeon Point: Cordell Bank closed to all groundfish." },
  { id: "ca_gma_central", label: "CA · Central GMA", hint: "Pigeon Point to Point Conception: rockfish closed Jan–Mar, open all depths Apr–Dec." },
  { id: "ca_gma_southern", label: "CA · Southern GMA", hint: "Point Conception to Mexico: 50-fm RCA split Jul–Dec for boat groundfish." },
  { id: "florida", label: "Florida", hint: "Snook, redfish, tarpon, reef and bluewater." },
  { id: "hawaii", label: "Hawaii", hint: "Ahi, ono, mahi, ulua, marlin." },
  { id: "cabo_baja", label: "Cabo / Baja", hint: "Marlin, dorado, tuna, roosterfish." },
  { id: "gulf_coast", label: "Gulf Coast", hint: "Redfish, specks, snapper, cobia." },
  { id: "northeast", label: "Northeast", hint: "Massachusetts DMF: stripers, blues, fluke, tog, cod." },
  { id: "rhode_island", label: "Rhode Island", hint: "Narragansett Bay & Block Island: stripers, tautog, fluke, scup." },
  { id: "connecticut", label: "Connecticut", hint: "Long Island Sound: stripers, tautog, fluke, scup, sea bass." },
  { id: "new_hampshire", label: "New Hampshire", hint: "18-mile seacoast: stripers, sea bass, blues, groundfish." },
  { id: "maine", label: "Maine", hint: "Head of tide to 3 miles: stripers, cod, haddock, blues." },
  { id: "new_york", label: "New York", hint: "Marine District: stripers, fluke, porgies, tautog LIS vs Bight." },
  { id: "new_jersey", label: "New Jersey", hint: "Cape May to Sandy Hook: stripers, fluke, sea bass, tautog." },
  { id: "great_lakes", label: "Great Lakes", hint: "Walleye, salmon and trout, perch, bass." },
  { id: "california_freshwater", label: "California — Freshwater", hint: "Lakes, rivers, Delta: bass, trout, striper, sturgeon." },
  { id: "texas", label: "Texas", hint: "Galveston to Padre Island: redfish, specks, flounder." },
  { id: "louisiana", label: "Louisiana", hint: "The marsh: reds, speckled trout, snapper." },
  { id: "mississippi", label: "Mississippi", hint: "Biloxi & the Sound: trout, reds, reef fish." },
  { id: "alabama", label: "Alabama", hint: "Orange Beach & Mobile Bay: snapper, specks, reds." },
  { id: "baja_california", label: "Baja California (MX)", hint: "Tijuana to Punta Eugenia: yellowtail, doggies." },
  { id: "baja_california_sur", label: "Baja California Sur (MX)", hint: "La Paz to Cabo: dorado, roosters, marlin." },
  { id: "oregon", label: "Oregon coast", hint: "Newport to Brookings: rockfish 4-fish marine bag, lingcod 3 @ 22\"+, halibut windows." },
  { id: "washington", label: "Washington coast", hint: "Ilwaco to Neah Bay: bottomfish aggregate 9, rockfish sub-limits, halibut days." },
  { id: "alaska", label: "Alaska", hint: "Salmon and halibut country. Regulations pack not yet shipped — check ADF&G." },
  { id: "custom", label: "Custom / anywhere else", hint: "No regional suggestions — search finds everything." },
];

const BY_REGION: Record<RegionId, readonly string[]> = {
  ca_gma_northern: [
    "rockfish", "lingcod", "pacific_halibut", "chinook_salmon",
    "coho_salmon", "california_halibut", "striped_bass", "leopard_shark",
  ],
  ca_gma_mendocino: [
    "rockfish", "lingcod", "pacific_halibut", "chinook_salmon",
    "coho_salmon", "california_halibut", "striped_bass", "leopard_shark",
  ],
  ca_gma_san_francisco: [
    "rockfish", "lingcod", "striped_bass", "chinook_salmon",
    "california_halibut", "leopard_shark", "barred_surfperch", "white_sturgeon",
  ],
  ca_gma_central: [
    "rockfish", "lingcod", "california_halibut", "barred_surfperch",
    "striped_bass", "leopard_shark", "chinook_salmon", "cabezon",
  ],
  ca_gma_southern: [
    "kelp_bass", "barred_sand_bass", "california_halibut", "barred_surfperch",
    "spotfin_croaker", "rockfish", "lingcod", "california_sheephead",
    "yellowtail", "white_seabass", "pacific_bonito", "bluefin_tuna",
  ],
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
  texas: [
    "red_drum", "spotted_seatrout", "southern_flounder", "black_drum",
    "sheepshead", "red_snapper", "king_mackerel", "spanish_mackerel",
    "cobia", "common_snook",
  ],
  louisiana: [
    "red_drum", "spotted_seatrout", "southern_flounder", "sheepshead",
    "black_drum", "red_snapper", "gray_snapper", "greater_amberjack",
  ],
  mississippi: [
    "spotted_seatrout", "red_drum", "southern_flounder", "sheepshead",
    "red_snapper", "gray_snapper", "king_mackerel", "spanish_mackerel",
  ],
  alabama: [
    "red_snapper", "spotted_seatrout", "red_drum", "southern_flounder",
    "sheepshead", "king_mackerel", "gray_triggerfish", "cobia",
  ],
  baja_california: [
    "yellowtail", "dorado", "california_halibut", "white_seabass",
    "kelp_bass", "bluefin_tuna", "roosterfish", "wahoo",
  ],
  baja_california_sur: [
    "striped_marlin", "dorado", "roosterfish", "yellowfin_tuna",
    "wahoo", "yellowtail", "sierra_mackerel", "sailfish",
  ],
  oregon: [
    "rockfish", "black_rockfish", "lingcod", "cabezon", "kelp_greenling",
    "chinook_salmon", "coho_salmon", "pacific_halibut", "flatfish", "striped_bass",
    "white_sturgeon", "barred_surfperch",
  ],
  washington: [
    "rockfish", "black_rockfish", "lingcod", "cabezon", "chinook_salmon",
    "coho_salmon", "pacific_halibut", "surfperch", "sablefish", "kelp_greenling",
  ],
  alaska: [
    "chinook_salmon", "coho_salmon", "sockeye_salmon", "pink_salmon", "pacific_halibut",
    "lingcod", "yelloweye_rockfish", "sablefish", "dolly_varden", "rockfish",
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
  rhode_island: [
    "striped_bass", "tautog", "summer_flounder", "black_sea_bass",
    "scup", "bluefish", "weakfish", "winter_flounder",
  ],
  connecticut: [
    "striped_bass", "summer_flounder", "tautog", "black_sea_bass",
    "scup", "bluefish", "weakfish", "winter_flounder",
  ],
  new_hampshire: [
    "striped_bass", "black_sea_bass", "bluefish", "atlantic_cod",
    "haddock", "winter_flounder", "summer_flounder", "atlantic_mackerel",
  ],
  maine: [
    "striped_bass", "atlantic_cod", "haddock", "black_sea_bass",
    "bluefish", "winter_flounder", "summer_flounder", "pollock",
  ],
  new_york: [
    "striped_bass", "summer_flounder", "black_sea_bass", "tautog",
    "scup", "bluefish", "weakfish", "atlantic_cod",
  ],
  new_jersey: [
    "striped_bass", "summer_flounder", "black_sea_bass", "tautog",
    "bluefish", "weakfish", "scup", "black_drum",
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
