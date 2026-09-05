import type { Metadata } from "next";

import { TournamentOperations } from "@/features/tournaments/components/tournament-operations";

export const metadata: Metadata = { title: "Tournament Leaderboard | Fish Log Book" };

export default async function TournamentLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TournamentOperations tournamentId={id} initialPanel="leaderboard" />;
}
