import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Calendar | Fish Log Book" };

/**
 * / — the month calendar. D23 is unambiguous that the calendar is the home surface: not a
 * dashboard, not a feed, not a landing page.
 *
 * The calendar itself is the next round's work (ADR 005 scope note: this round is the
 * design system and the shell, and nothing in features/* beyond shell/ should exist).
 *
 * The tide chart link carries over from the pre-shell homepage (see PR #4/#5) — it is
 * the only way in from the calendar until the month grid itself surfaces conditions.
 */
export default function CalendarPage() {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h1 className="text-h1">Calendar</h1>
      <p className="mt-3 text-body text-text-muted">
        The month grid lands next, with a record dot on days that have one and a flag on
        days that need a look.
      </p>

      <Link
        href="/tides"
        className="mt-4 inline-flex min-h-touch-floor items-center justify-center rounded-md border border-signal-orange bg-signal-orange px-6 py-3 text-label font-semibold text-ink-on-orange transition-colors hover:bg-signal-orange-pressed focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
      >
        Open tide chart
      </Link>
    </section>
  );
}
