/**
 * Virginia pack — `virginia-2026-09-03` v2. Atlantic digest pass.
 * Source: VMRC recreational marine table (swrecfishingrules.php) + 4VAC chapters.
 * Chesapeake striped-bass seasons are a separate area from coastal 4VAC20-252.
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const VIRGINIA_PACK: RegPack = {
  id: "virginia-2026-09-03",
  version: 2,
  publishedAt: "2026-09-03T23:30:00Z",
  notes:
    "Virginia MRC recreational table v2: coastal stripers 28–31\" @1 (Jan 1–Mar 31 and May 16–Dec 31); Bay stripers 19–24\" @1 May 16–Jun 15 and Oct 4–Dec 31; BSB 13\" @15 May 11–Dec 31; tautog 16\" @4 closed May 16–Jun 30; fluke 16\" then 17.5\" @4; cobia 43\" @1 / 2 vessel Jun 15–Sep 20; red drum 18–26\" @3; specks 14\" @5 (1 over 24\") closed Apr 1–Jun 30 2026.",
};

const VERIFIED = "2026-09-03";
const pv = 2;
const TABLE = {
  url: "https://webapps.mrc.virginia.gov/public/reports/swrecfishingrules.php",
  title: "Virginia MRC — Recreational Fishing Regulations For Marine Waters",
  updated: "2026-05-01",
} as const;
const SB = {
  url: "https://www.mrc.virginia.gov/Notices/2024/2024-03-26-RC252-draft.pdf",
  title: "Virginia MRC — 4VAC 20-252 coastal area striped bass recreational fishery",
  updated: "2024-03-26",
} as const;
const BSB = {
  url: "https://law.lis.virginia.gov/admincode/title4/agency20/chapter950/section45/",
  title: "4VAC20-950-45. Recreational possession limits and seasons (black sea bass)",
  updated: "2026-01-01",
} as const;

export const VA_AREAS: readonly RegArea[] = [
  {
    id: "va-coast",
    authority: "va-mrc",
    kind: "ocean_region",
    name: "Virginia — coastal / territorial sea (seaside Accomack, Northampton, Virginia Beach)",
    polygon: [[-76.4, 38.05], [-75.4, 36.55], [-75.3, 36.55], [-75.9, 38.05], [-76.4, 38.05]],
    sourceUrl: TABLE.url, verifiedAt: VERIFIED,
    notes: "Coastal striper map: Territorial Sea plus seaside creeks; EEZ closed to stripers. Potomac is PRFC, not this pack.",
  },
  {
    id: "va-chesapeake",
    authority: "va-mrc",
    kind: "ocean_region",
    name: "Virginia — Chesapeake Bay and Bay tributaries (not Potomac)",
    polygon: null,
    sourceUrl: TABLE.url, verifiedAt: VERIFIED,
    notes: "Potomac mainstem and its VA tributaries follow PRFC, not VMRC Bay seasons.",
  },
];

function rule(r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const VA_RULES: readonly RegRule[] = [
  rule({
    id: "va-coast-striped-bass", speciesId: "striped_bass", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Virginia Coastal Seasons: January 1 through March 31. May 16 through December 31. Minimum Size Limit: 28 inches. Maximum Size Limit: 31 inches. Possession Limit: 1 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "05-16", seasonEnd: "12-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: "Also open Jan 1–Mar 31.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-coast-striped-bass-winter", speciesId: "striped_bass", regAreaId: "va-coast", kind: "season",
    verbatim: "The open seasons for the coastal area striped bass recreational fishery shall be January 1 through March 31 and May 16 through December 31, inclusive.",
    sourceUrl: SB.url, sourceTitle: SB.title, sourceUpdatedAt: SB.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "03-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-coast-striped-bass-circle", speciesId: "striped_bass", regAreaId: "va-coast", kind: "gear",
    verbatim: "As required by 4 VAC 20-252-50 (B), beginning August 1, 2020, any person fishing striped bass recreationally shall use non-offset, corrodible, non-stainless steel circle hooks when fishing with bait, live or chunk. Gaffing striped bass or attempting to gaff striped bass is illegal in Virginia marine waters. Atlantic Ocean waters beyond the 3 mile limit are closed to the taking and possession of striped bass all year.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "va-bay-striped-bass-spring", speciesId: "striped_bass", regAreaId: "va-chesapeake", kind: "bag_limit",
    verbatim: "Chesapeake Bay Spring Season. Season: May 16 through June 15. Minimum Size Limit: 19 inches. Maximum Size Limit: 24 inches. Possession Limit: 1 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "05-16", seasonEnd: "06-15", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 19, maxSizeIn: 24, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "va-bay-striped-bass-fall", speciesId: "striped_bass", regAreaId: "va-chesapeake", kind: "bag_limit",
    verbatim: "Chesapeake Bay Fall Season. Season: October 4 through December 31. Minimum Size Limit: 19 inches. Maximum Size Limit: 24 inches. Possession Limit: 1 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "10-04", seasonEnd: "12-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 19, maxSizeIn: 24, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "va-bay-striped-bass-spring-season", speciesId: "striped_bass", regAreaId: "va-chesapeake", kind: "season",
    verbatim: "Chesapeake Bay Spring Season: May 16 through June 15.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "05-16", seasonEnd: "06-15", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "va-bay-striped-bass-fall-season", speciesId: "striped_bass", regAreaId: "va-chesapeake", kind: "season",
    verbatim: "Chesapeake Bay Fall Season: October 4 through December 31.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "10-04", seasonEnd: "12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "va-bsb", speciesId: "black_sea_bass", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Black Sea Bass. Minimum Size Limit: 13. Possession Limit: 15. Season: May 11 through Dec 31. Regulations for black sea bass caught in federal waters are subject to change. Please refer to NMFS for regulations in federal waters.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "05-11", seasonEnd: "12-31", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-bsb-season", speciesId: "black_sea_bass", regAreaId: "va-coast", kind: "season",
    verbatim: "A. It shall be unlawful for any person fishing with hook-and-line, rod and reel, spear, gig, or other recreational gear to possess more than 15 black sea bass. C. In 2026, the open recreational fishing season shall be from May 11 through December 31.",
    sourceUrl: BSB.url, sourceTitle: BSB.title, sourceUpdatedAt: BSB.updated, verifiedAt: VERIFIED,
    seasonStart: "05-11", seasonEnd: "12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-tautog-fall", speciesId: "tautog", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Tautog. Minimum Size Limit: 16 IN. Possession Limit: 4 per person. Season: Closed Season: May 16 - June 30.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "12-31", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-tautog-winter", speciesId: "tautog", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "The recreational fishing season shall be closed from May 16 through June 30. The minimum size of tautog harvested for recreational purposes shall be 16 inches in total length. It shall be unlawful for any person fishing with hook and line, rod and reel, spear, gig or other recreational gear to possess more than four tautog.",
    sourceUrl: "https://mrc.virginia.gov/regulations/FR960.shtm",
    sourceTitle: "4VAC20-960 — Pertaining to Tautog", sourceUpdatedAt: "2024-02-01", verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "05-15", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-tautog-fall-season", speciesId: "tautog", regAreaId: "va-coast", kind: "season",
    verbatim: "Tautog recreational season closed May 16 through June 30 (open otherwise).",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-tautog-winter-season", speciesId: "tautog", regAreaId: "va-coast", kind: "season",
    verbatim: "Tautog recreational open January 1 through May 15.",
    sourceUrl: "https://mrc.virginia.gov/regulations/FR960.shtm",
    sourceTitle: "4VAC20-960 — Pertaining to Tautog", sourceUpdatedAt: "2024-02-01", verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "05-15", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-fluke-late", speciesId: "summer_flounder", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Summer Flounder. Minimum Size Limit January 1-May 31: 16 Inches. Minimum Size Limit June 1-December 31: 17.5 Inches. Possession Limit: 4 per person. Season: Open year-round.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "06-01", seasonEnd: "12-31", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 17.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Potomac tributaries follow PRFC.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-fluke-early", speciesId: "summer_flounder", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Summer Flounder. Minimum Size Limit January 1-May 31: 16 Inches. Possession Limit: 4 per person. Season: Open year-round.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "05-31", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-cobia", speciesId: "cobia", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Recreational cobia regulations are as follows: 43-inch, total length, minimum size limit; 1-fish daily possession limit or 2-fish-daily vessel limit, whichever is more restrictive; an open season of June 15 through September 20; and gaffing is prohibited.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "06-15", seasonEnd: "09-20", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 43, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "2 per vessel, whichever is more restrictive.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-cobia-season", speciesId: "cobia", regAreaId: "va-coast", kind: "season",
    verbatim: "Cobia. Minimum Size Limit: 43 inches total length. Possession Limit: 1 per person, 2 per vessel; whichever is more restrictive. Season: June 15 through Sept 20.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "06-15", seasonEnd: "09-20", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-red-drum", speciesId: "red_drum", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Red Drum (Channel Bass, Redfish). Minimum Size Limit: Min 18 IN. to Max 26 IN. Possession Limit: 3 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: 26, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "va-speck-open", speciesId: "spotted_seatrout", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Speckled Trout (Spotted Seatrout). Minimum Size Limit: 14 IN. Possession Limit: 5 per Person, only 1 greater than 24\". Season: *Closed April 1 - June 30, 2026.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "03-31", bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish may exceed 24\". Closed Apr 1–Jun 30 2026.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "va-speck-season", speciesId: "spotted_seatrout", regAreaId: "va-chesapeake", kind: "season",
    verbatim: "Speckled trout recreational harvest closed April 1 through June 30, 2026 (VMRC table).",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "03-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "va-speck-open-coast-season", speciesId: "spotted_seatrout", regAreaId: "va-coast", kind: "season",
    verbatim: "Speckled trout open outside April 1–June 30 2026 in Virginia marine waters.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "03-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "va-speck-bay", speciesId: "spotted_seatrout", regAreaId: "va-chesapeake", kind: "bag_limit",
    verbatim: "Speckled Trout (Spotted Seatrout) — Bay: Minimum Size Limit: 14 IN. Possession Limit: 5 per Person, only 1 greater than 24\". Season: *Closed April 1 - June 30, 2026.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "03-31", bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish may exceed 24\".",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "va-black-drum", speciesId: "black_drum", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Black Drum (Drum, Drumfish). Minimum Size Limit: 16 IN. Possession Limit: 1 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "va-bluefish", speciesId: "bluefish", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Bluefish. Minimum Size Limit: None. Possession Limit: 5 per person from shore or a rented or private vessel; 5 per person on for-hire or charter vessels.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "va-weakfish", speciesId: "weakfish", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Grey Trout (Weakfish). Minimum Size Limit: 12 IN. Possession Limit: 1 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "va-sheepshead", speciesId: "sheepshead", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Sheepshead. Minimum Size Limit: None. Possession Limit: 4 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "va-spanish-mackerel", speciesId: "spanish_mackerel", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Spanish Mackerel. Minimum Size Limit: 14 IN. Possession Limit: 15 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "va-king-mackerel", speciesId: "king_mackerel", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "King Mackerel. Minimum Size Limit: 27 IN. Possession Limit: 3 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 27, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "va-amberjack", speciesId: "greater_amberjack", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Amberjack. Minimum Size Limit: 32 IN. Possession Limit: 2 per person.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 32, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "va-scup", speciesId: "scup", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "Scup (Porgy). Minimum Size Limit: 9 IN. Possession Limit: 30 per person. Below regulations apply in state waters.",
    sourceUrl: TABLE.url, sourceTitle: TABLE.title, sourceUpdatedAt: TABLE.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 9, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Federal waters: check NMFS.",
    checkInseason: true, staleAfterDays: 60,
  }),
];

export const VIRGINIA = { pack: VIRGINIA_PACK, areas: VA_AREAS, groups: [], rules: VA_RULES };
