"use client";

import { useSyncExternalStore } from "react";

import { speciesById } from "@/core/ontology/species";
import { defaultsFor } from "@/core/rules/games/modes";
import { score, type GameStandings, type ScoringContext } from "@/core/rules/games/scoring";
import type {
  CrewMember,
  EventDisposition,
  EventLegalSnapshot,
  GameEvent,
  GameEventKind,
  GameMode,
  GameParticipant,
  GameRules,
  GameSession,
  GameTeam,
  ParticipantColor,
} from "@/core/rules/games/types";
import { uuidv7 } from "@/core/sync/uuid";
import {
  allLocalRows,
  commitLocal,
  deleteLocalRow,
  isIndexedDbAvailable,
  type LocalStore,
  type StoredRow,
} from "@/lib/offline/db";

/**
 * Boat Games' read model and write path (ADR 009).
 *
 * The same shape as `features/catches/store.ts` — one in-memory snapshot hydrated from
 * IndexedDB and republished on every write, read through `useSyncExternalStore` with an
 * empty server snapshot so SSR and the first client paint agree.
 *
 * What is deliberately different: nothing here touches the outbox. A Phase 1 game is
 * device-local, and queuing it for a table that does not exist would light up the backup
 * warning for a game that is working perfectly (ADR 009 §2).
 *
 * The scoreboard is never stored. Every read folds the events (ADR 009 §3), which is why
 * undo is an appended row rather than a recalculation somebody has to remember to run.
 */

export interface GamesSnapshot {
  readonly hydrated: boolean;
  readonly available: boolean;
  readonly sessions: readonly GameSession[];
  readonly participants: readonly GameParticipant[];
  readonly events: readonly GameEvent[];
  readonly teams: readonly GameTeam[];
  readonly crew: readonly CrewMember[];
}

const EMPTY: GamesSnapshot = {
  hydrated: false,
  available: true,
  sessions: [],
  participants: [],
  events: [],
  teams: [],
  crew: [],
};

let snapshot: GamesSnapshot = EMPTY;
const listeners = new Set<() => void>();

function publish(next: GamesSnapshot): void {
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Hydration is triggered by the first subscriber, matching `features/catches/store.ts`:
  // idempotent, so every screen can mount without coordinating who loads the database.
  void hydrateGames();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): GamesSnapshot => snapshot;
const SERVER: GamesSnapshot = EMPTY;
const getServerSnapshot = (): GamesSnapshot => SERVER;

let hydrating: Promise<void> | null = null;

export function hydrateGames(): Promise<void> {
  if (hydrating) return hydrating;
  hydrating = (async () => {
    if (!isIndexedDbAvailable()) {
      publish({ ...EMPTY, hydrated: true, available: false });
      return;
    }
    try {
      await refresh();
    } catch {
      // A browser with IndexedDB blocked still renders, and says plainly that nothing
      // can be saved, rather than throwing at somebody standing on a boat.
      publish({ ...EMPTY, hydrated: true, available: false });
    }
  })();
  return hydrating;
}

async function refresh(): Promise<void> {
  const [sessions, participants, events, crew] = await Promise.all([
    allLocalRows("game_session"),
    allLocalRows("game_participant"),
    allLocalRows("game_event"),
    allLocalRows("crew_member"),
  ]);
  publish({
    hydrated: true,
    available: true,
    sessions: sessions as unknown as GameSession[],
    participants: participants as unknown as GameParticipant[],
    events: events as unknown as GameEvent[],
    teams: [],
    crew: crew as unknown as CrewMember[],
  });
}

export function useGames(): GamesSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function currentGames(): GamesSnapshot {
  return snapshot;
}

// --- Selectors ---------------------------------------------------------------------

/** The ontology facts the fold needs, bound to the real species table. */
export const SCORING_CONTEXT: ScoringContext = {
  rollsUpTo: (id) => speciesById(id)?.rollsUpTo ?? null,
  isProtected: (id) => speciesById(id)?.takeStatus === "protected",
};

export interface GameView {
  readonly session: GameSession;
  readonly participants: readonly GameParticipant[];
  readonly events: readonly GameEvent[];
  readonly standings: GameStandings;
}

export function gameView(state: GamesSnapshot, sessionId: string): GameView | null {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const participants = state.participants.filter((p) => p.session_id === sessionId);
  const events = state.events.filter((e) => e.session_id === sessionId);
  return {
    session,
    participants,
    events,
    standings: score(session.rules, participants, events, SCORING_CONTEXT),
  };
}

/** Games the angler can pick back up. The home screen leads with these. */
export function unfinishedGames(state: GamesSnapshot): readonly GameSession[] {
  return state.sessions
    .filter((s) => s.status === "active" || s.status === "paused" || s.status === "draft")
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function finishedGames(state: GamesSnapshot): readonly GameSession[] {
  return state.sessions
    .filter((s) => s.status === "completed")
    .slice()
    .sort((a, b) => ((a.completed_at ?? "") < (b.completed_at ?? "") ? 1 : -1));
}

export function participantsOf(
  state: GamesSnapshot,
  sessionId: string,
): readonly GameParticipant[] {
  return state.participants.filter((p) => p.session_id === sessionId && p.removed_at === null);
}

// --- Write path --------------------------------------------------------------------

async function persist(writes: readonly { store: LocalStore; row: StoredRow }[]): Promise<void> {
  await commitLocal(writes);
  await refresh();
}

const row = (value: unknown): StoredRow => value as unknown as StoredRow;

export async function createGame(input: {
  mode: GameMode;
  name: string;
  zone: string;
  regionId: string;
  tripId: string | null;
  rules?: GameRules;
}): Promise<GameSession> {
  const session: GameSession = {
    id: uuidv7(),
    mode: input.mode,
    name: input.name,
    status: "draft",
    rules: input.rules ?? defaultsFor(input.mode),
    zone: input.zone,
    region_id: input.regionId,
    trip_id: input.tripId,
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    next_seq: 1,
  };
  await persist([{ store: "game_session", row: row(session) }]);
  return session;
}

export async function updateRules(sessionId: string, rules: GameRules): Promise<void> {
  const session = snapshot.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  await persist([{ store: "game_session", row: row({ ...session, rules }) }]);
}

export async function renameGame(sessionId: string, name: string): Promise<void> {
  const session = snapshot.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  await persist([{ store: "game_session", row: row({ ...session, name }) }]);
}

export async function addParticipant(input: {
  sessionId: string;
  displayName: string;
  colorKey: ParticipantColor;
  teamId: string | null;
  handicap: number;
  isHost: boolean;
  saveToCrew: boolean;
}): Promise<GameParticipant> {
  const now = new Date().toISOString();
  const participant: GameParticipant = {
    id: uuidv7(),
    session_id: input.sessionId,
    display_name: input.displayName,
    color_key: input.colorKey,
    team_id: input.teamId,
    handicap_points: input.handicap,
    is_host: input.isHost,
    claimed_user_id: null,
    joined_at: now,
    removed_at: null,
  };
  const writes: { store: LocalStore; row: StoredRow }[] = [
    { store: "game_participant", row: row(participant) },
  ];
  if (input.saveToCrew) {
    const existing = snapshot.crew.find(
      (c) => c.display_name.toLowerCase() === input.displayName.toLowerCase(),
    );
    const member: CrewMember = existing
      ? { ...existing, last_played_at: now, color_key: input.colorKey, default_handicap: input.handicap }
      : {
          id: uuidv7(),
          display_name: input.displayName,
          color_key: input.colorKey,
          default_handicap: input.handicap,
          created_at: now,
          last_played_at: now,
        };
    writes.push({ store: "crew_member", row: row(member) });
  }
  await persist(writes);
  return participant;
}

/**
 * Remove a player. Before the game starts they are deleted outright; once it is running
 * they are tombstoned instead, because their events are part of the record and the fold
 * needs to be able to say "this player was removed" rather than find an orphan.
 */
export async function removeParticipant(participantId: string): Promise<void> {
  const participant = snapshot.participants.find((p) => p.id === participantId);
  if (!participant) return;
  const session = snapshot.sessions.find((s) => s.id === participant.session_id);
  if (session?.status === "draft") {
    await deleteLocalRow("game_participant", participantId);
    await refresh();
    return;
  }
  await persist([
    { store: "game_participant", row: row({ ...participant, removed_at: new Date().toISOString() }) },
  ]);
}

export async function saveCrewMember(input: {
  displayName: string;
  colorKey: ParticipantColor;
  handicap: number;
}): Promise<void> {
  const now = new Date().toISOString();
  await persist([
    {
      store: "crew_member",
      row: row({
        id: uuidv7(),
        display_name: input.displayName,
        color_key: input.colorKey,
        default_handicap: input.handicap,
        created_at: now,
        last_played_at: null,
      } satisfies CrewMember),
    },
  ]);
}

export async function deleteCrewMember(id: string): Promise<void> {
  await deleteLocalRow("crew_member", id);
  await refresh();
}

/**
 * Append one event and advance the session's sequence counter, in one transaction.
 *
 * The pairing is the point: `next_seq` and the event that consumed it are written
 * together or not at all.
 *
 * The counter is nonetheless taken as the HIGHER of the session's `next_seq` and one past
 * the largest sequence already on an event. `next_seq` is read from the in-memory
 * snapshot, and two appends started before either has persisted would both read the same
 * value and mint two events sharing a sequence number. Deriving it from the events as well
 * makes that self-healing: the counter cannot go backwards even if the snapshot is stale,
 * and a session whose counter is somehow wrong repairs itself on the next event rather
 * than silently interleaving a game's history.
 */
async function appendEvent(
  sessionId: string,
  fields: Partial<GameEvent> & { kind: GameEventKind },
): Promise<GameEvent | null> {
  const session = snapshot.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const standings = gameView(snapshot, sessionId)?.standings;
  const highestSoFar = snapshot.events
    .filter((e) => e.session_id === sessionId)
    .reduce((max, e) => Math.max(max, e.seq), 0);
  const seq = Math.max(session.next_seq, highestSoFar + 1);
  const event: GameEvent = {
    id: uuidv7(),
    session_id: sessionId,
    kind: fields.kind,
    participant_id: fields.participant_id ?? null,
    round: standings?.round ?? 1,
    seq,
    created_at: new Date().toISOString(),
    species_id: fields.species_id ?? null,
    species_other: fields.species_other ?? null,
    length_mm: fields.length_mm ?? null,
    weight_g: fields.weight_g ?? null,
    disposition: fields.disposition ?? null,
    personal_best: fields.personal_best ?? false,
    new_species: fields.new_species ?? false,
    catch_id: fields.catch_id ?? null,
    legal: fields.legal ?? null,
    voids_event_id: fields.voids_event_id ?? null,
    adjustment_points: fields.adjustment_points ?? null,
    note: fields.note ?? null,
    approved: fields.approved ?? !session.rules.host_approval,
  };
  await persist([
    { store: "game_event", row: row(event) },
    { store: "game_session", row: row({ ...session, next_seq: seq + 1 }) },
  ]);
  return event;
}

export async function startGame(sessionId: string): Promise<void> {
  const session = snapshot.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  await persist([
    {
      store: "game_session",
      row: row({ ...session, status: "active", started_at: new Date().toISOString() }),
    },
  ]);
}

export interface GameCatchInput {
  readonly sessionId: string;
  readonly participantId: string;
  readonly speciesId: string | null;
  readonly speciesOther: string | null;
  readonly lengthMm: number | null;
  readonly weightG: number | null;
  readonly disposition: EventDisposition | null;
  readonly personalBest: boolean;
  readonly newSpecies: boolean;
  readonly legal: EventLegalSnapshot | null;
  /** Set when the host opted this fish into their own log (ADR 009 §1). */
  readonly catchId: string | null;
}

export async function logGameCatch(input: GameCatchInput): Promise<GameEvent | null> {
  return appendEvent(input.sessionId, {
    kind: "catch",
    participant_id: input.participantId,
    species_id: input.speciesId,
    species_other: input.speciesOther,
    length_mm: input.lengthMm,
    weight_g: input.weightG,
    disposition: input.disposition,
    personal_best: input.personalBest,
    new_species: input.newSpecies,
    legal: input.legal,
    catch_id: input.catchId,
  });
}

/**
 * Undo. Appends a `void` naming the event it takes back — never a delete, so the game's
 * history stays whole and a mis-tap is visible as a correction rather than a gap.
 */
export async function undoEvent(sessionId: string, eventId: string): Promise<void> {
  await appendEvent(sessionId, { kind: "void", voids_event_id: eventId, approved: true });
}

/** The most recent catch that has not already been undone. What "Undo last" undoes. */
export function lastUndoableEvent(state: GamesSnapshot, sessionId: string): GameEvent | null {
  const events = state.events.filter((e) => e.session_id === sessionId);
  const voided = new Set(
    events.filter((e) => e.kind === "void").map((e) => e.voids_event_id ?? ""),
  );
  const candidates = events
    .filter((e) => e.kind === "catch" && !voided.has(e.id))
    .sort((a, b) => b.seq - a.seq);
  return candidates[0] ?? null;
}

export async function approveEvent(sessionId: string, eventId: string): Promise<void> {
  const event = snapshot.events.find((e) => e.id === eventId);
  if (!event) return;
  await persist([{ store: "game_event", row: row({ ...event, approved: true }) }]);
}

export async function adjustPoints(
  sessionId: string,
  participantId: string,
  points: number,
  note: string,
): Promise<void> {
  await appendEvent(sessionId, {
    kind: "adjustment",
    participant_id: participantId,
    adjustment_points: points,
    note,
    approved: true,
  });
}

export async function advanceRound(sessionId: string): Promise<void> {
  await appendEvent(sessionId, { kind: "round_advanced", approved: true });
}

export async function pauseGame(sessionId: string): Promise<void> {
  const session = snapshot.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  await appendEvent(sessionId, { kind: "paused", approved: true });
  const latest = currentGames().sessions.find((s) => s.id === sessionId);
  if (latest) await persist([{ store: "game_session", row: row({ ...latest, status: "paused" }) }]);
}

export async function resumeGame(sessionId: string): Promise<void> {
  const session = snapshot.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  await appendEvent(sessionId, { kind: "resumed", approved: true });
  const latest = currentGames().sessions.find((s) => s.id === sessionId);
  if (latest) await persist([{ store: "game_session", row: row({ ...latest, status: "active" }) }]);
}

export async function finishGame(sessionId: string): Promise<void> {
  const session = snapshot.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  await persist([
    {
      store: "game_session",
      row: row({ ...session, status: "completed", completed_at: new Date().toISOString() }),
    },
  ]);
}

export async function discardGame(sessionId: string): Promise<void> {
  for (const event of snapshot.events.filter((e) => e.session_id === sessionId)) {
    await deleteLocalRow("game_event", event.id);
  }
  for (const p of snapshot.participants.filter((p) => p.session_id === sessionId)) {
    await deleteLocalRow("game_participant", p.id);
  }
  await deleteLocalRow("game_session", sessionId);
  await refresh();
}

/** A rematch: the same rules and the same crew, a clean slate of events. */
export async function rematch(sessionId: string): Promise<GameSession | null> {
  const previous = snapshot.sessions.find((s) => s.id === sessionId);
  if (!previous) return null;
  const created = await createGame({
    mode: previous.mode,
    name: previous.name,
    zone: previous.zone,
    regionId: previous.region_id,
    tripId: previous.trip_id,
    rules: previous.rules,
  });
  for (const p of snapshot.participants.filter((p) => p.session_id === sessionId && p.removed_at === null)) {
    await addParticipant({
      sessionId: created.id,
      displayName: p.display_name,
      colorKey: p.color_key,
      teamId: p.team_id,
      handicap: p.handicap_points,
      isHost: p.is_host,
      saveToCrew: false,
    });
  }
  return created;
}
