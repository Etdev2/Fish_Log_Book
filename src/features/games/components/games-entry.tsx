"use client";

import Link from "next/link";

import { modeName } from "../format";
import { gameView, unfinishedGames, useGames } from "../store";
import { CARD_CLASS } from "../ui-classes";

/**
 * The way into Boat Games from the Fish Log.
 *
 * Lives here rather than inside `features/catches/` so the log screen only has to render
 * one component and neither feature reaches into the other's internals (ADR 005 §3).
 *
 * Two shapes on purpose. With a game running it is an amber card that is hard to walk
 * past, because the likeliest reason this angler opened the app at all is that a game is
 * live and the phone went to sleep. With nothing running it is one quiet line — Boat
 * Games must not shout at somebody who only came to log a fish.
 */
export function GamesEntry() {
  const games = useGames();
  if (!games.hydrated) return null;

  const running = unfinishedGames(games).filter((s) => s.status !== "draft");
  const active = running[0];

  if (!active) {
    return (
      <Link
        href="/games"
        className="flex min-h-touch-floor items-center justify-between gap-space-3 px-space-4 text-body text-text-link"
      >
        <span>Boat Games — play against the crew</span>
        <span aria-hidden="true">→</span>
      </Link>
    );
  }

  const view = gameView(games, active.id);
  const leader = view?.standings.rows.find((r) => r.participant_id === view.standings.leader_id);
  const leaderName = view?.participants.find((p) => p.id === leader?.participant_id)?.display_name;

  return (
    <div className="px-space-4">
      <Link
        href={`/games/play?id=${active.id}`}
        className={`${CARD_CLASS} flex flex-col gap-space-1 border-amber-flag p-space-4`}
      >
        <span className="text-body-strong text-amber-flag">
          {active.status === "paused" ? "A game is paused" : "A game is going"}
        </span>
        <span className="text-body text-text-primary">{active.name}</span>
        <span className="text-caption text-text-muted">
          {modeName(active.mode)}
          {leaderName ? ` · ${leaderName} leading on ${leader?.points ?? 0}` : " · no fish yet"}
        </span>
      </Link>
    </div>
  );
}
