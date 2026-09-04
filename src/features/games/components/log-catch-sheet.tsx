"use client";

import { useMemo, useState } from "react";

import { SPECIES, speciesById } from "@/core/ontology/species";
import { localDateOf } from "@/core/rules/catch/rules";
import type { EventDisposition, GameParticipant, GameSession } from "@/core/rules/games/types";
import { useGuardedAction } from "../use-guard";
import { logHostCatch } from "../host-catch";
import { legalForGameCatch, legalWarning } from "../legal";
import { logGameCatch } from "../store";
import {
  CARD_CLASS,
  CHIP_CLASS,
  CHIP_OFF,
  CHIP_ON,
  INPUT_CLASS,
  PARTICIPANT_CLASSES,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "../ui-classes";

/**
 * Logging a fish during a game.
 *
 * Deliberately shorter than the full catch form. Three people are hauling fish at once
 * and the phone is being passed around wet — who, what, and back or in the box. Everything
 * else is optional, and the host can send their own fish to their real log with one tap
 * (ADR 009 §1), which is the only path by which a game catch ever becomes a `catch` row.
 *
 * The submit button disables itself for the duration of the write. That plus the event's
 * client-minted id is the double-tap protection: the fold folds an id once, so even a
 * duplicated write scores once.
 */
export function LogCatchSheet({
  session,
  participants,
  onDone,
}: {
  session: GameSession;
  participants: readonly GameParticipant[];
  onDone: () => void;
}) {
  const [participantId, setParticipantId] = useState(participants[0]?.id ?? "");
  const [speciesId, setSpeciesId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [lengthIn, setLengthIn] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [disposition, setDisposition] = useState<EventDisposition>("released");
  const [personalBest, setPersonalBest] = useState(false);
  const [newSpecies, setNewSpecies] = useState(false);
  const [alsoLog, setAlsoLog] = useState(false);
  const { busy, run } = useGuardedAction();

  const player = participants.find((p) => p.id === participantId) ?? null;
  const localDate = localDateOf(new Date().toISOString(), session.zone);
  const legal = useMemo(() => legalForGameCatch(speciesId, localDate), [speciesId, localDate]);
  const warning = legalWarning(legal);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = SPECIES.filter((s) => s.takeStatus !== "protected" || q.length > 0);
    if (q.length === 0) return pool.slice(0, 12);
    return pool.filter((s) => s.commonName.toLowerCase().includes(q)).slice(0, 12);
  }, [query]);

  async function save(): Promise<void> {
    if (participantId === "") return;
    await run(async () => {
      /*
        The host's own fish, if they asked for it, goes to their real log first, and the
        game event then references that catch by id.

        Order matters and is the opposite of what you would guess. The catch is written
        first so the event can carry its id, which is what ADR 009 means by "references
        rather than duplicates" — one fish, one factual record. If minting the catch fails
        the game event still lands with a null `catch_id`, because the game must never lose
        a fish over a bookkeeping convenience.
      */
      const catchId =
        alsoLog && player !== null ? await logHostCatch(player, {
          speciesId,
          speciesOther: speciesId === null && query.trim().length > 0 ? query.trim() : null,
          lengthMm: inchesToMm(lengthIn),
          weightG: poundsToGrams(weightLb),
          disposition,
        }) : null;

      await logGameCatch({
        sessionId: session.id,
        participantId,
        speciesId,
        speciesOther: speciesId === null && query.trim().length > 0 ? query.trim() : null,
        lengthMm: inchesToMm(lengthIn),
        weightG: poundsToGrams(weightLb),
        disposition,
        personalBest,
        newSpecies,
        legal,
        catchId,
      });
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-space-5">
      <section className="flex flex-col gap-space-2">
        <h3 className="text-body-strong text-text-primary">Who caught it?</h3>
        <ul className="flex flex-wrap gap-space-2">
          {participants.map((p) => {
            const on = p.id === participantId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setParticipantId(p.id)}
                  className={`${CHIP_CLASS} flex items-center gap-space-2 ${on ? CHIP_ON : CHIP_OFF}`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-space-3 rounded-full ${PARTICIPANT_CLASSES[p.color_key]?.dot ?? "bg-text-link"}`}
                  />
                  {p.display_name}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-space-2">
        <label htmlFor="game-species" className="text-body-strong text-text-primary">
          What was it?
        </label>
        <input
          id="game-species"
          value={speciesId ? (speciesById(speciesId)?.commonName ?? "") : query}
          onChange={(e) => {
            setSpeciesId(null);
            setQuery(e.target.value);
          }}
          placeholder="Start typing, or leave it and name it later"
          autoComplete="off"
          className={INPUT_CLASS}
        />
        {/*
          Once a fish is chosen the list collapses to just that fish.

          Leaving the twelve suggestions on screen pushed "Kept or released?" and the save
          button most of a screen further down at 320px, which is the width this has to work
          at — and every one of those chips was a way to change the answer by accident with a
          wet thumb. Tapping the chosen fish reopens the list.
        */}
        <ul className="flex flex-wrap gap-space-2">
          {(speciesId === null ? matches : SPECIES.filter((s) => s.id === speciesId)).map((s) => {
            const on = s.id === speciesId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    if (on) {
                      setSpeciesId(null);
                      setQuery("");
                    } else {
                      setSpeciesId(s.id);
                      setQuery("");
                    }
                  }}
                  className={`${CHIP_CLASS} ${on ? CHIP_ON : CHIP_OFF}`}
                >
                  {s.commonName}
                  {on ? " ✕" : ""}
                </button>
              </li>
            );
          })}
        </ul>
        {speciesId === null ? (
          <p className="text-caption text-text-muted">
            No species yet means no points yet — log it now and name it when the boat settles.
          </p>
        ) : null}
      </section>

      {warning ? (
        <p className={`${CARD_CLASS} border-amber-flag p-space-3 text-body text-amber-flag`} role="status">
          {warning}
        </p>
      ) : null}

      <section className="flex flex-col gap-space-2">
        <h3 className="text-body-strong text-text-primary">Kept or released?</h3>
        <div className="flex gap-space-2">
          {(["released", "kept"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={disposition === value}
              onClick={() => setDisposition(value)}
              className={`${CHIP_CLASS} flex-1 ${disposition === value ? CHIP_ON : CHIP_OFF}`}
            >
              {value === "released" ? "Released" : "Kept"}
            </button>
          ))}
        </div>
        <p className="text-caption text-text-muted">
          Releasing never costs points. A fish never has to be killed to score.
        </p>
      </section>

      <section className="flex gap-space-3">
        <label className="flex flex-1 flex-col gap-space-1 text-body text-text-primary">
          Length (in)
          <input
            type="number"
            inputMode="decimal"
            value={lengthIn}
            onChange={(e) => setLengthIn(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-1 flex-col gap-space-1 text-body text-text-primary">
          Weight (lb)
          <input
            type="number"
            inputMode="decimal"
            value={weightLb}
            onChange={(e) => setWeightLb(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
      </section>

      <section className="flex flex-wrap gap-space-2">
        <Flag label="Personal best" on={personalBest} onChange={setPersonalBest} />
        <Flag label="New species for them" on={newSpecies} onChange={setNewSpecies} />
      </section>

      {player?.is_host ? (
        <button
          type="button"
          role="switch"
          aria-checked={alsoLog}
          onClick={() => setAlsoLog((on) => !on)}
          className={`${CARD_CLASS} flex min-h-touch-floor items-center justify-between gap-space-3 p-space-3 text-left ${
            alsoLog ? "border-signal-orange" : ""
          }`}
        >
          <span className="flex flex-col">
            <span className="text-body text-text-primary">Also add to my own log</span>
            <span className="text-caption text-text-muted">
              Only your fish. Everyone else&apos;s stays in the game and never touches your Passport.
            </span>
          </span>
          <span className={`text-label ${alsoLog ? "text-signal-orange" : "text-text-muted"}`}>
            {alsoLog ? "On" : "Off"}
          </span>
        </button>
      ) : null}

      <div className="flex flex-col gap-space-3">
        <button type="button" disabled={busy || participantId === ""} onClick={() => void save()} className={`${PRIMARY_BUTTON} disabled:opacity-disabled`}>
          {busy ? "Saving…" : "Save the fish"}
        </button>
        <button type="button" onClick={onDone} className={SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Flag({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`${CHIP_CLASS} ${on ? CHIP_ON : CHIP_OFF}`}
    >
      {label}
    </button>
  );
}

/** Both return null for blank or nonsense, so an empty box never writes a zero-inch fish. */
function inchesToMm(raw: string): number | null {
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 25.4) : null;
}

function poundsToGrams(raw: string): number | null {
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 453.592) : null;
}
