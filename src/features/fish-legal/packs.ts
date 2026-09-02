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
];

/** Which pack answers for a Settings region. Null = no verified data for that water. */
export function packForRegion(regionId: RegionId): BundledPack | null {
  return PACKS.find((p) => p.regionId === regionId) ?? null;
}
