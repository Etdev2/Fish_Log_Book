/**
 * Georgia pack — `georgia-2026-09-03`. Atlantic wave 4.
 * CRD Recreational finfish season, limits, and sizes (coastalgadnr.org/limits).
 * Red-drum 3-fish / 15–24\" proposal was still a 2026 rulemaking on the live table (5 @ 14–23).
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const GEORGIA_PACK: RegPack = {
  id: "georgia-2026-09-03",
  version: 1,
  publishedAt: "2026-09-03T22:00:00Z",
  notes:
    "Georgia CRD recreational table: red drum 14–23\" @5 rod-and-reel gamefish; speckled trout 14\" @15; flounder 12\" @15; stripers 22\" @2 saltwater / 27\" Savannah; weakfish 13\" @1.",
};

const GA = {
  url: "https://coastalgadnr.org/limits",
  title: "Georgia DNR CRD — Recreational finfish season, limits, and sizes",
  updated: "2026-01-01",
} as const;
const VERIFIED = "2026-09-03";
const pv = 1;

export const GA_AREAS: readonly RegArea[] = [
  {
    id: "ga-state-waters",
    authority: "ga-crd",
    kind: "ocean_region",
    name: "Georgia — state waters (0–3 nm)",
    polygon: [[-81.8, 32.1], [-80.8, 30.7], [-81.45, 30.7], [-81.8, 32.1]],
    sourceUrl: GA.url, verifiedAt: VERIFIED, notes: "Federal 3–200 nm follows SAFMC.",
  },
];

function rule(r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const GA_RULES: readonly RegRule[] = [
  rule({
    id: "ga-red-drum", speciesId: "red_drum", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Red Drum: Season: All year. Limit: 5. Minimum size: 14\" TL (Maximum 23\" TL). Red Drum are a gamefish in Georgia [O.C.G.A. 27-1-2 (36)(I)]. As gamefish, Red Drum may only be fished for with pole and line (rod/reel) [O.C.G.A. 27-4-5].",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: 23, sizeMeasure: "total_length", platformScope: null, depthNote: "Rod and reel only.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ga-seatrout", speciesId: "spotted_seatrout", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Spotted Seatrout: Season: All year. Limit: 15. Minimum size: 14\" TL.",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ga-flounder", speciesId: "southern_flounder", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Flounder: Season: All year. Limit: 15. Minimum size: 12\" TL.",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ga-striped-bass", speciesId: "striped_bass", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Striped Bass: Saltwater Season: All year. Limit: 2. Minimum size: 22\" TL. Savannah River Season: All year. Limit: 2. Minimum size: 27\" TL.",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 22, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Savannah River 27\" min.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ga-weakfish", speciesId: "weakfish", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Weakfish: Season: All year. Limit: 1. Minimum size: 13\" TL.",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ga-black-drum", speciesId: "black_drum", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Black Drum: Season: All year. Limit: 15. Minimum size: 14\" TL.",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ga-sheepshead", speciesId: "sheepshead", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Sheepshead: Season: All year. Limit: 15. Minimum size: 10\" FL.",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ga-cobia", speciesId: "cobia", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Cobia: Season: March 1 - Oct. 31. Limit: 1 per angler, maximum 6 per boat. Minimum size: 36\" FL.",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: "03-01", seasonEnd: "10-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 36, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "6 per boat.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ga-bluefish", speciesId: "bluefish", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Bluefish: Season: May 1 - Feb. 28 annually. Limit: 15. Minimum size: 12\" FL.",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "02-28", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "Wraps New Year's.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ga-tarpon", speciesId: "atlantic_tarpon", regAreaId: "ga-state-waters", kind: "bag_limit",
    verbatim: "Tarpon: Season: All year. Limit: 1. Minimum size: 68\" FL.",
    sourceUrl: GA.url, sourceTitle: GA.title, sourceUpdatedAt: GA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 68, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 90,
  }),
];

export const GEORGIA = { pack: GEORGIA_PACK, areas: GA_AREAS, groups: [], rules: GA_RULES };
