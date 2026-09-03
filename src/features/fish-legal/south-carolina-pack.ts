/**
 * South Carolina pack — `south-carolina-2026-09-03`. Atlantic wave 4.
 * SCDNR eRegulations Finfish Size & Catch Limits, last updated August 11, 2026.
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const SOUTH_CAROLINA_PACK: RegPack = {
  id: "south-carolina-2026-09-03",
  version: 1,
  publishedAt: "2026-09-03T22:00:00Z",
  notes:
    "SCDNR 2026-27 (updated 2026-08-11): red drum 18–25\" @1 / 2 per boat (Act 231 Jul 1 2026); trout 14\" @10; flounder 16\" @5 not to exceed 10/boat; stripers closed Jun 16–Sep 30 in salt water.",
};

const SC = {
  url: "https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits",
  title: "South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)",
  updated: "2026-08-11",
} as const;
const VERIFIED = "2026-09-03";
const pv = 1;

export const SC_AREAS: readonly RegArea[] = [
  {
    id: "sc-state-waters",
    authority: "sc-dnr",
    kind: "ocean_region",
    name: "South Carolina — state waters (saltwater-freshwater line to 3 nm)",
    polygon: [[-80.9, 33.85], [-78.5, 32.1], [-80.85, 32.05], [-81.1, 32.5], [-80.9, 33.85]],
    sourceUrl: SC.url, verifiedAt: VERIFIED, notes: "Red drum possession prohibited in federal waters.",
  },
];

function rule(r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const SC_RULES: readonly RegRule[] = [
  rule({
    id: "sc-red-drum", speciesId: "red_drum", regAreaId: "sc-state-waters", kind: "bag_limit",
    verbatim: "Red Drum: 1 per person per day (state waters) not to exceed 2 per boat per day. Possession prohibited in federal waters. 18-inch to 25-inch TL. May only be taken by rod & reel and gig. May not be harvested by gig Dec. 1 - Feb. 28. Effective July 1, 2026 (Act No. 231).",
    sourceUrl: SC.url, sourceTitle: SC.title, sourceUpdatedAt: SC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: 25, sizeMeasure: "total_length", platformScope: null, depthNote: "2 per boat cap.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "sc-seatrout", speciesId: "spotted_seatrout", regAreaId: "sc-state-waters", kind: "bag_limit",
    verbatim: "Spotted Seatrout: 10 per person per day. 14-inch TL. May only be taken by rod & reel and gig. May not be harvested by gig Dec. 1 - Feb. 28.",
    sourceUrl: SC.url, sourceTitle: SC.title, sourceUpdatedAt: SC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "sc-flounder", speciesId: "southern_flounder", regAreaId: "sc-state-waters", kind: "bag_limit",
    verbatim: "Flounders (Southern, Summer & Gulf): 5 per person per day not to exceed 10 per boat per day. 16-inch TL. Bag limit applies to hook and line or gig.",
    sourceUrl: SC.url, sourceTitle: SC.title, sourceUpdatedAt: SC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "10 per boat.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "sc-striped-bass", speciesId: "striped_bass", regAreaId: "sc-state-waters", kind: "season",
    verbatim: "Striped Bass: Possession prohibited: June 16 - Sept. 30 except in lower reach of the Savannah River. 3 fish per person per day: Oct. 1 - June 15 except in lower reach of the Savannah River. 26 inch TL. May only be taken by rod & reel.",
    sourceUrl: SC.url, sourceTitle: SC.title, sourceUpdatedAt: SC.updated, verifiedAt: VERIFIED,
    seasonStart: "10-01", seasonEnd: "06-15", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 26, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Closed Jun 16–Sep 30 (wraps New Year).",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "sc-black-drum", speciesId: "black_drum", regAreaId: "sc-state-waters", kind: "bag_limit",
    verbatim: "Black Drum: 5 per person per day. 14-inch to 27-inch TL.",
    sourceUrl: SC.url, sourceTitle: SC.title, sourceUpdatedAt: SC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "sc-sheepshead", speciesId: "sheepshead", regAreaId: "sc-state-waters", kind: "bag_limit",
    verbatim: "Sheepshead: 10 per person per day not to exceed 30 per boat per day. 14-inch TL.",
    sourceUrl: SC.url, sourceTitle: SC.title, sourceUpdatedAt: SC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "30 per boat.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "sc-weakfish", speciesId: "weakfish", regAreaId: "sc-state-waters", kind: "bag_limit",
    verbatim: "Weakfish: 1 per person per day. 12-inch TL.",
    sourceUrl: SC.url, sourceTitle: SC.title, sourceUpdatedAt: SC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "sc-bluefish", speciesId: "bluefish", regAreaId: "sc-state-waters", kind: "bag_limit",
    verbatim: "Bluefish: 5 per person per day (7 per person in the for-hire fishery).",
    sourceUrl: SC.url, sourceTitle: SC.title, sourceUpdatedAt: SC.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "For-hire 7.",
    checkInseason: true, staleAfterDays: 60,
  }),
];

export const SOUTH_CAROLINA = { pack: SOUTH_CAROLINA_PACK, areas: SC_AREAS, groups: [], rules: SC_RULES };
