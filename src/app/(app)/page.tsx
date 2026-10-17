import type { Metadata } from "next";

import { MonthCalendar } from "@/features/calendar/components/month-calendar";
import { TideNowCard } from "@/features/conditions/components/tide-now-card";
import { PassportHomeCard } from "@/features/passport/components/passport-home-card";
import { PASSPORT_V1 } from "@/features/passport/flag";
import { SetupBanner } from "@/features/setup/components/setup-banner";

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
      {/* UI-1 #11: one h1 per screen; the visible month name stays the h2. */}
      <h1 className="sr-only">Calendar</h1>
      {/*
        An invitation to setup, not setup itself. The six-step guide used to render here in
        full; it now lives at /onboarding, because the home surface is the calendar (D23)
        and a tutorial that pushes the month grid down the page is not a calendar. This
        banner disappears entirely once setup is finished — see `setup-banner.tsx`.
      */}
      <SetupBanner />
      {/*
        The tide first, as one sentence, because it is what an angler opens the app to
        check. It replaces the old "Open tide chart" button: the card is that link.
      */}
      <TideNowCard />
      <MonthCalendar />
      {/*
        Below the calendar and the tide link on purpose: the calendar is the home surface
        (D23) and the passport is the thing you read after the fishing, not before it.
        This is also the honest test of whether it earns a nav slot later (spec §8.1).
      */}
      {PASSPORT_V1 ? <PassportHomeCard /> : null}
    </div>
  );
}
