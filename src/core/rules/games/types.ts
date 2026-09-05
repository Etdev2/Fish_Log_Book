/**
 * Boat Games domain types (ADR 009).
 *
 * The shape here carries the whole ownership decision, so it is worth stating once:
 * a `GameEvent` is a first-class record of a fish, not a pointer to one. It holds its
 * own species and measurements because a guest has no catch row and never will until
 * they claim one. `catch_id` is set only when the host opted the fish into their own
 * log, and then it *references* that catch rather than duplicating it.
 *
 * Pure data. No I/O, no React, no IndexedDB — `features/games/` stores these and
 * `scoring.ts` folds them.
 */

export type GameMode = "captains_cup" | "fish_cricket" | "make_the_cut";

export type GameStatus = "draft" | "active" | "paused" | "completed";

/** Scoreboard colours, by token key. Never a hex — the tripwire and the palette both care. */
export type ParticipantColor =
  | "signal-orange"
  | "tide-cyan"
  | "moon-pale"
  | "success-green"
  | "amber-flag"
  | "text-link";

export const PARTICIPANT_COLORS: readonly ParticipantColor[] = [
  "signal-orange",
  "tide-cyan",
  "moon-pale",
  "success-green",
  "amber-flag",
  "text-link",
];

// ---------------------------------------------------------------------------------
// Participants and teams
// ---------------------------------------------------------------------------------

/**
 * A local player. The `id` is the stable local participant id the founder asked for:
 * minted on this device, never reused, and the only thing a game event points at.
 *
 * `claimed_user_id` is Phase 2's hook. It stays null through the whole of Phase 1, and
 * the fact that it is *here* rather than bolted on later is the point: when a guest
 * claims their fish, their events already name them.
 */
export interface GameParticipant {
  readonly id: string;
  readonly session_id: string;
  readonly display_name: string;
  readonly color_key: ParticipantColor;
  readonly team_id: string | null;
  /**
   * Founder's call: a flat number of points added once to the starting score, shown on
   * the scoreboard. The only reading that means the same thing in all three modes.
   */
  readonly handicap_points: number;
  /** True for the phone's owner. Only a host's catches may be offered to their own log. */
  readonly is_host: boolean;
  readonly claimed_user_id: string | null;
  readonly joined_at: string;
  /** Set when a player is removed before the game starts. Their events never counted. */
  readonly removed_at: string | null;
}

export interface GameTeam {
  readonly id: string;
  readonly session_id: string;
  readonly name: string;
  readonly color_key: ParticipantColor;
}

/** A crew member saved across trips, so the same four people are two taps next time. */
export interface CrewMember {
  readonly id: string;
  readonly display_name: string;
  readonly color_key: ParticipantColor;
  readonly default_handicap: number;
  readonly created_at: string;
  readonly last_played_at: string | null;
}

// ---------------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------------

/**
 * Points for one species or one species group. A group id (`rockfish`, `tuna`) matches
 * any species that rolls up to it, which is how the founder's "categories when exact
 * targets would be too restrictive" works without a second vocabulary.
 */
export interface SpeciesPointRule {
  readonly species_id: string;
  readonly points: number;
}

/** How repeats of the same species are handled, so one easy fish cannot win a day. */
export type RepeatRule =
  /** Every catch scores its full value. */
  | { readonly kind: "unlimited" }
  /** Only the first `count` catches of a species score. */
  | { readonly kind: "capped"; readonly count: number }
  /** Full, then half, then a quarter… floored at one point. */
  | { readonly kind: "diminishing" }
  /** Only the first catch of each species scores at all. */
  | { readonly kind: "unique_only" };

export interface BonusRules {
  /** First scoring catch of the whole game. */
  readonly first_blood: number;
  /** A species this angler has never logged before. */
  readonly new_species: number;
  /** Beat their own best for the species. */
  readonly personal_best: number;
  /** A legal release. Never a penalty for keeping — an *incentive* not to. */
  readonly release: number;
  /** Biggest eligible fish of the round, awarded at the round boundary. */
  readonly biggest_of_round: number;
}

export interface ScoringRules {
  readonly tiers: readonly SpeciesPointRule[];
  /** Points for an eligible species with no tier of its own. */
  readonly default_points: number;
  /** Null means every species is eligible. */
  readonly eligible_species: readonly string[] | null;
  readonly repeat: RepeatRule;
  readonly bonuses: BonusRules;
}

export interface RoundRules {
  /** 1 for a single-session game. */
  readonly count: number;
  /** Minutes per round, or null for a round the host closes by hand (a fishing day). */
  readonly minutes: number | null;
  /** True when a round is a day on a multi-day trip rather than a timer. */
  readonly multi_day: boolean;
  /** Do scores carry into the next round, or start clean? */
  readonly carry_scores: boolean;
}

export interface CricketRules {
  /** The species or groups that must be closed. */
  readonly targets: readonly string[];
  /** Marks needed to close one target. Default three, like darts. */
  readonly marks_to_close: number;
  /** A qualifying size gives two marks instead of one. */
  readonly size_bonus_marks: boolean;
  /** A personal best gives three marks — closes a target outright. */
  readonly personal_best_marks: boolean;
}

export type EliminationKind =
  | { readonly kind: "lowest" }
  | { readonly kind: "below_threshold"; readonly points: number }
  | { readonly kind: "top_half" };

export interface EliminationRules {
  readonly rule: EliminationKind;
  /** Eliminate whole teams rather than individuals. */
  readonly by_team: boolean;
}

export type Tiebreaker =
  | "most_species"
  | "biggest_fish"
  | "earliest_lead"
  | "shared_win";

export interface GameRules {
  readonly mode: GameMode;
  readonly scoring: ScoringRules;
  readonly rounds: RoundRules;
  /** Present only for `fish_cricket`. */
  readonly cricket: CricketRules | null;
  /** Present only for `make_the_cut`. */
  readonly elimination: EliminationRules | null;
  readonly tiebreaker: Tiebreaker;
  /** Honor system, or the host confirms each catch before it scores. */
  readonly host_approval: boolean;
  /** May a player be added after the first catch? */
  readonly late_join: boolean;
}

// ---------------------------------------------------------------------------------
// Session and events
// ---------------------------------------------------------------------------------

export interface GameSession {
  readonly id: string;
  readonly mode: GameMode;
  readonly name: string;
  readonly status: GameStatus;
  readonly rules: GameRules;
  readonly zone: string;
  readonly region_id: string;
  /** The trip this game belongs to, when one was open. Games do not require a trip. */
  readonly trip_id: string | null;
  readonly created_at: string;
  readonly started_at: string | null;
  readonly completed_at: string | null;
  /** Next sequence number to hand an event. Ordering never depends on the clock. */
  readonly next_seq: number;
}

export type GameEventKind =
  | "catch"
  | "void"
  | "round_advanced"
  | "paused"
  | "resumed"
  | "adjustment";

export type EventDisposition = "kept" | "released";

/**
 * What Fish Legal said about this fish at the moment it was scored, frozen here so a
 * pack update next season cannot rewrite a finished game — the same stance the catch
 * log already takes with `regulation_snapshot`.
 *
 * `null` on the event means no verified pack covered the region. That is *unknown*, not
 * *prohibited*: it scores normally. Silence is not proof, in either direction.
 */
export interface EventLegalSnapshot {
  readonly verdict: "keep" | "release" | "conditional";
  readonly reason: string;
  readonly pack_id: string;
  readonly pack_version: number;
  /** From the ontology, independent of any regional pack. */
  readonly protected_species: boolean;
}

export interface GameEvent {
  /** uuidv7, minted at the tap. Doubles as the idempotency key — the fold folds it once. */
  readonly id: string;
  readonly session_id: string;
  readonly kind: GameEventKind;
  readonly participant_id: string | null;
  readonly round: number;
  /**
   * Monotonic within the session. THIS is the order events fold in, not `created_at`:
   * offline the device clock is the only clock and it is user-editable, and a game must
   * not reorder itself because somebody fixed their timezone mid-trip.
   */
  readonly seq: number;
  readonly created_at: string;

  readonly species_id: string | null;
  readonly species_other: string | null;
  readonly length_mm: number | null;
  readonly weight_g: number | null;
  readonly disposition: EventDisposition | null;
  readonly personal_best: boolean;
  readonly new_species: boolean;

  /** Set only when the host chose to log this fish to their own book (ADR 009 §1). */
  readonly catch_id: string | null;
  readonly legal: EventLegalSnapshot | null;

  /** For `void`: the event being undone. Nothing is ever mutated or deleted. */
  readonly voids_event_id: string | null;
  /** For `adjustment`: a host correction, always with a note for the audit trail. */
  readonly adjustment_points: number | null;
  readonly note: string | null;
  /** Set false while `host_approval` is on and the host has not confirmed yet. */
  readonly approved: boolean;
}
