"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDemoEntry, getDemoStandings, type DemoEntry, type DemoStanding } from "../demo-store";
import { entrySteps, formatDateTime, tournamentPhase, visibilityPresentation } from "../format";
import { getDemoTournamentCatches } from "../live-catch-demo";
import { useDemoMode, useTournament } from "../use-tournament";
import { BIG_ACTION, CARD, CARD_PADDED, FOCUS_RING, PAGE, SECONDARY_BUTTON, TABULAR } from "../ui-classes";
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

/**
 * /tournaments/[id]/overview — the tournament's home.
 *
 * The question this screen answers is "what do I do about this tournament right now",
 * and the answer changes completely depending on where the event is in its life. So the
 * screen leads with one action sized like it matters — enter it, log a catch, finish
 * setting it up, see who won — and only then explains itself.
 *
 * The old version led with a progress bar labelled "4 locked inputs selected" over the
 * sentence "Rules, scoring, verification policy and tournament boundaries must all be
 * frozen before READY can move to LIVE." That is the domain model talking to itself. The
 * checklist below says the same thing in the words a person running a fishing tournament
 * would use, and it is a checklist rather than a bar because a bar cannot tell you which
 * one is missing.
 */

/** The four frozen competition inputs, in the order a director would work through them. */
const READINESS = [
  {
    key: "active_rule_set_version_id",
    label: "The rules",
    detail: "What counts, what does not, and the penalties. Locked so they cannot change mid-event.",
  },
  {
    key: "active_scoring_version_id",
    label: "How it is scored",
    detail: "Heaviest fish, total weight, points by species — whatever this event runs on.",
  },
  {
    key: "active_verification_policy_version_id",
    label: "What counts as proof",
    detail: "Photo, GPS, a scanned code, a measured length. Set once, applied to everyone.",
  },
  {
    key: "active_boundary_version_id",
    label: "Where you can fish",
    detail: "The water this tournament covers.",
  },
] as const;

export function TournamentOverview({ tournamentId }: { tournamentId: string }) {
  const load = useTournament(tournamentId);
  const demoMode = useDemoMode();
  const [entry, setEntry] = useState<DemoEntry | null>(null);
  const [standings, setStandings] = useState<readonly DemoStanding[]>([]);
  const [deviceCatches, setDeviceCatches] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Deferred so nothing is set synchronously inside the effect body, and because these
      // reads touch `localStorage`, which does not exist during the server render.
      await Promise.resolve();
      if (cancelled) return;
      setEntry(demoMode ? getDemoEntry(tournamentId) : null);
      setStandings(demoMode ? getDemoStandings(tournamentId) : []);
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

      {entry ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`} aria-labelledby="your-entry-heading">
          <SectionHeading>
            <span id="your-entry-heading">Your entry</span>
          </SectionHeading>
          <ul className="flex flex-wrap gap-space-2">
            {entrySteps(entry).map((item) => (
              <li key={item.label}>
                <TonePill tone={item.tone}>
                  {item.label}: {item.value}
                </TonePill>
              </li>
            ))}
          </ul>
          <Link href={`/tournaments/${tournament.id}/register`} className="text-caption text-text-link">
            See what each of these means →
          </Link>
        </section>
      ) : null}

      {phase === "before" ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-4`} aria-labelledby="readiness-heading">
          <SectionHeading aside={`${locked.length} of ${READINESS.length} locked`}>
            <span id="readiness-heading">Before it can go live</span>
          </SectionHeading>

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
                detail={tournament[item.key] !== null ? "Locked." : item.detail}
              />
            ))}
          </ul>

          <p className="inline-flex items-start gap-space-2 text-caption text-text-muted">
            <LockIcon size="h-space-4 w-space-4" />
            {ready
              ? "All four are locked. Nothing can change underneath the anglers once fishing starts."
              : "Once locked, these cannot change while the tournament is running. That is what makes a result defensible."}
          </p>
        </section>
      ) : null}

      {standings.length > 0 ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`} aria-labelledby="standings-heading">
          <SectionHeading aside={phase === "after" ? "Official" : "Provisional"}>
            <span id="standings-heading">{phase === "after" ? "Final result" : "Leading"}</span>
          </SectionHeading>
          <ol className="flex flex-col gap-space-2">
            {standings.slice(0, 3).map((row) => (
              <li key={row.rank} className="flex items-center gap-space-3">
                <span className={`text-h3 ${TABULAR} ${row.rank === 1 ? "text-signal-orange" : "text-text-muted"}`}>
                  {row.rank}
                </span>
                <span className="flex-1 text-body text-text-primary">{row.display_name}</span>
                <span className={`text-body-strong ${TABULAR} text-text-primary`}>
                  {row.weight_lb.toFixed(1)} lb
                </span>
              </li>
            ))}
          </ol>
          <Link
            href={`/tournaments/${tournament.id}/leaderboard`}
            className={`${FOCUS_RING} inline-flex min-h-touch-floor items-center gap-space-2 text-label text-text-link`}
          >
            <TrophyIcon />
            Full standings
          </Link>
        </section>
      ) : null}

      <section className="grid gap-space-3 sm:grid-cols-2" aria-label="Tournament details">
        <DetailCard label="Lines in" value={formatDateTime(tournament.starts_at) ?? "Not set yet"} />
        <DetailCard label="Lines out" value={formatDateTime(tournament.ends_at) ?? "Not set yet"} />
        <DetailCard label="Who can see it" value={visibility.label} hint={visibility.blurb} />
        <DetailCard
          label="Catches on this phone"
          value={String(deviceCatches)}
          hint="Recorded here, whether or not they have reached the scorer yet."
        />
      </section>

      {/*
        Organizer tools, as one card rather than a sixth tab. An angler fishing this
        tournament has no use for the word "operations" and should not have to scroll past
        it every time they open the standings (UX-001 §7).
      */}
      <Link
        href={`/tournaments/${tournament.id}/operations`}
        className={`${CARD} ${FOCUS_RING} flex items-center gap-space-3 p-space-4 transition-colors hover:border-border-interactive`}
      >
        <span className="flex flex-1 flex-col gap-space-1">
          <span className="text-body-strong text-text-primary">Run the event</span>
          <span className="text-caption text-text-muted">
            Entries, the review queue, standings and the money — each behind its own permission.
          </span>
        </span>
        <ChevronIcon className="text-text-muted" />
      </Link>

      {demoMode ? <DemoNote /> : null}
    </div>
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

/**
 * The one big control, chosen by state.
 *
 * Exactly one primary action per screen (`docs/design/03-touch-and-interaction.md` §1), and
 * it is whatever the tournament's current state makes most likely: enter it while entries
 * are open, log a catch while it is being fished, look at the result once it is over.
 */
function PrimaryAction({
  tournament,
  entry,
  phase,
}: {
  tournament: { readonly id: string; readonly status: string };
  entry: DemoEntry | null;
  phase: "before" | "during" | "after";
}) {
  if (phase === "during") {
    return (
      <Link href={`/tournaments/${tournament.id}/catches`} className={BIG_ACTION}>
        Log a catch
      </Link>
    );
  }

  if (phase === "after") {
    return (
      <Link href={`/tournaments/${tournament.id}/leaderboard`} className={BIG_ACTION}>
        See the result
      </Link>
    );
  }

  if (tournament.status === "REGISTRATION_OPEN") {
    return (
      <Link href={`/tournaments/${tournament.id}/register`} className={BIG_ACTION}>
        {entry ? "Your entry" : "Enter this tournament"}
      </Link>
    );
  }

  if (tournament.status === "DRAFT") {
    return (
      <Link href={`/tournaments/${tournament.id}/operations`} className={BIG_ACTION}>
        Finish setting it up
      </Link>
    );
  }

  return (
    <Link href={`/tournaments/${tournament.id}/rules`} className={SECONDARY_BUTTON}>
      Read the rules
    </Link>
  );
}
