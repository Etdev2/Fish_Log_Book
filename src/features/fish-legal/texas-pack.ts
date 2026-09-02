/**
 * Texas pack — `texas-2026-09-01`.
 *
 * Every verbatim string below was lifted on 2026-09-02 from the TPWD Outdoor Annual
 * per-species pages ("Valid Sep. 1, 2026 through Aug. 31, 2027"), which carry the exact
 * clause text of the rule. Sources:
 *   T<species> = https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/<species>-bag-length-limits
 * TPWD page glossies restate on every page: possession limit = double the daily bag
 * unless otherwise noted; limits apply out to 9 nm (state) and to EEZ-caught fish
 * possessed in/landed in Texas. Nothing here is inferred from aggregators.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const TEXAS_PACK: RegPack = {
  id: "texas-2026-09-01",
  version: 2,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Texas (TPWD Outdoor Annual 2026-2027, valid Sep 1 2026–Aug 31 2027): FULL saltwater " +
    "digest (v2) — every per-species page in the Annual's saltwater bag/length section is " +
    "encoded here with its own clause text. 2026-27 red snapper federal season flagged " +
    "check-in-season. Tags (Red Drum Tag, Spotted Seatrout Tag) quoted, not modeled.",
};

const TX_T = "https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/";
const VERIFIED = "2026-09-02";
const V = "2026-09-01"; // Outdoor Annual valid-from
const pv = 1;

export const TX_AREAS: readonly RegArea[] = [
  {
    // Coastline envelope: Louisiana line (~93.9°W, 29.4°N) down to the Rio Grande —
    // north walls chosen to keep bay/coastline points inside and inland cities out.
    id: "tx-gulf",
    authority: "tpwd",
    kind: "ocean_region",
    name: "Texas — coastal waters envelope",
    polygon: [
      [-93.9, 29.2], [-93.4, 29.6], [-94.3, 29.6], [-95.0, 29.2], [-95.8, 28.9],
      [-97.0, 28.6], [-97.3, 27.8], [-97.5, 26.1], [-97.2, 25.97], [-97.5, 26.0],
      [-93.9, 27.4],
    ],
    sourceUrl: TX_T.slice(0, -1),
    verifiedAt: VERIFIED,
    notes: "Envelope for pack resolution and boundary folds; 9-nm state/200-nm EEZ split quoted in rules, not drawn.",
  },
];

export const TX_GROUPS: readonly RegGroup[] = [];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const TX_RULES: readonly RegRule[] = [
  rule({
    id: "tx-red-drum-bag", speciesId: "red_drum", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim:
      "Red drum — Daily Bag: 3. Min Length: 20 inches. Max Length: 28 inches. During a license year, one red drum over the stated maximum length limit may be retained when affixed with a properly completed Red Drum Tag and one red drum over the stated maximum length limit may be retained when affixed with a properly completed Bonus Red Drum Tag; fish retained under authority of a tag may be retained in addition to the daily bag and possession limit.",
    sourceUrl: `${TX_T}drum-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Drum Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 20, maxSizeIn: 28, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-spotted-seatrout-bag", speciesId: "spotted_seatrout", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim:
      "Spotted seatrout — Daily Bag: 3. Min Length: 15 inches. Max Length: 20 inches. During a license year, one spotted seatrout over 28 inches may be retained when affixed with a properly completed Spotted Seatrout Tag and one over 28 inches via a Bonus Spotted Seatrout Tag; tag fish are retained in addition to the daily bag and possession limit.",
    sourceUrl: `${TX_T}seatrout-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Seatrout Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: 20, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-flounder-open", speciesId: "southern_flounder", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim:
      "Flounder — all species, their hybrids and subspecies: Daily Bag: 5. Min Length: 15 inches. Max Length: No limit. Daily bag is 5 fish except Nov 1 – Dec 14 (fishery closed; bag limit = 0). Possession limit = the daily bag.",
    sourceUrl: `${TX_T}flounder-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Flounder Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-flounder-closed", speciesId: "southern_flounder", regAreaId: "tx-gulf", kind: "season",
    verbatim:
      "Flounder — all species: bag limit = 0 between Nov 1 and Dec 14 (fishery closed). Outside the closure, daily bag is 5 fish, min length 15 inches; possession limit = the daily bag.",
    sourceUrl: `${TX_T}flounder-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Flounder Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: "11-01", seasonEnd: "12-14", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-black-drum-bag", speciesId: "black_drum", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim:
      "Black drum — Daily Bag: 5. Min Length: 14 inches. Max Length: 30 inches. No more than one black drum over 52 inches may be retained per person per day and counts as part of the daily bag limit and possession limit.",
    sourceUrl: `${TX_T}drum-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Drum Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: 30, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-sheepshead-bag", speciesId: "sheepshead", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Sheepshead — Daily Bag: 5. Min Length: 15 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}sheepshead-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Sheepshead Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-snook-bag", speciesId: "common_snook", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Snook — Daily Bag: 1. Min Length: 24 inches. Max Length: 28 inches.",
    sourceUrl: `${TX_T}snook-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Snook Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: 28, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-king-mackerel-bag", speciesId: "king_mackerel", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "King mackerel — Daily Bag: 3. Min Length: 27 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}mackerel-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Mackerel Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 27, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-spanish-mackerel-bag", speciesId: "spanish_mackerel", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Spanish mackerel — Daily Bag: 15. Min Length: 14 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}mackerel-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Mackerel Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-red-snapper-state", speciesId: "red_snapper", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim:
      "Red Snapper in State Waters — Open: Year-round. Bag limit: 4 fish per person daily. Size limit: 15-in minimum. Applies to private recreational anglers in state waters. Means & Methods: it is unlawful to use any kind of hook other than a circle hook when using natural bait.",
    sourceUrl: `${TX_T}snapper-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "State waters only (0–9 nm); federal-waters season is quota-managed.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-red-snapper-federal-note", speciesId: "red_snapper", regAreaId: "tx-gulf", kind: "note",
    verbatim:
      "Red Snapper Season in Federal Waters — Opens: May 22, 2026. Closes: in-season harvest will be monitored to determine the closure date. Bag limit: 2 fish per person daily; Size limit: 16-in minimum. Applies to private recreational anglers in federal waters.",
    sourceUrl: `${TX_T}snapper-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Federal waters 9–200 nm; closure date set in-season by harvest monitoring.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "tx-lane-snapper-min", speciesId: "lane_snapper", regAreaId: "tx-gulf", kind: "min_size",
    verbatim: "Lane snapper — Daily Bag: No limit. Min Length: 8 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}snapper-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 8, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-vermilion-snapper-min", speciesId: "vermilion_snapper", regAreaId: "tx-gulf", kind: "min_size",
    verbatim: "Vermilion snapper — Daily Bag: No limit. Min Length: 10 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}snapper-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-cobia-bag", speciesId: "cobia", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Cobia — Daily Bag: 1. Min Length: 40 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}cobia-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Cobia Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 40, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-tripletail-bag", speciesId: "tripletail", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Tripletail — Daily Bag: 3. Min Length: 17 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}tripletail-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Tripletail Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 17, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-amberjack-bag", speciesId: "greater_amberjack", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Amberjack, greater — Daily Bag: 1. Min Length: 38 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}amberjack-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Amberjack Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 38, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-reef-descending-gear", speciesId: "red_snapper", regAreaId: "tx-gulf", kind: "gear",
    verbatim:
      "Texas regulations now require all commercial and recreational anglers fishing in state waters to use a venting tool or rigged descending device on reef fish exhibiting signs of barotrauma; per the 2022 DESCEND Act, similar requirements are in place for boats fishing for reef fish in federal waters.",
    sourceUrl: `${TX_T}snapper-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-shark-note", speciesId: null, regAreaId: "tx-gulf", kind: "note",
    verbatim:
      "The daily bag limit is 1 fish for all allowable shark species INCLUDING Atlantic sharpnose, blacktip and bonnethead; non-offset, non-stainless steel circle hooks must be used when fishing for shark in state waters. Prohibited shark species may not be retained at all.",
    sourceUrl: `https://tpwd.texas.gov/regulations/outdoor-annual/fishing/shark-regulations`,
    sourceTitle: "TPWD Outdoor Annual 2026-2027 — Shark Regulations",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // ———— Digest-pass additions (v2) — every remaining TPWD Annual saltwater page ————
  rule({
    id: "tx-black-grouper-bag", speciesId: "black_grouper", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Black grouper — Daily Bag: 4. Min Length: 24 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}grouper-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Grouper Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-gag-bag", speciesId: "gag_grouper", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Gag grouper — Daily Bag: 2. Min Length: 24 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}grouper-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Grouper Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-goliath-cnr", speciesId: "goliath_grouper", regAreaId: "tx-gulf", kind: "prohibited",
    verbatim: "Goliath grouper (formerly called Jewfish) — Daily Bag: 0 (catch and release only).",
    sourceUrl: `${TX_T}grouper-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Grouper Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "tx-nassau-cnr", speciesId: null, regAreaId: "tx-gulf", kind: "prohibited",
    verbatim: "Nassau grouper — Daily Bag: 0 (catch and release only).",
    sourceUrl: `${TX_T}grouper-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Grouper Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "tx-gray-triggerfish-bag", speciesId: "gray_triggerfish", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Gray triggerfish — Daily Bag: 20. Min Length: 16 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}triggerfish-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Triggerfish Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 20, possessionLimit: 40, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "tx-blue-marlin-min", speciesId: "blue_marlin", regAreaId: "tx-gulf", kind: "min_size",
    verbatim: "Blue marlin — Daily Bag: No limit. Min Length: 131 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}marlin-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Marlin Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 131, maxSizeIn: null, sizeMeasure: "alternate_total_length", platformScope: null, depthNote: "Lower-jaw fork length (LJFL).",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "tx-white-marlin-min", speciesId: "white_marlin", regAreaId: "tx-gulf", kind: "min_size",
    verbatim: "White marlin — Daily Bag: No limit. Min Length: 86 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}marlin-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Marlin Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 86, maxSizeIn: null, sizeMeasure: "alternate_total_length", platformScope: null, depthNote: "Lower-jaw fork length (LJFL).",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "tx-sailfish-min", speciesId: "sailfish", regAreaId: "tx-gulf", kind: "min_size",
    verbatim: "Sailfish — Daily Bag: No limit. Min Length: 84 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}sailfish-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Sailfish Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 84, maxSizeIn: null, sizeMeasure: "alternate_total_length", platformScope: null, depthNote: "Lower-jaw fork length (LJFL).",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "tx-tarpon-bag", speciesId: "atlantic_tarpon", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim: "Tarpon — Daily Bag: 1. Min Length: 85 inches. Max Length: No limit.",
    sourceUrl: `${TX_T}tarpon-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Tarpon Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 85, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "tx-mullet-rule-note", speciesId: "striped_mullet", regAreaId: "tx-gulf", kind: "note",
    verbatim:
      "Mullet — all species, their hybrids and subspecies: Daily Bag: No limit. Min Length: No limit. Max Length: 12 inches. May not take from public waters, or possess on board a boat, mullet over 12 inches during October, November, December, and January. No limits apply during other months.",
    sourceUrl: `${TX_T}mullet-bag-length-limits`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Mullet Bag & Length Limits",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: 12, sizeMeasure: "total_length", platformScope: null,
    depthNote: ">12” ban applies only Oct–Jan.",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "tx-alligator-gar-bag", speciesId: "alligator_gar", regAreaId: "tx-gulf", kind: "bag_limit",
    verbatim:
      "Alligator gar — Daily Bag: 1. Min Length: No limit. Max Length: No limit. Special restrictions include mandatory harvest reporting (TPWD gar page).",
    sourceUrl: `${TX_T}gar-bag-length-limits-saltwater`, sourceTitle: "TPWD Outdoor Annual 2026-2027 — Gar Bag & Length Limits (saltwater)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "tx-possession-general", speciesId: null, regAreaId: "tx-gulf", kind: "note",
    verbatim:
      "TPWD gloss on every species page: the possession limit is equal to double the daily bag limit unless otherwise noted; bag and length limits apply to listed saltwater species; there are no bag, possession, or length limits on game or nongame fish except as listed. Limits apply to aquatic life caught in Texas public waters out to 9 nautical miles, and to EEZ-caught aquatic life possessed in state waters or landed in Texas. It is unlawful to possess aquatic life in Texas waters that was illegally taken in federal waters.",
    sourceUrl: TX_T.slice(0, -1), sourceTitle: "TPWD Outdoor Annual 2026-2027 — Bag & Length Limits (limits and restrictions block)",
    sourceUpdatedAt: V, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
];

export const TEXAS = { pack: TEXAS_PACK, areas: TX_AREAS, groups: TX_GROUPS, rules: TX_RULES };
