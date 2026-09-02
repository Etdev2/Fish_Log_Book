/**
 * Alaska pack — `alaska-2026-09-02`.
 *
 * Wave 4 (24-state expansion). Southeast Alaska Region 1 saltwater general
 * regulations, verbatim from the official 2026 booklet. Flagship-first king-salmon /
 * coho / halibut / lingcod / rockfish / sablefish coverage with the EEZ doctrine.
 * Kodiak, Southcentral, and shellfish deliberately NOT shipped yet (verified-or-
 * nothing, their regional booklets are a follow-up pass).
 *
 * Verified 2026-09-02 against:
 *   A = https://www.adfg.alaska.gov/static/regulations/fishregulations/PDFs/southeast/2026se_sfregs_general_freshwater_saltwater.pdf
 *       (ADF&G "2026 Southeast Alaska Sport Fishing Regulations Summary Book",
 *        General Regulations — Salt Water, pp. 10–13)
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const ALASKA_PACK: RegPack = {
  id: "alaska-2026-09-02",
  version: 2,
  publishedAt: "2026-09-02T18:00:00Z",
  notes:
    "Alaska — Southeast (ADF&G 2026 Region 1 summary book): saltwater year-round " +
    "except halibut/lingcod/DSR/crab/shrimp. Lingcod May 16–Nov 30 w/ nonresident " +
    "30–35 in-or-55 in+ slot and 2/yr; DSR nonresidents Jul 1–Aug 25 only, annual 1; " +
    "halibut closed January, unguided 2/day; pelagic 3 / slope 1 / DSR 1 rockfish " +
    "regimes; deepwater release device mandatory; EEZ switches everyone to " +
    "nonresident limits. Emergency orders control king salmon annually. v2 adds " +
    "North Gulf Coast (Resurrection Bay closures, NGC king/salmon/lingcod/EO rockfish " +
    "table) and Kodiak/Southwest (2026 EO king salmon + rockfish grid, lingcod, crab " +
    "tables, halibut Feb-Dec) verbatim.",
};

const A = {
  url: "https://www.adfg.alaska.gov/static/regulations/fishregulations/PDFs/southeast/2026se_sfregs_general_freshwater_saltwater.pdf",
  title: "ADF&G — 2026 Southeast Alaska Sport Fishing Regulations Summary Book (General Regulations: Salt Water)",
  updated: null,
} as const;
const B = {
  url: "https://www.adfg.alaska.gov/static/regulations/fishregulations/PDFs/southcentral/2026sc_sfregs_north_gulf_coast.pdf",
  title: "ADF&G — 2026 Southcentral Alaska Sport Fishing Regulations Summary Book (North Gulf Coast, Salt Water general & special regulations)",
  updated: null,
} as const;
const C = {
  url: "https://www.adfg.alaska.gov/static/regulations/fishregulations/PDFs/Southwest/2026sw_sfregs_kodiak_akpen_aleutian_salt.pdf",
  title: "ADF&G — 2026 Southwest Alaska Sport Fishing Regulations Summary Book (Kodiak Island, Alaska Peninsula & Aleutian Islands salt water)",
  updated: null,
} as const;
const VERIFIED = "2026-09-02";
const EO_NOTE = "www.adfg.alaska.gov/sf/EONR";
const pv = 2;

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const AK_AREAS: readonly RegArea[] = [
  {
    // State waters 0–3 nm, Cape Fairweather (58.8 N) south to Dixon Entrance (54.7 N).
    id: "ak-se-state",
    authority: "adfg",
    kind: "ocean_region",
    name: "Southeast Alaska — state waters (Cape Fairweather to Dixon Entrance, shoreline to 3 nm)",
    polygon: [
      [-139.3, 57.4], [-136.8, 56.4], [-135.9, 58.0], [-136.5, 59.4], [-139.0, 59.9],
      [-139.4, 59.6], [-139.3, 57.4],
    ],
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes:
      "Envelope of the Southeast saltwater general area. State waters run shoreline to " +
      "3 nautical miles; beyond that is the EEZ — see the EEZ doctrine row. " +
      "Management-area exceptions (Juneau/Glacier Bay, Sitka, Petersburg/Wrangell, " +
      "Ketchikan) live in the booklet's special section — not shipped yet.",
  },
  {
    id: "ak-se-eez",
    authority: "adfg",
    kind: "ocean_region",
    name: "Southeast Alaska — EEZ (3–200 nautical miles offshore)",
    polygon: null,
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes:
      "Marker area: ADF&G's booklet applies NONRESIDENT bag/possession/annual limits " +
      "and nonresident lingcod size limits to all anglers in the EEZ.",
  },
  // ——— v2 (broaden pass): Southcentral North Gulf Coast + Southwest Kodiak ———
  {
    id: "ak-ngc",
    authority: "adfg",
    kind: "ocean_region",
    name: "North Gulf Coast — within 200 miles of shore, Cape Fairfield to Gore Point (incl. Seward / North Gulf Coast fleet)",
    polygon: [
      [-152.5, 58.7], [-149.2, 59.9], [-148.3, 60.35], [-147.4, 60.0], [-147.5, 59.2],
      [-149.4, 58.8], [-152.5, 58.7],
    ],
    sourceUrl: B.url,
    verifiedAt: VERIFIED,
    notes:
      "Envelope between the longitudes of Gore Point (~152° W) and Cape Fairfield " +
      "(~147.5° W). ADF&G wording: within 200 miles of shore between those longitudes.",
  },
  {
    id: "ak-res-bay",
    authority: "adfg",
    kind: "ocean_region",
    name: "Resurrection Bay saltwaters (north of the Cape Resurrection–Aialik Cape line)",
    polygon: [
      [-149.55, 59.85], [-149.35, 60.05], [-149.15, 60.15], [-149.05, 59.95],
      [-149.3, 59.75], [-149.55, 59.85],
    ],
    sourceUrl: B.url,
    verifiedAt: VERIFIED,
    notes: "Lingcod closed year-round in the bay; king salmon seasons split on Aug 31.",
  },
  {
    id: "ak-kodiak",
    authority: "adfg",
    kind: "ocean_region",
    name: "Kodiak Island, Alaska Peninsula & Aleutian Islands salt waters (Southwest general)",
    polygon: [
      [-154.9, 57.0], [-151.9, 57.6], [-151.85, 58.1], [-153.0, 58.6], [-154.6, 58.4],
      [-155.4, 57.4], [-154.9, 57.0],
    ],
    sourceUrl: C.url,
    verifiedAt: VERIFIED,
    notes:
      "Envelope of waters circumjacent to Kodiak Island; API (Alaska Peninsula/Aleutian " +
      "Islands) coastal remainder follows the same 2026 general table except where " +
      "noted. 2026s are emergency-order series (kings 1/day Apr 1-Sep 15 island-wide, " +
      "eelgrass belt rockfish grid).",
  },
  {
    id: "ak-kodiak-north-belt",
    authority: "adfg",
    kind: "ocean_region",
    name: "Kodiak north belt (west of Afognak n. of Cape Ikolik; east n. of Dangerous Cape; stats areas 525701/525702)",
    polygon: [
      [-153.4, 57.29], [-152.8, 58.0], [-152.3, 57.9], [-152.7, 57.35], [-153.4, 57.29],
    ],
    sourceUrl: C.url,
    verifiedAt: VERIFIED,
    notes: "2026 EO belt. Rockfish: 5/day 10 poss; ≤2 of a single species; ≤1 yelloweye; ≤1 black.",
  },
  {
    id: "ak-kodiak-afognak-north",
    authority: "adfg",
    kind: "ocean_region",
    name: "Afognak & Shuyak Islands north of Tonki Cape (58°21.181'N) and Black Cape (58°24.583'N)",
    polygon: [
      [-153.1, 58.35], [-152.5, 58.6], [-152.2, 58.4], [-152.8, 58.21], [-153.1, 58.35],
    ],
    sourceUrl: C.url,
    verifiedAt: VERIFIED,
    notes: "2026 EO: rockfish 3/day ≤1 of a single species; lingcod 1/day ≥35 in (season Jul 1–Dec 31).",
  },
];

export const AK_GROUPS: readonly RegGroup[] = [
  {
    id: "akse-4salmon",
    name: "Chum, coho, pink & sockeye salmon (16 inches or longer)",
    memberSpeciesIds: ["chum_salmon", "coho_salmon", "pink_salmon", "sockeye_salmon"],
  },
  {
    id: "akse-pelagic-rockfish",
    name: "Pelagic rockfish (black, dark, deacon, dusky, widow, yellowtail)",
    memberSpeciesIds: ["black_rockfish", "widow_rockfish", "yellowtail_rockfish"],
  },
  {
    id: "akse-slope-rockfish",
    name: "Slope rockfish (nonpelagic; incl. blue, bocaccio, vermilion, …)",
    memberSpeciesIds: ["blue_rockfish", "bocaccio", "vermilion_rockfish"],
  },
  {
    id: "akse-dsr",
    name: "Demersal shelf rockfish (canary, China, copper, quillback, rosethorn, tiger, yelloweye)",
    memberSpeciesIds: ["canary_rockfish", "copper_rockfish", "quillback_rockfish", "yelloweye_rockfish"],
  },
];

export const AK_RULES: readonly RegRule[] = [
  rule({
    id: "akse-general-season", speciesId: null, regAreaId: "ak-se-state", kind: "note",
    verbatim:
      "The salt water sport fishing season is open year-round for all species, except for halibut, lingcod, demersal shelf rockfish, Tanner crab, shrimp, and resident king crab fisheries, and unless otherwise noted below or in special regulations. Stay legal — before you cast, check emergency orders at www.adfg.alaska.gov/sf/EONR.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akse-other-species", speciesId: null, regAreaId: "ak-se-state", kind: "note",
    verbatim:
      "Other fish species not listed on pages 10-13: No bag, possession, annual, or size limits.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  // ——— King salmon (EO-driven) ———
  rule({
    id: "akse-kingsalmon-eo", speciesId: "chinook_salmon", regAreaId: "ak-se-state", kind: "note",
    verbatim:
      "King salmon — Southeast Alaska salt water: 28 inches or longer: Bag, possession, annual, and size limits are established annually by an emergency order, as specified in the Southeast Alaska King Salmon Management Plan. Nonresidents: A harvest record is required. Charter operators and their crew are prohibited from keeping king salmon while clients are on board.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "akse-kingsalmon-under28", speciesId: "chinook_salmon", regAreaId: "ak-se-state", kind: "prohibited",
    verbatim:
      "King salmon — Southeast Alaska salt water: Less than 28 inches: Retention prohibited.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  // ——— Other salmon ———
  rule({
    id: "akse-salmon4-bag", speciesId: null, regGroupId: "akse-4salmon", regAreaId: "ak-se-state", kind: "bag_limit",
    verbatim:
      "Chum, coho, pink, & sockeye salmon — salt water: 16 inches or longer: 6 of each species per day, 12 of each species in possession. Less than 16 inches: 10 per day, 10 in possession, in combination.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: 12, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  // ——— Halibut ———
  rule({
    id: "akse-halibut-Jan-closed", speciesId: "pacific_halibut", regAreaId: "ak-se-state", kind: "season",
    verbatim:
      "Halibut — Southeast Alaska salt water: January 1-January 31: Closed to halibut fishing. February 1-December 31: Open to halibut fishing.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "01-31", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akse-halibut-unguided", speciesId: "pacific_halibut", regAreaId: "ak-se-state", kind: "bag_limit",
    verbatim:
      "Unguided anglers: 2 per day, 4 in possession, no size limit. Pacific halibut fisheries are managed by the federal government under international treaty. Possession includes unpreserved AND preserved fish for halibut. Proxy fishing for halibut is not allowed.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "02-01", seasonEnd: "12-31", bagDaily: 2, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akse-halibut-guided-fed", speciesId: "pacific_halibut", regAreaId: "ak-se-state", kind: "note",
    verbatim:
      "Consult federal regulations for the following: bag, size, and possession limits for guided (charter) anglers; possession and landing requirements, and inseason changes to the regulations. Federal halibut regulations are available through NOAA Fisheries Alaska Region at (907) 586-7228. www.alaskafisheries.noaa.gov/fisheries/sport-halibut. No person shall possess on board a vessel Pacific halibut that have been filleted, mutilated, or otherwise disfigured in any manner, except that each Pacific halibut may be cut into no more than 2 ventral pieces, 2 dorsal pieces, and 2 cheek pieces, with a patch of skin on each piece, naturally attached.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  // ——— Lingcod ———
  rule({
    id: "akse-lingcod-season-state", speciesId: "lingcod", regAreaId: "ak-se-state", kind: "season",
    verbatim:
      "Lingcod — Alaska Residents (All areas): May 16-November 30: Open to lingcod fishing. 1 per day, 2 in possession, no size limit.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "05-16", seasonEnd: "11-30", bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akse-lingcod-nonres", speciesId: "lingcod", regAreaId: "ak-se-state", kind: "note",
    verbatim:
      "Lingcod — Nonresidents (All areas except Yakutat area): 1 per day, 1 in possession. There is an annual limit of 2 fish, 1 that is 30-35 inches long, and 1 that is 55 inches or longer. Harvest record required. Charter operators and their crew are prohibited from keeping lingcod while clients are on board. Northern Southeast Area: May 16-June 14 and September 1-November 30. Central Southeast Outside Area: May 16-June 30 and September 1-November 30. Southern Southeast Outer Coast Area: May 16-July 31 and September 1-November 30. Southern Southeast Inside Waters Area: May 16-November 30. Yakutat Area: May 16-November 30.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  // ——— Rockfish triad + descender law ———
  rule({
    id: "akse-pelagic-bag", speciesId: null, regGroupId: "akse-pelagic-rockfish", regAreaId: "ak-se-state", kind: "bag_limit",
    verbatim:
      "Pelagic rockfish includes black, dark, deacon, dusky, widow, and yellowtail. These six species are uniformly gray, green, brown, or black: 3 per day, 6 in possession, no size limit, except Sitka Area (CSEO). See page 25.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 6, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akse-slope-bag", speciesId: null, regGroupId: "akse-slope-rockfish", regAreaId: "ak-se-state", kind: "bag_limit",
    verbatim:
      "Slope rockfish includes blackgill, blackspotted, blue, bocaccio, brown, chilipepper, darkblotched, greenstriped, harlequin, northern, Pacific Ocean perch, Puget Sound, pygmy, redstripe, redbanded, rougheye, sharpchin, shortbelly, shortraker, silvergray, splitnose, stripetail, vermilion, and yellowmouth: 1 per day, 2 in possession, no size limit.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akse-dsr-resident", speciesId: null, regGroupId: "akse-dsr", regAreaId: "ak-se-state", kind: "bag_limit",
    verbatim:
      "Demersal shelf rockfish includes canary, China, copper, quillback, rosethorn, tiger, and yelloweye. Alaska Residents: 1 per day, 2 in possession, no size limit.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akse-dsr-nonres", speciesId: null, regGroupId: "akse-dsr", regAreaId: "ak-se-state", kind: "note",
    verbatim:
      "Demersal shelf rockfish — Nonresidents: July 1-August 25: Open to demersal shelf rockfish fishing. 1 per day, 1 in possession, no size limit. There is an annual limit of 1 fish. Harvest record required.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akse-dsr-nonres-season", speciesId: "yelloweye_rockfish", regGroupId: "akse-dsr", regAreaId: "ak-se-state", kind: "season",
    verbatim:
      "Demersal shelf rockfish — Nonresidents: July 1-August 25: Open to demersal shelf rockfish fishing. (Outside July 1-August 25, nonresidents may not retain demersal shelf rockfish.)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "08-25", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akse-deepwater-release", speciesId: "rockfish", regAreaId: "ak-se-state", kind: "note",
    verbatim:
      "All vessels must have at least one functional deepwater release device on board and readily available for use when sport fishing activities are taking place regardless of species targeted. All rockfish not retained must be released at the depth they were caught or 100 feet, whichever is shallower. Upon request, a deepwater release device must be presented to a local representative of ADF&G or a peace officer of the state.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  // ——— Sablefish & sharks ———
  rule({
    id: "akse-sablefish", speciesId: "sablefish", regAreaId: "ak-se-state", kind: "bag_limit",
    verbatim:
      "Sablefish (black cod): Alaska residents: 6 per day, 6 in possession, no size limit. Nonresidents: 4 per day, 4 in possession, no size limit. There is a 8 fish annual limit, harvest record required.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Nonresidents: 4 per day, 4 in possession, annual limit 8.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akse-sharks", speciesId: null, regAreaId: "ak-se-state", kind: "note",
    verbatim:
      "Sharks (except spiny dogfish): 1 per day, 1 in possession, no size limit. There is a 2 shark annual limit, harvest record required. Spiny dogfish: 5 per day, 5 in possession, no size limit, harvest record is NOT required.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "akse-eez-doctrine", speciesId: null, regAreaId: "ak-se-eez", kind: "note",
    verbatim:
      "Exclusive Economic Zone waters (all saltwaters 3 to 200 nautical miles from the shoreline): Nonresident bag, possession, and annual limits apply to ALL anglers; nonresident lingcod size limits apply; nonresident seasonal closures apply; harvest record required for king salmon, lingcod, demersal shelf rockfish, sablefish, steelhead trout, and sharks. Anglers may only possess the limit of fish allowed for the specific waters they are fishing.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  // ————————— v2 broaden: NORTH GULF COAST (Southcentral 2026 book) —————————
  rule({
    id: "akngc-general", speciesId: null, regAreaId: "ak-ngc", kind: "note",
    verbatim:
      "North Gulf Coast saltwaters: within 200 miles of shore from the longitude of Gore Point to the longitude of Cape Fairfield. Fishing is open year-round for all species unless otherwise noted. Snagging is legal year-round in all North Gulf Coast saltwaters. Gaffs may not be used to puncture any fish intended or required to be released. Stay legal — before you cast, check emergency orders at www.adfg.alaska.gov/sf/EONR. ATTENTION SALT WATER ANGLERS: Anglers must carry a deepwater release device onboard their vessel when sport fishing in salt water and will be required to use the device to release rockfish that are not harvested at depth of capture or 100 feet.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akngc-halibut-season", speciesId: "pacific_halibut", regAreaId: "ak-ngc", kind: "season",
    verbatim:
      "Pacific halibut: Feb. 1-Dec. 31. Unguided anglers: 2 per day, 4 in possession. Consult federal regulations for bag, possession and size limits and other regulations for guided (charter) anglers.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "02-01", seasonEnd: "12-31", bagDaily: 2, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-halibut-jan-closed", speciesId: "pacific_halibut", regAreaId: "ak-ngc", kind: "season",
    verbatim: "Pacific halibut: Feb. 1-Dec. 31 (January 1-31 closed; season opens February 1).",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "01-31", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-kings-rb-fall1", speciesId: "chinook_salmon", regAreaId: "ak-res-bay", kind: "bag_limit",
    verbatim:
      "King salmon — Saltwaters: Resurrection Bay (North of line between Cape Resurrection to Aialik Cape): Sept. 1-Apr. 30: 1 per day, 1 in possession, no size limit. (Split into two rows because the window wraps the year.)",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "12-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-kings-rb-fall2", speciesId: "chinook_salmon", regAreaId: "ak-res-bay", kind: "bag_limit",
    verbatim:
      "King salmon — Saltwaters: Resurrection Bay (North of line between Cape Resurrection to Aialik Cape): Sept. 1-Apr. 30: 1 per day, 1 in possession, no size limit. (Split into two rows because the window wraps the year.)",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "04-30", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-kings-rb-summer", speciesId: "chinook_salmon", regAreaId: "ak-res-bay", kind: "bag_limit",
    verbatim:
      "King salmon — Saltwaters: Resurrection Bay (North of line between Cape Resurrection to Aialik Cape): May 1-Aug. 31: 2 per day, 2 in possession, no size limit.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "08-31", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-kings-outside", speciesId: "chinook_salmon", regAreaId: "ak-ngc", kind: "bag_limit",
    verbatim:
      "King salmon — Saltwaters: Outside of Resurrection Bay: Open year-round: 1 per day, 1 in possession, no size limit.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-salmon4-rb", speciesId: null, regGroupId: "akse-4salmon", regAreaId: "ak-res-bay", kind: "bag_limit",
    verbatim:
      "Chum, coho, pink, & sockeye salmon (combo) — Saltwaters: Resurrection Bay: Open year-round: 6 per day, 6 in possession, no size limit. All 6 may be coho salmon. Pink salmon taken in the sport fishery may be used as bait, but are part of your bag limit. Pink salmon used as bait must not be alive.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: 6, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-salmon4-outside", speciesId: null, regGroupId: "akse-4salmon", regAreaId: "ak-ngc", kind: "bag_limit",
    verbatim:
      "Chum, coho, pink, & sockeye salmon (combo) — Saltwaters: Outside of Resurrection Bay: Open year-round: 6 per day, 6 in possession, no size limit. Only 3 per day, 3 in possession may be coho salmon. It is illegal to fish for species in these waters with more than 3 coho salmon in your possession.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: 6, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Only 3 of the 6 may be coho.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-steelhead-closed", speciesId: "steelhead", regAreaId: "ak-ngc", kind: "prohibited",
    verbatim:
      "Rainbow/steelhead trout (combo): Saltwaters: Closed year-round to all rainbow/steelhead trout fishing. All rainbow/steelhead trout caught may not be removed from the water and must be released immediately.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "akngc-dolly", speciesId: "dolly_varden", regAreaId: "ak-ngc", kind: "bag_limit",
    verbatim:
      "Arctic char/Dolly Varden (combo): Saltwaters: Entire North Gulf Coast: Open year-round: 5 per day, 5 in possession, no size limit.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akngc-lingcod-rb-closed", speciesId: "lingcod", regAreaId: "ak-res-bay", kind: "prohibited",
    verbatim:
      "Lingcod — Saltwaters: Resurrection Bay (North of line between Cape Resurrection to Aialik Cape): Closed year-round to all lingcod fishing. Lingcod caught incidentally must be released immediately. You cannot legally fish for any species of fish inside Resurrection Bay if you possess a lingcod taken elsewhere.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akngc-lingcod-outside", speciesId: "lingcod", regAreaId: "ak-ngc", kind: "bag_limit",
    verbatim:
      "Lingcod — Saltwaters: Outside of Resurrection Bay: July 1-Dec. 31: 1 per day, 2 in possession, must be at least 35 inches long with head attached or 28 inches from tip of tail to front of dorsal fin with head removed.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "12-31", bagDaily: 1, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 35, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-lingcod-outside-closed", speciesId: "lingcod", regAreaId: "ak-ngc", kind: "season",
    verbatim:
      "Lingcod — Saltwaters: Outside of Resurrection Bay: July 1-Dec. 31 (the remaining January 1-June 30 period is closed to lingcod retention).",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "06-30", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-rockfish-eo", speciesId: "rockfish", regAreaId: "ak-ngc", kind: "bag_limit",
    verbatim:
      "Rockfish: Open year-round. In 2026, by emergency order the following apply: Pelagic: 2 per day, 4 in possession. Nonpelagic: 1 per day, 2 in possession. April 1-June 30: No retention of yelloweye rockfish.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 4, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "2026 EO grid: pelagic 2/day; nonpelagic 1/day; yelloweye closed Apr 1-Jun 30.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-yelloweye-spring-closed", speciesId: "yelloweye_rockfish", regAreaId: "ak-ngc", kind: "season",
    verbatim: "Rockfish 2026 emergency order: April 1-June 30: No retention of yelloweye rockfish.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "06-30", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akngc-sharks", speciesId: null, regAreaId: "ak-ngc", kind: "note",
    verbatim:
      "Sharks except spiny dogfish: Open year-round: 1 per day, 1 in possession, no size limit. There is an annual limit of 2 sharks. Harvest record required. Spiny dogfish: 5 per day, 5 in possession, no size limit. Other finfish: no limit.",
    sourceUrl: B.url, sourceTitle: B.title, sourceUpdatedAt: B.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  // ————————— v2 broaden: KODIAK / SOUTHWEST (2026 book) —————————
  rule({
    id: "akk-general", speciesId: null, regAreaId: "ak-kodiak", kind: "note",
    verbatim:
      "Inclusive waters: All salt waters circumjacent to Kodiak Island, the Aleutian Islands, and the Alaska Peninsula (coastline west of the longitude of Cape Douglas and Bering Sea coastline south of the latitude of Cape Menshikof). Fishing is open year-round for all species unless otherwise noted. Stay legal — before you cast, check emergency orders at www.adfg.alaska.gov/sf/EONR. Questions? Please contact the Kodiak area office at (907) 486-1880.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akk-kings-eo", speciesId: "chinook_salmon", regAreaId: "ak-kodiak", kind: "season",
    verbatim:
      "King salmon — In 2026, in the salt waters of the southern Alaska Peninsula west to Scotch Cap on Unimak Island and waters circumjacent to Kodiak Island by emergency order: April 1-September 15: 1 per day, 1 in possession, any size. In 2026, in the westside salt waters of Kodiak Island by emergency order: May 1-June 30: Closed to king salmon fishing. (Otherwise) 2 per day, 2 in possession, no size or annual limit.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "09-15", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Westside Kodiak: closed May 1-Jun 30. Outside Apr 1-Sep 15: 2/day.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "akk-kings-west-closed", speciesId: "chinook_salmon", regAreaId: "ak-kodiak-north-belt", kind: "season",
    verbatim:
      "In 2026, in the westside salt waters of Kodiak Island by emergency order: May 1-June 30: Closed to king salmon fishing.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "06-30", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "akk-salmon4", speciesId: null, regGroupId: "akse-4salmon", regAreaId: "ak-kodiak", kind: "bag_limit",
    verbatim:
      "Chum, coho, pink, & sockeye salmon (combo): Kodiak and Alaska Peninsula/Aleutian Islands Remote Zones: 5 per day, 10 in possession. Kodiak Road Zone: 5 per day, 5 in possession, only 2 of which may be sockeye salmon. January 1-September 15: Only 2 of which may be coho salmon. September 16-December 31: Only 1 of which may be a coho salmon. Unalaska Bay: 5 per day, 5 in possession, only 2 of which may be coho salmon and 2 of which may be sockeye salmon.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Road Zone: 5/day 5 poss, ≤2 sockeye; coho ≤2 Jan 1–Sep 15, ≤1 Sep 16–Dec 31.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akk-steelhead", speciesId: "steelhead", regAreaId: "ak-kodiak", kind: "bag_limit",
    verbatim:
      "Rainbow/steelhead trout: 2 per day, 2 in possession, only 1 of which may be 20 inches or longer (except Kodiak Road Zone, see page 23). There is an annual limit of 2 fish 20 inches or longer. Harvest record required.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Annual limit 2 fish ≥20 in; harvest record required.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akk-dolly", speciesId: "dolly_varden", regAreaId: "ak-kodiak", kind: "bag_limit",
    verbatim: "Dolly Varden: 10 per day, 10 in possession, no size limit.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "akk-lingcod-season", speciesId: "lingcod", regAreaId: "ak-kodiak", kind: "season",
    verbatim:
      "Lingcod: July 1-December 31: Open to lingcod fishing. Afognak and Shuyak Islands - north of the latitude of Tonki Cape (north of 58°21.181'N. lat.) and north of the latitude of Black Cape (north of 58°24.583'N. lat.), inclusive of all waters between these points by emergency order: 1 per day, 1 in possession, 35 inches or longer. Remainder of Alaska Peninsula, Aleutian Islands, and Kodiak Island: 2 per day, 4 in possession, no size limit.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "12-31", bagDaily: 2, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Afognak/Shuyak north of the capes: 1/day ≥35 in.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akk-lingcod-closed-h1", speciesId: "lingcod", regAreaId: "ak-kodiak", kind: "season",
    verbatim: "Lingcod: July 1-December 31: Open to lingcod fishing. (January 1-June 30 closed.)",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "06-30", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akk-lingcod-afognak", speciesId: "lingcod", regAreaId: "ak-kodiak-afognak-north", kind: "bag_limit",
    verbatim:
      "Lingcod (Afognak and Shuyak Islands north of Tonki Cape 58°21.181'N and north of Black Cape 58°24.583'N, inclusive of all waters between, by emergency order): July 1-December 31: 1 per day, 1 in possession, 35 inches or longer.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: "07-01", seasonEnd: "12-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 35, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "akk-halibut", speciesId: "pacific_halibut", regAreaId: "ak-kodiak", kind: "season",
    verbatim:
      "Halibut: Pacific halibut fisheries are managed by the federal government under international treaty. February 1-December 31: Open to halibut fishing. Unguided anglers: 2 per day, 4 in possession. Consult federal regulations for bag, possession and size limits, and other regulations for guided (charter) anglers. No person shall possess on board a vessel Pacific halibut that have been filleted, mutilated, or otherwise disfigured in any manner, except that each Pacific halibut may be cut into no more than 2 ventral pieces, 2 dorsal pieces, and 2 cheek pieces, with a patch of skin on each piece, naturally attached.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: "02-01", seasonEnd: "12-31", bagDaily: 2, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akk-rockfish-belt-eo", speciesId: "rockfish", regAreaId: "ak-kodiak-north-belt", kind: "bag_limit",
    verbatim:
      "Rockfish — In 2026, in the salt waters of the westside of Kodiak and Afognak islands north of the latitude of Cape Ikolik and on the eastside of Kodiak and Afognak islands north of the latitude of Dangerous Cape by emergency order: 5 per day, 10 in possession, only 2 per day, 4 in possession may be a single rockfish species, only 1 per day, 2 in possession may be a yelloweye rockfish, and only 1 per day, 2 in possession may be a black rockfish.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "≤2 of a single species; ≤1 yelloweye; ≤1 black.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "akk-rockfish-afognak", speciesId: "rockfish", regAreaId: "ak-kodiak-afognak-north", kind: "bag_limit",
    verbatim:
      "Rockfish — In 2026, in the salt waters of Afognak and Shuyak islands, north of the latitude of Tonki Cape (north of 58°21.181'N. lat.) and north of the latitude of Black Cape (north of 58°24.583'N. lat.), inclusive of all waters between these points, by emergency order: 3 per day, 3 in possession, and only 1 may be a single rockfish species.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "≤1 of a single species.",
    checkInseason: true, staleAfterDays: 7,
  }),
  rule({
    id: "akk-rockfish-remainder", speciesId: "rockfish", regAreaId: "ak-kodiak", kind: "bag_limit",
    verbatim:
      "Rockfish — Remainder of Kodiak Island: 5 per day, 10 in possession, only 2 per day, 4 in possession may be nonpelagic (see page 34), only 1 per day, 2 in possession may be a yelloweye rockfish. Alaska Peninsula & Aleutian Islands: 10 per day, 20 in possession.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "≤2 nonpelagic; ≤1 yelloweye. AkPen/Aleutians: 10/day, 20 poss.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "akk-sable-shark-dogfish", speciesId: null, regAreaId: "ak-kodiak", kind: "note",
    verbatim:
      "Sharks (except spiny dogfish): 1 per day, 1 in possession, no size limit. Annual limit of 2 sharks. Harvest record required. Spiny dogfish: 5 per day, 5 in possession, no size limit. Other finfish: no limit.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "akk-crabs", speciesId: "dungeness_crab", regAreaId: "ak-kodiak", kind: "note",
    verbatim:
      "King crab — Alaska Peninsula and Aleutian Islands (golden king crab): Males only: 6 per day, 6 in possession, 6½ inches or more (straight line distance across carapace, not including spines). Red or blue king crab may not be retained or possessed. Kodiak Area: Closed to all king crab species. Tanner crab: Males only: 6 per day, 6 in possession, 5½ inches or more (straight line distance across carapace, including spines). In a commercial Tanner crab section of the Kodiak District that will be open to a commercial Tanner crab fishery, the taking of Tanner crab is prohibited in waters 25 fathoms or more in depth during the 14 days immediately before the scheduled opening of a commercial Tanner crab fishing season in that section. Dungeness crab: Males only: 12 per day, 12 in possession, 6½ inches or more.",
    sourceUrl: C.url, sourceTitle: C.title, sourceUpdatedAt: C.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 12, possessionLimit: 12, bagSharesWithGroup: false,
    minSizeIn: 6.5, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Males only. Golden king (AkPen/Aleutians): 6@6½in; Tanner: 6@5½in w/ 14-day pre-opener ≥25fm rule; Kodiak closed to king crab.",
    checkInseason: true, staleAfterDays: 60,
  }),
];

export const ALASKA = {
  pack: ALASKA_PACK,
  areas: AK_AREAS,
  groups: AK_GROUPS,
  rules: AK_RULES,
};

// Referenced in the pack notes; kept exported for the emergency-order page link.
export const ADFG_EO_URL = `https://${EO_NOTE}`;
