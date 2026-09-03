/**
 * Badge definitions and awards (passport spec §13, §29.3, §29.4).
 *
 * Spec §13's first requirement is that badge definitions are data, not component
 * conditionals. That is why a badge is a row-shaped object with a `ruleType` and a
 * `ruleConfig` rather than a function: the catalog can grow without touching the engine,
 * and the same catalog can be handed to a second client and produce the same answers.
 *
 * There are only five rule shapes in Phase 1 and they cover eight badges (spec §47.3).
 */

/**
 * - `catch_count` — count valid catches. "Log one valid catch."
 * - `unique_species` — count distinct recognised species.
 * - `released_count` — count valid catches released rather than kept.
 * - `unique_species_in_water` — count distinct species of one water class.
 * - `trip_count` — count honestly completed trips, **fish or no fish**.
 *
 * That last shape is the one ROADMAP Part 3 asked for by name: an engagement mechanic
 * must "reward confirming a trip honestly, never reward catching or logging more". A
 * blank day is the most statistically valuable record the product owns, and a passport
 * that only lights up on a fish quietly teaches anglers not to record one.
 */
export type BadgeRuleType =
  | "catch_count"
  | "unique_species"
  | "released_count"
  | "unique_species_in_water"
  | "trip_count";

export interface BadgeRuleConfig {
  readonly threshold: number;
  /** `unique_species_in_water` only. */
  readonly waterClass?: "salt" | "fresh";
}

export interface BadgeDefinition {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: "milestone" | "exploration" | "stewardship";
  readonly tier: number;
  readonly ruleType: BadgeRuleType;
  readonly ruleConfig: BadgeRuleConfig;
  readonly ruleVersion: number;
  readonly iconKey: string;
  readonly active: boolean;
}

/**
 * One badge's standing for one angler.
 *
 * `awardedAt` is the timestamp of the record that crossed the threshold, not the time the
 * evaluation ran — so re-running produces the same answer, and an award keeps its real
 * date after a reinstall (spec §13: deterministic and idempotent).
 *
 * `qualifyingSourceIds` holds the records that earned it, in order, up to the threshold.
 * Spec §13 asks for auditability "when reasonable"; the ones after the threshold add
 * nothing an auditor needs and would grow without bound.
 */
export interface BadgeStanding {
  readonly badgeId: string;
  readonly ruleVersion: number;
  readonly earned: boolean;
  readonly current: number;
  readonly threshold: number;
  readonly awardedAt: string | null;
  readonly qualifyingSourceIds: readonly string[];
}
