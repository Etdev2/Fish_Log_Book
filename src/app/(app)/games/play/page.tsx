import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ScoreboardRoute } from "@/features/games/components/scoreboard";
import { BOAT_GAMES_V1 } from "@/features/games/flag";

export const metadata: Metadata = { title: "Game | Fish Log Book" };

/**
 * /games/play?id=… — the live scoreboard.
 *
 * The game id is a query parameter rather than a path segment on purpose. A dynamic
 * segment makes the route `ƒ`, and ADR 005 §5 is explicit that no product route may become
 * dynamic: a dynamic route cannot be prerendered, so opening it puts a network round trip
 * in front of the first paint. For most screens that is a slow load; for this one it is the
 * feature failing at the only moment it matters, because Boat Games' whole promise is that
 * a game runs in airplane mode. A game id is minted on the device and can never be listed
 * in `generateStaticParams`, so the query string is the only shape that stays static.
 */
export default function GamePlayPage() {
  if (!BOAT_GAMES_V1) notFound();
  return (
    <Suspense fallback={<p className="p-space-5 text-body text-text-muted">Opening the game…</p>}>
      <ScoreboardRoute />
    </Suspense>
  );
}
