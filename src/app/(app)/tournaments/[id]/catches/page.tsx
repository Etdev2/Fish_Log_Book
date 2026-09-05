import type { Metadata } from "next";

import { TournamentLiveCatches } from "@/features/tournaments/components/tournament-live-catches";

export const metadata: Metadata = { title: "Live Tournament Catches | Fish Log Book" };

export default async function TournamentCatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TournamentLiveCatches tournamentId={id} />;
}
