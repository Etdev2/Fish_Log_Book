import { localDateKey } from "@/core/time/month-grid";

import { tournamentPhase } from "./format";

/**
 * One event, as the calendar and the list both need it — and the rules for reading it.
 *
 * The founder's brief for this screen was three facts: **where it is, what the pot is at,
 * and how long you have left to enter.** Everything here exists to answer one of those
 * without the angler opening the event first. The old hub showed a name, a status word
 * and a date range, which told you an event existed and nothing about whether you wanted
 * it.
 *
 * Pure — no React, no clock, no storage. `nowMs` is always a parameter, so the same
 * inputs always produce the same screen and the tests can stand at any moment in time.
 */

export interface TournamentEvent {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly visibility: string;
  readonly starts_at: string | null;
  readonly ends_at: string | null;
  /** Where it is fished, as a person would say it. Null when the host has not said. */
  readonly location_name: string | null;
  readonly registration_closes_at: string | null;
  /** Base entry cost in minor units. Null when the host has not priced it. */
  readonly entry_fee_minor: number | null;
  /** What the pot holds right now, in minor units — paid entries only. */
  readonly prize_pool_minor: number | null;
  readonly currency: string;
  readonly entrant_count: number | null;
  /** Whether the viewer is entered in this one. Drives "My tournaments" and the badges. */
  readonly entered: boolean;
  /** Whether the viewer hosts it. Drives the host-admin door. */
  readonly hosting: boolean;
}

/**
 * How much time is left to enter, and whether that is still a live question.
 *
 * `closed` and `not-open` are different states and the copy must not merge them: "entries
 * closed" on an event that has not opened yet reads as "you missed it", which is the one
 * thing it does not mean.
 */
export type RegistrationState =
  | { readonly kind: "open"; readonly closesInMs: number; readonly urgent: boolean }
  | { readonly kind: "open-no-deadline" }
  | { readonly kind: "closed" }
  | { readonly kind: "not-open" };

/** Under a day left is urgent: it changes what an angler does with their evening. */
const URGENT_MS = 24 * 60 * 60 * 1000;

export function registrationState(event: TournamentEvent, nowMs: number): RegistrationState {
  if (event.status === "DRAFT") return { kind: "not-open" };
  if (event.status !== "REGISTRATION_OPEN") return { kind: "closed" };
  if (event.registration_closes_at === null) return { kind: "open-no-deadline" };

  const closesAt = Date.parse(event.registration_closes_at);
  // An unparseable deadline is not a closed door. Say the entries are open and let the
  // event page carry the detail, rather than locking somebody out over a bad string.
  if (Number.isNaN(closesAt)) return { kind: "open-no-deadline" };

  const remaining = closesAt - nowMs;
  if (remaining <= 0) return { kind: "closed" };
  return { kind: "open", closesInMs: remaining, urgent: remaining <= URGENT_MS };
}

/** Money for reading, not for accounting: "$1,250" and "$0" rather than "$1250.00". */
export function formatMoney(minor: number | null, currency: string): string | null {
  if (minor === null || !Number.isFinite(minor)) return null;
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      // Whole dollars unless the cents are real. A $250 entry fee should not read "$250.00"
      // on a card that is already dense with numbers.
      minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    // An unknown currency code must not blank the pot out. Say the number.
    return `${major.toFixed(Number.isInteger(major) ? 0 : 2)} ${currency}`;
  }
}

/** "Free" is a real and attractive answer, and it is not the same as "not priced yet". */
export function entryFeeLabel(event: TournamentEvent): string | null {
  if (event.entry_fee_minor === null) return null;
  if (event.entry_fee_minor === 0) return "Free to enter";
  return formatMoney(event.entry_fee_minor, event.currency);
}

/**
 * A coarse countdown for a deadline that is usually days away.
 *
 * Deliberately not the second-by-second `countdown()` in `format.ts`: that one drives a
 * live competition clock, and a list of a dozen events each ticking its own seconds is
 * both noisy to read and a re-render every second per row for information nobody uses.
 * Days and hours is what a registration deadline is actually measured in.
 */
export function closesInLabel(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "closes in under a minute";
  if (minutes < 60) return `closes in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `closes in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  const days = Math.floor(hours / 24);
  return `closes in ${days} ${days === 1 ? "day" : "days"}`;
}

/**
 * Which local day an event sits on, for the month grid.
 *
 * An event with no start date is on no day — it is a draft somebody has not scheduled, and
 * putting it on today would be inventing a fact. It still appears in the list view, which
 * is why the list is the complete view and the calendar is the scheduled one.
 */
export function eventDayKey(event: TournamentEvent, timeZone: string): string | null {
  if (event.starts_at === null) return null;
  const at = Date.parse(event.starts_at);
  if (Number.isNaN(at)) return null;
  return localDateKey(at, timeZone);
}

/** Every event that touches a given local day, keyed for the grid to look up per cell. */
export function eventsByDay(
  events: readonly TournamentEvent[],
  timeZone: string,
): ReadonlyMap<string, readonly TournamentEvent[]> {
  const byDay = new Map<string, TournamentEvent[]>();
  for (const event of events) {
    const key = eventDayKey(event, timeZone);
    if (key === null) continue;
    const bucket = byDay.get(key);
    if (bucket) bucket.push(event);
    else byDay.set(key, [event]);
  }
  return byDay;
}

export type EventFilter = "all" | "open" | "mine";

export function matchesFilter(event: TournamentEvent, filter: EventFilter, nowMs: number): boolean {
  switch (filter) {
    case "open":
      return registrationState(event, nowMs).kind !== "closed" && registrationState(event, nowMs).kind !== "not-open";
    case "mine":
      return event.entered || event.hosting;
    case "all":
      return true;
  }
}

/**
 * Reading order for a list of events: what is happening now, then what is coming, then
 * what is done — and within each, nearest first.
 *
 * Not chronological end to end, because a strict sort by date buries the event being
 * fished right now under three months of finished ones. An angler opening this screen
 * mid-season is asking "what is on", not "what happened in June".
 */
const PHASE_ORDER: Readonly<Record<string, number>> = { during: 0, before: 1, after: 2 };

export function sortForReading(events: readonly TournamentEvent[]): readonly TournamentEvent[] {
  return [...events].sort((a, b) => {
    const phaseDelta = (PHASE_ORDER[tournamentPhase(a.status)] ?? 3) - (PHASE_ORDER[tournamentPhase(b.status)] ?? 3);
    if (phaseDelta !== 0) return phaseDelta;

    const aAt = a.starts_at === null ? null : Date.parse(a.starts_at);
    const bAt = b.starts_at === null ? null : Date.parse(b.starts_at);
    // Undated events sink below dated ones rather than sorting as 1970.
    if (aAt === null || Number.isNaN(aAt)) return bAt === null || Number.isNaN(bAt) ? a.name.localeCompare(b.name) : 1;
    if (bAt === null || Number.isNaN(bAt)) return -1;

    // Finished events read newest first; everything else reads soonest first.
    const finished = tournamentPhase(a.status) === "after";
    return finished ? bAt - aAt : aAt - bAt;
  });
}
