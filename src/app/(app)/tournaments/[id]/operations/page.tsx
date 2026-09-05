import type { Metadata } from "next";

import { TournamentOperations } from "@/features/tournaments/components/tournament-operations";

export const metadata: Metadata = { title: "Tournament Operations | Fish Log Book" };

export default async function TournamentOperationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TournamentOperations tournamentId={id} />;
}
