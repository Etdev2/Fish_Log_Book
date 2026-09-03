/**
 * Maryland pack — `maryland-2026-09-03`. Atlantic wave 4.
 * DNR public notices (Atlantic stripers 1/1/2026; summer flounder 4/19/2026)
 * and DNR-FS-2025-3 Chesapeake seasons effective 4/1/2026.
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const MARYLAND_PACK: RegPack = {
  id: "maryland-2026-09-03",
  version: 1,
  publishedAt: "2026-09-03T22:00:00Z",
  notes:
    "Maryland DNR 2026: Atlantic coast stripers 28–31\" @1; Chesapeake 19–24\" @1 with Aug closed / Dec 6–31 C&R; state-water fluke 16\" Jan–May then 17.5\" @4 year-round.",
};

const VERIFIED = "2026-09-03";
const pv = 1;
const ATL = {
  url: "https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PubNotStripedBassATLCoastRec_Effective1-1-2026.pdf",
  title: "Maryland DNR — 2026 Atlantic Coast Recreational and Charter Boat Striped Bass Fishery",
  updated: "2026-01-01",
} as const;
const FLUKE = {
  url: "https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PN_2026_SummerFlounder_Effective4_19_2026.pdf",
  title: "Maryland DNR — 2026 Summer Flounder Fishery (effective 4/19/2026)",
  updated: "2026-04-19",
} as const;
const BAY = {
  url: "https://dnr.maryland.gov/fisheries/Documents/Reg_Changes/DNR-FS-2025-3_StripedBass_RecreationalSeasons.pdf",
  title: "Maryland DNR — DNR-FS-2025-3 Striped Bass Recreational Seasons (rules effective 4/1/2026)",
  updated: "2026-04-01",
} as const;

export const MD_AREAS: readonly RegArea[] = [
  {
    id: "md-atlantic",
    authority: "md-dnr",
    kind: "ocean_region",
    name: "Maryland — Atlantic Ocean, coastal bays and tributaries",
    polygon: [[-75.4, 38.45], [-75.0, 38.0], [-74.9, 38.45], [-75.05, 38.55], [-75.4, 38.45]],
    sourceUrl: ATL.url, verifiedAt: VERIFIED, notes: "Does not apply to Chesapeake Bay.",
  },
  {
    id: "md-chesapeake",
    authority: "md-dnr",
    kind: "ocean_region",
    name: "Maryland — Chesapeake Bay and tidal tributaries",
    polygon: null,
    sourceUrl: BAY.url, verifiedAt: VERIFIED, notes: "Excludes Susquehanna Flats specials.",
  },
];

function rule(r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const MD_RULES: readonly RegRule[] = [
  rule({
    id: "md-atl-striped-bass", speciesId: "striped_bass", regAreaId: "md-atlantic", kind: "bag_limit",
    verbatim: "Effective 12:01 a.m. January 1, 2026: Anglers may keep one striped bass per person per day from the Atlantic Ocean, its coastal bays, and their tributaries. The minimum size for striped bass is 28 inches, total length. The maximum size is 31 inches, total length.",
    sourceUrl: ATL.url, sourceTitle: ATL.title, sourceUpdatedAt: ATL.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "md-bay-striped-bass-fall", speciesId: "striped_bass", regAreaId: "md-chesapeake", kind: "bag_limit",
    verbatim: "RULES FOR STRIPED BASS EFFECTIVE 4/1/2026 Chesapeake Bay and Tidal Tributaries: SEP. 1–DEC. 5 All areas open. 1 fish per day. Must be at least 19\" and cannot exceed 24\". Circle hook rules remain the same.",
    sourceUrl: BAY.url, sourceTitle: BAY.title, sourceUpdatedAt: BAY.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "12-05", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 19, maxSizeIn: 24, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "md-bay-striped-bass-aug", speciesId: "striped_bass", regAreaId: "md-chesapeake", kind: "season",
    verbatim: "AUG. 1–AUG. 31 All areas closed to striped bass fishing. CLOSED. Attempting to catch striped bass is illegal during this time period. No targeting.",
    sourceUrl: BAY.url, sourceTitle: BAY.title, sourceUpdatedAt: BAY.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "12-05", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Aug closed; Dec 6–31 C&R only.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "md-fluke-late", speciesId: "summer_flounder", regAreaId: "md-atlantic", kind: "bag_limit",
    verbatim: "In State waters, the season is open January 1, 2026 – December 31, 2026. The minimum size is 17-1/2 inches from June 1, 2026 through December 31, 2026. In State waters, anglers may keep up to 4 fish per person per day.",
    sourceUrl: FLUKE.url, sourceTitle: FLUKE.title, sourceUpdatedAt: FLUKE.updated, verifiedAt: VERIFIED,
    seasonStart: "06-01", seasonEnd: "12-31", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 17.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Federal waters 18.5\" @3 May 8–Sep 30.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "md-fluke-early", speciesId: "summer_flounder", regAreaId: "md-atlantic", kind: "bag_limit",
    verbatim: "In State waters: The minimum size is 16 inches from January 1, 2026 through May 31, 2026. In State waters, anglers may keep up to 4 fish per person per day.",
    sourceUrl: FLUKE.url, sourceTitle: FLUKE.title, sourceUpdatedAt: FLUKE.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "05-31", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
];

export const MARYLAND = { pack: MARYLAND_PACK, areas: MD_AREAS, groups: [], rules: MD_RULES };
