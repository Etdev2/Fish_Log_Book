import { describe, expect, it } from "vitest";

import { clusterCatchMarkers, type CatchMarkerInput } from "./catch-markers";

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
});
