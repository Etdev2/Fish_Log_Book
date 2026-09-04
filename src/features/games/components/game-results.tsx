"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { speciesById } from "@/core/ontology/species";
import { awards, biggestFish } from "@/core/rules/games/results";
import { formatWhen, modeName, pointsLabel } from "../format";
import { summaryFor } from "./scoreboard";
import { gameView, rematch, useGames } from "../store";
import { CARD_CLASS, PARTICIPANT_CLASSES, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../ui-classes";

/**
 * /games/[id]/results — how it finished.
 *
 * Four awards, not ten. The founder's handoff listed biggest fish, most species, most
 * valuable catch, best comeback, slams and a released total; comeback and most-valuable
 * were held back deliberately (see `core/rules/games/results.ts`) because a results
 * screen nobody reads to the bottom is worse than a short one they do. They are one
 * function each away when a real game asks for them.
 */
/** Reads the game id from the query string. See `app/(app)/games/result/page.tsx`. */
export function GameResultsRoute() {
  const id = useSearchParams().get("id");
  if (!id) return <NoSuchGame />;
  return <GameResults sessionId={id} />;
}

function NoSuchGame() {
  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-4 p-space-5">
      <p className="text-body text-text-primary">That game is not on this phone.</p>
      <Link href="/games" className={SECONDARY_BUTTON}>
        Back to Boat Games
      </Link>
    </div>
  );
}

export function GameResults({ sessionId }: { sessionId: string }) {
  const games = useGames();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const view = gameView(games, sessionId);

  if (!games.hydrated) {
    return <p className="p-space-5 text-body text-text-muted">Reading the scorecard…</p>;
  }
  if (!view) return <NoSuchGame />;

  const { session, participants, standings } = view;
  const nameOf = (id: string | null) =>
    participants.find((p) => p.id === id)?.display_name ?? "Someone";
  const winners = standings.winner_ids.length > 0
    ? standings.winner_ids
    : standings.rows.slice(0, 1).map((r) => r.participant_id);
  const biggest = biggestFish(standings);
  const scoredCatches = standings.events.filter(
    (e) => e.event.kind === "catch" && e.status === "scored",
  );

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-6 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-2">
        <p className="text-caption text-text-muted">
          {modeName(session.mode)} · {formatWhen(session.completed_at ?? session.created_at)}
        </p>
        <h1 className="text-h1 text-text-primary">
          {winners.length === 0
            ? "No winner"
            : winners.length === 1
              ? `${nameOf(winners[0])} wins`
              : `${winners.map(nameOf).join(" and ")} share it`}
        </h1>
      </header>

      <section className="flex flex-col gap-space-3" aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="text-h3 text-text-primary">
          Final standings
        </h2>
        <ol className="flex flex-col gap-space-2">
          {standings.rows.map((row) => {
            const player = participants.find((p) => p.id === row.participant_id);
            if (!player) return null;
            const colors = PARTICIPANT_CLASSES[player.color_key] ?? PARTICIPANT_CLASSES["text-link"];
            return (
              <li key={row.participant_id} className={`${CARD_CLASS} flex items-center gap-space-3 p-space-4`}>
                <span className="w-space-6 shrink-0 text-h3 tabular-nums text-text-muted">{row.rank}</span>
                <span aria-hidden="true" className={`size-space-3 shrink-0 rounded-full ${colors.dot}`} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-strong text-text-primary">{player.display_name}</span>
                  <span className="text-caption text-text-muted">
                    {summaryFor(row)}
                    {row.eliminated_round !== null
                      ? ` · out after ${session.rules.rounds.multi_day ? "day" : "round"} ${row.eliminated_round}`
                      : ""}
                  </span>
                </span>
                <span className="shrink-0 text-h2 tabular-nums text-text-primary">{row.points}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-space-3" aria-labelledby="awards-heading">
        <h2 id="awards-heading" className="text-h3 text-text-primary">
          Worth mentioning
        </h2>
        <ul className="flex flex-col gap-space-2">
          {awards(standings, participants).map((award) => (
            <li key={award.kind} className={`${CARD_CLASS} flex items-baseline justify-between gap-space-3 p-space-3`}>
              <span className="text-body text-text-muted">{award.label}</span>
              <span className="text-body-strong text-text-primary">
                {award.kind === "biggest_fish" && biggest
                  ? `${award.detail} · ${speciesById(biggest.event.species_id)?.commonName ?? "a fish"}`
                  : award.detail}
              </span>
            </li>
          ))}
          {awards(standings, participants).length === 0 ? (
            <li className="text-body text-text-muted">Nothing measured, nothing released. Next time.</li>
          ) : null}
        </ul>
      </section>

      <section className="flex flex-col gap-space-3" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-h3 text-text-primary">
          How it went
        </h2>
        {scoredCatches.length === 0 ? (
          <p className="text-body text-text-muted">No fish were scored in this one.</p>
        ) : (
          <ol className="flex flex-col gap-space-2">
            {scoredCatches.map((scored) => (
              <li key={scored.event.id} className="flex items-baseline justify-between gap-space-3">
                <span className="min-w-0 flex-1 truncate text-body text-text-primary">
                  {nameOf(scored.event.participant_id)} —{" "}
                  {speciesById(scored.event.species_id)?.commonName ?? "a fish"}
                </span>
                <span className="shrink-0 text-caption tabular-nums text-text-muted">
                  {pointsLabel(scored.points)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="flex flex-col gap-space-3">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void (async () => {
              setBusy(true);
              try {
                const next = await rematch(sessionId);
                if (next) router.push(`/games/new?resume=${next.id}`);
              } finally {
                setBusy(false);
              }
            })()
          }
          className={`${PRIMARY_BUTTON} disabled:opacity-disabled`}
        >
          Rematch — same crew, same rules
        </button>
        <Link href="/games" className={SECONDARY_BUTTON}>
          Back to Boat Games
        </Link>
      </div>
    </div>
  );
}
