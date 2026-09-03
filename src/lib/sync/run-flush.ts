/**
 * Drive one flush pass against IndexedDB. Safe to call from persist, `online`,
 * and visibilitychange. Never throws into the logging UI.
 */
import { flushOnce } from "@/core/sync/flusher";
import { allMutations, putMutation } from "@/lib/offline/db";
import { sendViaPostgrest } from "./postgrest-send";

let inFlight: Promise<void> | null = null;

export function scheduleFlush(): void {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  if (inFlight) return;
  inFlight = runFlush()
    .catch(() => {
      /* queued rows stay queued */
    })
    .finally(() => {
      inFlight = null;
    });
}

export async function runFlush(): Promise<void> {
  const before = await allMutations();
  const result = await flushOnce(before, sendViaPostgrest);
  await Promise.all(result.mutations.map((m) => putMutation(m)));
  const { refreshLog } = await import("@/features/catches/store");
  await refreshLog();
}

let listenersInstalled = false;

export function installFlushListeners(): void {
  if (typeof window === "undefined" || listenersInstalled) return;
  listenersInstalled = true;
  window.addEventListener("online", scheduleFlush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleFlush();
  });
}
