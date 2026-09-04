/**
 * New Jersey pack — `new-jersey-2026-09-03`. Atlantic wave 2.
 *
 * Verbatims lifted 2026-09-03 from NJDEP Fish & Wildlife Attention Anglers 2026
 * recreational size/possession/season sheet.
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const NEW_JERSEY_PACK: RegPack = {
  id: "new-jersey-2026-09-03",
  version: 2,
  publishedAt: "2026-09-04T22:00:00Z",
  notes:
    "New Jersey NJDEP v2: v1 table plus cobia 43\" @1 / 2 vessel; Spanish mackerel 14\" @10; king mackerel 23\" @3.",
};

const NJ = {
  url: "https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf",
  title: "NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons",
  updated: "2026-03-01",
} as const;
const VERIFIED = "2026-09-03";
const pv = 2;

export const NJ_AREAS: readonly RegArea[] = [
  {
    id: "nj-marine",
    authority: "nj-dep",
    kind: "ocean_region",
    name: "New Jersey — all marine waters (except named carve-outs)",
    polygon: [
      [-75.55, 39.8], [-73.9, 40.55], [-73.9, 38.85], [-75.55, 38.85], [-75.55, 39.8],
    ],
    sourceUrl: NJ.url,
    verifiedAt: VERIFIED,
    notes: "Envelope. Delaware Bay and Island Beach State Park fluke carve-outs are separate areas.",
  },
  {
    id: "nj-delaware-bay",
    authority: "nj-dep",
    kind: "ocean_region",
    name: "Delaware Bay & Tributaries (NJ)",
    polygon: null,
    sourceUrl: NJ.url,
    verifiedAt: VERIFIED,
    notes: "Fluke 17\" @3.",
  },
  {
    id: "nj-ibsp",
    authority: "nj-dep",
    kind: "ocean_region",
    name: "Island Beach State Park (shore)",
    polygon: null,
    sourceUrl: NJ.url,
    verifiedAt: VERIFIED,
    notes: "Fluke 16\" @2.",
  },
];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const NJ_RULES: readonly RegRule[] = [
  rule({
    id: "nj-striped-bass-slot", speciesId: "striped_bass", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Striped Bass or Hybrid Striped Bass: 1 fish at 28 inches to 31 inches. Atlantic Ocean: 0-3 miles from shore, no closed season. Greater than 3 miles from shore, closed. All Other Marine Waters: Open Mar 1 – Dec 31.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: "EEZ closed. Bonus Program (24\" to <28\") is permit-only — see digest.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-fluke", speciesId: "summer_flounder", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Summer Flounder (Fluke) All marine waters except those noted below: 3 fish at 18 inches. Open Season: May 4 – Sept 25.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "05-04", seasonEnd: "09-25", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-fluke-debay", speciesId: "summer_flounder", regAreaId: "nj-delaware-bay", kind: "bag_limit",
    verbatim: "Summer Flounder (Fluke) Delaware Bay & Tributaries: 3 fish at 17 inches. Open Season: May 4 – Sept 25.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "05-04", seasonEnd: "09-25", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 17, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-fluke-ibsp", speciesId: "summer_flounder", regAreaId: "nj-ibsp", kind: "bag_limit",
    verbatim: "Summer Flounder (Fluke) Island Beach State Park: 2 fish at 16 inches. Open Season: May 4 – Sept 25.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "05-04", seasonEnd: "09-25", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "shore", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-bsb-may", speciesId: "black_sea_bass", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Black Sea Bass: 10 fish at 12.5 inches May 15 – June 21.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "05-15", seasonEnd: "06-21", bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 12.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Caudal filament excluded.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-bsb-summer", speciesId: "black_sea_bass", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Black Sea Bass: 1 fish at 12.5 inches June 22 – Sept 22.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "06-22", seasonEnd: "09-22", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 12.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Caudal filament excluded.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-bsb-oct", speciesId: "black_sea_bass", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Black Sea Bass: 10 fish at 12.5 inches Sept 23 – Oct 31.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "09-23", seasonEnd: "10-31", bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 12.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Caudal filament excluded.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-bsb-nov", speciesId: "black_sea_bass", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Black Sea Bass: 15 fish at 12.5 inches Nov 1 – Dec 31.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "11-01", seasonEnd: "12-31", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 12.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Caudal filament excluded.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-tautog-winter", speciesId: "tautog", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Tautog: 15 inches. 4 fish Jan 1 – Feb 28.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "02-28", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-tautog-april", speciesId: "tautog", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Tautog: 15 inches. 4 fish Apr 1 – Apr 30.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "04-30", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-tautog-late", speciesId: "tautog", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Tautog: 15 inches. 1 fish Aug 1 – Nov 15.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "08-01", seasonEnd: "11-15", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-tautog-fall", speciesId: "tautog", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Tautog: 15 inches. 5 fish Nov 16 – Dec 31.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "11-16", seasonEnd: "12-31", bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-bluefish", speciesId: "bluefish", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Bluefish: Private/Shore Angler – 5 fish. For-Hire Vessel – 7 fish. Open Season: Jan 1 – Dec 31.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "For-hire 7.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nj-weakfish", speciesId: "weakfish", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Weakfish: 1 fish at 13 inches. Open Season: Jan 1 – Dec 31.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nj-winter-flounder", speciesId: "winter_flounder", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Winter Flounder: 2 fish at 12 inches. Open Season: Mar 1 – Dec 31.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "03-01", seasonEnd: "12-31", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nj-scup", speciesId: "scup", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Scup (Porgy): 30 fish: Jan 1-June 30 and Sept 1-Dec 31. 10\".",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "12-31", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Also open Jan 1–Jun 30 at 30/10\".",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-scup-spring", speciesId: "scup", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Scup (Porgy): 30 fish: Jan 1-June 30 and Sept 1-Dec 31. 10\".",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "06-30", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-cod", speciesId: "atlantic_cod", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Cod: 5 fish: Jan 1-May 31 and Sept 1-Dec 31. 23\".",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "12-31", bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 23, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Also open Jan 1–May 31.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nj-black-drum", speciesId: "black_drum", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Black Drum: 3. 16\".",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nj-red-drum", speciesId: "red_drum", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Red Drum: 1. 18\" to less than 27\".",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nj-eel", speciesId: "american_eel", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "American Eel: 25. 9\".",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: 9, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "nj-river-herring", speciesId: "river_herring", regAreaId: "nj-marine", kind: "prohibited",
    verbatim: "River Herring: CLOSED.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "nj-fillet-note", speciesId: null, regAreaId: "nj-marine", kind: "note",
    verbatim: "Fish are measured from tip of snout to tip of tail (except Black Sea Bass and Sharks). Cleaning or filleting of fish with a minimum size limit while at sea is prohibited.",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "nj-cobia", speciesId: "cobia", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Cobia: 1 per person, 2 per vessel. 43\".",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 43, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "2 per vessel.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nj-spanish-mackerel", speciesId: "spanish_mackerel", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "Spanish Mackerel: 10. 14\".",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "nj-king-mackerel", speciesId: "king_mackerel", regAreaId: "nj-marine", kind: "bag_limit",
    verbatim: "King Mackerel: 3. 23\".",
    sourceUrl: NJ.url, sourceTitle: NJ.title, sourceUpdatedAt: NJ.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 23, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
];

export const NEW_JERSEY = {
  pack: NEW_JERSEY_PACK,
  areas: NJ_AREAS,
  groups: [],
  rules: NJ_RULES,
};
