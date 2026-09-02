/**
 * Alabama pack — `alabama-2026-09-01`.
 *
 * Verbatims come from ADCNR/Marine Resources Division pages on outdooralabama.com
 * (the agency's own site and news releases), cross-checked against the state's 2025
 * red snapper season announcements. The red snapper season is quota-managed and
 * announced each spring — 2025 pattern (opened May 23, seven days a week, closed when
 * the 664,552-lb private quota was met; season for the year closed Dec 31, 2025) is
 * quoted so the card teaches the mechanism, not a guessed 2026 date.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const ALABAMA_PACK: RegPack = {
  id: "alabama-2026-09-01",
  version: 1,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Alabama (ADCNR Marine Resources Division): inshore flagship slots verified against " +
    "agency releases; red snapper via Snapper Check + announced season; sheepshead 2025 " +
    "reduction (10→8) quoted from the regulation-change reports. Snapper Check is " +
    "mandatory before landing — read the note row before your first snapper trip.",
};

const OA = "https://www.outdooralabama.com";
const VERIFIED = "2026-09-02";
const pv = 1;

export const AL_AREAS: readonly RegArea[] = [
  {
    id: "al-gulf",
    authority: "adcnr",
    kind: "ocean_region",
    name: "Alabama — coastal waters envelope",
    polygon: [[-88.55, 30.35], [-87.45, 30.35], [-87.45, 29.5], [-88.55, 29.3]],
    sourceUrl: `${OA}/marine-resources`,
    verifiedAt: VERIFIED,
    notes: "Envelope for pack resolution and boundary folds (Gulf Shores/Orange Beach inside; Mobile city out).",
  },
];

export const AL_GROUPS: readonly RegGroup[] = [];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const AL_RULES: readonly RegRule[] = [
  rule({
    id: "al-seatrout-bag", speciesId: "spotted_seatrout", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim:
      "Spotted seatrout (speckled trout): 6 daily per person; 15–22 inch total-length slot; only one spotted seatrout larger than 22 inches may be kept (within the 6-fish bag).",
    sourceUrl: `${OA}/node/2632`, sourceTitle: "ADCNR — Seatrout, Flounder Limits Change August 1 (MRD regulation-change release)", sourceUpdatedAt: "2019-07-02", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: 22, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish >22” counts inside the 6.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-red-drum-bag", speciesId: "red_drum", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim:
      "Red drum (redfish): 3 daily per person; 16–26 inch total-length slot; an allowance for one fish larger than 26 inches (bull red) is included. (2025 Advisory Board proposed removing the oversize allowance — verify before keeping a bull red.)",
    sourceUrl: `${OA}/node/2632`, sourceTitle: "ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)", sourceUpdatedAt: "2019-07-02", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: 26, sizeMeasure: "total_length", platformScope: null, depthNote: "One bull red >26” allowed inside the 3 (pending 2025 proposed change).",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "al-flounder-open", speciesId: "southern_flounder", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim:
      "Flounder: bag of five per person for recreational anglers; 14 inches total length minimum. The entire month of November is closed to flounder fishing, both recreational and commercial.",
    sourceUrl: `${OA}/node/2632`, sourceTitle: "ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)", sourceUpdatedAt: "2019-07-02", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Closed all November.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-flounder-closed", speciesId: "southern_flounder", regAreaId: "al-gulf", kind: "season",
    verbatim: "The entire month of November is closed to flounder fishing, both recreational and commercial (November is when flounder migrate to the Gulf of Mexico to spawn).",
    sourceUrl: `${OA}/node/2632`, sourceTitle: "ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)", sourceUpdatedAt: "2019-07-02", verifiedAt: VERIFIED,
    seasonStart: "11-01", seasonEnd: "11-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-sheepshead-bag", speciesId: "sheepshead", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim:
      "Sheepshead: 12-inch fork length minimum; bag 8 per person per day — reduced from 10 in 2025 due to increased fishing pressure (verify the 2026 card; the reduction was approved in the 2025 regulation cycle).",
    sourceUrl: `${OA}/fishing/saltwater-fishing-and-reports`, sourceTitle: "ADCNR — saltwater fishing reports & limits", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 8, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "al-red-snapper-note", speciesId: "red_snapper", regAreaId: "al-gulf", kind: "note",
    verbatim:
      "Red snapper: Alabama state waters and federal waters opened to private and state-licensed charter anglers on Friday, May 23, 2025; the 2025 private-angler quota was 664,552 pounds and the season closed December 31, 2025. The 2026 quota will be 664,552 pounds and MRD will announce the dates for the 2026 fishing season in the spring. Bag while open: 2 fish per person per day; 16-inch minimum. The owner or operator of each vessel landing red snapper in Alabama is required by law to complete one landing report per vessel trip of their harvested red snapper through Snapper Check prior to removing the fish from the boat.",
    sourceUrl: `${OA}/articles/alabamas-red-snapper-season-continues-through-december-31`, sourceTitle: "ADCNR — Alabama’s Red Snapper Season Continues Through December 31 (2025-12-22)", sourceUpdatedAt: "2025-12-22", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null,
    depthNote: "Season dates announced each spring; Snapper Check report required BEFORE landing.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "al-king-mackerel-bag", speciesId: "king_mackerel", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "King mackerel: 24-inch fork length minimum; 3 per person per day (Alabama creel card; federal Gulf migratory-group rules control in federal waters).",
    sourceUrl: `${OA}/fishing/saltwater-fishing-and-reports`, sourceTitle: "ADCNR — saltwater fishing reports & limits", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-spanish-mackerel-bag", speciesId: "spanish_mackerel", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Spanish mackerel: 15 per person per day; no minimum size in Alabama state rules (federal Gulf rules apply offshore).",
    sourceUrl: `${OA}/fishing/saltwater-fishing-and-reports`, sourceTitle: "ADCNR — saltwater fishing reports & limits", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-gray-triggerfish-bag", speciesId: "gray_triggerfish", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Gray triggerfish: 1 per person per day; 15-inch fork length minimum (Alabama creel card); when the season is open triggerfish must be reported in Snapper Check.",
    sourceUrl: `${OA}/fishing/saltwater-fishing-and-reports`, sourceTitle: "ADCNR — saltwater fishing reports & limits", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "Snapper Check when season open.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "al-cobia-bag", speciesId: "cobia", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Cobia: 36 inches fork length; 2 per person per day (MRD approval notice; consistent with federal regulations).",
    sourceUrl: `${OA}/node/2632`, sourceTitle: "ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)", sourceUpdatedAt: "2019-07-02", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 36, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-descending-gear", speciesId: null, regAreaId: "al-gulf", kind: "gear",
    verbatim:
      "All vessels fishing for reef fish in federal waters are required to have a venting tool or descending device rigged and ready to use.",
    sourceUrl: `${OA}/articles/2025-red-snapper-season-modified-provide-increased-fishing-opportunities`, sourceTitle: "ADCNR — 2025 Red Snapper Season announcement", sourceUpdatedAt: "2025-03-13", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-goliath-note", speciesId: "goliath_grouper", regAreaId: "al-gulf", kind: "prohibited",
    verbatim: "Goliath grouper and Nassau grouper are prohibited from harvest (Alabama and federal rules).",
    sourceUrl: `${OA}/fishing/saltwater-fishing-and-reports`, sourceTitle: "ADCNR — saltwater fishing reports & limits", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
];

export const ALABAMA = { pack: ALABAMA_PACK, areas: AL_AREAS, groups: AL_GROUPS, rules: AL_RULES };
