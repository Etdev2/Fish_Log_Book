/**
 * Florida pack — `florida-2026-09-01`, twelve flagship saltwater species (locked slice).
 *
 * Every sentence is sourced from official FWC pages (myfwc.com) or FWC's licensed
 * eRegulations digest ("Welcome to 2026 Florida Saltwater Fishing — Last Updated:
 * July 20, 2026", eregulations.com/florida). Verified 2026-09-01 against:
 *   - myfwc.com/fishing/saltwater/recreational/spotted-seatrout/ (9-region table)
 *   - myfwc.com/fishing/saltwater/recreational/dolphinfish/
 *   - myfwc.com/fishing/saltwater/recreational/hogfish/
 *   - myfwc.com/fishing/saltwater/recreational/snappers/
 *   - myfwc.com/fishing/saltwater/recreational/atlantic-red-snapper/ (2026 EFP page)
 *   - eregulations.com/florida/fishing/saltwater/{coastal-species,pelagics,grouper}
 *   - FWC news: govdelivery snook West-Coast reopening notice (Jul 2026)
 * Florida law is genuinely coast-split in places; where a single statewide number does
 * not exist, the primary area presents the most-common state-waters rule and the
 * verbatim + notes name the split. Default = NO invented rule.
 *
 * DoD note: Atlantic red snapper's 2026 federal/state picture involved an EFP and a
 * court injunction in May-June 2026; we carry the state-waters rule FWC still lists and
 * mark the whole species checkInseason. That is exactly what checkInseason is for.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const FLORIDA_PACK: RegPack = {
  id: "florida-2026-09-01",
  version: 1,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Florida (FWC) saltwater v1: twelve flagship species, state-waters-first presentation " +
    "with coast-split notes where Florida law itself splits. Grouper/snapper fisheries take " +
    "federal season action mid-year — conditional verdicts point at the live source.",
};

export const FL_AREAS: readonly RegArea[] = [
  {
    // Crude WGS84 outer ring around Florida's coastal strip, anchor-verified against
    // Pensacola, Tampa Bay, Miami, Key West, and Jacksonville by unit tests.
    // Orientation-grade; NOT a legal boundary (sovereign line is ~3nm/9nm offshore).
    id: "fl-state-waters",
    authority: "fwc",
    kind: "ocean_region",
    name: "Florida state waters (all coasts, orientation ring)",
    polygon: [
      // Pensacola → down the Gulf coast → Cape Sable → Miami → up the Atlantic →
      // across the north-state border → close. The Keys have their own ring below.
      [-87.63, 30.3], [-87.0, 29.9], [-86.5, 29.7], [-85.4, 29.55], [-84.9, 29.6],
      [-84.4, 29.9], [-83.9, 30.0], [-83.4, 29.6], [-82.9, 28.6], [-82.8, 27.85],
      [-82.85, 27.3], [-82.85, 26.6], [-82.3, 26.0], [-81.7, 25.9], [-81.35, 25.05],
      [-80.45, 25.15], [-80.03, 25.78], [-80.1, 26.12], [-80.03, 26.7], [-80.6, 28.1],
      [-80.95, 29.2], [-81.4, 30.4], [-81.45, 30.65], [-81.5, 31.0], [-83.0, 31.0],
      [-84.9, 31.0], [-85.6, 31.0], [-87.0, 31.0], [-87.63, 30.99],
    ],
    sourceUrl: "https://www.eregulations.com/florida/fishing/saltwater/",
    verifiedAt: "2026-09-01",
    notes:
      "State waters = shore to 3nm Atlantic / 9nm Gulf. Ring is the coastline envelope + " +
      "panhandle land outline; use for 'which pack', never for a line close call.",
  },
  {
    id: "fl-keys",
    authority: "fwc",
    kind: "ocean_region",
    name: "Florida Keys corridor (orientation ring)",
    polygon: [
      [-80.9, 25.15], [-80.4, 25.0], [-80.35, 24.55], [-80.9, 24.45], [-81.5, 24.4],
      [-82.4, 24.35], [-84.6, 24.5], [-84.8, 24.9], [-83.5, 25.05], [-82.4, 25.2],
      [-81.6, 25.35], [-80.9, 25.35],
    ],
    sourceUrl: "https://www.eregulations.com/florida/fishing/saltwater/",
    verifiedAt: "2026-09-01",
    notes: "Oversized on purpose: catches the full Keys chain without self-intersection.",
  },
  {
    // Indian River Lagoon: redfish (and friends) C&R-only under FWC Executive Order.
    // Rectangle of the lagoon corridor; orientation-grade like everything else.
    id: "fl-irl-cnr",
    authority: "fwc",
    kind: "conservation_area",
    name: "Indian River Lagoon (catch & release only)",
    polygon: [
      // Simple lagoon box (orientation-grade; the order IS the geometry, so ring points
      // walk the perimeter — no gotchas, no self-crossings, unit-tested both ways).
      [-80.35, 26.95], [-80.6, 26.95], [-80.7, 28.0], [-80.6, 29.0], [-80.3, 29.0],
      [-80.28, 27.0],
    ],
    sourceUrl: "https://www.eregulations.com/florida/fishing/saltwater/coastal-species",
    verifiedAt: "2026-09-01",
    notes:
      "FWC conservation-order zone for seatrout/redfish/snook. Orientation box over the " +
      "lagoon corridor; inside it, harvest is prohibited regardless of statewide text.",
  },
];

// The 'reg_group' vocabulary isn't used for Florida yet (aggregates in Florida read as
// "snapper aggregate 10 in any combination" — a note on each member row today; formal
// groups land when aggregate tracking UI needs them, same path as ability to model
// Florida's grouper 4-aggregate).
export const FL_GROUPS: readonly RegGroup[] = [];

// --- Sources --------------------------------------------------------------------
const F = {
  url: "https://www.eregulations.com/florida/fishing/saltwater/",
  title: "FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)",
  updated: "2026-07-20",
};
const TROUT = {
  url: "https://myfwc.com/fishing/saltwater/recreational/spotted-seatrout/",
  title: "FWC — Spotted Seatrout recreational regulations (9-region table, 2026)",
  updated: "2026-02-04",
};
const DOLPHIN = {
  url: "https://myfwc.com/fishing/saltwater/recreational/dolphinfish/",
  title: "FWC — Dolphinfish/Mahi-Mahi recreational regulations",
  updated: null,
};
const HOGFISH = {
  url: "https://myfwc.com/fishing/saltwater/recreational/hogfish/",
  title: "FWC — Hogfish recreational regulations",
  updated: null,
};
const SNOOK = {
  url: "https://content.govdelivery.com/accounts/FLFFWCC/bulletins/38c9f7d",
  title: "FWC — Snook seasons by region (GovDelivery notice, 2026)",
  updated: "2026-02-01",
};
const REDSNAP = {
  url: "https://myfwc.com/fishing/saltwater/recreational/atlantic-red-snapper/",
  title: "FWC — Atlantic Recreational Red Snapper (2026 season page)",
  updated: "2026-05-22",
};

const VERIFIED = "2026-09-01";
const pv = 1; // pack version stamped on every row (mirrors SoCal bundle)

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> &
    Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const FL_RULES: readonly RegRule[] = [
  // ---------------------------------------------------------------- RED DRUM
  rule({
    id: "reddrum-bag", speciesId: "red_drum", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim:
      "Red drum: 1 fish per person per day where harvest is open; 18 to 27 inches total length slot; vessel limits vary by region (2–4). Catch and release only in the Indian River Lagoon zone.",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 18, maxSizeIn: 27, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "reddrum-gear", speciesId: "red_drum", regAreaId: "fl-state-waters", kind: "gear",
    verbatim:
      "Red drum must remain in whole condition until landed ashore (heads, fins, and tails intact).",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "reddrum-irl", speciesId: "red_drum", regAreaId: "fl-irl-cnr", kind: "prohibited",
    verbatim:
      "Catch and release only in the Indian River Lagoon zone (FWC conservation order).",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 30,
  }),
  // ---------------------------------------------------- SPOTTED SEATROUT
  rule({
    id: "trout-bag", speciesId: "spotted_seatrout", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim:
      "Spotted seatrout: bag limit varies by management region (2–5 per person; most regions 3). Slot limit: not less than 15 or more than 19 inches total length; one fish over 19 inches allowed per vessel (or per person from shore) where the region allows it.",
    sourceUrl: TROUT.url, sourceTitle: TROUT.title, sourceUpdatedAt: TROUT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: 19, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "trout-season-note", speciesId: "spotted_seatrout", regAreaId: "fl-state-waters", kind: "note",
    verbatim:
      "Region system (2026): Panhandle March 1–Jan 31 (closed February); Indian River Lagoon January 1–October 31 (closed Nov–Dec) with NO over-slot allowance; Big Bend open year-round, 5 per person; all other regions open year-round, 3 per person.",
    sourceUrl: TROUT.url, sourceTitle: TROUT.title, sourceUpdatedAt: TROUT.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  // ---------------------------------------------------------------- SNOOK
  rule({
    id: "snook-bag", speciesId: "common_snook", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim:
      "Common snook: 1 fish per person per day. Slot: 28–33 inches total length in Gulf regions; 28–32 inches in Atlantic regions. Snook permit ($10) required in addition to a saltwater license. Hook and line only; fish must remain whole until landed ashore; captain and crew cannot retain on for-hire trips.",
    sourceUrl: SNOOK.url, sourceTitle: SNOOK.title, sourceUpdatedAt: SNOOK.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: 33, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  // Open Mar 1–Apr 30 and Sep 1–Nov 30 west coast & Sept Atlantic spring openings vary;
  // encode the two dominant windows. Atlantic summer closed Jun 1–Aug 31; Gulf closed
  // May 1–Aug 31; both closed Dec 1(+15 Atl)–Feb. On Sept 1: OPEN Atlantic + Tampa/Sarasota;
  // Southwest/Charlotte Harbor stay CLOSED until Oct 1. Multiple rows tell that truth:
  rule({
    id: "snook-open-fall", speciesId: "common_snook", regAreaId: "fl-state-waters", kind: "season",
    verbatim: "Open season (most regions): September 1 – November 30 fall and March 1 – April 30 spring.",
    sourceUrl: SNOOK.url, sourceTitle: SNOOK.title, sourceUpdatedAt: SNOOK.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "11-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  rule({
    id: "snook-open-spring", speciesId: "common_snook", regAreaId: "fl-state-waters", kind: "season",
    verbatim: "Open season (most regions): September 1 – November 30 fall and March 1 – April 30 spring. Charlotte Harbor/Southwest reopen October 1.",
    sourceUrl: SNOOK.url, sourceTitle: SNOOK.title, sourceUpdatedAt: SNOOK.updated, verifiedAt: VERIFIED,
    seasonStart: "03-01", seasonEnd: "04-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 30,
  }),
  // ---------------------------------------------------------------- TARPON
  rule({
    id: "tarpon-no-take", speciesId: "atlantic_tarpon", regAreaId: "fl-state-waters", kind: "prohibited",
    verbatim:
      "Tarpon: catch and release only; possession prohibited except in pursuit of an IGFA world record with a $51.50 tarpon tag. Gear: hook and line only. Tarpon over 40 inches must remain in the water.",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // ------------------------------------------------------------ DOLPHIN
  rule({
    id: "mahi-bag", speciesId: "dorado", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim:
      "Dolphinfish: Gulf state waters — 10 per person or 60 per vessel, whichever is less, no minimum size. Atlantic state waters — 5 per person or 30 per vessel, whichever is less, with a 20-inch fork length minimum. Legal gear: hook and line, spearing. Captain and crew are prohibited from retaining a bag limit.",
    sourceUrl: DOLPHIN.url, sourceTitle: DOLPHIN.title, sourceUpdatedAt: DOLPHIN.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "mahi-atlantic-size", speciesId: "dorado", regAreaId: "fl-state-waters", kind: "min_size",
    verbatim: "Atlantic state waters (incl. Monroe County direction): minimum size 20 inches fork length. Gulf state waters: no minimum size.",
    sourceUrl: DOLPHIN.url, sourceTitle: DOLPHIN.title, sourceUpdatedAt: DOLPHIN.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 20, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // ------------------------------------------------------------- KINGFISH
  rule({
    id: "king-bag", speciesId: "king_mackerel", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim:
      "King mackerel: 24-inch fork length minimum; 3 per person per day (Gulf-Atlantic fishery reduced to 1 per person when federal waters are closed to all harvest). Fish must remain whole until landed ashore.",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  // -------------------------------------------------------------- HOGFISH
  rule({
    id: "hogfish-bag", speciesId: "hogfish", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim:
      "Hogfish: 5 per harvester per day in Gulf state waters (14-inch fork minimum, year-round); Atlantic state and federal waters south of Cape Sable incl. the Keys: 1 per harvester per day, 16-inch fork minimum, open May 1–Oct 31.",
    sourceUrl: HOGFISH.url, sourceTitle: HOGFISH.title, sourceUpdatedAt: HOGFISH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "hogfish-gear", speciesId: "hogfish", regAreaId: "fl-state-waters", kind: "gear",
    verbatim: "Legal gear: spears, gigs, hook and line, seine, cast net. Reef fish gear requirements apply.",
    sourceUrl: HOGFISH.url, sourceTitle: HOGFISH.title, sourceUpdatedAt: HOGFISH.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // ------------------------------------------------------------ SHEEPSHEAD
  rule({
    id: "sheepshead-bag", speciesId: "sheepshead", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim: "Sheepshead: 12-inch total length minimum; 8 per harvester per day; vessel limit 50 fish during March and April.",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 8, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // ---------------------------------------------------------------- POMPANO
  rule({
    id: "pompano-bag", speciesId: "florida_pompano", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim:
      "Florida pompano: 11-inch fork length minimum; 6 per harvester per day. State regulations apply in federal waters. Hook and line only; harvest prohibited with the use of any multiple hook in conjunction with live or dead bait.",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 11, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // ------------------------------------------------------ SPANISH MACKEREL
  rule({
    id: "spanish-bag", speciesId: "spanish_mackerel", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim: "Spanish mackerel: 12-inch fork length minimum; 15 per harvester per day. Fish must remain in whole condition until landed ashore.",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // ------------------------------------------------------------ GAG GROUPER
  rule({
    id: "gag-bag", speciesId: "gag_grouper", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim:
      "Gag grouper: 24-inch total length minimum. State waters of the Gulf: 2 per person within the 4-grouper aggregate; 2026 harvest opens September 1 season-limited — verify dates on MyFWC. Atlantic: 1 per person within the 3-fish aggregate, season closed Aug 2, 2026 – Apr 30, 2027.",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "gag-gear", speciesId: "gag_grouper", regAreaId: "fl-state-waters", kind: "gear",
    verbatim:
      "Reef fish / snapper-grouper gear rules: circle hooks required when using natural baits in state waters north of 28° North; a descending device is required on board in federal waters; dehooker required. Must be landed with head and fins intact.",
    sourceUrl: F.url, sourceTitle: F.title, sourceUpdatedAt: F.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  // ------------------------------------------------------------ RED SNAPPER
  rule({
    id: "red-snapper-bag", speciesId: "red_snapper", regAreaId: "fl-state-waters", kind: "bag_limit",
    verbatim:
      "Red snapper: Gulf state waters 16-inch total length minimum, 2 per person per day (captain and crew zero on for-hire boats), season dates announced by FWC each year. Atlantic state waters 20-inch total length minimum, 2 per person per day, open year-round. Federal Atlantic: 2026 recreational season rests on an Exempted Fishing Permit — 1 per person, no minimum size, 10-fish snapper-grouper aggregate applies.",
    sourceUrl: REDSNAP.url, sourceTitle: REDSNAP.title, sourceUpdatedAt: REDSNAP.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "red-snapper-note", speciesId: "red_snapper", regAreaId: "fl-state-waters", kind: "note",
    verbatim:
      "2026 Atlantic private recreational fishing requires a State Reef Fish Angler designation (free) and trip declaration in the FWC Atlantic Red Snapper Reporting System before leaving the dock; anglers are encouraged to report post-trip. Federal season action can reroute mid-year — this row is deliberately checkInseason.",
    sourceUrl: REDSNAP.url, sourceTitle: REDSNAP.title, sourceUpdatedAt: REDSNAP.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 14,
  }),
];

export const FLORIDA: {
  pack: RegPack;
  areas: readonly RegArea[];
  groups: readonly RegGroup[];
  rules: readonly RegRule[];
} = {
  pack: FLORIDA_PACK,
  areas: FL_AREAS,
  groups: FL_GROUPS,
  rules: FL_RULES,
};

export function speciesInFloridaPack(): readonly string[] {
  const ids = new Set<string>();
  for (const r of FL_RULES) if (r.speciesId) ids.add(r.speciesId);
  return [...ids];
}
