/**
 * The verified SoCal regulations pack, TypeScript side.
 *
 * This is the migration `20260901230000` dataset's offline floor: the app reads THESE
 * objects with no network, on a boat, in a canyon. The SQL copy exists so a server-side
 * pack pipeline (spec §12) can version and diff it later; neither side is allowed to
 * silently drift — `reg-data-parity.test.ts` compares the verbatim sentences against
 * the migration, the same way species-parity guards the vocabulary.
 *
 * Polygons: SIMPLIFIED WGS84 rings hand-drawn around the named landmarks the source
 * pages publish (Point Conception line, the coastal counties, the CCA corner
 * coordinates as popularly charted). They are for RESOLUTION and orientation, and every
 * one carries `simplified` in its notes. Exact legal lines live with the agency —
 * deep-linked from every card (spec §9: a map is not a substitute for the official
 * boundary).
 *
 * Groundfish RCA: the 50-fathom line is a connected-waypoint series in 50 CFR 660
 * Subpart C, not a depth number, and spec §9 forbids substituting sonar. We carry a
 * simplified waypoint polyline for display and orientation only; the card text names
 * the CFR, and CDFW's interactive map is the precising cross-reference.
 */
import type { RegArea, RegGroup, RegPack, RegRule, SocalPack } from "./types";

export const SOCAL_PACK: RegPack = {
  id: "socal-2026-09-01",
  version: 1,
  publishedAt: "2026-09-01T00:00:00.000Z",
  notes: "Hand-verified starter set. Bundle mirrors migration 20260901230000.",
};

const SOUTHERN_RING: readonly (readonly [number, number])[] = [
  [-120.4716, 34.4486], // Point Conception (34°27' N) — the named corner of the GMA
  [-121.6, 34.7],
  [-121.6, 32.2], // far offshore SW corner
  [-117.05, 32.28], // offshore at the border latitude
  [-117.1231, 32.5343], // border meets the surf
  [-117.27, 32.85], // San Diego
  [-117.38, 33.16], // Del Mar
  [-117.6, 33.2], // Carlsbad
  [-117.92, 33.42], // Dana Point
  [-118.12, 33.58], // Newport
  [-117.99, 33.68], // Seal Beach
  [-118.18, 33.715], // Long Beach harbor north wall
  [-118.32, 33.7], // San Pedro
  [-118.43, 33.712], // Pt. Fermin / PV east
  [-118.43, 33.75],
  [-118.9, 34.02], // Santa Monica/Malibu
  [-119.05, 34.06],
  [-119.29, 34.27], // Ventura
  [-119.69, 34.42], // Santa Barbara
  [-119.85, 34.41],
  [-120.25, 34.46], // Gaviota
];

export const REG_AREAS: readonly RegArea[] = [
  {
    id: "ca-ocean-southern",
    authority: "cdfw",
    kind: "ocean_region",
    name: "Southern — Point Conception to the U.S.–Mexico border",
    polygon: SOUTHERN_RING,
    sourceUrl: "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern",
    verifiedAt: "2026-09-01",
    notes: "Simplified polygon for orientation/resolution. Includes part of Santa Barbara County and all of Ventura, Los Angeles, Orange and San Diego counties.",
  },
  {
    id: "ca-gma-southern",
    authority: "cdfw",
    kind: "groundfish_management_area",
    name: "Southern Management Area — Point Conception to the U.S.–Mexico border",
    polygon: SOUTHERN_RING,
    sourceUrl: "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary",
    verifiedAt: "2026-09-01",
    notes: "Simplified polygon. CCR T14 §27.45(a). Eight Groundfish Exclusion Areas apply (§27.50) — CDFW interactive map is the legal reference.",
  },
  {
    id: "cca-santa-barbara",
    authority: "cdfw",
    kind: "conservation_area",
    name: "Cowcod Conservation Area (large block)",
    polygon: [
      [-118.837, 33.0],
      [-120.484, 33.0],
      [-120.484, 33.837],
      [-118.837, 33.837],
    ],
    sourceUrl: "https://wildlife.ca.gov/Conservation/Marine/Cowcod",
    verifiedAt: "2026-09-01",
    notes: "SIMPLIFIED box of the large CCA for orientation — the legal corners are in CCR T14 §27.82. Groundfish take prohibited inside.",
  },
  {
    id: "cca-south",
    authority: "cdfw",
    kind: "conservation_area",
    name: "Cowcod Conservation Area (south block)",
    polygon: [
      [-117.9, 32.55],
      [-118.1, 32.55],
      [-118.1, 32.767],
      [-117.9, 32.767],
    ],
    sourceUrl: "https://wildlife.ca.gov/Conservation/Marine/Cowcod",
    verifiedAt: "2026-09-01",
    notes: "SIMPLIFIED box of the southern CCA for orientation. Groundfish take prohibited inside.",
  },
  {
    id: "mpa-pt-dume",
    authority: "cdfw",
    kind: "conservation_area",
    name: "Point Dume State Marine Conservation Area",
    polygon: [
      [-118.72, 34.0],
      [-118.8, 33.99],
      [-118.82, 33.95],
      [-118.74, 33.955],
    ],
    sourceUrl: "https://wildlife.ca.gov/Conservation/Marine/MPAs",
    verifiedAt: "2026-09-01",
    notes: "SIMPLIFIED inset of one MPA as a pack example. The full MPA network is linked out to CDFW's interactive map until the MPA layer ships as its own pack.",
  },
];

/** The 50-fathom RCA line as orientation geometry (a polyline — a boundary, not an area). */
export const RCA_50FM_LINE: {
  readonly id: "rca-50fm-southern";
  readonly name: string;
  readonly points: readonly (readonly [number, number])[];
  readonly citation: string;
  readonly sourceUrl: string;
  readonly verifiedAt: string;
} = {
  id: "rca-50fm-southern",
  name: "50-fathom Rockfish Conservation Area boundary (simplified)",
  points: [
    [-120.6, 34.5],
    [-120.35, 34.25],
    [-119.9, 34.08],
    [-119.3, 33.95],
    [-119.0, 33.8],
    [-118.6, 33.6],
    [-118.25, 33.35],
    [-117.9, 33.1],
    [-117.5, 32.75],
    [-117.35, 32.5],
    [-117.2, 32.32],
  ],
  citation: "50 CFR Part 660, Subpart C (waypoint series)",
  sourceUrl:
    "https://www.fisheries.noaa.gov/west-coast/sustainable-fisheries/west-coast-groundfish-closed-areas",
  verifiedAt: "2026-09-01",
};

export const REG_GROUPS: readonly RegGroup[] = [
  {
    id: "paralabrax-bass",
    name: "Kelp bass, barred sand bass, spotted sand bass (Paralabrax)",
    memberSpeciesIds: ["kelp_bass", "barred_sand_bass", "spotted_sand_bass"],
  },
  {
    id: "rcg-complex",
    name: "Rockfish, Cabezon, and Greenlings complex (RCG)",
    memberSpeciesIds: [
      "rockfish",
      "vermilion_rockfish",
      "canary_rockfish",
      "yelloweye_rockfish",
      "copper_rockfish",
      "bocaccio",
      "blue_rockfish",
      "black_rockfish",
      "olive_rockfish",
      "gopher_rockfish",
      "cowcod",
      "cabezon",
      "kelp_greenling",
    ],
  },
];

const A = {
  url: "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern",
  title: "Current California Ocean Recreational Fishing Regulations — Southern Region",
  updated: "2026-09-01",
} as const;
const B = {
  url: "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary",
  title: "Summary of Recreational Groundfish Fishing Regulations",
  updated: "2026-06-23",
} as const;
const VERIFIED = "2026-09-01";

function rule(partial: Omit<RegRule, "id" | "regGroupId" | "speciesId" | "packVersion"> & {
  id: string;
  speciesId?: string | null;
  regGroupId?: string | null;
}): RegRule {
  return {
    speciesId: null,
    regGroupId: null,
    packVersion: 1,
    ...partial,
  };
}

export const REG_RULES: readonly RegRule[] = [
  // ---------------- California halibut ----------------
  rule({
    id: "hal-season", speciesId: "california_halibut", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "The recreational fishery for California halibut (Paralichthys californicus) remains open year-round.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "hal-bag", speciesId: "california_halibut", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "The daily bag and possession limit is five fish south of Point Sur, Monterey County.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "hal-size", speciesId: "california_halibut", regAreaId: "ca-ocean-southern", kind: "min_size",
    verbatim: "The minimum size limit is 22 inches total length.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 22, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),

  // ---------------- Paralabrax basses ----------------
  rule({
    id: "bass-season", regGroupId: "paralabrax-bass", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "The fisheries for kelp bass, barred sand bass, and spotted sand bass (Paralabrax species) remains open year-round.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "bass-bag", regGroupId: "paralabrax-bass", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "The daily bag and possession limit is five fish in any combination of species, except no more than 4 barred sand bass may be taken.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "bass-size", regGroupId: "paralabrax-bass", regAreaId: "ca-ocean-southern", kind: "min_size",
    verbatim: "The minimum size limit is 14 inches total length or 10 inches alternate length.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "bsb-bag", speciesId: "barred_sand_bass", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "no more than 4 barred sand bass may be taken",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),

  // ---------------- White seabass ----------------
  rule({
    id: "wsb-season", speciesId: "white_seabass", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "The recreational fishery for white seabass (Atractoscion nobilis) remains open year-round.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "wsb-bag", speciesId: "white_seabass", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "The daily bag and possession limit is three fish except that only one fish may be taken in waters south of Point Conception between March 15 and June 15.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "wsb-bag-window", speciesId: "white_seabass", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "between March 15 and June 15 [ south of Point Conception ] only one fish may be taken",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-03-15", seasonEnd: "2026-06-15", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "wsb-size", speciesId: "white_seabass", regAreaId: "ca-ocean-southern", kind: "min_size",
    verbatim: "The minimum size limit is 28 inches total length or 20 inches alternate length.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),

  // ---------------- California sheephead (platform-split) ----------------
  rule({
    id: "she-season-diver", speciesId: "california_sheephead", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "open year-round to divers and shore-based anglers",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "diver", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "she-season-shore", speciesId: "california_sheephead", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "open year-round to divers and shore-based anglers",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "shore", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "she-season-boat", speciesId: "california_sheephead", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "This fishery is open to boat-based anglers from March 1, 2026 through December 31, 2026.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-03-01", seasonEnd: "2026-12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "she-bag", speciesId: "california_sheephead", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "The daily bag and possession limit is 2 fish",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "she-size", speciesId: "california_sheephead", regAreaId: "ca-ocean-southern", kind: "min_size",
    verbatim: "a minimum size limit of 12 inches total length",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),

  // ---------------- Simple rows: whitefish / scorpionfish / leopard / yellowtail ----------------
  rule({
    id: "owf-season", speciesId: "ocean_whitefish", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "The recreational fishery for ocean whitefish (Caulolatilus princeps) is open year-round, at all depths.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "all depths",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "owf-bag", speciesId: "ocean_whitefish", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "The daily bag and possession limit is 10 fish within the general daily bag limit of 20 fish total.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "scp-season", speciesId: "california_scorpionfish", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "The recreational fishery for California scorpionfish (Scorpaena guttata) is open year-round, at all depths.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "all depths",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "scp-bag", speciesId: "california_scorpionfish", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "The daily bag and possession limit is 5 fish with no minimum size limit.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "leo-season", speciesId: "leopard_shark", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "The recreational fishery for leopard shark (Triakis semifasciata) is open year-round, at all depths.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "all depths",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "leo-bag", speciesId: "leopard_shark", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "The daily bag and possession limit is 3 fish with a minimum size limit of 36 inches total length.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 36, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "yt-season", speciesId: "yellowtail", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "The fishery for yellowtail (Seriola dorsalis) remains open year-round.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "yt-bag", speciesId: "yellowtail", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "The daily bag and possession limit is ten fish.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "yt-size", speciesId: "yellowtail", regAreaId: "ca-ocean-southern", kind: "min_size",
    verbatim: "The minimum size limit is 24 inches fork length, except that up to five fish less than 24 inches fork length may be taken or possessed.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),

  // ---------------- Giant sea bass: prohibited ----------------
  rule({
    id: "gsb-prohibited", speciesId: "giant_sea_bass", regAreaId: "ca-ocean-southern", kind: "prohibited",
    verbatim: "Giant Sea Bass (a.k.a. black sea bass) — Closed. Take of broomtail grouper, gulf grouper, and giant (black) sea bass (a type of grouper) is prohibited.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),

  // ---------------- Ocean salmon (in-season, harvest guideline) ----------------
  rule({
    id: "sal-season", speciesId: "chinook_salmon", regAreaId: "ca-ocean-southern", kind: "season",
    verbatim: "The recreational fishery for ocean salmon is open beginning September 1, 2026 south of Pigeon Point, San Mateo County, to the US-Mexico border. In this area, the season will continue through September 30, 2026 or until the 20,000 fish harvest guideline is reached, whichever is earlier.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-09-01", seasonEnd: "2026-09-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "sal-bag", speciesId: "chinook_salmon", regAreaId: "ca-ocean-southern", kind: "bag_limit",
    verbatim: "The daily bag and possession limit is 2 salmon of any species except coho (silver), which may not be taken or possessed.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "sal-size", speciesId: "chinook_salmon", regAreaId: "ca-ocean-southern", kind: "min_size",
    verbatim: "The salmon minimum size limit is 20 inches total length.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 20, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "coho-prohibited", speciesId: "coho_salmon", regAreaId: "ca-ocean-southern", kind: "prohibited",
    verbatim: "coho (silver) [salmon] may not be taken or possessed",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-09-01", seasonEnd: "2026-09-30", bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),

  // ---------------- RCG complex ----------------
  rule({
    id: "rcg-bag", regGroupId: "rcg-complex", regAreaId: "ca-gma-southern", kind: "bag_limit",
    verbatim: "RCG Complex: 10 fish in combination per person, except: Copper rockfish: 1 fish per person; Vermilion/sunset rockfish: 2 fish per person combined [all areas except Northern]; Canary rockfish: 2 fish per person.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "rcg-size", regGroupId: "rcg-complex", regAreaId: "ca-gma-southern", kind: "min_size",
    verbatim: "All Rockfish: No minimum size limit. Cabezon and Greenlings: No minimum size limit.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "rcg-zero", regGroupId: "rcg-complex", regAreaId: "ca-gma-southern", kind: "prohibited",
    verbatim: "These Rockfishes May Not Be Taken or Possessed in California — No Retention at Any Time: Bronzespotted Rockfish, Cowcod, Quillback Rockfish, and Yelloweye Rockfish (CCR T14, §28.55). Fishing is closed year-round, at all depths, no retention at any time (zero fish per person).",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "rcg-gear", regGroupId: "rcg-complex", regAreaId: "ca-gma-southern", kind: "gear",
    verbatim: "Descending Devices Required: No one may take or possess any federal groundfish from any boat or other floating device in ocean waters without a descending device in possession (CCR T14, §27.20(b)(2)).",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "rcg-exempt", regGroupId: "rcg-complex", regAreaId: "ca-gma-southern", kind: "note",
    verbatim: "Shore-based anglers and spear divers are exempt from seasons and depths. Divers and shore-based anglers are exempt from season and depth restrictions affecting the RCG Complex and other federally managed groundfish (CCR T14, §27.20(b)(1)(C) and (b)(1)(D)).",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // Species-level exceptions inside the complex
  rule({
    id: "copper-bag", speciesId: "copper_rockfish", regAreaId: "ca-gma-southern", kind: "bag_limit",
    verbatim: "Copper rockfish: 1 fish per person",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "vermilion-bag", speciesId: "vermilion_rockfish", regAreaId: "ca-gma-southern", kind: "bag_limit",
    verbatim: "Vermilion/sunset rockfish: 2 fish per person combined [all areas except Northern]",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "canary-bag", speciesId: "canary_rockfish", regAreaId: "ca-gma-southern", kind: "bag_limit",
    verbatim: "Canary rockfish: 2 fish per person",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  ...(["yelloweye_rockfish", "cowcod", "bronzespotted_rockfish", "quillback_rockfish"] as const).map(
    (speciesId) =>
      rule({
        id: `zero-${speciesId}`, speciesId, regAreaId: "ca-gma-southern", kind: "prohibited",
        verbatim: "No Retention at Any Time (CCR T14, §28.55). Closed year-round, at all depths (zero fish per person).",
        sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
        seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
        minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
        checkInseason: false, staleAfterDays: 60,
      }),
  ),

  // Southern GMA season windows (nearshore RCG vs shelf/slope + lingcod Oct–Dec split)
  rule({
    id: "rcg-win-1", regGroupId: "rcg-complex", regAreaId: "ca-gma-southern", kind: "season",
    verbatim: "Southern Management Area, Nearshore Rockfish, Cabezon, and Greenlings: Jan 1 - Mar 31: Closed — unlawful to possess in all waters.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-01-01", seasonEnd: "2026-03-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "closed — unlawful to possess in all waters",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "rcg-win-2", regGroupId: "rcg-complex", regAreaId: "ca-gma-southern", kind: "season",
    verbatim: "Southern Management Area, Nearshore Rockfish, Cabezon, and Greenlings: April 1 - June 30: Open All Depths.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-04-01", seasonEnd: "2026-06-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "open all depths",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "rcg-win-3", regGroupId: "rcg-complex", regAreaId: "ca-gma-southern", kind: "season",
    verbatim: "Southern Management Area, Nearshore Rockfish, Cabezon, and Greenlings: July 1 - Sep 30: 50 Fathom - Inshore Only. Take is prohibited seaward of the 50 fathom (300 feet) Rockfish Conservation Area boundary line.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-07-01", seasonEnd: "2026-09-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "50 fathom RCA: inshore only",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "rcg-win-4", regGroupId: "rcg-complex", regAreaId: "ca-gma-southern", kind: "season",
    verbatim: "Southern Management Area, Nearshore Rockfish, Cabezon, and Greenlings: Oct 1 - Dec 31: Closed — unlawful to possess in all waters.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-10-01", seasonEnd: "2026-12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "closed — unlawful to possess in all waters",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ling-win-1", speciesId: "lingcod", regAreaId: "ca-gma-southern", kind: "season",
    verbatim: "Southern Management Area, Shelf and Slope Rockfish and Lingcod: Jan 1 - Mar 31: Closed — unlawful to possess in all waters.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-01-01", seasonEnd: "2026-03-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "closed — unlawful to possess in all waters",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ling-win-2", speciesId: "lingcod", regAreaId: "ca-gma-southern", kind: "season",
    verbatim: "Southern Management Area, Shelf and Slope Rockfish and Lingcod: April 1 - June 30: Open All Depths.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-04-01", seasonEnd: "2026-06-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "open all depths",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ling-win-3", speciesId: "lingcod", regAreaId: "ca-gma-southern", kind: "season",
    verbatim: "Southern Management Area, Shelf and Slope Rockfish and Lingcod: July 1 - Sep 30: 50 Fathom - Inshore Only. Take is prohibited seaward of the 50 fathom (300 feet) Rockfish Conservation Area boundary line.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-07-01", seasonEnd: "2026-09-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "50 fathom RCA: inshore only",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ling-win-4b", speciesId: "lingcod", regAreaId: "ca-gma-southern", kind: "season",
    verbatim: "Southern Management Area, Shelf and Slope Rockfish and Lingcod: Oct 1 - Dec 31: 50 Fathom - Offshore Only. Take is prohibited shoreward of the 50 fathom (300 feet) Rockfish Conservation Area boundary line.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "2026-10-01", seasonEnd: "2026-12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "50 fathom RCA: offshore only",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ling-bag", speciesId: "lingcod", regAreaId: "ca-gma-southern", kind: "bag_limit",
    verbatim: "Lingcod (§28.27): 2 fish per person.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ling-size", speciesId: "lingcod", regAreaId: "ca-gma-southern", kind: "min_size",
    verbatim: "Lingcod (§28.27): minimum size 22\" total length.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 22, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
];

export const SOCAL: SocalPack = {
  pack: SOCAL_PACK,
  areas: REG_AREAS,
  groups: REG_GROUPS,
  rules: REG_RULES,
};

/** Species with at least one verified rule or group membership in this pack. */
export function speciesInPack(): readonly string[] {
  const ids = new Set<string>();
  for (const r of REG_RULES) {
    if (r.speciesId) ids.add(r.speciesId);
  }
  for (const g of REG_GROUPS) for (const id of g.memberSpeciesIds) ids.add(id);
  return [...ids];
}
