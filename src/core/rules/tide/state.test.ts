import { describe, expect, it } from "vitest";
import { instant, metres } from "@/core/units";
import { dailyRange, readTideAt } from "./state";
import { tideSeries } from "./source";
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

describe("pace baseline (ADR 011)", () => {
  const DAY = 24 * 60 * 60_000;
  const HOUR = 60 * 60_000;
  // Four years of hourly points (35,000+). Ranking a reading against all of them on every
  // scrub step would stall the UI; it is ranked against the week around it instead.
  const start = Date.UTC(2026, 0, 1);
  const samples = Array.from({ length: 4 * 365 * 24 }, (_, i) => {
    const amp = i < 2 * 365 * 24 ? 1 : 2;
    return {
      at: instant(start + i * HOUR),
      height: metres(amp * Math.sin((2 * Math.PI * i) / 12.42)),
      turn: null,
    };
  });
  const long = tideSeries({
    station: { id: "x", name: "x", timeZone: "UTC", datum: "MLLW" },
    samples,
    provider: "noaa-coops",
  });

  it("ranks against the week around the read instant, so far dates read like near ones", () => {
    const early = readTideAt(long, instant(start + 100 * DAY + 3 * HOUR))!;
    const late = readTideAt(long, instant(start + 1000 * DAY + 3 * HOUR))!;
    expect(early.pace.value.baseline.sampleCount).toBeLessThanOrEqual(7 * 24 * 6 + 1);
    expect(late.pace.value.baseline.sampleCount).toBeLessThanOrEqual(7 * 24 * 6 + 1);
    expect(early.pace.value.baseline.sampleCount).toBeGreaterThan(6 * 24 * 6);
  });

  it("recentres as the read instant moves, and slides inward at both ends", () => {
    const first = readTideAt(long, instant(start + 6 * HOUR))!;
    const last = readTideAt(long, samples[samples.length - 1].at)!;
    expect(first.pace.value.baseline.sampleCount).toBeLessThanOrEqual(7 * 24 * 6 + 1);
    expect(last.pace.value.baseline.sampleCount).toBeLessThanOrEqual(7 * 24 * 6 + 1);
    expect(first.pace.value.baseline.sampleCount).toBeGreaterThan(6 * 24 * 6);
    expect(last.pace.value.baseline.sampleCount).toBeGreaterThan(6 * 24 * 6);
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
