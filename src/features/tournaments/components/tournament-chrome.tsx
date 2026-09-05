"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  countdown,
  formatSchedule,
  statusPresentation,
  TONE_CLASSES,
  visibilityLabel,
  type StatusTone,
} from "../format";
import { useNow, useOnline } from "../use-now";
import { BACK_LINK, CARD, CARD_PADDED, FOCUS_RING, PAGE, SECONDARY_BUTTON, TABULAR } from "../ui-classes";
import { AlertIcon, BackIcon, CheckIcon, ClockIcon, PendingIcon } from "./icons";

/**
 * The furniture every tournament screen shares: the page frame, the hero header, the tab
 * strip, status pills, stat tiles, empty and error states, and the loading skeleton.
 *
 * It lives in one file on purpose. The old section had six screens that each rolled their
 * own header, their own "← Overview" link, their own status pill and their own sentence
 * for "loading", and the result read as six half-finished screens rather than one product.
 * A tournament should feel like a place you are inside of, and that only happens if the
 * chrome is literally the same object on every screen.
 */

/* -------------------------------------------------------------------------- */
/* Frame                                                                       */
/* -------------------------------------------------------------------------- */

export function TournamentPage({ children }: { children: React.ReactNode }) {
  return <div className={PAGE}>{children}</div>;
}

/** The eyebrow link back up the hierarchy. 48px of tap target, not a 16px word. */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={BACK_LINK}>
      <BackIcon />
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A lifecycle state, as a pill.
 *
 * Colour is never the only signal (`docs/design/01-foundations.md` §1.3): the pill always
 * carries the word, and the dot gives it a second, non-hue channel. The live state is the
 * one that pulses, because "is this thing running right now" is the single question the
 * screen most often has to answer from across a cockpit.
 */
export function StatusPill({ status, className = "" }: { status: string; className?: string }) {
  const { label, tone } = statusPresentation(status);
  const classes = TONE_CLASSES[tone];
  const live = tone === "live";

  return (
    <span
      className={`inline-flex items-center gap-space-2 rounded-full border px-space-3 py-space-1 text-caption ${classes.pill} ${classes.text} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-space-2 w-space-2 rounded-full ${classes.dot} ${live ? "animate-pulse motion-reduce:animate-none" : ""}`}
      />
      {label}
    </span>
  );
}

/** The same pill shape for anything that is not a lifecycle state — sync, QR, eligibility. */
export function TonePill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  const classes = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex items-center gap-space-2 rounded-full border px-space-3 py-space-1 text-caption ${classes.pill} ${classes.text}`}
    >
      <span aria-hidden="true" className={`h-space-2 w-space-2 rounded-full ${classes.dot}`} />
      {children}
    </span>
  );
}

/**
 * One requirement or check, as a row: icon, what it is, and what it means right now.
 *
 * `state` drives both the glyph and the colour, and the label is always present, so this
 * row survives being read by someone who cannot separate green from amber.
 */
export function CheckRow({
  state,
  label,
  detail,
}: {
  state: "done" | "pending" | "attention";
  label: string;
  detail?: string;
}) {
  const tone: StatusTone = state === "done" ? "open" : state === "attention" ? "attention" : "neutral";
  const classes = TONE_CLASSES[tone];
  const Icon = state === "done" ? CheckIcon : state === "attention" ? AlertIcon : PendingIcon;

  return (
    <li className="flex items-start gap-space-3">
      <span className={`mt-space-1 ${classes.text}`}>
        <Icon />
      </span>
      <span className="flex flex-col gap-space-1">
        <span className="text-body text-text-primary">{label}</span>
        {detail ? <span className="text-caption text-text-muted">{detail}</span> : null}
      </span>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero header                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The tournament's identity, at the top of every screen inside it: name, what state it is
 * in, when it runs, and how long is left.
 *
 * The clock is the part that earns its space. "Starts in 6 days" and "4h 30m left" are the
 * two things a competitor actually wants from a tournament header, and neither was
 * anywhere in the old design — it printed an ISO date through `Intl` and stopped.
 */
export function TournamentHero({
  tournament,
  eyebrow,
  children,
}: {
  tournament: {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly visibility: string;
    readonly starts_at: string | null;
    readonly ends_at: string | null;
  };
  /** Overridden on sub-screens so the back link points one level up, not to the list. */
  eyebrow?: React.ReactNode;
  /** The screen's primary action, if it has one. */
  children?: React.ReactNode;
}) {
  const now = useNow();
  const clock = now === 0 ? null : countdown(now, { status: tournament.status, startsAt: tournament.starts_at, endsAt: tournament.ends_at });
  const { blurb } = statusPresentation(tournament.status);

  return (
    <header className="flex flex-col gap-space-4">
      {eyebrow ?? <BackLink href="/tournaments">All tournaments</BackLink>}

      <div className="overflow-hidden rounded-lg border border-hairline bg-linear-to-b from-surface-raised to-surface">
        <div className="flex flex-col gap-space-4 p-space-5">
          <div className="flex flex-wrap items-start justify-between gap-space-3">
            <h1 className="text-h1 text-text-primary">{tournament.name}</h1>
            <StatusPill status={tournament.status} />
          </div>

          <div className="flex flex-col gap-space-1">
            <p className="text-body text-text-primary">{formatSchedule(tournament.starts_at, tournament.ends_at)}</p>
            <p className="text-caption text-text-muted">
              {visibilityLabel(tournament.visibility)} · {blurb}
            </p>
          </div>

          {clock ? (
            <p
              className={`inline-flex items-center gap-space-2 text-body-strong ${clock.urgent ? "text-signal-orange" : "text-text-muted"}`}
            >
              <ClockIcon />
              <span className={TABULAR}>{clock.label}</span>
            </p>
          ) : null}

          {children}
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The five places a competitor goes inside a tournament.
 *
 * Organizer tools are deliberately not in this row. UX-001 §7 is blunt about it — do not
 * make an angler hunt through administrative navigation while on the water — so "Run the
 * event" is a card on the overview for the person who owns the event, and everyone else
 * never sees the word "operations" at all.
 */
const TABS = [
  ["Overview", "overview"],
  ["Enter", "register"],
  ["Catches", "catches"],
  ["Standings", "leaderboard"],
  ["Rules", "rules"],
] as const;

export function TournamentTabs({ tournamentId }: { tournamentId: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Tournament sections">
      {/*
        Wrapped, not scrolled. A horizontal scroller put "Standings" half off the right
        edge of a 390px phone, and a tab you cannot see is a tab you do not know exists —
        the same finding that put the nav drawer in the app shell. Two rows of five costs
        24px and hides nothing.
      */}
      <ul className="flex flex-wrap gap-space-2">
        {TABS.map(([label, route]) => {
          const href = `/tournaments/${tournamentId}/${route}`;
          const active = pathname === href;
          return (
            <li key={route}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-touch-floor items-center rounded-full border px-space-4 text-label transition-colors ${FOCUS_RING} ${
                  active
                    ? "border-signal-orange bg-signal-orange text-ink-on-orange"
                    : "border-border-interactive bg-surface text-text-link hover:border-text-link"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Small parts                                                                 */
/* -------------------------------------------------------------------------- */

export function SectionHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-space-2">
      <h2 className="text-h3 text-text-primary">{children}</h2>
      {aside ? <span className="text-caption text-text-muted">{aside}</span> : null}
    </div>
  );
}

/** A number worth looking at, with the word for what it counts underneath it. */
export function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: StatusTone;
}) {
  return (
    <article className={`${CARD} flex flex-col gap-space-1 p-space-4`}>
      <span className="text-caption text-text-muted">{label}</span>
      <span className={`text-h2 ${TABULAR} ${tone === "neutral" ? "text-text-primary" : TONE_CLASSES[tone].text}`}>
        {value}
      </span>
    </article>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`${CARD} flex flex-col items-start gap-space-3 border-dashed p-space-5`}>
      <p className="text-body-strong text-text-primary">{title}</p>
      <p className="text-body text-text-muted">{body}</p>
      {action}
    </div>
  );
}

/**
 * The demo-mode note.
 *
 * Said once, quietly, at the bottom of a screen rather than shouted at the top of five of
 * them. It is a truthful caveat, not a feature, and the old design gave it the same
 * prominence as the tournament's name.
 */
export function DemoNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-caption text-text-muted">
      {children ?? "Demo mode — this is saved on this phone only, until the tournament server is connected."}
    </p>
  );
}

/** The radio state, for the one screen where being offline changes what the app promises. */
export function ConnectionPill() {
  const online = useOnline();
  return (
    <TonePill tone={online ? "open" : "attention"}>{online ? "Online" : "No service"}</TonePill>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading and failure                                                         */
/* -------------------------------------------------------------------------- */

/**
 * A skeleton rather than the word "Loading…".
 *
 * On a boat, a cold load can take a while, and a blank screen with one grey word looks
 * broken. Blocks in the shape of the content that is coming look like the app working.
 */
export function LoadingScreen({ label = "Loading tournament" }: { label?: string }) {
  return (
    <div className={PAGE} aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      <div className="h-space-12 w-full animate-pulse rounded-lg bg-surface motion-reduce:animate-none" aria-hidden="true" />
      <div className="h-space-16 w-full animate-pulse rounded-lg bg-surface motion-reduce:animate-none" aria-hidden="true" />
      <div className="h-space-16 w-full animate-pulse rounded-lg bg-surface motion-reduce:animate-none" aria-hidden="true" />
    </div>
  );
}

/**
 * A failure the person can act on: what happened, in a sentence, and a way out of it.
 * Never a bare error string on a blank page.
 */
export function ErrorScreen({
  title = "That did not load",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className={PAGE}>
      <section className={`${CARD_PADDED} flex flex-col gap-space-3`} role="alert">
        <p className="text-h3 text-error-red">{title}</p>
        <p className="text-body text-text-primary">{message}</p>
        <div className="flex flex-wrap gap-space-3">
          {onRetry ? (
            <button type="button" className={SECONDARY_BUTTON} onClick={onRetry}>
              Try again
            </button>
          ) : null}
          <Link href="/tournaments" className={SECONDARY_BUTTON}>
            All tournaments
          </Link>
        </div>
      </section>
    </div>
  );
}
