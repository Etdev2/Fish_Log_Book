import type { Metadata } from "next";
import Link from "next/link";

import { CreateTournamentForm } from "@/features/tournaments/components/create-tournament-form";

export const metadata: Metadata = { title: "Create Tournament | Fish Log Book" };

export default function NewTournamentPage() {
  return (
    <div className="mx-auto flex w-full max-w-reading flex-col gap-space-6">
      <header className="flex flex-col gap-space-2">
        <Link href="/tournaments" className="min-h-touch-floor text-caption text-text-link">
          ← Tournaments
        </Link>
        <h1 className="text-h1 text-text-primary">Create a tournament</h1>
        <p className="text-body text-text-muted">
          Three questions. The rest waits until you need it.
        </p>
      </header>
      <CreateTournamentForm />
    </div>
  );
}
