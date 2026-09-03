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
  version: 5,
  publishedAt: "2026-09-02T12:00:00Z",
  notes:
    "Washington ocean Marine Areas 1-4 (WDFW news release March 5, 2026) — v2 deepens " +
    "with the inside-waters doctrine (no rockfish 6-13, barbless hooks 5-13), Puget " +
    "Sound halibut windows (1/day, 6/yr, catch record card), the North Coast 20-fathom " +
    "retention list, the C-shaped yelloweye conservation area, wolf-eel closure, and " +
    "the five-additional-flatfish rule. v3 lands the Puget Sound pamphlet tables for " +
    "Marine Areas 9, 10 and 13 verbatim (2026-27 book, updated June 18 2026): 15 " +
    "bottomfish daily, >120ft fishing prohibited, descending device required, lingcod " +
    "May 1-Jun 15 slot 26-36 in (spear May 21-Jun 15, hook-and-line from May 1), " +
    "cabezon May 1-Nov 30 @18 in @1, rockfish closed, cod/pollock/hake/wolf-eel closed, " +
    "salmon headline windows as notes. v4 lands the Crab Rules page verbatim: Puget Sound (Dungeness 5 @ 6.25 in males hardshell / Red Rock 6 @ 5 in / Tanner 6 @ 4.5 in; CRC + endorsement; MA12 south of Ayock Point + MA13 closed to crab in 2026), Pacific Ocean (Dungeness 6 @ 6 in + Red Rock 6 @ 5 in; pot window Dec 1-Sep 15, year-round other gear; Willapa Bay pots Nov 15-Sep 15), Columbia River estuary (Dungeness 12 @ 5.75 in, year-round all gear), European green crab report-and-release. v5 lands the Shrimp Rules page verbatim: Puget Sound 80 spot shrimp/day cap inside a 10-lb all-species combined limit with 2026 spot closures (MA 8-1/8-2/9/10/11/13) as prohibited rows; Pacific Ocean 25-lb combined (max 200 spot, year-round); mesh/head-retention/pot-count gear doctrine.",
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
const B1 = {
  url: "https://wdfw.wa.gov/fishing/regulations/halibut",
  title: "WDFW — Recreational bottomfish and halibut fisheries page",
  updated: "2026-03-05",
} as const;
const C1 = {
  url: "https://wdfw.wa.gov/fishing/regulations/halibut/north-coast",
  title: "WDFW — North coast halibut and bottomfish seasons and regulations",
  updated: "2026-03-05",
} as const;
const D1 = {
  url: "https://wdfw.wa.gov/fishing/regulations/halibut/puget-sound",
  title: "WDFW — Puget Sound/Strait of Juan de Fuca halibut seasons and regulations",
  updated: "2026-03-05",
} as const;
const VERIFIED = "2026-09-02";
const pv = 5;
const C2 = {
  url: "https://www.eregulations.com/washington/fishing/crab-rules",
  title: "WDFW — 2026-2027 Washington Sport Fishing Rules (Crab Rules)",
  updated: "2026-06-18",
} as const;
const S2 = {
  url: "https://www.eregulations.com/washington/fishing/shrimp-rules",
  title: "WDFW — 2026-2027 Washington Sport Fishing Rules (Shrimp Rules)",
  updated: "2026-06-18",
} as const;

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
  // ——— v2 (deepen pass): inside-waters + north-coast doctrine areas ———
  {
    id: "wa-ma-5-13-inside",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Marine Areas 5–13 — Puget Sound, Strait of Juan de Fuca, San Juan Islands, Hood Canal",
    polygon: [
      [-123.96, 49.0], [-123.1, 48.9], [-122.8, 48.45], [-122.4, 48.9], [-122.3, 49.15],
      [-123.7, 49.15], [-123.96, 49.0],
    ],
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes:
      "Envelope over the inside waters. v1 doctrine: rockfish are off-limits in Areas " +
      "6-13, barbless hooks required Areas 5-13. Area-by-area pamphlet tables pending.",
  },
  {
    id: "wa-ma-5-10-halibut",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Puget Sound & Strait of Juan de Fuca halibut (Marine Areas 5–10)",
    polygon: null,
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes:
      "Halibut subarea per WDFW's Puget Sound page (2026 quota 80,512 lb). Shares the " +
      "inside-water envelope; separate id so halibut rules don't muddy the bottomfish area.",
  },
  {
    // The verbatim coordinate-defined box (WDFW North Coast page). C-shaped.
    id: "wa-yrca",
    authority: "wdfw",
    kind: "conservation_area",
    name: "Yelloweye Rockfish Conservation Area (C-shaped, off Cape Flattery)",
    polygon: [
      [-125.3, 48.3], [-124.9833, 48.3], [-124.9833, 48.1833], [-125.1833, 48.1833],
      [-125.1833, 48.0667], [-124.9833, 48.0667], [-124.9833, 48.0], [-125.3, 48.0],
      [-125.3, 48.3],
    ],
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes:
      "Closed to recreational bottomfish AND halibut fishing. Coordinates verbatim from " +
      "WDFW's North Coast page (48-18'N 125-18'W → 48-18'N 124-59'W → 48-11'N 124-59'W →" +
      " 48-11'N 125-11'W → 48-04'N 125-11'W → 48-04'N 124-59'W → 48-00'N 124-59'W → " +
      "48-00'N 125-18'W → back).",
  },
  // ——— v3 (deepen pass): Puget Sound pamphlet areas (2026-27 book, updated 06-18-2026) ———
  {
    id: "wa-ma-9",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Marine Area 9 — Admiralty Inlet",
    polygon: [
      [-122.75, 48.05], [-122.4, 47.95], [-122.35, 48.0], [-122.35, 48.3], [-122.75, 48.3],
      [-122.75, 48.05],
    ],
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-9",
    verifiedAt: VERIFIED,
    notes:
      "Envelope. Legal: south of Partridge Point–Point Wilson line, south and west of " +
      "Possession Point 110° true to shipwreck, north of Hood Canal Bridge and north of " +
      "the Apple Cove Point–Edwards Point line.",
  },
  {
    id: "wa-ma-10",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Marine Area 10 — Seattle / Bremerton",
    polygon: [
      [-122.5, 47.55], [-122.3, 47.55], [-122.3, 47.95], [-122.5, 47.95], [-122.5, 47.55],
    ],
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-10",
    verifiedAt: VERIFIED,
    notes:
      "Envelope. Legal: Apple Cove Point–Edwards Point to a true east-west line through " +
      "the north tip of Vashon Island. DOH fish-consumption advisories apply — check " +
      "doh.wa.gov/fishmap.",
  },
  {
    id: "wa-ma-13",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Marine Area 13 — South Puget Sound",
    polygon: [
      [-122.65, 47.1], [-122.35, 47.1], [-122.3, 47.28], [-122.65, 47.28],
    ],
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-13",
    verifiedAt: VERIFIED,
    notes:
      "Envelope. Legal: all waters south of the northernmost Tacoma Narrows Bridge. " +
      "Halibut closed; Toliva Shoal + Budd Inlet sub-areas have their own salmon rows " +
      "in the pamphlet (headline rows shipped as notes).",
  },
  // ——— v4 (deepen pass): crab doctrine areas (Crab Rules page, updated 2026-06-18) ———
  {
    id: "wa-ps-crab",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Puget Sound crab — Marine Areas 4 (east of Bonilla-Tatoosh), 5, 6, 7 South/North, 8-1, 8-2, 9, 10, 11, 12 (north of Ayock Point)",
    polygon: [
      [-123.96, 49.0], [-123.1, 48.9], [-122.8, 48.45], [-122.4, 48.9], [-122.3, 49.15],
      [-123.7, 49.15], [-123.96, 49.0],
    ],
    sourceUrl: C2.url,
    verifiedAt: VERIFIED,
    notes:
      "Seasons are announced each spring (test fishery + co-management); limits/shape per " +
      "the Crab Rules page. Envelope matches the inside-waters area; MA 12 south of Ayock " +
      "Point and MA 13 are closed to crab harvest in 2026.",
  },
  {
    id: "wa-willapa-bay",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Willapa Bay (crab/shellfish estuary)",
    polygon: [
      [-124.1, 46.55], [-123.9, 46.6], [-123.85, 46.75], [-124.0, 46.95],
      [-124.15, 46.8], [-124.1, 46.55],
    ],
    sourceUrl: C2.url,
    verifiedAt: VERIFIED,
    notes: "Envelope. Full bay fish tables pending; v4 ships the pamphlet crab lines only.",
  },
  {
    id: "wa-columbia-river",
    authority: "wdfw",
    kind: "ocean_region",
    name: "Columbia River — east of the jetty tips upstream to the Tongue Point–Rocky Point line (crab estuary)",
    polygon: [
      [-124.06, 46.24], [-123.7, 46.24], [-123.7, 46.32], [-124.06, 46.32], [-124.06, 46.24],
    ],
    sourceUrl: C2.url,
    verifiedAt: VERIFIED,
    notes:
      "Salmonid-estuarine reach; v4 ships the year-round crab table only. Freshwater " +
      "upstream rules are out of the salt pack's scope.",
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

/** 2026-27 pamphlet "Bottomfish" block, identical wording in MA 9, 10, 11, 12, 13. */
function soundBottomfishRules(areaId: string): RegRule[] {
  const n = areaId.replace("wa-ma-", "");
  const pamphlet = {
    url: `https://www.eregulations.com/washington/fishing/marine-area-${n}`,
    title: `WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area ${n})`,
    updated: "2026-06-18",
  } as const;
  const tag = areaId.replace("wa-", "");
  const rs = (r: Omit<RegRule, "packVersion" | "regGroupId" | "regAreaId"> & Partial<Pick<RegRule, "regGroupId">>): RegRule =>
    rule({ regAreaId: areaId, ...r });
  return [
    rs({
      id: `${tag}-bottomfish-15`, speciesId: null, regGroupId: "wa-bottomfish", kind: "bag_limit",
      verbatim:
        "Bottomfish: Year-round season. Daily limit is a total of 15 bottomfish subject to individual limits and seasons shown below. Fishing for bottomfish prohibited in waters deeper than 120 feet. Descending device required onboard vessels.",
      sourceUrl: pamphlet.url, sourceTitle: pamphlet.title, sourceUpdatedAt: pamphlet.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: null, bagSharesWithGroup: true,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "No bottomfish deeper than 120 ft.",
      checkInseason: true, staleAfterDays: 30,
    }),
    rs({
      id: `${tag}-lingcod-season`, speciesId: "lingcod", kind: "bag_limit",
      verbatim:
        "Lingcod — May 1-June 15: Hook and line season. Min. size 26 in. Max. size 36 in. Daily limit 1. May 21-June 15: Spearfishing season. Max. size 36 in. Daily limit 1.",
      sourceUrl: pamphlet.url, sourceTitle: pamphlet.title, sourceUpdatedAt: pamphlet.updated, verifiedAt: VERIFIED,
      seasonStart: "05-01", seasonEnd: "06-15", bagDaily: 1, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: 26, maxSizeIn: 36, sizeMeasure: "total_length", platformScope: "boat", depthNote: "Spear window opens May 21 (26-36 in slot; max 36).",
      checkInseason: true, staleAfterDays: 30,
    }),
    rs({
      id: `${tag}-lingcod-closed`, speciesId: "lingcod", kind: "season",
      verbatim:
        "Lingcod — May 1-June 15: Hook and line season, May 21-June 15 spearfishing (outside those pamphlet windows lingcod retention is closed in this Marine Area).",
      sourceUrl: pamphlet.url, sourceTitle: pamphlet.title, sourceUpdatedAt: pamphlet.updated, verifiedAt: VERIFIED,
      seasonStart: "01-01", seasonEnd: "04-30", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
      checkInseason: true, staleAfterDays: 30,
    }),
    rs({
      id: `${tag}-lingcod-closed2`, speciesId: "lingcod", kind: "season",
      verbatim:
        "Lingcod — May 1-June 15: Hook and line season, May 21-June 15 spearfishing (outside these windows lingcod retention is closed in this Marine Area — see the pamphlet table).",
      sourceUrl: pamphlet.url, sourceTitle: pamphlet.title, sourceUpdatedAt: pamphlet.updated, verifiedAt: VERIFIED,
      seasonStart: "06-16", seasonEnd: "12-31", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
      checkInseason: true, staleAfterDays: 30,
    }),
    rs({
      id: `${tag}-surfperch`, speciesId: "surfperch", kind: "bag_limit",
      verbatim:
        "Surfperch: Year-round. No min. size. Daily limit 10. Except shiner perch daily limit 15: not included in bottomfish limit.",
      sourceUrl: pamphlet.url, sourceTitle: pamphlet.title, sourceUpdatedAt: pamphlet.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Shiner perch 15/day, not in the bottomfish count.",
      checkInseason: true, staleAfterDays: 60,
    }),
    rs({
      id: `${tag}-rockfish-closed`, speciesId: "rockfish", kind: "prohibited",
      verbatim: "Rockfish: CLOSED — CLOSED to fishing for, retaining, or possessing.",
      sourceUrl: pamphlet.url, sourceTitle: pamphlet.title, sourceUpdatedAt: pamphlet.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
      checkInseason: false, staleAfterDays: 120,
    }),
    rs({
      id: `${tag}-cod-hake-wolfeel-closed`, speciesId: "pacific_cod", kind: "prohibited",
      verbatim: "Pacific Cod, Pollock, Hake, and Wolf-Eel: Year-round — CLOSED to retention.",
      sourceUrl: pamphlet.url, sourceTitle: pamphlet.title, sourceUpdatedAt: pamphlet.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Also covers pollock, hake, wolf-eel.",
      checkInseason: false, staleAfterDays: 120,
    }),
    rs({
      id: `${tag}-sharks-closed`, speciesId: "sixgill_shark", kind: "prohibited",
      verbatim:
        "Sixgill, Sevengill, and Thresher Sharks: CLOSED — CLOSED to fishing for, retaining, or possessing. Sixgill shark may not be removed from the water.",
      sourceUrl: pamphlet.url, sourceTitle: pamphlet.title, sourceUpdatedAt: pamphlet.updated, verifiedAt: VERIFIED,
      seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
      checkInseason: true, staleAfterDays: 60,
    }),
    rs({
      id: `${tag}-cabezon`, speciesId: "cabezon", kind: "bag_limit",
      verbatim: "Cabezon: May 1-Nov. 30 — Min. size 18 in. Daily limit 1.",
      sourceUrl: pamphlet.url, sourceTitle: pamphlet.title, sourceUpdatedAt: pamphlet.updated, verifiedAt: VERIFIED,
      seasonStart: "05-01", seasonEnd: "11-30", bagDaily: 1, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: 18, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
      checkInseason: true, staleAfterDays: 30,
    }),
  ];
}

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
  // ——— v2 (deepen pass): North Coast + inside-waters doctrine ———
  rule({
    id: "wa14-flatfish-plus5", speciesId: "flatfish", regAreaId: "wa-ma-1-4-coastal", kind: "note",
    verbatim:
      "West of the Bonnilla-Tatoosh line: Recreational bottomfish is open from the second Saturday in March through the third Saturday in October, which is March 14 - October 17, 2026. Daily limit is a total of 9 bottomfish regardless of species, subject to individual limits shown below. In addition to the nine bottomfish daily limit, anglers can retain five additional flatfish. East of the Bonilla-Tatoosh line: Open year-round. In addition to the nine bottomfish daily limit, anglers can retain five additional flatfish.",
    sourceUrl: C1.url, sourceTitle: C1.title, sourceUpdatedAt: C1.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Five additional flatfish on top of the 9-bottomfish aggregate.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa34-20fm-restriction", speciesId: null, regGroupId: "wa-bottomfish", regAreaId: "wa-ma-1-4-coastal", kind: "note",
    verbatim:
      "In Marine Area 3 and Marine Area 4 (west of the Bonilla-Tatoosh line) effective June 1 through July 31, recreational fishing for bottomfish is prohibited seaward of a boundary line approximating the 20-fm (120 ft.) depth contour. Beginning June 1, on days open to the Pacific halibut fishery, the following bottomfish can be retained seaward of 20 fathoms: lingcod, sablefish, Pacific cod, bocaccio, silvergray rockfish, canary rockfish, widow rockfish, and yellowtail rockfish. Yellowtail and widow rockfish retention is allowed seaward of 20 fathoms at all times during the month of July.",
    sourceUrl: C1.url, sourceTitle: C1.title, sourceUpdatedAt: C1.updated, verifiedAt: VERIFIED,
    seasonStart: "06-01", seasonEnd: "07-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: "Offshore of ~20 fathoms, June 1 - July 31: only the named bottomfish list may be retained.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa34c-yrca-closed", speciesId: null, regGroupId: "wa-bottomfish", regAreaId: "wa-yrca", kind: "prohibited",
    verbatim:
      "A \"C-shaped\" yelloweye rockfish conservation area that is closed to recreational bottomfish and halibut fishing is defined by the following coordinates in the order listed: 48°18' N lat, 125°18' W long; 48°18' N, 124°59' W; 48°11' N, 124°59' W; 48°11' N, 125°11' W; 48°04' N, 125°11' W; 48°04' N, 124°59' W; 48°00' N, 124°59' W; 48°00' N, 125°18' W; and connecting back to 48°18' N, 125°18' W.",
    sourceUrl: C1.url, sourceTitle: C1.title, sourceUpdatedAt: C1.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "wa34-wolfeel-closed", speciesId: null, regAreaId: "wa-ma-1-4-coastal", kind: "prohibited",
    verbatim: "Wolf-eel — Closed to retention.",
    sourceUrl: C1.url, sourceTitle: C1.title, sourceUpdatedAt: C1.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "wa-ma613-rockfish-prohibited", speciesId: "rockfish", regAreaId: "wa-ma-5-13-inside", kind: "prohibited",
    verbatim:
      "Recreational anglers are reminded that it is unlawful to fish for, retain, or possess rockfish in Washington marine areas 6 through 13.",
    sourceUrl: B1.url, sourceTitle: B1.title, sourceUpdatedAt: B1.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "wa-ma513-barbless", speciesId: null, regAreaId: "wa-ma-5-13-inside", kind: "gear",
    verbatim:
      "Reminder that Barbless Hooks are required for all species in Marine Areas 5 through 13—including for halibut and bottomfish—except when using forage fish jig gear to target forage fish (herring, sandlance, anchovy, sardine and smelt).",
    sourceUrl: B1.url, sourceTitle: B1.title, sourceUpdatedAt: B1.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "wa-ps-halibut-season", speciesId: "pacific_halibut", regAreaId: "wa-ma-5-10-halibut", kind: "season",
    verbatim:
      "Marine Area 5-10. The 2026 season dates are as follows: April 2 through June 30, seven days per week. August 16 through September 30, seven days per week. Fishing may close before September 30 if the quota is taken.",
    sourceUrl: D1.url, sourceTitle: D1.title, sourceUpdatedAt: D1.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ps-halibut-bag", speciesId: "pacific_halibut", regAreaId: "wa-ma-5-10-halibut", kind: "bag_limit",
    verbatim:
      "In all marine areas open to halibut fishing, there is a one-fish daily catch limit and no minimum size restriction. There is a six fish annual bag limit. Anglers must record their catch on a WDFW catch record card.",
    sourceUrl: D1.url, sourceTitle: D1.title, sourceUpdatedAt: D1.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Six fish annual bag limit; catch record card required.",
    checkInseason: true, staleAfterDays: 7,
  }),
  // ——— v3 (deepen pass): Puget Sound pamphlet tables, verbatim (2026-27 book) ———
  ...soundBottomfishRules("wa-ma-9"),
  ...soundBottomfishRules("wa-ma-10"),
  ...soundBottomfishRules("wa-ma-13"),
  rule({
    id: "wa-ma9-salmon-note", speciesId: null, regAreaId: "wa-ma-9", kind: "note",
    verbatim:
      "Salmon (Entire Area, MA9 Admiralty Inlet): July 16-July 18: Chinook - min. size 22 in. Other salmon species - no min. size. Daily limit 2 including no more than 1 Chinook. Release chum, wild coho, and wild Chinook. July 19-July 31: CLOSED. Aug. 1-Sept. 18: no min. size, daily limit 2, release Chinook, chum, and wild coho. Sept. 19-Sept. 30: no min. size, daily limit 2, release Chinook and chum. (Edmonds Pier and Northern Hood Canal run separate tables; Admiralty Head Marine Preserve and Keystone Conservation Area: year-round CLOSED.)",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-9", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 9)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma10-salmon-note", speciesId: null, regAreaId: "wa-ma-10", kind: "note",
    verbatim:
      "Salmon (Entire Area, MA10 Seattle/Bremerton): June 1-July 22: no min. size, daily limit 2, release Chinook and chum. July 23-July 25: Chinook min. 22 in, daily limit 2 incl. ≤1 Chinook, release chum and wild Chinook. July 26-Sept. 30: no min. size, daily limit 2, release Chinook and chum. Oct. 1-Nov. 15: no min. size, daily limit 2, release Chinook. Nov. 16-Mar. 30: CLOSED. Mar. 31-Apr. 30: open Wed.-Sat. only, Chinook min. 22 in, daily limit 2 incl. ≤1 Chinook, release chum and wild Chinook. (Shilshole/West Elliott Bay, East Elliott Bay, Harbor Island, Sinclair Inlet/Port Orchard, Agate Pass, and the four piers run separate tables.)",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-10", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 10)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma13-salmon-note", speciesId: null, regAreaId: "wa-ma-13", kind: "note",
    verbatim:
      "Salmon (Entire Area, MA13 South Puget Sound): July 1-Sept. 30: Chinook - min. size 20 in. Other salmon species - no min. size. Daily limit 2. Release chum, wild coho, and wild Chinook. Oct. 1-June 30: Chinook - min. size 22 in. Other salmon species - no min. size. Daily limit 2. Release chum, wild coho, and wild Chinook. Anglers may fish with two poles with Two-Pole Endorsement. (Toliva Shoal, Northern/Southern Budd Inlet, and Fox Island Pier run separate tables.)",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-13", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 13)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma13-halibut-closed", speciesId: "pacific_halibut", regAreaId: "wa-ma-13", kind: "prohibited",
    verbatim: "Pacific Halibut (Marine Area 13): CLOSED — CLOSED to fishing for, retaining, or possessing.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-13", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 13)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  // ——— v4 (deepen pass): Crab Rules page verbatim (2026-27 book, updated 2026-06-18) ———
  rule({
    id: "wa-ps-crab-core-note", speciesId: null, regAreaId: "wa-ps-crab", kind: "note",
    verbatim:
      "Crab (Puget Sound): A catch record card (CRC) and a crab endorsement are required for Dungeness crab in Puget Sound only. Any harvest after Labor Day must be recorded on a winter CRC. Must release all softshell crab (underside of shell flexes with finger pressure). Fishing instruments must not penetrate the shell. It is unlawful to possess crab in the field without retaining the back shell. May not retain any species of crab other than Dungeness, Red Rock, and Tanner.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "wa-ps-crab-season-note", speciesId: null, regAreaId: "wa-ps-crab", kind: "note",
    verbatim:
      "Marine Areas 4 (east of the Bonilla-Tatoosh line), 5, 6, 7 South, 7 North, 8-1, 8-2, 9, 10, 11 and 12 (North of Ayock Point): For seasons go to wdfw.wa.gov/fishing/shellfishing-regulations/crab#marine-area. The dates for the season will be available in late May or early June to accommodate co-management obligations and complete preseason test fishing and quota setting. All Dungeness crab kept must be immediately recorded on a catch record card in ink. (Padilla Bay: crab fishing within 25 yards of the Burlington-Northern railroad trestles at the north end of Swinomish Slough is only allowed from one hour before official sunrise to one hour after official sunset.)",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ps-dungeness-bag", speciesId: "dungeness_crab", regAreaId: "wa-ps-crab", kind: "bag_limit",
    verbatim: "Dungeness Crab (Puget Sound Daily Limits/Rules): 5 crabs, 6¼\" minimum size, males only, and in hardshell condition.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 6.25, maxSizeIn: null, sizeMeasure: "carapace_width", platformScope: null,
    depthNote: "Males only, hardshell condition; CRC endorsement required; record in ink immediately.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa-ps-redrock-bag", speciesId: "red_rock_crab", regAreaId: "wa-ps-crab", kind: "bag_limit",
    verbatim: "Red Rock Crab (Puget Sound Daily Limits/Rules): 6 crabs, 5\" minimum size, of either sex, and in hardshell condition.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 5, maxSizeIn: null, sizeMeasure: "carapace_width", platformScope: null, depthNote: "Either sex, hardshell.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa-ps-tanner-bag", speciesId: "tanner_crab", regAreaId: "wa-ps-crab", kind: "bag_limit",
    verbatim: "Tanner Crab (Puget Sound Daily Limits/Rules): 6 crabs, 4½\" minimum size, of either sex, and in hardshell condition. Measure at the widest portion of the shell.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 4.5, maxSizeIn: null, sizeMeasure: "carapace_width", platformScope: null, depthNote: "Either sex, hardshell; measure at widest portion of shell.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa-ps-greencrab-prohibited", speciesId: "european_green_crab", regAreaId: "wa-ps-crab", kind: "prohibited",
    verbatim:
      "European Green Crab — Help Stop the Spread: If caught please REPORT and RELEASE (it is illegal to retain or transport them alive). European green crabs are classified as prohibited species and it is illegal to retain/harvest them. Report: wdfw.wa.gov/greencrab, WA Invasives app, 1-888-WDFW-AIS, ais@wdfw.wa.gov.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Report-and-release; keeps-of-molt allowed.",
    checkInseason: false, staleAfterDays: 365,
  }),
  rule({
    id: "wa-ma13-crab-closed", speciesId: "dungeness_crab", regAreaId: "wa-ma-13", kind: "prohibited",
    verbatim: "Marine Areas 12 (south of Ayock Point), and 13 — Dungeness, Red Rock, and Tanner Crab: Closed to crab harvest in 2026.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "All crab harvest closed 2026 (book year).",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ma13-redrock-closed", speciesId: "red_rock_crab", regAreaId: "wa-ma-13", kind: "prohibited",
    verbatim: "Marine Areas 12 (south of Ayock Point), and 13 — Dungeness, Red Rock, and Tanner Crab: Closed to crab harvest in 2026.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "All crab harvest closed 2026 (book year).",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ma13-tanner-closed", speciesId: "tanner_crab", regAreaId: "wa-ma-13", kind: "prohibited",
    verbatim: "Marine Areas 12 (south of Ayock Point), and 13 — Dungeness, Red Rock, and Tanner Crab: Closed to crab harvest in 2026.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "All crab harvest closed 2026 (book year).",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ocean-dungeness-bag", speciesId: "dungeness_crab", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim: "Dungeness Crab (Pacific Ocean Daily Limits/Rules): 6 crabs, 6\" minimum size, males only, and in hardshell condition.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 6, maxSizeIn: null, sizeMeasure: "carapace_width", platformScope: null, depthNote: "Males only, hardshell.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa-ocean-redrock-bag", speciesId: "red_rock_crab", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim: "Red Rock Crab (Pacific Ocean Daily Limits/Rules): 6 crabs, 5\" minimum size, of either sex, and in hardshell condition.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 5, maxSizeIn: null, sizeMeasure: "carapace_width", platformScope: null, depthNote: "Either sex, hardshell.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa-ocean-crab-pot-season", speciesId: null, regAreaId: "wa-ma-1-4-coastal", kind: "season",
    verbatim:
      "Grays Harbor, and Marine Areas 1-3 and 4 (west of Bonilla-Tatoosh line) — Dungeness and Red Rock Crab: Open December 1 to September 15 for Pot Gear. Open year-round to other gear.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: "12-01", seasonEnd: "09-15", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Pot-gear window (wraps the calendar year); non-pot gear year-round.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-willapa-crab-pot-season", speciesId: null, regAreaId: "wa-willapa-bay", kind: "season",
    verbatim:
      "Willapa Bay — Dungeness and Red Rock Crab: November 15 to September 15 for Pot Gear. Open year-round to other gear.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: "11-15", seasonEnd: "09-15", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Pot-gear window (wraps the calendar year); non-pot gear year-round.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-willapa-dungeness-bag", speciesId: "dungeness_crab", regAreaId: "wa-willapa-bay", kind: "bag_limit",
    verbatim: "Dungeness Crab (Pacific Ocean Daily Limits/Rules): 6 crabs, 6\" minimum size, males only, and in hardshell condition. (Willapa Bay runs the Pacific Ocean limits block per the Crab Rules area table.)",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 6, maxSizeIn: null, sizeMeasure: "carapace_width", platformScope: null, depthNote: "Males only, hardshell.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa-willapa-redrock-bag", speciesId: "red_rock_crab", regAreaId: "wa-willapa-bay", kind: "bag_limit",
    verbatim: "Red Rock Crab (Pacific Ocean Daily Limits/Rules): 6 crabs, 5\" minimum size, of either sex, and in hardshell condition. (Willapa Bay runs the Pacific Ocean limits block per the Crab Rules area table.)",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 5, maxSizeIn: null, sizeMeasure: "carapace_width", platformScope: null, depthNote: "Either sex, hardshell.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa-col-crab-season", speciesId: null, regAreaId: "wa-columbia-river", kind: "season",
    verbatim:
      "East of a line from exposed end of north and south jetty upstream to a line between Tongue Point and Rocky Point — Dungeness and Red Rock Crab: Open year-round to all gear. Crab fishers may fish for crab in Oregon waters under Oregon rules and land into Washington ports of the Columbia River. A resident license from either state is required.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "OR reciprocity: WA/OR resident license valid; landings allowed into WA ports.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "wa-col-dungeness-bag", speciesId: "dungeness_crab", regAreaId: "wa-columbia-river", kind: "bag_limit",
    verbatim: "Dungeness Crab (Columbia River Daily Limits/Rules): 12 crabs, 5¾\" minimum size, males only, and in hardshell condition.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 12, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 5.75, maxSizeIn: null, sizeMeasure: "carapace_width", platformScope: null, depthNote: "Males only, hardshell.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "wa-col-redrock-bag", speciesId: "red_rock_crab", regAreaId: "wa-columbia-river", kind: "bag_limit",
    verbatim: "Red Rock Crab (Columbia River Daily Limits/Rules): 6 crabs, 5\" minimum size, of either sex, and in hardshell condition.",
    sourceUrl: C2.url, sourceTitle: C2.title, sourceUpdatedAt: C2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 5, maxSizeIn: null, sizeMeasure: "carapace_width", platformScope: null, depthNote: "Either sex, hardshell.",
    checkInseason: true, staleAfterDays: 14,
  }),
  // ——— v5 (deepen pass): Shrimp Rules page verbatim (2026-27 book, updated 2026-06-18) ———
  rule({
    id: "wa-ps-shrimp-spot-bag", speciesId: "spot_shrimp", regAreaId: "wa-ma-5-13-inside", kind: "bag_limit",
    verbatim:
      "Puget Sound (Marine Areas 5-13 and Marine Area 4 east of the Bonilla-Tatoosh line): Daily limit of 80 spot shrimp. Daily limit of 10 pounds, heads and tails, of all shrimp species combined (maximum of 80 spot shrimp — if open for spot shrimp). First opening date will occur in May.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 80, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null,
    depthNote: "Capped inside a 10-lb all-species combined daily limit; first opening occurs in May (dates announced late March/early April).",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ps-shrimp-gear-note", speciesId: null, regAreaId: "wa-ma-5-13-inside", kind: "gear",
    verbatim:
      "Shrimp (Puget Sound): minimum mesh size for shrimp pots is 1\" mesh. June 1 through October 15: minimum mesh is 1\", unless the area is closed for spot shrimp but open for coonstripe and pink shrimp, then minimum mesh is ½\"; in those areas all spot shrimp caught must be returned to the water immediately. If retaining non-spot shrimp, all shrimp heads (spot and non-spot) must be retained in the field until ashore and finished fishing for the day. All Areas: each harvester must have a separate container for their catch; no minimum carapace size; maximum of two shrimp pots per person, no more than four shrimp pots per boat.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ps-shrimp-season-note", speciesId: null, regAreaId: "wa-ma-5-13-inside", kind: "season",
    verbatim:
      "Marine Areas 4 (east of Bonilla-Tatoosh line), 5, 6, 7 East, 7 South, 7 West, 8-1, 8-2, 9, 10, 11, 12, Discovery Bay Shrimp Area: For shrimp season open dates and times go to wdfw.wa.gov/fishing/shellfishing-regulations/shrimp/areas. The dates for the upcoming 2027 season will be announced and available in late March or early April to accommodate co-management obligations, account for extreme tides, and complete pre-season test fishing and quota setting. Discovery Bay Shrimp Area: waters south of a line from McCurdy Point on the Quimper Peninsula to the northern tip of Protection Island then to Rocky Point on the Miller Peninsula and all waters of Discovery Bay.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ps-spot-closed-2026", speciesId: "spot_shrimp", regAreaId: "wa-ma-5-13-inside", kind: "prohibited",
    verbatim:
      "During 2026 Marine Areas 8-1, 8-2, 9, 10, 11, and 13 have been CLOSED to spot shrimp harvest.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null,
    depthNote: "Spot closed (2026 book year) in 8-1/8-2/9/10/11/13; coonstripe + pink stay open there — ½\" mesh + immediate spot release rules apply.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma9-spotshrimp-closed", speciesId: "spot_shrimp", regAreaId: "wa-ma-9", kind: "prohibited",
    verbatim: "During 2026 Marine Areas 8-1, 8-2, 9, 10, 11, and 13 have been CLOSED to spot shrimp harvest.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma10-spotshrimp-closed", speciesId: "spot_shrimp", regAreaId: "wa-ma-10", kind: "prohibited",
    verbatim: "During 2026 Marine Areas 8-1, 8-2, 9, 10, 11, and 13 have been CLOSED to spot shrimp harvest.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma13-spotshrimp-closed", speciesId: "spot_shrimp", regAreaId: "wa-ma-13", kind: "prohibited",
    verbatim: "During 2026 Marine Areas 8-1, 8-2, 9, 10, 11, and 13 have been CLOSED to spot shrimp harvest.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ocean-shrimp-bag", speciesId: null, regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "Pacific Ocean (Marine Areas 1-3 and Marine Area 4 west of the Bonilla-Tatoosh line): Daily limit of 25 pounds, heads and tails, of all shrimp species combined (maximum of 200 spot shrimp). Shrimp heads may be removed, but must be retained while in the field, until ashore and finished fishing for the day. The minimum mesh size for shrimp pots is 1\" mesh.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null,
    depthNote: "25 lb combined (heads+tails); spot component capped at 200 individuals.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "wa-ocean-shrimp-season", speciesId: "spot_shrimp", regAreaId: "wa-ma-1-4-coastal", kind: "season",
    verbatim:
      "Pacific Ocean Marine Areas 1-3 and 4 (west of Bonilla-Tatoosh line) — All Species: Year-round. Open daily. Note: Pacific Ocean shrimp grounds are located a considerable distance from shore (30 miles or more) and as a result are generally inaccessible by the casual sport fisher.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: "Grounds 30+ mi offshore.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "wa-ocean-spot-cap", speciesId: "spot_shrimp", regAreaId: "wa-ma-1-4-coastal", kind: "bag_limit",
    verbatim:
      "Pacific Ocean (Marine Areas 1-3 and Marine Area 4 west of the Bonilla-Tatoosh line): Daily limit of 25 pounds, heads and tails, of all shrimp species combined — maximum of 200 spot shrimp.",
    sourceUrl: S2.url, sourceTitle: S2.title, sourceUpdatedAt: S2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 200, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Spot component cap inside the 25-lb combined limit.",
    checkInseason: true, staleAfterDays: 30,
  }),
  // ——— v6 (deepen pass): structured chinook season rows for MA 9/10/13, promoted from
  // the v3 headline notes. Windows quoted verbatim; wild-vs-hatchery clauses stay in
  // depthNote because the engine cannot tell a wild chinook from a hatchery one. ———
  rule({
    id: "wa-ma9-chinook-opener", speciesId: "chinook_salmon", regAreaId: "wa-ma-9", kind: "season",
    verbatim:
      "Salmon (Entire Area, MA9): July 16-July 18: Chinook - min. size 22 in. Other salmon species - no min. size. Daily limit 2 including no more than 1 Chinook. Release chum, wild coho, and wild Chinook.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-9", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 9)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: "07-16", seasonEnd: "07-18", bagDaily: 1, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 22, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Hatchery chinook only (release wild); salmon aggregate 2; release chum + wild coho.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma9-chinook-closed-summer", speciesId: "chinook_salmon", regAreaId: "wa-ma-9", kind: "prohibited",
    verbatim:
      "Salmon (Entire Area, MA9): July 19-July 31: CLOSED. Aug. 1-Sept. 18: no min. size, daily limit 2, release Chinook, chum, and wild coho. Sept. 19-Sept. 30: no min. size, daily limit 2, release Chinook and chum.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-9", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 9)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: "07-19", seasonEnd: "09-30", bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Chinook release Jul 19-Sep 30 (Jul 19-31 all-salmon CLOSED outright).",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma10-chinook-release-early", speciesId: "chinook_salmon", regAreaId: "wa-ma-10", kind: "prohibited",
    verbatim:
      "Salmon (Entire Area, MA10): June 1-July 22: no min. size, daily limit 2, release Chinook and chum.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-10", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 10)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: "06-01", seasonEnd: "07-22", bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Chinook release; other salmon 2/day.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma10-chinook-opener", speciesId: "chinook_salmon", regAreaId: "wa-ma-10", kind: "season",
    verbatim:
      "Salmon (Entire Area, MA10): July 23-July 25: Chinook min. 22 in, daily limit 2 including no more than 1 Chinook, release chum and wild Chinook.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-10", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 10)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: "07-23", seasonEnd: "07-25", bagDaily: 1, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 22, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Hatchery chinook only (release wild); salmon aggregate 2; release chum.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma10-chinook-release-late", speciesId: "chinook_salmon", regAreaId: "wa-ma-10", kind: "prohibited",
    verbatim:
      "Salmon (Entire Area, MA10): July 26-Sept. 30: no min. size, daily limit 2, release Chinook and chum. Oct. 1-Nov. 15: no min. size, daily limit 2, release Chinook.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-10", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 10)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: "07-26", seasonEnd: "11-15", bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Chinook release; other salmon 2/day (release chum through Sep 30).",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma10-salmon-closed-winter", speciesId: null, regAreaId: "wa-ma-10", kind: "season",
    verbatim: "Salmon (Entire Area, MA10): Nov. 16-Mar. 30: CLOSED.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-10", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 10)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: "11-16", seasonEnd: "03-30", bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "All-salmon closed (window wraps New Year's).",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma10-chinook-spring", speciesId: "chinook_salmon", regAreaId: "wa-ma-10", kind: "season",
    verbatim:
      "Salmon (Entire Area, MA10): Mar. 31-Apr. 30: open Wed.-Sat. only, Chinook min. 22 in, daily limit 2 including no more than 1 Chinook, release chum and wild Chinook.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-10", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 10)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: "03-31", seasonEnd: "04-30", bagDaily: 1, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 22, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Wed-Sat only (weekday gate is not modeled); hatchery chinook only; aggregate 2.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma13-chinook-summer", speciesId: "chinook_salmon", regAreaId: "wa-ma-13", kind: "season",
    verbatim:
      "Salmon (Entire Area, MA13): July 1-Sept. 30: Chinook - min. size 20 in. Other salmon species - no min. size. Daily limit 2. Release chum, wild coho, and wild Chinook.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-13", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 13)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "09-30", bagDaily: 2, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 20, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Hatchery chinook only (release wild); salmon aggregate 2; release chum + wild coho.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "wa-ma13-chinook-winter", speciesId: "chinook_salmon", regAreaId: "wa-ma-13", kind: "season",
    verbatim:
      "Salmon (Entire Area, MA13): Oct. 1-June 30: Chinook - min. size 22 in. Other salmon species - no min. size. Daily limit 2. Release chum, wild coho, and wild Chinook. Anglers may fish with two poles with Two-Pole Endorsement.",
    sourceUrl: "https://www.eregulations.com/washington/fishing/marine-area-13", sourceTitle: "WDFW — 2026-2027 Washington Sport Fishing Rules (Marine Area 13)", sourceUpdatedAt: "2026-06-18", verifiedAt: VERIFIED,
    seasonStart: "10-01", seasonEnd: "06-30", bagDaily: 2, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 22, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Wraps New Year's; hatchery chinook only; two-pole endorsement allowed.",
    checkInseason: true, staleAfterDays: 7,
  }),
];

export const WASHINGTON = {
  pack: WASHINGTON_PACK,
  areas: WA_AREAS,
  groups: WA_GROUPS,
  rules: WA_RULES,
};
