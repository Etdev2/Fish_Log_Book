import type { RegionId } from "@/core/ontology/regions";

import { FLORIDA } from "./florida-pack";
import { NORCAL } from "./norcal-pack";
import { REG_AREAS, SOCAL } from "./reg-data";
import type { SocalPack } from "./types";

/**
 * Which regions have verified depth-and-boundary data, and what the map should draw.
 *
 * This was inline in `boundary-map.tsx`, where it had a hole. The component computed a
 * California view and fell back to `FLORIDA.areas` centred on [26.5, -82.5] for
 * *everything else* — so a Washington, Texas or Maine angler opening "Depth & boundary
 * rules" was shown a map of southwest Florida. Thirty-six of the ~45 regions hit that
 * fallback. It is the same failure as a rule with no citation: an answer presented with
 * more confidence than the data supports.
 *
 * Extracted here because two screens now have to agree about it — the boundaries page
 * draws the view, and the Fish Legal home decides whether to offer the card at all. A
 * disagreement between those two is exactly how the Florida fallback survived unnoticed.
 *
 * `null` means "no verified boundary data for this region", and callers must say so
 * rather than substituting another state's coastline.
 */
export interface BoundaryView {
  readonly bundle: SocalPack;
  /** Focus area within the bundle, for the groundfish reading. */
  readonly areaId: string;
  readonly areas: SocalPack["areas"];
  readonly center: readonly [number, number];
  /** The 50-fathom RCA ribbon is a Southern-GMA window; nowhere else draws it. */
  readonly showRca: boolean;
  /** Names the page for the coastline actually on screen. */
  readonly label: string;
}

const NORCAL_VIEWS: Partial<Record<RegionId, { areaId: string; center: readonly [number, number]; label: string }>> = {
  northern_california: { areaId: "ca-gma-northern", center: [39.5, -124.0], label: "Northern California" },
  ca_gma_northern: { areaId: "ca-gma-northern", center: [40.6, -124.3], label: "California — Northern GMA" },
  ca_gma_mendocino: { areaId: "ca-gma-mendocino", center: [39.5, -123.9], label: "California — Mendocino GMA" },
  ca_gma_san_francisco: { areaId: "ca-gma-san-francisco", center: [38.0, -123.2], label: "California — San Francisco GMA" },
  ca_gma_central: { areaId: "ca-gma-central", center: [35.8, -121.8], label: "California — Central GMA" },
};

export function boundaryViewFor(region: RegionId): BoundaryView | null {
  if (region === "southern_california" || region === "ca_gma_southern") {
    return {
      bundle: SOCAL,
      areaId: "ca-gma-southern",
      areas: REG_AREAS,
      center: [33.6, -118.8],
      showRca: true,
      label: region === "ca_gma_southern" ? "California — Southern GMA" : "Southern California",
    };
  }

  const norcal = NORCAL_VIEWS[region];
  if (norcal) {
    return { bundle: NORCAL, areas: NORCAL.areas, showRca: false, ...norcal };
  }

  // Florida has real boundary data — the Indian River Lagoon catch-and-release zone. It
  // was previously reachable only as the fallback, which meant it rendered for every
  // region EXCEPT the one it describes.
  if (region === "florida") {
    return {
      bundle: FLORIDA,
      areaId: "fl-irl-cnr",
      areas: FLORIDA.areas,
      center: [26.5, -82.5],
      showRca: false,
      label: "Florida",
    };
  }

  return null;
}

/** Whether the boundaries page has anything honest to show for this region. */
export function hasBoundaryData(region: RegionId): boolean {
  return boundaryViewFor(region) !== null;
}
