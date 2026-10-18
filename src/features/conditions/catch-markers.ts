/**
 * Catch markers on the tide curve (founder requirements 2026-09-01 §6).
 *
 * Each catch lands on the curve at its exact logged instant; several catches inside one
 * thumb-width read as one clustered marker with a count. This file is the pure half:
 * what markers exist and how they cluster. The SVG half lives in `tide-timeline.tsx`,
 * reusing the sun-marker interaction (tap reveals, keyboard works, a pan never counts
 * as a tap).
 *
 * Clustering uses an x-scale callback rather than assuming one, so the same logic holds
 * if the chart density ever changes and so the tests need no pixels from the fixture.
 */

export interface CatchMarkerInput {
  readonly id: string;
  /** Epoch milliseconds of the catch: `caught_at` at the exact logged instant. */
  readonly at: number;
  /** Display name: vocabulary species, the angler's own text, or "Mark" for unresolved. */
  readonly label: string;
  /** A mark that has not been told what happened yet — flagged amber, never hidden. */
  readonly needsDetails: boolean;
}

export interface CatchMarkerCluster {
  /** Stable key: the id of the earliest member (`cluster-<id>`). */
  readonly key: string;
  /** Instant of the earliest member — the marker position and the read-head target. */
  readonly at: number;
  readonly members: readonly CatchMarkerInput[];
  readonly anyNeedsDetails: boolean;
}

/**
 * Each catch marker's transparent hit circle is this wide (UI-1 #5: a 50px target around a
 * small glyph). Two separate markers closer than this would overlap, and the one painted
 * later would steal taps aimed at the earlier one, so this is also the clustering gap.
 */
export const CATCH_HIT_DIAMETER_PX = 50;

/**
 * Group markers that would draw on top of each other. Two clusters may never be closer
 * than `minGapPx` to each other's running centre at the current scale; a new marker that
 * breaks the gap starts the next cluster.
 */
export function clusterCatchMarkers(
  markers: readonly CatchMarkerInput[],
  toX: (at: number) => number,
  minGapPx = CATCH_HIT_DIAMETER_PX,
): readonly CatchMarkerCluster[] {
  const sorted = [...markers].sort((a, b) => a.at - b.at);
  const clusters: CatchMarkerCluster[] = [];
  let lastCentreX: number | null = null;

  for (const marker of sorted) {
    const cluster = clusters[clusters.length - 1];
    if (cluster && lastCentreX !== null && Math.abs(toX(marker.at) - lastCentreX) < minGapPx) {
      const members = [...cluster.members, marker];
      clusters[clusters.length - 1] = {
        ...cluster,
        members,
        anyNeedsDetails: cluster.anyNeedsDetails || marker.needsDetails,
      };
      const total = members.reduce((sum, m) => sum + toX(m.at), 0);
      lastCentreX = total / members.length;
    } else {
      clusters.push({
        key: `cluster-${marker.id}`,
        at: marker.at,
        members: [marker],
        anyNeedsDetails: marker.needsDetails,
      });
      lastCentreX = toX(marker.at);
    }
  }
  return clusters;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Whether two markers' 50px tap circles would overlap where they are drawn.
 *
 * Catches never overlap each other (they cluster) and sunrise never sits near sunset, but a
 * catch logged near sunrise does overlap a sun marker. Two 48px targets cannot share less
 * than 48px of space, and trimming either one below the floor is not allowed
 * (docs/design/06-accessibility-baseline.md), so the tide timeline gives the overlap to the
 * catch and the sun marker yields its tap target there.
 */
export function hitTargetsOverlap(a: Point, b: Point): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < CATCH_HIT_DIAMETER_PX;
}
