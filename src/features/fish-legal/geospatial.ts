/**
 * Geospatial regulation helpers (founder spec §8): resolve "where am I" against the
 * pack's polygons and boundary polylines, on device, no network, no geocoder.
 *
 * WGS84 degrees in, meters out. The SoCal pack sits near 33°N where the equirectangular
 * approximation is off by a fraction of a percent over a few kilometers — the error is
 * declared and every polygon in the pack is labeled simplified anyway. Precise geodesy
 * (Turf/Proj) can replace these two functions without touching the engine.
 */

export type LngLat = readonly [number, number];

const EARTH_M = 6_371_008.8;
const DEG = Math.PI / 180;

function toXY([lng, lat]: LngLat, [lng0, lat0]: LngLat): [number, number] {
  return [(lng - lng0) * DEG * EARTH_M * Math.cos(lat0 * DEG), (lat - lat0) * DEG * EARTH_M];
}

/** Ray casting. Boundary-point "on the line" answers via distance instead of casting luck. */
export function pointInRing(point: LngLat, ring: readonly LngLat[]): boolean {
  const [px] = toXY(point, point);
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = toXY(ring[i], point);
    const [xj, yj] = toXY(ring[j], point);
    const crosses = yi > 0 !== yj > 0;
    if (crosses && px < ((xj - xi) * (0 - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function segmentDistanceM(p: LngLat, a: LngLat, b: LngLat): number {
  const [px, py] = toXY(p, p);
  const [ax, ay] = toXY(a, p);
  const [bx, by] = toXY(b, p);
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function distanceToRingM(point: LngLat, ring: readonly LngLat[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; jSafe(ring, i); i++) {
    min = Math.min(min, segmentDistanceM(point, ring[i], ring[(i + 1) % ring.length]));
  }
  return min;
}
function jSafe(ring: readonly LngLat[], i: number) {
  return ring.length > 1 && i < ring.length;
}

export function distanceToLineM(point: LngLat, line: readonly LngLat[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i + 1 < line.length; i++) {
    min = Math.min(min, segmentDistanceM(point, line[i], line[i + 1]));
  }
  return min;
}

/**
 * The RCA is a boundary polyline: "inshore of the line" reads as "seaward distance from
 * the MAINLAND side". The pack's simplified line only spans SoCal, so the side test is
 * a cheap longitude-of-nearest-point heuristic with the coastline east of it — honest
 * for this pack, replaced by winding rules if a polygonal RCA ever arrives.
 */
export function sideOfLine(
  point: LngLat,
  line: readonly LngLat[],
): "inshore" | "offshore" {
  // Nearest vertex on the line; the coastline is east (higher lng) of the RCA in SoCal.
  let bestIdx = 0;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < line.length; i++) {
    const d = Math.abs(line[i][0] - point[0]) + Math.abs(line[i][1] - point[1]);
    if (d < best) {
      best = d;
      bestIdx = i;
    }
  }
  return point[0] >= line[bestIdx][0] ? "inshore" : "offshore";
}
