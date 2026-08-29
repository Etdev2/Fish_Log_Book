import type { Millis, MetresPerHour } from "@/core/units";
import { millis, metresPerHour } from "@/core/units";

/** Centred window for `rateAt`'s finite difference, unless overridden. */
export const RATE_WINDOW: Millis = millis(60 * 60_000);

/** Below this |rate|, motion is classified `"slack"`. */
export const SLACK_BELOW: MetresPerHour = metresPerHour(0.05);

/** Below this |rate| (but at/above `SLACK_BELOW`), motion is classified `"near-slack"`. */
export const NEAR_SLACK_BELOW: MetresPerHour = metresPerHour(0.15);

export interface TideReadOptions {
  /** Centred window for the rate calculation. Default `RATE_WINDOW` (60 min). */
  readonly rateWindow?: Millis;
  /** |rate| threshold for `"slack"`. Default `SLACK_BELOW` (0.05 m/h). */
  readonly slackBelow?: MetresPerHour;
  /** |rate| threshold for `"near-slack"`. Default `NEAR_SLACK_BELOW` (0.15 m/h). */
  readonly nearSlackBelow?: MetresPerHour;
}
