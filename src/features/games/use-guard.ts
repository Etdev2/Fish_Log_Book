"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Run an action at most once at a time, and report whether it is running.
 *
 * The `busy` flag alone is not enough, and the difference matters here more than in most
 * apps. React state is read from a render closure, so two taps arriving before the
 * re-render both see `busy === false` and both actions run. On this screen that is not a
 * cosmetic bug: a double-tap on "Close day and make the cut" would close two days and
 * eliminate two anglers, and the founder's handoff names duplicate button taps as a case
 * the game has to survive on a wet phone.
 *
 * The ref is checked and set synchronously in the same turn, so the second tap loses
 * whatever React has or has not re-rendered. The state exists only so the button can
 * disable itself and say "Saving…".
 *
 * This is measured, not assumed. Five clicks dispatched in one synchronous task against a
 * state-only guard wrote FIVE catches for one fish, all sharing sequence number 1; the
 * same test against this guard writes one. (Playwright's ordinary `click()` cannot show
 * the difference — the browser spaces those far enough apart that React always re-renders
 * in between, so both versions pass. It takes clicks inside a single task to reproduce
 * what a laggy phone does on its own.)
 */
export function useGuardedAction(): {
  readonly busy: boolean;
  readonly run: (action: () => Promise<unknown>) => Promise<void>;
} {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (action: () => Promise<unknown>): Promise<void> => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);

  return { busy, run };
}
