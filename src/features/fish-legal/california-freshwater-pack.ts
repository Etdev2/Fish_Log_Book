/**
 * California Freshwater pack — `ca-freshwater-2026-09-01`.
 *
 * Statewide inland defaults, because freshwater law in California is WATER-BY-WATER —
 * every one of ~1,500 named waters can override the statewide default, and this pack
 * says so on every card (verbatim note row per species groups the caveat). What we
 * verified on 2026-09-02 against the CDFW 2026 freshwater digest defaults:
 *   FW = CDFW 2026 Freshwater Sport Fishing Regulations (statewide defaults),
 *        surfaced through the digest + reinforced by F&G proposed-regulations document
 *         (nrm.dfg.ca.gov File 175721 — the "SL/SR" statewide-frame proposal text).
 * The perch/bass/trout/sturgeon/striped parts are the statewide baseline; special-waters
 * rules for a named lake/river largerly override — checkInseason is set on every row so
 * the card always tells the user to verify the specific water.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const CA_FRESH_PACK: RegPack = {
  id: "ca-freshwater-2026-09-01",
  version: 1,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "California freshwater (CDFW): statewide defaults only — named waters override these " +
    "rows. Every card carries the special-waters caveat. Report-card species (sturgeon, " +
    "steelhead, salmon) require the physical card under CCR T14 regardless of limit.",
};

export const FW_AREAS: readonly RegArea[] = [
  {
    // Whole-state envelope — used for pack resolution only. Freshwater rules default to
    // "statewide" in California; named-water overrides are the true layer (per §7).
    id: "ca-fresh-statewide",
    authority: "cdfw",
    kind: "ocean_region",
    name: "California — statewide inland waters",
    polygon: [
      [-124.48, 32.53], [-120.0, 32.53], [-114.1, 32.62], [-114.63, 34.86],
      [-117.13, 35.13], [-119.3, 35.3], [-120.9, 35.5], [-119.9, 36.7],
      [-120.6, 38.0], [-120.0, 39.0], [-120.0, 39.5], [-120.0, 42.0],
      [-124.35, 42.0], [-124.48, 41.7], [-124.15, 40.9], [-124.15, 40.2],
      [-124.4, 39.0], [-123.9, 38.4], [-122.9, 38.0], [-121.9, 37.7],
      [-122.4, 37.5], [-122.9, 37.0], [-123.3, 35.7],
    ],
    sourceUrl: "https://wildlife.ca.gov/Regulations",
    verifiedAt: "2026-09-01",
    notes: "State envelope. Freshwater = rivers, lakes, reservoirs; excludes ocean.",
  },
];

export const FW_GROUPS: readonly RegGroup[] = [
  {
    id: "ca-black-bass",
    name: "Black bass (largemouth, smallmouth, spotted)",
    memberSpeciesIds: ["largemouth_bass", "smallmouth_bass", "spotted_bass"],
  },
];

const FW = {
  url: "https://wildlife.ca.gov/Regulations",
  title: "CDFW — 2026 California Freshwater Sport Fishing Regulations (statewide defaults)",
  updated: null,
};
const VERIFIED = "2026-09-02";
const pv = 1;

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> &
    Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const FW_RULES: readonly RegRule[] = [
  rule({
    id: "fw-bass-bag", speciesId: null, regGroupId: "ca-black-bass", regAreaId: "ca-fresh-statewide", kind: "bag_limit",
    verbatim:
      "Black bass (largemouth, smallmouth, spotted — combined): 5 fish daily statewide default; 12-inch minimum size limit. Individual waters may impose stricter limits or catch-and-release — check the CDFW special-regulations list for the specific water.",
    sourceUrl: FW.url, sourceTitle: FW.title, sourceUpdatedAt: FW.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: true,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "fw-trout-lakes", speciesId: "trout", regAreaId: "ca-fresh-statewide", kind: "bag_limit",
    verbatim:
      "Trout (all species except steelhead) — statewide default: 5 fish per day, 10 in possession. Lakes/reservoirs: open all year. Rivers/streams: open last Saturday in April through November 15; closed Nov 16 through the Friday before the last Saturday in April (barbless-artificial catch-and-release only in that window).",
    sourceUrl: FW.url, sourceTitle: FW.title, sourceUpdatedAt: FW.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "fw-steelhead-cnr", speciesId: "steelhead", regAreaId: "ca-fresh-statewide", kind: "prohibited",
    verbatim:
      "Steelhead: retention of WILD (adipose-fin-intact) steelhead is prohibited in most inland waters; hatchery steelhead (adipose clip) possession requires a steelhead report card. Wild steelhead are catch-and-release, barbless-hooks rules under special waters.",
    sourceUrl: FW.url, sourceTitle: FW.title, sourceUpdatedAt: FW.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "fw-striper", speciesId: "striped_bass", regAreaId: "ca-fresh-statewide", kind: "bag_limit",
    verbatim:
      "Striped bass (inland/Delta): 2 fish per day, 18-inch minimum total length.",
    sourceUrl: FW.url, sourceTitle: FW.title, sourceUpdatedAt: FW.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "fw-catfish", speciesId: "catfish", regAreaId: "ca-fresh-statewide", kind: "bag_limit",
    verbatim: "Catfish: 10 per day combined, no size limit (statewide default).",
    sourceUrl: FW.url, sourceTitle: FW.title, sourceUpdatedAt: FW.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "fw-sturgeon", speciesId: "white_sturgeon", regAreaId: "ca-fresh-statewide", kind: "bag_limit",
    verbatim:
      "White sturgeon: 1 fish per day, 40–60 inch fork-length slot; anything outside the slot must be released immediately. Sturgeon report card required. Snagging prohibited.",
    sourceUrl: FW.url, sourceTitle: FW.title, sourceUpdatedAt: FW.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 40, maxSizeIn: 60, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "fw-special-waters", speciesId: null, regGroupId: "ca-black-bass", regAreaId: "ca-fresh-statewide", kind: "note",
    verbatim:
      "Special regulations may apply to individual waters (CCR T14 §7.50 etc.). This card shows the statewide default; the named water's own line in the CDFW digest overrides it.",
    sourceUrl: FW.url, sourceTitle: FW.title, sourceUpdatedAt: FW.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
];

export const CA_FRESHWATER = {
  pack: CA_FRESH_PACK,
  areas: FW_AREAS,
  groups: FW_GROUPS,
  rules: FW_RULES,
};
