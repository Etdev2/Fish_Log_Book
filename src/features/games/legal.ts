"use client";

import { speciesById } from "@/core/ontology/species";
import type { EventLegalSnapshot } from "@/core/rules/games/types";
import { snapshotForNewCatch } from "@/features/fish-legal/regulation-snapshot";

/**
 * What Fish Legal said about this fish, frozen onto the game event (ADR 009 §4).
 *
 * Reuses the same `snapshotForNewCatch` the catch flow uses, so a game and a log entry
 * cannot disagree about the law. Frozen rather than looked up at render time for the
 * reason the catch log already froze it: a pack update next season must not rewrite a
 * finished game.
 *
 * A null return means no verified pack covers the region. That is *unknown*, not
 * *prohibited* — the fold scores it normally. `protected_species` still travels, because
 * it comes from the ontology and holds everywhere regardless of which packs have shipped.
 */
export function legalForGameCatch(
  speciesId: string | null,
  localDate: string,
): EventLegalSnapshot | null {
  if (speciesId === null) return null;
  const isProtected = speciesById(speciesId)?.takeStatus === "protected";
  const snapshot = snapshotForNewCatch(speciesId, localDate);
  if (!snapshot) {
    // No pack, but a protected species is still protected. Carry that much.
    return isProtected
      ? {
          verdict: "release",
          reason: "Protected species.",
          pack_id: "none",
          pack_version: 0,
          protected_species: true,
        }
      : null;
  }
  return {
    verdict: snapshot.verdict,
    reason: snapshot.verdict_reason,
    pack_id: snapshot.pack_id,
    pack_version: snapshot.pack_version,
    protected_species: isProtected,
  };
}

/** The warning to show while a fish is being entered, if there is one worth showing. */
export function legalWarning(legal: EventLegalSnapshot | null): string | null {
  if (legal === null) return null;
  if (legal.protected_species) return "Protected species — this one has to go back, and it scores nothing.";
  if (legal.verdict === "release") return `${legal.reason} Release it and it still scores in full.`;
  if (legal.verdict === "conditional") return legal.reason;
  return null;
}
