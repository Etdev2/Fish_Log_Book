/** `turns.ts` against `src/core/rules/vectors/tide-turns.json`. ADR 003 §4. */
import { describe, expect, it } from "vitest";

import { instant, metres } from "@/core/units";
import vectors from "../vectors/tide-turns.json";
import { nextSlackAfter, nextTurnAfter, previousTurnBefore, turnsIn } from "./turns";
import { tideSeries, type TidePredictionSample, type TideStation } from "./source";

const samples: TidePredictionSample[] = vectors.samples.map(([at, h, turn]) => ({
  at: instant(at as number),
  height: metres(h as number),
  turn: turn as "high" | "low" | null,
}));
const series = tideSeries({
  station: vectors.station as TideStation,
  samples,
  provider: "fixture",
  retrievedAt: null,
});

describe("tide turns vectors (ADR 003 §4)", () => {
  it("turnsIn returns the NOAA published marks in range", () => {
    for (const c of vectors.turnsIn) {
      const got = turnsIn(series, instant(c.from), instant(c.to));
      expect(got.map((t) => ({ at: t.at as number, kind: t.kind, heightM: t.height as number })))
        .toEqual(c.expected);
    }
  });

  it("nextTurnAfter / previousTurnBefore", () => {
    for (const c of vectors.nextTurnAfter) {
      const got = nextTurnAfter(series, instant(c.at));
      if (c.expected === null) expect(got).toBeNull();
      else expect({ at: got!.at as number, kind: got!.kind, heightM: got!.height as number })
        .toEqual(c.expected);
    }
    for (const c of vectors.previousTurnBefore) {
      const got = previousTurnBefore(series, instant(c.at));
      if (c.expected === null) expect(got).toBeNull();
      else expect({ at: got!.at as number, kind: got!.kind, heightM: got!.height as number })
        .toEqual(c.expected);
    }
  });

  it("nextSlackAfter brackets the turn by the documented threshold walk", () => {
    for (const c of vectors.nextSlackAfter) {
      const got = nextSlackAfter(series, instant(c.after));
      expect(got, JSON.stringify(c)).not.toBeNull();
      expect(got!.value.centre as number, JSON.stringify(c)).toBe(c.centre);
      expect(got!.value.turn).toBe(c.turn);
      expect(got!.value.from as number, JSON.stringify(c)).toBe(c.from);
      expect(got!.value.to as number, JSON.stringify(c)).toBe(c.to);
      // Never "published": a slack window is estimated from heights, not measured.
      expect(got!.certainty).toBe(c.certainty);
    }
  });
});
