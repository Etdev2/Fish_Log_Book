"use client";

import type { EventOption } from "@/core/tournaments/registration";

import { formatMoney } from "../event-card";
import { CARD, CARD_PADDED, FOCUS_RING, TABULAR } from "../ui-classes";

/**
 * What you are entering: events, and inside each one the jackpots you buy into.
 *
 * Jackpots are nested under their event and only appear once that event is ticked. Showing
 * every jackpot in the fleet in a flat list would let somebody buy into the tuna pot of an
 * event they are not fishing, and the total would be right while the entry was nonsense.
 *
 * **Each pot shows its own money and its own count** — ADR 010 §4. "Biggest Tuna · $4,200
 * in the pot · 34 in" is the line that decides whether a $100 buy-in is worth it, and an
 * event-level total cannot answer it. A pot with nothing in it says "new pot" rather than
 * "$0", because an empty pot at registration time is normal and "$0" reads as broken.
 */
export function EventSelection({
  events,
  selectedEventIds,
  selectedDivisionIds,
  onToggleEvent,
  onToggleDivision,
  unpricedEventIds,
  disabled,
}: {
  events: readonly EventOption[];
  selectedEventIds: readonly string[];
  selectedDivisionIds: readonly string[];
  onToggleEvent: (id: string) => void;
  onToggleDivision: (id: string) => void;
  unpricedEventIds: readonly string[];
  disabled: boolean;
}) {
  return (
    <section className="flex flex-col gap-space-3" aria-labelledby="entering-heading">
      <h2 id="entering-heading" className="text-h3 text-text-primary">
        What you are entering
      </h2>
      <p className="text-body text-text-muted">
        Tick every event you want. Jackpots are optional and are paid for in the same go.
      </p>

      <ul className="flex flex-col gap-space-3">
        {events.map((event) => {
          const chosen = selectedEventIds.includes(event.id);
          const unpriced = unpricedEventIds.includes(event.id);
          return (
            <li key={event.id} className={`${CARD} flex flex-col`}>
              <label
                className={`flex cursor-pointer items-start gap-space-3 p-space-4 ${FOCUS_RING}`}
              >
                <input
                  type="checkbox"
                  checked={chosen}
                  disabled={disabled}
                  onChange={() => onToggleEvent(event.id)}
                  className="mt-space-1 size-space-5 shrink-0 accent-signal-orange"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-body-strong text-text-primary">{event.name}</span>
                  <span className={`block text-caption text-text-muted ${TABULAR}`}>
                    {event.entryFeeMinor === null
                      ? "Entry fee not set by the host yet"
                      : event.entryFeeMinor === 0
                        ? "Free to enter"
                        : `${formatMoney(event.entryFeeMinor, event.currency)} entry`}
                  </span>
                </span>
              </label>

              {chosen && unpriced ? (
                <p className="px-space-4 pb-space-4 text-caption text-amber-flag">
                  The host has not priced this event. You can enter it, and there is nothing to
                  pay here — they will confirm the fee with you.
                </p>
              ) : null}

              {chosen && event.divisions.length > 0 ? (
                <div className="flex flex-col gap-space-2 border-t border-hairline p-space-4">
                  <h3 className="text-caption text-text-muted">Jackpots &amp; divisions</h3>
                  <ul className="flex flex-col gap-space-2">
                    {event.divisions.map((division) => {
                      const included = division.entryFeeMinor === null;
                      const pot = formatMoney(division.poolMinor, event.currency);
                      return (
                        <li key={division.id}>
                          <label
                            className={`${CARD_PADDED} flex cursor-pointer items-start gap-space-3 ${FOCUS_RING}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDivisionIds.includes(division.id)}
                              disabled={disabled}
                              onChange={() => onToggleDivision(division.id)}
                              className="mt-space-1 size-space-5 shrink-0 accent-signal-orange"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline justify-between gap-space-2">
                                <span className="text-body text-text-primary">{division.name}</span>
                                <span className={`text-body text-text-primary ${TABULAR}`}>
                                  {included
                                    ? "Included"
                                    : formatMoney(division.entryFeeMinor, event.currency)}
                                </span>
                              </span>
                              {division.description ? (
                                <span className="block text-caption text-text-muted">
                                  {division.description}
                                </span>
                              ) : null}
                              {/* The pot and the field size, at the moment of the decision. */}
                              {!included ? (
                                <span className={`block text-caption text-text-muted ${TABULAR}`}>
                                  {division.poolMinor === null || division.poolMinor === 0
                                    ? "New pot"
                                    : `${pot} in the pot`}
                                  {division.participantCount !== null
                                    ? ` · ${division.participantCount} in`
                                    : ""}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
