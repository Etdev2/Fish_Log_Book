"use client";

/**
 * The quick mark — D22's man-overboard control. It lives in the (app) layout so it is one
 * thumb away from every product route by construction, not by remembering.
 *
 * When it is wired: it writes to IndexedDB and returns. No spinner, no "saving…", no
 * disabled-while-in-flight. A mark is saved the instant it is in the local store, and the
 * network is somebody else's problem (ADR 004 §6).
 *
 * It is not wired yet — this round is the shell (ADR 005, scope note). A primary action is
 * never disabled without a visible reason next to it (docs/design/02-semantic-colors.md
 * §Disabled), so the reason is rendered, not left for the angler to guess at.
 */
export function QuickMarkButton() {
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-disabled="true"
        className="min-h-touch-primary-quick-mark rounded-full bg-signal-orange px-6 text-label text-ink-on-orange"
      >
        Mark
      </button>
      <p className="text-caption text-text-muted">Wired when logging lands</p>
    </div>
  );
}
