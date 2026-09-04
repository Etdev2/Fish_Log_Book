import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { NewGame } from "@/features/games/components/new-game";
import { BOAT_GAMES_V1 } from "@/features/games/flag";

export const metadata: Metadata = { title: "Start a game | Fish Log Book" };

/**
 * `NewGame` reads the query string for the mode and for a draft to resume, and
 * `useSearchParams` requires a Suspense boundary above it or the route is forced dynamic
 * — which ADR 005 §5 forbids, because the static shell is what lets a cold load paint on
 * a boat with no signal.
 */
export default function NewGamePage() {
  if (!BOAT_GAMES_V1) notFound();
  return (
    <Suspense fallback={<p className="p-space-5 text-body text-text-muted">Loading…</p>}>
      <NewGame />
    </Suspense>
  );
}
