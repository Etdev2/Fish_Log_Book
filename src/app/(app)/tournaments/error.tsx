"use client";

import Link from "next/link";

import { TOURNAMENT_CARD, TOURNAMENT_PRIMARY_BUTTON, TOURNAMENT_SECONDARY_BUTTON } from "@/features/tournaments/ui-classes";

export default function TournamentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-5 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-2">
        <h1 className="text-h1 text-text-primary">Tournaments</h1>
        <p className="text-body text-text-muted">This tournament page hit an unexpected error.</p>
      </header>

      <section className={`${TOURNAMENT_CARD} flex flex-col gap-space-3`} role="alert">
        <p className="text-body-strong text-error-red">The page could not finish loading.</p>
        <p className="text-caption text-text-muted">
          Your app is still available. Retry this page, or return to the calendar while the tournament data connection recovers.
        </p>
        <button type="button" className={TOURNAMENT_PRIMARY_BUTTON} onClick={reset}>
          Try again
        </button>
        <Link href="/" className={TOURNAMENT_SECONDARY_BUTTON}>
          Back to calendar
        </Link>
      </section>
    </div>
  );
}
