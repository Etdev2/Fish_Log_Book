import { describe, expect, it } from "vitest";
import { instant } from "@/core/units";
import { dailyRange, readTideAt } from "./state";
import { fixtureSeries } from "./test-support";

describe("readTideAt", () => {
  const series = fixtureSeries();
  const samples = series.samples;

  it("returns null outside the loaded range", () => {
    expect(readTideAt(series, instant(samples[0].at - 60_000))).toBeNull();
  });

  it("assembles a reading with previous/next turns, motion, and pace", () => {
    const low = samples.find((s) => s.turn === "low")!;
    const high = samples.find((s) => s.turn === "high" && s.at > low.at)!;
    const mid = instant((low.at + high.at) / 2);
    const reading = readTideAt(series, mid);
    expect(reading).not.toBeNull();
    expect(reading!.previousTurn?.at).toBe(low.at);
    expect(reading!.nextTurn?.at).toBe(high.at);
    expect(reading!.motion).toBe("rising");
    expect(reading!.cycleProgress).not.toBeNull();
    expect(reading!.cycleProgress).toBeGreaterThan(0);
    expect(reading!.cycleProgress).toBeLessThan(1);
    expect(reading!.ruleOfTwelfthsHour).not.toBeNull();
    expect(reading!.twelfths).not.toBeNull();
    expect(reading!.pace.certainty).toBe("estimated");
  });

  it("classifies slack at a published turn", () => {
    const high = samples.find((s) => s.turn === "high")!;
    const reading = readTideAt(series, high.at);
    expect(reading!.motion === "slack" || reading!.motion === "near-slack").toBe(true);
  });
});

describe("dailyRange", () => {
  const series = fixtureSeries();
  const samples = series.samples;

  it("is the difference between the highest and lowest height in range", () => {
    const range = dailyRange(series, samples[0].at, samples[samples.length - 1].at);
    const heights = samples.map((s) => s.height);
    expect(range!.value).toBeCloseTo(Math.max(...heights) - Math.min(...heights), 6);
  });
});
