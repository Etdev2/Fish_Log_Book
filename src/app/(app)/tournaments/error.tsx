"use client";

import Link from "next/link";

import { CARD_PADDED, PAGE, PRIMARY_BUTTON, SECONDARY_BUTTON } from "@/features/tournaments/ui-classes";

/**
 * The tournament section's last line of defence.
 *
 * It matters more here than on most routes: a tournament screen is opened on a boat, often
 * on one bar of signal, and the first thing the reader needs to know is that the rest of
 * their app — their log, their catches — is untouched by whatever just failed.
 */
export default function TournamentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-space-2">
        <h1 className="text-h1 text-text-primary">Tournaments</h1>
      </header>

      <section className={`${CARD_PADDED} flex flex-col gap-space-3`} role="alert">
        <p className="text-h3 text-error-red">This page stopped part-way</p>
        <p className="text-body text-text-primary">
          Nothing you have logged is affected. Your catches and your log are on this phone and are
          untouched by this.
        </p>
        <div className="flex flex-col gap-space-3 sm:flex-row">
          <button type="button" className={PRIMARY_BUTTON} onClick={reset}>
            Try again
          </button>
          <Link href="/" className={SECONDARY_BUTTON}>
            Back to the calendar
          </Link>
        </div>
      </section>
    </div>
  );
}
