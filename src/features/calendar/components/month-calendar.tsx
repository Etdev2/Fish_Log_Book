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
        <div role="row" className="grid grid-cols-7 gap-0.5">
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
        {/*
          UI-1 #2: role="grid" needs row → gridcell children, so cells are chunked into week
          rows. gap-0.5 (not gap-1) keeps each day ≥ 48 px wide on a 390 px phone.
          UI-1 #10: out-of-month numbers use the full muted token (4.5:1), not muted/40.
          No min-width on the day buttons: seven equal grid tracks size them (~49 px at
          390 px, ≥ 48 px). A 48 px min-width would overflow each cell at 320 px (288 px
          grid vs 348 px needed) and overlap the next day's hit area; the calendar's
          documented 320 px exception allows the narrower cells there.
        */}
        {weeks(cells).map((week) => (
          <div key={week[0].key} role="row" className="grid grid-cols-7 gap-0.5 pb-0.5">
            {week.map((cell) => {
              const summary = summaries.get(cell.key);
              if (!cell.inCurrentMonth) {
                return (
                  <span key={cell.key} role="gridcell" className="flex min-w-0">
                    <span
                      aria-hidden="true"
                      className="flex min-h-touch-floor flex-1 flex-col items-center justify-center gap-1 rounded-md text-body font-normal text-text-muted select-none"
                    >
                      {cell.dayOfMonth}
                      {/* Same height as the dot row below in-month days, so every number sits on one line. */}
                      <span className="h-2" />
                    </span>
                  </span>
                );
              }
              return (
                <span key={cell.key} role="gridcell" className="flex min-w-0">
                  <button
                    type="button"
                    aria-label={ariaForKey(cell.key, summary)}
                    aria-current={cell.isToday ? "date" : undefined}
                    onClick={() => router.push(`/day/${cell.key}`)}
                    className={`flex min-h-touch-floor min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md border text-body font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none ${
                      cell.isToday
                        ? "border-signal-orange bg-signal-orange text-ink-on-orange"
                        : "border-transparent text-text-primary hover:border-border-interactive"
                    }`}
                  >
                    {cell.dayOfMonth}
                    <span className="flex h-2 items-center justify-center gap-1.5" aria-hidden="true">
                      {summary && summary.catches > 0 ? (
                        <span
                          className={`size-2 rounded-full ${cell.isToday ? "bg-ink-on-orange" : "bg-signal-orange"}`}
                        />
                      ) : null}
                      {summary && summary.needsDetails > 0 ? (
                        <span className="size-2 rounded-full bg-amber-flag" />
                      ) : null}
                    </span>
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/*
        Founder, 2026-10-16: the legend was one sentence of colour names. It is now the
        marks themselves, each beside one or two plain words, so it reads at a glance.
      */}
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-text-muted">
        <li className="flex items-center gap-2">
          <span aria-hidden className="flex size-6 items-center justify-center rounded-md bg-signal-orange text-caption font-semibold text-ink-on-orange">
            {cells.find((c) => c.isToday)?.dayOfMonth ?? "•"}
          </span>
          Today
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-3 rounded-full bg-signal-orange" />
          Fish caught
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-3 rounded-full bg-amber-flag" />
          Needs more info
        </li>
      </ul>
      <p className="text-caption text-text-muted">Tap a day to see it.</p>
      {!log.hydrated ? (
        <p className="text-caption text-text-muted">Opening your log…</p>
      ) : null}
    </div>
  );
}

/** Split the month's cells (always whole weeks) into rows of seven. */
function weeks<T>(cells: readonly T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
