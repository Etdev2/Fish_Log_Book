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
 * Group markers that would draw on top of each other. Two clusters may never be closer
 * than `minGapPx` to each other's running centre at the current scale; a new marker that
 * breaks the gap starts the next cluster.
 */
export function clusterCatchMarkers(
  markers: readonly CatchMarkerInput[],
  toX: (at: number) => number,
  minGapPx = 32,
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
