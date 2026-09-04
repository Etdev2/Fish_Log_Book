"use client";

import Link from "next/link";

import { MODES } from "@/core/rules/games/modes";
import { formatWhen, modeName } from "../format";
import {
  finishedGames,
  gameView,
  unfinishedGames,
  useGames,
} from "../store";
import { CARD_CLASS, PARTICIPANT_CLASSES, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../ui-classes";

/**
 * /games — the Boat Games home.
 *
 * Ordered by what somebody standing on a boat actually came here for. An unfinished game
 * is at the top and impossible to miss, because the single most likely reason this screen
 * is open is that a game is already running and the phone went to sleep. "Start a game"
 * comes second. The catalogue of modes — the thing a designer would put first — comes
 * last, because it only matters the first two times.
 *
 * Reached from the Log screen rather than the nav bar: `shell-nav.tsx` documents the
 * measured widths that make a seventh destination a two-row bar on every phone made, and
 * `shell-nav.test.ts` pins the count so adding one is a decision rather than a patch.
 */
export function GamesHome() {
  const games = useGames();
  const unfinished = unfinishedGames(games);
  const finished = finishedGames(games).slice(0, 5);

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-6 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-2">
        <h1 className="text-h1 text-text-primary">Boat Games</h1>
        <p className="text-body text-text-muted">
          Friendly competition for everyone on the boat. No accounts, no signal needed.
        </p>
      </header>

      {!games.available ? (
        <p className={`${CARD_CLASS} p-space-4 text-body text-error-red`}>
          This browser will not let the app save anything, so a game could not be kept.
          Games need on-device storage to survive the phone locking.
        </p>
      ) : null}

      {games.hydrated && unfinished.length > 0 ? (
        <section className="flex flex-col gap-space-3" aria-labelledby="unfinished-heading">
          <h2 id="unfinished-heading" className="text-h3 text-amber-flag">
            {unfinished.length === 1 ? "A game is still going" : `${unfinished.length} games still going`}
          </h2>
          <ul className="flex flex-col gap-space-3">
            {unfinished.map((session) => {
              const view = gameView(games, session.id);
              const leader = view?.standings.rows.find(
                (r) => r.participant_id === view.standings.leader_id,
              );
              const leaderName = view?.participants.find(
                (p) => p.id === leader?.participant_id,
              )?.display_name;
              return (
                <li key={session.id}>
                  <Link
                    href={session.status === "draft" ? `/games/new?resume=${session.id}` : `/games/play?id=${session.id}`}
                    className={`${CARD_CLASS} flex flex-col gap-space-2 border-amber-flag p-space-4`}
                  >
                    <span className="flex flex-wrap items-baseline justify-between gap-space-2">
                      <span className="text-h3 text-text-primary">{session.name}</span>
                      <span className="text-caption text-text-muted">
                        {formatWhen(session.created_at)}
                      </span>
                    </span>
                    <span className="text-body text-text-muted">
                      {modeName(session.mode)}
                      {session.status === "draft"
                        ? " · not started yet"
                        : session.status === "paused"
                          ? " · paused"
                          : leaderName
                            ? ` · ${leaderName} leading on ${leader?.points ?? 0}`
                            : " · no fish yet"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <Link href="/games/new" className={PRIMARY_BUTTON}>
        Start a new game
      </Link>

      {finished.length > 0 ? (
        <section className="flex flex-col gap-space-3" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-h3 text-text-primary">
            Recent results
          </h2>
          <ul className="flex flex-col gap-space-2">
            {finished.map((session) => {
              const view = gameView(games, session.id);
              const winners = (view?.standings.winner_ids ?? [])
                .map((id) => view?.participants.find((p) => p.id === id)?.display_name)
                .filter((name): name is string => Boolean(name));
              return (
                <li key={session.id}>
                  <Link
                    href={`/games/result?id=${session.id}`}
                    className={`${CARD_CLASS} flex flex-col gap-space-1 p-space-4`}
                  >
                    <span className="text-body-strong text-text-primary">{session.name}</span>
                    <span className="text-caption text-text-muted">
                      {winners.length > 0 ? `${winners.join(" and ")} won` : "No winner recorded"}
                      {" · "}
                      {formatWhen(session.completed_at ?? session.created_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {games.crew.length > 0 ? (
        <section className="flex flex-col gap-space-3" aria-labelledby="crew-heading">
          <h2 id="crew-heading" className="text-h3 text-text-primary">
            My crew
          </h2>
          <ul className="flex flex-wrap gap-space-2">
            {games.crew.map((member) => (
              <li
                key={member.id}
                className="flex min-h-touch-floor items-center gap-space-2 rounded-full border border-hairline bg-surface px-4"
              >
                <span
                  aria-hidden="true"
                  className={`size-space-3 rounded-full ${
                    PARTICIPANT_CLASSES[member.color_key]?.dot ?? "bg-text-link"
                  }`}
                />
                <span className="text-label text-text-primary">{member.display_name}</span>
              </li>
            ))}
          </ul>
          <p className="text-caption text-text-muted">
            Saved on this phone so the same crew is two taps next trip.
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-space-3" aria-labelledby="modes-heading">
        <h2 id="modes-heading" className="text-h3 text-text-primary">
          The games
        </h2>
        <ul className="flex flex-col gap-space-3">
          {MODES.map((mode) => (
            <li key={mode.mode} className={`${CARD_CLASS} flex flex-col gap-space-2 p-space-4`}>
              <span className="flex flex-wrap items-baseline justify-between gap-space-2">
                <h3 className="text-body-strong text-text-primary">{mode.name}</h3>
                <span className="text-caption text-text-muted">{mode.duration}</span>
              </span>
              <p className="text-body text-text-muted">{mode.tagline}</p>
              <ul className="flex flex-col gap-space-1">
                {mode.how.map((line) => (
                  <li key={line} className="text-caption text-text-muted">
                    {line}
                  </li>
                ))}
              </ul>
              <Link href={`/games/new?mode=${mode.mode}`} className={`${SECONDARY_BUTTON} self-start`}>
                Play {mode.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
