import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The queue has to drain when the angler signs in.
 *
 * This is the bug the field test would have found and no unit test could: the flush was
 * wired to a write, to `online`, and to the tab becoming visible. A magic link opened
 * after a day offshore is none of those — the tab is new, so `visibilitychange` never
 * fires, and the phone was already online, so `online` never fires. The day's catches
 * stayed queued behind a badge reading "Saved on this device" with a working server
 * sitting there waiting for them.
 *
 * So the trigger set itself is the thing under test.
 */

let sessionHandler: ((id: string) => void) | null = null;
let boundId: string | null = null;

const allMutations = vi.fn(async () => []);
const putMutation = vi.fn(async () => {});
const refreshLog = vi.fn(async () => {});

vi.mock("@/lib/offline/db", () => ({
  allMutations: () => allMutations(),
  putMutation: () => putMutation(),
}));
vi.mock("@/features/catches/store", () => ({ refreshLog: () => refreshLog() }));
vi.mock("./postgrest-send", () => ({
  sendViaPostgrest: async () => ({ kind: "ok" as const }),
}));
vi.mock("./session-angler", () => ({
  onAnglerSession: (handler: (id: string) => void) => {
    sessionHandler = handler;
    return () => {};
  },
  bindSessionAngler: async () => boundId,
}));

/**
 * Enough of a browser for the listeners to attach to. `navigator` is left alone: Node
 * defines it getter-only, and `scheduleFlush` only bails on an explicit `onLine === false`.
 */
function fakeWindow(): void {
  const listeners = new Map<string, () => void>();
  const add = (t: string, f: () => void) => listeners.set(t, f);
  for (const [key, value] of [
    ["window", { addEventListener: add }],
    ["document", { visibilityState: "visible", addEventListener: add }],
  ] as const) {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
}

function clearFakeWindow(): void {
  for (const key of ["window", "document"]) {
    delete (globalThis as Record<string, unknown>)[key];
  }
}

/** Let the chain of promises inside installFlushListeners settle. */
async function settle(): Promise<void> {
  for (let i = 0; i < 25; i += 1) await Promise.resolve();
}

beforeEach(() => {
  vi.resetModules();
  sessionHandler = null;
  boundId = null;
  allMutations.mockClear();
  fakeWindow();
});

afterEach(() => {
  clearFakeWindow();
});

describe("what makes the outbox drain", () => {
  it("flushes on load when a session already exists", async () => {
    boundId = "11111111-2222-4333-8444-555555555555";
    const { installFlushListeners } = await import("./run-flush");
    installFlushListeners();
    await settle();
    expect(allMutations).toHaveBeenCalled();
  });

  it("flushes when the angler signs in, with the tab already open and online", async () => {
    const { installFlushListeners } = await import("./run-flush");
    installFlushListeners();
    await settle();
    // Signed out on load: nothing to send to.
    expect(allMutations).not.toHaveBeenCalled();

    expect(sessionHandler, "nothing is watching for a session").not.toBeNull();
    sessionHandler!("11111111-2222-4333-8444-555555555555");
    await settle();
    expect(
      allMutations,
      "signing in did not drain the queue — the day's catches stay local",
    ).toHaveBeenCalled();
  });

  it("does not attempt a send while signed out", async () => {
    const { installFlushListeners } = await import("./run-flush");
    installFlushListeners();
    await settle();
    expect(allMutations).not.toHaveBeenCalled();
  });
});
