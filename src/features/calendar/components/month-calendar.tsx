"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useLog } from "@/features/catches/store";
import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";
import { useNow } from "@/lib/time/use-now";
import {
  WEEKDAY_HEADERS,
  ariaForKey,
  currentMonthCursor,
  monthCells,
  monthLabel,
  shiftMonth,
  summarizeDays,
  type MonthCursor,
} from "../calendar-data";

/**
 * The month grid — D23's home surface (founder requirements §7).
 *
 * Rules kept from the design notes: the grid is the page, day cells are buttons, a day
 * with records shows the record dot, a day with things nobody has finished shows the
 * amber flag dot beside it. Out-of-month cells stay visible so the week rows never
 * reflow month to month, but they are inert — their days exist on their own months.
 *
 * The zone arrives a tick after mount (SSR can't know the angler's); the grid paints in
 * UTC first on every platform so server and first client render are byte-identical.
 */
export function MonthCalendar() {
  const router = useRouter();
  const log = useLog();
  const zone = useLocalTimeZone() ?? "UTC";
  const now = useNow();
  const nowMs = now === null ? 0 : Number(now);
  /* Navigation is the ONLY state: until the angler moves, the cursor is just the current
     month derived from the resolved zone + clock — no effect, no placeholder month that
     would need "correcting" a tick later. Once they move, their month stays theirs:
     zone resolution never yanks it back. */
  const [navigated, setNavigated] = useState<MonthCursor | null>(null);
  const cursor = navigated ?? (now !== null ? currentMonthCursor(zone, nowMs) : null);

  const cells = useMemo(() => (cursor ? monthCells(cursor, zone, nowMs) : null), [cursor, zone, nowMs]);
  const summaries = useMemo(() => summarizeDays(log.catches, zone), [log.catches, zone]);
  const viewingNow = useMemo(() => {
    if (!cursor) return true;
    const current = currentMonthCursor(zone, nowMs);
    return current.year === cursor.year && current.month === cursor.month;
  }, [cursor, zone, nowMs]);

  const NAV_BUTTON =
    "inline-flex min-h-touch-floor min-w-touch-floor items-center justify-center rounded-md border border-border-interactive text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none";

  if (cursor === null || cells === null) {
    return (
      <p className="rounded-lg border border-hairline bg-surface p-4 text-body text-text-muted">
        Opening the calendar…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          className={NAV_BUTTON}
          onClick={() => cursor && setNavigated(shiftMonth(cursor, -1))}
        >
          ‹
        </button>
        <h2 className="text-h1 text-text-primary" aria-live="polite">
          {monthLabel(cursor)}
        </h2>
        <div className="flex items-center gap-2">
          {!viewingNow ? (
            <button
              type="button"
              className={`${NAV_BUTTON} px-4`}
              onClick={() => setNavigated(currentMonthCursor(zone, nowMs))}
            >
              Today
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Next month"
            className={NAV_BUTTON}
            onClick={() => cursor && setNavigated(shiftMonth(cursor, 1))}
          >
            ›
          </button>
        </div>
      </div>

      <div role="grid" aria-label={`Days with records, ${monthLabel(cursor)}`}>
        <div role="row" className="grid grid-cols-7">
          {WEEKDAY_HEADERS.map((day) => (
            <span
              key={day}
              role="columnheader"
              className="pb-1 text-center text-caption text-text-muted"
            >
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const summary = summaries.get(cell.key);
            if (!cell.inCurrentMonth) {
              return (
                <span
                  key={cell.key}
                  aria-hidden="true"
                  className="flex min-h-touch-floor flex-col items-center justify-center rounded-md text-caption text-text-muted/40 select-none"
                >
                  {cell.dayOfMonth}
                </span>
              );
            }
            return (
              <button
                key={cell.key}
                type="button"
                aria-label={ariaForKey(cell.key, summary)}
                aria-current={cell.isToday ? "date" : undefined}
                onClick={() => router.push(`/day/${cell.key}`)}
                className={`flex min-h-touch-floor flex-col items-center justify-center gap-1 rounded-md border text-body font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none ${
                  cell.isToday
                    ? "border-signal-orange text-text-primary"
                    : "border-transparent text-text-primary hover:border-border-interactive"
                }`}
              >
                {cell.dayOfMonth}
                <span className="flex h-2 items-center justify-center gap-1.5" aria-hidden="true">
                  {summary && summary.catches > 0 ? (
                    <span className="size-2 rounded-full bg-signal-orange" />
                  ) : null}
                  {summary && summary.needsDetails > 0 ? (
                    <span className="size-2 rounded-full bg-amber-flag" />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-caption text-text-muted">
        Orange dot: catches that day. Amber dot: something still needs details. Tap a day
        to open it.
      </p>
      {!log.hydrated ? (
        <p className="text-caption text-text-muted">Opening your log…</p>
      ) : null}
    </div>
  );
}
