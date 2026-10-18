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

const HIT_AREA_SIDES = 32;

/**
 * The tap target of a marker whose 50px circle overlaps another kind of marker's.
 *
 * Catches never overlap each other (they cluster) and sunrise never sits near sunset, but a
 * catch logged at sunrise does overlap a sun marker. Painting one before the other only
 * chose which marker stole taps. Instead each circle gives up the far side of the line
 * halfway between the two centres, so a tap goes to whichever marker it is nearer and
 * each visible glyph sits inside its own target.
 *
 * Returns null when nothing overlaps, so the caller keeps the plain circle.
 */
export function hitAreaPath(centre: Point, radius: number, rivals: readonly Point[]): string | null {
  const near = rivals.filter((r) => Math.hypot(r.x - centre.x, r.y - centre.y) < 2 * radius);
  if (near.length === 0) return null;

  let polygon: Point[] = Array.from({ length: HIT_AREA_SIDES }, (_, i) => {
    const angle = (2 * Math.PI * i) / HIT_AREA_SIDES;
    return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
  });
  for (const rival of near) polygon = keepNearer(polygon, centre, rival);
  if (polygon.length < 3) return null;

  const [first, ...rest] = polygon;
  const round = (n: number) => Math.round(n * 100) / 100;
  return `M ${round(first.x)} ${round(first.y)} ${rest.map((p) => `L ${round(p.x)} ${round(p.y)}`).join(" ")} Z`;
}

/** Sutherland–Hodgman against one half-plane: the points no farther from `own` than `rival`. */
function keepNearer(polygon: readonly Point[], own: Point, rival: Point): Point[] {
  // f(p) <= 0 exactly when p is at least as near `own` as `rival`.
  const nx = rival.x - own.x;
  const ny = rival.y - own.y;
  const c = (rival.x * rival.x + rival.y * rival.y - own.x * own.x - own.y * own.y) / 2;
  const f = (p: Point) => nx * p.x + ny * p.y - c;

  const out: Point[] = [];
  polygon.forEach((current, i) => {
    const previous = polygon[(i + polygon.length - 1) % polygon.length];
    const fc = f(current);
    const fp = f(previous);
    if ((fc <= 0) !== (fp <= 0)) {
      const t = fp / (fp - fc);
      out.push({ x: previous.x + t * (current.x - previous.x), y: previous.y + t * (current.y - previous.y) });
    }
    if (fc <= 0) out.push(current);
  });
  return out;
}
