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

  /*
    Sign-in is a flush trigger, and it was the missing one. `online` does not fire when
    you were already online, and `visibilitychange` does not fire on a tab that just
    loaded — so a magic link opened after a day offshore left the whole day's catches
    queued behind a badge that said "Saved on this device". The queue drained only if
    the angler happened to switch apps and come back.

    Binding first means local rows written from here on carry the real auth.uid()
    rather than the placeholder; the sender stamps the wire payload either way.
  */
  void import("./session-angler").then(async (session) => {
    session.onAnglerSession(() => scheduleFlush());
    if (await session.bindSessionAngler()) scheduleFlush();
  });
}
