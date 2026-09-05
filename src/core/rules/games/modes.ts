/**
 * The three Phase 1 games, as configurations of one engine (ADR 009 §3).
 *
 * Nothing in this file is code the fold has to know about. A mode is a `GameRules`
 * value, which is why Species Sprint, Grand Slam, Exact 21 and the rest arrive later as
 * more of these rather than as more scoring systems.
 */

import type { GameMode, GameRules, SpeciesPointRule } from "./types";

/**
 * The founder's default tiers. Deliberately NOT a global truth about fish: a calico bass
 * is an ordinary afternoon in Newport and a notable day off Seattle, so this is a
 * *starting template* the captain edits, and the game stores the edited copy.
 */
export const POINT_TIERS = {
  common: 1,
  standard: 3,
  featured: 5,
  trophy: 8,
} as const;

export type PointTier = keyof typeof POINT_TIERS;

export interface PointTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tiers: readonly SpeciesPointRule[];
}

/**
 * Southern California, the region the app knows best. Group ids (`rockfish`) match every
 * species that rolls up to them, so the table stays short and still covers the fish
 * nobody can name to species on a rolling deck.
 */
export const SOCAL_TEMPLATE: PointTemplate = {
  id: "socal",
  name: "Southern California",
  description: "Bass and bonito are the everyday fish; yellowtail and bluefin are the day-makers.",
  tiers: [
    { species_id: "pacific_mackerel", points: POINT_TIERS.common },
    { species_id: "surfperch", points: POINT_TIERS.common },
    { species_id: "croaker", points: POINT_TIERS.common },
    { species_id: "kelp_bass", points: POINT_TIERS.standard },
    { species_id: "barred_sand_bass", points: POINT_TIERS.standard },
    { species_id: "spotted_sand_bass", points: POINT_TIERS.standard },
    { species_id: "rockfish", points: POINT_TIERS.standard },
    { species_id: "pacific_bonito", points: POINT_TIERS.standard },
    { species_id: "california_halibut", points: POINT_TIERS.featured },
    { species_id: "white_seabass", points: POINT_TIERS.featured },
    { species_id: "yellowtail", points: POINT_TIERS.featured },
    { species_id: "bluefin_tuna", points: POINT_TIERS.trophy },
    { species_id: "yellowfin_tuna", points: POINT_TIERS.trophy },
    { species_id: "dorado", points: POINT_TIERS.trophy },
  ],
};

/** Every fish the same. The honest default when nobody wants to argue about a table. */
export const FLAT_TEMPLATE: PointTemplate = {
  id: "flat",
  name: "Every fish counts the same",
  description: "One point per fish, whatever it is. Simplest possible game.",
  tiers: [],
};

export const POINT_TEMPLATES: readonly PointTemplate[] = [SOCAL_TEMPLATE, FLAT_TEMPLATE];

const NO_BONUSES = {
  first_blood: 0,
  new_species: 0,
  personal_best: 0,
  release: 0,
  biggest_of_round: 0,
} as const;

/**
 * Captain's Cup as it ships. Points per species, a bonus for the things worth
 * encouraging, and a three-catch cap so nobody wins the day on one school of mackerel.
 */
export function captainsCupDefaults(): GameRules {
  return {
    mode: "captains_cup",
    scoring: {
      tiers: SOCAL_TEMPLATE.tiers,
      default_points: POINT_TIERS.common,
      eligible_species: null,
      repeat: { kind: "capped", count: 3 },
      bonuses: {
        ...NO_BONUSES,
        first_blood: 2,
        new_species: 3,
        personal_best: 3,
        // A release is worth a point on its own. The game must never make keeping a fish
        // the scoring choice — legal-and-returned should be at least as good a day.
        release: 1,
        biggest_of_round: 5,
      },
    },
    rounds: { count: 1, minutes: 240, multi_day: false, carry_scores: true },
    cricket: null,
    elimination: null,
    tiebreaker: "most_species",
    host_approval: false,
    late_join: true,
  };
}

export function fishCricketDefaults(): GameRules {
  return {
    mode: "fish_cricket",
    scoring: {
      tiers: SOCAL_TEMPLATE.tiers,
      default_points: POINT_TIERS.common,
      eligible_species: null,
      repeat: { kind: "unlimited" },
      bonuses: { ...NO_BONUSES },
    },
    rounds: { count: 1, minutes: 240, multi_day: false, carry_scores: true },
    cricket: {
      targets: ["kelp_bass", "rockfish", "pacific_bonito", "california_halibut", "yellowtail"],
      marks_to_close: 3,
      size_bonus_marks: true,
      personal_best_marks: false,
    },
    elimination: null,
    tiebreaker: "most_species",
    host_approval: false,
    late_join: false,
  };
}

export function makeTheCutDefaults(): GameRules {
  return {
    mode: "make_the_cut",
    scoring: {
      tiers: SOCAL_TEMPLATE.tiers,
      default_points: POINT_TIERS.common,
      eligible_species: null,
      repeat: { kind: "capped", count: 3 },
      bonuses: { ...NO_BONUSES, biggest_of_round: 5 },
    },
    // Three fishing days, closed by the captain. A multi-day game must never end because
    // somebody's phone changed timezone at the dock (ADR 009 §3).
    rounds: { count: 3, minutes: null, multi_day: true, carry_scores: false },
    cricket: null,
    elimination: { rule: { kind: "lowest" }, by_team: false },
    tiebreaker: "biggest_fish",
    host_approval: false,
    late_join: false,
  };
}

export function defaultsFor(mode: GameMode): GameRules {
  switch (mode) {
    case "captains_cup":
      return captainsCupDefaults();
    case "fish_cricket":
      return fishCricketDefaults();
    case "make_the_cut":
      return makeTheCutDefaults();
  }
}

export interface ModeSummary {
  readonly mode: GameMode;
  readonly name: string;
  readonly tagline: string;
  readonly duration: string;
  readonly how: readonly string[];
}

/** What the game list shows: what it is, how long it takes, how it works. */
export const MODES: readonly ModeSummary[] = [
  {
    mode: "captains_cup",
    name: "Captain's Cup",
    tagline: "Every fish is worth points. Most points wins.",
    duration: "A few hours, or a whole day",
    how: [
      "The captain sets what each fish is worth.",
      "Bonuses for your first fish, a new species, a personal best, and the biggest of the day.",
      "Only the first three of any one species score, so one hot bite can't run away with it.",
    ],
  },
  {
    mode: "fish_cricket",
    name: "Fish Cricket",
    tagline: "Close out your targets before anyone else, then score on them.",
    duration: "Half a day",
    how: [
      "Pick a handful of target species. Three of each closes it.",
      "A measured fish counts double toward closing.",
      "Once you've closed a target you score on it — until everyone else closes it too.",
    ],
  },
  {
    mode: "make_the_cut",
    name: "Make the Cut",
    tagline: "Lowest score goes home at the end of each day.",
    duration: "Two to four fishing days",
    how: [
      "Everyone fishes the day. Lowest score is out when the captain closes it.",
      "Scores start fresh each day, so a bad morning isn't the end of it.",
      "Knocked out? Keep logging — your fish still count on the trip, just not the cup.",
    ],
  },
];
