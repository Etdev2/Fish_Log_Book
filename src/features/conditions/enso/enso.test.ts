import { describe, expect, it } from "vitest";

import { classify, ensoMonths, ensoSequence } from "./enso";
import { ONI_HISTORY, ONI_LAST, OUTLOOK } from "./enso-data.generated";

const at = (y: number, m: number) => Date.UTC(y, m - 1, 15);

describe("ENSO classification from CPC ONI v5", () => {
  it("marks the 1997–98 and 2015–16 super El Niños", () => {
    expect(ensoMonths(at(1997, 12), at(1997, 12))[0].phase).toBe("el-nino");
    expect(ensoMonths(at(2015, 12), at(2015, 12))[0].phase).toBe("el-nino");
  });

  it("marks the 2010–11 La Niña", () => {
    expect(ensoMonths(at(2010, 12), at(2010, 12))[0].phase).toBe("la-nina");
  });

  it("needs five consecutive seasons — four warm seasons alone are neutral", () => {
    const history = [
      [2000, 1, 0.0],
      [2000, 2, 0.6],
      [2000, 3, 0.7],
      [2000, 4, 0.8],
      [2000, 5, 0.6],
      [2000, 6, 0.1],
    ] as const;
    const months = classify(ensoSequence(history, { year: 2000, month: 6 }, []));
    expect([...months.values()].every((m) => m.phase === "neutral")).toBe(true);
  });

  it("lets an observed run continue into the outlook to make an episode", () => {
    const history = [
      [2000, 1, 0.6],
      [2000, 2, 0.7],
    ] as const;
    const outlook = [
      ["FMA", 0, 10, 90],
      ["MAM", 0, 20, 80],
      ["AMJ", 0, 30, 70],
    ] as const;
    const months = classify(ensoSequence(history, { year: 2000, month: 2 }, outlook));
    expect(months.get(2000 * 12 + 0)!.phase).toBe("el-nino");
    expect(months.get(2000 * 12 + 3)).toMatchObject({ basis: "outlook", phase: "el-nino", probability: 80 });
  });

  it("covers the snapshot's outlook and then says 'no forecast'", () => {
    const first = Date.UTC(ONI_LAST.year, ONI_LAST.month, 15); // month after last observed
    const months = ensoMonths(first, first + 2 * 365 * 24 * 3600 * 1000);
    const outlook = months.filter((m) => m.basis === "outlook");
    expect(outlook).toHaveLength(OUTLOOK.length);
    expect(months.at(-1)).toMatchObject({ basis: "none", phase: null });
  });

  it("has a sane snapshot", () => {
    expect(ONI_HISTORY[0]).toEqual([1950, 1, -1.32]);
    expect(OUTLOOK).toHaveLength(9);
    for (const [, a, b, c] of OUTLOOK) expect(a + b + c).toBeGreaterThanOrEqual(99);
  });
});
