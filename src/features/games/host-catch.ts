"use client";

import type { GameParticipant } from "@/core/rules/games/types";
import { EMPTY_DRAFT, logCatch } from "@/features/catches/create";
import { currentLog } from "@/features/catches/store";

/**
 * The one place a game catch may become a real catch (ADR 009 §1).
 *
 * This file is deliberately the *only* module in `features/games/` that imports the Fish
 * Log's write path, and `ownership.test.ts` enforces that by name. The rule it protects is
 * the founder's first requirement: if Mike catches a fish and Elliott records it on
 * Elliott's phone, Mike's fish must never appear in Elliott's Passport, history, personal
 * bests or statistics. Every other path in Boat Games writes a `game_event` and stops.
 *
 * So the host check below is not a formality. It is the rule, in code, at the only door
 * that opens — and it is checked here rather than trusted from the caller, because a UI
 * that only shows the toggle to the host is a UI, and a UI is one refactor from being
 * wrong.
 *
 * The catch is minted through the ordinary `logCatch`, not by writing a row directly, so
 * a fish caught during a game arrives in the log with the same rig, trip, conditions and
 * regulation snapshot as any other fish. A game must not create second-class catches.
 */

export interface HostCatchInput {
  readonly speciesId: string | null;
  readonly speciesOther: string | null;
  readonly lengthMm: number | null;
  readonly weightG: number | null;
  readonly disposition: "kept" | "released" | null;
}

/**
 * Returns the new catch's id, or null if nothing was written.
 *
 * Null is not an error the caller has to handle loudly: the game event is already durable
 * by the time this runs, and a failure here costs the angler a row in their own log, never
 * the fish in the game. The game is the thing that must not break.
 */
export async function logHostCatch(
  participant: GameParticipant,
  input: HostCatchInput,
): Promise<string | null> {
  if (!participant.is_host) return null;

  try {
    const result = await logCatch(
      currentLog(),
      {
        ...EMPTY_DRAFT,
        speciesId: input.speciesId,
        speciesOther: input.speciesOther,
        lengthMm: input.lengthMm,
        weightG: input.weightG,
        // `n/a` rather than a guess: the game asks kept-or-released, but if it somehow
        // arrives unset, inventing "released" would be a claim about a real fish in a
        // real log, and the log's job is to be true rather than complete.
        disposition: input.disposition ?? "n/a",
        outcome: "landed",
      },
      // No GPS. Asking for a fix mid-game would put a permission prompt between the
      // angler and the next fish; the catch flow attaches a position later if it can.
      null,
    );
    return result.catchId;
  } catch {
    return null;
  }
}
