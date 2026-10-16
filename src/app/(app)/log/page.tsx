import type { Metadata } from "next";
import { Suspense } from "react";

import { FishLog } from "@/features/catches/components/fish-log";
import { GamesEntry } from "@/features/games/components/games-entry";
import { BOAT_GAMES_V1 } from "@/features/games/flag";

export const metadata: Metadata = { title: "Fish Log | Fish Log Book" };

/**
 * /log — the Fish Log home (spec §8).
 *
 * A thin route, per ADR 003 §2: the page wires, the feature thinks. The whole surface is
 * client-rendered because every read comes from the device's own database (ADR 004 §1)
 * and there is nothing for a server to render.
 *
 * Suspense wraps the log because the fish-log reads `?add=` (calendar backfill, founder
 * Historical §1) through useSearchParams — static prerendering has no URL to read.
 *
 * Boat Games hangs off this screen rather than the nav bar (see src/app/(app)/games/page.tsx
 * for the measurement that decided it). A RUNNING game renders above the log — the one thing
 * more urgent than the list of what you have already caught. The resting "Boat Games" card
 * renders below it (UI-1 #6), so "+ Log catch" is the first thing on the screen.
 */
export default function FishLogPage() {
  // Unit preference lives on `angler.unit_preference` and is not wired to a session yet;
  // imperial is the documented default (see the schema's `angler` table).
  return (
    <>
      {BOAT_GAMES_V1 ? (
        <div className="mb-4 empty:hidden">
          <GamesEntry placement="above-log" />
        </div>
      ) : null}
      <Suspense>
        <FishLog unitSystem="imperial" />
      </Suspense>
      {BOAT_GAMES_V1 ? (
        <div className="mt-4 empty:hidden">
          <GamesEntry placement="below-log" />
        </div>
      ) : null}
    </>
  );
}
