"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { speciesById } from "@/core/ontology/species";
import type { ScoredEvent } from "@/core/rules/games/scoring";
import { explainRules } from "./game-settings";
import { formatRemaining, modeName, pointsLabel } from "../format";
import {
  advanceRound,
  finishGame,
  gameView,
  lastUndoableEvent,
  pauseGame,
  resumeGame,
  undoEvent,
  useGames,
} from "../store";
import { LogCatchSheet } from "./log-catch-sheet";
import { useGuardedAction } from "../use-guard";
import { useNow, useOnline } from "../use-now";
import {
  BIG_ACTION,
  CARD_CLASS,
  DANGER_BUTTON,
  PARTICIPANT_CLASSES,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "../ui-classes";

type Panel = "none" | "log" | "review" | "rules";

/**
 * /games/[id] — the live game.
 *
 * Ordered by what has to be readable at arm's length on a moving boat: scores first and
 * large, then the one action that matters, then everything else. Most fishing games do
 * not take turns — everybody can hook up at once — so there is deliberately no turn
 * indicator here; that belongs only to a mode built around turns, and none of the three
 * are.
 *
 * Every number on this screen is folded from the event log on render (ADR 009 §3).
 * Nothing is cached, so undo cannot leave a stale total behind.
 */
/** Reads the game id from the query string. See `app/(app)/games/play/page.tsx`. */
export function ScoreboardRoute() {
  const id = useSearchParams().get("id");
  if (!id) return <NoSuchGame />;
  return <Scoreboard sessionId={id} />;
}

export function Scoreboard({ sessionId }: { sessionId: string }) {
  const games = useGames();
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>("none");
  const { busy, run } = useGuardedAction();

  const view = gameView(games, sessionId);

  if (!games.hydrated) {
    return <p className="p-space-5 text-body text-text-muted">Opening the game…</p>;
  }
  if (!view) return <NoSuchGame />;

  const { session, participants, standings } = view;
  const paused = session.status === "paused";
  const undoable = lastUndoableEvent(games, sessionId);
  const lastScoring = [...standings.events].reverse().find((e) => e.status === "scored" && e.event.kind === "catch");
  const nameOf = (id: string | null) =>
    participants.find((p) => p.id === id)?.display_name ?? "Someone";

  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-5 px-space-4 py-space-4">
      <header className="flex flex-col gap-space-1">
        <div className="flex flex-wrap items-baseline justify-between gap-space-2">
          <h1 className="text-h2 text-text-primary">{session.name}</h1>
          <OfflineBadge />
        </div>
        <p className="text-caption text-text-muted">
          {/* The game's default name IS the mode name, so printing both reads as a stutter. */}
          {session.name === modeName(session.mode) ? "" : modeName(session.mode)}
          {session.rules.rounds.count > 1
            ? `${session.name === modeName(session.mode) ? "" : " · "}${session.rules.rounds.multi_day ? "Day" : "Round"} ${standings.round} of ${session.rules.rounds.count}`
            : ""}
          {paused ? " · Paused" : ""}
        </p>
        {!paused && session.rules.rounds.minutes !== null && session.started_at !== null ? (
          <Countdown startedAt={session.started_at} minutes={session.rules.rounds.minutes} />
        ) : null}
      </header>

      {/*
        Team totals lead when the game has sides. Without this the board reads as four
        individuals and the teams the captain set up have no visible effect on anything,
        which is half a feature — the sides are the thing being played for.
      */}
      {standings.teams.length > 0 ? (
        <>
          <h2 className="text-label text-text-muted">Teams</h2>
          <ol className="flex flex-col gap-space-2" aria-label="Team scores">
          {standings.teams.map((team) => (
            <li
              key={team.team_id}
              className={`${CARD_CLASS} flex items-center justify-between gap-space-3 p-space-4 ${
                team.rank === 1 ? "border-signal-orange" : ""
              }`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-h3 text-text-primary">{team.team_id}</span>
                <span className="text-caption text-text-muted">
                  {team.participant_ids
                    .map((id) => participants.find((p) => p.id === id)?.display_name)
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </span>
              <span className="shrink-0 text-display tabular-nums text-text-primary">{team.points}</span>
            </li>
          ))}
          </ol>
          <h2 className="text-label text-text-muted">Who caught what</h2>
        </>
      ) : null}

      <ol className="flex flex-col gap-space-3">
        {standings.rows.map((standing) => {
          const player = participants.find((p) => p.id === standing.participant_id);
          if (!player) return null;
          const colors = PARTICIPANT_CLASSES[player.color_key] ?? PARTICIPANT_CLASSES["text-link"];
          // In a team game nobody is "leading" — the side is. Highlighting a person there
          // tells the boat the wrong thing about what is being played for.
          const leading =
            standings.teams.length === 0 &&
            standing.participant_id === standings.leader_id &&
            standing.eliminated_round === null;
          return (
            <li
              key={standing.participant_id}
              className={`${CARD_CLASS} flex items-center gap-space-4 p-space-4 ${
                leading ? "border-signal-orange" : ""
              } ${standing.eliminated_round !== null ? "opacity-disabled" : ""}`}
            >
              <span aria-hidden="true" className={`h-space-10 w-space-2 shrink-0 rounded-full ${colors.dot}`} />
              <span className="flex min-w-0 flex-1 flex-col gap-space-1">
                <span className="flex items-baseline gap-space-2">
                  <span className="truncate text-h3 text-text-primary">{player.display_name}</span>
                  {leading ? <span className="shrink-0 text-caption text-signal-orange">Leading</span> : null}
                </span>
                <span className="text-caption text-text-muted">
                  {standing.eliminated_round !== null
                    ? `Out after ${session.rules.rounds.multi_day ? "day" : "round"} ${standing.eliminated_round}`
                    : summaryFor({
                        catches: standing.scoring_catches,
                        species: standing.unique_species.length,
                        released: standing.released,
                        handicap: standing.handicap,
                      })}
                </span>
                {session.rules.cricket !== null ? (
                  <Marks
                    targets={session.rules.cricket.targets}
                    marks={standing.marks}
                    toClose={session.rules.cricket.marks_to_close}
                  />
                ) : null}
              </span>
              <span className="shrink-0 text-display tabular-nums text-text-primary">{standing.points}</span>
            </li>
          );
        })}
      </ol>

      {lastScoring ? (
        <p className={`${CARD_CLASS} p-space-3 text-body text-text-muted`} aria-live="polite">
          Last on the board: {nameOf(lastScoring.event.participant_id)} —{" "}
          {speciesById(lastScoring.event.species_id)?.commonName ?? "a fish"},{" "}
          {pointsLabel(lastScoring.points)}
        </p>
      ) : null}

      {panel === "log" ? (
        <section className={`${CARD_CLASS} p-space-4`} aria-label="Log a fish">
          <LogCatchSheet
            session={session}
            participants={participants.filter((p) => p.removed_at === null)}
            onDone={() => setPanel("none")}
          />
        </section>
      ) : (
        <button type="button" disabled={paused} onClick={() => setPanel("log")} className={`${BIG_ACTION} disabled:opacity-disabled`}>
          {paused ? "Game is paused" : "Log a fish"}
        </button>
      )}

      <div className="flex flex-wrap gap-space-2">
        <button
          type="button"
          disabled={undoable === null || busy}
          onClick={() => undoable && void run(() => undoEvent(sessionId, undoable.id))}
          className={`${SECONDARY_BUTTON} flex-1 disabled:opacity-disabled`}
        >
          Undo last fish
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "review" ? "none" : "review")}
          className={`${SECONDARY_BUTTON} flex-1`}
        >
          Review catches
        </button>
        <button
          type="button"
          onClick={() => setPanel(panel === "rules" ? "none" : "rules")}
          className={`${SECONDARY_BUTTON} flex-1`}
        >
          Game rules
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => (paused ? resumeGame(sessionId) : pauseGame(sessionId)))}
          className={`${SECONDARY_BUTTON} flex-1 disabled:opacity-disabled`}
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      {panel === "review" ? (
        <ReviewList events={standings.events} nameOf={nameOf} onUndo={(id) => void run(() => undoEvent(sessionId, id))} />
      ) : null}

      {panel === "rules" ? (
        <section className={`${CARD_CLASS} flex flex-col gap-space-2 p-space-4`} aria-label="Game rules">
          <h2 className="text-body-strong text-text-primary">How this game works</h2>
          <ul className="flex flex-col gap-space-2">
            {explainRules(session.rules).map((line) => (
              <li key={line} className="text-body text-text-muted">
                {line}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-space-3 border-t border-hairline pt-space-4">
        {standings.round < session.rules.rounds.count ? (
          <button type="button" disabled={busy} onClick={() => void run(() => advanceRound(sessionId))} className={`${PRIMARY_BUTTON} disabled:opacity-disabled`}>
            Close {session.rules.rounds.multi_day ? "day" : "round"} {standings.round}
            {session.rules.elimination !== null ? " and make the cut" : ""}
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await finishGame(sessionId);
              router.push(`/games/result?id=${sessionId}`);
            })
          }
          className={`${DANGER_BUTTON} disabled:opacity-disabled`}
        >
          Finish the game
        </button>
      </div>
    </div>
  );
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

/**
 * The line under a name on the scoreboard.
 *
 * The head start earns its place here: an angler sitting on 5 with no fish caught looks
 * like a bug otherwise, and "where did that come from" is not a question a scoreboard on
 * a moving boat should provoke.
 */
export function summaryFor(standing: {
  catches: number;
  species: number;
  released: number;
  handicap: number;
}): string {
  const parts = [`${standing.catches} fish`, `${standing.species} species`];
  if (standing.released > 0) parts.push(`${standing.released} released`);
  if (standing.handicap !== 0) {
    parts.push(`${standing.handicap > 0 ? "+" : ""}${standing.handicap} head start`);
  }
  return parts.join(" · ");
}

/** Cricket marks as the darts-style row: one slash, a cross, a circled cross. */
function Marks({
  targets,
  marks,
  toClose,
}: {
  targets: readonly string[];
  marks: Readonly<Record<string, number>>;
  toClose: number;
}) {
  return (
    <ul className="flex flex-wrap gap-space-2">
      {targets.map((target) => {
        const held = marks[target] ?? 0;
        const closed = held >= toClose;
        return (
          <li
            key={target}
            className={`text-caption ${closed ? "text-success-green" : "text-text-muted"}`}
          >
            {speciesById(target)?.commonName ?? target}{" "}
            <span className="tabular-nums">
              {closed ? "closed" : `${held}/${toClose}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The timer. A display and nothing more — it never ends a round (ADR 009 §3).
 */
function Countdown({ startedAt, minutes }: { startedAt: string; minutes: number }) {
  const now = useNow();
  // Zero until the store has ticked once, so the server and first client paint agree.
  if (now === 0) return null;
  const endsAt = new Date(startedAt).getTime() + minutes * 60_000;
  return (
    <p className="text-body text-tide-cyan" aria-live="off">
      {formatRemaining(endsAt - now)}
    </p>
  );
}

function OfflineBadge() {
  const online = useOnline();
  if (online) return null;
  return (
    <span className="text-caption text-success-green">
      Offline — the game is saved on this phone
    </span>
  );
}

function ReviewList({
  events,
  nameOf,
  onUndo,
}: {
  events: readonly ScoredEvent[];
  nameOf: (id: string | null) => string;
  onUndo: (eventId: string) => void;
}) {
  const catches = [...events].reverse().filter((e) => e.event.kind === "catch");
  if (catches.length === 0) {
    return <p className="text-body text-text-muted">No fish yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-space-2" aria-label="Every fish in this game">
      {catches.map((scored) => (
        <li key={scored.event.id} className={`${CARD_CLASS} flex items-center gap-space-3 p-space-3`}>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body text-text-primary">
              {nameOf(scored.event.participant_id)} —{" "}
              {speciesById(scored.event.species_id)?.commonName ??
                scored.event.species_other ??
                "Not named yet"}
            </span>
            <span
              className={`text-caption ${
                scored.status === "scored"
                  ? "text-text-muted"
                  : scored.status === "voided"
                    ? "text-text-muted"
                    : "text-amber-flag"
              }`}
            >
              {scored.status === "scored"
                ? pointsLabel(scored.points) +
                  (scored.bonuses.length > 0
                    ? ` · ${scored.bonuses.map((b) => b.kind.replace(/_/g, " ")).join(", ")}`
                    : "")
                : (scored.reason ?? "No points")}
            </span>
          </span>
          {scored.status !== "voided" ? (
            <button type="button" onClick={() => onUndo(scored.event.id)} className={`${SECONDARY_BUTTON} shrink-0`}>
              Undo
            </button>
          ) : (
            <span className="shrink-0 text-caption text-text-muted">Undone</span>
          )}
        </li>
      ))}
    </ul>
  );
}
