/**
 * Maryland pack — `maryland-2026-09-03`. Atlantic wave 4.
 * DNR public notices (Atlantic stripers 1/1/2026; summer flounder 4/19/2026)
 * and DNR-FS-2025-3 Chesapeake seasons effective 4/1/2026.
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const MARYLAND_PACK: RegPack = {
  id: "maryland-2026-09-03",
  version: 2,
  publishedAt: "2026-09-03T23:45:00Z",
  notes:
    "Maryland DNR 2026 v2: Atlantic stripers 28–31\" @1; Bay 19–24\" @1 Sep 1–Dec 5 (Aug closed); fluke 16\" then 17.5\" @4; tautog 16\" closed May 16–Jun 30 (2/day Jul–Oct, 4/day Nov–May 15); red drum 18–27\" @1; black drum 16\" @1 / 6 boat; specks 14\" @4; weakfish 13\" @1; Spanish mackerel 14\" @15.",
};

const VERIFIED = "2026-09-03";
const pv = 2;
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
  rule({
    id: "md-tautog-summer", speciesId: "tautog", regAreaId: "md-atlantic", kind: "bag_limit",
    verbatim: "From July 1 through October 31, an individual may not catch and possess more than two tautog per day. An individual may not catch or possess a tautog less than 16 inches total length; and a tautog from May 16 through June 30.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-20",
    sourceTitle: "COMAR 08.02.05.20 — Tautog", sourceUpdatedAt: "2020-07-16", verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "10-31", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "md-tautog-winter", speciesId: "tautog", regAreaId: "md-atlantic", kind: "bag_limit",
    verbatim: "From November 1 through May 15 of the following year, an individual may not catch and possess more than four tautog per day.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-20",
    sourceTitle: "COMAR 08.02.05.20 — Tautog", sourceUpdatedAt: "2020-07-16", verifiedAt: VERIFIED,
    seasonStart: "11-01", seasonEnd: "05-15", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "md-tautog-summer-season", speciesId: "tautog", regAreaId: "md-atlantic", kind: "season",
    verbatim: "An individual may not catch or possess a tautog from May 16 through June 30.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-20",
    sourceTitle: "COMAR 08.02.05.20 — Tautog", sourceUpdatedAt: "2020-07-16", verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "10-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "md-tautog-winter-season", speciesId: "tautog", regAreaId: "md-atlantic", kind: "season",
    verbatim: "Tautog recreational open November 1 through May 15 (closed May 16–June 30).",
    sourceUrl: "https://news.maryland.gov/dnr/2026/03/04/maryland-fishing-report-march-4-2/",
    sourceTitle: "Maryland DNR — Fishing Report March 4, 2026 (tautog 2026 season)", sourceUpdatedAt: "2026-03-04", verifiedAt: VERIFIED,
    seasonStart: "11-01", seasonEnd: "05-15", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "md-red-drum", speciesId: "red_drum", regAreaId: "md-atlantic", kind: "bag_limit",
    verbatim: "A person may not catch or possess red drum less than 18 inches in total length or greater than 27 inches in total length. A person may not catch or possess more than one red drum per day.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-16",
    sourceTitle: "COMAR 08.02.05.16 — Red Drum", sourceUpdatedAt: "2009-10-19", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "md-red-drum-bay", speciesId: "red_drum", regAreaId: "md-chesapeake", kind: "bag_limit",
    verbatim: "A person may not catch or possess red drum less than 18 inches in total length or greater than 27 inches in total length. A person may not catch or possess more than one red drum per day.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-16",
    sourceTitle: "COMAR 08.02.05.16 — Red Drum", sourceUpdatedAt: "2009-10-19", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "md-black-drum", speciesId: "black_drum", regAreaId: "md-atlantic", kind: "bag_limit",
    verbatim: "The daily catch and possession limit per individual is one black drum. The daily catch and possession limit per boat is six black drum. A person may not catch or possess black drum less than 16 inches in total length.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-15",
    sourceTitle: "COMAR 08.02.05.15 — Black Drum", sourceUpdatedAt: "2019-12-30", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "6 per boat.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "md-black-drum-bay", speciesId: "black_drum", regAreaId: "md-chesapeake", kind: "bag_limit",
    verbatim: "The daily catch and possession limit per individual is one black drum. The daily catch and possession limit per boat is six black drum. A person may not catch or possess black drum less than 16 inches in total length.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-15",
    sourceTitle: "COMAR 08.02.05.15 — Black Drum", sourceUpdatedAt: "2019-12-30", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "6 per boat.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "md-seatrout", speciesId: "spotted_seatrout", regAreaId: "md-chesapeake", kind: "bag_limit",
    verbatim: "A recreational angler may not catch or possess spotted sea trout less than 14 inches in total length. Except for a person licensed to catch finfish for sale, a person may not catch or possess more than one weakfish and four spotted sea trout per day.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-13",
    sourceTitle: "COMAR 08.02.05.13 — Weakfish and Spotted Sea Trout", sourceUpdatedAt: "2014-04-14", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "md-weakfish", speciesId: "weakfish", regAreaId: "md-chesapeake", kind: "bag_limit",
    verbatim: "A recreational angler may not catch or possess weakfish less than 13 inches in total length. Except for a person licensed to catch finfish for sale, a person may not catch or possess more than one weakfish and four spotted sea trout per day.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-13",
    sourceTitle: "COMAR 08.02.05.13 — Weakfish and Spotted Sea Trout", sourceUpdatedAt: "2014-04-14", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "md-spanish-mackerel", speciesId: "spanish_mackerel", regAreaId: "md-atlantic", kind: "bag_limit",
    verbatim: "An individual may not catch or possess a Spanish mackerel less than 14 inches total length. An individual may not catch or possess more than 15 Spanish mackerel per day. The recreational season for catching Spanish mackerel is January 1 through December 31.",
    sourceUrl: "https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-14",
    sourceTitle: "COMAR 08.02.05.14 — Spanish Mackerel", sourceUpdatedAt: "2012-07-23", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
];

export const MARYLAND = { pack: MARYLAND_PACK, areas: MD_AREAS, groups: [], rules: MD_RULES };
