/**
 * Hawaii pack — `hawaii-2026-09-02`.
 *
 * Wave 4 (24-state expansion). DLNR Division of Aquatic Resources statewide marine
 * table verbatim, plus the Maui-specific (HAR 13-95.1) divergences. Hawaii has no
 * recreational saltwater fishing license, and most prized locals (oni? no — ulua,
 * moi, oio, 'ama'ama) DO carry size/season structure.
 *
 * Verified 2026-09-02 against:
 *   A = https://dlnr.hawaii.gov/dar/fishing/fishing-regulations/marine-fishes-and-vertebrates/
 *       (DLNR DAR "Marine Fishes and Other Vertebrates" rule table; rows each cite
 *        HAR 13-95, 13-95.1, 13-94, 13-74, HRS 188)
 *   B = same page's Regulated Fishing Areas link family for the West Hawai'i
 *       pāku'iku'i pause (HAR 13-60.4, prohibited through 12/17/26)
 * Regulated Fishing Areas (West Hawai'i RFMA, Miloli'i CBSFA, etc.) are a follow-up
 * layer; v1 carries the statewide + Maui rows and the species-level closures.
 */
import type { RegArea, RegGroup, RegPack, RegRule } from "./types";

export const HAWAII_PACK: RegPack = {
  id: "hawaii-2026-09-02",
  version: 2,
  publishedAt: "2026-09-02T18:00:00Z",
  notes:
    "Hawaii (DLNR DAR statewide table): moi 11 in @ 15 closed Jun–Aug; 'ama'ama 11 in " +
    "closed Dec–Mar; 'o'io 14 in; ulua/papio 10 in @ 20 non-commercial; uhu 10 in @ 2 " +
    "(large uhu 14 in, no take on Maui for two); weke 'oama 7 in / 50 'oama; kala 14 in " +
    "@ 4; kole 5 in; manini 6 in; Deep 7 combined bag 5 non-commercial; Maui rules " +
    "under HAR 13-95.1; sharks and rays protected in state waters (HRS 188). No " +
    "recreational saltwater license required.",
};

const A = {
  url: "https://dlnr.hawaii.gov/dar/fishing/fishing-regulations/marine-fishes-and-vertebrates/",
  title: "DLNR Division of Aquatic Resources — Marine Fishes and Other Vertebrates (HAR 13-95, 13-95.1, 13-94, 13-74)",
  updated: null,
} as const;
const A2 = {
  url: "https://dlnr.hawaii.gov/dar/fishing/fishing-regulations/regulated-areas/regulated-fishing-areas-on-hawaii/",
  title: "DLNR Division of Aquatic Resources — Regulated Fishing Areas on Hawai'i Island (HAR 13-29/13-33/13-35/13-37/13-47/13-60.4)",
  updated: null,
} as const;
const VERIFIED = "2026-09-02";
const pv = 2;

function rule(
  r: Omit<RegRule, "packVersion" | "regGroupId"> & Partial<Pick<RegRule, "regGroupId">>,
): RegRule {
  return { regGroupId: null, ...r, packVersion: pv };
}

export const HI_AREAS: readonly RegArea[] = [
  {
    // Envelope around the eight main islands; the real per-muscall boundaries live in
    // DLNR's Regulated Fishing Areas pages (follow-up layer).
    id: "hi-statewide",
    authority: "hawaii_dar",
    kind: "ocean_region",
    name: "Hawaii state marine waters — statewide (HAR 13-95)",
    polygon: [
      [-160.3, 18.7], [-159.8, 20.9], [-158.1, 21.7], [-156.5, 20.4], [-154.8, 19.5],
      [-155.1, 18.9], [-160.3, 18.7],
    ],
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes:
      "Envelope. The statewide table rules here; one-off Regulated Fishing Areas " +
      "(West Hawai'i RFMA, Miloli'i CBSFA, Hilo Bay…) may be stricter — check DLNR.",
  },
  {
    id: "hi-maui",
    authority: "hawaii_dar",
    kind: "conservation_area",
    name: "Maui — HAR 13-95.1 rules",
    polygon: [
      [-156.7, 20.5], [-156.2, 20.9], [-155.9, 21.0], [-155.9, 20.5], [-156.2, 20.4],
      [-156.6, 20.4], [-156.7, 20.5],
    ],
    sourceUrl: A.url,
    verifiedAt: VERIFIED,
    notes: "Envelope around Maui Nui waters; Maui carries its own size/bag rules.",
  },
  // ——— v2 (deepen pass): Regulated Fishing Areas (verbatim from DLNR pages) ———
  {
    id: "hi-west-hawaii-rfma",
    authority: "hawaii_dar",
    kind: "conservation_area",
    name: "West Hawai'i Regional Fishery Management Area (Ka Lae, Ka'ū to 'Ūpolu Point, North Kohala)",
    polygon: [
      [-156.08, 18.92], [-155.68, 19.75], [-156.05, 20.26], [-155.95, 19.0],
      [-155.99, 18.94], [-156.08, 18.92],
    ],
    sourceUrl: A2.url,
    verifiedAt: VERIFIED,
    notes:
      "HAR 13-60.4. Extends Ka Lae (South Point) to 'Ūpolu Point and seaward to the " +
      "State's management limit; includes the Kahalu'u Bay, Waiaua Bay, and Kikaua–" +
      "Makalawena Fish Replenishment Areas (fresh fish replenishment subareas not yet " +
      "mapped). Pāku'iku'ī take prohibited through 12/17/26.",
  },
  {
    id: "hi-milolii-cbsfa",
    authority: "hawaii_dar",
    kind: "conservation_area",
    name: "Miloli'i Community-Based Subsistence Fishing Area",
    polygon: null,
    sourceUrl: A2.url,
    verifiedAt: VERIFIED,
    notes:
      "Polygons not yet mapped; the special regs row carries the verbatim walk-through. " +
      "HAR chapter: Miloli'i CBSFA (DAR).",
  },
  {
    id: "hi-kealakekua-mlcd",
    authority: "hawaii_dar",
    kind: "conservation_area",
    name: "Kealakekua Bay Marine Life Conservation District (Cook Point to Manini Beach Point)",
    polygon: null,
    sourceUrl: A2.url,
    verifiedAt: VERIFIED,
    notes: "HAR 13-29 / 13-60.4. Subzone B is the retractable 'allowed fishing' strip.",
  },
  {
    id: "hi-lapakahi-mlcd",
    authority: "hawaii_dar",
    kind: "conservation_area",
    name: "Lapakahi Marine Life Conservation District (Koai'e Cove & Subzone B)",
    polygon: null,
    sourceUrl: A2.url,
    verifiedAt: VERIFIED,
    notes: "HAR 13-33 / 13-60.4. Subzone B hooks-and-thrownet only.",
  },
  {
    id: "hi-oldkona-mlcd",
    authority: "hawaii_dar",
    kind: "conservation_area",
    name: "Old Kona Airport Marine Life Conservation District",
    polygon: null,
    sourceUrl: A2.url,
    verifiedAt: VERIFIED,
    notes: "HAR 13-37 / 13-60.4. No Boating Zone inside; mooring 3-hour cap.",
  },
  {
    id: "hi-waialea-mlcd",
    authority: "hawaii_dar",
    kind: "conservation_area",
    name: "Waialea Bay Marine Life Conservation District (Kānekanaka Point to north of 'Ōhai Point)",
    polygon: null,
    sourceUrl: A2.url,
    verifiedAt: VERIFIED,
    notes: "HAR 13-35 / 13-60.4. Hook-and-line finfish permitted from pole.",
  },
];

export const HI_GROUPS: readonly RegGroup[] = [
  {
    id: "hi-deep7",
    name: "Deep 7 bottomfish (onaga, 'ehu, gindai, kalekale, lehi, 'opakapaka, hapu'u)",
    memberSpeciesIds: ["onaga", "opakapaka", "ehu", "hapuu"],
  },
  {
    id: "hi-uhu-large",
    name: "Regulated large uhu (14-inch minimum) species",
    memberSpeciesIds: ["uhu"],
  },
];

export const HI_RULES: readonly RegRule[] = [
  rule({
    id: "hi-moi", speciesId: "moi", regAreaId: "hi-statewide", kind: "bag_limit",
    verbatim: "Moi — Closed season June - August. Minimum size 11 inches. Bag limit 15. (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "09-01", seasonEnd: "05-31", bagDaily: 15, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 11, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-moi-closed", speciesId: "moi", regAreaId: "hi-statewide", kind: "season",
    verbatim: "Moi — Closed season June - August. (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "06-01", seasonEnd: "08-31", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-amaama", speciesId: "striped_mullet", regAreaId: "hi-statewide", kind: "bag_limit",
    verbatim:
      "'Ama'ama (striped mullet) — Closed season December - March. Minimum size 11 inches (see measurement guide). (HAR 13-95, HRS 188-44)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "04-01", seasonEnd: "11-30", bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 11, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-amaama-closed", speciesId: "striped_mullet", regAreaId: "hi-statewide", kind: "season",
    verbatim: "'Ama'ama (striped mullet) — Closed season December - March. (HAR 13-95, HRS 188-44)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: "12-01", seasonEnd: "03-31", bagDaily: 0, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-oio", speciesId: "oio_bonefish", regAreaId: "hi-statewide", kind: "min_size",
    verbatim: "'O'io — Minimum size 14 inches. (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-aholehole", speciesId: "aholehole", regAreaId: "hi-statewide", kind: "min_size",
    verbatim: "Aholehole — Minimum size 5 inches. (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-awa", speciesId: "awa", regAreaId: "hi-statewide", kind: "min_size",
    verbatim: "Awa — Minimum size 9 inches. (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 9, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-ulua-papio", speciesId: "giant_trevally", regAreaId: "hi-statewide", kind: "bag_limit",
    verbatim:
      "Ulua and papio — Minimum size 10 inches. Minimum size 16 inches for sale. Bag limit 20 (total all species, non-commercial only). (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 20, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-uhu", speciesId: "uhu", regAreaId: "hi-statewide", kind: "bag_limit",
    verbatim: "Uhu (all species, except as noted below) — Minimum size 10 inches. Bag limit 2 total all species. (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 2, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: 10, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-uhu-large", speciesId: "uhu", regAreaId: "hi-statewide", kind: "note",
    verbatim:
      "Uhu 'ele'ele, uhu uliuli, uhu palukaluka, uhu 'ahu'ula — Minimum size 14 inches. Bag limit 2 (total all species). Uhu 'ele'ele and uhu uliuli: No take on Maui. (HAR 13-95, HAR 13-95.1)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-uhu-uhu-maui-notake", speciesId: "uhu", regAreaId: "hi-maui", kind: "prohibited",
    verbatim:
      "Uhu 'ele'ele and uhu uliuli — No take on Maui. Large regulated uhu are 14-inch minimum, bag limit 2 total all species. (HAR 13-95.1)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "Maui: uhu 'ele'ele and uhu uliuli are no-take.",
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-weke-oama", speciesId: "weke", regAreaId: "hi-statewide", kind: "min_size",
    verbatim:
      "Weke and 'oama (statewide except Maui) — Minimum size 7 inches (sale). Bag limit 50 'oama ('oama are weke under 7 inches). (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 7, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "'Oama (under 7 in): bag limit 50.",
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-weke-maui", speciesId: "weke", regAreaId: "hi-maui", kind: "min_size",
    verbatim:
      "Weke 'a, weke 'ula, and 'oama (Maui rules) — Minimum size 8 inches. Bag limit 50 'oama ('oama are weke under 8 inches). 'Oama may be taken by hook-and-line only. (HAR 13-95.1)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 8, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: "'Oama hook-and-line only on Maui.",
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-kumu-maui", speciesId: null, regAreaId: "hi-maui", kind: "note",
    verbatim:
      "Kumu — Minimum size 12 inches (Maui rules). Bag limit 1 (Maui rules). Statewide (except Maui): minimum size 10 inches. (HAR 13-95, HAR 13-95.1) Moano kea: 12-inch minimum, bag limit 2 (Maui rules). Munu: 8-inch minimum, bag limit 2 (Maui rules). Weke nono: 12-inch minimum (Maui rules). All other goatfishes: 8-inch minimum (Maui rules).",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-kala", speciesId: "kala", regAreaId: "hi-statewide", kind: "bag_limit",
    verbatim:
      "Kala — Minimum size 14 inches. Bag limit 4. Commercial fishers may take and sell more than 4 kala per day with a permit. (HAR 13-95) Kala 'opelu: minimum size 16 inches.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 4, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 14, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-kole", speciesId: "kole", regAreaId: "hi-statewide", kind: "min_size",
    verbatim: "Kole — Minimum size 5 inches. (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 5, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-manini", speciesId: "manini", regAreaId: "hi-statewide", kind: "min_size",
    verbatim: "Manini — Minimum size 6 inches. (HAR 13-95)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: 6, maxSizeIn: null, sizeMeasure: "total_length", platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-deep7-onaga", speciesId: "onaga", regGroupId: "hi-deep7", regAreaId: "hi-statewide", kind: "bag_limit",
    verbatim:
      "'Ula'ula koa'e (onaga) — Minimum size 1 pound (sale). Bag limit 5 (total all Deep 7 species, applies to non-commercial fishing only). (HAR 13-95, HAR 13-94, HAR 13-74) 'Opakapaka: minimum size 1 pound (sale). 'Ula'ula (ehu), kalekale, lehi, 'ukikiki (gindai), and hapu'u: bag limit 5 (total all Deep 7 species), non-commercial only.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 5, possessionLimit: null, bagSharesWithGroup: true,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "Deep 7 combined bag, non-commercial only.",
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-pakuikui-closure", speciesId: null, regAreaId: "hi-statewide", kind: "prohibited",
    verbatim:
      "Paku'iku'i — Take prohibited in West Hawaii Regional Fishery Management Area through 12/17/26. (HAR 13-60.4)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: "West Hawaii RFMA through 2026-12-17.",
    checkInseason: true, staleAfterDays: 60,
  }),
  rule({
    id: "hi-shark-ray-protected", speciesId: null, regAreaId: "hi-statewide", kind: "prohibited",
    verbatim:
      "Mano (shark) and hihimau (ray) — Unlawful to intentionally or knowingly capture or entangle any shark or ray, whether alive or dead, or kill any shark or ray in state marine waters. (HRS 188-39.5, HRS 188-40.8)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: 0, possessionLimit: 0, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-ahi-note", speciesId: "yellowfin_tuna", regAreaId: "hi-statewide", kind: "note",
    verbatim: "'Ahi — Minimum size 3 pounds (sale). (HAR 13-95) No recreational bag or size limit on the DAR table.",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-regulated-areas-note", speciesId: null, regAreaId: "hi-statewide", kind: "note",
    verbatim:
      "Regulated Fishing Areas (West Hawaii Regional Fishery Management Area, Miloli'i Community-Based Subsistence Fishing Area, Hilo Bay, Kailua Bay, and others) carry their own permitted/prohibited lists and can be stricter than the statewide table — see DLNR DAR regulated-areas pages. Sea turtles (honu) and Hawaiian monk seals: no open season; unlawful to molest, kill, capture, or possess. (HRS 195D-4)",
    sourceUrl: A.url, sourceTitle: A.title, sourceUpdatedAt: A.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  // ——— v2 (deepen pass): Regulated Fishing Areas verbatim ———
  rule({
    id: "hi-westhawaii-rfma-doctrine", speciesId: null, regAreaId: "hi-west-hawaii-rfma", kind: "note",
    verbatim:
      "The West Hawai'i Regional Fishery Management Area (FRA) extends along the west coast of the Island of Hawaii from Ka Lae, Ka'ū (South Point) to 'Ūpolu Point, North Kohala, and from the highwater mark on shore seaward to the limit of the State's management authority. It includes the Fish Replenishment Areas, Netting Restricted Areas, and Marine Reserve depicted in the accompanying maps and described fully in the administrative rule (available at DAR). Pāku'iku'i: take prohibited in West Hawaii Regional Fishery Management Area through 12/17/26. (HAR 13-60.4)",
    sourceUrl: A2.url, sourceTitle: A2.title, sourceUpdatedAt: A2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-milolii-cbsfa-note", speciesId: null, regAreaId: "hi-milolii-cbsfa", kind: "note",
    verbatim:
      "Miloli'i Community-Based Subsistence Fishing Area — From July through February the bag limit for kole is 20 per person per day, and minimum size is five inches. From June through February the minimum size for these species is 14 inches and maximum size is 20 inches, and the bag limit is one fish per person per day. [Uhu:] To take or possess more than three other uhu per person per day; only one may be a terminal-phase uhu. ['Ula:] To take or possess more than two ula per person per day. ['Opihi:] To take or possess more 'opihi makaiauli and 'opihi 'ālinalina (with shell) than can fit in a one-gallon size bag per person per day. Pāku'iku'i: take prohibited before July 1, 2027; beginning July 1, 2027 pāku'iku'i bag limit is five per person per day, and minimum size is five inches. ['Ū'ū:] To take or possess any 'ū'ū from April through June. (DLNR regulated areas, Miloli'i CBSFA row.)",
    sourceUrl: A2.url, sourceTitle: A2.title, sourceUpdatedAt: A2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 90,
  }),
  rule({
    id: "hi-kealakekua-mlcd-note", speciesId: null, regAreaId: "hi-kealakekua-mlcd", kind: "note",
    verbatim:
      "Kealakekua Bay MLCD — The Kealakekua Bay Marine Life Conservation District is located offshore of the Kealakekua Bay Historical State Park on the western coast of the island of Hawai'i, from the highwater mark seaward to a line from Cook Point to Manini Beach Point. Permitted within Subzone B only: to fish for, take or possess any finfish with or by the use of hook-and-line and thrownet, provided that any legal fishing device or method except traps may be used for the taking of akule, 'ōpelu and crustaceans. Prohibited: to fish for, take or injure marine life (including eggs), except as indicated in 'Permitted' activities above. (HAR 13-29, HAR 13-60.4)",
    sourceUrl: A2.url, sourceTitle: A2.title, sourceUpdatedAt: A2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-lapakahi-mlcd-note", speciesId: null, regAreaId: "hi-lapakahi-mlcd", kind: "note",
    verbatim:
      "Lapakahi MLCD — encompasses Subzone A (Koai'e Cove) and Subzone B, extending approximately 500 feet offshore of the Lapakahi State Historical Park. Permitted within Subzone B only: to fish for, take or possess any 'ōpelu by lift or 'ōpelu net, or any finfish or crustacean by hook-and-line or thrownet. Prohibited: to fish for, take or injure any marine life (including eggs), or possess in the water any device that may be used for the taking of marine life. (HAR 13-33, HAR 13-60.4)",
    sourceUrl: A2.url, sourceTitle: A2.title, sourceUpdatedAt: A2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-oldkona-mlcd-note", speciesId: null, regAreaId: "hi-oldkona-mlcd", kind: "note",
    verbatim:
      "Old Kona Airport MLCD — Permitted: to fish for, take, possess or remove akule by handline at night, and 'ōpelu by lift or 'ōpelu net method; to fish for, take, possess or remove any finfish for home consumption by throw net or pole-and-line (without reel) with bait from shore. Prohibited except as permitted: to fish for, take, injure, kill, possess or remove any marine life, including live sea shell and 'opihi, live coral, algae or limu. No anchoring; a No Boating Zone applies. (HAR 13-37, HAR 13-60.4)",
    sourceUrl: A2.url, sourceTitle: A2.title, sourceUpdatedAt: A2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
  rule({
    id: "hi-waialea-mlcd-note", speciesId: null, regAreaId: "hi-waialea-mlcd", kind: "note",
    verbatim:
      "Waialea Bay MLCD — located offshore of Waialea Bay along the northwestern coast of the island of Hawai'i, from the highwater mark seaward to a line from Kānekanaka Point to the point immediately north of 'Ōhai Point. Permitted: to have or possess any fishing pole and hook-and-line, and to fish for, take or possess any finfish using such gear. Prohibited: to fish for, take or injure any marine life (including eggs), or possess in the water any device that may be used for the taking of marine life, except as indicated in permitted activities above. (HAR 13-35, HAR 13-60.4)",
    sourceUrl: A2.url, sourceTitle: A2.title, sourceUpdatedAt: A2.updated, verifiedAt: VERIFIED,
    seasonStart: null, seasonEnd: null, bagDaily: null, possessionLimit: null, bagSharesWithGroup: false,
    minSizeIn: null, maxSizeIn: null, sizeMeasure: null, platformScope: null, depthNote: null,
    checkInseason: false, staleAfterDays: 180,
  }),
];

export const HAWAII = {
  pack: HAWAII_PACK,
  areas: HI_AREAS,
  groups: HI_GROUPS,
  rules: HI_RULES,
};
