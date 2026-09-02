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
  version: 1,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Louisiana (LDWF 2025 Recreational Fishing Regulations + LDWF species pages): the " +
    ".redfish/trout 2024 reset is encoded (trout 15 @ 13–20 slot w/ ≤2 over 20 inside " +
    "the creel; redfish 4 @ 18–27, no oversize allowance, for-hire crew = zero). " +
    "State-managed red snapper season/quotas are check-in-season.",
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
      "SOUTHERN FLOUNDER — summarized, not quoted (exact LDWF clause text not captured at pack authoring): 10 daily per person, 12-inch minimum total length, year-round. Verify on the LDWF regulations page before each season; changes follow commission action.",
    sourceUrl: `${LW}/page/recreational-saltwater-fishing`, sourceTitle: "LDWF — Recreational saltwater fishing", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 20, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "la-red-snapper-note", speciesId: "red_snapper", regAreaId: "la-gulf", kind: "note",
    verbatim:
      "RED SNAPPER (state management): seasons are opened/closed by LDWF against the state quota; when open, seasons run Fridays–Sundays per season notice; bag and size within state waters are set in the season notice (2024: 2/day, 16” min — verify the current notice). LAKES AND BAYOUS: possession in state waters when the season is closed is prohibited.",
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
];

export const LOUISIANA = { pack: LOUISIANA_PACK, areas: LA_AREAS, groups: LA_GROUPS, rules: LA_RULES };
