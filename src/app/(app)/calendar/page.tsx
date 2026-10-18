import type { Metadata } from "next";
import Link from "next/link";

import { MonthCalendar } from "@/features/calendar/components/month-calendar";

export const metadata: Metadata = { title: "Calendar | Fish Log Book" };

/**
 * /calendar — the month grid, every day you fished.
 *
 * Until 2026-10-16 this was "/" (D23: "the calendar is the home surface"). The founder
 * reversed that on the phone: "remove the calendar off the front page and redesign the
 * front page … very engaging." Home now leads with today (tide, your week, your next
 * badge); its week strip opens this page, and Calendar stays in the Menu.
 */
export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* UI-1 #11: one h1 per screen; the visible month name stays the h2. */}
      <h1 className="sr-only">Calendar</h1>
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
