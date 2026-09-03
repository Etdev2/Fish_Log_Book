/**
 * Virginia pack — `virginia-2026-09-03`. Atlantic wave 4.
 * 4VAC20-252 (coastal striped bass) and 4VAC20-950-45 (black sea bass 2026 season).
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const VIRGINIA_PACK: RegPack = {
  id: "virginia-2026-09-03",
  version: 1,
  publishedAt: "2026-09-03T22:00:00Z",
  notes:
    "Virginia MRC: coastal stripers 28–31\" @1 (open Jan 1–Mar 31 and May 16–Dec 31); BSB 13\" @15 May 11–Dec 31 (2026).",
};

const VERIFIED = "2026-09-03";
const pv = 1;
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
    name: "Virginia — coastal / state marine waters",
    polygon: [[-76.4, 38.05], [-75.4, 36.55], [-75.3, 36.55], [-75.9, 38.05], [-76.4, 38.05]],
    sourceUrl: BSB.url, verifiedAt: VERIFIED,
    notes: "Chesapeake Bay striped-bass seasons are a separate VMRC chapter — not encoded here.",
  },
];

function rule(r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const VA_RULES: readonly RegRule[] = [
  rule({
    id: "va-coast-striped-bass", speciesId: "striped_bass", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "4 VAC 20-252-110. Coastal area striped bass recreational fishery. A. The open seasons for the coastal area striped bass recreational fishery shall be January 1 through March 31 and May 16 through December 31, inclusive. B. The minimum size limit shall be 28 inches total length. C. The maximum size limit shall be 31 inches total length. D. The daily possession limit shall be one fish per person.",
    sourceUrl: SB.url, sourceTitle: SB.title, sourceUpdatedAt: SB.updated, verifiedAt: VERIFIED,
    seasonStart: "05-16", seasonEnd: "12-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: "Also open Jan 1–Mar 31.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-coast-striped-bass-winter", speciesId: "striped_bass", regAreaId: "va-coast", kind: "season",
    verbatim: "The open seasons for the coastal area striped bass recreational fishery shall be January 1 through March 31 and May 16 through December 31, inclusive.",
    sourceUrl: SB.url, sourceTitle: SB.title, sourceUpdatedAt: SB.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "03-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "va-bsb", speciesId: "black_sea_bass", regAreaId: "va-coast", kind: "bag_limit",
    verbatim: "A. It shall be unlawful for any person fishing with hook-and-line, rod and reel, spear, gig, or other recreational gear to possess more than 15 black sea bass. C. In 2026, the open recreational fishing season shall be from May 11 through December 31.",
    sourceUrl: BSB.url, sourceTitle: BSB.title, sourceUpdatedAt: BSB.updated, verifiedAt: VERIFIED,
    seasonStart: "05-11", seasonEnd: "12-31", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Size minimum lives in a companion VMRC chapter; this row is bag+2026 season only.",
    checkInseason: true, staleAfterDays: 30,
  }),
];

export const VIRGINIA = { pack: VIRGINIA_PACK, areas: VA_AREAS, groups: [], rules: VA_RULES };
