import type { Metadata } from "next";

import { RegistrationPage } from "@/features/tournaments/components/registration-page";

export const metadata: Metadata = {
  title: "Register | Fish Log Book",
  description: "Add your crew, choose your events and jackpots, and pay for all of it at once.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RegistrationPage tournamentId={id} />;
}
