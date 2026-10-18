import { describe, expect, it } from "vitest";

import {
  CATCH_HIT_DIAMETER_PX,
  clusterCatchMarkers,
  hitAreaPath,
  type CatchMarkerInput,
  type Point,
} from "./catch-markers";

// 560 px/day scale, same as the chart: toX maps ms → px at that density.
const PX_PER_MS = 560 / 86_400_000;
const toX = (at: number) => at * PX_PER_MS;

const mark = (id: string, hour: number, needsDetails = false): CatchMarkerInput => ({
  id,
  at: hour * 3_600_000,
  label: "Test fish",
  needsDetails,
});

describe("catch marker clustering", () => {
  it("keeps well-separated catches as single markers", () => {
    const clusters = clusterCatchMarkers([mark("a", 6), mark("b", 14)], toX);
    expect(clusters).toHaveLength(2);
    expect(clusters[0].members).toHaveLength(1);
    expect(clusters[0].key).toBe("cluster-a");
  });

  it("clusters catches within one thumb-width of each other", () => {
    // 20 minutes apart = ~9 px apart at the chart's own density.
    const clusters = clusterCatchMarkers([mark("a", 6), mark("b", 6 + 20 / 60)], toX);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].members.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("resolves a hot bite chain into one cluster but never merges distant ones", () => {
    const clusters = clusterCatchMarkers(
      [mark("a", 6), mark("b", 6.3), mark("c", 6.6), mark("d", 20)],
      toX,
    );
    expect(clusters).toHaveLength(2);
    expect(clusters[0].members).toHaveLength(3);
    expect(clusters[1].members).toHaveLength(1);
  });

  it("an unresolved mark inside the cluster flags the whole marker", () => {
    const clusters = clusterCatchMarkers([mark("a", 6), mark("b", 6.1, true)], toX);
    expect(clusters[0].anyNeedsDetails).toBe(true);
    expect(clusterCatchMarkers([mark("a", 6)], toX)[0].anyNeedsDetails).toBe(false);
  });

  it("an empty log means no markers", () => {
    expect(clusterCatchMarkers([], toX)).toEqual([]);
  });

  it("merges catches whose 50px hit circles would overlap", () => {
    // 40 px apart: further than the old 32 px gap, but the two hit circles would overlap.
    const hours = 40 / 560 * 24;
    const clusters = clusterCatchMarkers([mark("a", 6), mark("b", 6 + hours)], toX);
    expect(clusters).toHaveLength(1);
  });

  it("keeps catches separate once their hit circles no longer touch", () => {
    const hours = (CATCH_HIT_DIAMETER_PX + 1) / 560 * 24;
    const clusters = clusterCatchMarkers([mark("a", 6), mark("b", 6 + hours)], toX);
    expect(clusters).toHaveLength(2);
  });
});

/** Even-odd ray cast against the polygon in a `hitAreaPath` result. */
function inside(path: string, p: Point): boolean {
  const pts = [...path.matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

describe("hit areas where a catch overlaps a sun marker (Codex review, UI-1c)", () => {
  const r = CATCH_HIT_DIAMETER_PX / 2;
  const catchAt = { x: 100, y: 80 };
  const sunAt = { x: 118, y: 82 };

  it("keeps the plain circle when nothing overlaps", () => {
    expect(hitAreaPath(catchAt, r, [{ x: 200, y: 80 }])).toBeNull();
  });

  it("gives each glyph its own side, so neither steals the other's tap", () => {
    const catchArea = hitAreaPath(catchAt, r, [sunAt]);
    const sunArea = hitAreaPath(sunAt, r, [catchAt]);
    if (catchArea === null || sunArea === null) throw new Error("expected split areas");

    // Each centre (where its glyph is drawn) is only in its own target.
    expect(inside(catchArea, catchAt)).toBe(true);
    expect(inside(catchArea, sunAt)).toBe(false);
    expect(inside(sunArea, sunAt)).toBe(true);
    expect(inside(sunArea, catchAt)).toBe(false);

    // Away from the shared edge each still reaches its full radius.
    expect(inside(catchArea, { x: catchAt.x - r + 1, y: catchAt.y })).toBe(true);
    expect(inside(sunArea, { x: sunAt.x + r - 1, y: sunAt.y })).toBe(true);
  });

  it("sends a tap between them to the nearer marker", () => {
    const catchArea = hitAreaPath(catchAt, r, [sunAt]);
    const sunArea = hitAreaPath(sunAt, r, [catchAt]);
    if (catchArea === null || sunArea === null) throw new Error("expected split areas");
    const nearCatch = { x: 106, y: 80 };
    expect(inside(catchArea, nearCatch)).toBe(true);
    expect(inside(sunArea, nearCatch)).toBe(false);
  });
});
