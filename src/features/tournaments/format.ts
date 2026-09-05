import { TOURNAMENT_STATUSES, type TournamentStatus } from "@/core/tournaments/lifecycle";

/**
 * Everything the tournament screens need to turn a backend enum into a sentence a person
 * on a boat can read, with no React in sight so it can be tested directly.
 *
 * The rule this file exists to enforce: **no screen prints a raw enum.** `REGISTRATION_OPEN`
 * lowercased with the underscores swapped for spaces is not English, it is a database
 * column wearing a hat, and the old tournament UI did that in eleven places. A status is a
 * word plus a tone plus, where it helps, a line of explanation.
 *
 * The second rule, from `docs/design/01-foundations.md` §1.3: a tone is never the only
 * signal. Every consumer of `statusTone` pairs the colour with the label, and the pill
 * component draws a dot as well, so the state survives both colour-vision deficiency and
 * the glare that destroys hue first.
 */

/**
 * Six tones, mapped onto the semantic palette. Not ten — a reader cannot hold ten colour
 * meanings, and the lifecycle's ten states collapse cleanly into "not started yet",
 * "taking entries", "running", "needs attention", "finished", "stopped".
 */
export type StatusTone = "neutral" | "open" | "live" | "attention" | "done" | "stopped";

export interface ToneClasses {
  /** Text colour for the label. */
  readonly text: string;
  /** Fill for the dot, and for a progress bar tinted to match. */
  readonly dot: string;
  /** Pill background + border, tinted from the same hue at low alpha. */
  readonly pill: string;
}

/**
 * Written out per tone rather than interpolated: Tailwind only ships classes it can see in
 * the source, so `text-${token}` compiles to nothing and every pill renders grey.
 */
export const TONE_CLASSES: Readonly<Record<StatusTone, ToneClasses>> = {
  neutral: {
    text: "text-text-muted",
    dot: "bg-text-muted",
    pill: "border-hairline bg-surface-raised",
  },
  open: {
    text: "text-success-green",
    dot: "bg-success-green",
    pill: "border-success-green/40 bg-success-green/10",
  },
  live: {
    text: "text-signal-orange",
    dot: "bg-signal-orange",
    pill: "border-signal-orange/50 bg-signal-orange/10",
  },
  attention: {
    text: "text-amber-flag",
    dot: "bg-amber-flag",
    pill: "border-amber-flag/40 bg-amber-flag/10",
  },
  done: {
    text: "text-tide-cyan",
    dot: "bg-tide-cyan",
    pill: "border-tide-cyan/40 bg-tide-cyan/10",
  },
  stopped: {
    text: "text-error-red",
    dot: "bg-error-red",
    pill: "border-error-red/40 bg-error-red/10",
  },
};

interface StatusPresentation {
  readonly label: string;
  readonly tone: StatusTone;
  /** One sentence: what this state means for the person reading it. */
  readonly blurb: string;
}

const STATUS: Readonly<Record<TournamentStatus, StatusPresentation>> = {
  DRAFT: {
    label: "Draft",
    tone: "neutral",
    blurb: "Only you can see this. Nobody can enter until you open registration.",
  },
  REGISTRATION_OPEN: {
    label: "Taking entries",
    tone: "open",
    blurb: "Anglers can enter now.",
  },
  REGISTRATION_CLOSED: {
    label: "Entries closed",
    tone: "neutral",
    blurb: "The field is set. Nobody else can enter.",
  },
  READY: {
    label: "Ready to start",
    tone: "open",
    blurb: "Rules, scoring, checks and boundaries are locked. Start when you are.",
  },
  LIVE: {
    label: "Fishing now",
    tone: "live",
    blurb: "Catches count. Log them as you land them.",
  },
  PAUSED: {
    label: "Paused",
    tone: "attention",
    blurb: "Fishing is stopped for now. Catches logged while paused need a judge's look.",
  },
  COMPLETED: {
    label: "Lines out",
    tone: "neutral",
    blurb: "Fishing is over. Scores are still being settled.",
  },
  RESULTS_PENDING: {
    label: "Results pending",
    tone: "attention",
    blurb: "Standings are provisional until the last review is closed.",
  },
  FINAL: {
    label: "Final",
    tone: "done",
    blurb: "Results are official.",
  },
  CANCELLED: {
    label: "Cancelled",
    tone: "stopped",
    blurb: "This tournament will not be fished.",
  },
};

/** True for a string that is one of the ten lifecycle states. */
export function isTournamentStatus(value: string): value is TournamentStatus {
  return (TOURNAMENT_STATUSES as readonly string[]).includes(value);
}

/**
 * An unknown status still has to render — a server that gains an eleventh state must not
 * blank a screen — so it falls back to the enum, title-cased, and the neutral tone.
 */
export function statusPresentation(status: string): StatusPresentation {
  if (isTournamentStatus(status)) return STATUS[status];
  return { label: titleCase(status), tone: "neutral", blurb: "" };
}

export function statusLabel(status: string): string {
  return statusPresentation(status).label;
}

export function statusTone(status: string): StatusTone {
  return statusPresentation(status).tone;
}

/**
 * Which of the organizer dashboard's three columns of work this state belongs to
 * (UX-001 §12: before event / during event / after event). The dashboard opens on the
 * phase the tournament is actually in, so a director running a live event does not land on
 * a setup checklist.
 */
export type Phase = "before" | "during" | "after";

export function tournamentPhase(status: string): Phase {
  switch (status) {
    case "LIVE":
    case "PAUSED":
      return "during";
    case "COMPLETED":
    case "RESULTS_PENDING":
    case "FINAL":
    case "CANCELLED":
      return "after";
    default:
      return "before";
  }
}

interface VisibilityPresentation {
  readonly label: string;
  readonly blurb: string;
}

const VISIBILITY: Readonly<Record<string, VisibilityPresentation>> = {
  PRIVATE: { label: "Private", blurb: "Only people you add can see it." },
  INVITE_ONLY: { label: "Invite only", blurb: "Anyone with an invite can enter." },
  UNLISTED: { label: "Unlisted", blurb: "Anyone with the link can see it. It is not listed publicly." },
  PUBLIC: { label: "Public", blurb: "Listed for anyone to find and follow." },
};

export function visibilityPresentation(visibility: string): VisibilityPresentation {
  return VISIBILITY[visibility] ?? { label: titleCase(visibility), blurb: "" };
}

export function visibilityLabel(visibility: string): string {
  return visibilityPresentation(visibility).label;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

function parse(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Sat 12 Sep, 7:00 AM" — day name included, because "the 12th" is not a plan. */
export function formatDateTime(value: string | null): string | null {
  const date = parse(value);
  if (!date) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(value: string | null): string | null {
  const date = parse(value);
  if (!date) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTime(value: string | null): string | null {
  const date = parse(value);
  if (!date) return null;
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

/**
 * A one-day event reads "Sat 12 Sep · 7:00 AM – 4:00 PM"; a multi-day one reads
 * "Sat 12 Sep – Sun 13 Sep". Repeating the date twice for a single day is the kind of
 * detail that makes a screen feel machine-generated.
 */
export function formatSchedule(startsAt: string | null, endsAt: string | null): string {
  const start = parse(startsAt);
  const end = parse(endsAt);

  if (!start && !end) return "Date not set yet";
  if (!start) return `Ends ${formatDateTime(endsAt)}`;
  if (!end) return `Starts ${formatDateTime(startsAt)}`;

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) return `${formatDate(startsAt)} · ${formatTime(startsAt)} – ${formatTime(endsAt)}`;
  return `${formatDateTime(startsAt)} – ${formatDateTime(endsAt)}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Rounded down, two units at most: "6 days", "5h 12m", "42m", "under a minute". Precision
 * past two units is noise on a screen being read at arm's length in the sun.
 */
export function formatDuration(ms: number): string {
  if (ms < MINUTE) return "under a minute";
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m`;
  if (ms < DAY) {
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  }
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  if (days >= 7 || hours === 0) return days === 1 ? "1 day" : `${days} days`;
  return days === 1 ? `1 day ${hours}h` : `${days} days ${hours}h`;
}

export interface CountdownState {
  /** The short form for a pill: "Starts in 6 days", "4h 12m left", "Finished". */
  readonly label: string;
  /** Whether this is the clock the angler is racing — drives the live tone. */
  readonly urgent: boolean;
}

/**
 * The clock, derived from the schedule and the lifecycle state together.
 *
 * State wins over the calendar where they disagree: a tournament the director has not
 * started yet does not say "3h left" merely because its scheduled window is open, and a
 * FINAL tournament never counts down to anything. A clock that contradicts the status line
 * six inches above it is worse than no clock.
 */
export function countdown(
  now: number,
  input: { readonly status: string; readonly startsAt: string | null; readonly endsAt: string | null },
): CountdownState | null {
  const phase = tournamentPhase(input.status);
  if (input.status === "CANCELLED") return null;
  if (phase === "after") return { label: input.status === "FINAL" ? "Official" : "Fishing finished", urgent: false };

  const start = parse(input.startsAt);
  const end = parse(input.endsAt);

  if (phase === "during") {
    if (input.status === "PAUSED") return { label: "Paused", urgent: false };
    if (!end) return { label: "Fishing now", urgent: true };
    const remaining = end.getTime() - now;
    if (remaining <= 0) return { label: "Time is up", urgent: true };
    return { label: `${formatDuration(remaining)} left`, urgent: true };
  }

  if (!start) return null;
  const until = start.getTime() - now;
  if (until <= 0) return { label: "Start time has passed", urgent: false };
  return { label: `Starts in ${formatDuration(until)}`, urgent: until < DAY };
}

/* -------------------------------------------------------------------------- */
/* Entry, sync, and evidence states                                            */
/* -------------------------------------------------------------------------- */

/**
 * UX-001 §5 is explicit that the four entry states must not be collapsed into
 * "registered" — payment, eligibility, check-in and competition each move on their own,
 * and flattening them is how an angler ends up at the dock believing they are entered when
 * their eligibility is still unresolved. So each gets its own line, its own plain word,
 * and its own "what do I do about it".
 */
export interface EntryStep {
  readonly label: string;
  readonly value: string;
  readonly tone: StatusTone;
  readonly hint: string;
}

const REGISTRATION: Readonly<Record<string, Omit<EntryStep, "label">>> = {
  DRAFT: { value: "Not finished", tone: "attention", hint: "Your entry has not been submitted yet." },
  PENDING: { value: "Submitted", tone: "neutral", hint: "Waiting on the organizer to confirm your place." },
  SUBMITTED: { value: "Submitted", tone: "neutral", hint: "Waiting on the organizer to confirm your place." },
  PAYMENT_REQUIRED: { value: "Payment needed", tone: "attention", hint: "Your place is held until the entry fee is paid." },
  CONFIRMED: { value: "Confirmed", tone: "open", hint: "You are in." },
  WAITLISTED: { value: "Waitlisted", tone: "attention", hint: "You are next in line if a place opens." },
  CANCELLED: { value: "Cancelled", tone: "stopped", hint: "This entry has been withdrawn." },
};

const ELIGIBILITY: Readonly<Record<string, Omit<EntryStep, "label">>> = {
  UNKNOWN: { value: "Not checked yet", tone: "neutral", hint: "The organizer has not run eligibility on this entry." },
  PENDING: { value: "Being checked", tone: "neutral", hint: "The organizer is reviewing your details." },
  ELIGIBLE: { value: "Eligible", tone: "open", hint: "You meet the rules for this event." },
  ACTION_REQUIRED: { value: "Needs something from you", tone: "attention", hint: "The organizer has asked for more information." },
  INELIGIBLE: { value: "Not eligible", tone: "stopped", hint: "Ask the organizer what would change this." },
};

const CHECK_IN: Readonly<Record<string, Omit<EntryStep, "label">>> = {
  NOT_CHECKED_IN: { value: "Not checked in", tone: "neutral", hint: "Check in at the ramp before lines in." },
  CHECKED_IN: { value: "Checked in", tone: "open", hint: "The organizer has you on the water." },
  MISSED: { value: "Missed check-in", tone: "attention", hint: "Talk to the organizer before you fish." },
};

const COMPETITION: Readonly<Record<string, Omit<EntryStep, "label">>> = {
  NOT_STARTED: { value: "Not started", tone: "neutral", hint: "Nothing counts until the tournament goes live." },
  ACTIVE: { value: "Fishing", tone: "live", hint: "Your catches are counting." },
  WITHDRAWN: { value: "Withdrawn", tone: "stopped", hint: "You are no longer being scored." },
  DISQUALIFIED: { value: "Disqualified", tone: "stopped", hint: "A judge has recorded a reason for this." },
};

function step(
  label: string,
  table: Readonly<Record<string, Omit<EntryStep, "label">>>,
  raw: string,
): EntryStep {
  const known = table[raw];
  if (known) return { label, ...known };
  return { label, value: titleCase(raw), tone: "neutral", hint: "" };
}

export function entrySteps(entry: {
  readonly registration_status: string;
  readonly eligibility_status: string;
  readonly check_in_status: string;
  readonly competition_status: string;
}): readonly EntryStep[] {
  return [
    step("Your place", REGISTRATION, entry.registration_status),
    step("Eligibility", ELIGIBILITY, entry.eligibility_status),
    step("Check-in", CHECK_IN, entry.check_in_status),
    step("Competing", COMPETITION, entry.competition_status),
  ];
}

/**
 * The five offline states UX-001 §9 requires, in the angler's words. "Saved on this
 * device" is the important one: it is what the app can honestly promise while the boat is
 * out of range, and it must never be dressed up as confirmation from a server that has not
 * heard from us.
 */
export function syncPresentation(state: string): { readonly label: string; readonly tone: StatusTone; readonly hint: string } {
  switch (state) {
    case "SAVED_OFFLINE":
      return {
        label: "Saved on this phone",
        tone: "neutral",
        hint: "Nothing is lost. It goes up when you have service.",
      };
    case "PENDING_SYNC":
      return { label: "Waiting to send", tone: "attention", hint: "Queued. Retrying does not create a second catch." };
    case "SYNCED":
      return { label: "Received by the scorer", tone: "open", hint: "The tournament has it. Scoring is a judge's job, not the phone's." };
    case "CONFLICT":
      return {
        label: "Needs a person to look",
        tone: "stopped",
        hint: "Your original photo and details are kept exactly as recorded. Nothing was overwritten.",
      };
    default:
      return { label: titleCase(state), tone: "neutral", hint: "" };
  }
}

/**
 * The QR outcomes an angler can see, phrased as observations rather than accusations.
 * "Reused" is a fact about a token; it is not a finding about the person holding the phone,
 * and a screen that implies otherwise will be wrong in front of the wrong person one day.
 */
export function qrPresentation(state: string): { readonly label: string; readonly tone: StatusTone } {
  switch (state) {
    case "VALID":
      return { label: "Code checked out", tone: "open" };
    case "NOT_SCANNED":
      return { label: "No code scanned", tone: "neutral" };
    case "EXPIRED":
      return { label: "Code had expired", tone: "attention" };
    case "REUSED":
      return { label: "Code already used", tone: "attention" };
    case "WRONG_CONTEXT":
      return { label: "Code from another event", tone: "attention" };
    default:
      return { label: titleCase(state), tone: "neutral" };
  }
}
