import { describe, expect, it } from "vitest";
import { instant } from "@/core/units";
import { nextSlackAfter, nextTurnAfter, previousTurnBefore, turnsIn } from "./turns";
import { fixtureSeries } from "./test-support";

describe("turnsIn / nextTurnAfter / previousTurnBefore", () => {
  const series = fixtureSeries();
  const samples = series.samples;
  const firstLow = samples.find((s) => s.turn === "low")!;
  const firstHigh = samples.find((s) => s.turn === "high")!;

  it("reads published H/L marks back verbatim, does not rediscover them numerically", () => {
    const turns = turnsIn(series, samples[0].at, samples[samples.length - 1].at);
    expect(turns).toHaveLength(samples.filter((s) => s.turn !== null).length);
    expect(turns[0]).toEqual({ at: firstLow.at, kind: "low", height: firstLow.height });
  });

  it("nextTurnAfter finds the next strictly-later turn", () => {
    const turn = nextTurnAfter(series, instant(firstLow.at - 1));
    expect(turn?.at).toBe(firstLow.at);
    const afterFirstLow = nextTurnAfter(series, firstLow.at);
    expect(afterFirstLow?.at).toBe(firstHigh.at);
  });

  it("previousTurnBefore finds the last strictly-earlier turn", () => {
    const turn = previousTurnBefore(series, instant(firstHigh.at + 1));
    expect(turn?.at).toBe(firstHigh.at);
    expect(previousTurnBefore(series, samples[0].at)).toBeNull();
  });
});

describe("nextSlackAfter", () => {
  const series = fixtureSeries();
  const samples = series.samples;
  const firstLow = samples.find((s) => s.turn === "low")!;

  it("returns a window marked estimated, never published", () => {
    const slack = nextSlackAfter(series, instant(firstLow.at - 60 * 60_000));
    expect(slack).not.toBeNull();
    expect(slack!.certainty).toBe("estimated");
    expect(slack!.basis.toLowerCase()).toContain("not a measured current");
  });

  it("centres the window on the published turn and brackets it", () => {
    const slack = nextSlackAfter(series, instant(firstLow.at - 60 * 60_000));
    expect(slack!.value.centre).toBe(firstLow.at);
    expect(slack!.value.turn).toBe("low");
    expect(slack!.value.from).toBeLessThanOrEqual(firstLow.at);
    expect(slack!.value.to).toBeGreaterThanOrEqual(firstLow.at);
  });

  it("returns null when there is no later turn in the loaded series", () => {
    const lastTurn = [...samples].reverse().find((s) => s.turn !== null)!;
    expect(nextSlackAfter(series, lastTurn.at)).toBeNull();
  });
});
