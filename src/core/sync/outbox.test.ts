import { describe, expect, it } from "vitest";

import {
  applyOutcome,
  backoffMs,
  backupState,
  MAX_BACKOFF_MS,
  pendingMutations,
  type Mutation,
} from "./outbox";

const base: Mutation = {
  id: "0198d9c1-9800-7000-8000-000000000001",
  entity: "catch",
  entityId: "c1",
  op: "insert",
  payload: {},
  clientUpdatedAt: "2026-08-20T21:12:00.000Z",
  deviceId: "device-1",
  attempts: 0,
  lastError: null,
  state: "queued",
};

describe("applyOutcome", () => {
  it("marks a successful send done", () => {
    expect(applyOutcome(base, { kind: "ok" }).state).toBe("done");
  });

  it("treats a primary-key collision as success — the row already landed", () => {
    expect(applyOutcome(base, { kind: "duplicate" }).state).toBe("done");
  });

  it("leaves an unreachable server queued, never failed", () => {
    const next = applyOutcome(base, { kind: "unreachable", error: "offline" });
    expect(next.state).toBe("queued");
    expect(next.attempts).toBe(1);
  });

  it("NEVER loses a write because a token expired", () => {
    const next = applyOutcome(base, { kind: "auth_expired", error: "401" });
    expect(next.state).toBe("queued");
  });

  it("surfaces a server rejection rather than dropping it", () => {
    const next = applyOutcome(base, { kind: "rejected", error: "quantity must be >= 1" });
    expect(next.state).toBe("rejected");
    expect(next.lastError).toBe("quantity must be >= 1");
  });

  it("clears a stale error once the send succeeds", () => {
    const retried = applyOutcome(base, { kind: "unreachable", error: "offline" });
    expect(applyOutcome(retried, { kind: "ok" }).lastError).toBeNull();
  });
});

describe("backoffMs", () => {
  it("grows exponentially", () => {
    const full = () => 1;
    expect(backoffMs(0, full)).toBe(1_000);
    expect(backoffMs(1, full)).toBe(2_000);
    expect(backoffMs(3, full)).toBe(8_000);
  });

  it("caps at five minutes however many attempts have been made", () => {
    expect(backoffMs(50, () => 1)).toBe(MAX_BACKOFF_MS);
  });

  it("jitters down to zero so a fleet of queued writes does not retry in lockstep", () => {
    expect(backoffMs(5, () => 0)).toBe(0);
  });

  it("never returns a negative delay", () => {
    expect(backoffMs(-3, () => 1)).toBeGreaterThanOrEqual(0);
  });
});

describe("pendingMutations", () => {
  it("returns only queued work, oldest id first", () => {
    const mutations: Mutation[] = [
      { ...base, id: "0198d9c1-9800-7000-8000-00000000000b" },
      { ...base, id: "0198d9c1-9800-7000-8000-00000000000a" },
      { ...base, id: "0198d9c1-9800-7000-8000-00000000000c", state: "done" },
    ];
    expect(pendingMutations(mutations).map((m) => m.id.slice(-1))).toEqual(["a", "b"]);
  });
});

describe("backupState — the vocabulary at the glass (ADR 004 §6)", () => {
  it("says backed up when nothing is queued", () => {
    expect(backupState([{ ...base, state: "done" }])).toEqual({ kind: "backed_up" });
  });

  it("counts what is waiting, without calling it an error", () => {
    expect(backupState([base, { ...base, id: "x" }])).toEqual({ kind: "waiting", count: 2 });
  });

  it("a rejection outranks waiting — it is the only state that interrupts", () => {
    expect(backupState([base, { ...base, id: "x", state: "rejected" }])).toEqual({
      kind: "needs_attention",
      count: 1,
    });
  });
});
