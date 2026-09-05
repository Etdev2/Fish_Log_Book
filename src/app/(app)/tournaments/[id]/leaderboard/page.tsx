import type { Metadata } from "next";

import { TournamentLeaderboard } from "@/features/tournaments/components/tournament-leaderboard";

export const metadata: Metadata = { title: "Tournament Standings | Fish Log Book" };

/**
 * Standings are their own screen now. They used to be a tab inside "Tournament operations",
 * which put the one screen every competitor wants behind the one screen only the organizer
 * should be reading.
 */
export default async function TournamentLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TournamentLeaderboard tournamentId={id} />;
}
