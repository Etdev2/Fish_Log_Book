/**
 * New York pack — `new-york-2026-09-03`. Atlantic wave 2.
 *
 * Verbatims lifted 2026-09-03 from DEC Recreational Saltwater Fishing Regulations
 * (table last changed May 12, 2026).
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const NEW_YORK_PACK: RegPack = {
  id: "new-york-2026-09-03",
  version: 1,
  publishedAt: "2026-09-03T18:00:00Z",
  notes:
    "New York (DEC recreational saltwater table, last changed 2026-05-12): marine stripers 28–31\" @1 Apr 15–Dec 15 (Hudson north of GWB 23–28\" Apr 1–Nov 30); fluke 19\" May 4–Aug 1 then 19.5\" Aug 2–Oct 15 @3; BSB 16\" 3 then 6; scup shore 9.5\" / vessel 11\" @30; tautog LIS vs NY Bight split; bluefish 5/7; winter flounder Apr 1–May 30 @2.",
};

const NY = {
  url: "https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations",
  title: "NYSDEC — Recreational Saltwater Fishing Regulations",
  updated: "2026-05-12",
} as const;
const VERIFIED = "2026-09-03";
const pv = 1;

export const NY_AREAS: readonly RegArea[] = [
  {
    id: "ny-marine",
    authority: "ny-dec",
    kind: "ocean_region",
    name: "New York — Marine & Coastal District (south of George Washington Bridge)",
    polygon: [
      [-74.26, 40.92], [-71.85, 41.3], [-71.85, 40.5], [-73.9, 40.4], [-74.26, 40.5], [-74.26, 40.92],
    ],
    sourceUrl: NY.url,
    verifiedAt: VERIFIED,
    notes: "Envelope for marine waters beginning at the Hudson south of the GWB + ocean/bays.",
  },
  {
    id: "ny-hudson-north-gwb",
    authority: "ny-dec",
    kind: "ocean_region",
    name: "Hudson River north of the George Washington Bridge",
    polygon: null,
    sourceUrl: NY.url,
    verifiedAt: VERIFIED,
    notes: "Striped bass slot 23–28\"; river herring possession allowed Mar 15–Jun 15.",
  },
  {
    id: "ny-lis",
    authority: "ny-dec",
    kind: "ocean_region",
    name: "Long Island Sound Region (east of Throgs Neck Bridge, west of Orient Point–Watch Hill line)",
    polygon: null,
    sourceUrl: NY.url,
    verifiedAt: VERIFIED,
    notes: "Tautog LIS windows.",
  },
  {
    id: "ny-bight",
    authority: "ny-dec",
    kind: "ocean_region",
    name: "NY Bight Region (marine waters outside the Long Island Sound Region)",
    polygon: null,
    sourceUrl: NY.url,
    verifiedAt: VERIFIED,
    notes: "Tautog NY Bight windows.",
  },
];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const NY_RULES: readonly RegRule[] = [
  rule({
    id: "ny-striped-bass-marine", speciesId: "striped_bass", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Striped Bass: marine waters (beginning at the Hudson River south of George Washington Bridge) & Delaware River: Slot size 28\" - 31\". Possession 1. Open April 15 - Dec 15.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "04-15", seasonEnd: "12-15", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-striped-bass-hudson", speciesId: "striped_bass", regAreaId: "ny-hudson-north-gwb", kind: "bag_limit",
    verbatim: "Striped Bass: Hudson River (north of George Washington Bridge): Slot size 23\" - 28\". Possession 1. Open April 1 - Nov 30.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "11-30", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 23, maxSizeIn: 28, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-striped-bass-circle", speciesId: "striped_bass", regAreaId: "ny-marine", kind: "gear",
    verbatim: "Non-offset (inline) circle hooks must be used when recreationally fishing for striped bass using bait defined as any live or dead, whole or part of a marine or aquatic organism or terrestrial invertebrate. Exemption: Circle hooks are not required when fishing with an artificial lure, whether or not they are tipped with bait as previously defined.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-fluke-early", speciesId: "summer_flounder", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Summer flounder (fluke): 19\". Possession 3. Open May 4 - Aug 1.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "05-04", seasonEnd: "08-01", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 19, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No head/tail removal at sea except white-side fillet for bait.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-fluke-late", speciesId: "summer_flounder", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Summer flounder (fluke): 19.5\". Possession 3. Open Aug 2 - Oct 15.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "08-02", seasonEnd: "10-15", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 19.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No head/tail removal at sea except white-side fillet for bait.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-bsb-early", speciesId: "black_sea_bass", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Black Sea Bass: 16\". Possession 3. Open May 16 - Aug 31.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "05-16", seasonEnd: "08-31", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Tail filament excluded.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-bsb-fall", speciesId: "black_sea_bass", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Black Sea Bass: 16\". Possession 6. Open Sept 1 - Dec 31.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "12-31", bagDaily: 6, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Tail filament excluded.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-scup-shore", speciesId: "scup", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Scup (Porgy): Shore-based anglers 9.5\". Possession 30. Open May 1 - Dec 31.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "12-31", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 9.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "shore", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-scup-vessel", speciesId: "scup", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Scup (Porgy): Vessel-based anglers 11\". Possession 30. Open May 1 - Dec 31.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "12-31", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 11, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "boat", depthNote: "Party/charter: 30 May–Aug; 40 Sep–Oct; 30 Nov–Dec.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-tautog-lis-spring-season", speciesId: "tautog", regAreaId: "ny-lis", kind: "season",
    verbatim: "Tautog (blackfish): Long Island Sound Region open April 1 - April 30 and Oct 11 - Dec 9.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "04-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-tautog-lis-fall-season", speciesId: "tautog", regAreaId: "ny-lis", kind: "season",
    verbatim: "Tautog (blackfish): Long Island Sound Region open Oct 11 - Dec 9.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "10-11", seasonEnd: "12-09", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-tautog-lis-spring", speciesId: "tautog", regAreaId: "ny-lis", kind: "bag_limit",
    verbatim: "Tautog (blackfish): Long Island Sound Region: 16\". Possession 2. Open April 1 - April 30.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "04-30", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-tautog-lis-fall", speciesId: "tautog", regAreaId: "ny-lis", kind: "bag_limit",
    verbatim: "Tautog (blackfish): Long Island Sound Region: 16\". Possession 3. Open Oct 11 - Dec 9.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "10-11", seasonEnd: "12-09", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-tautog-bight-spring-season", speciesId: "tautog", regAreaId: "ny-bight", kind: "season",
    verbatim: "Tautog (blackfish): NY Bight Region open April 1 - April 30 and Oct 15 - Dec 22.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "04-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-tautog-bight-fall-season", speciesId: "tautog", regAreaId: "ny-bight", kind: "season",
    verbatim: "Tautog (blackfish): NY Bight Region open Oct 15 - Dec 22.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "10-15", seasonEnd: "12-22", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-tautog-bight-spring", speciesId: "tautog", regAreaId: "ny-bight", kind: "bag_limit",
    verbatim: "Tautog (blackfish): NY Bight Region: 16\". Possession 2. Open April 1 - April 30.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "04-30", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-tautog-bight-fall", speciesId: "tautog", regAreaId: "ny-bight", kind: "bag_limit",
    verbatim: "Tautog (blackfish): NY Bight Region: 16\". Possession 4. Open Oct 15 - Dec 22.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "10-15", seasonEnd: "12-22", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ny-bluefish", speciesId: "bluefish", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Bluefish (including \"snappers\"): No size limit. 5 for individuals. 7 for anglers aboard licensed party/charter boats. All year.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Party/charter 7.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ny-winter-flounder", speciesId: "winter_flounder", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Winter Flounder: 12\". Possession 2. Open April 1 - May 30.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "05-30", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ny-weakfish", speciesId: "weakfish", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Weakfish: 16\" (10\" filleted; 12\" dressed). Possession 1. All year.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ny-cod", speciesId: "atlantic_cod", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Atlantic cod: 23\". Possession 5. Open Sept 1 - May 31.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "05-31", bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 23, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Year-wrap window; federal SNE no-retention may be tighter.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "ny-eel", speciesId: "american_eel", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "American Eel: 9\". 25 for individuals. 50 for anglers aboard licensed party/charter boats. All year.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: 9, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ny-cobia", speciesId: "cobia", regAreaId: "ny-marine", kind: "bag_limit",
    verbatim: "Cobia: 43\". Fishing from shore: 1 per angler. Fishing from vessel: 1 per angler and a maximum of 2 per vessel. All year.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 43, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Vessel cap 2.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ny-river-herring-south", speciesId: "river_herring", regAreaId: "ny-marine", kind: "prohibited",
    verbatim: "Anadromous river herring (alewife and blueback herring) (south of George Washington Bridge): No possession allowed.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ny-american-shad", speciesId: "american_shad", regAreaId: "ny-marine", kind: "prohibited",
    verbatim: "American shad: No possession allowed.",
    sourceUrl: NY.url, sourceTitle: NY.title, sourceUpdatedAt: NY.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
];

export const NEW_YORK = {
  pack: NEW_YORK_PACK,
  areas: NY_AREAS,
  groups: [],
  rules: NY_RULES,
};
