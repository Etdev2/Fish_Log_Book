"use client";

import { useState } from "react";

import { logQuickMark } from "@/features/catches/create";
import { useLog } from "@/features/catches/store";

/**
 * The quick mark — D22's man-overboard control. It lives in the (app) layout so it is one
 * thumb away from every product route by construction, not by remembering.
 *
 * It writes to IndexedDB and returns. No spinner, no "saving…", no disabled-while-in-
 * flight: a mark is saved the instant it is in the local store, and the network is
 * somebody else's problem (ADR 004 §6). The GPS fix and the conditions snapshot are
 * attached afterwards and cannot hold up or undo the write.
 *
 * The row it writes is deliberately NOT yet a fact: no species, no outcome, excluded
 * from every rate until a human says what happened. That is what makes this button safe
 * to hit with a fish thrashing on the deck — nothing is claimed by pressing it.
 */
export function QuickMarkButton() {
  const state = useLog();
  const [marked, setMarked] = useState(0);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          void logQuickMark(state);
          setMarked((count) => count + 1);
        }}
        disabled={!state.available}
        className="min-h-touch-primary-quick-mark rounded-full bg-signal-orange px-6 text-label font-semibold text-ink-on-orange transition-colors hover:bg-signal-orange-pressed focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 disabled:opacity-disabled motion-reduce:transition-none"
      >
        Mark
      </button>
      <p aria-live="polite" className="text-caption text-text-muted">
        {!state.available
          ? "Storage blocked — cannot save"
          : marked > 0
            ? `${marked} saved. Add details in the Log.`
            : "One tap. Details later."}
      </p>
    </div>
  );
}
