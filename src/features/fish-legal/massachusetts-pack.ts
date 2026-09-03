/**
 * Massachusetts pack — `massachusetts-2026-09-03`. First Atlantic-wave state.
 *
 * Verbatims lifted 2026-09-03 from mass.gov "Recreational saltwater fishing
 * regulations" (DMF table, page updated April 28, 2026 — carries the 2025-26 rules
 * incl. the new bonito/false-albacore limits, the SNE cod prohibition, and the
 * striped-bass measurement/handling doctrine).
 *
 * Area split per footnote 4: Gulf of Maine = waters north of Cape Cod incl. Cape Cod
 * Bay + east of Cape Cod north of 42°N; Southern New England = south/west of Cape Cod
 * incl. Nantucket/Vineyard Sound, Buzzards Bay, Mount Hope Bay + east of Cape Cod south
 * of 42°N (incl. Nauset Harbor/Pleasant Bay). Cod uses the WGOM variant: north of Cape
 * Cod + backside of Cape west of the 70th meridian.
 */
import type { RegArea, RegPack, RegRule } from "./types";

export const MASSACHUSETTS_PACK: RegPack = {
  id: "massachusetts-2026-09-03",
  version: 1,
  publishedAt: "2026-09-03T12:00:00Z",
  notes:
    "Massachusetts (DMF saltwater table, updated 2026-04-28): full finfish digest — " +
    "striped bass slot 28\" to <31\" @1 with circle-hook/no-gaff/no-high-grading " +
    "handling law, bluefish 5 (shore/private) vs 7 (for-hire), scup platform-split " +
    "(shore 9.5\", vessel/for-hire 11\"), fluke vessel 17.5\" vs shore 16.5\" " +
    "(May 24-Sep 23, 5/day), tautog four-season ladder (3/1/3/5, 16\" min, one >21\" " +
    "trophy), black sea bass 16\" (4 May 16-Aug 31, 2 Sep 1-Oct 14), cod WGOM 23\" " +
    "Sep 1-Oct 31 only & SNE prohibited, haddock GoM 17\" 15/day Apr 1-Feb 28 (wraps) " +
    "vs SNE 18\" no limit, halibut 41\" @1, winter flounder GoM 8 vs SNE 2, bonito/false " +
    "albacore 16\" curve-fork, combined-5; prohibited: ocean pout, river herring, " +
    "windowpane, wolffish. Sharks doctrine quoted as note (54\" min, 1/trip permitted " +
    "list, circle hooks).",
};

const MA = {
  url: "https://www.mass.gov/info-details/recreational-saltwater-fishing-regulations",
  title: "Massachusetts DMF — Recreational saltwater fishing regulations",
  updated: "2026-04-28",
} as const;
const VERIFIED = "2026-09-03";
const pv = 1;

export const MA_AREAS: readonly RegArea[] = [
  {
    id: "ma-statewide",
    authority: "ma-dmf",
    kind: "ocean_region",
    name: "Massachusetts — coastal waters envelope",
    polygon: [
      [-71.38, 42.88], [-69.93, 42.0], [-69.9, 41.5], [-70.6, 41.28], [-71.4, 41.4],
      [-71.8, 41.8], [-71.38, 42.88],
    ],
    sourceUrl: MA.url,
    verifiedAt: VERIFIED,
    notes:
      "Envelope for pack resolution (Cape Ann to Buzzards Bay). State-waters limits; " +
      "federal-waters vessels follow NOAA rules per DMF footnote 4.",
  },
  {
    id: "ma-gom",
    authority: "ma-dmf",
    kind: "ocean_region",
    name: "Gulf of Maine waters (DMF defn.: north of Cape Cod incl. Cape Cod Bay + east of Cape Cod north of 42°00′N)",
    polygon: [
      [-71.0, 42.88], [-69.9, 42.0], [-70.2, 41.68], [-70.8, 41.9], [-71.0, 42.4],
      [-71.0, 42.88],
    ],
    sourceUrl: MA.url,
    verifiedAt: VERIFIED,
    notes: "Envelope. Haddock + winter-flounder packages differ from SNE on this side.",
  },
  {
    id: "ma-sne",
    authority: "ma-dmf",
    kind: "ocean_region",
    name: "Southern New England waters (south/west of Cape Cod incl. Nantucket + Vineyard Sound, Buzzards Bay, Mount Hope Bay + east of Cape Cod south of 42°00′N)",
    polygon: [
      [-71.8, 41.8], [-70.6, 41.28], [-69.9, 41.3], [-70.1, 41.75], [-70.9, 41.9],
      [-71.4, 41.4], [-71.8, 41.8],
    ],
    sourceUrl: MA.url,
    verifiedAt: VERIFIED,
    notes: "Envelope. Cod prohibited here (state waters); winter flounder 2/day.",
  },
  {
    id: "ma-wgom",
    authority: "ma-dmf",
    kind: "ocean_region",
    name: "Western Gulf of Maine cod area (north of Cape Cod + backside west of the 70th meridian)",
    polygon: null,
    sourceUrl: MA.url,
    verifiedAt: VERIFIED,
    notes:
      "Cod management line: all state waters north of Cape Cod and those waters down " +
      "the backside of Cape Cod and east of Nantucket west of the 70th meridian (DMF " +
      "footnote 5). Envelope left null — 322 CMR 8.07 maps govern.",
  },
];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const MA_RULES: readonly RegRule[] = [
  // ——— Flagship rows ———
  rule({
    id: "ma-striped-bass-slot", speciesId: "striped_bass", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Striped Bass: 28\" to less than 31\". Open season: year round. Possession limit: 1 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 31, sizeMeasure: "total_length", platformScope: null, depthNote: "Slot: 28\" to less than 31\".",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-striped-bass-handling", speciesId: "striped_bass", regAreaId: "ma-statewide", kind: "gear",
    verbatim:
      "Striped Bass: Fish are measured from the tip of the snout or jaw with the mouth closed to the farthest extremity of the tail with the tail squeezed. The discard of dead legal sized striped bass is unlawful. The practice of high-grading, whereby legal sized striped bass are released in favor of larger fish caught subsequently is unlawful. All recreational anglers are required to use inline circle hooks when fishing for striped bass with whole or cut natural baits, except when fishing with a natural bait attached to an artificial lure (e.g., tube and worm). Gaffing striped bass is prohibited.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "No stringers/livewells; keep whole to shore; two fillets max with skin patch.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-bluefish-shore", speciesId: "bluefish", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Bluefish (Shore and Private Vessel): no size limit, year round, possession limit 5 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "For-hire vessels: 7 fish.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ma-scup-vessel", speciesId: "scup", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim:
      "Scup (Private Vessel): Min 11\", May 1 - Dec 31, 30 fish. (If 5 or more anglers are onboard a private vessel, there is a vessel limit of 150-fish. Fish may be filleted but not skinned while at-sea; no more than two fillets per allowed fish.) For-Hire: Min 11\", May 1 - Jun 30: 40 fish; Jul 1 - Dec 31: 30 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "12-31", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 11, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "boat", depthNote: "Vessel cap 150 when 5+ anglers; for-hire 40/day through June.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-scup-shore", speciesId: "scup", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Scup (Shore): Min 9.5\", May 1 - Dec 31, possession limit 30 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "05-01", seasonEnd: "12-31", bagDaily: 30, possessionLimit: 30, bagSharesWithGroup: false,
    minSizeIn: 9.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "shore", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-fluke-vessel", speciesId: "summer_flounder", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Summer Flounder (Vessel Based): Min 17.5\", May 24 - Sep 23, 5 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "05-24", seasonEnd: "09-23", bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 17.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "boat", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-fluke-season", speciesId: "summer_flounder", regAreaId: "ma-statewide", kind: "season",
    verbatim:
      "Summer Flounder: May 24 - Sep 23 (vessel and shore tables). General Notes: For any dates not listed in the Season column, the recreational fishery is closed; during closed seasons, retention, possession, and landing is prohibited and all catch must be released.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "05-24", seasonEnd: "09-23", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),

  rule({
    id: "ma-fluke-shore", speciesId: "summer_flounder", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Summer Flounder (Shore Based): Min 16.5\", May 24 - Sep 23, 5-fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "05-24", seasonEnd: "09-23", bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 16.5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: "shore", depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-tautog-spring", speciesId: "tautog", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim:
      "Tautog: Min 16\"; only one fish may exceed 21\". Apr 1 - May 31: 3 fish. (Private-angler vessel limit 10; the most restrictive of bag or vessel max applies.)",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "05-31", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish >21\" per day; private vessel cap 10.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-tautog-earlysummer", speciesId: "tautog", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Tautog: Min 16\"; only one fish may exceed 21\". Jun 1 - Jul 31: 1 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "06-01", seasonEnd: "07-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish >21\" per day; private vessel cap 10.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-tautog-latesummer", speciesId: "tautog", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Tautog: Min 16\"; only one fish may exceed 21\". Aug 1 - Oct 14: 3 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "08-01", seasonEnd: "10-14", bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish >21\" per day; private vessel cap 10.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-tautog-fall", speciesId: "tautog", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Tautog: Min 16\"; only one fish may exceed 21\". Oct 15 - Dec 31: 5 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "10-15", seasonEnd: "12-31", bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish >21\" per day; private vessel cap 10.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-bsb-early", speciesId: "black_sea_bass", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim:
      "Black Sea Bass: Min 16\". May 16 - Aug 31: 4 fish. (Measured snout-to-tail-extremity not including the tail filament; may be filleted but not skinned at-sea, max two fillets per allowed fish.)",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "05-16", seasonEnd: "08-31", bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Tail filament excluded from the 16\" measure.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-bsb-fall", speciesId: "black_sea_bass", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Black Sea Bass: Min 16\". Sept 1 - Oct 14: 2 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "10-14", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Tail filament excluded from the 16\" measure.",
    checkInseason: true, staleAfterDays: 30,
  }),
  // ——— Groundfish (footnote 4 areas) ———
  rule({
    id: "ma-cod-wgom", speciesId: "atlantic_cod", regAreaId: "ma-wgom", kind: "bag_limit",
    verbatim: "Cod * Western Gulf of Maine: Min 23\", Sept 1 - Oct 31, 1 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "10-31", bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 23, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Subject-to-change flag on the DMF table; check in-season.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "ma-cod-sne-prohibited", speciesId: "atlantic_cod", regAreaId: "ma-sne", kind: "prohibited",
    verbatim: "Cod * Southern New England: Prohibited. (State-waters within the Southern New England Cod Management Area are closed to the retention of cod.)",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-cod-closures-note", speciesId: "atlantic_cod", regAreaId: "ma-statewide", kind: "note",
    verbatim:
      "Cod: It is unlawful to fish with hook and line gear in the Winter Cod Conservation Closure from November 15 through January 31. It is unlawful to take cod from the Spring Cod Conservation Closure from April 16 through July 21. See maps in 322 CMR 8.07.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Conservation closures carve both sides of the fall window off; rotation suspect — check in-season.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "ma-haddock-gom", speciesId: "haddock", regAreaId: "ma-gom", kind: "bag_limit",
    verbatim: "Haddock * Gulf of Maine: Min 17\", Apr 1 - Feb 28, 15 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "02-28", bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 17, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Season wraps New Year's; closed March only.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-haddock-sne", speciesId: "haddock", regAreaId: "ma-sne", kind: "bag_limit",
    verbatim: "Haddock * Southern New England: Min 18\", year round, no limit.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No possession limit.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ma-halibut", speciesId: "atlantic_halibut", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Halibut: Min 41\", year round, 1 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 41, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ma-winter-flounder-gom", speciesId: "winter_flounder", regAreaId: "ma-gom", kind: "bag_limit",
    verbatim: "Winter Flounder Gulf of Maine: Min 12\", year round, 8 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 8, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ma-winter-flounder-sne", speciesId: "winter_flounder", regAreaId: "ma-sne", kind: "bag_limit",
    verbatim: "Winter Flounder Southern New England: Min 12\", Mar 1 - Dec 31, 2 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "03-01", seasonEnd: "12-31", bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ma-pollock", speciesId: "pollock", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Pollock: no size limit, year round, no limit.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "No limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-dab", speciesId: "american_plaice", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Dab (plaice): Min 14\", year round, no limit.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No possession limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-grey-sole", speciesId: "witch_flounder", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Grey Sole: Min 14\", year round, no limit.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No possession limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-yellowtail-flounder", speciesId: "yellowtail_flounder", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Yellowtail Flounder: Min 13\", year round, no limit.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 13, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "No possession limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-monkfish", speciesId: "monkfish", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Monkfish: no size limit, year round, no limit.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "No limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-redfish", speciesId: "acadian_redfish", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Redfish: no size limit, year round, no limit.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "No limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-ocean-pout-prohibited", speciesId: "ocean_pout", regAreaId: "ma-statewide", kind: "prohibited",
    verbatim: "Ocean Pout: closed. Prohibited.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-windowpane-prohibited", speciesId: "windowpane_flounder", regAreaId: "ma-statewide", kind: "prohibited",
    verbatim: "Windowpane Flounder: closed. Prohibited.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-wolffish-prohibited", speciesId: "atlantic_wolffish", regAreaId: "ma-statewide", kind: "prohibited",
    verbatim: "Wolffish: closed. Prohibited.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-river-herring-prohibited", speciesId: "river_herring", regAreaId: "ma-statewide", kind: "prohibited",
    verbatim: "River Herring: closed. Prohibited.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 120,
  }),
  // ——— All remaining table rows ———
  rule({
    id: "ma-american-eel", speciesId: "american_eel", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "American eel: Min 9\", year round, 25 fish. (For-hire: 50/day.)",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: 9, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "For-hire vessels: 50/day; municipal rules may also apply.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ma-american-shad", speciesId: "american_shad", regAreaId: "ma-statewide", kind: "note",
    verbatim:
      "American Shad (Merrimack and Connecticut Rivers): no size limit, year round, 3 fish. American Shad (Other Waters): Prohibited. Catch and release only.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Salt waters are 'other waters' — prohibition stands; the 3-fish line is the two named rivers (freshwater scope).",
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "ma-bonito-albie", speciesId: "atlantic_bonito", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim:
      "Atlantic bonito & false albacore: Min 16\" (curve fork length — line tracing the contour of the body from the tip of the upper jaw to the fork in the tail), year round, 5 fish both species combined. These limits apply only to fish caught and possessed in state waters.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "Combined with false albacore (5 total); curve-fork measure.",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-albie-bonito", speciesId: "false_albacore", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim:
      "Atlantic bonito & false albacore: Min 16\" (curve fork length), year round, 5 fish both species combined.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "Combined with Atlantic bonito (5 total).",
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "ma-mackerel", speciesId: "atlantic_mackerel", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim:
      "Mackerel Private Anglers: no size limit, year round, 25 fish. For-Hire: 50 fish. (The limit applies as a daily per angler harvest limit and possession while fishing; it does not apply to freezer, fish car, holding car, or shore-based bait well.)",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "For-hire: 50/day.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ma-smelt", speciesId: "rainbow_smelt", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Smelt: no size limit; Jan 1 - Mar 14 and Jun 16 - Dec 31: 50 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "01-01", seasonEnd: "03-14", bagDaily: 50, possessionLimit: 50, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Also open Jun 16-Dec 31 at 50/day; the Mar 15-Jun 15 gap is closed.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ma-smelt-fall", speciesId: "rainbow_smelt", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Smelt: no size limit; Jan 1 - Mar 14 and Jun 16 - Dec 31: 50 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: "06-16", seasonEnd: "12-31", bagDaily: 50, possessionLimit: 50, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ma-weakfish", speciesId: "weakfish", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Weakfish: Min 16\", year round, 1 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ma-white-perch", speciesId: "white_perch", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "White Perch: Min 8\", year round, 25 fish.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 25, possessionLimit: 25, bagSharesWithGroup: false,
    minSizeIn: 8, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "ma-spiny-dogfish", speciesId: "spiny_dogfish", regAreaId: "ma-statewide", kind: "bag_limit",
    verbatim: "Spiny Dogfish: no size limit, year round, no limit.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "No limit.",
    checkInseason: false, staleAfterDays: 120,
  }),
  rule({
    id: "ma-shark-doctrine", speciesId: null, regAreaId: "ma-statewide", kind: "note",
    verbatim:
      "Sharks: all permitted sharks 54 in min, 1 total per trip (Atlantic sharpnose, bonnethead, smooth dogfish: no minimum, +1 additional in the total bag). Permitted: smooth dogfish, Atlantic sharpnose, bonnethead, finetooth, blacknose, tiger, blacktip, spinner, bull, lemon, nurse, scalloped/great/smooth hammerhead, porbeagle, common thresher, blue. Prohibited: silky, sandbar, sand tiger, bigeye sand tiger, whale, basking, white, dusky, bignose, Galapagos, night, Caribbean reef, narrowtooth, Caribbean sharpnose, smalltail, Atlantic angel, longfin mako, shortfin mako, bigeye thresher, sharpnose sevengill, bluntnose sixgill, bigeye sixgill, oceanic whitetip. Circle hooks required except flies/artificials; shore-based Cape Cod Bay gap/leader restrictions apply.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Federal HMS rules may differ — consult NOAA.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "ma-table-general-note", speciesId: null, regAreaId: "ma-statewide", kind: "note",
    verbatim:
      "General Notes: For any dates not listed in the Season column, the recreational fishery is closed. During closed seasons, retention, possession, and landing is prohibited and all catch must be released. All size limits are total length unless otherwise specified. When shore fishing baited hooks cannot be deployed by the use of mechanized, propulsion, or remote controlled devices (drones, RC boats, bait cannons). Tunas, billfish, and swordfish are managed by NOAA's Highly Migratory Species Office.",
    sourceUrl: MA.url, sourceTitle: MA.title, sourceUpdatedAt: MA.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
];

export const MASSACHUSETTS = {
  pack: MASSACHUSETTS_PACK,
  areas: MA_AREAS,
  groups: [],
  rules: MA_RULES,
};
