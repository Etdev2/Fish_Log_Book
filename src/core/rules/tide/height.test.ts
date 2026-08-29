import { describe, expect, it } from "vitest";
import { instant, millis } from "@/core/units";
import { heightAt, rateAt } from "./height";
import { fixtureSeries } from "./test-support";

describe("heightAt", () => {
  const series = fixtureSeries();
  const samples = series.samples;

  it("returns the published height exactly on a sample instant", () => {
    const sample = samples[0];
    const result = heightAt(series, sample.at);
    expect(result?.certainty).toBe("published");
    expect(result?.value).toBeCloseTo(sample.height, 10);
  });

  it("is interpolated (not published) strictly between two samples", () => {
    const midpoint = instant((samples[0].at + samples[1].at) / 2);
    const result = heightAt(series, midpoint);
    expect(result?.certainty).toBe("interpolated");
  });

  it("returns null outside the loaded range", () => {
    expect(heightAt(series, instant(samples[0].at - 60_000))).toBeNull();
    expect(heightAt(series, instant(samples[samples.length - 1].at + 60_000))).toBeNull();
  });

  it("never overshoots above a published high or below a published low", () => {
    // The published high at index 7 (1277mm) and its neighbours.
    const highSample = samples.find((s) => s.turn === "high")!;
    const lowSample = samples.find((s) => s.turn === "low")!;
    const neighbourHeights = (turnAt: number) => {
      const heights: number[] = [];
      for (let t = turnAt - 30 * 60_000; t <= turnAt + 30 * 60_000; t += 5 * 60_000) {
        if (t < samples[0].at || t > samples[samples.length - 1].at) continue;
        const h = heightAt(series, instant(t));
        if (h) heights.push(h.value);
      }
      return heights;
    };

    for (const h of neighbourHeights(highSample.at)) {
      expect(h).toBeLessThanOrEqual(highSample.height + 1e-9);
    }
    for (const h of neighbourHeights(lowSample.at)) {
      expect(h).toBeGreaterThanOrEqual(lowSample.height - 1e-9);
    }
  });

  it("never overshoots across every published turn in the fixture", () => {
    // General sweep: at every fine-grained point, height must stay within the bounds of
    // its enclosing pair of samples (the monotone-cubic guarantee).
    for (let i = 0; i < samples.length - 1; i++) {
      const lo = Math.min(samples[i].height, samples[i + 1].height);
      const hi = Math.max(samples[i].height, samples[i + 1].height);
      for (let t = samples[i].at as number; t <= samples[i + 1].at; t += 5 * 60_000) {
        const h = heightAt(series, instant(t));
        expect(h!.value).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(h!.value).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
  });
});

describe("rateAt", () => {
  const series = fixtureSeries();
  const samples = series.samples;

  it("is positive while rising (between a low and the next high)", () => {
    const low = samples.find((s) => s.turn === "low")!;
    const nextHighIndex = samples.findIndex((s) => s.turn === "high" && s.at > low.at);
    const midRise = instant((low.at + samples[nextHighIndex].at) / 2);
    const rate = rateAt(series, midRise);
    expect(rate!.value).toBeGreaterThan(0);
  });

  it("is negative while falling (between a high and the next low)", () => {
    const high = samples.find((s) => s.turn === "high")!;
    const nextLowIndex = samples.findIndex((s) => s.turn === "low" && s.at > high.at);
    const midFall = instant((high.at + samples[nextLowIndex].at) / 2);
    const rate = rateAt(series, midFall);
    expect(rate!.value).toBeLessThan(0);
  });

  it("is ~0 at a published turning point", () => {
    const high = samples.find((s) => s.turn === "high")!;
    const rate = rateAt(series, high.at, millis(30 * 60_000));
    expect(Math.abs(rate!.value)).toBeLessThan(0.15);
  });

  it("returns null outside the loaded range", () => {
    expect(rateAt(series, instant(samples[0].at - 60_000))).toBeNull();
  });
});
