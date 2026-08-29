import { describe, expect, it } from "vitest";
import { instant, metres, metresPerHour } from "@/core/units";
import { nextSlackAfter, nextTurnAfter, previousTurnBefore, turnsIn } from "./turns";
import { tideSeries } from "./source";
import { fixtureSeries, FIXTURE_STATION } from "./test-support";

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

  it("narrows the window when slackBelow is reduced", () => {
    const at = instant(firstLow.at - 60 * 60_000);
    const wide = nextSlackAfter(series, at, { slackBelow: metresPerHour(0.2) })!;
    const narrow = nextSlackAfter(series, at, { slackBelow: metresPerHour(0.01) })!;
    const wideWidth = wide.value.to - wide.value.from;
    const narrowWidth = narrow.value.to - narrow.value.from;
    // A regression to a fixed bracket around the turn (e.g. a hardcoded +-15min) would not
    // move at all when the threshold changes; a genuine rate-derived window must shrink.
    expect(narrowWidth).toBeLessThan(wideWidth);
  });

  it("yields a measurably narrower window for a sharp turn than a gentle one", () => {
    // Two tiny synthetic series, each a single low turn, same duration and same
    // slackBelow — the only difference is how fast the height changes on either side of
    // the turn. A fixed-bracket regression would report identical widths for both.
    const minutes = (m: number) => instant(m * 60_000);
    const buildAroundLowTurn = (offsets: readonly [number, number][]) =>
      tideSeries({
        station: FIXTURE_STATION,
        provider: "fixture",
        samples: offsets.map(([minute, height]) => ({
          at: minutes(minute),
          height: metres(height),
          turn: minute === 0 ? ("low" as const) : null,
        })),
      });

    const gentle = buildAroundLowTurn([
      [-180, 1.3],
      [-120, 1.2],
      [-60, 1.12],
      [-30, 1.08],
      [0, 1.05],
      [30, 1.08],
      [60, 1.12],
      [120, 1.2],
      [180, 1.3],
    ]);
    const sharp = buildAroundLowTurn([
      [-180, 2.6],
      [-120, 2.2],
      [-60, 1.7],
      [-30, 1.3],
      [0, 1.0],
      [30, 1.3],
      [60, 1.7],
      [120, 2.2],
      [180, 2.6],
    ]);

    const at = minutes(-180);
    const slackBelow = metresPerHour(0.05);
    const gentleSlack = nextSlackAfter(gentle, at, { slackBelow })!;
    const sharpSlack = nextSlackAfter(sharp, at, { slackBelow })!;
    const gentleWidth = gentleSlack.value.to - gentleSlack.value.from;
    const sharpWidth = sharpSlack.value.to - sharpSlack.value.from;

    expect(sharpWidth).toBeLessThan(gentleWidth);
  });
});
