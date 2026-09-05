import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GamesHome } from "@/features/games/components/games-home";
import { BOAT_GAMES_V1 } from "@/features/games/flag";

export const metadata: Metadata = { title: "Boat Games | Fish Log Book" };

/**
 * /games — Boat Games home.
 *
 * Reached from the Log screen, not from the nav bar. `shell-nav.tsx` records the measured
 * widths behind that: six labels already wrap to two rows below 384px, and a seventh puts
 * every phone on two rows. `shell-nav.test.ts` pins the count so adding one stays a
 * decision rather than a patch.
 */
export default function GamesPage() {
  if (!BOAT_GAMES_V1) notFound();
  return <GamesHome />;
}
