import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GameResultsRoute } from "@/features/games/components/game-results";
import { BOAT_GAMES_V1 } from "@/features/games/flag";

export const metadata: Metadata = { title: "Result | Fish Log Book" };

/** Query parameter rather than a path segment, for the reason in `../play/page.tsx`. */
export default function GameResultPage() {
  if (!BOAT_GAMES_V1) notFound();
  return (
    <Suspense fallback={<p className="p-space-5 text-body text-text-muted">Reading the scorecard…</p>}>
      <GameResultsRoute />
    </Suspense>
  );
}
