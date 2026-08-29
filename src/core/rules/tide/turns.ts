/**
 * Turning points and slack-water windows.
 *
 * `turnsIn` / `nextTurnAfter` / `previousTurnBefore` read the published H/L marks off the
 * series — they never rediscover a turn numerically, so a turn's `height` is always
 * `"published"` provenance one level up (see `state.ts`).
 *
 * `nextSlackAfter` is different on purpose. High/low water is NOT the same moment as slack
 * current, and this app has no current-prediction station within range (ADR 006 §4, and
 * ADR 002). What we can compute from height predictions alone is a WINDOW around each
 * turning point where the rate of height change stays under a threshold — a reasonable
 * estimate of when the current is weak, never a claim about a measured current. That is
 * why the result is `Sourced` with `certainty: "estimated"`, never `"published"`.
 */
import type { Instant, Metres, Millis, Sourced } from "@/core/units";
import { sourced } from "@/core/units";
import type { TidePredictionSeries } from "./source";
import { rateAt } from "./height";
import { RATE_WINDOW, SLACK_BELOW, type TideReadOptions } from "./constants";

export interface TideTurn {
  readonly at: Instant;
  readonly kind: "high" | "low";
  readonly height: Metres;
}

export interface SlackWindow {
  readonly centre: Instant;
  readonly from: Instant;
  readonly to: Instant;
  readonly turn: "high" | "low";
}

function toTurn(sample: { at: Instant; height: Metres; turn: "high" | "low" | null }): TideTurn | null {
  return sample.turn === null ? null : { at: sample.at, kind: sample.turn, height: sample.height };
}

export function turnsIn(s: TidePredictionSeries, from: Instant, to: Instant): readonly TideTurn[] {
  const result: TideTurn[] = [];
  for (const sample of s.samples) {
    if (sample.at < from || sample.at > to) continue;
    const turn = toTurn(sample);
    if (turn) result.push(turn);
  }
  return result;
}

export function nextTurnAfter(s: TidePredictionSeries, at: Instant): TideTurn | null {
  for (const sample of s.samples) {
    if (sample.at <= at) continue;
    const turn = toTurn(sample);
    if (turn) return turn;
  }
  return null;
}

export function previousTurnBefore(s: TidePredictionSeries, at: Instant): TideTurn | null {
  let found: TideTurn | null = null;
  for (const sample of s.samples) {
    if (sample.at >= at) break;
    const turn = toTurn(sample);
    if (turn) found = turn;
  }
  return found;
}

const SEARCH_STEP: Millis = 60_000 as Millis; // 1 minute
const MAX_SEARCH_STEPS = 6 * 60; // cap the search at 6 hours either side of a turn

function findSlackBoundary(
  s: TidePredictionSeries,
  turnAt: Instant,
  direction: -1 | 1,
  slackBelow: number,
  rateWindow: Millis,
): Instant {
  const seriesFirst = s.samples[0].at;
  const seriesLast = s.samples[s.samples.length - 1].at;
  let boundary = turnAt;
  for (let step = 1; step <= MAX_SEARCH_STEPS; step++) {
    const t = (turnAt + direction * step * SEARCH_STEP) as Instant;
    if (t < seriesFirst || t > seriesLast) break;
    const r = rateAt(s, t, rateWindow);
    if (r === null || Math.abs(r.value) >= slackBelow) break;
    boundary = t;
  }
  return boundary;
}

export function nextSlackAfter(
  s: TidePredictionSeries,
  at: Instant,
  o?: TideReadOptions,
): Sourced<SlackWindow> | null {
  const turn = nextTurnAfter(s, at);
  if (!turn) return null;

  const slackBelow = o?.slackBelow ?? SLACK_BELOW;
  const rateWindow = o?.rateWindow ?? RATE_WINDOW;
  const from = findSlackBoundary(s, turn.at, -1, slackBelow, rateWindow);
  const to = findSlackBoundary(s, turn.at, 1, slackBelow, rateWindow);

  return sourced(
    { centre: turn.at, from, to, turn: turn.kind },
    "estimated",
    "Estimated from the height-prediction rate of change around a published turning point, " +
      "not a measured current — high or low water is not the same moment as slack current, " +
      "and no current-prediction station exists near this location.",
  );
}
