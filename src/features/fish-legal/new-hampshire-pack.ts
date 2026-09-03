/**
 * New Hampshire pack — `new-hampshire-2026-09-03`. Atlantic wave 3.
 *
 * Verbatims lifted 2026-09-03 from NH Fish & Game saltwater eRegulations
 * Recreational & Commercial Regulations (Last Updated August 17, 2026).
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const NEW_HAMPSHIRE_PACK: RegPack = {
  id: "new-hampshire-2026-09-03",
  version: 1,
  publishedAt: "2026-09-03T21:00:00Z",
  notes:
    "New Hampshire F&G saltwater recreational table (updated 2026-08-17): stripers 28–<31\" @1 year-round + circle hooks/gaff/cull bans; BSB 16.5\" @4 year-round; bluefish 5/7; cod 23\" @1 Sep 1–Oct 31 (closed Nov 1–Aug 31); haddock 17\" @15 except March; winter flounder 12\" @8; fluke 15\" no bag; shad/salmon/wolffish/ocean pout/windowpane prohibited.",
};

const NH = {
  url: "https://www.eregulations.com/newhampshire/fishing/saltwater/recreational-commercial-regulations",
  title: "New Hampshire Fish & Game — Saltwater Recreational & Commercial Regulations",
  updated: "2026-08-17",
} as const;
const VERIFIED = "2026-09-03";
const pv = 1;

export const NH_AREAS: readonly RegArea[] = [
  {
    id: "nh-coast",
    authority: "nh-fg",
    kind: "ocean_region",
    name: "New Hampshire — coastal / state marine waters",
    polygon: [
      [-70.9, 43.05], [-70.55, 42.85], [-70.55, 43.1], [-70.85, 43.15], [-70.9, 43.05],
    ],
    sourceUrl: NH.url,
    verifiedAt: VERIFIED,
    notes: "Envelope of the 18-mile seacoast + Great Bay approaches. Federal waters follow NOAA.",
  },
];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const NH_RULES: readonly RegRule[] = [
  rule({
    id: "nh-striped-bass", speciesId: "striped_bass", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "Striped Bass Recreational: Closed Season: No closed season. Minimum Length: 28 inches to less than 31 inches. Daily Bag Limit: 1 fish per day.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nh-striped-bass-gear", speciesId: "striped_bass", regAreaId: "nh-coast", kind: "gear",
    verbatim: "Striped Bass Special Rules: Gaffing and culling are prohibited; No sale allowed, regardless of origin. Non-offset, corrodible circle hooks required if angling with bait. Head and tail must be intact while on or leaving the waters or shores of the state except may possess up to 2 fillets with skin intact and possess fish rack ≥ 28\" and less than 31\" TL with head/tail intact that fillets came from. Total length is the straight-line distance from the tip of the snout to the tip of the tail (caudal fin) when the tail is squeezed to its maximum length while the fish is laying on its side.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nh-bsb", speciesId: "black_sea_bass", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "Black Sea Bass Recreational: Closed Season: No closed season. Minimum Length: 16.5 inches. Daily Bag Limit: 4 fish per day. Special Rules: Length does not include filament/tail extension.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Filament excluded.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nh-bluefish", speciesId: "bluefish", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "Bluefish Recreational: Closed Season: No closed season. Minimum Length: No minimum length. Daily Bag Limit: 5 fish harvest or possession per day for private anglers. 7 fish harvest or possession per day for anglers on licensed for-hire fishing vessels. Special Rules: Non-offset, corrodible circle hooks required if angling with bait.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "For-hire 7.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nh-cod", speciesId: "atlantic_cod", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "Atlantic Cod Recreational: Closed Season: Nov. 1 – Aug. 31. Minimum Length: 23 inches. Daily Bag Limit: 1 fish per day.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "10-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 23, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Open Sep 1–Oct 31 only.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "nh-cod-closed", speciesId: "atlantic_cod", regAreaId: "nh-coast", kind: "season",
    verbatim: "Atlantic Cod Recreational: Closed Season: Nov. 1 – Aug. 31.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "10-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "nh-haddock", speciesId: "haddock", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "Haddock Recreational: Closed Season: March 1 – March 31. Minimum Length: 17 inches. Daily Bag Limit: 15 fish per day.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "02-28", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 17, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Closed March; window wraps New Year's.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nh-winter-flounder", speciesId: "winter_flounder", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "Winter Flounder Recreational: Closed Season: No closed season. Minimum Length: 12 inches. Daily Bag Limit: 8 fish per day.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 8, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nh-fluke", speciesId: "summer_flounder", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "Summer Flounder Recreational: Closed Season: No closed season. Minimum Length: 15 inches. Daily Bag Limit: No bag limit. Special Rules: Sale is prohibited.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No bag limit.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nh-halibut", speciesId: "atlantic_halibut", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "Atlantic Halibut Recreational: Closed Season: No closed season. Minimum Length: 41 inches. Daily Bag Limit: 1 fish per trip/vessel.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 41, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Per trip/vessel.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nh-mackerel", speciesId: "atlantic_mackerel", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "Atlantic Mackerel Recreational: Closed Season: No closed season. Minimum Length: No minimum length. Daily Bag Limit: 25 fish harvest or possession per day for private anglers. 50 fish harvest or possession per day for anglers on licensed for-hire fishing vessels.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "For-hire 50.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nh-eel", speciesId: "american_eel", regAreaId: "nh-coast", kind: "bag_limit",
    verbatim: "American Eel Recreational: Closed Season: No closed season (except surrounding fishways). Minimum Length: 9 inches. Daily Bag Limit: 25 fish per day.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: 9, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Fishway closures Oct 2–Jun 14.",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "nh-shad-prohibited", speciesId: "american_shad", regAreaId: "nh-coast", kind: "prohibited",
    verbatim: "American Shad Recreational: Closed Season: Closed year round. Possession prohibited. Special Rules: All shad must be immediately released.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "nh-wolffish-prohibited", speciesId: "atlantic_wolffish", regAreaId: "nh-coast", kind: "prohibited",
    verbatim: "Atlantic Wolffish Recreational: Closed Season: Closed year round. Possession is prohibited.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "nh-ocean-pout-prohibited", speciesId: "ocean_pout", regAreaId: "nh-coast", kind: "prohibited",
    verbatim: "Ocean Pout Recreational: Closed Season: Closed year round. Possession is prohibited.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "nh-windowpane-prohibited", speciesId: "windowpane_flounder", regAreaId: "nh-coast", kind: "prohibited",
    verbatim: "Windowpane Flounder Recreational: Closed Season: Closed year round. Possession is prohibited.",
    sourceUrl: NH.url, sourceTitle: NH.title, sourceUpdatedAt: NH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
];

export const NEW_HAMPSHIRE = {
  pack: NEW_HAMPSHIRE_PACK,
  areas: NH_AREAS,
  groups: [],
  rules: NH_RULES,
};
