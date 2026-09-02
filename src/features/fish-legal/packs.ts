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
  /** Area the species pages use when GPS hasn't been resolved yet. */
  readonly primaryAreaId: string;
  readonly data: RegBundle;
}

export const PACKS: readonly BundledPack[] = [
  {
    regionId: "southern_california",
    jurisdictionLabel: "California — CDFW (US)",
    primaryAreaId: "ca-ocean-southern",
    data: SOCAL,
  },
  {
    regionId: "florida",
    jurisdictionLabel: "Florida — FWC (US)",
    primaryAreaId: "fl-state-waters",
    data: FLORIDA,
  },
];

/** Which pack answers for a Settings region. Null = no verified data for that water. */
export function packForRegion(regionId: RegionId): BundledPack | null {
  return PACKS.find((p) => p.regionId === regionId) ?? null;
}
