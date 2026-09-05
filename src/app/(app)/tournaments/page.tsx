import type { Metadata } from "next";

import { TournamentHub } from "@/features/tournaments/components/tournament-hub";

export const metadata: Metadata = { title: "Tournaments | Fish Log Book" };

export default function TournamentsPage() {
  return <TournamentHub />;
}
