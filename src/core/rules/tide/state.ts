/**
 * `dailyRange` and `readTideAt` — assembling the read-only view the UI consumes.
 */
import type { Instant, Metres, Sourced } from "@/core/units";
import { metres, sourced } from "@/core/units";
import type { TidePredictionSeries } from "./source";
import { heightAt, rateAt } from "./height";
import { turnsIn, nextTurnAfter, previousTurnBefore } from "./turns";
import { paceAt } from "./pace";
import type { TideMotion, TideReading } from "./index-types";
import { SLACK_BELOW, NEAR_SLACK_BELOW, type TideReadOptions } from "./constants";

export function dailyRange(s: TidePredictionSeries, from: Instant, to: Instant): Sourced<Metres> | null {
  const candidates: Sourced<Metres>[] = turnsIn(s, from, to).map((t) =>
    sourced(t.height, "published" as const, "NOAA published turning point."),
  );

  const startHeight = heightAt(s, from);
  if (startHeight) candidates.push(startHeight);
  const endHeight = heightAt(s, to);
  if (endHeight) candidates.push(endHeight);

  if (candidates.length === 0) return null;

  let max = candidates[0];
  let min = candidates[0];
  for (const c of candidates) {
    if (c.value > max.value) max = c;
    if (c.value < min.value) min = c;
  }

  const certainty = max.certainty === "published" && min.certainty === "published" ? "published" : "interpolated";
  return sourced(
    metres(max.value - min.value),
    certainty,
    certainty === "published"
      ? "Difference between the published high and low in range."
      : "Difference between the highest and lowest height in range, including an interpolated endpoint.",
  );
}

function ruleOfTwelfths(progress: number): { hour: 1 | 2 | 3 | 4 | 5 | 6; twelfths: 1 | 2 | 3 } {
  const TWELFTHS_BY_HOUR: readonly (1 | 2 | 3)[] = [1, 2, 3, 3, 2, 1];
  const hour = (Math.min(5, Math.max(0, Math.floor(progress * 6))) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
  return { hour, twelfths: TWELFTHS_BY_HOUR[hour - 1] };
}

export function readTideAt(s: TidePredictionSeries, at: Instant, o?: TideReadOptions): TideReading | null {
  const height = heightAt(s, at);
  if (height === null) return null;

  // rateAt only returns null when `at` is outside the series range, which heightAt above
  // already ruled out, so this is unreachable in practice — kept as a real check rather
  // than asserted away.
  const rate = rateAt(s, at, o?.rateWindow);
  if (rate === null) return null;

  const slackBelow = o?.slackBelow ?? SLACK_BELOW;
  const nearSlackBelow = o?.nearSlackBelow ?? NEAR_SLACK_BELOW;
  const absRate = Math.abs(rate.value);
  const motion: TideMotion =
    absRate < slackBelow ? "slack" : absRate < nearSlackBelow ? "near-slack" : rate.value > 0 ? "rising" : "falling";

  const previousTurn = previousTurnBefore(s, at);
  const nextTurn = nextTurnAfter(s, at);

  let cycleProgress: number | null = null;
  let ruleOfTwelfthsHour: 1 | 2 | 3 | 4 | 5 | 6 | null = null;
  let twelfths: 1 | 2 | 3 | null = null;
  if (previousTurn && nextTurn && nextTurn.at > previousTurn.at) {
    cycleProgress = (at - previousTurn.at) / (nextTurn.at - previousTurn.at);
    const rot = ruleOfTwelfths(cycleProgress);
    ruleOfTwelfthsHour = rot.hour;
    twelfths = rot.twelfths;
  }

  const pace = paceAt(s, at, rate.value, { rateWindow: o?.rateWindow });

  return {
    at,
    height,
    rate,
    motion,
    previousTurn,
    nextTurn,
    cycleProgress,
    ruleOfTwelfthsHour,
    twelfths,
    pace,
  };
}
