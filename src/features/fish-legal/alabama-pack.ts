/**
 * Alabama pack — `alabama-2026-09-01`.
 *
 * Verbatims come from ADCNR/Marine Resources Division pages on outdooralabama.com
 * (the agency's own site and news releases), cross-checked against the state's 2025
 * red snapper season announcements. The red snapper season is quota-managed and
 * announced each spring — 2025 pattern (opened May 23, seven days a week, closed when
 * the 664,552-lb private quota was met; season for the year closed Dec 31, 2025) is
 * quoted so the card teaches the mechanism, not a guessed 2026 date.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const ALABAMA_PACK: RegPack = {
  id: "alabama-2026-09-01",
  version: 2,
  publishedAt: "2026-09-01T12:00:00Z",
  notes:
    "Alabama (ADCNR Saltwater Recreational Size & Creel Limits card, July 2025 PDF): " +
    "v2 = FULL digest — every row on the agency card plus the 220-3-.77 shark rule and the " +
    "announced quota-season snapper mechanism. Snapper Check before landing is law.",
};

const OA = "https://www.outdooralabama.com";
const CARD = `${OA}/fishing/saltwater-recreational-size-creel-limits`;
const CARD_T = "ADCNR — Saltwater Recreational Size & Creel Limits (July 2025 card)";
const VERIFIED = "2026-09-02";
const pv = 1;

export const AL_AREAS: readonly RegArea[] = [
  {
    id: "al-gulf",
    authority: "adcnr",
    kind: "ocean_region",
    name: "Alabama — coastal waters envelope",
    polygon: [[-88.55, 30.35], [-87.45, 30.35], [-87.45, 29.5], [-88.55, 29.3]],
    sourceUrl: `${OA}/marine-resources`,
    verifiedAt: VERIFIED,
    notes: "Envelope for pack resolution and boundary folds (Gulf Shores/Orange Beach inside; Mobile city out).",
  },
];

export const AL_GROUPS: readonly RegGroup[] = [];

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const AL_RULES: readonly RegRule[] = [
  rule({
    id: "al-seatrout-bag", speciesId: "spotted_seatrout", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim:
      "Spotted seatrout (speckled trout): 6 daily per person; 15–22 inch total-length slot; only one spotted seatrout larger than 22 inches may be kept (within the 6-fish bag).",
    sourceUrl: `${OA}/node/2632`, sourceTitle: "ADCNR — Seatrout, Flounder Limits Change August 1 (MRD regulation-change release)", sourceUpdatedAt: "2019-07-02", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 6, possessionLimit: 6, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: 22, sizeMeasure: "total_length", platformScope: null, depthNote: "One fish >22” counts inside the 6.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-red-drum-bag", speciesId: "red_drum", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim:
      "Red Drum (Redfish): 16” min. - 26” max TL; 3 per person. The July 2025 card carries NO over-slot allowance (the former bull-red exception was removed in the 2025 rule cycle — 16-26 slot only).",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: 26, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-flounder-open", speciesId: "southern_flounder", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim:
      "Flounder: bag of five per person for recreational anglers; 14 inches total length minimum. The entire month of November is closed to flounder fishing, both recreational and commercial.",
    sourceUrl: `${OA}/node/2632`, sourceTitle: "ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)", sourceUpdatedAt: "2019-07-02", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: 5, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Closed all November.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-flounder-closed", speciesId: "southern_flounder", regAreaId: "al-gulf", kind: "season",
    verbatim: "The entire month of November is closed to flounder fishing, both recreational and commercial (November is when flounder migrate to the Gulf of Mexico to spawn).",
    sourceUrl: `${OA}/node/2632`, sourceTitle: "ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)", sourceUpdatedAt: "2019-07-02", verifiedAt: VERIFIED,
    seasonStart: "11-01", seasonEnd: "11-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-sheepshead-bag", speciesId: "sheepshead", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim:
      "Sheepshead: 12” min. FL; 8 per person (reduced from 10 in 2025 due to increased fishing pressure).",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 8, possessionLimit: 8, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-red-snapper-note", speciesId: "red_snapper", regAreaId: "al-gulf", kind: "note",
    verbatim:
      "Red snapper: Alabama state waters and federal waters opened to private and state-licensed charter anglers on Friday, May 23, 2025; the 2025 private-angler quota was 664,552 pounds and the season closed December 31, 2025. The 2026 quota will be 664,552 pounds and MRD will announce the dates for the 2026 fishing season in the spring. Bag while open: 2 fish per person per day; 16-inch minimum. The owner or operator of each vessel landing red snapper in Alabama is required by law to complete one landing report per vessel trip of their harvested red snapper through Snapper Check prior to removing the fish from the boat.",
    sourceUrl: `${OA}/articles/alabamas-red-snapper-season-continues-through-december-31`, sourceTitle: "ADCNR — Alabama’s Red Snapper Season Continues Through December 31 (2025-12-22)", sourceUpdatedAt: "2025-12-22", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null,
    depthNote: "Season dates announced each spring; Snapper Check report required BEFORE landing.",
    checkInseason: true, staleAfterDays: 14,
  }),
  rule({
    id: "al-king-mackerel-bag", speciesId: "king_mackerel", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "King Mackerel: 24” min. FL; 3 per person.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-spanish-mackerel-bag", speciesId: "spanish_mackerel", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Spanish Mackerel: none (no size limit); 15 per person.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 15, possessionLimit: 15, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-gray-triggerfish-bag", speciesId: "gray_triggerfish", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Gray triggerfish: 1 per person per day; 15-inch fork length minimum (Alabama creel card); when the season is open triggerfish must be reported in Snapper Check.",
    sourceUrl: `${OA}/fishing/saltwater-fishing-and-reports`, sourceTitle: "ADCNR — saltwater fishing reports & limits", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 15, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "Snapper Check when season open.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "al-cobia-bag", speciesId: "cobia", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Cobia (Ling): 36” min. FL; 1 per person, not to exceed 2 per vessel.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 36, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-descending-gear", speciesId: null, regAreaId: "al-gulf", kind: "gear",
    verbatim:
      "All vessels fishing for reef fish in federal waters are required to have a venting tool or descending device rigged and ready to use.",
    sourceUrl: `${OA}/articles/2025-red-snapper-season-modified-provide-increased-fishing-opportunities`, sourceTitle: "ADCNR — 2025 Red Snapper Season announcement", sourceUpdatedAt: "2025-03-13", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-goliath-note", speciesId: "goliath_grouper", regAreaId: "al-gulf", kind: "prohibited",
    verbatim: "Goliath grouper and Nassau grouper are prohibited from harvest (Alabama and federal rules).",
    sourceUrl: `${OA}/fishing/saltwater-fishing-and-reports`, sourceTitle: "ADCNR — saltwater fishing reports & limits", sourceUpdatedAt: null, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  // ———— Digest-pass additions (v2) — the full July 2025 ADCNR creel card ————
  rule({
    id: "al-pompano-bag", speciesId: "florida_pompano", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Florida Pompano: 12” min. TL; 3 per person.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-gag-bag", speciesId: "gag_grouper", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Gag Grouper: 24” min TL; 2 per person (mixed species grouper aggregate creel limit: 4 per person; no more than 2 red and 2 gag grouper may be included in the grouper aggregate). Alabama state waters open and close along with federal regulations for this species.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: true,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "4-grouper aggregate; state follows federal open/close.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "al-red-grouper-bag", speciesId: "red_grouper", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Red Grouper: 20” min TL; 2 per person (grouper aggregate 4; ≤2 red).",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: true,
    minSizeIn: 20, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "al-black-grouper-bag", speciesId: "black_grouper", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Black Grouper: 24” min TL; 4 per person (grouper aggregate 4).",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: true,
    minSizeIn: 24, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "al-scamp-bag", speciesId: "scamp", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Scamp: 16” min TL; 4 per person (grouper aggregate 4).",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: 4, bagSharesWithGroup: true,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "al-aj-bag", speciesId: "greater_amberjack", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Greater Amberjack: 34” min FL; 1 per person. Alabama state waters open and close along with federal regulations for this species.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 34, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "Snapper Check reporting applies.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "al-striper-note", speciesId: "striped_bass", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Striped Bass: 16” min TL; 2 per person (only two striped bass are allowed within MRD jurisdiction).",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: 2, bagSharesWithGroup: false,
    minSizeIn: 16, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "MRD jurisdiction only.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-lesser-aj-agg", speciesId: "lesser_amberjack", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Lesser Amberjack & Banded Rudderfish: 14” - 22” FL; Reef Fish Aggregate (20-fish aggregate creel limit for reef fish species without other bag limits — grunts, porgies, gray triggerfish, lane snapper, etc.).",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 20, possessionLimit: 20, bagSharesWithGroup: true,
    minSizeIn: 14, maxSizeIn: 22, sizeMeasure: "fork_length", platformScope: null, depthNote: "Inside the 20 reef-fish aggregate.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-yellowfin-tuna-bag", speciesId: "yellowfin_tuna", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Yellowfin Tuna: 27” min CFL; 3 per person. Bigeye Tuna: 27” min CFL; no creel limit.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: 27, maxSizeIn: null, sizeMeasure: "fork_length", platformScope: null, depthNote: "CFL.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-snook-bag", speciesId: "common_snook", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Snook: 28” min TL; 1 per person (2025 rule).",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 1, possessionLimit: 1, bagSharesWithGroup: false,
    minSizeIn: 28, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-vermilion-snapper-bag", speciesId: "vermilion_snapper", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Vermilion Snapper (beeliner): 10” min. TL; 10 per person. Alabama state waters open and close along with federal regulations.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-lane-snapper-agg", speciesId: "lane_snapper", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Lane Snapper: 10” min. TL; Reef Fish aggregate (20 fish aggregate for reef species without other limits). 2025 change: minimum size increased to 10 inches TL to align with federal.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 20, possessionLimit: 20, bagSharesWithGroup: true,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-gray-snapper-bag", speciesId: "gray_snapper", regAreaId: "al-gulf", kind: "bag_limit",
    verbatim: "Gray Snapper (mangrove, black): 12” min. TL; 10 per person. Alabama state waters open and close along with federal regulations.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 10, possessionLimit: 10, bagSharesWithGroup: false,
    minSizeIn: 12, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-tarpon-rule", speciesId: "atlantic_tarpon", regAreaId: "al-gulf", kind: "note",
    verbatim: "Tarpon: 60” min. TL; $67.00 tag required to possess, kill or harvest each tarpon.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 60, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Harvest only with the $67 tag.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-shark-table", speciesId: null, regAreaId: "al-gulf", kind: "note",
    verbatim:
      "Sharks (Alabama card): Atlantic sharpnose and bonnethead — no size limit, 1 per person per day each. Great, smooth and scalloped hammerhead — 78” min FL, 1 per person per day. All other shark species — 54” min FL, 1 per person per day. Shortfin mako possession prohibited (2025). Per rule 220-3-.77: it is unlawful within 300 feet of the shoreline, or on a public pier, or on a private pier where an unsafe condition is created, to fish for or target sharks by chumming or bloodbaiting, and it is unlawful to target sharks from any pier or beach in a manner that presents an unsafe condition to others.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-skates-rays-rule", speciesId: null, regAreaId: "al-gulf", kind: "gear",
    verbatim: "Skates and Rays: 3 per person. Full retention when using bow, spear, or gig, and it shall be unlawful to remove the tail from any released skate or ray.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 3, possessionLimit: 3, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-mullet-rule", speciesId: "striped_mullet", regAreaId: "al-gulf", kind: "note",
    verbatim: "Mullet: Oct. 24 - Dec. 31, 25 mullet per person from the shoreline or 25 per boat; no mullet by cast net or snagging in Theodore Industrial Canal, Dog River, Fowl River, and their tributaries.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Seasonal shore/boat cap Oct 24–Dec 31.",
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-prohibited-species", speciesId: null, regAreaId: "al-gulf", kind: "prohibited",
    verbatim:
      "Prohibited Species: Goliath grouper (jewfish), Nassau grouper, Atlantic angel shark, bigeye sand tiger shark, bigeye sixgill shark, bigeye thresher shark, bignose shark, Caribbean reef shark, Caribbean sharpnose shark, Galapagos shark, narrowtooth shark, night shark, sevengill shark, sixgill shark, dusky shark, longfin mako shark, shortfin mako shark, sand tiger shark, basking shark, whale shark, white shark, smalltail shark, smalltooth sawfish, largetooth sawfish, spotted eagle ray, Atlantic manta, and sandbar shark (unless the fisherman possesses a NOAA Fisheries sandbar shark research permit).",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "al-license-note", speciesId: null, regAreaId: "al-gulf", kind: "note",
    verbatim:
      "A saltwater fishing license is required for ALL persons fishing or possessing fish in saltwater areas of Alabama (residents and non-residents under 16 exempt; residents 65+ exempt but must register with the Alabama Saltwater Angler Registry). A Gulf Reef Fish Endorsement applies to reef fish anglers; Snapper Check reporting is mandatory before landing red snapper, greater amberjack, and gray triggerfish.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
  rule({
    id: "al-party-boat-rule", speciesId: null, regAreaId: "al-gulf", kind: "note",
    verbatim: "Captain and crew of Alabama Commercial Party Boats shall not retain bag limits of fish harvested in state waters.",
    sourceUrl: CARD, sourceTitle: CARD_T, sourceUpdatedAt: "2025-07-01", verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: "boat", depthNote: null,
    checkInseason: false, staleAfterDays: 60,
  }),
];

export const ALABAMA = { pack: ALABAMA_PACK, areas: AL_AREAS, groups: AL_GROUPS, rules: AL_RULES };
