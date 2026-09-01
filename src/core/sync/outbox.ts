/**
 * The outbox envelope and its pure state machine (ADR 004 §3).
 *
 * An append-only local log of mutations. This module holds the parts that are the
 * *protocol* — the envelope shape, the retry schedule, and how an HTTP outcome maps to
 * the next state — so that the Swift client implements the same behaviour rather than
 * inventing a second one. Nothing here does I/O; `src/lib/offline/` stores these records
 * and a future flusher sends them.
 *
 * The rule that shapes everything: a mutation is durable the instant it is written
 * locally. Nothing in the UI waits on the network, and no outcome short of an explicit
 * server rejection may discard a record.
 */

export type SyncEntity =
  | "trip"
  | "trip_rig"
  | "catch"
  | "catch_gear"
  | "condition_snapshot"
  | "location_condition"
  | "journal_entry"
  | "spot"
  | "tackle_item";

export type MutationOp = "insert" | "patch" | "delete";

/**
 * `queued`   waiting to be sent, or waiting out a backoff. The normal offline state.
 * `sending`  in flight.
 * `done`     the server has it. Includes a primary-key collision on insert (ADR 004 §4).
 * `rejected` the server refused it on its merits (4xx). Surfaced, never silently dropped.
 *
 * There is deliberately no `failed`: a network error leaves a record `queued`. ADR 004 §6
 * — "never say failed while retries remain."
 */
export type MutationState = "queued" | "sending" | "done" | "rejected";

export interface Mutation {
  readonly id: string;
  readonly entity: SyncEntity;
  readonly entityId: string;
  readonly op: MutationOp;
  /** insert: the full row. patch: changed fields ONLY (ADR 004 §3). delete: {}. */
  readonly payload: Readonly<Record<string, unknown>>;
  /** Device clock. The conflict comparator, and only that. */
  readonly clientUpdatedAt: string;
  readonly deviceId: string;
  readonly attempts: number;
  readonly lastError: string | null;
  readonly state: MutationState;
}

/** What came back from one send attempt. */
export type SendOutcome =
  | { kind: "ok" }
  /** Primary-key collision on an insert: this row already landed. ADR 004 §3. */
  | { kind: "duplicate" }
  /** No network, DNS failure, timeout, 5xx. Not the angler's problem and not an error. */
  | { kind: "unreachable"; error: string }
  /** The session expired. Refresh and retry; never lose the write. ADR 004 §3. */
  | { kind: "auth_expired"; error: string }
  /** 4xx on the merits — a constraint the server refused. */
  | { kind: "rejected"; error: string };

export const MAX_BACKOFF_MS = 5 * 60 * 1000;
const BASE_BACKOFF_MS = 1_000;

/**
 * Exponential backoff with full jitter, capped at five minutes (ADR 004 §3).
 *
 * `random` is injected so the schedule is testable; callers pass nothing.
 * Full jitter (rather than a fixed exponential) matters when a boat comes back into
 * signal and every queued mutation would otherwise retry on the same tick.
 */
export function backoffMs(attempts: number, random: () => number = Math.random): number {
  const exponential = Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts), MAX_BACKOFF_MS);
  return Math.round(random() * exponential);
}

/**
 * The state machine. Total over `SendOutcome` — every outcome has a defined next state,
 * because the case nobody wrote down is the case that loses a fish.
 */
export function applyOutcome(mutation: Mutation, outcome: SendOutcome): Mutation {
  const attempts = mutation.attempts + 1;
  switch (outcome.kind) {
    case "ok":
    case "duplicate":
      return { ...mutation, attempts, lastError: null, state: "done" };
    case "unreachable":
    case "auth_expired":
      // Stays queued. This is the whole point: a write is never lost because the
      // network went away or a token expired mid-trip.
      return { ...mutation, attempts, lastError: outcome.error, state: "queued" };
    case "rejected":
      return { ...mutation, attempts, lastError: outcome.error, state: "rejected" };
  }
}

/** Records the flusher should attempt, oldest first. UUIDv7 ids sort by mint time. */
export function pendingMutations(mutations: readonly Mutation[]): readonly Mutation[] {
  return mutations.filter((m) => m.state === "queued").slice().sort((a, b) => (a.id < b.id ? -1 : 1));
}

/**
 * What the glass is allowed to say (ADR 004 §6). Three states, and the vocabulary
 * matters more than the mechanism: offline is normal, not an error.
 */
export type BackupState =
  | { kind: "backed_up" }
  | { kind: "waiting"; count: number }
  | { kind: "needs_attention"; count: number };

export function backupState(mutations: readonly Mutation[]): BackupState {
  const rejected = mutations.filter((m) => m.state === "rejected").length;
  if (rejected > 0) return { kind: "needs_attention", count: rejected };
  const waiting = mutations.filter((m) => m.state === "queued" || m.state === "sending").length;
  if (waiting > 0) return { kind: "waiting", count: waiting };
  return { kind: "backed_up" };
}
