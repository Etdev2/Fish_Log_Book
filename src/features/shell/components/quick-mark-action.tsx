"use client";

import { useEffect, useRef, useState } from "react";

import { logQuickMark, type LogResult } from "@/features/catches/create";
import { deleteCatch, useLog } from "@/features/catches/store";

/**
 * The quick mark — D22's man-overboard control, as an opt-in accelerator.
 *
 * **Why it sits here and not in the header.** It is an action, not a destination, so it
 * must not compete with the primary nav; and it is a one-thumb action, so it belongs
 * where the thumb already is — the bottom of the screen, directly above the nav it must
 * not cover. Right-aligned to the same 16px gutter as every page's content column and
 * the tide screen's own alignment line, so it lands on an existing edge rather than
 * floating wherever there happened to be room.
 *
 * It is compact on purpose. The old header pill was the most prominent control in the
 * app for a feature most anglers will never switch on; this is a small, quiet target
 * that still clears the 44px touch floor comfortably.
 *
 * **Behaviour is unchanged.** It writes to IndexedDB and returns: no spinner, no
 * disabled-while-in-flight, no waiting on GPS or network. The row it writes is not yet a
 * fact — no species, no outcome, excluded from every rate until a human says what
 * happened — which is what makes it safe to hit with a fish thrashing on the deck.
 *
 * **Size is deliberate and is not a leftover.** 88px is the design system's
 * `primary-quick-mark` target (`docs/design/03-touch-and-interaction.md` §1, §5), chosen
 * because this control is meant to be used *by feel* — "you click it without looking".
 * Shrinking it to look tidier would break the one property it exists for. What changed
 * is where it lives and whether it is there at all, not how big it is under the thumb.
 *
 * `Undo` is from that same section: a mis-tap is corrected inside the toast's window, or
 * later from the Needs-details queue — never by a confirmation dialog before the fact,
 * which would defeat the whole point of a one-tap control.
 */

/** How long the confirmation stays up. Long enough to read one-handed, short enough
 *  not to sit on top of the log while the angler is still fishing. */
const CONFIRMATION_MS = 6_000;

export function QuickMarkAction() {
  const state = useLog();
  const [marked, setMarked] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The write in flight, so Undo can name the row without the tap having waited on it. */
  const lastMark = useRef<Promise<LogResult> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const mark = () => {
    // Not awaited: the mark is durable the instant it is in the local store, and this
    // button never makes anybody wait (ADR 004 §6). The promise is kept only so Undo
    // has an id to act on.
    lastMark.current = logQuickMark(state);
    setMarked((count) => count + 1);
    setShowConfirmation(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShowConfirmation(false), CONFIRMATION_MS);
  };

  const undo = async () => {
    const pending = lastMark.current;
    if (!pending || undoing) return;
    setUndoing(true);
    try {
      const { catchId } = await pending;
      // Soft delete, like any other removal — the tombstone syncs rather than the row
      // silently never having existed.
      await deleteCatch(catchId);
      lastMark.current = null;
      setMarked((count) => Math.max(0, count - 1));
      setShowConfirmation(false);
      if (timer.current) clearTimeout(timer.current);
    } finally {
      setUndoing(false);
    }
  };

  return (
    // Positioning belongs to the shell's bottom dock (`shell-frame.tsx`), which anchors
    // this to the nav's top edge. This component only decides what the control looks
    // like and what it does.
    <div className="flex flex-col items-end gap-2">
      {showConfirmation ? (
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border-interactive bg-surface-raised py-2 pr-2 pl-4">
          <p className="text-caption text-text-primary">
            {marked === 1 ? "Mark saved" : `${marked} marks saved`}
          </p>
          <button
            type="button"
            onClick={() => void undo()}
            disabled={undoing}
            className="inline-flex min-h-touch-floor items-center rounded-full px-3 text-label text-text-link disabled:opacity-disabled focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
          >
            Undo
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={mark}
        disabled={!state.available}
        aria-label="Quick mark — record that something happened, add details later"
        className="pointer-events-auto inline-flex min-h-touch-primary-quick-mark items-center gap-2 rounded-full bg-signal-orange px-5 text-label font-semibold text-ink-on-orange [box-shadow:var(--elevation-floating-shadow)] transition-colors hover:bg-signal-orange-pressed focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 disabled:opacity-disabled motion-reduce:transition-none"
      >
        <MarkGlyph />
        Mark
      </button>

      {/* The confirmation above is visual and times out; this is the announcement, and
          it is separate so a screen reader is not told the toast has disappeared. */}
      <p aria-live="polite" className="sr-only">
        {!state.available
          ? "Storage is blocked, so marks cannot be saved"
          : marked > 0
            ? `${marked} ${marked === 1 ? "mark" : "marks"} saved. Add details in the Fish Log.`
            : ""}
      </p>

      {!state.available ? (
        <p className="pointer-events-auto rounded-full bg-surface-raised px-3 py-1 text-caption text-error-red">
          Storage blocked — cannot save
        </p>
      ) : null}
    </div>
  );
}

/** A pin dropping on a spot: the mark, not a fish. Sized to the label's cap height. */
function MarkGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="size-5" fill="none">
      <path
        d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
