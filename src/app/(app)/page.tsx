import type { Metadata } from "next";

export const metadata: Metadata = { title: "Calendar | Fish Log Book" };

/**
 * / — the month calendar. D23 is unambiguous that the calendar is the home surface: not a
 * dashboard, not a feed, not a landing page.
 *
 * The calendar itself is the next round's work (ADR 005 scope note: this round is the
 * design system and the shell, and nothing in features/* beyond shell/ should exist).
 */
export default function CalendarPage() {
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h1 className="text-h1">Calendar</h1>
      <p className="mt-3 text-body text-text-muted">
        The month grid lands next, with a record dot on days that have one and a flag on
        days that need a look.
      </p>
    </section>
  );
}
