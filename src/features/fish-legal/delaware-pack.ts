/**
 * Delaware pack — `delaware-2026-09-03`. Atlantic wave 4 (South Atlantic / Delmarva).
 * DNREC Fish Facts + 2026 Fishing Guide (electronic).
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const DELAWARE_PACK: RegPack = {
  id: "delaware-2026-09-03",
  version: 1,
  publishedAt: "2026-09-03T22:00:00Z",
  notes:
    "Delaware DNREC 2026: stripers 28–31\" @1 (20–25\" Jul 1–Aug 31 in DE River/Bay/tributaries); tautog 16\" @4 Jan 1–May 15 and Jul 1–Dec 31; fluke 16\" then 17.5\" @4; BSB 13\" @15 May 15–Sep 30 and Oct 10–Dec 31; red drum 20–27\" @5 state waters.",
};

const VERIFIED = "2026-09-03";
const pv = 1;
const SB = {
  url: "https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=1&species=55",
  title: "Delaware DNREC Fish Facts — Striped Bass",
  updated: "2026-01-01",
} as const;

export const DE_AREAS: readonly RegArea[] = [
  {
    id: "de-tidal",
    authority: "de-dnrec",
    kind: "ocean_region",
    name: "Delaware — state tidal / ocean to 3 nm",
    polygon: [[-75.7, 39.85], [-75.0, 38.45], [-74.85, 38.45], [-75.05, 39.85], [-75.7, 39.85]],
    sourceUrl: SB.url,
    verifiedAt: VERIFIED,
    notes: "Federal waters closed to striped bass. EEZ follows NOAA.",
  },
];

function rule(r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const DE_RULES: readonly RegRule[] = [
  rule({
    id: "de-striped-bass", speciesId: "striped_bass", regAreaId: "de-tidal", kind: "bag_limit",
    verbatim: "Daily Limit / Person: 1 in State of Delaware waters (coast to 3 miles offshore), except catch & release only on spawning grounds April 1 to May 31. Size Limit: 28 inches to 31 inches, except 20 inches to 25 inches from July 1 through August 31 in the Delaware River, Delaware Bay and their tributaries. CLOSED in Federal waters.",
    sourceUrl: SB.url, sourceTitle: SB.title, sourceUpdatedAt: SB.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: "Bay/River 20–25\" Jul 1–Aug 31.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "de-striped-bass-circle", speciesId: "striped_bass", regAreaId: "de-tidal", kind: "gear",
    verbatim: "In 2021, a new regulation requires using inline circle hooks when fishing for striped bass using cut or whole natural baits like clams, squid, mackerel, menhaden, seaworms, or eels.",
    sourceUrl: SB.url, sourceTitle: SB.title, sourceUpdatedAt: SB.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "de-tautog", speciesId: "tautog", regAreaId: "de-tidal", kind: "bag_limit",
    verbatim: "Tautog: Season January 1 to May 15 July 1 to December 31. Size Limit 16 inch minimum (total length). Daily Limit / Person 4.",
    sourceUrl: "https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=187",
    sourceTitle: "Delaware DNREC Fish Facts — Tautog", sourceUpdatedAt: "2026-01-01", verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "12-31", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Also open Jan 1–May 15.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "de-tautog-spring", speciesId: "tautog", regAreaId: "de-tidal", kind: "season",
    verbatim: "Tautog season: January 1 to May 15 and July 1 to December 31.",
    sourceUrl: "https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=187",
    sourceTitle: "Delaware DNREC Fish Facts — Tautog", sourceUpdatedAt: "2026-01-01", verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "05-15", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "de-fluke-late", speciesId: "summer_flounder", regAreaId: "de-tidal", kind: "bag_limit",
    verbatim: "Summer Flounder: Season Open Year-Round. Size Limit January 1 - May 31: 16 inch minimum (total length) June 1 - December 31: 17.5 inch minimum (total length). Daily Limit / Person 4.",
    sourceUrl: "https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=185",
    sourceTitle: "Delaware DNREC Fish Facts — Summer Flounder", sourceUpdatedAt: "2026-01-01", verifiedAt: VERIFIED,
    seasonStart: "06-01", seasonEnd: "12-31", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 17.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "de-fluke-early", speciesId: "summer_flounder", regAreaId: "de-tidal", kind: "bag_limit",
    verbatim: "Summer Flounder: January 1 - May 31: 16 inch minimum (total length). Daily Limit / Person 4.",
    sourceUrl: "https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=185",
    sourceTitle: "Delaware DNREC Fish Facts — Summer Flounder", sourceUpdatedAt: "2026-01-01", verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "05-31", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "de-bsb-early", speciesId: "black_sea_bass", regAreaId: "de-tidal", kind: "bag_limit",
    verbatim: "Black Sea Bass: Season May 15 through September 30 and October 10 through December 31. Size Limit 13 inch minimum (measured from the tip of the snout or jaw (mouth shut) to the farthest extremity of the tail, not including the tail filament). Daily Limit / Person 15.",
    sourceUrl: "https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=93",
    sourceTitle: "Delaware DNREC Fish Facts — Black Sea Bass", sourceUpdatedAt: "2026-01-01", verifiedAt: VERIFIED,
    seasonStart: "05-15", seasonEnd: "09-30", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Filament excluded.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "de-bsb-late", speciesId: "black_sea_bass", regAreaId: "de-tidal", kind: "bag_limit",
    verbatim: "Black Sea Bass: Season May 15 through September 30 and October 10 through December 31. Size Limit 13 inch minimum. Daily Limit / Person 15.",
    sourceUrl: "https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=93",
    sourceTitle: "Delaware DNREC Fish Facts — Black Sea Bass", sourceUpdatedAt: "2026-01-01", verifiedAt: VERIFIED,
    seasonStart: "10-10", seasonEnd: "12-31", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Filament excluded.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "de-red-drum", speciesId: "red_drum", regAreaId: "de-tidal", kind: "bag_limit",
    verbatim: "Red Drum: Season Open Year-Round in State of Delaware waters (coast to 3 miles offshore) CLOSED in Federal waters. Size Limit 20 to 27 inches (total length). Daily Limit / Person 5 in State of Delaware waters.",
    sourceUrl: "https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=150",
    sourceTitle: "Delaware DNREC Fish Facts — Red Drum", sourceUpdatedAt: "2026-01-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 20, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null, depthNote: "EEZ closed.",
    checkInseason: true, staleAfterDays: 60,
  }),
];

export const DELAWARE = { pack: DELAWARE_PACK, areas: DE_AREAS, groups: [], rules: DE_RULES };
