/**
 * Rhode Island pack — `rhode-island-2026-09-03`. Atlantic wave 2.
 *
 * Verbatims lifted 2026-09-03 from DEM Marine Fisheries Minimum Sizes & Possession
 * Limits, Recreational Marine Fisheries table (Rev. 9/1/2026).
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const RHODE_ISLAND_PACK: RegPack = {
  id: "rhode-island-2026-09-03",
  version: 2,
  publishedAt: "2026-09-04T23:30:00Z",
  notes:
    "Rhode Island DEM v2: v1 rec table plus dab 14\" no bag; monkfish 17\" whole; witch 14\" no bag; yellowtail 13\" no bag. No cobia/Spanish/king on Rev 9/1/2026 rec table.",
};

const RI = {
  url: "https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits",
  title: "Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)",
  updated: "2026-09-01",
} as const;
const VERIFIED = "2026-09-03";
const pv = 2;

export const RI_AREAS: readonly RegArea[] = [
  {
    id: "ri-statewide",
    authority: "ri-dem",
    kind: "ocean_region",
    name: "Rhode Island — coastal waters envelope",
    polygon: [
      [-71.9, 41.85], [-71.12, 41.85], [-71.12, 41.15], [-71.9, 41.15], [-71.9, 41.85],
    ],
    sourceUrl: RI.url,
    verifiedAt: VERIFIED,
    notes: "Envelope (Narragansett Bay + Block Island Sound). State-waters table.",
  },
  {
    id: "ri-narragansett-north-colregs",
    authority: "ri-dem",
    kind: "conservation_area",
    name: "Narragansett Bay north of the Colregs Line + Potter Pond, Point Judith Pond, Harbor of Refuge",
    polygon: null,
    sourceUrl: RI.url,
    verifiedAt: VERIFIED,
    notes: "Winter flounder harvest/possession prohibited.",
  },
];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const RI_RULES: readonly RegRule[] = [
  rule({
    id: "ri-striped-bass-slot", speciesId: "striped_bass", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Striped Bass: 28\"-<31\". Season 1/1 - 12/31. Possession limit: 1 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: "Slot 28\" to less than 31\".",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-striped-bass-circle", speciesId: "striped_bass", regAreaId: "ri-statewide", kind: "gear",
    verbatim: "Striped Bass Circle Hook Provision: Required when fishing recreationally for striped bass with bait.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-bluefish-general", speciesId: "bluefish", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Bluefish General Recreational: No minimum. 1/1 - 12/31. 5 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Party and Charter: 7 fish/person/day.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ri-scup-shore", speciesId: "scup", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Scup Shore: 9.5\". 5/1 - 12/31. 30 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "12-31", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 9.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "shore", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-scup-vessel", speciesId: "scup", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Scup Private and Rental: 11\". 5/1 - 12/31. 30 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "12-31", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 11, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "boat", depthNote: "Party/charter: 30 May 1–Aug 31; 40 Sep 1–Oct 31; 30 Nov 1–Dec 31.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-fluke", speciesId: "summer_flounder", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Summer Flounder (Fluke): 19\". 4/1 - 12/31. 6 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "12-31", bagDaily: 6, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 19, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null,
    depthNote: "Special shore sites: up to 2 fish 17\"+ count toward the 6; remainder 19\"+.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-fluke-season", speciesId: "summer_flounder", regAreaId: "ri-statewide", kind: "season",
    verbatim: "Summer Flounder (Fluke): open 4/1 - 12/31.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-tautog-spring", speciesId: "tautog", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Tautog: 16\". Only one fish may be greater than 21\". Max of 10 fish/vsl during all periods. 4/1 - 5/31: 3 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "05-31", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish >21\"; vessel cap 10.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-tautog-closed", speciesId: "tautog", regAreaId: "ri-statewide", kind: "season",
    verbatim: "Tautog: 6/1 - 7/31 CLOSED.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "06-01", seasonEnd: "07-31", bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Closed.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-tautog-late", speciesId: "tautog", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Tautog: 16\". Only one fish may be greater than 21\". 8/1 - 10/14: 3 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "08-01", seasonEnd: "10-14", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish >21\"; vessel cap 10.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-tautog-fall", speciesId: "tautog", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Tautog: 16\". Only one fish may be greater than 21\". 10/15 - 12/31: 5 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "10-15", seasonEnd: "12-31", bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish >21\"; vessel cap 10.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-bsb-general", speciesId: "black_sea_bass", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Black Sea Bass General Recreational: 16\". 5/16 - 12/31. 3 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "05-16", seasonEnd: "12-31", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Party/charter: 4 May 16–Aug 31; 6 Sep 1–Dec 31.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-cod-prohibited", speciesId: "atlantic_cod", regAreaId: "ri-statewide", kind: "prohibited",
    verbatim: "Cod: NA. 1/1 - 12/31. Prohibited.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ri-weakfish", speciesId: "weakfish", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Weakfish (Squeteague): 16\". 1/1 - 12/31. 1 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ri-winter-flounder", speciesId: "winter_flounder", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Winter Flounder (Blackback): 12\". 3/1 - 12/31. 2 fish/person/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: "03-01", seasonEnd: "12-31", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ri-winter-flounder-nb-prohibited", speciesId: "winter_flounder", regAreaId: "ri-narragansett-north-colregs", kind: "prohibited",
    verbatim: "The harvesting or possession of winter flounder is PROHIBITED in Narragansett Bay north of the Colregs Line of Demarcation as well as in Potter Pond, Point Judith Pond, and the Harbor of Refuge.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ri-eel", speciesId: "american_eel", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "American eel: 9\". 1/1 - 12/31. 25 eels/person/day. 50 eels/vsl/day for licensed party/charter vessels.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: 9, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Party/charter vessel 50/day.",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ri-haddock", speciesId: "haddock", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Haddock: 18\". 1/1 - 12/31. No limit.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No possession limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ri-pollock", speciesId: "pollock", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Pollock: 19\". 1/1 - 12/31. No limit.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 19, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No possession limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ri-plaice", speciesId: "american_plaice", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "American plaice (dab): 14\". 1/1 - 12/31. No limit.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No possession limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ri-monkfish", speciesId: "monkfish", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Monkfish (Goosefish): 17\" whole / 11\" tail. 1/1 - 12/31. 50 lbs tails/day or 166 lbs whole/day.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 17, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "50 lbs tails/day or 166 lbs whole/day.",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ri-witch", speciesId: "witch_flounder", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Witch Flounder (Gray Sole): 14\". 1/1 - 12/31. No limit.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No possession limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ri-yellowtail", speciesId: "yellowtail_flounder", regAreaId: "ri-statewide", kind: "bag_limit",
    verbatim: "Yellowtail Flounder: 13\". 1/1 - 12/31. No limit.",
    sourceUrl: RI.url, sourceTitle: RI.title, sourceUpdatedAt: RI.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No possession limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
];

export const RHODE_ISLAND = {
  pack: RHODE_ISLAND_PACK,
  areas: RI_AREAS,
  groups: [],
  rules: RI_RULES,
};
