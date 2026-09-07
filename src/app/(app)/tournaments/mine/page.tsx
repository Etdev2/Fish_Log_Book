import type { Metadata } from "next";

import { MyTournaments } from "@/features/tournaments/components/my-tournaments";

export const metadata: Metadata = {
  title: "My tournaments | Fish Log Book",
  description: "The events you have entered and the events you host.",
};

export default function MyTournamentsPage() {
  return <MyTournaments />;
}
