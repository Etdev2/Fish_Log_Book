/**
 * Regulation pack registry — the jurisdiction-resolver hook (Fish Legal spec §3, §15,
 * §22). Nothing in the engine or UI may reach for a specific pack: they resolve a pack
 * from the Settings fishing region via this file, so a new jurisdiction is one bundle +
 * one row here. "Southern California" is DATA, not code.
 *
 * A region with no pack is a first-class answer, exactly like "No verified data": the
 * UI renders the region's name, states there is no verified pack yet, and links nothing
 * speculative. Founder's region list (`core/ontology/regions`) is the enum this reads.
 */
import type { RegionId } from "@/core/ontology/regions";
import { SOCAL } from "./reg-data";
import { FLORIDA } from "./florida-pack";
import { NORCAL } from "./norcal-pack";
import { CA_FRESHWATER } from "./california-freshwater-pack";
import { TEXAS } from "./texas-pack";
import { LOUISIANA } from "./louisiana-pack";
import { MISSISSIPPI } from "./mississippi-pack";
import { ALABAMA } from "./alabama-pack";
import { BAJA_CALIFORNIA } from "./baja-pack";
import { BAJA_CALIFORNIA_SUR } from "./bcs-pack";
import { OREGON } from "./oregon-pack";
import { WASHINGTON } from "./washington-pack";
import { ALASKA } from "./alaska-pack";
import { HAWAII } from "./hawaii-pack";
import { MASSACHUSETTS } from "./massachusetts-pack";
import { RHODE_ISLAND } from "./rhode-island-pack";
import { NEW_YORK } from "./new-york-pack";
import { NEW_JERSEY } from "./new-jersey-pack";
import { CONNECTICUT } from "./connecticut-pack";
import { NEW_HAMPSHIRE } from "./new-hampshire-pack";
import { MAINE } from "./maine-pack";
import { DELAWARE } from "./delaware-pack";
import { MARYLAND } from "./maryland-pack";
import { VIRGINIA } from "./virginia-pack";
import { NORTH_CAROLINA } from "./north-carolina-pack";
import { SOUTH_CAROLINA } from "./south-carolina-pack";
import { GEORGIA } from "./georgia-pack";
import type { RegPack, RegArea, RegGroup, RegRule } from "./types";

export type RegBundle = {
  readonly pack: RegPack;
  readonly areas: readonly RegArea[];
  readonly groups: readonly RegGroup[];
  readonly rules: readonly RegRule[];
};

export interface BundledPack {
  /** Settings region this pack answers for. One region → at most one pack today. */
  readonly regionId: RegionId;
  /** Displayed where the law speaks jurisdiction ("Florida — FWC"). */
  readonly jurisdictionLabel: string;
  /**
   * Founder ask (2026-09-02): rules surfaces name the jurisdiction they answer for at
   * a glance ("Species & limits — FL"), so switching Settings region visibly retells
   * which state's law the page is reading. Short state-code chips only.
   */
  readonly shortCode: string;
  /** Area the species pages use when GPS hasn't been resolved yet. */
  readonly primaryAreaId: string;
  readonly data: RegBundle;
}

export const PACKS: readonly BundledPack[] = [
  // ——— CDFW Groundfish Management Areas (founder ask 2026-09-02: California broken
  // into its five management units). Each GMA region reads the same verified NorCal /
  // SoCal bundle — the GMA season/depth rows live inside those packs — with the pack's
  // focus narrowed to its own GMA area.
  {
    regionId: "ca_gma_northern",
    jurisdictionLabel: "California — Northern GMA — CDFW (US)",
    shortCode: "CA·N",
    primaryAreaId: "ca-gma-northern",
    data: NORCAL,
  },
  {
    regionId: "ca_gma_mendocino",
    jurisdictionLabel: "California — Mendocino GMA — CDFW (US)",
    shortCode: "CA·M",
    primaryAreaId: "ca-gma-mendocino",
    data: NORCAL,
  },
  {
    regionId: "ca_gma_san_francisco",
    jurisdictionLabel: "California — San Francisco GMA — CDFW (US)",
    shortCode: "CA·SF",
    primaryAreaId: "ca-gma-san-francisco",
    data: NORCAL,
  },
  {
    regionId: "ca_gma_central",
    jurisdictionLabel: "California — Central GMA — CDFW (US)",
    shortCode: "CA·C",
    primaryAreaId: "ca-gma-central",
    data: NORCAL,
  },
  {
    regionId: "ca_gma_southern",
    jurisdictionLabel: "California — Southern GMA — CDFW (US)",
    shortCode: "CA·S",
    primaryAreaId: "ca-gma-southern",
    data: SOCAL,
  },
  {
    regionId: "northern_california",
    jurisdictionLabel: "Northern California — CDFW (US)",
    shortCode: "NorCal",
    primaryAreaId: "ca-ocean-northern",
    data: NORCAL,
  },
  {
    regionId: "california_freshwater",
    jurisdictionLabel: "California Freshwater — CDFW (US)",
    shortCode: "CA·FW",
    primaryAreaId: "ca-fresh-statewide",
    data: CA_FRESHWATER,
  },
  {
    regionId: "southern_california",
    jurisdictionLabel: "California — CDFW (US)",
    shortCode: "SoCal",
    primaryAreaId: "ca-ocean-southern",
    data: SOCAL,
  },
  {
    regionId: "florida",
    jurisdictionLabel: "Florida — FWC (US)",
    shortCode: "FL",
    primaryAreaId: "fl-state-waters",
    data: FLORIDA,
  },
  // ——— States expansion wave 1 (2026-09-02): Gulf + Baja. Verbatims live in each pack.
  {
    regionId: "texas",
    jurisdictionLabel: "Texas — TPWD (US)",
    shortCode: "TX",
    primaryAreaId: "tx-gulf",
    data: TEXAS,
  },
  {
    regionId: "louisiana",
    jurisdictionLabel: "Louisiana — LDWF (US)",
    shortCode: "LA",
    primaryAreaId: "la-gulf",
    data: LOUISIANA,
  },
  {
    regionId: "mississippi",
    jurisdictionLabel: "Mississippi — MDMR (US)",
    shortCode: "MS",
    primaryAreaId: "ms-gulf",
    data: MISSISSIPPI,
  },
  {
    regionId: "alabama",
    jurisdictionLabel: "Alabama — ADCNR (US)",
    shortCode: "AL",
    primaryAreaId: "al-gulf",
    data: ALABAMA,
  },
  {
    regionId: "baja_california",
    jurisdictionLabel: "Baja California — CONAPESCA (MX)",
    shortCode: "MX·BC",
    primaryAreaId: "mx-baja-california",
    data: BAJA_CALIFORNIA,
  },
  {
    regionId: "baja_california_sur",
    jurisdictionLabel: "Baja California Sur — CONAPESCA (MX)",
    shortCode: "MX·BCS",
    primaryAreaId: "mx-baja-california-sur",
    data: BAJA_CALIFORNIA_SUR,
  },
  {
    // Legacy region (pre-wave lister's "Cabo") — Cabo San Lucas is in BCS; the BCS
    // pack answers for it identically (NOM-017 is federal).
    regionId: "cabo_baja",
    jurisdictionLabel: "Baja California Sur — CONAPESCA (MX)",
    shortCode: "MX·BCS",
    primaryAreaId: "mx-baja-california-sur",
    data: BAJA_CALIFORNIA_SUR,
  },
  // ——— Pacific Northwest wave (2026-09-02): WA OR coasts, flagship-first. Alaska has
  // region entry by design but no pack until ADF&G verbatims land.
  {
    regionId: "oregon",
    jurisdictionLabel: "Oregon — ODFW (US)",
    shortCode: "OR",
    primaryAreaId: "or-marine",
    data: OREGON,
  },
  {
    regionId: "washington",
    jurisdictionLabel: "Washington — WDFW (US)",
    shortCode: "WA",
    primaryAreaId: "wa-ma-1-4-coastal",
    data: WASHINGTON,
  },
  { regionId: "wa_ma_1_4", jurisdictionLabel: "Washington MA 1–4 coast — WDFW (US)", shortCode: "WA·1–4", primaryAreaId: "wa-ma-1-4-coastal", data: WASHINGTON },
  { regionId: "wa_ma_4_east", jurisdictionLabel: "Washington MA 4 east — WDFW (US)", shortCode: "WA·4E", primaryAreaId: "wa-ma4-east", data: WASHINGTON },
  { regionId: "wa_ma_5", jurisdictionLabel: "Washington MA 5 Sekiu — WDFW (US)", shortCode: "WA·5", primaryAreaId: "wa-ma-5", data: WASHINGTON },
  { regionId: "wa_ma_6", jurisdictionLabel: "Washington MA 6 East Strait — WDFW (US)", shortCode: "WA·6", primaryAreaId: "wa-ma-6", data: WASHINGTON },
  { regionId: "wa_ma_7", jurisdictionLabel: "Washington MA 7 San Juans — WDFW (US)", shortCode: "WA·7", primaryAreaId: "wa-ma-7", data: WASHINGTON },
  { regionId: "wa_ma_8_1", jurisdictionLabel: "Washington MA 8-1 Skagit — WDFW (US)", shortCode: "WA·8-1", primaryAreaId: "wa-ma-8-1", data: WASHINGTON },
  { regionId: "wa_ma_8_2", jurisdictionLabel: "Washington MA 8-2 Everett — WDFW (US)", shortCode: "WA·8-2", primaryAreaId: "wa-ma-8-2", data: WASHINGTON },
  { regionId: "wa_ma_9", jurisdictionLabel: "Washington MA 9 Admiralty — WDFW (US)", shortCode: "WA·9", primaryAreaId: "wa-ma-9", data: WASHINGTON },
  { regionId: "wa_ma_10", jurisdictionLabel: "Washington MA 10 Seattle — WDFW (US)", shortCode: "WA·10", primaryAreaId: "wa-ma-10", data: WASHINGTON },
  { regionId: "wa_ma_11", jurisdictionLabel: "Washington MA 11 Tacoma — WDFW (US)", shortCode: "WA·11", primaryAreaId: "wa-ma-11", data: WASHINGTON },
  { regionId: "wa_ma_12", jurisdictionLabel: "Washington MA 12 Hood Canal — WDFW (US)", shortCode: "WA·12", primaryAreaId: "wa-ma-12", data: WASHINGTON },
  { regionId: "wa_ma_13", jurisdictionLabel: "Washington MA 13 South Sound — WDFW (US)", shortCode: "WA·13", primaryAreaId: "wa-ma-13", data: WASHINGTON },
  // ——— Wave 4 (2026-09-02): Alaska Southeast (ADF&G Region 1 general saltwater) and
  // Hawaii's DLNR statewide table with the Maui HAR 13-95.1 split.
  {
    regionId: "alaska",
    jurisdictionLabel: "Alaska — ADF&G Southeast (US)",
    shortCode: "AK·SE",
    primaryAreaId: "ak-se-state",
    data: ALASKA,
  },
  {
    regionId: "hawaii",
    jurisdictionLabel: "Hawaii — DLNR DAR (US)",
    shortCode: "HI",
    primaryAreaId: "hi-statewide",
    data: HAWAII,
  },
  {
    regionId: "northeast",
    jurisdictionLabel: "Northeast — Massachusetts DMF (US)",
    shortCode: "MA",
    primaryAreaId: "ma-statewide",
    data: MASSACHUSETTS,
  },
  {
    regionId: "rhode_island",
    jurisdictionLabel: "Rhode Island — DEM (US)",
    shortCode: "RI",
    primaryAreaId: "ri-statewide",
    data: RHODE_ISLAND,
  },
  {
    regionId: "new_york",
    jurisdictionLabel: "New York — DEC (US)",
    shortCode: "NY",
    primaryAreaId: "ny-marine",
    data: NEW_YORK,
  },
  {
    regionId: "new_jersey",
    jurisdictionLabel: "New Jersey — NJDEP (US)",
    shortCode: "NJ",
    primaryAreaId: "nj-marine",
    data: NEW_JERSEY,
  },
  {
    regionId: "connecticut",
    jurisdictionLabel: "Connecticut — DEEP (US)",
    shortCode: "CT",
    primaryAreaId: "ct-lis",
    data: CONNECTICUT,
  },
  {
    regionId: "new_hampshire",
    jurisdictionLabel: "New Hampshire — Fish & Game (US)",
    shortCode: "NH",
    primaryAreaId: "nh-coast",
    data: NEW_HAMPSHIRE,
  },
  {
    regionId: "maine",
    jurisdictionLabel: "Maine — DMR (US)",
    shortCode: "ME",
    primaryAreaId: "me-coast",
    data: MAINE,
  },
  {
    regionId: "delaware",
    jurisdictionLabel: "Delaware — DNREC (US)",
    shortCode: "DE",
    primaryAreaId: "de-tidal",
    data: DELAWARE,
  },
  {
    regionId: "maryland",
    jurisdictionLabel: "Maryland — DNR (US)",
    shortCode: "MD",
    primaryAreaId: "md-atlantic",
    data: MARYLAND,
  },
  {
    regionId: "virginia",
    jurisdictionLabel: "Virginia — MRC (US)",
    shortCode: "VA",
    primaryAreaId: "va-coast",
    data: VIRGINIA,
  },
  {
    regionId: "north_carolina",
    jurisdictionLabel: "North Carolina — DMF (US)",
    shortCode: "NC",
    primaryAreaId: "nc-coastal",
    data: NORTH_CAROLINA,
  },
  {
    regionId: "south_carolina",
    jurisdictionLabel: "South Carolina — DNR (US)",
    shortCode: "SC",
    primaryAreaId: "sc-state-waters",
    data: SOUTH_CAROLINA,
  },
  {
    regionId: "georgia",
    jurisdictionLabel: "Georgia — CRD (US)",
    shortCode: "GA",
    primaryAreaId: "ga-state-waters",
    data: GEORGIA,
  },
];

/** Which pack answers for a Settings region. Null = no verified data for that water. */
export function packForRegion(regionId: RegionId): BundledPack | null {
  return PACKS.find((p) => p.regionId === regionId) ?? null;
}
