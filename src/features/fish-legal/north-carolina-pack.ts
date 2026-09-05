/**
 * North Carolina pack — `north-carolina-2026-09-03`. Atlantic wave 4.
 * DMF Recreational Size and Bag Limits page (effective September 2, 2026).
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const NORTH_CAROLINA_PACK: RegPack = {
  id: "north-carolina-2026-09-03",
  version: 2,
  publishedAt: "2026-09-03T23:45:00Z",
  notes:
    "NC DMF rec table (effective 2026-09-02) v2: drums/flounder/specks as v1; king 24\" FL @3; Spanish 12\" FL @15; dolphin @10; wahoo @2; cobia 36\" FL @1; BSB 13\" @15 N of Hatteras May 1–Dec 31 (7 S of Hatteras); scup 9\" @30 N of Hatteras; red snapper prohibited in coastal/joint waters.",
};

const NC = {
  url: "https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits",
  title: "NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)",
  updated: "2026-09-02",
} as const;
const VERIFIED = "2026-09-03";
const pv = 2;

export const NC_AREAS: readonly RegArea[] = [
  {
    id: "nc-coastal",
    authority: "nc-dmf",
    kind: "ocean_region",
    name: "North Carolina — coastal and joint waters",
    polygon: [[-78.6, 36.55], [-75.5, 35.2], [-77.9, 33.85], [-78.6, 33.85], [-78.6, 36.55]],
    sourceUrl: NC.url, verifiedAt: VERIFIED,
    notes: "Internal CSMA stripers are closed; ocean slot is a footnote (A).",
  },
];

function rule(r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const NC_RULES: readonly RegRule[] = [
  rule({
    id: "nc-red-drum", speciesId: "red_drum", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Red Drum (Channel Bass, Puppy Drum): 18\" Min - 27\" Max TL. 1/Day. Unlawful to possess red drum greater than 27\" TL. Unlawful to gig, spear, or gaff red drum.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nc-flounder-open", speciesId: "southern_flounder", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Flounder (All Species): Sep 1-14: OPEN Sep 15-30: CLOSED UNLAWFUL TO POSSESS. (Spring 2026 ocean-only window was Mar 9–22, 1 fish, 15-inch TL, hook-and-line.)",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "09-14", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Mandatory harvest reporting.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "nc-flounder-season", speciesId: "southern_flounder", regAreaId: "nc-coastal", kind: "season",
    verbatim: "Flounder (All Species): Sep 1-14: OPEN. Sep 15-30: CLOSED UNLAWFUL TO POSSESS.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "09-14", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "nc-speckled-trout", speciesId: "spotted_seatrout", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Spotted Seatrout (Speckled Trout): 14\"- 20\" TL, 1 greater than 26' TL. 3/day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: 20, sizeMeasure: "total_length", platformScope: null, depthNote: "Table allows 1 fish greater than 26\" TL.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nc-weakfish", speciesId: "weakfish", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Weakfish (Gray Trout): 12\" TL. 1/Day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nc-sheepshead", speciesId: "sheepshead", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Sheepshead: 14\" TL. 5/Day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nc-black-drum", speciesId: "black_drum", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Black Drum: 14\" Min - 25\" Max TL. 10/Day. One black drum per person per day over 25\" TL is allowed.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: 25, sizeMeasure: "total_length", platformScope: null, depthNote: "One over 25\" allowed.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nc-striped-bass-internal", speciesId: "striped_bass", regAreaId: "nc-coastal", kind: "prohibited",
    verbatim: "Striped Bass: UNLAWFUL TO POSSESS (A). Albemarle Sound Management Area: SEASON CURRENTLY CLOSED; Central Southern Management Area (CSMA): Unlawful to possess striped bass (including hybrid bass); Atlantic Ocean: Year-round: 1 per person per day and a harvest slot limit of 28 inches to 31 inches TL. Unlawful to gig, spear, or gaff striped bass.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Ocean slot 28–31 @1 is footnote (A); internal CSMA is closed.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "nc-bluefish", speciesId: "bluefish", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Bluefish: None minimum length. 5/Day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nc-tarpon", speciesId: "atlantic_tarpon", regAreaId: "nc-coastal", kind: "prohibited",
    verbatim: "Tarpon: UNLAWFUL TO POSSESS.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "nc-king-mackerel", speciesId: "king_mackerel", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "King Mackerel: 24\" FL. 3/Day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nc-spanish-mackerel", speciesId: "spanish_mackerel", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Spanish Mackerel: 12\" FL. 15/Day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nc-dolphin", speciesId: "dorado", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Dolphin: 10/Day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nc-wahoo", speciesId: "wahoo", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Wahoo: 2/Day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nc-cobia", speciesId: "cobia", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Cobia: 36\" FL. 1/Day. Recreational cobia is proclamation-managed; confirm the current proclamation before keeping a fish.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 36, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "Confirm proclamation.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "nc-bsb-north", speciesId: "black_sea_bass", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Black Sea Bass north of Cape Hatteras: 13\" TL. 15/Day. Season May 1–December 31. South of Cape Hatteras: 13\" TL, 7/Day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "12-31", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null,
    depthNote: "North of Cape Hatteras. South of Hatteras is 7/day year-round on the same table.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "nc-scup", speciesId: "scup", regAreaId: "nc-coastal", kind: "bag_limit",
    verbatim: "Scup north of Cape Hatteras: 9\" TL. 30/Day.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 9, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null,
    depthNote: "North of Cape Hatteras.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nc-red-snapper", speciesId: "red_snapper", regAreaId: "nc-coastal", kind: "prohibited",
    verbatim: "Red snapper: prohibited in coastal and joint waters. Snapper-grouper species are managed by proclamation. It is unlawful to take both the state and federal bag limit of the same species on the same trip.",
    sourceUrl: NC.url, sourceTitle: NC.title, sourceUpdatedAt: NC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
];

export const NORTH_CAROLINA = { pack: NORTH_CAROLINA_PACK, areas: NC_AREAS, groups: [], rules: NC_RULES };
