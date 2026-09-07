"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useLocalTimeZone } from "@/features/conditions/use-local-time-zone";

import { matchesFilter, sortForReading, type EventFilter } from "../event-card";
import { useEvents } from "../queries/use-events";
import { useNow } from "../use-now";
import { CARD_PADDED, CHIP, CHIP_OFF, CHIP_ON, PAGE, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../ui-classes";
import { DemoNote, EmptyState, ErrorScreen, LoadingScreen } from "./tournament-chrome";
import { EventCalendar } from "./event-calendar";
import { EventCardRow } from "./event-card-row";

/**
 * /tournaments — the event calendar. Every event, in the two shapes people look for them.
 *
 * What this replaces, and why. The old hub sorted events into three fixed sections —
 * "Compete now", "Your events", "Find a tournament" — with a four-step explainer above
 * them. It was a diagram of the product rather than a view of the season: an angler could
 * not tell where an event was, what it paid, or how long they had to enter without opening
 * each one, and the same event moved between sections as its status changed, so nothing
 * stayed where you last saw it.
 *
 * The redesign is one list of events with two views over it and three filters, and every
 * card carries the three facts you decide from. Sections become filters, which are a
 * control you operate rather than a structure you have to learn.
 *
 * **Both views, not one.** A list answers "what is next"; a calendar answers "is anything
 * on the weekend I am free". They are different questions and the founder asked for both.
 * The choice is remembered for the session only — it is a way of looking, not a setting,
 * and burying it in Settings would be the wrong weight for a two-tap toggle.
 */
type View = "list" | "calendar";

const FILTERS: readonly { readonly id: EventFilter; readonly label: string }[] = [
  { id: "all", label: "All events" },
  { id: "open", label: "Open to enter" },
  { id: "mine", label: "Mine" },
];

export function EventsPage() {
  const { load, retry } = useEvents();
  const now = useNow();
  const zone = useLocalTimeZone() ?? "UTC";
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState<EventFilter>("all");

  const nowMs = now === null ? 0 : Number(now);

  /* The unwrap happens inside the memo rather than above it: `load.state === "ready" ? … : []`
     mints a fresh empty array on every render, which would make this memo recompute forever. */
  const visible = useMemo(() => {
    const events = load.state === "ready" ? load.events : [];
    return sortForReading(events.filter((event) => matchesFilter(event, filter, nowMs)));
  }, [load, filter, nowMs]);

  if (load.state === "loading") return <LoadingScreen label="Loading events" />;
  if (load.state === "error") {
    return (
      <ErrorScreen
        title="Events did not load"
        message={`${load.message} Everything else in the app still works — this is the tournament connection only.`}
        onRetry={retry}
      />
    );
  }

  return (
    <div className={PAGE}>
      {/*
        Deliberately short. An earlier draft opened with an eyebrow label, a three-line
        subtitle and two stacked buttons, which put roughly 500px of chrome above the first
        event on a 390px phone — you scrolled past the explanation of the screen to reach
        the screen. The heading names it, one line says what a card carries, and the two
        actions share a row.
      */}
      <header className="flex flex-col gap-space-3">
        <h1 className="text-h1 text-text-primary">Event calendar</h1>
        <p className="text-body text-text-muted">
          Where it is, what the pot is at, and how long you have to enter.
        </p>
        <div className="flex flex-wrap gap-space-2">
          <Link href="/tournaments/mine" className={`${SECONDARY_BUTTON} flex-1`}>
            My tournaments
          </Link>
          {/* No plus icon here: with one, the label wrapped to "Host an / event" inside a
              half-width button at 390px, and a two-line button reads as a mistake. */}
          <Link href="/tournaments/new" className={`${PRIMARY_BUTTON} flex-1`}>
            Host an event
          </Link>
        </div>
      </header>

      {/*
        Two rows of controls, in the order they are decided: how you want to look at the
        season, then which slice of it. Both are chips at full touch height — this screen
        is opened at a dock as often as at a desk.
      */}
      <div className="flex flex-col gap-space-3">
        <div className="flex gap-space-2" role="group" aria-label="View">
          {(["list", "calendar"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={`${CHIP} flex-1 ${view === option ? CHIP_ON : CHIP_OFF}`}
            >
              {option === "list" ? "List" : "Calendar"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-space-2" role="group" aria-label="Filter events">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={`${CHIP} ${filter === option.id ? CHIP_ON : CHIP_OFF}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={emptyTitle(filter)}
          body={emptyBody(filter)}
          action={
            filter === "all" ? (
              <Link href="/tournaments/new" className={PRIMARY_BUTTON}>
                Host an event
              </Link>
            ) : (
              <button type="button" onClick={() => setFilter("all")} className={SECONDARY_BUTTON}>
                Show all events
              </button>
            )
          }
        />
      ) : view === "calendar" ? (
        <div className={CARD_PADDED}>
          <EventCalendar events={visible} timeZone={zone} nowMs={nowMs} />
        </div>
      ) : (
        <ul className="flex flex-col gap-space-3">
          {visible.map((event) => (
            <li key={event.id}>
              <EventCardRow event={event} nowMs={nowMs} />
            </li>
          ))}
        </ul>
      )}

      {load.demo ? <DemoNote /> : null}
    </div>
  );
}

/* An empty screen has to say which emptiness it is: no events at all is a different
   problem from a filter that excluded them all, and one of those the angler can undo. */
function emptyTitle(filter: EventFilter): string {
  if (filter === "mine") return "You are not in any events yet";
  if (filter === "open") return "Nothing is open for entries right now";
  return "No events yet";
}

function emptyBody(filter: EventFilter): string {
  if (filter === "mine") {
    return "Events you enter or host will collect here. Browse all events to find one to enter.";
  }
  if (filter === "open") {
    return "Every event is either finished or not taking entries yet. Check back, or look at all events to see what is coming.";
  }
  return "Host one and it will appear here, on the calendar and in the list.";
}
