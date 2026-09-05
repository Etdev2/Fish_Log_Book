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
 * live and the phone went to sleep. With nothing running it is a plain card — present,
 * tappable, and not competing with the catch button.
 *
 * The resting state was a single line of muted text until 2026-09-04, on the reasoning
 * that Boat Games must not shout at somebody who only came to log a fish. That was wrong
 * in a way worth recording: sitting above the "Fish Log" heading with no border and no
 * background, it read as a page subtitle rather than a destination, and the founder — who
 * had just watched the feature being built — went looking for it twice and could not find
 * it. Restraint is right; invisibility is not the same thing. A bordered card with the
 * name on its own line is still quiet, and can actually be seen.
 */
export function GamesEntry() {
  const games = useGames();
  if (!games.hydrated) return null;

  const running = unfinishedGames(games).filter((s) => s.status !== "draft");
  const active = running[0];

  if (!active) {
    return (
      <div className="px-space-4">
        <Link
          href="/games"
          className={`${CARD_CLASS} flex min-h-touch-floor items-center justify-between gap-space-3 p-space-4`}
        >
          <span className="flex flex-col">
            <span className="text-body-strong text-text-primary">Boat Games</span>
            <span className="text-caption text-text-muted">
              Play against the crew — no signal needed
            </span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-body text-signal-orange">
            →
          </span>
        </Link>
      </div>
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
