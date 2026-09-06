import { speciesById } from "@/core/ontology/species";
import { catchesIn, scoreRuleFor, type FormatCategory } from "@/core/tournaments/formats";
import {
  computeOfficialStandings,
  type EligibleCatch,
  type ScoringFamily,
} from "@/core/tournaments/official-scoring";

/**
 * The field: who is fishing, and where they stand.
 *
 * One shape, used by the roster, the standings board and the organizer's counts, so those
 * three screens cannot disagree about how many boats are in or who is leading. Before this
 * existed the leaderboard had its own hardcoded names and the roster did not exist at all,
 * which is exactly the shape of the bug where a director reads "14 entries" on one screen
 * and counts 12 rows on the next.
 *
 * Pure: no React, no storage, no clock. The demo data and the Supabase reads both produce
 * `FieldEntry[]` and everything below works the same on either.
 *
 * Field names mirror `public.tournament_entry`, `tournament_team` and `tournament_boat`
 * rather than inventing a parallel vocabulary (UX-001 §15: "UX implementation agents must
 * consume stabilized contracts rather than create competing domain types").
 */

/** One fish an entry landed, in the units the app records them in. */
export interface FieldCatch {
  readonly id: string;
  readonly speciesId: string | null;
  readonly weightLb: number | null;
  readonly lengthIn: number | null;
}

export interface FieldEntry {
  readonly entryId: string;
  /** The number pinned to the boat. Optional in the schema, so optional here. */
  readonly entryNumber: string | null;
  readonly displayName: string;
  readonly teamName: string | null;
  readonly boatName: string | null;
  readonly registrationStatus: string;
  readonly eligibilityStatus: string;
  readonly checkInStatus: string;
  readonly competitionStatus: string;
  /** The signed-in angler's own entry, so a roster of eighty can still find you. */
  readonly isYou: boolean;
  /**
   * The best approved weight for this entry, in pounds. `null` means nothing of theirs has
   * been scored yet — which is not the same as zero, and is never rendered as "0.0 lb".
   */
  readonly bestWeightLb: number | null;
  readonly species: string | null;
  /** Their best catch is logged but a judge has not closed it out. */
  readonly awaitingReview: boolean;
  /**
   * Every scored catch, which is what a category with its own species list has to look at.
   * A boat's *best* fish is not enough once a tournament has a marlin category and a tuna
   * category: the best fish belongs to one of them and the other needs the rest of the list.
   */
  readonly catches: readonly FieldCatch[];
}

export interface FieldSummary {
  /** Entries that are not withdrawn, rejected or cancelled — the real size of the field. */
  readonly entered: number;
  readonly confirmed: number;
  readonly waitlisted: number;
  readonly checkedIn: number;
  /** Entries with at least one scored catch. */
  readonly onTheBoard: number;
  readonly needsAttention: number;
}

const OUT_OF_THE_FIELD = new Set(["REJECTED", "WITHDRAWN", "CANCELLED"]);

/** True for an entry that still counts as part of the tournament. */
export function isInTheField(entry: FieldEntry): boolean {
  return !OUT_OF_THE_FIELD.has(entry.registrationStatus);
}

export function fieldSummary(field: readonly FieldEntry[]): FieldSummary {
  const live = field.filter(isInTheField);
  return {
    entered: live.length,
    confirmed: live.filter((entry) => entry.registrationStatus === "CONFIRMED").length,
    waitlisted: live.filter((entry) => entry.registrationStatus === "WAITLISTED").length,
    checkedIn: live.filter((entry) => entry.checkInStatus === "CHECKED_IN").length,
    onTheBoard: live.filter((entry) => entry.bestWeightLb !== null).length,
    // What an organizer has to do something about before lines in: a place still pending,
    // or an eligibility question nobody has answered.
    needsAttention: live.filter(
      (entry) =>
        entry.registrationStatus === "PENDING" ||
        entry.eligibilityStatus === "INELIGIBLE" ||
        entry.eligibilityStatus === "PENDING_REVIEW",
    ).length,
  };
}

/**
 * Search across every name a person might type: the angler, the team, the boat, or the
 * number on the side of it. A director looking for "Miss Ellie" at a weigh-in should not
 * have to remember whose boat it is.
 */
export function searchField(field: readonly FieldEntry[], query: string): FieldEntry[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [...field];

  return field.filter((entry) =>
    [entry.displayName, entry.teamName, entry.boatName, entry.entryNumber]
      .filter((value): value is string => typeof value === "string")
      .some((value) => value.toLowerCase().includes(needle)),
  );
}

export interface RankedEntry extends FieldEntry {
  readonly rank: number;
  /** True when this entry shares its rank with another. */
  readonly tied: boolean;
}

/**
 * Standard competition ranking: equal weights share a place and the next place skips
 * (1, 2, 2, 4). Two boats on the same fish is an ordinary Saturday, and quietly ordering
 * one above the other by whichever row the database returned first is how a tournament
 * ends in an argument.
 *
 * Entries with nothing scored are not ranked at all — they are not last, they are simply
 * not on the board yet, and the roster is where they appear.
 *
 * This is presentation-side ranking over already-approved catches, for a board that has to
 * paint on a phone with no signal. Official standings stay server-authoritative
 * (`core/tournaments/official-scoring.ts`); when the server sends its own `standing` rows,
 * those win and this is not consulted.
 */
export function rankField(field: readonly FieldEntry[]): RankedEntry[] {
  const scored = field
    .filter((entry) => isInTheField(entry) && entry.bestWeightLb !== null)
    .sort((a, b) => (b.bestWeightLb ?? 0) - (a.bestWeightLb ?? 0));

  const ranked: RankedEntry[] = [];
  let previousWeight: number | null = null;
  let previousRank = 0;

  scored.forEach((entry, index) => {
    const weight = entry.bestWeightLb ?? 0;
    const rank = weight === previousWeight ? previousRank : index + 1;
    ranked.push({ ...entry, rank, tied: false });
    previousWeight = weight;
    previousRank = rank;
  });

  // A tie is only visible once the whole list exists, so it is marked in a second pass
  // rather than guessed at during the first.
  const counts = new Map<number, number>();
  for (const entry of ranked) counts.set(entry.rank, (counts.get(entry.rank) ?? 0) + 1);
  return ranked.map((entry) => ({ ...entry, tied: (counts.get(entry.rank) ?? 0) > 1 }));
}

/** How an entry is named on a board: the boat if there is one, otherwise the person. */
export function boardName(entry: FieldEntry): string {
  return entry.teamName ?? entry.boatName ?? entry.displayName;
}

/**
 * The second line under it — who is aboard, without repeating the first line.
 *
 * A team and its boat very often share a name ("Bluewater" fishing off *Bluewater*), so
 * the boat is dropped when it would just say the headline again.
 */
export function boardSubtitle(entry: FieldEntry): string | null {
  const headline = boardName(entry);
  const parts = [
    entry.boatName === headline ? null : entry.boatName,
    entry.displayName === headline ? null : entry.displayName,
  ];
  const kept = parts.filter((value): value is string => Boolean(value));
  return kept.length > 0 ? kept.join(" · ") : null;
}

/* -------------------------------------------------------------------------- */
/* Scoring a category                                                          */
/* -------------------------------------------------------------------------- */

/**
 * One entry's place in one category.
 *
 * `score` is in the category's own unit — pounds for a weight family, points for a points
 * family, inches for a length one — and `scoreLabel` is the only thing that should print it,
 * so a points total never arrives on a board with "lb" after it.
 */
export interface CategoryStanding extends RankedEntry {
  readonly score: number;
}

const GRAMS_PER_POUND = 453.59237;
const MM_PER_INCH = 25.4;

function unitOf(family: ScoringFamily): "weight" | "length" | "points" {
  switch (family) {
    case "BIGGEST_FISH":
    case "TOTAL_WEIGHT":
    case "BEST_N_WEIGHT":
      return "weight";
    case "TOTAL_LENGTH":
    case "BIGGEST_LENGTH":
      return "length";
    default:
      return "points";
  }
}

/**
 * The board for one category, scored through `core/tournaments/official-scoring.ts`.
 *
 * The catches are converted into the scorer's units (grams, millimetres) and the result is
 * converted back, rather than the scorer being handed pounds in a field named `weightG`.
 * That shortcut would work perfectly and be wrong the first time anybody else read it.
 *
 * This is the on-device board, computed from approved catches so it can paint with no
 * signal. Official standings remain the server's (`standing` rows); where those exist they
 * win and this is not consulted.
 */
export function scoreboardFor(
  field: readonly FieldEntry[],
  category: FormatCategory,
): CategoryStanding[] {
  const contenders = field.filter(isInTheField);
  const unit = unitOf(category.family);

  const catches: EligibleCatch[] = contenders.flatMap((entry) =>
    catchesIn(category, toEligible(entry)).map((item) => item),
  );

  const standings = computeOfficialStandings(
    contenders.map((entry) => entry.entryId),
    catches,
    [],
    scoreRuleFor(category),
  );

  const byId = new Map(contenders.map((entry) => [entry.entryId, entry]));

  return standings
    .filter((row) => row.score > 0)
    .map((row) => {
      const entry = byId.get(row.entryId)!;
      const score =
        unit === "weight"
          ? row.score / GRAMS_PER_POUND
          : unit === "length"
            ? row.score / MM_PER_INCH
            : row.score;
      return { ...entry, rank: row.rank, tied: false, score };
    })
    .map((row, _index, all) => ({
      ...row,
      tied: all.filter((other) => other.rank === row.rank).length > 1,
    }));
}

/** An entry's catches in the shape the official scorer reads. */
function toEligible(entry: FieldEntry): EligibleCatch[] {
  return entry.catches.map((item) => ({
    id: item.id,
    entryId: entry.entryId,
    speciesId: item.speciesId,
    weightG: item.weightLb === null ? null : Math.round(item.weightLb * GRAMS_PER_POUND),
    lengthMm: item.lengthIn === null ? null : Math.round(item.lengthIn * MM_PER_INCH),
    approved: true,
    disqualified: false,
  }));
}

/**
 * A species id as a person reads it. Ids are the ontology's (`bluefin_tuna`), and printing
 * one raw on a board is the same class of mistake as printing a lifecycle enum.
 */
export function speciesName(id: string | null): string | null {
  if (id === null) return null;
  return speciesById(id)?.commonName ?? id;
}

/** A score with its unit, so a points total never gets "lb" printed after it. */
export function scoreLabel(category: FormatCategory, score: number): string {
  switch (unitOf(category.family)) {
    case "weight":
      return `${score.toFixed(1)} lb`;
    case "length":
      return `${score.toFixed(1)} in`;
    default:
      return `${Math.round(score)} pts`;
  }
}
