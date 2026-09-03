import { describe, expect, it } from "vitest";

import { flushOnce } from "./flusher";
import type { Mutation, SendOutcome } from "./outbox";

function mut(over: Partial<Mutation> & Pick<Mutation, "id">): Mutation {
  return {
    entity: "catch",
    entityId: over.id,
    op: "insert",
    payload: { id: over.id },
    clientUpdatedAt: "2026-09-03T12:00:00.000Z",
    deviceId: "dev-1",
    attempts: 0,
    lastError: null,
    state: "queued",
    ...over,
  };
}

describe("outbox flusher", () => {
  it("marks reachable inserts done and leaves unreachable queued", async () => {
    const send = async (m: Mutation): Promise<SendOutcome> =>
      m.id === "b" ? { kind: "unreachable", error: "offline" } : { kind: "ok" };
    const result = await flushOnce([mut({ id: "a" }), mut({ id: "b" })], send);
    expect(result.done).toBe(1);
    expect(result.stillQueued).toBe(1);
    expect(result.mutations.find((m) => m.id === "a")!.state).toBe("done");
    expect(result.mutations.find((m) => m.id === "b")!.state).toBe("queued");
  });

  it("stops the pass on auth_expired so later rows are not burned", async () => {
    const seen: string[] = [];
    const send = async (m: Mutation): Promise<SendOutcome> => {
      seen.push(m.id);
      if (m.id === "a") return { kind: "auth_expired", error: "401" };
      return { kind: "ok" };
    };
    const result = await flushOnce([mut({ id: "a" }), mut({ id: "b" })], send);
    expect(seen).toEqual(["a"]);
    expect(result.done).toBe(0);
    expect(result.mutations.every((m) => m.state === "queued")).toBe(true);
  });
});
