"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDemoEntry, type DemoEntry } from "../demo-store";
import { entrySteps, formatDateTime, tournamentPhase, visibilityPresentation } from "../format";
import { getDemoTournamentCatches } from "../live-catch-demo";
import { useStandings } from "../queries/use-standings";
import { useDemoMode, useTournament } from "../use-tournament";
import {
  BIG_ACTION,
  CARD,
  CARD_PADDED,
  FOCUS_RING,
  PAGE,
  SECONDARY_BUTTON,
  TABULAR,
} from "../ui-classes";
import { ChevronIcon, LockIcon, TrophyIcon } from "./icons";
import {
  CheckRow,
  DemoNote,
  ErrorScreen,
  LoadingScreen,
  SectionHeading,
  TonePill,
  TournamentHero,
  TournamentTabs,
} from "./tournament-chrome";

const READINESS = [
  {
    key: "active_rule_set_version_id",
    label: "Rules",
    detail: "What counts, what does not, and any penalties.",
  },
  {
    key: "active_scoring_version_id",
    label: "Scoring",
    detail: "How catches turn into the result.",
  },
  {
    key: "active_verification_policy_version_id",
    label: "Catch verification",
    detail: "What proof is required for a catch to count.",
  },
  {
    key: "active_boundary_version_id",
    label: "Fishing area",
    detail: "Where competitors are allowed to fish.",
  },
] as const;

type TournamentPhase = "before" | "during" | "after";

export function TournamentOverview({ tournamentId }: { tournamentId: string }) {
  const load = useTournament(tournamentId);
  const demoMode = useDemoMode();
  /* Read from the same loader as the leaderboard, so the top three here and the board there
     can never disagree — they used to come from two different expressions. */
  const standingsLoad = useStandings(tournamentId);
  const standings = standingsLoad.state === "ready" ? standingsLoad.rows : [];
  const [entry, setEntry] = useState<DemoEntry | null>(null);
  const [deviceCatches, setDeviceCatches] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setEntry(demoMode ? getDemoEntry(tournamentId) : null);
      setDeviceCatches(getDemoTournamentCatches(tournamentId).length);
    })();
    return () => {
      cancelled = true;
    };
  }, [demoMode, tournamentId]);

  if (load.state === "loading") return <LoadingScreen />;
  if (load.state === "error") return <ErrorScreen message={load.message} />;

  const tournament = load.tournament;
  const phase = tournamentPhase(tournament.status);
  const locked = READINESS.filter((item) => tournament[item.key] !== null);
  const ready = locked.length === READINESS.length;
  const visibility = visibilityPresentation(tournament.visibility);

  return (
    <div className={PAGE}>
      <TournamentHero tournament={tournament}>
        <PrimaryAction tournament={tournament} entry={entry} phase={phase} />
      </TournamentHero>

      <TournamentTabs tournamentId={tournament.id} />

      <TournamentJourney
        tournamentId={tournament.id}
        status={tournament.status}
        phase={phase}
        entry={entry}
        ready={ready}
        hasStandings={standings.length > 0}
      />

      {entry ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`} aria-labelledby="your-entry-heading">
          <SectionHeading aside="Your status">
            <span id="your-entry-heading">Ready to fish?</span>
          </SectionHeading>
          <p className="text-body text-text-muted">
            Registration, eligibility, check-in, and competition status move separately. This is the fastest place to see what still needs attention.
          </p>
          <ul className="flex flex-wrap gap-space-2">
            {entrySteps(entry).map((item) => (
              <li key={item.label}>
                <TonePill tone={item.tone}>
                  {item.label}: {item.value}
                </TonePill>
              </li>
            ))}
          </ul>
          <Link
            href={`/tournaments/${tournament.id}/register`}
            className={`${FOCUS_RING} inline-flex min-h-touch-floor items-center text-label text-text-link`}
          >
            Open my entry
          </Link>
        </section>
      ) : null}

      {phase === "before" ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-4`} aria-labelledby="readiness-heading">
          <SectionHeading aside={`${locked.length} of ${READINESS.length} complete`}>
            <span id="readiness-heading">Host setup before launch</span>
          </SectionHeading>
          <p className="text-body text-text-muted">
            These are the four competition decisions that must be settled before anglers are on the water.
          </p>

          <div
            className="flex h-space-2 gap-space-1 overflow-hidden rounded-full"
            role="img"
            aria-label={`${locked.length} of ${READINESS.length} competition settings locked`}
          >
            {READINESS.map((item) => (
              <span
                key={item.key}
                className={`h-full flex-1 rounded-full ${
                  tournament[item.key] !== null ? "bg-success-green" : "bg-surface-raised"
                }`}
              />
            ))}
          </div>

          <ul className="flex flex-col gap-space-3">
            {READINESS.map((item) => (
              <CheckRow
                key={item.key}
                state={tournament[item.key] !== null ? "done" : "pending"}
                label={item.label}
                detail={tournament[item.key] !== null ? "Locked for the event." : item.detail}
              />
            ))}
          </ul>

          <p className="inline-flex items-start gap-space-2 text-caption text-text-muted">
            <LockIcon size="h-space-4 w-space-4" />
            {ready
              ? "Competition settings are locked. They cannot move underneath anglers once fishing starts."
              : "Lock these before launch so every competitor fishes under the same event."}
          </p>
        </section>
      ) : null}

      {standings.length > 0 ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`} aria-labelledby="standings-heading">
          <SectionHeading aside={phase === "after" ? "Official" : "Live / provisional"}>
            <span id="standings-heading">{phase === "after" ? "Final result" : "At the top right now"}</span>
          </SectionHeading>
          <ol className="flex flex-col gap-space-2">
            {standings.slice(0, 3).map((row) => (
              <li key={row.rank} className="flex items-center gap-space-3">
                <span
                  className={`text-h3 ${TABULAR} ${row.rank === 1 ? "text-signal-orange" : "text-text-muted"}`}
                >
                  {row.rank}
                </span>
                <span className="flex-1 text-body text-text-primary">{row.displayName}</span>
                <span className={`text-body-strong ${TABULAR} text-text-primary`}>
                  {row.score.toFixed(1)}
                  {row.scoreUnit ? ` ${row.scoreUnit}` : ""}
                </span>
              </li>
            ))}
          </ol>
          <Link
            href={`/tournaments/${tournament.id}/leaderboard`}
            className={`${FOCUS_RING} inline-flex min-h-touch-floor items-center gap-space-2 text-label text-text-link`}
          >
            <TrophyIcon />
            See all results
          </Link>
        </section>
      ) : null}

      <section className="flex flex-col gap-space-3" aria-labelledby="details-heading">
        <SectionHeading>
          <span id="details-heading">Event details</span>
        </SectionHeading>
        <div className="grid gap-space-3 sm:grid-cols-2">
          <DetailCard label="Starts" value={formatDateTime(tournament.starts_at) ?? "Not set yet"} />
          <DetailCard label="Ends" value={formatDateTime(tournament.ends_at) ?? "Not set yet"} />
          <DetailCard label="Visibility" value={visibility.label} hint={visibility.blurb} />
          <DetailCard
            label="Catches saved on this phone"
            value={String(deviceCatches)}
            hint="Saved here whether or not they have reached the scorer yet."
          />
        </div>
      </section>

      <Link
        href={`/tournaments/${tournament.id}/operations`}
        className={`${CARD} ${FOCUS_RING} flex items-center gap-space-3 p-space-4 transition-colors hover:border-border-interactive`}
      >
        <span className="flex flex-1 flex-col gap-space-1">
          <span className="text-caption text-text-muted">For organizers</span>
          <span className="text-body-strong text-text-primary">Host controls</span>
          <span className="text-caption text-text-muted">
            Manage entries, review catches, watch standings, and run the event.
          </span>
        </span>
        <ChevronIcon className="text-text-muted" />
      </Link>

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}

function TournamentJourney({
  tournamentId,
  status,
  phase,
  entry,
  ready,
  hasStandings,
}: {
  tournamentId: string;
  status: string;
  phase: TournamentPhase;
  entry: DemoEntry | null;
  ready: boolean;
  hasStandings: boolean;
}) {
  const steps = [
    {
      number: "1",
      title: "Enter",
      href: `/tournaments/${tournamentId}/register`,
      detail: entry
        ? "Your entry exists. Check eligibility and check-in."
        : status === "REGISTRATION_OPEN"
          ? "Registration is open now."
          : "See registration status and requirements.",
    },
    {
      number: "2",
      title: "Know the rules",
      href: `/tournaments/${tournamentId}/rules`,
      detail: ready
        ? "Rules, scoring, proof, and boundaries are locked."
        : "Review what counts before fishing starts.",
    },
    {
      number: "3",
      title: "Compete",
      href: `/tournaments/${tournamentId}/catches`,
      detail:
        phase === "during"
          ? "The tournament is live. Log and review catches here."
          : phase === "before"
            ? "This opens into your on-the-water catch flow."
            : "Fishing is complete. Your catch record stays here.",
    },
    {
      number: "4",
      title: "Results",
      href: `/tournaments/${tournamentId}/leaderboard`,
      detail: hasStandings
        ? phase === "after"
          ? "Official results are available."
          : "Live standings are available now."
        : "Standings appear as catches are approved.",
    },
  ] as const;

  return (
    <section className="flex flex-col gap-space-3" aria-labelledby="journey-heading">
      <div className="flex flex-col gap-space-1">
        <SectionHeading>
          <span id="journey-heading">How this tournament works</span>
        </SectionHeading>
        <p className="text-body text-text-muted">
          Four steps. Start here whenever you are unsure where to go next.
        </p>
      </div>
      <ol className="grid gap-space-3 sm:grid-cols-2">
        {steps.map((step) => (
          <li key={step.number}>
            <Link
              href={step.href}
              className={`${CARD} ${FOCUS_RING} flex h-full items-start gap-space-3 p-space-4 transition-colors hover:border-border-interactive`}
            >
              <span className="flex h-space-8 w-space-8 shrink-0 items-center justify-center rounded-full border border-border-interactive text-label text-signal-orange">
                {step.number}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-space-1">
                <span className="text-body-strong text-text-primary">{step.title}</span>
                <span className="text-caption text-text-muted">{step.detail}</span>
              </span>
              <ChevronIcon className="mt-space-1 text-text-muted" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DetailCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className={`${CARD} flex flex-col gap-space-1 p-space-4`}>
      <span className="text-caption text-text-muted">{label}</span>
      <span className="text-body-strong text-text-primary">{value}</span>
      {hint ? <span className="text-caption text-text-muted">{hint}</span> : null}
    </article>
  );
}

function PrimaryAction({
  tournament,
  entry,
  phase,
}: {
  tournament: { readonly id: string; readonly status: string };
  entry: DemoEntry | null;
  phase: TournamentPhase;
}) {
  if (phase === "during") {
    return (
      <Link href={`/tournaments/${tournament.id}/catches`} className={BIG_ACTION}>
        Compete now — log a catch
      </Link>
    );
  }

  if (phase === "after") {
    return (
      <Link href={`/tournaments/${tournament.id}/leaderboard`} className={BIG_ACTION}>
        View final results
      </Link>
    );
  }

  if (tournament.status === "REGISTRATION_OPEN") {
    return (
      <Link href={`/tournaments/${tournament.id}/register`} className={BIG_ACTION}>
        {entry ? "Check my entry" : "Enter this tournament"}
      </Link>
    );
  }

  if (tournament.status === "DRAFT") {
    return (
      <Link href={`/tournaments/${tournament.id}/operations`} className={BIG_ACTION}>
        Continue host setup
      </Link>
    );
  }

  return (
    <Link href={`/tournaments/${tournament.id}/rules`} className={SECONDARY_BUTTON}>
      Review the rules
    </Link>
  );
}
