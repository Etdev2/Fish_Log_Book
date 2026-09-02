/**
 * Mississippi pack — `mississippi-2026-09-01`.
 *
 * Verbatims lifted 2026-09-02 from the MDMR "Recreational Catch Limits" table
 * (dmr.ms.gov/recreational-catch-limits) — the page is the agency's official quick card
 * ("The information on this page is an abstract of the rules and regulations in effect
 * at the time of publishing"). MDMR Title 22 Part 3 (linked on the same site) supplies
 * the Tails n' Scales reporting layer. Red snapper season is announced annually against
 * the state quota (2025: May 23 – Jul 6, then re-opened at state discretion; 2/day, 16")
 * — encoded as check-in-season.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const MISSISSIPPI_PACK: RegPack = {
  id: "mississippi-2026-09-01",
  version: 2,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Mississippi (MDMR Recreational Catch Limits card): v2 = FULL digest — inshore, reef, " +
    "pelagic and shark tables verbatim. Red snapper season announced annually (Tails n' " +
    "Scales reporting legal). State waters for for-hire extend 9 nm south of the barrier " +
    "islands; federal Gulf rules apply beyond.",
};

const MS = { url: "https://dmr.ms.gov/recreational-catch-limits/", title: "MDMR — Recreational Catch Limits (official quick card)", updated: null };
const VERIFIED = "2026-09-02";
const pv = 1;

export const MS_AREAS: readonly RegArea[] = [
  {
    id: "ms-gulf",
    authority: "mdmr",
    kind: "ocean_region",
    name: "Mississippi — coastal waters envelope",
    polygon: [[-89.75, 30.45], [-88.05, 30.5], [-88.05, 29.6], [-89.75, 29.2]],
    sourceUrl: MS.url,
    verifiedAt: VERIFIED,
    notes: "Envelope for pack resolution and boundary folds (Biloxi/Gulfport inside).",
  },
];

export const MS_GROUPS: readonly RegGroup[] = [];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const MS_RULES: readonly RegRule[] = [
  rule({
    id: "ms-seatrout-bag", speciesId: "spotted_seatrout", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Spotted Seatrout: 15 TL minimum; 15 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-red-drum-bag", speciesId: "red_drum", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim:
      "Red Drum: 18 TL to 30 TL; 3 bag/possession. Recreational fishermen may retain only one red drum over 30 inches.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: 30, sizeMeasure: "total_length", platformScope: null, depthNote: "One >30” bull counts inside the 3.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-flounder-bag", speciesId: "southern_flounder", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Flounder: 12 TL minimum; 10 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-sheepshead-bag", speciesId: "sheepshead", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Sheepshead: 14 TL minimum; 15 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-gray-snapper-bag", speciesId: "gray_snapper", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Gray Snapper: 12 TL minimum; 10 bag/possession (see Reef Fish section for harvest in aggregate with other snapper species).",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null,
    depthNote: "Federal 10-snapper aggregate applies in federal waters (gulfcouncil.org).",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-red-snapper", speciesId: "red_snapper", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim:
      "Red Snapper: 16 TL minimum; 2 bag/possession. Reporting is required for Red Snapper trips and landings through the Tails n’ Scales program. Seasons are set annually by the Executive Director against the state quota (2025 season opened May 23 and ran seven days a week in state and federal waters until the annual catch limit was projected to be met).",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null,
    depthNote: "Open/close announced per season; Tails n’ Scales reporting mandatory.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ms-cobia-bag", speciesId: "cobia", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Cobia: 36 FL minimum; 2 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 36, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-tripletail-bag", speciesId: "tripletail", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Tripletail: 18 TL minimum; 3 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-king-mackerel-bag", speciesId: "king_mackerel", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "King Mackerel: 24 FL minimum; 3 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-spanish-mackerel-bag", speciesId: "spanish_mackerel", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Spanish Mackerel: 12 FL minimum; 15 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-vermilion-snapper-bag", speciesId: "vermilion_snapper", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Vermilion Snapper: 10 TL minimum; 10 bag/possession; counts in the 20 Reef Fish Aggregate (with gray triggerfish, lane snapper, almaco jack, and tilefish).",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null,
    depthNote: "20 Reef Fish Aggregate is quoted, not yet a modeled group — pack-v2 debt.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-lane-snapper-bag", speciesId: "lane_snapper", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Lane Snapper: 8 TL minimum; 20 bag/possession; counts in the 20 Reef Fish Aggregate.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 20, possessionLimit: 20, bagSharesWithGroup: false,
    minSizeIn: 8, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-amberjack-bag", speciesId: "greater_amberjack", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Greater Amberjack: 34 FL minimum; 1 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 34, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-tarpon-note", speciesId: "atlantic_tarpon", regAreaId: "ms-gulf", kind: "note",
    verbatim: "Tarpon: 75 FL minimum; 1 per vessel. May not remove fish from water if over 40 inches in length unless harvesting within specified limits.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 75, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: "boat", depthNote: "Per-VESSEL, not per-person.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-no-sale", speciesId: null, regAreaId: "ms-gulf", kind: "note",
    verbatim: "It is illegal to sell any seafood taken with a recreational license.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  // ———— Digest-pass additions (v2) — remaining MDMR card tables verbatim ————
  rule({
    id: "ms-mutton-snapper-bag", speciesId: "mutton_snapper", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Mutton Snapper: 18 TL minimum; 5 bag/possession; counts in the 10 Snapper Aggregate (with gray, schoolmaster, cubera, dog, mahogany and yellowtail snappers at 12 TL).",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: true,
    minSizeIn: 18, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "10-snapper aggregate per card.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-gag-bag", speciesId: "gag_grouper", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Gag Grouper: 24 TL minimum; 2 bag/possession; counts in the 4 Grouper Aggregate.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: true,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "4-grouper aggregate per card.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-red-grouper-bag", speciesId: "red_grouper", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Red and Yellowfin Groupers: 20 TL minimum; 4 bag/possession; counts in the 4 Grouper Aggregate.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: true,
    minSizeIn: 20, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-black-grouper-bag", speciesId: "black_grouper", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Black Grouper: 24 TL minimum; 4 bag/possession (4 Grouper Aggregate applies).",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: true,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-scamp-min", speciesId: "scamp", regAreaId: "ms-gulf", kind: "min_size",
    verbatim: "Scamp: 16 TL minimum (4 Grouper Aggregate applies).",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-warsaw-cap", speciesId: "warsaw_grouper", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Warsaw Grouper: No minimum size; 1 per vessel (4 Grouper Aggregate applies).",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: "Per VESSEL, not per person.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-speckled-hind-cap", speciesId: "speckled_hind", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Speckled Hind: No minimum size; 1 per vessel (4 Grouper Aggregate applies).",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: "Per VESSEL.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-goliath-nassau-notake", speciesId: "goliath_grouper", regAreaId: "ms-gulf", kind: "prohibited",
    verbatim: "Goliath Grouper: No Take. Nassau Grouper: No Take.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ms-hogfish-bag", speciesId: "hogfish", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Hogfish: 14 FL minimum; 5 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-lesser-aj-bag", speciesId: "lesser_amberjack", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Lesser Amberjack and Banded Rudderfish: 14 FL to 22 FL; 5 bag/possession; 5 Fish Aggregate applies.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: 22, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-yellowfin-tuna-bag", speciesId: "yellowfin_tuna", regAreaId: "ms-gulf", kind: "bag_limit",
    verbatim: "Yellowfin Tuna: 27 CFL minimum; 3 bag/possession.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 27, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "Curved fork length.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-billfish-note", speciesId: "blue_marlin", regAreaId: "ms-gulf", kind: "note",
    verbatim: "Blue Marlin: 99 Lower Jaw FL, no limit. White Marlin: 66 Lower Jaw FL, no limit. Sailfish: 63 Lower Jaw FL, no limit. Swordfish: 47 Lower Jaw FL, no limit. Longbill Spearfish: No Take.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 99, maxSizeIn: null, sizeMeasure: "alternate_total_length", platformScope: null, depthNote: "LJFL minima; HMS permits per federal rules.",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ms-sharks-note", speciesId: null, regAreaId: "ms-gulf", kind: "note",
    verbatim:
      "Sharks (MDMR card): Large Coastals and Pelagics (blacktip, spinner, bull, tiger, lemon, nurse, scalloped/great/smooth hammerhead, shortfin mako, porbeagle, thresher, blue, oceanic whitetip): 37 TL minimum; 1 per person up to 3 per vessel. Small Coastals (Atlantic sharpnose, finetooth, blacknose, bonnethead): 25 TL minimum; 4 bag/possession. Prohibited from harvest: Sand Tiger, Bigeye Sand Tiger, Whale, Basking, White, Dusky, Bignose, Galapagos, Night, Caribbean Reef, Narrowtooth, Caribbean Sharpnose, Smalltail, Atlantic Angel, Longfin Mako, Bigeye Thresher, Sevengill, Sixgill, Bigeye Sixgill, Sandbar, and Silky.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ms-dorado-note", speciesId: "dorado", regAreaId: "ms-gulf", kind: "note",
    verbatim: "Dolphin (Mahi Mahi): No Limit; No Limit.",
    sourceUrl: MS.url, sourceTitle: MS.title, sourceUpdatedAt: MS.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
];

export const MISSISSIPPI = { pack: MISSISSIPPI_PACK, areas: MS_AREAS, groups: MS_GROUPS, rules: MS_RULES };
