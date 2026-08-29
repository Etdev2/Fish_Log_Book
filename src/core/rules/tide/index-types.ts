/**
 * Output types shared between `state.ts` and `index.ts`, split out to avoid a circular
 * import (`index.ts` re-exports `state.ts`, and `state.ts` needs these types).
 */
import type { Instant, Metres, MetresPerHour, Sourced } from "@/core/units";
import type { TideTurn } from "./turns";
import type { TidePace } from "./pace";

export type TideMotion = "rising" | "falling" | "near-slack" | "slack";

export interface TideReading {
  readonly at: Instant;
  readonly height: Sourced<Metres>;
  /** Signed: positive rising, negative falling. */
  readonly rate: Sourced<MetresPerHour>;
  readonly motion: TideMotion;
  readonly previousTurn: TideTurn | null;
  readonly nextTurn: TideTurn | null;
  /** 0..1 through the current flood/ebb leg, or `null` if either bounding turn is unknown. */
  readonly cycleProgress: number | null;
  readonly ruleOfTwelfthsHour: 1 | 2 | 3 | 4 | 5 | 6 | null;
  readonly twelfths: 1 | 2 | 3 | null;
  readonly pace: Sourced<TidePace>;
}
