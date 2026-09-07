import type { Metadata } from "next";

import { EventsPage } from "@/features/tournaments/components/events-page";

export const metadata: Metadata = {
  title: "Event calendar | Fish Log Book",
  description: "Upcoming fishing tournaments, in a calendar and a list.",
};

export default function TournamentsPage() {
  return <EventsPage />;
}
