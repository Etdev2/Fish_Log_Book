/**
 * Outbox flusher — the missing I/O half of ADR 004.
 *
 * `outbox.ts` is the protocol (pure). This module walks pending mutations and
 * asks an injected sender to deliver each one, then applies `applyOutcome`.
 * Nothing here knows about Supabase; the browser (or a test) supplies `send`.
 *
 * This is the Phase 1 wiring the backup badge still lacks: until a real sender
 * is hooked to IndexedDB, the glass correctly says "Saved on this device."
 */
import { applyOutcome, pendingMutations, type Mutation, type SendOutcome } from "./outbox";

export type SendMutation = (mutation: Mutation) => Promise<SendOutcome>;

export interface FlushResult {
  readonly attempted: number;
  readonly done: number;
  readonly rejected: number;
  readonly stillQueued: number;
  readonly mutations: readonly Mutation[];
}

/**
 * One pass over the queue, oldest first. Stops early on `auth_expired` so a
 * refresh can happen before we burn the rest of the backlog.
 */
export async function flushOnce(
  mutations: readonly Mutation[],
  send: SendMutation,
): Promise<FlushResult> {
  const next = mutations.map((m) => ({ ...m }));
  const byId = new Map(next.map((m) => [m.id, m]));
  let done = 0;
  let rejected = 0;
  let attempted = 0;

  for (const pending of pendingMutations(next)) {
    attempted += 1;
    const current = byId.get(pending.id)!;
    const sending: Mutation = { ...current, state: "sending" };
    byId.set(sending.id, sending);
    const outcome = await send(sending);
    const applied = applyOutcome(sending, outcome);
    byId.set(applied.id, applied);
    if (applied.state === "done") done += 1;
    if (applied.state === "rejected") rejected += 1;
    if (outcome.kind === "auth_expired") break;
  }

  const mutationsOut = next.map((m) => byId.get(m.id)!);
  const stillQueued = mutationsOut.filter((m) => m.state === "queued" || m.state === "sending").length;
  return { attempted, done, rejected, stillQueued, mutations: mutationsOut };
}
