/**
 * End-of-game awards, derived from the same folded events as the scoreboard.
 *
 * Trimmed on the founder's call to the ones worth having before anybody has played a real
 * game on a real boat: the winner, the biggest fish, the most species, and what went back
 * in the water. "Best comeback" and "most valuable catch" are derivable from this same
 * event list and were deliberately held — a results screen with ten tiles nobody reads is
 * worse than four they do.
 *
 * Pure, like everything else here.
 */

import type { GameStandings, ScoredEvent } from "./scoring";
import type { GameParticipant } from "./types";

export interface Award {
  readonly kind: "biggest_fish" | "most_species" | "released";
  readonly label: string;
  /** The participant who earned it, or null when nobody did. */
  readonly participant_id: string | null;
  readonly detail: string;
}

/** The biggest scoring fish of the whole game, by weight and then length. */
export function biggestFish(standings: GameStandings): ScoredEvent | null {
  let best: ScoredEvent | null = null;
  for (const scored of standings.events) {
    if (scored.status !== "scored" || scored.event.kind !== "catch") continue;
    const weight = scored.event.weight_g ?? 0;
    const length = scored.event.length_mm ?? 0;
    if (weight === 0 && length === 0) continue;
    const bw = best?.event.weight_g ?? 0;
    const bl = best?.event.length_mm ?? 0;
    if (best === null || weight > bw || (weight === bw && length > bl)) best = scored;
  }
  return best;
}

export function awards(
  standings: GameStandings,
  participants: readonly GameParticipant[],
): readonly Award[] {
  const nameOf = (id: string | null) =>
    participants.find((p) => p.id === id)?.display_name ?? "Nobody";

  const out: Award[] = [];

  const biggest = biggestFish(standings);
  if (biggest !== null) {
    out.push({
      kind: "biggest_fish",
      label: "Biggest fish",
      participant_id: biggest.event.participant_id,
      detail: nameOf(biggest.event.participant_id),
    });
  }

  const mostSpecies = [...standings.rows].sort(
    (a, b) => b.unique_species.length - a.unique_species.length,
  )[0];
  if (mostSpecies && mostSpecies.unique_species.length > 0) {
    out.push({
      kind: "most_species",
      label: "Most species",
      participant_id: mostSpecies.participant_id,
      detail: `${nameOf(mostSpecies.participant_id)} · ${mostSpecies.unique_species.length}`,
    });
  }

  const released = standings.rows.reduce((sum, r) => sum + r.released, 0);
  if (released > 0) {
    out.push({
      kind: "released",
      label: "Put back",
      participant_id: null,
      detail: `${released} ${released === 1 ? "fish" : "fish"} released`,
    });
  }

  return out;
}
