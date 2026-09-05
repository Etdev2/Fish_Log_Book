import type { Metadata } from "next";

import { TournamentRules } from "@/features/tournaments/components/tournament-rules";

export const metadata: Metadata = { title: "Tournament Rules | Fish Log Book" };

/**
 * The tab strip has linked here since the tournament section shipped, and there was no
 * page behind it — every angler who tapped "Rules" got a 404.
 */
export default async function TournamentRulesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TournamentRules tournamentId={id} />;
}
