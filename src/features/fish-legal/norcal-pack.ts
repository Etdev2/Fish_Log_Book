/**
 * Northern California pack — `norcal-2026-09-01`.
 *
 * Same engine, different jurisdiction: this bundle exists to prove spec §3/§22 ("no
 * hard-coding SoCal") AND §9's North-vs-South divergence — vermilion/sunset rockfish
 * sub-cap is 4 per person in the Northern Management Area, not 2; both columns of the
 * Groundfish Summary table differ by area and this pack encodes the Northern one.
 *
 * Verified 2026-09-02 against:
 *   N = https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary
 *       (page stamped "Updated January 6, 2026"; Northern Management Area table)
 *   CDFW statewide species rows in the SoCal bundle's source A (Southern page) hold for
 *   halibut etc. statewide where CDFW's own word was "statewide" — this pack only
 *   duplicates rules we could see named explicitly.
 * Every row name-checks the table cell it came from; when the founder's actual Northern
 * visit happens, the Groundfish Exclusion Areas and nearshore/shelf zone lines clearly
 * stamp where this simplified reading stops.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const NORCAL_PACK: RegPack = {
  id: "norcal-2026-09-01",
  version: 2,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Northern California (CDFW, Groundfish Summary updated June 23 2026): v2 adds the " +
    "GMA layer — Northern, Mendocino, San Francisco and Central Groundfish Management " +
    "Areas are now first-class areas with their own season windows (identical 2026 " +
    "tables, verbatim), Cordell Bank prohibition, and the GMA-crossing possession rule. " +
    "Saltwater only; river/salmon checks stay check-in-season.",
};

/** Latitude-band envelopes; the legal boundaries ARE latitude lines (§27.25–27.45). */
function latBand(id: string, name: string, latS: number, latN: number, note: string): RegArea {
  return {
    id,
    authority: "cdfw",
    kind: "groundfish_management_area",
    name,
    polygon: [
      [-124.6, latS], [-123.4, latS], [-123.0, latS + 0.2], [-122.9, latS + 0.3],
      [-122.4, latS + 0.4], [-121.8, latS + 0.5], [-121.6, latS + 0.7],
      [-121.0, (latS + latN) / 2], [-122.3, latN - 0.5], [-123.6, latN - 0.2],
      [-124.2, latN - 0.1], [-124.6, latN], [-124.6, latS],
    ],
    sourceUrl: "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary",
    verifiedAt: VERIFIED0,
    notes: note,
  };
}
const VERIFIED0 = "2026-09-01";
const SRC_GMA = "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary";
const GMA_T = "CDFW — Summary of Recreational Groundfish Fishing Regulations (updated June 23, 2026)";

export const NC_AREAS: readonly RegArea[] = [
  {
    // Envelope of CA coast from 40°10' N (Cape Mendocino), 40.167, to the OR line 42.0.
    id: "ca-ocean-northern",
    authority: "cdfw",
    kind: "ocean_region",
    name: "Northern Management Area — 40°10′ N to the Oregon line",
    polygon: [
      [-124.42, 40.17], [-124.3, 40.44], [-124.28, 40.77], [-124.2, 41.05],
      [-124.24, 41.74], [-124.2, 42.0], [-125.5, 42.0], [-125.5, 40.17],
    ],
    sourceUrl: "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Northern",
    verifiedAt: "2026-09-01",
    notes: "Envelope for pack resolution; coast-anchored east edge, open-ocean west edge.",
  },
  // ———— v2: the Groundfish Management Area layer — legal boundaries ARE latitude
  // lines (CCR T14 §27.25–27.45); envelopes are honest bands between them.
  {
    id: "ca-gma-northern",
    authority: "cdfw",
    kind: "groundfish_management_area",
    name: "Northern GMA — California-Oregon border to Cape Mendocino (40°10′ N)",
    polygon: [
      [-124.42, 40.17], [-124.3, 40.44], [-124.28, 40.77], [-124.2, 41.05],
      [-124.24, 41.74], [-124.2, 42.0], [-125.5, 42.0], [-125.5, 40.17],
    ],
    sourceUrl: SRC_GMA,
    verifiedAt: VERIFIED0,
    notes: "CCR T14 §27.25(a). Same ring as the pack envelope; GMA rules carry the 2026 season table.",
  },
  latBand("ca-gma-mendocino", "Mendocino GMA — Cape Mendocino (40°10′ N) to Point Arena (38°57.5′ N)", 38.96, 40.16, "CCR T14 §27.30(a). 2026 table identical to Northern."),
  latBand("ca-gma-san-francisco", "San Francisco GMA — Point Arena (38°57.5′ N) to Pigeon Point (37°11′ N)", 37.19, 38.955, "CCR T14 §27.35(a). Cordell Bank: ALL groundfish fishing prohibited inside (NMFS compliance guide, June 2026)."),
  latBand("ca-gma-central", "Central GMA — Pigeon Point (37°11′ N) to Point Conception (34°27′ N)", 34.46, 37.18, "CCR T14 §27.40(a). South of here the SoCal pack's Southern GMA season table rules."),
];

export const NC_GROUPS: readonly RegGroup[] = [
  {
    id: "rcg-complex-norcal",
    name: "Rockfish, Cabezon & Greenlings (RCG) — Northern combo",
    memberSpeciesIds: [
      "black_rockfish", "blue_rockfish", "brown_rockfish", "calico_rockfish", "china_rockfish",
      "copper_rockfish", "gopher_rockfish", "grass_rockfish", "kelp_rockfish", "olive_rockfish",
      "treefish", "cabezon", "kelp_greenling",
      "bocaccio", "canary_rockfish", "vermilion_rockfish", "widow_rockfish", "yellowtail_rockfish",
    ],
  },
];

const N = {
  url: "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary",
  title: "CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)",
  updated: "2026-01-06",
};
const VERIFIED = "2026-09-01";
const pv = 1;

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> &
    Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const NC_RULES: readonly RegRule[] = [
  // ————————————————— Northern Management Area season table (verbatim from N)
  rule({
    id: "nc-rcg-season-closed", speciesId: "rockfish", regAreaId: "ca-ocean-northern", kind: "season",
    verbatim:
      "Northern Management Area — Nearshore Rockfish, Cabezon, and Greenlings: Jan 1 – Mar 31 Closed — unlawful to possess in all waters. Apr 1 – Dec 31: Open all depths.",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "03-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-rcg-season-open", speciesId: "rockfish", regAreaId: "ca-ocean-northern", kind: "season",
    verbatim:
      "Northern Management Area — Nearshore Rockfish, Cabezon, and Greenlings: Jan 1 – Mar 31 Closed — unlawful to possess in all waters. Apr 1 – Dec 31: Open all depths.",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-rcg-bag", speciesId: null, regGroupId: "rcg-complex-norcal", regAreaId: "ca-ocean-northern", kind: "bag_limit",
    verbatim:
      "RCG Complex: 10 fish in combination per person, except: Copper rockfish 1 fish per person; Vermilion/sunset rockfish 4 fish per person combined in the Northern Management Area; Canary rockfish 2 fish per person.",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-copper-cap", speciesId: "copper_rockfish", regAreaId: "ca-ocean-northern", kind: "bag_limit",
    verbatim: "Copper rockfish: 1 fish per person within the 10-fish RCG combination.",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-vermilion-cap", speciesId: "vermilion_rockfish", regAreaId: "ca-ocean-northern", kind: "bag_limit",
    verbatim: "Vermilion/sunset rockfish: 4 fish per person combined, within the 10-fish RCG combination. (Northern Management Area cap; 2 per person applies in all other management areas.)",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-canary-cap", speciesId: "canary_rockfish", regAreaId: "ca-ocean-northern", kind: "bag_limit",
    verbatim: "Canary rockfish: 2 fish per person within the 10-fish RCG combination.",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-zero-retention", speciesId: null, regGroupId: "rcg-complex-norcal", regAreaId: "ca-ocean-northern", kind: "prohibited",
    verbatim:
      "No Retention at Any Time (CCR T14 §28.55): Bronzespotted Rockfish, Cowcod, Quillback Rockfish, and Yelloweye Rockfish may not be taken or possessed in California.",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-lingcod-bag", speciesId: "lingcod", regAreaId: "ca-ocean-northern", kind: "bag_limit",
    verbatim: "Lingcod (§28.27): 2 fish per person; minimum size 22 inches total length.",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 22, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-lingcod-season", speciesId: "lingcod", regAreaId: "ca-ocean-northern", kind: "season",
    verbatim:
      "Northern Management Area — Shelf and Slope Rockfish and Lingcod: Jan 1 – Mar 31 Closed. Apr 1 – Dec 31: Open all depths.",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "03-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-halibut", speciesId: "pacific_halibut", regAreaId: "ca-ocean-northern", kind: "bag_limit",
    verbatim:
      "Pacific halibut: 1 fish per person; open May 1 – Oct 31 (California 2026 season per annual action — verify dates on the CDFW Pacific halibut page before each trip).",
    sourceUrl: "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Northern",
    sourceTitle: "CDFW — Northern region ocean sportfishing summary",
    sourceUpdatedAt: "2026-09-01", verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "10-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "nc-chinook", speciesId: "chinook_salmon", regAreaId: "ca-ocean-northern", kind: "note",
    verbatim:
      "Chinook salmon (ocean): seasons, bag limits and boundaries are set annually by the Pacific Fishery Management Council and CDFW and can close in-season. Check the CDFW Ocean Salmon Regulations page and the season map before fishing; harvest off-season or with barbed hooks is prohibited.",
    sourceUrl: "https://wildlife.ca.gov/Fishing/Ocean/Regulations/Salmon",
    sourceTitle: "CDFW — Ocean Salmon Regulations",
    sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "nc-descending", speciesId: null, regGroupId: "rcg-complex-norcal", regAreaId: "ca-ocean-northern", kind: "gear",
    verbatim:
      "No person shall take or possess any federal groundfish and all greenlings of the genus Hexagrammos from any boat or other floating device without a descending device in possession and available for immediate use (CCR T14 §27.20(b)(2)).",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-year-round-by-catch", speciesId: "ocean_whitefish", regAreaId: "ca-ocean-northern", kind: "note",
    verbatim:
      "Year-round opportunities in all depths, statewide (2026): ocean whitefish, California scorpionfish, leopard shark, soupfin shark, Dover sole, English sole, arrowtooth flounder, spiny dogfish, skates, ratfish, grenadiers, finescale codling, Pacific cod, Pacific whiting, sablefish and thornyheads.",
    sourceUrl: N.url, sourceTitle: N.title, sourceUpdatedAt: N.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
];

// ———— v2 GMA layer rules — verbatim season windows for Mendocino / San Francisco /
// Central GMAs (June 23, 2026 table cells), shared verbatim text, area-scoped. ————
function gmaSeasonRules(gmaId: string): RegRule[] {
  const near = (gmaId === "ca-gma-san-francisco")
    ? " with the Cordell Bank all-groundfish prohibition applying inside its footprint"
    : "";
  return [
    rule({
      id: `${gmaId}-rcg-closed`, regGroupId: "rcg-complex-norcal", speciesId: null, regAreaId: gmaId, kind: "season",
      verbatim:
        "Nearshore Rockfish, Cabezon, and Greenlings (CCR T14 §1.91(a)(1): black, black and yellow, blue, brown, calico, China, copper, gopher, grass, kelp, and olive rockfishes; treefish; Cabezon and Greenlings per §28.28/§28.29): Jan 1 - Mar 31 — Closed, unlawful to possess in all waters. April 1 - December 31: Open all depths.",
      sourceUrl: SRC_GMA, sourceTitle: GMA_T, sourceUpdatedAt: "2026-06-23", verifiedAt: VERIFIED0,
      seasonStart: "01-01", seasonEnd: "03-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
      checkInseason: false, staleAfterDays: 60,
    }),
    rule({
      id: `${gmaId}-rcg-open`, regGroupId: "rcg-complex-norcal", speciesId: null, regAreaId: gmaId, kind: "season",
      verbatim:
        "Nearshore Rockfish, Cabezon, and Greenlings: April 1 - December 31 — Open all depths." + near,
      sourceUrl: SRC_GMA, sourceTitle: GMA_T, sourceUpdatedAt: "2026-06-23", verifiedAt: VERIFIED0,
      seasonStart: "04-01", seasonEnd: "12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
      checkInseason: false, staleAfterDays: 60,
    }),
    rule({
      id: `${gmaId}-shelf-closed`, speciesId: null, regAreaId: gmaId, kind: "season",
      verbatim:
        "Shelf and Slope Rockfish and Lingcod (shelf per §1.91(a)(3); slope per §1.91(a)(4); lingcod per §28.27): Jan 1 - Mar 31 — Closed, unlawful to possess in all waters. April 1 - December 31: Open all depths.",
      sourceUrl: SRC_GMA, sourceTitle: GMA_T, sourceUpdatedAt: "2026-06-23", verifiedAt: VERIFIED0,
      seasonStart: "01-01", seasonEnd: "03-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
      checkInseason: false, staleAfterDays: 60,
    }),
    rule({
      id: `${gmaId}-shelf-open`, speciesId: null, regAreaId: gmaId, kind: "season",
      verbatim:
        "Shelf and Slope Rockfish and Lingcod: April 1 - December 31 — Open all depths." + near,
      sourceUrl: SRC_GMA, sourceTitle: GMA_T, sourceUpdatedAt: "2026-06-23", verifiedAt: VERIFIED0,
      seasonStart: "04-01", seasonEnd: "12-31", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
      checkInseason: false, staleAfterDays: 60,
    }),
    rule({
      id: `${gmaId}-bag-note`, regGroupId: "rcg-complex-norcal", speciesId: null, regAreaId: gmaId, kind: "note",
      verbatim:
        "Statewide daily bag limits: RCG Complex — 10 fish in combination per person, except copper rockfish 1 per person, vermilion/sunset rockfish 2 per person combined (outside the Northern Management Area; 4 per person inside it), canary rockfish 2 per person. Lingcod: 2 per person, 22-inch minimum total length. No retention of bronzespotted rockfish, cowcod, quillback rockfish, or yelloweye rockfish at any time (§28.55).",
      sourceUrl: SRC_GMA, sourceTitle: GMA_T, sourceUpdatedAt: "2026-06-23", verifiedAt: VERIFIED0,
      seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: true,
      minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
      checkInseason: false, staleAfterDays: 60,
    }),
  ];
}

export const NC_GMA_RULES: readonly RegRule[] = [
  ...gmaSeasonRules("ca-gma-northern"),
  ...gmaSeasonRules("ca-gma-mendocino"),
  ...gmaSeasonRules("ca-gma-san-francisco"),
  ...gmaSeasonRules("ca-gma-central"),
  rule({
    id: "nc-cordell-bank", speciesId: null, regAreaId: "ca-gma-san-francisco", kind: "prohibited",
    verbatim:
      "Cordell Bank: all groundfish fishing is prohibited to protect sensitive habitat (see the NMFS compliance guide, June 2026).",
    sourceUrl: SRC_GMA, sourceTitle: GMA_T, sourceUpdatedAt: "2026-06-23", verifiedAt: VERIFIED0,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-gma-crossing", speciesId: null, regAreaId: "ca-gma-central", kind: "note",
    verbatim:
      "It is unlawful to possess a groundfish species or species group within a Groundfish Management Area where the take and possession of those species are prohibited in all waters of that Groundfish Management Area or in excess of the bag limit of that Groundfish Management Area, regardless of if the groundfish species or species group were taken in a different Groundfish Management Area where the take or possession is authorized (CCR T14 §27.20(b)(1)(A)(1)).",
    sourceUrl: SRC_GMA, sourceTitle: GMA_T, sourceUpdatedAt: "2026-06-23", verifiedAt: VERIFIED0,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "nc-shore-diver-exempt", speciesId: null, regAreaId: "ca-gma-central", kind: "note",
    verbatim:
      "Shore-based anglers and spear divers are exempt from seasons and depths. Divers and shore-based anglers are exempt from season and depth restrictions affecting the RCG Complex and other federally managed groundfish (CCR T14, §27.20(b)(1)(C) and (b)(1)(D)). No vessel or watercraft may be used to assist in take under the shore exemption.",
    sourceUrl: SRC_GMA, sourceTitle: GMA_T, sourceUpdatedAt: "2026-06-23", verifiedAt: VERIFIED0,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "shore", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
];

export const NORCAL = {
  pack: NORCAL_PACK,
  areas: NC_AREAS,
  groups: NC_GROUPS,
  rules: [...NC_RULES, ...NC_GMA_RULES],
};
