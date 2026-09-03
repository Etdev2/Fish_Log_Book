/**
 * The slam catalog (founder request 2026-09-03).
 *
 * Sourced, not invented. This repo's Fish Legal work established a citation-or-nothing
 * rule for anything presented as an outside fact, and a slam is exactly that — an angler
 * telling their mates they got the IGFA Inshore Grand Slam means the real one, with the
 * real rules. Every entry therefore carries where its rule comes from, and the two the
 * founder specified are marked as the house's own rather than dressed up as IGFA's.
 *
 * Two safeguards are load-bearing:
 *
 * 1. **No protected species is ever a slam target** (spec §4.5, §11, decision §40.8). A
 *    slam is the most competitive thing in the product — it is a list of fish to go and
 *    get today — so a protected fish must never appear on one. `validateSlams` enforces
 *    it and the test fails the build. Note "sea bass" in the Island Trifecta is white
 *    seabass; giant sea bass is protected and is not a target.
 * 2. **Region is display, never qualification** (see `types.ts`). The species list is the
 *    geography, so spec §45.1's missing region column does not block this.
 */

import type { SlamDefinition } from "./types";

export const SLAM_RULE_VERSION = 1;

const TUNA = ["bluefin_tuna", "yellowfin_tuna", "bigeye_tuna", "skipjack_tuna"];
const BILLFISH = ["blue_marlin", "black_marlin", "striped_marlin", "white_marlin", "sailfish", "swordfish"];
const MARLIN = ["blue_marlin", "black_marlin", "striped_marlin", "white_marlin"];

export const SLAMS: readonly SlamDefinition[] = [
  /* ---- West Coast ---- */
  {
    id: "socal-island-trifecta",
    name: "Island Trifecta",
    description:
      "Yellowtail, white seabass and a California halibut, all in one day. The classic Channel Islands day — the three share the same ground and almost never share a mood.",
    tier: "trifecta",
    categories: [
      { id: "yellowtail", label: "Yellowtail", speciesIds: ["yellowtail"] },
      { id: "white-seabass", label: "White seabass", speciesIds: ["white_seabass"] },
      { id: "halibut", label: "California halibut", speciesIds: ["california_halibut"] },
    ],
    requiredCategories: 3,
    regions: ["southern_california", "ca_gma_southern", "ca_gma_central"],
    source: "Widely recognised SoCal trifecta; described as yellowtail + white seabass + halibut in one day (BDOutdoors). Founder-specified.",
    version: SLAM_RULE_VERSION,
  },
  {
    id: "socal-offshore-trifecta",
    name: "Offshore Trifecta",
    description:
      "Yellowtail, any tuna and any marlin in one day. The blue-water version — a long run and a lot of luck.",
    tier: "trifecta",
    categories: [
      { id: "yellowtail", label: "Yellowtail", speciesIds: ["yellowtail"] },
      { id: "tuna", label: "Any tuna", speciesIds: TUNA },
      { id: "marlin", label: "Any marlin", speciesIds: MARLIN },
    ],
    requiredCategories: 3,
    regions: ["southern_california", "ca_gma_southern", "cabo_baja", "baja_california", "baja_california_sur"],
    source: "Founder-specified (2026-09-03). House rule, not an IGFA category.",
    version: SLAM_RULE_VERSION,
  },
  {
    id: "pacific-salmon-slam",
    name: "Salmon Slam",
    description: "Any three Pacific salmon species in one day.",
    tier: "grand-slam",
    categories: [
      { id: "chinook", label: "Chinook", speciesIds: ["chinook_salmon"] },
      { id: "coho", label: "Coho", speciesIds: ["coho_salmon"] },
      { id: "sockeye", label: "Sockeye", speciesIds: ["sockeye_salmon"] },
      { id: "pink", label: "Pink", speciesIds: ["pink_salmon"] },
      { id: "chum", label: "Chum", speciesIds: ["chum_salmon"] },
    ],
    requiredCategories: 3,
    regions: ["washington", "oregon", "alaska", "northern_california"],
    source: "House rule, built on the common Pacific Northwest multi-salmon day. Not an IGFA category.",
    version: SLAM_RULE_VERSION,
  },

  /* ---- East Coast and Gulf ---- */
  {
    id: "igfa-inshore-grand-slam",
    name: "Inshore Grand Slam",
    description:
      "Any three of bonefish, permit, snook and tarpon in a single day. The flats classic.",
    tier: "grand-slam",
    categories: [
      { id: "bonefish", label: "Bonefish", speciesIds: ["atlantic_bonefish", "oio_bonefish"] },
      { id: "permit", label: "Permit", speciesIds: ["permit"] },
      { id: "snook", label: "Snook", speciesIds: ["common_snook"] },
      { id: "tarpon", label: "Tarpon", speciesIds: ["atlantic_tarpon"] },
    ],
    requiredCategories: 3,
    regions: ["florida", "gulf_coast", "texas", "louisiana"],
    source: "IGFA Inshore Grand Slam — any three of bonefish, permit, snook, tarpon in one day (igfa.org).",
    version: SLAM_RULE_VERSION,
  },
  {
    id: "igfa-inshore-super-grand-slam",
    name: "Inshore Super Grand Slam",
    description: "All four: bonefish, permit, snook and tarpon, in a single day.",
    tier: "super-grand-slam",
    categories: [
      { id: "bonefish", label: "Bonefish", speciesIds: ["atlantic_bonefish", "oio_bonefish"] },
      { id: "permit", label: "Permit", speciesIds: ["permit"] },
      { id: "snook", label: "Snook", speciesIds: ["common_snook"] },
      { id: "tarpon", label: "Tarpon", speciesIds: ["atlantic_tarpon"] },
    ],
    requiredCategories: 4,
    regions: ["florida", "gulf_coast"],
    source: "IGFA Inshore Super Grand Slam — all four inshore species in one day (igfa.org).",
    version: SLAM_RULE_VERSION,
  },
  {
    id: "igfa-offshore-grand-slam",
    name: "Offshore Grand Slam",
    description:
      "Any three of a billfish, a dorado, a tuna and a wahoo in a single day.",
    tier: "grand-slam",
    categories: [
      { id: "billfish", label: "Any billfish", speciesIds: BILLFISH },
      { id: "dorado", label: "Dorado (mahi)", speciesIds: ["dorado"] },
      { id: "tuna", label: "Any tuna", speciesIds: TUNA },
      { id: "wahoo", label: "Wahoo", speciesIds: ["wahoo"] },
    ],
    requiredCategories: 3,
    regions: ["florida", "gulf_coast", "southern_california", "cabo_baja", "hawaii", "north_carolina"],
    source: "IGFA Offshore Grand Slam — any three of billfish, dolphinfish, tuna, wahoo in one day (igfa.org).",
    version: SLAM_RULE_VERSION,
  },
  {
    id: "igfa-offshore-super-grand-slam",
    name: "Offshore Super Grand Slam",
    description: "All four: a billfish, a dorado, a tuna and a wahoo, in a single day.",
    tier: "super-grand-slam",
    categories: [
      { id: "billfish", label: "Any billfish", speciesIds: BILLFISH },
      { id: "dorado", label: "Dorado (mahi)", speciesIds: ["dorado"] },
      { id: "tuna", label: "Any tuna", speciesIds: TUNA },
      { id: "wahoo", label: "Wahoo", speciesIds: ["wahoo"] },
    ],
    requiredCategories: 4,
    regions: ["florida", "gulf_coast", "hawaii", "cabo_baja"],
    source: "IGFA Offshore Super Grand Slam — all four offshore species in one day (igfa.org).",
    version: SLAM_RULE_VERSION,
  },
  {
    id: "texas-slam",
    name: "Texas Slam",
    description: "Redfish, speckled trout and a flounder in the same day.",
    tier: "trifecta",
    categories: [
      { id: "redfish", label: "Redfish (red drum)", speciesIds: ["red_drum"] },
      { id: "trout", label: "Speckled trout", speciesIds: ["spotted_seatrout", "sand_seatrout"] },
      { id: "flounder", label: "Flounder", speciesIds: ["southern_flounder", "summer_flounder"] },
    ],
    requiredCategories: 3,
    regions: ["texas", "louisiana", "gulf_coast", "mississippi", "alabama"],
    source: "Texas Saltwater Slam — red drum, spotted seatrout and flounder in one calendar day (widely published Gulf-coast rule).",
    version: SLAM_RULE_VERSION,
  },
  {
    id: "cape-cod-slam",
    name: "Cape Cod Slam",
    description: "A striped bass, a bluefish and a false albacore in one day.",
    tier: "trifecta",
    categories: [
      { id: "striper", label: "Striped bass", speciesIds: ["striped_bass"] },
      { id: "bluefish", label: "Bluefish", speciesIds: ["bluefish"] },
      { id: "albie", label: "False albacore", speciesIds: ["false_albacore"] },
    ],
    requiredCategories: 3,
    regions: ["northeast", "rhode_island", "connecticut", "new_york", "new_jersey", "maine", "new_hampshire"],
    source: "New England autumn slam — striper, bluefish, false albacore in one day (widely published; Martha's Vineyard derby tradition).",
    version: SLAM_RULE_VERSION,
  },
  {
    id: "cape-cod-grand-slam",
    name: "Cape Cod Grand Slam",
    description:
      "Striped bass, bluefish, false albacore and an Atlantic bonito — all four, one day. The derby fish.",
    tier: "grand-slam",
    categories: [
      { id: "striper", label: "Striped bass", speciesIds: ["striped_bass"] },
      { id: "bluefish", label: "Bluefish", speciesIds: ["bluefish"] },
      { id: "albie", label: "False albacore", speciesIds: ["false_albacore"] },
      { id: "bonito", label: "Atlantic bonito", speciesIds: ["atlantic_bonito"] },
    ],
    requiredCategories: 4,
    regions: ["northeast", "rhode_island", "connecticut", "new_york"],
    source: "Martha's Vineyard Striped Bass & Bluefish Derby tradition — false albacore, bonito, striper, bluefish.",
    version: SLAM_RULE_VERSION,
  },
];

export function slamById(id: string): SlamDefinition | null {
  return SLAMS.find((s) => s.id === id) ?? null;
}

/**
 * Slams for an angler's region first, then the rest. Never a filter — someone who fishes
 * SoCal and takes one trip to the Keys should still be credited and should still see it.
 */
export function slamsForRegion(regionId: string): readonly SlamDefinition[] {
  const mine = SLAMS.filter((s) => (s.regions as readonly string[]).includes(regionId));
  const rest = SLAMS.filter((s) => !(s.regions as readonly string[]).includes(regionId));
  return [...mine, ...rest];
}

/**
 * Ticket-2-style validation, run by the test rather than at import: a bad definition
 * should fail a build with a readable list, not blank a screen on a boat.
 *
 * The protected-species rule is the one that matters. A slam is a list of fish to go and
 * catch today, so a protected fish appearing on one would be the product telling anglers
 * to target something they must release — the exact thing spec §40.8 forbids.
 */
export function validateSlams(
  speciesLookup: (id: string) => { isGroup: boolean; takeStatus: string } | null,
): readonly string[] {
  const problems: string[] = [];

  for (const slam of SLAMS) {
    const seenSpecies = new Set<string>();
    const seenCategories = new Set<string>();

    for (const category of slam.categories) {
      if (seenCategories.has(category.id)) {
        problems.push(`${slam.id}: category "${category.id}" appears twice`);
      }
      seenCategories.add(category.id);

      if (category.speciesIds.length === 0) {
        problems.push(`${slam.id}/${category.id}: no species, so it can never be filled`);
      }

      for (const speciesId of category.speciesIds) {
        const species = speciesLookup(speciesId);
        if (species === null) {
          problems.push(`${slam.id}/${category.id}: "${speciesId}" is not in the ontology`);
          continue;
        }
        if (species.takeStatus === "protected") {
          problems.push(
            `${slam.id}/${category.id}: "${speciesId}" is protected and must never be a slam target`,
          );
        }
        if (species.isGroup) {
          problems.push(
            `${slam.id}/${category.id}: "${speciesId}" is a group entry — name the species instead`,
          );
        }
        if (seenSpecies.has(speciesId)) {
          problems.push(`${slam.id}: "${speciesId}" fills two categories, which is ambiguous`);
        }
        seenSpecies.add(speciesId);
      }
    }

    if (slam.requiredCategories > slam.categories.length) {
      problems.push(`${slam.id}: needs ${slam.requiredCategories} of ${slam.categories.length}`);
    }
    if (slam.requiredCategories < 2) {
      problems.push(`${slam.id}: a slam of one fish is not a slam`);
    }
    if (slam.source.trim() === "") {
      problems.push(`${slam.id}: no source. A slam presented as real needs a citation.`);
    }
  }

  const ids = SLAMS.map((s) => s.id);
  for (const id of ids) {
    if (ids.indexOf(id) !== ids.lastIndexOf(id)) problems.push(`duplicate slam id "${id}"`);
  }

  return problems;
}
