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
];

/** Which pack answers for a Settings region. Null = no verified data for that water. */
export function packForRegion(regionId: RegionId): BundledPack | null {
  return PACKS.find((p) => p.regionId === regionId) ?? null;
}
