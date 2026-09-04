/**
 * Connecticut pack — `connecticut-2026-09-03`. Atlantic wave 3.
 *
 * Verbatims lifted 2026-09-03 from DEEP Saltwater Fishing Guide — Species
 * Regulations (2026 BSB + bluefish changes; remaining rows status quo 2025).
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const CONNECTICUT_PACK: RegPack = {
  id: "connecticut-2026-09-03",
  version: 2,
  publishedAt: "2026-09-04T22:00:00Z",
  notes:
    "Connecticut DEEP v2: v1 table plus red drum 27\" max @1; American shad closed in LIS (CT River only).",
};

const CT = {
  url: "https://portal.ct.gov/deep/fishing/saltwater-fishing-guide/species-regulations",
  title: "Connecticut DEEP — Saltwater Fishing Guide: Species Regulations",
  updated: "2026-01-01",
} as const;
const VERIFIED = "2026-09-03";
const pv = 2;

export const CT_AREAS: readonly RegArea[] = [
  {
    id: "ct-lis",
    authority: "ct-deep",
    kind: "ocean_region",
    name: "Connecticut — Long Island Sound / tidal waters",
    polygon: [
      [-73.66, 41.3], [-71.85, 41.4], [-71.85, 41.15], [-73.66, 40.95], [-73.66, 41.3],
    ],
    sourceUrl: CT.url,
    verifiedAt: VERIFIED,
    notes: "Possession in CT waters/shore must meet CT size/season/creel regardless of where taken.",
  },
];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const CT_RULES: readonly RegRule[] = [
  rule({
    id: "ct-striped-bass", speciesId: "striped_bass", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Striped Bass: No person shall possess any striped bass less than 28 inches or greater than or equal to 31 inches measured from the tip of the snout to the end of the tail. Daily creel limit: 1 fish per angler. Open Season: Open Year Round.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-striped-bass-circle", speciesId: "striped_bass", regAreaId: "ct-lis", kind: "gear",
    verbatim: "Inline circle hook required when fishing with bait (does not apply to artificial lures).",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-fluke-early", speciesId: "summer_flounder", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Summer Flounder (Fluke): Open Season: May 4 - August 1; 19 inch minimum length. Daily creel limit: 3 fish per angler.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "05-04", seasonEnd: "08-01", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 19, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Enhanced shore sites 17\".",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-fluke-late", speciesId: "summer_flounder", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Summer Flounder (Fluke): Open Season: August 2 - October 15; 19.5 inch minimum length. Daily creel limit: 3 fish per angler.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "08-02", seasonEnd: "10-15", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 19.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Enhanced shore sites 17\".",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-tautog-apr", speciesId: "tautog", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Tautog (Blackfish): Minimum length 16 inches. Open Season: April 1 - April 30, 2 fish per angler.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "04-30", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-tautog-summer", speciesId: "tautog", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Tautog (Blackfish): Minimum length 16 inches. Open Season: July 1 - August 31, 2 fish per angler.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "08-31", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-tautog-fall", speciesId: "tautog", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Tautog (Blackfish): Minimum length 16 inches. Open Season: October 10 - November 28, 3 fish per angler.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "10-10", seasonEnd: "11-28", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-tautog-apr-season", speciesId: "tautog", regAreaId: "ct-lis", kind: "season",
    verbatim: "Tautog (Blackfish) open April 1-April 30, July 1-August 31, and October 10-November 28.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "04-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-tautog-summer-season", speciesId: "tautog", regAreaId: "ct-lis", kind: "season",
    verbatim: "Tautog (Blackfish) open July 1 - August 31.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "08-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-tautog-fall-season", speciesId: "tautog", regAreaId: "ct-lis", kind: "season",
    verbatim: "Tautog (Blackfish) open October 10 - November 28.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "10-10", seasonEnd: "11-28", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-scup-shore", speciesId: "scup", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Scup (Porgy): Minimum length 9.5 inches for shore anglers (including Enhanced Opportunity Fishing Sites). Daily creel limit 30 fish per angler. Open Season: May 1 - December 31.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "12-31", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 9.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "shore", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-scup-boat", speciesId: "scup", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Scup (Porgy): Minimum length 11 inches for boat anglers. Daily creel limit 30 fish per angler. Open Season: May 1 - December 31.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "12-31", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 11, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "boat", depthNote: "Party/charter bonus 40 Sep 1–Oct 31 for paying passengers.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-bluefish", speciesId: "bluefish", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Bluefish: Minimum length None. Daily creel limit: 5 fish per angler (including \"snappers\") (New for 2026). Open Season: Open Year Round. Party/Charter Vessel: for paying passengers only - daily creel limit, 7 fish per angler. (New for 2026)",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "For-hire 7.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ct-bsb", speciesId: "black_sea_bass", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Black Sea Bass: Minimum length 15.5 inches (New for 2026). Daily creel limit: 4 fish per angler (New for 2026). Open Season: May 16 - November 25 (no mid-season closure) (New for 2026). Excluding tail fin filament (tendril).",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "05-16", seasonEnd: "11-25", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 15.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Filament excluded. Party/charter 4 then 6 Sep 1–Dec 31.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ct-weakfish", speciesId: "weakfish", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Weakfish (Sea Trout): Minimum length 16 inches. Daily creel limit 1 fish per angler. Open Season: Open Year Round.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ct-winter-flounder", speciesId: "winter_flounder", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Winter Flounder: Minimum length 12 inches. Daily creel limit 2 fish per angler. Open Season: Open April 1 - December 31.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "12-31", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ct-eel", speciesId: "american_eel", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "American Eel: Minimum length 9 inches. Daily creel limit 25 fish per angler. Open Season: Open Year Round.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: 9, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ct-river-herring", speciesId: "river_herring", regAreaId: "ct-lis", kind: "prohibited",
    verbatim: "River Herring: Alewife / Blueback Herring. The taking of anadromous alewife and blueback herring is prohibited from all Connecticut waters, including Long Island Sound.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ct-red-drum", speciesId: "red_drum", regAreaId: "ct-lis", kind: "bag_limit",
    verbatim: "Red Drum (Redfish): Maximum length: 27 inches. Daily creel limit: 1 fish per angler. Open Season: Open Year Round.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ct-american-shad", speciesId: "american_shad", regAreaId: "ct-lis", kind: "prohibited",
    verbatim: "American Shad: all state waters closed, except the Connecticut River System.",
    sourceUrl: CT.url, sourceTitle: CT.title, sourceUpdatedAt: CT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Open only on the Connecticut River System.",
    checkInseason: false, staleAfterDays: 90,
  }),
];

export const CONNECTICUT = {
  pack: CONNECTICUT_PACK,
  areas: CT_AREAS,
  groups: [],
  rules: CT_RULES,
};
