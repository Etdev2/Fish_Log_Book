/**
 * Oregon pack — `oregon-2026-09-02`.
 *
 * PNW wave (24-state expansion, 2026-09-02). Ocean-only, flagship-first: the ODFW
 * marine-zone table anglers actually fish (general marine species, lingcod, cabezon,
 * flatfish, sablefish, long-leader, halibut) with every number verbatim from an
 * official source. Salmon and shellfish are deliberately NOT shipped — no verified
 * current-year verbatim pulled yet (verified-or-nothing).
 *
 * Verified 2026-09-02 against ODFW + NOAA primary sources:
 *   A = https://myodfw.com/sport-bottomfish-seasons
 *       ("2026 recreational bottomfish seasons/regulations", page updated 2025-12-31)
 *   B = https://myodfw.com/news/commission-sets-2026-groundfish-seasons
 *       (ODFW Commission press release, December 12, 2025)
 *   C = https://myodfw.com/recreation-report/fishing-report/marine-zone
 *       (ODFW Marine Zone recreation report, current through 2026-08-27)
 *   D = https://www.fisheries.noaa.gov/action/2026-pacific-halibut-recreational-fishery
 *       (NOAA West Coast: final rule published 2026-05-01, Area 2A 2026 CSP)
 *   E = https://myodfw.com/sites/default/files/2018-06/2018-groundfish%20fishery%20what%20can%20i%20keep-07012018%20update.pdf
 *       (ODFW flyer: mandatory descending-device rule)
 *   v2 deepen adds: ODFW "Start crabbing" / Dungeness crab species page, ODFW Marine
 *   Zone crabbing & clamming report (Aug 27 2026), ODFW European green crab note.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const OREGON_PACK: RegPack = {
  id: "oregon-2026-09-02",
  version: 2,
  publishedAt: "2026-09-02T12:00:00Z",
  notes:
    "Oregon ocean (ODFW): 2026 marine bottomfish table verbatim — general marine 4/day " +
    "all depths year-round, canary 2 sub-bag, cabezon 1 (Jul–Dec, 16-inch), lingcod 3 " +
    "(22-inch), sablefish 10, flatfish 25, offshore long-leader 10, halibut per the " +
    "federal Area 2A catch-sharing plan. Yelloweye and quillback rockfish retention " +
    "prohibited; descending device mandatory on boats. v2 deepens: multi-species/salmon- " +
    "hook doctrine, 30-fathom descender use, and shellfish — Dungeness (males >=5.75in, " +
    "ocean closed Oct 16-Nov 30, 3 pots, license 12+), green crab 35/day, razor clam " +
    "Clatsop seasonal closure Jul 15-Sep 30 + first-15 keep.",
};

const A = {
  url: "https://myodfw.com/sport-bottomfish-seasons",
  title: "ODFW — Sport Bottomfish Seasons (2026 recreational bottomfish seasons/regulations)",
  updated: "2025-12-31",
} as const;
const B = {
  url: "https://myodfw.com/news/commission-sets-2026-groundfish-seasons",
  title: "ODFW — Commission sets 2026 groundfish seasons (press release)",
  updated: "2025-12-12",
} as const;
const C = {
  url: "https://myodfw.com/recreation-report/fishing-report/marine-zone",
  title: "ODFW — Marine Zone Recreation Report",
  updated: "2026-08-27",
} as const;
const D = {
  url: "https://www.fisheries.noaa.gov/action/2026-pacific-halibut-recreational-fishery",
  title: "NOAA Fisheries — 2026 Pacific Halibut Recreational Fishery (final rule, Area 2A)",
  updated: "2026-05-01",
} as const;
const E = {
  url: "https://myodfw.com/sites/default/files/2018-06/2018-groundfish%20fishery%20what%20can%20i%20keep-07012018%20update.pdf",
  title: "ODFW — Groundfish: what can I keep, and how many? (descending device rule)",
  updated: "2018-07-01",
} as const;
const VERIFIED = "2026-09-02";
const pv = 2;

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const OR_AREAS: readonly RegArea[] = [
  {
    // Full marine zone: WA border (46.25) to CA border (42.0).
    id: "or-marine",
    authority: "odfw",
    kind: "ocean_region",
    name: "Oregon marine zone (ocean waters)",
    polygon: [
      [-124.6, 42.0], [-124.2, 43.4], [-124.1, 44.6], [-124.05, 45.5], [-124.0, 46.25],
      [-123.9, 46.25], [-124.6, 46.25], [-124.6, 42.0],
    ],
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes:
      "Envelope. ODFW Marine Zone = ocean plus bay stumps; estuary/river rules are NOT in " +
      "this pack yet. Inseason changes are common — see the inseason note row.",
  },
  {
    // Halibut (NOAA Area 2A): Cape Falcon (45.77 N) south to Humbug Mountain (42.67 N).
    id: "or-halibut-central",
    authority: "noaa",
    kind: "ocean_region",
    name: "Central Oregon Coast halibut subarea (Cape Falcon to Humbug Mountain)",
    polygon: [
      [-124.4, 42.67], [-124.3, 44.0], [-124.1, 45.77], [-124.0, 45.77],
      [-124.0, 42.67], [-124.3, 42.67], [-124.4, 42.67],
    ],
    sourceUrl: D.url,
    verifiedAt: VERIFIED,
    notes: "IPHC Area 2A wording: “Central Coast”. Nearshore = inside 40 fm.",
  },
  {
    id: "or-halibut-southern",
    authority: "noaa",
    kind: "ocean_region",
    name: "Southern Oregon halibut subarea (Humbug Mountain to the California border)",
    polygon: [
      [-124.4, 42.0], [-124.4, 42.67], [-124.0, 42.67], [-124.0, 42.0], [-124.4, 42.0],
    ],
    sourceUrl: D.url,
    verifiedAt: VERIFIED,
    notes: "IPHC Area 2A Oregon Southern Coast allocation (8,000 lb for 2026).",
  },
];

export const OR_GROUPS: readonly RegGroup[] = [
  {
    id: "or-general-marine",
    name: "General marine species (rockfish, cabezon, greenling, skates, etc.)",
    memberSpeciesIds: [
      "rockfish", "black_rockfish", "blue_rockfish", "canary_rockfish", "copper_rockfish",
      "quillback_rockfish", "vermilion_rockfish", "yelloweye_rockfish", "bocaccio",
      "widow_rockfish", "yellowtail_rockfish", "cabezon", "kelp_greenling",
    ],
  },
  {
    id: "or-longleader",
    name: "Offshore long-leader bag (10 named rockfish species)",
    memberSpeciesIds: [
      "yellowtail_rockfish", "widow_rockfish", "canary_rockfish", "blue_rockfish",
      "bocaccio",
    ],
  },
];

export const OR_RULES: readonly RegRule[] = [
  rule({
    id: "or-gms-season", speciesId: "rockfish", regGroupId: "or-general-marine", regAreaId: "or-marine", kind: "season",
    verbatim:
      "Rockfish / Cabezon / Lingcod / Etc.: Open at all-depths year-round, no seasonal depth restriction.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "or-gms-bag", speciesId: null, regGroupId: "or-general-marine", regAreaId: "or-marine", kind: "bag_limit",
    verbatim:
      "General marine species (rockfish, cabezon, greenling, skates, etc.): 4-fish daily bag limit per angler beginning January 1, 2026.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-canary-subbag", speciesId: "canary_rockfish", regAreaId: "or-marine", kind: "bag_limit",
    verbatim:
      "Canary rockfish: 2-fish daily sub-bag limit per angler as part of the general marine bag limit, beginning January 1, 2026.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-cabezon-closed", speciesId: "cabezon", regAreaId: "or-marine", kind: "season",
    verbatim:
      "Cabezon: 1-fish daily sub-bag limit per angler as part of the general marine bag limit beginning July 1, 2026. Minimum length of 16 inches. No retention January 1 through June 30.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "06-30", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-cabezon-open", speciesId: "cabezon", regAreaId: "or-marine", kind: "bag_limit",
    verbatim:
      "Cabezon: 1-fish daily sub-bag limit per angler as part of the general marine bag limit beginning July 1, 2026. Minimum length of 16 inches. No retention January 1 through June 30.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "12-31", bagDaily: 1, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-lingcod-bag", speciesId: "lingcod", regAreaId: "or-marine", kind: "bag_limit",
    verbatim:
      "Lingcod: 3-fish daily bag limit per angler beginning January 1, 2026 with a minimum length limit of 22 inches. Lingcod are not part of the general marine species bag limit.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 22, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-sablefish-bag", speciesId: "sablefish", regAreaId: "or-marine", kind: "bag_limit",
    verbatim:
      "Sablefish: 10-fish daily bag limit per angler. Sablefish are not part of the general marine species bag limit.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-flatfish-bag", speciesId: "flatfish", regAreaId: "or-marine", kind: "bag_limit",
    verbatim:
      "Flatfish daily bag limit is 25 fish for species of sanddab, sole, flounder, etc. Does not include Pacific halibut. Open at all depths year round.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-longleader", speciesId: null, regGroupId: "or-longleader", regAreaId: "or-marine", kind: "note",
    verbatim:
      "Offshore long-leader gear fishery: The daily bag limit is 10 fish per angler. For canary rockfish, there is a daily sub-bag limit of two fish per angler beginning January 1, 2026. The only species allowed in the daily long-leader gear bag limit are: yellowtail, widow, canary, redstripe, greenstriped, silvergray, chilipepper, blue, deacon, and bocaccio rockfishes. Lingcod cannot be retained. Offshore long-leader gear fishery trips cannot be combined with traditional bottomfish trips.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: "Offshore long-leader fishery only.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-yelloweye-prohibited", speciesId: "yelloweye_rockfish", regAreaId: "or-marine", kind: "prohibited",
    verbatim:
      "Retention of quillback rockfish and yelloweye rockfish remains prohibited. Yelloweye rockfish is a protected species.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-quillback-prohibited", speciesId: "quillback_rockfish", regAreaId: "or-marine", kind: "prohibited",
    verbatim:
      "Retention of quillback rockfish and yelloweye rockfish remains prohibited.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-descending-device", speciesId: null, regAreaId: "or-marine", kind: "note",
    verbatim:
      "Any vessel fishing for or possessing bottomfish, Pacific halibut, or flatfish in the ocean must have a functional descending device onboard; and are required to use it on any rockfish released outside of 30 fathoms.",
    sourceUrl: E.url, sourceTitle: E.title, sourceUpdatedAt: E.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "or-inseason-check", speciesId: null, regAreaId: "or-marine", kind: "note",
    verbatim:
      "Regulations can change inseason, check https://myodfw.com/fishing/marine-zone before you go fishing. The Commission set the 2026 groundfish regulations December 12, 2025; the marine bag and lingcod limits were trimmed inseason in 2025 when harvest guidelines approached.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  // ——— Pacific halibut (federal CSP; ODFW links to NOAA) ———
  rule({
    id: "or-halibut-bag", speciesId: "pacific_halibut", regAreaId: "or-halibut-central", kind: "bag_limit",
    verbatim:
      "Oregon: The daily bag limit is two Pacific halibut of any size per person unless otherwise specified through inseason action.",
    sourceUrl: D.url, sourceTitle: D.title, sourceUpdatedAt: D.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "or-halibut-central-nearshore", speciesId: "pacific_halibut", regAreaId: "or-halibut-central", kind: "season",
    verbatim:
      "Central Coast nearshore — Cape Falcon south to Humbug Mountain, shoreward of a boundary line approximating the 40-fm depth contour: May 1 through October 31, 7 days a week. The area will be closed when there is not sufficient subarea allocation for another full day of fishing.",
    sourceUrl: D.url, sourceTitle: D.title, sourceUpdatedAt: D.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "10-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: "Nearshore: inside 40 fathoms.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "or-halibut-central-alldepth-spring", speciesId: "pacific_halibut", regAreaId: "or-halibut-central", kind: "season",
    verbatim:
      "Central Coast all-depth — Spring: May 1 through July 31, 7 days a week. Summer: August 1 through October 31, 7 days a week. The area will be closed when there is not sufficient subarea allocation for another full day of fishing.",
    sourceUrl: D.url, sourceTitle: D.title, sourceUpdatedAt: D.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "07-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: "All-depth window (spring).",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "or-halibut-central-alldepth-summer", speciesId: "pacific_halibut", regAreaId: "or-halibut-central", kind: "season",
    verbatim:
      "Central Coast all-depth — Spring: May 1 through July 31, 7 days a week. Summer: August 1 through October 31, 7 days a week. The area will be closed when the remaining combined spring and summer allocations are not sufficient for another full day of fishing.",
    sourceUrl: D.url, sourceTitle: D.title, sourceUpdatedAt: D.updated, verifiedAt: VERIFIED,
    seasonStart: "08-01", seasonEnd: "10-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: "All-depth window (summer).",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "or-halibut-southern", speciesId: "pacific_halibut", regAreaId: "or-halibut-southern", kind: "season",
    verbatim:
      "Southern Oregon — Humbug Mountain to the Oregon/California border: May 1 through October 31, 7 days a week. The daily bag limit is two Pacific halibut of any size per person. The area will be closed when there is not sufficient subarea allocation for another full day of fishing.",
    sourceUrl: D.url, sourceTitle: D.title, sourceUpdatedAt: D.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "10-31", bagDaily: 2, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  // ——— v2 (deepen pass): groundfish-combination doctrine + shellfish ———
  rule({
    id: "or-descender-30fm", speciesId: "rockfish", regAreaId: "or-marine", kind: "note",
    verbatim:
      "Yelloweye and quillback rockfish are prohibited at all times and in all waters. Descending devices are mandatory; and must be used to release any rockfish outside of the 30-fathom regulatory line.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: "Rockfish released outside 30 fathoms must go down on a descending device.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-multispecies-halibut-longleader", speciesId: null, regAreaId: "or-marine", kind: "note",
    verbatim:
      "The multi-species rule prohibits fishing for, or taking and retaining any species of salmon, Pacific halibut or marine fish while possessing on board any species not allowed to be taken in the area at that time. Anglers are reminded that once salmon are on board, anglers are restricted to no more than 2 single point barbless hooks at all times when angling for salmon in the ocean or when angling for other species if a salmon has already been retained.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-dungeness-rule", speciesId: "dungeness_crab", regAreaId: "or-marine", kind: "gear",
    verbatim:
      "Only male crab 5-3/4 inches or larger may be kept. You can have up to three different pots, traps or rings in the water at one time. While crabbing in Oregon's bays and estuaries is open year-round, the ocean off the Oregon coast is closed to crabbing from Oct. 16 to Nov. 30. Everyone 12 years or older will need a shellfish license to clam or crab in Oregon.",
    sourceUrl: "https://myodfw.com/articles/start-crabbing", sourceTitle: "ODFW — Start crabbing (measuring, season, gear)", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 5.75, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Males only; ocean closed Oct 16 - Nov 30; measure across the back, in front of the spine (not tip to tip).",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "or-sh-crab-license-note", speciesId: "dungeness_crab", regAreaId: "or-marine", kind: "note",
    verbatim:
      "Always check for closures at the ODA Shellfish Safety page before harvesting shellfish, which includes clams, crabs and mussels. Call the ODA shellfish safety hotline at 1-800-448-2474. Recreational crabbers are prohibited from using certain line markings that are required in other fisheries (marine life entanglement prevention). Buoys must be marked in the ocean and bays.",
    sourceUrl: "https://myodfw.com/recreation-report/crabbing-clamming-report/marine-zone", sourceTitle: "ODFW — Marine Zone Crabbing & Clamming Report", sourceUpdatedAt: "2026-08-27", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "or-green-crab", speciesId: "european_green_crab", regAreaId: "or-marine", kind: "bag_limit",
    verbatim:
      "European green crab — the daily catch limit for European green crab is 35 per person per day; European green crab can be any size or sex. The Oregon Fish and Wildlife Commission increased the daily bag limit to 35 crab to help native shellfish.",
    sourceUrl: C.url, sourceTitle: "ODFW — European green crab (species page / Marine Zone recreation report)", sourceUpdatedAt: "2026-08-27", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 35, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Any size, any sex — invasive removal encouraged.",
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "or-razor-clam-clatsop", speciesId: "razor_clam", regAreaId: "or-marine", kind: "season",
    verbatim:
      "Annual conservation closure for razor clams north of Tillamook Head (Clatsop Beaches) begins July 15 and goes through September 30. The season will reopen October 1 unless there is a closure for toxin levels.",
    sourceUrl: "https://myodfw.com/recreation-report/crabbing-clamming-report/marine-zone", sourceTitle: "ODFW — Marine Zone Crabbing & Clamming Report", sourceUpdatedAt: "2026-08-27", verifiedAt: VERIFIED,
    seasonStart: "07-15", seasonEnd: "09-30", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "North of Tillamook Head (Clatsop Beaches) only; other beaches remain open except toxin closures.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "or-razor-first15", speciesId: "razor_clam", regAreaId: "or-marine", kind: "note",
    verbatim:
      "Clammers need to remember to keep the first 15 they dig, regardless of size or condition. (Razor clams.)",
    sourceUrl: "https://myodfw.com/recreation-report/crabbing-clamming-report/marine-zone", sourceTitle: "ODFW — Marine Zone Crabbing & Clamming Report", sourceUpdatedAt: "2026-08-27", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Keep the first 15 dug — wastage is prohibited.",
    checkInseason: true, staleAfterDays: 60,
  }),
];

export const OREGON = {
  pack: OREGON_PACK,
  areas: OR_AREAS,
  groups: OR_GROUPS,
  rules: OR_RULES,
};
