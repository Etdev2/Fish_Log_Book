import type { Metadata } from "next";

import { TournamentRegistration } from "@/features/tournaments/components/tournament-registration";

export const metadata: Metadata = { title: "Tournament Registration | Fish Log Book" };

export default async function TournamentRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TournamentRegistration tournamentId={id} />;
}
