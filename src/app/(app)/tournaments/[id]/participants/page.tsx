import type { Metadata } from "next";

import { TournamentParticipants } from "@/features/tournaments/components/tournament-participants";

export const metadata: Metadata = { title: "Who's In | Fish Log Book" };

/**
 * The field. UX-001 §2 has had "participants" in the information architecture since the
 * contract was written; this is it.
 */
export default async function TournamentParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TournamentParticipants tournamentId={id} />;
}
