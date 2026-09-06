"use client";

import { useEffect, useState } from "react";

import { formatMoney, payoutBreakdown, poolFor, type FormatCategory } from "@/core/tournaments/formats";
import {
  boardName,
  boardSubtitle,
  fieldSummary,
  scoreboardFor,
  scoreLabel,
  speciesName,
  type CategoryStanding,
} from "../field";
import { tournamentPhase } from "../format";
import { getDemoTournamentCatches, type DemoTournamentCatch } from "../live-catch-demo";
import { useField } from "../use-field";
import { useFormat } from "../use-format";
import { useDemoMode, useTournament } from "../use-tournament";
import { CARD, CARD_PADDED, CHIP, CHIP_OFF, CHIP_ON, INSET, PAGE, SECONDARY_BUTTON, TABULAR } from "../ui-classes";
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
 * The board a tournament has before its host has chosen a format: heaviest fish, anything
 * counts, no pot. Every event has at least this one, so the screen has one code path.
 */
const IMPLIED_CATEGORY: FormatCategory = {
  id: "overall",
  name: "Heaviest fish",
  family: "BIGGEST_FISH",
  species: [],
  speciesPoints: {},
  bestN: null,
  payout: { model: "NONE", split: [] },
  entryFeeMinor: null,
};

function ordinal(rank: number): string {
  const suffix = rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
  return `${rank}${suffix}`;
}

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
  const formatLoad = useFormat(
    load.state === "ready" ? load.tournament : { id: tournamentId, active_scoring_version_id: null },
  );
  const demoMode = useDemoMode();
  const [mine, setMine] = useState<readonly DemoTournamentCatch[]>([]);
  const [bigScreen, setBigScreen] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);

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
  const field = fieldLoad.state === "ready" ? fieldLoad.field : [];

  /*
    Every board on this screen is one category's board. A tournament with no format saved
    yet still has one — the implied "heaviest fish, anything counts" — so the screen never
    has to carry a second, formatless code path.
  */
  const format = formatLoad.state === "ready" ? formatLoad.format : null;
  const categories: readonly FormatCategory[] = format?.categories ?? [IMPLIED_CATEGORY];
  const category = categories.find((item) => item.id === categoryId) ?? categories[0];
  const currency = format?.currency ?? "USD";

  const ranked = scoreboardFor(field, category);
  // Entries still in the tournament, not every row ever created: a withdrawn boat does not
  // pay into the pot, and a pot that counts one is money the organizer does not have.
  const pool = poolFor(category, fieldSummary(field).entered);
  const payouts = payoutBreakdown({ poolMinor: pool, payout: category.payout, placesFilled: ranked.length });

  if (bigScreen) {
    return (
      <BigScreenBoard
        ranked={ranked}
        category={category}
        name={tournament.name}
        official={official}
        onExit={() => setBigScreen(false)}
      />
    );
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

      {/*
        One row of chips per category. A Bisbee's-shaped event has three or four boards and
        they are genuinely different competitions — the marlin board and the tuna board
        share nothing but the entry list.
      */}
      {categories.length > 1 ? (
        <nav aria-label="Categories">
          <ul className="flex flex-wrap gap-space-2">
            {categories.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={item.id === category.id}
                  onClick={() => setCategoryId(item.id)}
                  className={`${CHIP} ${item.id === category.id ? CHIP_ON : CHIP_OFF}`}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {payouts.length > 0 ? (
        <p className={`${INSET} text-caption text-text-muted`}>
          <span className="text-text-primary">
            {formatMoney(pool, currency)} in {category.name.toLowerCase()}
          </span>{" "}
          if every entry pays — {payouts
            .map((slice) => `${ordinal(slice.rank)} ${formatMoney(slice.amountMinor, currency)}`)
            .join(", ")}
          . Nothing has been collected: the app is not taking payments yet.
        </p>
      ) : null}

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
                    {categories.length > 1 ? ` · ${category.name}` : ""}
                  </span>
                  <span className="text-h2 text-text-primary">{boardName(leader)}</span>
                  {boardSubtitle(leader) ? (
                    <span className="text-caption text-text-muted">{boardSubtitle(leader)}</span>
                  ) : null}
                </span>
                <span className="flex flex-col items-end">
                  <span className={`text-h1 ${TABULAR} text-signal-orange`}>
                    {scoreLabel(category, leader.score).split(" ")[0]}
                  </span>
                  <span className="text-caption text-text-muted">
                    {scoreLabel(category, leader.score).split(" ")[1]}
                  </span>
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
                      {[speciesName(row.species), row.awaitingReview ? "waiting on a review" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className={`text-body-strong ${TABULAR} text-text-primary`}>
                    {scoreLabel(category, row.score)}
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
  category,
  name,
  official,
  onExit,
}: {
  ranked: readonly CategoryStanding[];
  category: FormatCategory;
  name: string;
  official: boolean;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-col gap-space-5">
      <div className="flex flex-wrap items-center justify-between gap-space-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-caption tracking-station text-text-muted uppercase">
            {official ? "Final result" : "Live standings"} · {category.name}
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
              {scoreLabel(category, row.score).split(" ")[0]}
              <span className="text-caption text-text-muted sm:text-h3">
                {" "}
                {scoreLabel(category, row.score).split(" ")[1]}
              </span>
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
