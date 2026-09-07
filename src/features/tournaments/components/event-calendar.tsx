"use client";

import { useMemo, useState } from "react";

import {
  WEEKDAY_HEADERS,
  currentMonthCursor,
  monthCells,
  monthLabel,
  shiftMonth,
  spokenDate,
  type MonthCursor,
} from "@/core/time/month-grid";

import { eventsByDay, type TournamentEvent } from "../event-card";
import { FOCUS_RING } from "../ui-classes";
import { EventCardRow } from "./event-card-row";

/**
 * The season, as a month grid.
 *
 * A list answers "what is next". A calendar answers a different question that a list is
 * bad at: **when is my next free Saturday, and is anything on it?** Tournament fishing is
 * planned against the rest of a life, so the grid earns its place beside the list rather
 * than replacing it.
 *
 * Grid arithmetic comes from `@/core/time/month-grid`, the same code the fishing calendar
 * draws its month from — so a September here lines up cell for cell with a September
 * there, DST edges included. That module moved down out of the calendar feature precisely
 * to be shared; see ADR 005 §3.
 *
 * Selecting a day is local state and nothing more. The fishing calendar navigates to a day
 * page because a day of fishing is a real record with its own URL; a day of the tournament
 * season is just a filter over events that already have pages of their own, and giving it
 * a route would create a screen with nothing on it eleven months of the year.
 */
export function EventCalendar({
  events,
  timeZone,
  nowMs,
}: {
  events: readonly TournamentEvent[];
  timeZone: string;
  nowMs: number;
}) {
  /* Navigation is the only state. Until the angler moves, the cursor is derived from the
     resolved zone and clock — no effect, no placeholder month to correct a tick later. */
  const [navigated, setNavigated] = useState<MonthCursor | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const cursor = navigated ?? (nowMs > 0 ? currentMonthCursor(timeZone, nowMs) : null);
  const cells = useMemo(
    () => (cursor ? monthCells(cursor, timeZone, nowMs) : null),
    [cursor, timeZone, nowMs],
  );
  const byDay = useMemo(() => eventsByDay(events, timeZone), [events, timeZone]);

  const undated = useMemo(
    () => events.filter((event) => event.starts_at === null || Number.isNaN(Date.parse(event.starts_at))),
    [events],
  );

  if (cursor === null || cells === null) {
    return <p className="text-body text-text-muted">Opening the calendar…</p>;
  }

  const viewingNow = (() => {
    const current = currentMonthCursor(timeZone, nowMs);
    return current.year === cursor.year && current.month === cursor.month;
  })();

  const selected = selectedDay === null ? null : (byDay.get(selectedDay) ?? []);

  const NAV_BUTTON = `inline-flex min-h-touch-floor min-w-touch-floor items-center justify-center rounded-md border border-border-interactive text-label text-text-link ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

  return (
    <div className="flex flex-col gap-space-4">
      <div className="flex items-center justify-between gap-space-2">
        <button
          type="button"
          aria-label="Previous month"
          className={NAV_BUTTON}
          onClick={() => {
            setNavigated(shiftMonth(cursor, -1));
            setSelectedDay(null);
          }}
        >
          ‹
        </button>
        <h2 className="text-h3 text-text-primary" aria-live="polite">
          {monthLabel(cursor)}
        </h2>
        <div className="flex items-center gap-space-2">
          {!viewingNow ? (
            <button
              type="button"
              className={`${NAV_BUTTON} px-space-3`}
              onClick={() => {
                setNavigated(null);
                setSelectedDay(null);
              }}
            >
              Today
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Next month"
            className={NAV_BUTTON}
            onClick={() => {
              setNavigated(shiftMonth(cursor, 1));
              setSelectedDay(null);
            }}
          >
            ›
          </button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-space-1 pb-space-2">
          {WEEKDAY_HEADERS.map((day) => (
            <div key={day} className="text-center text-caption text-text-muted">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-space-1">
          {cells.map((cell) => {
            const dayEvents = byDay.get(cell.key) ?? [];
            const isSelected = cell.key === selectedDay;
            /* Out-of-month cells keep the week rows from reflowing, and an event that
               falls in one is still real — a 31 August event is not hidden because you
               are looking at September. */
            return (
              <button
                key={cell.key}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${spokenDate(cell.key)} — ${
                  dayEvents.length === 0
                    ? "no events"
                    : `${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}`
                }`}
                disabled={dayEvents.length === 0}
                onClick={() => setSelectedDay(isSelected ? null : cell.key)}
                className={`flex min-h-touch-nav-day flex-col items-center justify-center gap-space-1 rounded-md border text-label ${FOCUS_RING} disabled:cursor-default ${
                  isSelected
                    ? "border-signal-orange bg-surface-raised text-text-primary"
                    : cell.isToday
                      ? "border-tide-cyan text-text-primary"
                      : "border-transparent"
                } ${cell.inCurrentMonth ? "text-text-primary" : "text-text-muted"} ${
                  dayEvents.length > 0 ? "bg-surface" : ""
                }`}
              >
                <span>{cell.dayOfMonth}</span>
                {/* A dot per event, capped at three. Colour is never the only signal —
                    the cell is also tappable and reads its count aloud. */}
                <span className="flex h-space-2 items-center justify-center gap-space-1" aria-hidden="true">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className={`size-space-1 rounded-full ${
                        event.entered || event.hosting ? "bg-success-green" : "bg-signal-orange"
                      }`}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-caption text-text-muted">
        Orange dot: an event that day. Green dot: one you are in or host. Tap a day to see it.
      </p>

      {selected !== null ? (
        <section className="flex flex-col gap-space-3" aria-live="polite">
          <h3 className="text-h3 text-text-primary">{spokenDate(selectedDay!)}</h3>
          {selected.map((event) => (
            <EventCardRow key={event.id} event={event} nowMs={nowMs} />
          ))}
        </section>
      ) : null}

      {/*
        An event with no date cannot be on a grid, and silently dropping it would make the
        calendar disagree with the list about how many events exist. Naming it here is the
        honest fix, and it doubles as the nudge a host needs to go and schedule the thing.
      */}
      {undated.length > 0 ? (
        <p className="text-caption text-text-muted">
          {undated.length} {undated.length === 1 ? "event has" : "events have"} no date yet, so
          {undated.length === 1 ? " it is" : " they are"} only in the list.
        </p>
      ) : null}
    </div>
  );
}
