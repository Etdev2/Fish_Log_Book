import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import type { TidePredictionSample } from "@/core/rules/tide";

import { mergeSamples } from "./noaa-tides";

/**
 * The parser and the merge, tested against NOAA's documented response shape and the shape
 * recorded in `tide-fixture.ts` from a real fetch.
 *
 * Stated plainly: this has NOT been run against the live API — the machine that wrote it
 * has no route to tidesandcurrents.noaa.gov. These pin the mapping so that when it does
 * reach the real service the failure modes are the ones we chose, not a silent wrong curve.
 */
const sample = (atMs: number, m: number, turn: "high" | "low" | null): TidePredictionSample => ({
  at: instant(atMs),
  height: metres(m),
  turn,
});

describe("merging the hourly curve with the turning points", () => {
  it("keeps both sets, in ascending order", () => {
    const merged = mergeSamples(
      [sample(3_000, 1.1, null), sample(1_000, 1.0, null)],
      [sample(2_000, 1.6, "high")],
    );
    expect(merged.map((s) => s.at as number)).toEqual([1_000, 2_000, 3_000]);
  });

  it("lets the turning point win a collision — it carries the high/low mark", () => {
    const merged = mergeSamples(
      [sample(1_000, 1.0, null)],
      [sample(1_000, 1.63, "high")],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].turn).toBe("high");
    expect(merged[0].height as number).toBeCloseTo(1.63);
  });

  it("produces strictly ascending instants, which tideSeries requires", () => {
    const merged = mergeSamples(
      [sample(1_000, 1, null), sample(2_000, 2, null), sample(3_000, 3, null)],
      [sample(2_000, 2.2, "low"), sample(1_500, 1.5, "high")],
    );
    for (let i = 1; i < merged.length; i++) {
      expect(merged[i].at as number).toBeGreaterThan(merged[i - 1].at as number);
    }
  });

  it("survives an empty turning-point list", () => {
    expect(mergeSamples([sample(1_000, 1, null)], [])).toHaveLength(1);
  });
});
