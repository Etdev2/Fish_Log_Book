"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getDemoStandings, type DemoStanding } from "../demo-store";
import { tournamentPhase } from "../format";
import { getDemoTournamentCatches, type DemoTournamentCatch } from "../live-catch-demo";
import { useDemoMode, useTournament } from "../use-tournament";
import { CARD, CARD_PADDED, INSET, PAGE, SECONDARY_BUTTON, TABULAR } from "../ui-classes";
import { TrophyIcon } from "./icons";
import {
  BackLink,
  DemoNote,
  EmptyState,
  ErrorScreen,
  LoadingScreen,
  SectionHeading,
  TonePill,
  TournamentTabs,
} from "./tournament-chrome";

export function TournamentLeaderboard({ tournamentId }: { tournamentId: string }) {
  const load = useTournament(tournamentId);
  const demoMode = useDemoMode();
  const [standings, setStandings] = useState<readonly DemoStanding[]>([]);
  const [mine, setMine] = useState<readonly DemoTournamentCatch[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setStandings(demoMode ? getDemoStandings(tournamentId) : []);
      setMine(getDemoTournamentCatches(tournamentId));
    })();
    return () => {
      cancelled = true;
    };
  }, [demoMode, tournamentId]);

  if (load.state === "loading") return <LoadingScreen label="Loading standings" />;
  if (load.state === "error") return <ErrorScreen message={load.message} />;

  const tournament = load.tournament;
  const phase = tournamentPhase(tournament.status);
  const official = tournament.status === "FINAL";
  const finished = phase === "after";
  const leader = standings.find((row) => row.rank === 1) ?? null;
  const rest = standings.filter((row) => row !== leader);

  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-space-3">
        <BackLink href={`/tournaments/${tournament.id}/overview`}>Tournament home</BackLink>
        <div className="flex flex-col gap-space-1">
          <span className="text-label text-signal-orange">Step 3 of 3</span>
          <div className="flex flex-wrap items-end justify-between gap-space-3">
            <h1 className="text-h1 text-text-primary">Results</h1>
            <TonePill tone={official ? "done" : "attention"}>{official ? "Official" : "Provisional"}</TonePill>
          </div>
        </div>
        <p className="text-body text-text-muted">
          {official
            ? "The tournament is settled. These are the official final standings."
            : finished
              ? "Fishing is over, but judging is still being settled. Places can still move."
              : "Standings update as catches are approved. Nothing is final until the host closes the event."}
        </p>
      </header>

      <TournamentTabs tournamentId={tournament.id} />

      <ResultsHandoff tournamentId={tournament.id} phase={phase} />

      {standings.length === 0 ? (
        <EmptyState
          title="Nothing has been scored yet"
          body="Approved catches will appear here. A catch saved on a phone is not automatically a score."
          action={
            phase === "during" ? (
              <Link href={`/tournaments/${tournament.id}/catches`} className={SECONDARY_BUTTON}>
                Go to Compete
              </Link>
            ) : undefined
          }
        />
      ) : (
        <section className="flex flex-col gap-space-3" aria-label="Standings">
          {leader ? (
            <article
              className={`${CARD} flex items-center gap-space-4 border-signal-orange/50 bg-linear-to-b from-surface-raised to-surface p-space-5`}
            >
              <span className="text-signal-orange">
                <TrophyIcon size="h-space-8 w-space-8" />
              </span>
              <span className="flex flex-1 flex-col gap-space-1">
                <span className="text-caption text-text-muted">
                  {official ? "Winner" : "Leading"} · {leader.species}
                </span>
                <span className="text-h2 text-text-primary">{leader.display_name}</span>
              </span>
              <span className="flex flex-col items-end">
                <span className={`text-h1 ${TABULAR} text-signal-orange`}>{leader.weight_lb.toFixed(1)}</span>
                <span className="text-caption text-text-muted">lb</span>
              </span>
            </article>
          ) : null}

          <ol className="flex flex-col gap-space-2">
            {rest.map((row) => (
              <li
                key={`${row.rank}-${row.display_name}`}
                className={`${CARD} grid grid-cols-[auto_1fr_auto] items-center gap-space-3 p-space-4`}
              >
                <span className={`w-space-6 text-h3 ${TABULAR} text-text-muted`}>{row.rank}</span>
                <span className="flex flex-col">
                  <span className="text-body-strong text-text-primary">{row.display_name}</span>
                  <span className="text-caption text-text-muted">
                    {row.species}
                    {row.official ? "" : " · waiting on a review"}
                  </span>
                </span>
                <span className={`text-body-strong ${TABULAR} text-text-primary`}>
                  {row.weight_lb.toFixed(1)} lb
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {mine.length > 0 ? (
        <section className={`${CARD_PADDED} flex flex-col gap-space-3`} aria-labelledby="mine-heading">
          <SectionHeading aside={`${mine.length} on this phone`}>
            <span id="mine-heading">Your catch status</span>
          </SectionHeading>
          <p className="text-caption text-text-muted">
            These catches exist on this phone. They only affect the standings after the tournament receives them and a judge approves them.
          </p>
          <ul className="flex flex-col gap-space-2">
            {mine.slice(0, 5).map((item) => (
              <li key={item.id} className={`${INSET} flex items-center justify-between gap-space-3`}>
                <span className="text-body text-text-primary">{item.species}</span>
                <span className={`text-body ${TABULAR} text-text-muted`}>
                  {item.weight_lb !== null ? `${item.weight_lb.toFixed(1)} lb` : "no weight"}
                </span>
              </li>
            ))}
          </ul>
          <Link href={`/tournaments/${tournament.id}/catches`} className={SECONDARY_BUTTON}>
            Review my catches
          </Link>
        </section>
      ) : null}

      <p className="text-caption text-text-muted">
        Public results show names, fish, measurements, and rank. They never expose fishing positions, private evidence, or judge notes.
      </p>

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}

function ResultsHandoff({ tournamentId, phase }: { tournamentId: string; phase: "before" | "during" | "after" }) {
  if (phase === "during") {
    return (
      <section className={`${INSET} flex flex-col gap-space-3`} aria-label="Still competing">
        <div className="flex flex-col gap-space-1">
          <p className="text-body-strong text-text-primary">Still fishing?</p>
          <p className="text-caption text-text-muted">Results are only one part of the live event. Head back to Compete whenever you need to log or review a catch.</p>
        </div>
        <Link href={`/tournaments/${tournamentId}/catches`} className={SECONDARY_BUTTON}>
          Back to Compete
        </Link>
      </section>
    );
  }

  if (phase === "before") {
    return (
      <section className={`${INSET} flex flex-col gap-space-3`} aria-label="Before the tournament">
        <div className="flex flex-col gap-space-1">
          <p className="text-body-strong text-text-primary">The board starts when approved catches arrive</p>
          <p className="text-caption text-text-muted">Before lines in, the important thing is making sure your entry is ready.</p>
        </div>
        <Link href={`/tournaments/${tournamentId}/register`} className={SECONDARY_BUTTON}>
          Check my entry
        </Link>
      </section>
    );
  }

  return null;
}
