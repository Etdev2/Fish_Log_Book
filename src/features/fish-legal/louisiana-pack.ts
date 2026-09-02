/**
 * Louisiana pack — `louisiana-2026-09-01`.
 *
 * Verbatim strings are lifted from the LDWF 2025 Recreational Fishing Regulations
 * booklet (wlf.louisiana.gov "25LAFW.pdf", the agency's official digest, pageAge Feb
 * 2025) and the LDWF spotted seatrout species page. Where the booklet text was itself
 * quoted with punctuation ("13” min total length"), the quote stands. Charter-boat
 * crew carve-outs are quoted because they surprise anglers.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const LOUISIANA_PACK: RegPack = {
  id: "louisiana-2026-09-01",
  version: 2,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Louisiana (LDWF 2025 Recreational Fishing Regulations booklet, updated Aug 20 2025): " +
    "v2 = FULL saltwater digest — the 2024 redfish/trout reset plus the complete reef/HMS/" +
    "shark tables, the October-November flounder possession closure, and the ROLP note. " +
    "State-managed red snapper is check-in-season.",
};

const LW = "https://www.wlf.louisiana.gov";
const PDF = `${LW}/assets/Resources/Publications/Regulations/25LAFW.pdf`;
const VERIFIED = "2026-09-02";
const pv = 1;

export const LA_AREAS: readonly RegArea[] = [
  {
    id: "la-gulf",
    authority: "ldwf",
    kind: "ocean_region",
    name: "Louisiana — coastal waters envelope",
    polygon: [
      [-93.9, 28.6], [-92.6, 29.5], [-91.4, 29.55], [-90.0, 29.0], [-89.05, 29.4],
      [-88.85, 29.5], [-88.85, 28.2], [-93.9, 27.8],
    ],
    sourceUrl: `${LW}/page/recreational-fishing-regulations`,
    verifiedAt: VERIFIED,
    notes: "Envelope for pack resolution and boundary folds; state waters extend 3 nm (LDWF).",
  },
];

export const LA_GROUPS: readonly RegGroup[] = [];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const LA_RULES: readonly RegRule[] = [
  rule({
    id: "la-seatrout-bag", speciesId: "spotted_seatrout", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim:
      "SPOTTED SEATROUT (Speckled Trout): 13” min total length, 20” max total length; 15 daily per person with no more than 2 over 20” max total length. Retention by captain and crew on charter or head boats while on a for-hire trip is prohibited. Take or possession of spotted seatrout in federal waters: same limits as state.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-02-04", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: 20, sizeMeasure: "total_length", platformScope: null,
    depthNote: "Slot: no more than 2 over 20” inside the 15-fish creel; for-hire captain/crew creel = 0.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-red-drum-bag", speciesId: "red_drum", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim:
      "RED DRUM (Redfish): 18” min total length; 27” max total length; 4 daily per person. No retention allowance for fish over 27 inches. Retention by captain and crew on charter or head boats while on a for-hire trip is prohibited. Take or possession of red drum in federal waters is prohibited.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-02-04", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null, depthNote: "Fed-waters take prohibited; for-hire captain/crew creel = 0.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-black-drum-bag", speciesId: "black_drum", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim:
      "BLACK DRUM: 16” min total length; 5 daily per person; no more than 1 over 27” (max TL) may be kept. Possession limit is twice the daily creel limit unless otherwise stated.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-02-04", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null,
    depthNote: "One >27” bull counts inside the 5-fish creel.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-sheepshead-bag", speciesId: "sheepshead", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "SHEEPSHEAD: 10 daily per person; 12” min total length (12” fork-length conversions in older tables refer to fork length).",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-02-04", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 20, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-southern-flounder-bag", speciesId: "southern_flounder", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim:
      "SOUTHERN FLOUNDER: 10 daily per person; No Size Limit; NO possession allowed from Oct. 15 - Nov. 30.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet, Saltwater State Creel & Size Limits)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 20, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Flounder possession banned Oct 15–Nov 30.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-flounder-closure", speciesId: "southern_flounder", regAreaId: "la-gulf", kind: "season",
    verbatim: "SOUTHERN FLOUNDER: No possession allowed from Oct. 15 - Nov. 30 (10 daily per person, no size limit, outside the closure).",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: "10-15", seasonEnd: "11-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-red-snapper-note", speciesId: "red_snapper", regAreaId: "la-gulf", kind: "note",
    verbatim:
      "RED SNAPPER: 16” min total length; 4 daily per person (subject to change mid-season — the LDWF booklets marks this row footnotes 10 & 11 exactly so). Louisiana runs private red snapper seasons under state management and announces openings/closures against the state quota; verify the current season notice (LDWF red snapper page) before each trip.",
    sourceUrl: `${LW}/page/red-snapper`, sourceTitle: "LDWF — Red Snapper", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Season announced against quota; check LDWF before each trip.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "la-amberjack-bag", speciesId: "greater_amberjack", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "AMBERJACK, GREATER: 34” min fork length; 1 daily per person.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-02-04", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 34, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-gray-triggerfish-bag", speciesId: "gray_triggerfish", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "GRAY TRIGGERFISH: 15” min fork length; 1 daily per person in aggregate (reef fish aggregate rules apply in federal waters as posted by the Gulf Council).",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-02-04", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-tarpon-note", speciesId: "atlantic_tarpon", regAreaId: "la-gulf", kind: "note",
    verbatim:
      "Tarpon — summarized, not quoted: Louisiana treats tarpon harvest as effectively tag-limited and unusual; the in-practice rule is catch-and-release. Any retention requires confirming a current LDWF tarpon rule/tags before keeping.",
    sourceUrl: `${LW}/page/recreational-saltwater-fishing`, sourceTitle: "LDWF — Recreational saltwater fishing", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "la-possession-general", speciesId: null, regAreaId: "la-gulf", kind: "note",
    verbatim:
      "Possession limit is TWICE the daily creel limit unless otherwise stated. Recreational saltwater anglers may possess a two days’ bag limit on land; no person shall be in possession of fish over the daily bag limit in any one day or while fishing or while on the water.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-02-04", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // ———— Digest-pass additions (v2) — the complete LDWF 2025 saltwater tables ————
  rule({
    id: "la-cobia-bag", speciesId: "cobia", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "COBIA (Ling or Lemonfish): 1 daily per person; 36” min fork length; no more than 2 per vessel.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 36, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "≤2 per vessel.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-king-mackerel-bag", speciesId: "king_mackerel", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "KING MACKEREL: 24” min fork length; 3 daily per person.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-spanish-mackerel-bag", speciesId: "spanish_mackerel", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "SPANISH MACKEREL: 12” min fork length; 15 daily per person.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-mullet-note", speciesId: "striped_mullet", regAreaId: "la-gulf", kind: "note",
    verbatim: "STRIPED MULLET: No Size Limit; 100 lbs. daily.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Limit is by weight, not fish count.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-grouper-aggregate", speciesId: null, regAreaId: "la-gulf", kind: "bag_limit",
    verbatim:
      "GROUPER: Black & Gag — 24” min total length; Red & Yellowfin — 20” min total length; Scamp — 16” min total length. 4 daily in aggregate; no more than 1 speckled hind and 1 Warsaw grouper per vessel, not more than 2 red grouper per person, and not more than 2 gag per person included in the bag limit. Goliath & Nassau: Take Prohibited — Take/Possession Prohibited.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Aggregate ceiling quoted; per-species caps below.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-gag-bag", speciesId: "gag_grouper", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "Gag grouper: 24” min total length; no more than 2 gag per person included in the 4-fish aggregate bag limit.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 4, bagSharesWithGroup: true,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Inside the 4-grouper aggregate.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-red-grouper-bag", speciesId: "red_grouper", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "Red grouper: 20” min total length; not more than 2 red grouper per person included in the 4-fish aggregate bag limit.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 4, bagSharesWithGroup: true,
    minSizeIn: 20, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Inside the 4-grouper aggregate.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-scamp-min", speciesId: "scamp", regAreaId: "la-gulf", kind: "min_size",
    verbatim: "Scamp: 16” min total length (inside the 4-fish daily grouper aggregate).",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-goliath-cnr", speciesId: "goliath_grouper", regAreaId: "la-gulf", kind: "prohibited",
    verbatim: "GOLIATH & NASSAU grouper: Take Prohibited; Take/Possession Prohibited. (Goliath grouper also appears on the federally listed prohibited species list.)",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "la-mutton-snapper-min", speciesId: "mutton_snapper", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "SNAPPERS: Mutton — 18” min total length; within the 10-fish snapper aggregate with no more than 5 mutton snapper per person.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: true,
    minSizeIn: 18, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Inside the 10-snapper aggregate (gray/mutton/yellowtail/cubera/queen/blackfin/silk/wenchman).",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-gray-snapper-bag", speciesId: "gray_snapper", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "Cubera, Gray (mangrove) & Yellowtail snapper: 12” min total length; 10 daily per person in aggregate (no more than 5 mutton inside the ten).",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 20, bagSharesWithGroup: true,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-lane-snapper-bag", speciesId: "lane_snapper", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "LANE: 8” min total length; 20 daily per person in aggregate, with no more than 1 gray triggerfish and not more than 10 vermilion snapper per person included in the bag limit.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 20, possessionLimit: 40, bagSharesWithGroup: false,
    minSizeIn: 8, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "20-reef aggregate w/ gray trigger + vermilion caps.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-vermilion-snapper-bag", speciesId: "vermilion_snapper", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "VERMILION snapper: 10” min total length; inside the 20-fish aggregate, no more than 10 vermilion per person.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 20, bagSharesWithGroup: true,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-lesser-aj-bag", speciesId: "lesser_amberjack", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "AMBERJACK — LESSER & BANDED RUDDERFISH: 14-22” fork length slot limit; 5 daily per person in aggregate.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: 22, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-hogfish-bag", speciesId: "hogfish", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "HOGFISH: 14” min fork length; 5 daily per person.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-tripletail-bag", speciesId: "tripletail", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "TRIPLETAIL: 18” min total length; 5 daily per person.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-almaco-bag", speciesId: "almaco_jack", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "ALMACO JACK: No size limit; 20 daily per person in aggregate (with tilefish).",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 20, possessionLimit: 40, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-blue-marlin-min", speciesId: "blue_marlin", regAreaId: "la-gulf", kind: "min_size",
    verbatim: "MARLIN — BLUE MARLIN: 99” min lower jaw fork length; No Bag or Possession Limit (HMS permit required).",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 99, maxSizeIn: null, sizeMeasure: "alternate_total_length", platformScope: null, depthNote: "LJFL; HMS permit.",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "la-white-marlin-min", speciesId: "white_marlin", regAreaId: "la-gulf", kind: "min_size",
    verbatim: "WHITE MARLIN: 66” min lower jaw fork length; No Bag or Possession Limit.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 66, maxSizeIn: null, sizeMeasure: "alternate_total_length", platformScope: null, depthNote: "LJFL.",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "la-sailfish-min", speciesId: "sailfish", regAreaId: "la-gulf", kind: "min_size",
    verbatim: "SAILFISH: 63” min lower jaw fork length; No Bag or Possession Limit.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 63, maxSizeIn: null, sizeMeasure: "alternate_total_length", platformScope: null, depthNote: "LJFL.",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "la-swordfish-bag", speciesId: "swordfish", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "SWORDFISH: 47” Lower Jaw Fork Length (LJFL) or 25” cleithrum to caudal keel (CK); 1 per person; no more than 4 per vessel trip; may not be transferred between vessels.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 47, maxSizeIn: null, sizeMeasure: "alternate_total_length", platformScope: null, depthNote: "≤4 per vessel trip.",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "la-yellowfin-tuna-bag", speciesId: "yellowfin_tuna", regAreaId: "la-gulf", kind: "bag_limit",
    verbatim: "TUNA — YELLOWFIN: 27” min curved fork length; 3 daily per person.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 27, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "Curved fork length.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-shark-table", speciesId: null, regAreaId: "la-gulf", kind: "note",
    verbatim:
      "SHARKS (Louisiana 2025): Atlantic sharpnose & bonnethead — no size, 1 daily per person. Blacktip & bull — no size, no bag limit (note: regulations differ in federal waters). Other sharks (except prohibited, silky and sandbar): 54” min fork length; 1 in aggregate per vessel per trip — no silky or sandbar sharks. Finning is prohibited within and without Louisiana waters. Prohibited sharks: Atlantic angel, basking, bigeye sand tiger, bigeye sixgill, bigeye thresher, bignose, Caribbean reef, Caribbean sharpnose, dusky, Galapagos, longfin mako, narrowtooth, night, sand tiger, sevengill, sixgill, shortfin mako, smalltail, whale and white.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-reef-gear", speciesId: null, regAreaId: "la-gulf", kind: "gear",
    verbatim:
      "Recreational anglers onboard a vessel to fish for or possess Gulf reef fish in the Gulf EEZ must possess onboard and use: non-stainless steel circle hooks (when fishing with natural baits for reef fish); at least one dehooking device; a descending device or venting tool rigged and ready for use.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet, Required Onboard Gear)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-rolp-note", speciesId: null, regAreaId: "la-gulf", kind: "note",
    verbatim:
      "A no-fee Recreational Offshore Landing Permit (ROLP) is required of all anglers to possess tunas, billfish, swordfish, amberjacks, groupers, hinds, snappers, dolphinfish, wahoo, cobia and gray triggerfish (charter clients on a permitted captain's trip and under-18 anglers are exempt).",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "la-prohibited-species", speciesId: null, regAreaId: "la-gulf", kind: "prohibited",
    verbatim:
      "Threatened/endangered/prohibited species are off limits for fishing or recreational take (release immediately unharmed if incidentally caught): all whales, dolphin (mammal), goliath grouper, Gulf sturgeon, largetooth sawfish, Nassau grouper, sea turtles, smalltooth sawfish, West Indian manatee, and the prohibited shark list.",
    sourceUrl: PDF, sourceTitle: "LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)", sourceUpdatedAt: "2025-08-20", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
];

export const LOUISIANA = { pack: LOUISIANA_PACK, areas: LA_AREAS, groups: LA_GROUPS, rules: LA_RULES };
