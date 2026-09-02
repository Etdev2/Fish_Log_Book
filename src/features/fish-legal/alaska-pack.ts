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
  version: 1,
  publishedAt: "2026-09-02T18:00:00Z",
  notes:
    "Alaska — Southeast (ADF&G 2026 Region 1 summary book): saltwater year-round " +
    "except halibut/lingcod/DSR/crab/shrimp. Lingcod May 16–Nov 30 w/ nonresident " +
    "30–35 in-or-55 in+ slot and 2/yr; DSR nonresidents Jul 1–Aug 25 only, annual 1; " +
    "halibut closed January, unguided 2/day; pelagic 3 / slope 1 / DSR 1 rockfish " +
    "regimes; deepwater release device mandatory; EEZ switches everyone to " +
    "nonresident limits. Emergency orders control king salmon annually.",
};

const A = {
  url: "https://www.adfg.alaska.gov/static/regulations/fishregulations/PDFs/southeast/2026se_sfregs_general_freshwater_saltwater.pdf",
  title: "ADF&G — 2026 Southeast Alaska Sport Fishing Regulations Summary Book (General Regulations: Salt Water)",
  updated: null,
} as const;
const VERIFIED = "2026-09-02";
const EO_NOTE = "www.adfg.alaska.gov/sf/EONR";
const pv = 1;

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
];

export const ALASKA = {
  pack: ALASKA_PACK,
  areas: AK_AREAS,
  groups: AK_GROUPS,
  rules: AK_RULES,
};

// Referenced in the pack notes; kept exported for the emergency-order page link.
export const ADFG_EO_URL = `https://${EO_NOTE}`;
