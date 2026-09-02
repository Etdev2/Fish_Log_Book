/**
 * Washington pack — `washington-2026-09-02`.
 *
 * PNW wave (24-state expansion, 2026-09-02). Ocean Marine Areas 1–4 flagship-first:
 * the 2026 coastal bottomfish program (aggregate 9 with rockfish/lingcod/cabezon
 * sub-limits, seasonal copper/quillback/vermilion possession closure), statewide
 * yelloweye prohibition, descending-device requirement, surfperch/shiner limits,
 * closed-species list, and Area 2A halibut. Puget Sound (Marine Areas 5–13) and
 * salmon/shellfish deliberately NOT shipped in v1 — verified-or-nothing.
 *
 * Verified 2026-09-02 against WDFW + NOAA primary sources:
 *   A = https://wdfw.wa.gov/newsroom/news-release/coastal-recreational-bottomfish-fishery-season-opens-march-14-1
 *       (WDFW news release, March 5, 2026 — the 2026 coastal bottomfish table)
 *   B = https://www.fisheries.noaa.gov/action/2026-pacific-halibut-recreational-fishery
 *       (NOAA West Coast: final rule published 2026-05-01, Area 2A 2026 CSP)
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const WASHINGTON_PACK: RegPack = {
  id: "washington-2026-09-02",
  version: 1,
  publishedAt: "2026-09-02T12:00:00Z",
  notes:
    "Washington ocean Marine Areas 1–4 (WDFW news release March 5, 2026): 2026 coastal " +
    "bottomfish aggregate 9/day (≤7 rockfish, ≤5 canary; 2 lingcod; 1 cabezon; no min " +
    "sizes), copper/quillback/vermilion possession prohibited May–July, yelloweye " +
    "prohibited year-round, descending device mandatory on boats, surfperch 12 / shiner " +
    "15, halibut 1/day per the federal Area 2A plan. Marine Areas 5–13 (Puget Sound) " +
    "and salmon/shellfish not yet shipped.",
};

const A = {
  url: "https://wdfw.wa.gov/newsroom/news-release/coastal-recreational-bottomfish-fishery-season-opens-march-14-1",
  title: "WDFW — Coastal recreational bottomfish fishery season opens March 14 (news release)",
  updated: "2026-03-05",
} as const;
const B = {
  url: "https://www.fisheries.noaa.gov/action/2026-pacific-halibut-recreational-fishery",
  title: "NOAA Fisheries — 2026 Pacific Halibut Recreational Fishery (final rule, Area 2A)",
  updated: "2026-05-01",
} as const;
const VERIFIED = "2026-09-02";
const pv = 1;

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const WA_AREAS: readonly RegArea[] = [
  {
    // Marine Areas 1–4 (Ilwaco, Westport, La Push, Neah Bay west of Bonilla–Tatoosh):
    // the Columbia River mouth (46.25) north to Cape Flattery (48.5).
    id: "wa-ma-1-4-coastal",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Coastal Marine Areas 1–4 (Ilwaco / Westport / La Push / Neah Bay west of Bonilla–Tatoosh)",
    polygon: [
      [-124.8, 46.25], [-124.7, 46.9], [-124.3, 47.3], [-124.7, 47.95], [-124.8, 48.2],
      [-124.75, 48.5], [-124.0, 46.25], [-124.8, 46.25],
    ],
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes:
      "Envelope of WDFW Marine Areas 1–4 west of the Bonilla–Tatoosh line. Puget Sound " +
      "areas 5–13 follow the Washington Sport Fishing Rules pamphlet — not shipped yet.",
  },
  {
    id: "wa-ma4-east",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Marine Area 4 east of the Bonilla–Tatoosh boundary (Neah Bay east)",
    polygon: [
      [-124.75, 48.35], [-124.6, 48.28], [-124.45, 48.2], [-124.4, 48.35],
      [-124.6, 48.42], [-124.75, 48.42], [-124.75, 48.35],
    ],
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes: "Year-round bottomfish here; rockfish retention limited to the four named species.",
  },
];

export const WA_GROUPS: readonly RegGroup[] = [
  {
    id: "wa-bottomfish",
    name: "Bottomfish daily aggregate (9 across the family's species)",
    memberSpeciesIds: [
      "rockfish", "black_rockfish", "blue_rockfish", "canary_rockfish", "copper_rockfish",
      "quillback_rockfish", "vermilion_rockfish", "yelloweye_rockfish", "bocaccio",
      "widow_rockfish", "yellowtail_rockfish", "cabezon", "kelp_greenling", "lingcod",
      "sablefish", "pacific_cod",
    ],
  },
  {
    id: "wa-rockfish",
    name: "Rockfish sub-limit (7) within the bottomfish aggregate",
    memberSpeciesIds: [
      "rockfish", "black_rockfish", "blue_rockfish", "canary_rockfish", "copper_rockfish",
      "quillback_rockfish", "vermilion_rockfish", "yelloweye_rockfish", "bocaccio",
      "widow_rockfish", "yellowtail_rockfish",
    ],
  },
  {
    id: "wa-ma4-east-rockfish",
    name: "Retainable rockfish in Marine Area 4 east (black, blue/deacon, yellowtail, widow)",
    memberSpeciesIds: ["black_rockfish", "blue_rockfish", "yellowtail_rockfish", "widow_rockfish"],
  },
];

const CLOSING_TERCET =
  "Anglers cannot possess copper rockfish, quillback rockfish, and vermilion rockfish in May, June, and July.";

export const WA_RULES: readonly RegRule[] = [
  rule({
    id: "wa-ma14-season", speciesId: null, regGroupId: "wa-bottomfish", regAreaId: "wa-ma-1-4-coastal", kind: "season",
    verbatim:
      "Marine Area 1 (Ilwaco), Marine Area 2 (Westport-Ocean Shores), Marine Area 3 (La Push) and Marine Area 4 (Neah Bay west of Bonilla-Tatoosh boundary line) is open from March 14 through Oct. 17.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "03-14", seasonEnd: "10-17", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ma14-bag", speciesId: null, regGroupId: "wa-bottomfish", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "Daily aggregate limit is nine bottomfish and includes a sub-limit of seven rockfish (sub-limit of five canary rockfish), two lingcod, and one cabezon per angler with no minimum size restriction. A daily aggregate limit is a combination of nine bottomfish species.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "03-14", seasonEnd: "10-17", bagDaily: 9, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ma14-rockfish-sub", speciesId: null, regGroupId: "wa-rockfish", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "Daily aggregate limit is nine bottomfish and includes a sub-limit of seven rockfish (sub-limit of five canary rockfish), two lingcod, and one cabezon per angler with no minimum size restriction.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "03-14", seasonEnd: "10-17", bagDaily: 7, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-canary-sub", speciesId: "canary_rockfish", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "The daily possession sub-bag limit of five canary rockfish remains the same for the 2026 coastal recreational bottomfish fisheries in Marine Area 1 (Ilwaco), Marine Area 2 (Westport-Ocean Shores), Marine Area 3 (La Push), and Marine Area 4 (Neah Bay west of the Bonilla-Tatoosh boundary line).",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "03-14", seasonEnd: "10-17", bagDaily: 5, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-lingcod-bag", speciesId: "lingcod", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "Daily aggregate limit is nine bottomfish and includes a sub-limit of seven rockfish (sub-limit of five canary rockfish), two lingcod, and one cabezon per angler with no minimum size restriction.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "03-14", seasonEnd: "10-17", bagDaily: 2, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-cabezon-bag", speciesId: "cabezon", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "Daily aggregate limit is nine bottomfish and includes a sub-limit of seven rockfish (sub-limit of five canary rockfish), two lingcod, and one cabezon per angler with no minimum size restriction.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "03-14", seasonEnd: "10-17", bagDaily: 1, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  // Seasonal May–July possession closures (separate closed-window rows per species).
  rule({
    id: "wa-copper-closed-mjj", speciesId: "copper_rockfish", regAreaId: "wa-ma-1-4-coastal", kind: "season",
    verbatim:
      "Anglers are reminded that possession of copper rockfish, quillback rockfish, and vermilion rockfish is prohibited in May, June, and July, when peak effort for bottomfish occurs. " + CLOSING_TERCET,
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "07-31", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-quillback-closed-mjj", speciesId: "quillback_rockfish", regAreaId: "wa-ma-1-4-coastal", kind: "season",
    verbatim: "Possession of quillback rockfish is prohibited in May, June, and July. " + CLOSING_TERCET,
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "07-31", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-vermilion-closed-mjj", speciesId: "vermilion_rockfish", regAreaId: "wa-ma-1-4-coastal", kind: "season",
    verbatim: "Possession of vermilion rockfish is prohibited in May, June, and July. " + CLOSING_TERCET,
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "07-31", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-yelloweye-prohibited", speciesId: "yelloweye_rockfish", regAreaId: "wa-ma-1-4-coastal", kind: "prohibited",
    verbatim:
      "Yelloweye rockfish retention is prohibited in all areas of Washington and must be released.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-descending-device", speciesId: null, regAreaId: "wa-ma-1-4-coastal", kind: "note",
    verbatim:
      "Anglers are reminded that a descending device must be on board vessels and rigged for immediate use when fishing for or possessing bottomfish and halibut.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  // ——— Marine Area 4 east of Bonilla–Tatoosh (year-round, restricted rockfish list) ———
  rule({
    id: "wa-ma4e-season", speciesId: null, regGroupId: "wa-bottomfish", regAreaId: "wa-ma4-east", kind: "season",
    verbatim:
      "Marine Area 4 (Neah Bay east of Bonilla-Tatoosh boundary line) is open year-round. Lingcod fishing is open from March 14 through Oct. 17.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ma4e-bag", speciesId: null, regGroupId: "wa-bottomfish", regAreaId: "wa-ma4-east", kind: "bag_limit",
    verbatim:
      "Daily aggregate limit is nine bottomfish and includes a sub-limit of seven black, blue/deacon, yellowtail, and widow rockfishes (retention of other rockfish species is prohibited), two lingcod, and one cabezon per angler with no minimum size restriction.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "12-31", bagDaily: 9, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ma4e-rockfish-sub", speciesId: null, regGroupId: "wa-ma4-east-rockfish", regAreaId: "wa-ma4-east", kind: "bag_limit",
    verbatim:
      "Daily aggregate limit is nine bottomfish and includes a sub-limit of seven black, blue/deacon, yellowtail, and widow rockfishes (retention of other rockfish species is prohibited), two lingcod, and one cabezon per angler with no minimum size restriction.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "12-31", bagDaily: 7, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ma4e-lingcod-season", speciesId: "lingcod", regAreaId: "wa-ma4-east", kind: "season",
    verbatim:
      "Marine Area 4 (Neah Bay east of Bonilla-Tatoosh boundary line) is open year-round. Lingcod fishing is open from March 14 through Oct. 17.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "03-14", seasonEnd: "10-17", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ma4e-lingcod-bag", speciesId: "lingcod", regAreaId: "wa-ma4-east", kind: "bag_limit",
    verbatim:
      "Daily aggregate limit is nine bottomfish and includes a sub-limit of seven black, blue/deacon, yellowtail, and widow rockfishes (retention of other rockfish species is prohibited), two lingcod, and one cabezon per angler with no minimum size restriction.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  // ——— Pacific halibut (federal CSP; WDFW links to NOAA) ———
  rule({
    id: "wa-halibut-bag", speciesId: "pacific_halibut", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "The bottomfish daily limit doesn’t include halibut. The daily limit for halibut is one fish with no minimum size restriction.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa-halibut-seasons-note", speciesId: "pacific_halibut", regAreaId: "wa-ma-1-4-coastal", kind: "note",
    verbatim:
      "2026 Washington halibut (Area 2A): Puget Sound and Strait of Juan de Fuca — April 2 through June 30 and August 16 through September 30, 7 days a week. North Coast (Marine Areas 3 and 4) — Thursdays through Sundays May through June 28 per the published date table, plus August 16 through September 30, 7 days a week. South Coast (Marine Area 2) — Thursdays, Fridays, Sundays, and Tuesdays April 30 through June 30, plus August 8 through September 30, 7 days a week. Inseason closures when subarea allocations are used.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-surfperch-bag", speciesId: "surfperch", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "Surfperch and shiner perch are not part of the bottomfish limit. Surfperch has a daily limit of 12 and shiner perch has a daily limit of 15 with no minimum size restriction for either species. Fishing is open on the second Saturday in March through the third Saturday in October – March 14 through Oct. 17, 2026 – except fishing for surfperch is open year-round from the beach.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 12, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "shore", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-shiner-bag", speciesId: "shiner_perch", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "Surfperch has a daily limit of 12 and shiner perch has a daily limit of 15 with no minimum size restriction for either species.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-sharks-closed", speciesId: "sixgill_shark", regAreaId: "wa-ma-1-4-coastal", kind: "prohibited",
    verbatim:
      "Fishing for, retaining, or possessing sixgill, sevengill, and thresher sharks is closed in all marine areas. A sixgill shark may not be removed from the water.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "wa-thresher-closed", speciesId: "thresher_shark", regAreaId: "wa-ma-1-4-coastal", kind: "prohibited",
    verbatim:
      "Fishing for, retaining, or possessing sixgill, sevengill, and thresher sharks is closed in all marine areas.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
];

export const WASHINGTON = {
  pack: WASHINGTON_PACK,
  areas: WA_AREAS,
  groups: WA_GROUPS,
  rules: WA_RULES,
};
