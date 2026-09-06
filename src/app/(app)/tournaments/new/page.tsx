import type { Metadata } from "next";

import { BackLink } from "@/components/back-link";
import { CreateTournamentForm } from "@/features/tournaments/components/create-tournament-form";

export const metadata: Metadata = { title: "Create Tournament | Fish Log Book" };

export default function NewTournamentPage() {
  return (
    <div className="mx-auto flex w-full max-w-reading flex-col gap-space-6">
      <header className="flex flex-col gap-space-2">
        <BackLink href="/tournaments" label="Tournaments" />
        <h1 className="text-h1 text-text-primary">Create a tournament</h1>
        <p className="text-body text-text-muted">
          Three questions. The rest waits until you need it.
        </p>
      </header>
      <CreateTournamentForm />
    </div>
  );
}
