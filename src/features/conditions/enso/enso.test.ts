import { describe, expect, it } from "vitest";

import { classify, ensoMonths, ensoSequence, seasonCentreMonth } from "./enso";
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

  it("does not join a run across a missing season", () => {
    // Four warm observed seasons, a gap month, then a warm outlook: the gap breaks the run,
    // so the observed months stay neutral under the five-consecutive-season rule.
    const history = [
      [2026, 5, 0.6],
      [2026, 6, 0.7],
      [2026, 7, 0.8],
      [2026, 8, 0.9],
    ] as const;
    const outlook = [["SON", 0, 0, 100]] as const;
    const months = classify(ensoSequence(history, { year: 2026, month: 8 }, outlook));
    for (let m = 5; m <= 8; m++) expect(months.get(2026 * 12 + m - 1)!.phase).toBe("neutral");
    expect(months.get(2026 * 12 + 9)).toMatchObject({ basis: "outlook", phase: "el-nino" });
  });

  it("covers the snapshot's outlook and then says 'no forecast'", () => {
    const first = Date.UTC(ONI_LAST.year, ONI_LAST.month, 15); // month after last observed
    const months = ensoMonths(first, first + 2 * 365 * 24 * 3600 * 1000);
    const outlook = months.filter((m) => m.basis === "outlook");
    expect(outlook).toHaveLength(OUTLOOK.length);
    expect(months.at(-1)).toMatchObject({ basis: "none", phase: null });
  });
});

describe("placing CPC outlook seasons on their centre month", () => {
  it("maps every season label to its centre month, matching CPC's table", () => {
    const expected: Record<string, number> = {
      DJF: 1, JFM: 2, FMA: 3, MAM: 4, AMJ: 5, MJJ: 6, JJA: 7, JAS: 8, ASO: 9, SON: 10, OND: 11, NDJ: 12,
    };
    for (const [season, month] of Object.entries(expected)) expect(seasonCentreMonth(season)).toBe(month);
    expect(() => seasonCentreMonth("XYZ")).toThrow();
  });

  it("puts the October 2026 snapshot on Oct 2026 … Jun 2027, leaving September as a gap", () => {
    expect(ONI_LAST).toEqual({ year: 2026, month: 8 }); // JAS
    const months = ensoMonths(at(2026, 8), at(2027, 8));
    const label = (m: { year: number; month: number }) => `${m.year}-${m.month}`;
    expect(months.find((m) => m.month === 8 && m.year === 2026)!.basis).toBe("observed");
    expect(months.find((m) => m.month === 9 && m.year === 2026)).toMatchObject({ basis: "none", phase: null });
    const outlook = months.filter((m) => m.basis === "outlook").map(label);
    expect(outlook).toEqual([
      "2026-10", "2026-11", "2026-12", "2027-1", "2027-2", "2027-3", "2027-4", "2027-5", "2027-6",
    ]);
    // SON is October (100% El Niño); MJJ is June (70% neutral), not May.
    expect(months.find((m) => label(m) === "2026-10")).toMatchObject({ phase: "el-nino", probability: 100 });
    expect(months.find((m) => label(m) === "2027-6")).toMatchObject({ phase: "neutral", probability: 70 });
    expect(months.find((m) => label(m) === "2027-5")).toMatchObject({ phase: "neutral", probability: 54 });
    expect(months.find((m) => label(m) === "2027-7")).toMatchObject({ basis: "none" });
  });

  it("follows the label, not the row position, across a year boundary", () => {
    const seq = ensoSequence([[2000, 10, 0]], { year: 2000, month: 10 }, [
      ["NDJ", 0, 100, 0],
      ["DJF", 0, 100, 0],
      ["FMA", 0, 100, 0],
    ]);
    const outlook = seq.filter((e) => e.basis === "outlook").map((e) => [e.year, e.month]);
    expect(outlook).toEqual([[2000, 12], [2001, 1], [2001, 3]]);
  });

  it("an outlook starting right after the last season has no gap", () => {
    const seq = ensoSequence([[2000, 1, 0]], { year: 2000, month: 1 }, [["JFM", 0, 100, 0]]);
    expect(seq.at(-1)).toMatchObject({ year: 2000, month: 2, basis: "outlook" });
  });

  it("has a sane snapshot", () => {
    expect(ONI_HISTORY[0]).toEqual([1950, 1, -1.32]);
    expect(OUTLOOK).toHaveLength(9);
    for (const [, a, b, c] of OUTLOOK) expect(a + b + c).toBeGreaterThanOrEqual(99);
  });
});
