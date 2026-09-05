import type { Metadata } from "next";

import { TournamentOverview } from "@/features/tournaments/components/tournament-overview";

export const metadata: Metadata = { title: "Tournament Overview | Fish Log Book" };

export default async function TournamentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TournamentOverview tournamentId={id} />;
}
