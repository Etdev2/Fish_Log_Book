"use client";

import Link from "next/link";

import {
  closesInLabel,
  entryFeeLabel,
  formatMoney,
  registrationState,
  type TournamentEvent,
} from "../event-card";
import { formatSchedule, statusLabel, statusTone, TONE_CLASSES } from "../format";
import { CARD, FOCUS_RING, TABULAR } from "../ui-classes";
import { ClockIcon } from "./icons";

/**
 * One event, as a card you can decide from.
 *
 * The three facts the founder asked for are the three that get their own row at the
 * bottom: **where**, **what the pot is at**, and **how long you have**. They are laid out
 * as labelled numbers rather than a sentence, because this card is read in a scroll of a
 * dozen like it and a paragraph makes comparing two events impossible.
 *
 * The whole card is one link. A card with a "Details" button in the corner asks an angler
 * to hit a 44px target when the 320px card underneath it means exactly the same thing.
 *
 * What is deliberately NOT here: a "Register" button. Registering is a form with anglers,
 * a captain and money in it — offering it from a list row would promise a one-tap action
 * that is nothing of the kind. The card gets you to the event; the event asks you in.
 */
export function EventCardRow({ event, nowMs }: { event: TournamentEvent; nowMs: number }) {
  const registration = registrationState(event, nowMs);
  const tone = TONE_CLASSES[statusTone(event.status)];
  const pot = formatMoney(event.prize_pool_minor, event.currency);
  const fee = entryFeeLabel(event);

  return (
    <Link
      href={`/tournaments/${event.id}/overview`}
      className={`${CARD} ${FOCUS_RING} flex flex-col gap-space-3 p-space-4 transition-colors hover:border-border-interactive hover:bg-surface-raised active:scale-[0.99] motion-reduce:transition-none`}
    >
      <div className="flex items-start justify-between gap-space-3">
        <div className="min-w-0">
          <h3 className="text-h3 text-text-primary">{event.name}</h3>
          <p className="mt-space-1 text-caption text-text-muted">
            {formatSchedule(event.starts_at, event.ends_at)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-space-3 py-space-1 text-caption ${tone.pill} ${tone.text}`}>
          {statusLabel(event.status)}
        </span>
      </div>

      {/* Your own relationship to the event outranks its details — you scan for these. */}
      {event.entered || event.hosting ? (
        <div className="flex flex-wrap gap-space-2">
          {event.entered ? (
            <span className="rounded-full border border-success-green px-space-3 py-space-1 text-caption text-success-green">
              You are entered
            </span>
          ) : null}
          {event.hosting ? (
            <span className="rounded-full border border-signal-orange px-space-3 py-space-1 text-caption text-signal-orange">
              You host this
            </span>
          ) : null}
        </div>
      ) : null}

      <dl className="flex flex-wrap gap-x-space-6 gap-y-space-2">
        <div className="min-w-0">
          <dt className="text-caption text-text-muted">Where</dt>
          <dd className="text-body text-text-primary">{event.location_name ?? "Not announced"}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-muted">Prize pool</dt>
          {/*
            A pot nobody has paid into is "$0", and that is a fact worth printing. A pot we
            simply do not know is "—". Printing $0 for an unknown would be a lie about money.
          */}
          <dd className={`text-body text-text-primary ${TABULAR}`}>{pot ?? "—"}</dd>
        </div>
        {fee ? (
          <div>
            <dt className="text-caption text-text-muted">Entry</dt>
            {/* Mono for money, proportional for "Free to enter" — tabular figures line
                numbers up in a column, and set words in a typewriter. */}
            <dd
              className={`text-body text-text-primary ${event.entry_fee_minor === 0 ? "" : TABULAR}`}
            >
              {fee}
            </dd>
          </div>
        ) : null}
        {event.entrant_count !== null ? (
          <div>
            <dt className="text-caption text-text-muted">Entered</dt>
            <dd className={`text-body text-text-primary ${TABULAR}`}>{event.entrant_count}</dd>
          </div>
        ) : null}
      </dl>

      <RegistrationLine registration={registration} />
    </Link>
  );
}

/**
 * The deadline line, in the four states a deadline actually has.
 *
 * The urgent state is orange AND says the number of hours — colour is never the only
 * signal (06-accessibility-baseline), and "closes in 6 hours" is the thing that makes
 * somebody act anyway.
 */
function RegistrationLine({
  registration,
}: {
  registration: ReturnType<typeof registrationState>;
}) {
  if (registration.kind === "not-open") {
    return <p className="text-caption text-text-muted">Not open for entries yet</p>;
  }
  if (registration.kind === "closed") {
    return <p className="text-caption text-text-muted">Entries closed</p>;
  }
  if (registration.kind === "open-no-deadline") {
    return <p className="text-caption text-success-green">Entries open</p>;
  }
  return (
    <p
      className={`flex items-center gap-space-2 text-caption ${
        registration.urgent ? "text-signal-orange" : "text-success-green"
      }`}
    >
      <ClockIcon size="h-space-4 w-space-4" className="shrink-0" />
      Entries open — {closesInLabel(registration.closesInMs)}
    </p>
  );
}
