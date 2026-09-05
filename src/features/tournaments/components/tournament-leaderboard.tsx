"use client";

import { useEffect, useState } from "react";

import { boardName, boardSubtitle, rankField, type RankedEntry } from "../field";
import { tournamentPhase } from "../format";
import { getDemoTournamentCatches, type DemoTournamentCatch } from "../live-catch-demo";
import { useField } from "../use-field";
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

/**
 * /tournaments/[id]/leaderboard — the board.
 *
 * It reads the same field as the roster (`use-field.ts`), so the board and "who's in" can
 * never disagree. It used to carry three hardcoded names of its own, which is fine until
 * somebody opens both screens in front of you.
 *
 * Three rules hold this screen honest:
 *
 * 1. **Provisional is said out loud.** A rank that could still move is not a result. Only
 *    FINAL gets called official.
 * 2. **Public-safe fields only** (`core/tournaments/public-projection.ts`): a name, a
 *    species, a measurement, a rank. No positions, no evidence, no review notes — a
 *    leaderboard is the one tournament screen that gets screenshotted into a group chat.
 * 3. **A tie is a tie.** Two boats on the same weight share the place (`rankField`), rather
 *    than one being quietly put above the other by row order.
 */
export function TournamentLeaderboard({ tournamentId }: { tournamentId: string }) {
  const load = useTournament(tournamentId);
  const fieldLoad = useField(tournamentId);
  const demoMode = useDemoMode();
  const [mine, setMine] = useState<readonly DemoTournamentCatch[]>([]);
  const [bigScreen, setBigScreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled) setMine(getDemoTournamentCatches(tournamentId));
    })();
    return () => {
      cancelled = true;
    };
  }, [tournamentId]);

  if (load.state === "loading") return <LoadingScreen label="Loading standings" />;
  if (load.state === "error") return <ErrorScreen message={load.message} />;
  if (fieldLoad.state === "error") return <ErrorScreen message={fieldLoad.message} onRetry={fieldLoad.reload} />;

  const tournament = load.tournament;
  const official = tournament.status === "FINAL";
  const finished = tournamentPhase(tournament.status) === "after";
  const ranked = fieldLoad.state === "ready" ? rankField(fieldLoad.field) : [];

  if (bigScreen) {
    return <BigScreenBoard ranked={ranked} name={tournament.name} official={official} onExit={() => setBigScreen(false)} />;
  }

  const leader = ranked[0] ?? null;
  const rest = ranked.slice(1);

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

      {ranked.length === 0 ? (
        <EmptyState
          title="Nothing has been scored yet"
          body="Boats appear here once a judge has approved a catch. A catch on a phone is not a score — that is the point."
        />
      ) : (
        <>
          <section className="flex flex-col gap-space-3" aria-label="Standings">
            {leader ? (
              <article
                className={`${CARD} flex items-center gap-space-4 border-signal-orange/50 bg-linear-to-b from-surface-raised to-surface p-space-5`}
              >
                <span className="text-signal-orange">
                  <TrophyIcon size="h-space-8 w-space-8" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-space-1">
                  <span className="text-caption text-text-muted">
                    {official ? "Winner" : "Leading"}
                    {leader.tied ? " · tied" : ""}
                    {leader.species ? ` · ${leader.species}` : ""}
                  </span>
                  <span className="text-h2 text-text-primary">{boardName(leader)}</span>
                  {boardSubtitle(leader) ? (
                    <span className="text-caption text-text-muted">{boardSubtitle(leader)}</span>
                  ) : null}
                </span>
                <span className="flex flex-col items-end">
                  <span className={`text-h1 ${TABULAR} text-signal-orange`}>
                    {(leader.bestWeightLb ?? 0).toFixed(1)}
                  </span>
                  <span className="text-caption text-text-muted">lb</span>
                </span>
              </article>
            ) : null}

            <ol className="flex flex-col gap-space-2">
              {rest.map((row) => (
                <li
                  key={row.entryId}
                  className={`${CARD} grid grid-cols-[auto_1fr_auto] items-center gap-space-3 p-space-4 ${
                    row.isYou ? "border-signal-orange/50" : ""
                  }`}
                >
                  <span className={`w-space-8 text-h3 ${TABULAR} text-text-muted`}>
                    {row.tied ? `T${row.rank}` : row.rank}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body-strong text-text-primary">
                      {boardName(row)}
                      {row.isYou ? " · you" : ""}
                    </span>
                    <span className="text-caption text-text-muted">
                      {[row.species, row.awaitingReview ? "waiting on a review" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className={`text-body-strong ${TABULAR} text-text-primary`}>
                    {(row.bestWeightLb ?? 0).toFixed(1)} lb
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/*
            The dock television. A tournament's board spends the afternoon on a screen in a
            marina bar with sponsors watching it, which is the single thing every competitor
            in this market leads with, and it costs one button.
          */}
          <button type="button" className={SECONDARY_BUTTON} onClick={() => setBigScreen(true)}>
            Show on a big screen
          </button>
        </>
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

/**
 * The same standings, sized for a room rather than a hand.
 *
 * Ten places, no chrome, type that reads from the back of a bar. It is deliberately the
 * same data and the same ranking as the phone board — a second implementation of "who is
 * winning" is a second answer to it.
 */
function BigScreenBoard({
  ranked,
  name,
  official,
  onExit,
}: {
  ranked: readonly RankedEntry[];
  name: string;
  official: boolean;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-col gap-space-5">
      <div className="flex flex-wrap items-center justify-between gap-space-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-caption tracking-station text-text-muted uppercase">
            {official ? "Final result" : "Live standings"}
          </span>
          <h1 className="text-h1 text-text-primary sm:text-display">{name}</h1>
        </div>
        <button type="button" className={SECONDARY_BUTTON} onClick={onExit}>
          Done
        </button>
      </div>

      {/*
        Sized up at the breakpoint rather than always. A dock television is landscape and
        wide, but this same view opens on the phone that casts to it, and `text-display` on
        all three columns at 390px runs the boat name straight through the weight.
      */}
      <ol className="flex flex-col gap-space-2">
        {ranked.slice(0, 10).map((row) => (
          <li
            key={row.entryId}
            className={`grid grid-cols-[auto_1fr_auto] items-baseline gap-space-3 rounded-lg border p-space-4 sm:gap-space-4 ${
              row.rank === 1 ? "border-signal-orange/60 bg-signal-orange/10" : "border-hairline bg-surface"
            }`}
          >
            <span
              className={`text-h1 sm:text-display ${TABULAR} ${row.rank === 1 ? "text-signal-orange" : "text-text-muted"}`}
            >
              {row.rank}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-h3 text-text-primary sm:text-h1">{boardName(row)}</span>
              {row.species ? (
                <span className="truncate text-caption text-text-muted sm:text-h3">{row.species}</span>
              ) : null}
            </span>
            <span className={`shrink-0 whitespace-nowrap text-h2 sm:text-display ${TABULAR} text-text-primary`}>
              {(row.bestWeightLb ?? 0).toFixed(1)}
              <span className="text-caption text-text-muted sm:text-h3"> lb</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="text-caption text-text-muted">
        {official ? "Official." : "Provisional — places move as catches are approved."}
      </p>
    </div>
  );
}
