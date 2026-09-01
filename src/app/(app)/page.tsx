import type { Metadata } from "next";
import Link from "next/link";

import { MonthCalendar } from "@/features/calendar/components/month-calendar";

export const metadata: Metadata = { title: "Calendar | Fish Log Book" };

/**
 * / — the month calendar. D23 is unambiguous that the calendar is the home surface: not a
 * dashboard, not a feed, not a landing page (founder requirements 2026-09-01 §7 makes it
 * the third leg of Calendar → Day → Catch navigation).
 *
 * Dots are the day's truth: orange for catches, amber for anything still needing
 * details. The tide chart link carries over from the shell round (PR #4/#5); the Tide
 * tab reaches it too, and this stays as the direct shortcut until the grid itself
 * surfaces conditions inline.
 */
export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4">
      <MonthCalendar />
      <Link
        href="/tides"
        className="inline-flex min-h-touch-floor items-center justify-center self-start rounded-md border border-border-interactive px-4 text-label text-text-link transition-colors hover:border-tide-cyan focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
      >
        Open tide chart
      </Link>
    </div>
  );
}
