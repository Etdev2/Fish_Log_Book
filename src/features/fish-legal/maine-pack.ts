/**
 * Maine pack — `maine-2026-09-03`. Atlantic wave 3.
 *
 * Verbatims lifted 2026-09-03 from DMR 2026 striped-bass PDF (current as of
 * 2026-03-25) and 2026 Groundfish and Other Finfish summary (posted 2026-07-14).
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const MAINE_PACK: RegPack = {
  id: "maine-2026-09-03",
  version: 1,
  publishedAt: "2026-09-03T21:00:00Z",
  notes:
    "Maine DMR 2026: stripers 28–31\" inclusive @1 year-round (Kennebec C&R May 1–Jun 30, closed Dec 1–Jun 30 except that C&R window; EEZ prohibited) + circle-hook bait / no gaff; cod 23\" @1 Sep 1–Oct 31; haddock 17\" @15 except March; winter flounder 12\" @8; fluke 20\" @2; BSB 13\" @10 May 19–Sep 21 and Oct 18–Dec 31; bluefish 5 + circle-hook bait; wolffish prohibited.",
};

const ME_SB = {
  url: "https://www.maine.gov/dmr/sites/maine.gov.dmr/files/inline-files/2026_striped_bass_regs%20-%20ADA%20compliant.pdf",
  title: "Maine DMR — 2026 Striped Bass Regulations",
  updated: "2026-03-25",
} as const;
const ME_GF = {
  url: "https://www.maine.gov/dmr/sites/maine.gov.dmr/files/inline-files/2026_sportfish_regs_Gabrielle%20Page_0.pdf",
  title: "Maine DMR — 2026 Saltwater Recreational Fishing Regulations (Groundfish and Other Finfish, posted July 14, 2026)",
  updated: "2026-07-01",
} as const;
const VERIFIED = "2026-09-03";
const pv = 1;

export const ME_AREAS: readonly RegArea[] = [
  {
    id: "me-coast",
    authority: "me-dmr",
    kind: "ocean_region",
    name: "Maine — coastal waters to head of tide",
    polygon: [
      [-70.85, 43.05], [-66.95, 44.8], [-66.95, 44.4], [-70.55, 43.05], [-70.85, 43.05],
    ],
    sourceUrl: ME_GF.url,
    verifiedAt: VERIFIED,
    notes: "Envelope. Kennebec watershed has a separate striped-bass area.",
  },
  {
    id: "me-kennebec",
    authority: "me-dmr",
    kind: "ocean_region",
    name: "Kennebec watershed (incl. Sheepscot, Androscoggin, related bays/tributaries to head of tide)",
    polygon: null,
    sourceUrl: ME_SB.url,
    verifiedAt: VERIFIED,
    notes: "Inside Cape Small–Salter Island–Cape Newagen line.",
  },
];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const ME_RULES: readonly RegRule[] = [
  rule({
    id: "me-striped-bass", speciesId: "striped_bass", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "STATEWIDE REGULATIONS OPEN SEASON January 1 through December 31, inclusive (except the Kennebec watershed). BAG LIMITS A person may take and possess 1 striped bass per day. SIZE LIMITS Fish can be harvested between 28 inches and 31 inches inclusive total length.",
    sourceUrl: ME_SB.url, sourceTitle: ME_SB.title, sourceUpdatedAt: ME_SB.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: "EEZ possession prohibited.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "me-striped-bass-gear", speciesId: "striped_bass", regAreaId: "me-coast", kind: "gear",
    verbatim: "GENERAL GEAR RESTRICTIONS: Hook and line only, no gaffing of striped bass. No bait allowed when using treble hooks. It is unlawful to use more than two barbed or barbless treble hooks on any artificial lure or fly while fishing for striped bass in territorial waters. It is unlawful to use any hook other than a non-offset circle hook when using bait. Exception: Rubber or latex tube lures may be used without a circle hook if they are a minimum of 8 inches long and have a single hook protruding from the end portion of the tubing where bait may be attached. Fish must remain whole and intact.",
    sourceUrl: ME_SB.url, sourceTitle: ME_SB.title, sourceUpdatedAt: ME_SB.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "me-kennebec-cr", speciesId: "striped_bass", regAreaId: "me-kennebec", kind: "season",
    verbatim: "SPECIAL KENNEBEC REGULATIONS: CATCH & RELEASE SEASON WITH SPECIAL GEAR RESTRICTIONS From May 1 through June 30, inclusive. Fishing in this area is restricted to single-hooked artificial lures only (may be a single treble hook). Use of or possession of marine bait, dead or alive, is prohibited.",
    sourceUrl: ME_SB.url, sourceTitle: ME_SB.title, sourceUpdatedAt: ME_SB.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "06-30", bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Closed.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "me-kennebec-open", speciesId: "striped_bass", regAreaId: "me-kennebec", kind: "bag_limit",
    verbatim: "SPECIAL KENNEBEC REGULATIONS OPEN SEASON July 1 through November 30, inclusive. (Statewide 1 fish, 28–31 inches inclusive, applies.)",
    sourceUrl: ME_SB.url, sourceTitle: ME_SB.title, sourceUpdatedAt: ME_SB.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "11-30", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "me-cod", speciesId: "atlantic_cod", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "ATLANTIC COD: Size: Minimum size 23 inches. Bag limit: 1 fish per angler per day. Season: Sept 1 – Oct 31, inclusive.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "10-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 23, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "me-cod-season", speciesId: "atlantic_cod", regAreaId: "me-coast", kind: "season",
    verbatim: "ATLANTIC COD Season: Sept 1 – Oct 31, inclusive.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "10-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "me-haddock", speciesId: "haddock", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "HADDOCK: Size: Minimum size 17 inches. Bag limit: 15 fish per angler per day. Season: Cannot possess from March 1 through March 31 inclusive.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "02-28", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 17, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Closed March; wraps New Year's.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "me-winter-flounder", speciesId: "winter_flounder", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "WINTER FLOUNDER: Size: Minimum size 12 inches. Bag limit: 8 fish per angler per day.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 8, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "me-fluke", speciesId: "summer_flounder", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "SUMMER FLOUNDER: Size: Minimum size 20 inches. Bag limit: 2 fish per angler per day.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 20, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "me-bsb-early", speciesId: "black_sea_bass", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "BLACK SEA BASS: Size: Minimum size 13 inches. Bag limit: 10 fish per angler per day. Season: May 19 – September 21 and October 18 – December 31, inclusive. Method of take: Hook and line only.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: "05-19", seasonEnd: "09-21", bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Hook and line only.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "me-bsb-late", speciesId: "black_sea_bass", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "BLACK SEA BASS: Size: Minimum size 13 inches. Bag limit: 10 fish per angler per day. Season: May 19 – September 21 and October 18 – December 31, inclusive.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: "10-18", seasonEnd: "12-31", bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Hook and line only.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "me-bluefish", speciesId: "bluefish", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "BLUEFISH: Size: No minimum size. Bag limit: 5 fish per angler per day. Method of take: No bait with treble hook. No more than two treble hooks per lure. It is unlawful to use any hook other than a circle hook when using bait.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "me-mackerel", speciesId: "atlantic_mackerel", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "ATLANTIC MACKEREL: Size: No minimum size. Bag limit: 25 fish per angler per day.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "me-pollock", speciesId: "pollock", regAreaId: "me-coast", kind: "bag_limit",
    verbatim: "POLLOCK: Maine Territorial waters: No size or bag limits. Federal waters: Minimum size 19 inches & no bag limit.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Federal waters 19\" min.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "me-wolffish", speciesId: "atlantic_wolffish", regAreaId: "me-coast", kind: "prohibited",
    verbatim: "ATLANTIC WOLFFISH: Anglers are prohibited from possessing Atlantic wolffish.",
    sourceUrl: ME_GF.url, sourceTitle: ME_GF.title, sourceUpdatedAt: ME_GF.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
];

export const MAINE = {
  pack: MAINE_PACK,
  areas: ME_AREAS,
  groups: [],
  rules: ME_RULES,
};
