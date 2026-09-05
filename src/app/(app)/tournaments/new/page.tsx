import type { Metadata } from "next";
import Link from "next/link";

import { CreateTournamentForm } from "@/features/tournaments/components/create-tournament-form";

export const metadata: Metadata = { title: "Create Tournament | Fish Log Book" };

export default function NewTournamentPage() {
  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-5 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-2">
        <Link href="/tournaments" className="text-caption text-text-link">← Tournaments</Link>
        <h1 className="text-h1 text-text-primary">Create tournament</h1>
        <p className="text-body text-text-muted">
          Start simple for friends or use the same tournament engine for an organization event.
        </p>
      </header>
      <CreateTournamentForm />
    </div>
  );
}
