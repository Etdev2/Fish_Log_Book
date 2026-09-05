"use client";

import { useEffect, useState } from "react";

import { getDemoStandings, type DemoStanding } from "../demo-store";
import { tournamentPhase } from "../format";
import { getDemoTournamentCatches, type DemoTournamentCatch } from "../live-catch-demo";
import { useDemoMode, useTournament } from "../use-tournament";
import { CARD, CARD_PADDED, INSET, PAGE, TABULAR } from "../ui-classes";
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

/**
 * /tournaments/[id]/leaderboard — the board.
 *
 * This used to be the "Leaderboard" tab of the operations screen, which meant an angler
 * who wanted to know whether they were winning had to open a screen headed "Tournament
 * operations" and sit next to the payout controls. Standings are the most-looked-at screen
 * in any tournament and they belong to everybody, so they are their own place now.
 *
 * Two rules hold this screen honest:
 *
 * 1. **Provisional is said out loud.** A rank that could still move is not presented as a
 *    result. Only FINAL gets called official.
 * 2. **Public-safe fields only** (`core/tournaments/public-projection.ts`): a name, a
 *    species, a measurement, a rank. No positions, no evidence, no review notes — not
 *    because they are secret, but because a leaderboard is the one tournament screen that
 *    gets screenshotted and sent to a group chat.
 */
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
  const official = tournament.status === "FINAL";
  const finished = tournamentPhase(tournament.status) === "after";
  const leader = standings.find((row) => row.rank === 1) ?? null;
  const rest = standings.filter((row) => row !== leader);

  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-space-3">
        <BackLink href={`/tournaments/${tournament.id}/overview`}>{tournament.name}</BackLink>
        <div className="flex flex-wrap items-end justify-between gap-space-3">
          <h1 className="text-h1 text-text-primary">Standings</h1>
          <TonePill tone={official ? "done" : "attention"}>{official ? "Official" : "Provisional"}</TonePill>
        </div>
        <p className="text-body text-text-muted">
          {official
            ? "Every review is closed. This is the result."
            : finished
              ? "Fishing is over, but reviews are still open. Places can still move."
              : "Places move as catches are approved. Nothing here is final until the organizer says so."}
        </p>
      </header>

      <TournamentTabs tournamentId={tournament.id} />

      {standings.length === 0 ? (
        <EmptyState
          title="Nothing has been scored yet"
          body="Catches appear here once a judge has approved them. A catch on a phone is not a score — that is the point."
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
            <span id="mine-heading">Your catches, not yet scored</span>
          </SectionHeading>
          <p className="text-caption text-text-muted">
            These are on this phone. They are not on the board until the tournament has them and a
            judge has approved them.
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
        </section>
      ) : null}

      <p className="text-caption text-text-muted">
        A public board shows a name, the fish, and the measurement. It never shows where anybody was
        fishing, their photos, or anything a judge wrote.
      </p>

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}
