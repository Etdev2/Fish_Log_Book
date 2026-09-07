"use client";

import Link from "next/link";

import { BackLink } from "@/components/back-link";
import { usePathname } from "next/navigation";

import {
  countdown,
  formatSchedule,
  statusPresentation,
  TONE_CLASSES,
  visibilityLabel,
  type StatusTone,
} from "../format";
import { entryFeeLabel, formatMoney } from "../event-card";
import type { TournamentRecord } from "../types";
import { useNow, useOnline } from "../use-now";
import {
  CARD,
  CARD_PADDED,
  FOCUS_RING,
  PAGE,
  SECONDARY_BUTTON,
  TABULAR,
} from "../ui-classes";
import { AlertIcon, CheckIcon, ClockIcon, PendingIcon } from "./icons";

export function TournamentPage({ children }: { children: React.ReactNode }) {
  return <div className={PAGE}>{children}</div>;
}

/*
  The section's own `BackLink` used to live here — a second component with the same name and
  a different type scale (`text-caption`) from the app-wide one in `@/components/back-link`
  (`text-label`). That is the "five spellings of back" problem the shell round removed from
  the rest of the app, quietly re-grown inside this feature. There is one now, and it is the
  shared one; a component that knows no domain noun belongs in `src/components/` by
  ADR 005 §3 anyway.
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

export function TournamentHero({
  tournament,
  eyebrow,
  children,
}: {
  tournament: TournamentRecord;
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const now = useNow();
  const clock =
    now === 0
      ? null
      : countdown(now, {
          status: tournament.status,
          startsAt: tournament.starts_at,
          endsAt: tournament.ends_at,
        });
  const { blurb } = statusPresentation(tournament.status);

  return (
    <header className="flex flex-col gap-space-4">
      {eyebrow ?? <BackLink href="/tournaments" label="All tournaments" />}

      <div className="overflow-hidden rounded-lg border border-hairline bg-linear-to-b from-surface-raised to-surface">
        <div className="flex flex-col gap-space-4 p-space-5">
          <div className="flex flex-col gap-space-3">
            <div className="flex flex-wrap items-center gap-space-2">
              <StatusPill status={tournament.status} />
              <span className="text-caption text-text-muted">{visibilityLabel(tournament.visibility)}</span>
            </div>
            <h1 className="text-h1 text-text-primary">{tournament.name}</h1>
          </div>

          {/*
            The same facts the event card carries, in the same words. A card on the calendar
            that shows where an event is and what the pot is at, linking to a page that shows
            neither, reads as the page having lost them — so the detail screen is never
            poorer than the list that pointed at it.
          */}
          <dl className="grid gap-space-3 sm:grid-cols-2">
            <div className="flex flex-col gap-space-1">
              <dt className="text-caption text-text-muted">When</dt>
              <dd className="text-body-strong text-text-primary">
                {formatSchedule(tournament.starts_at, tournament.ends_at)}
              </dd>
            </div>
            <div className="flex flex-col gap-space-1">
              <dt className="text-caption text-text-muted">Where</dt>
              <dd className="text-body-strong text-text-primary">
                {tournament.location_name ?? "Not announced"}
              </dd>
            </div>
            <div className="flex flex-col gap-space-1">
              <dt className="text-caption text-text-muted">Prize pool</dt>
              {/* "—" for a pot we cannot read, never "$0" — the difference is money. */}
              <dd className={`text-body-strong text-text-primary ${TABULAR}`}>
                {formatMoney(tournament.prize_pool_minor, tournament.currency) ?? "—"}
              </dd>
            </div>
            <div className="flex flex-col gap-space-1">
              <dt className="text-caption text-text-muted">Entry</dt>
              <dd className={`text-body-strong text-text-primary ${TABULAR}`}>
                {entryFeeLabel({
                  entry_fee_minor: tournament.entry_fee_minor,
                  currency: tournament.currency,
                }) ?? "Not priced"}
              </dd>
            </div>
            <div className="flex flex-col gap-space-1 sm:col-span-2">
              <dt className="text-caption text-text-muted">Right now</dt>
              <dd className="text-body text-text-primary">{blurb}</dd>
            </div>
          </dl>

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

const TABS = [
  { label: "Home", route: "overview", step: null },
  { label: "Entry", route: "register", step: "1" },
  { label: "Compete", route: "catches", step: "2" },
  { label: "Results", route: "leaderboard", step: "3" },
  { label: "Rules", route: "rules", step: null },
] as const;

export function TournamentTabs({ tournamentId }: { tournamentId: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Tournament flow" className="flex flex-col gap-space-2">
      <div className="flex flex-wrap items-end justify-between gap-space-2">
        <span className="text-label text-text-primary">Tournament flow</span>
        <span className="text-caption text-text-muted">Entry → Compete → Results</span>
      </div>
      <ul className="grid grid-cols-2 gap-space-2 sm:grid-cols-5">
        {TABS.map(({ label, route, step }) => {
          const href = `/tournaments/${tournamentId}/${route}`;
          const active = pathname === href;
          return (
            <li key={route}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-touch-floor w-full items-center justify-center gap-space-2 rounded-lg border px-space-3 text-center text-label transition-colors ${FOCUS_RING} ${
                  active
                    ? "border-signal-orange bg-signal-orange text-ink-on-orange"
                    : "border-border-interactive bg-surface text-text-link hover:border-text-link"
                }`}
              >
                {step ? (
                  <span
                    aria-hidden="true"
                    className={`flex h-space-5 w-space-5 items-center justify-center rounded-full border text-caption ${
                      active ? "border-ink-on-orange/50" : "border-border-interactive text-text-muted"
                    }`}
                  >
                    {step}
                  </span>
                ) : null}
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SectionHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-space-2">
      <h2 className="text-h3 text-text-primary">{children}</h2>
      {aside ? <span className="text-caption text-text-muted">{aside}</span> : null}
    </div>
  );
}

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
      <span
        className={`text-h2 ${TABULAR} ${tone === "neutral" ? "text-text-primary" : TONE_CLASSES[tone].text}`}
      >
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

export function DemoNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-caption text-text-muted">
      {children ?? "Demo mode — this is saved on this phone only, until the tournament server is connected."}
    </p>
  );
}

export function ConnectionPill() {
  const online = useOnline();
  return <TonePill tone={online ? "open" : "attention"}>{online ? "Online" : "No service"}</TonePill>;
}

export function LoadingScreen({ label = "Loading tournament" }: { label?: string }) {
  return (
    <div className={PAGE} aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      <div
        className="h-space-12 w-full animate-pulse rounded-lg bg-surface motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="h-space-16 w-full animate-pulse rounded-lg bg-surface motion-reduce:animate-none"
        aria-hidden="true"
      />
      <div
        className="h-space-16 w-full animate-pulse rounded-lg bg-surface motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  );
}

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
