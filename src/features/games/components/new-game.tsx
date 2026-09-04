"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { MODES } from "@/core/rules/games/modes";
import { PARTICIPANT_COLORS, type GameMode, type GameRules, type ParticipantColor } from "@/core/rules/games/types";
import { useRegionPreference } from "@/features/settings/region";
import { GameSettings } from "./game-settings";
import { modeName } from "../format";
import {
  addParticipant,
  createGame,
  discardGame,
  participantsOf,
  removeParticipant,
  startGame,
  updateRules,
  useGames,
} from "../store";
import {
  CARD_CLASS,
  CHIP_CLASS,
  CHIP_OFF,
  CHIP_ON,
  DANGER_BUTTON,
  INPUT_CLASS,
  PARTICIPANT_CLASSES,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "../ui-classes";

/**
 * /games/new — pick a game, add the crew, set the rules.
 *
 * The session row is written the instant a mode is chosen, as a `draft`. That is
 * deliberate: setting up a four-player game takes a couple of minutes, and a phone that
 * locks or an app the OS decides to evict must not cost the captain that work. A draft
 * shows on the home screen under "still going" and resumes exactly here.
 */

type Step = "mode" | "players" | "rules";

export function NewGame() {
  const params = useSearchParams();
  const router = useRouter();
  const games = useGames();
  const [regionId] = useRegionPreference();

  const resumeId = params.get("resume");
  const requestedMode = params.get("mode") as GameMode | null;

  const [sessionId, setSessionId] = useState<string | null>(resumeId);
  const [step, setStep] = useState<Step>(resumeId ? "players" : "mode");
  const [busy, setBusy] = useState(false);

  const session = games.sessions.find((s) => s.id === sessionId) ?? null;
  const players = sessionId ? participantsOf(games, sessionId) : [];

  async function chooseMode(mode: GameMode): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      const created = await createGame({
        mode,
        name: modeName(mode),
        // The device's own zone. A game is scored on the boat's clock, like a catch is.
        zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        regionId,
        tripId: null,
      });
      setSessionId(created.id);
      setStep("players");
    } finally {
      setBusy(false);
    }
  }

  async function begin(): Promise<void> {
    if (!sessionId || busy) return;
    setBusy(true);
    try {
      await startGame(sessionId);
      router.push(`/games/play?id=${sessionId}`);
    } finally {
      setBusy(false);
    }
  }

  async function abandon(): Promise<void> {
    if (!sessionId) return;
    await discardGame(sessionId);
    router.push("/games");
  }

  if (step === "mode" || session === null) {
    return (
      <Frame title="Start a game" step={1}>
        <ul className="flex flex-col gap-space-3">
          {(requestedMode ? MODES.filter((m) => m.mode === requestedMode) : MODES).map((mode) => (
            <li key={mode.mode}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void chooseMode(mode.mode)}
                className={`${CARD_CLASS} flex w-full flex-col gap-space-2 p-space-4 text-left disabled:opacity-disabled`}
              >
                <span className="flex flex-wrap items-baseline justify-between gap-space-2">
                  <span className="text-h3 text-text-primary">{mode.name}</span>
                  <span className="text-caption text-text-muted">{mode.duration}</span>
                </span>
                <span className="text-body text-text-muted">{mode.tagline}</span>
              </button>
            </li>
          ))}
        </ul>
        {requestedMode ? (
          <button type="button" onClick={() => router.push("/games/new")} className={SECONDARY_BUTTON}>
            See the other games
          </button>
        ) : null}
      </Frame>
    );
  }

  if (step === "players") {
    return (
      <Frame title="Who is fishing?" step={2} subtitle={modeName(session.mode)}>
        <PlayerSetup sessionId={session.id} />
        <div className="flex flex-col gap-space-3">
          <button
            type="button"
            disabled={players.length < 2}
            onClick={() => setStep("rules")}
            className={`${PRIMARY_BUTTON} disabled:opacity-disabled`}
          >
            {players.length < 2 ? "Add at least two players" : "Next — the rules"}
          </button>
          <button type="button" onClick={() => void abandon()} className={DANGER_BUTTON}>
            Throw this game away
          </button>
        </div>
      </Frame>
    );
  }

  return (
    <Frame title="The rules" step={3} subtitle={modeName(session.mode)}>
      <GameSettings
        rules={session.rules}
        onChange={(next: GameRules) => void updateRules(session.id, next)}
      />
      <div className="flex flex-col gap-space-3">
        <button type="button" disabled={busy} onClick={() => void begin()} className={`${PRIMARY_BUTTON} disabled:opacity-disabled`}>
          Start the game
        </button>
        <button type="button" onClick={() => setStep("players")} className={SECONDARY_BUTTON}>
          Back to the players
        </button>
      </div>
    </Frame>
  );
}

/**
 * Step 2 — the local crew.
 *
 * Nobody needs an account. Every player minted here gets a stable local participant id,
 * and that id is the only thing a game catch ever points at (ADR 009 §1) — which is what
 * keeps a guest's fish out of the phone owner's Passport.
 */
function PlayerSetup({ sessionId }: { sessionId: string }) {
  const games = useGames();
  const players = participantsOf(games, sessionId);
  const [name, setName] = useState("");
  const [handicap, setHandicap] = useState("0");
  const [saveToCrew, setSaveToCrew] = useState(true);
  const [teams, setTeams] = useState(false);
  const [teamNames, setTeamNames] = useState<[string, string]>(["Port", "Starboard"]);

  const takenColors = new Set(players.map((p) => p.color_key));
  const nextColor: ParticipantColor =
    PARTICIPANT_COLORS.find((c) => !takenColors.has(c)) ?? PARTICIPANT_COLORS[0];

  async function add(displayName: string, colorKey: ParticipantColor, handicapPoints: number): Promise<void> {
    const trimmed = displayName.trim();
    if (trimmed.length === 0) return;
    await addParticipant({
      sessionId,
      displayName: trimmed,
      colorKey,
      teamId: teams ? teamNames[players.length % 2] : null,
      handicap: handicapPoints,
      // The first player added is the phone's owner. Only their fish may be offered to
      // their own log; everyone else's stays a game record (ADR 009 §1).
      isHost: players.length === 0,
      saveToCrew,
    });
    setName("");
    setHandicap("0");
  }

  const unadded = games.crew.filter(
    (c) => !players.some((p) => p.display_name.toLowerCase() === c.display_name.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-space-5">
      <div className="flex gap-space-2">
        {[
          { on: !teams, label: "Single players" },
          { on: teams, label: "Teams" },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={option.on}
            onClick={() => setTeams(option.label === "Teams")}
            className={`${CHIP_CLASS} flex-1 ${option.on ? CHIP_ON : CHIP_OFF}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {teams ? (
        <div className="flex flex-col gap-space-2">
          <p className="text-caption text-text-muted">
            Players alternate between the two sides as you add them. Rename either one.
          </p>
          <div className="flex gap-space-2">
            {teamNames.map((teamName, i) => (
              <input
                key={i}
                value={teamName}
                aria-label={`Team ${i + 1} name`}
                onChange={(e) =>
                  setTeamNames((prev) => (i === 0 ? [e.target.value, prev[1]] : [prev[0], e.target.value]))
                }
                className={INPUT_CLASS}
              />
            ))}
          </div>
        </div>
      ) : null}

      {players.length > 0 ? (
        <ul className="flex flex-col gap-space-2">
          {players.map((player) => (
            <li key={player.id} className={`${CARD_CLASS} flex items-center gap-space-3 p-space-3`}>
              <span
                aria-hidden="true"
                className={`size-space-4 shrink-0 rounded-full ${PARTICIPANT_CLASSES[player.color_key]?.dot ?? "bg-text-link"}`}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body-strong text-text-primary">
                  {player.display_name}
                  {player.is_host ? " (you)" : ""}
                </span>
                <span className="text-caption text-text-muted">
                  {[
                    player.team_id,
                    player.handicap_points !== 0 ? `${player.handicap_points > 0 ? "+" : ""}${player.handicap_points} start` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No handicap"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void removeParticipant(player.id)}
                className={`${SECONDARY_BUTTON} shrink-0`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {unadded.length > 0 ? (
        <section className="flex flex-col gap-space-2">
          <h3 className="text-body-strong text-text-primary">From my crew</h3>
          <ul className="flex flex-wrap gap-space-2">
            {unadded.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => void add(member.display_name, nextColor, member.default_handicap)}
                  className={`${CHIP_CLASS} ${CHIP_OFF}`}
                >
                  + {member.display_name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form
        className="flex flex-col gap-space-3"
        onSubmit={(e) => {
          e.preventDefault();
          void add(name, nextColor, Number.parseInt(handicap, 10) || 0);
        }}
      >
        <label htmlFor="player-name" className="text-body-strong text-text-primary">
          Add a player
        </label>
        <input
          id="player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={players.length === 0 ? "Your name" : "Their name"}
          autoComplete="off"
          className={INPUT_CLASS}
        />
        <div className="flex items-center gap-space-3">
          <label htmlFor="player-handicap" className="flex-1 text-body text-text-primary">
            Head start
            <span className="block text-caption text-text-muted">
              Points on the board before the first fish. Leave at zero for an even game.
            </span>
          </label>
          <input
            id="player-handicap"
            type="number"
            inputMode="numeric"
            value={handicap}
            onChange={(e) => setHandicap(e.target.value)}
            className={`${INPUT_CLASS} w-space-16 text-center`}
          />
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={saveToCrew}
          onClick={() => setSaveToCrew((on) => !on)}
          className={`${CARD_CLASS} flex min-h-touch-floor items-center justify-between gap-space-3 p-space-3 text-left ${
            saveToCrew ? "border-signal-orange" : ""
          }`}
        >
          <span className="text-body text-text-primary">Remember them for next trip</span>
          <span className={`text-label ${saveToCrew ? "text-signal-orange" : "text-text-muted"}`}>
            {saveToCrew ? "On" : "Off"}
          </span>
        </button>
        <button type="submit" disabled={name.trim().length === 0} className={`${SECONDARY_BUTTON} disabled:opacity-disabled`}>
          Add player
        </button>
      </form>
    </div>
  );
}

function Frame({
  title,
  subtitle,
  step,
  children,
}: {
  title: string;
  subtitle?: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-reading flex-col gap-space-6 px-space-4 py-space-5">
      <header className="flex flex-col gap-space-1">
        <p className="text-caption text-text-muted">
          Step {step} of 3{subtitle ? ` · ${subtitle}` : ""}
        </p>
        <h1 className="text-h1 text-text-primary">{title}</h1>
      </header>
      {children}
    </div>
  );
}
