"use client";

import { useQuickMarkEnabled } from "../shortcuts";

/**
 * The Quick Mark switch for Settings → Fishing shortcuts.
 *
 * A real switch rather than the two-button pair the units control uses: units is a
 * choice between two equally valid things, this is one thing being on or off, and a
 * switch says that in a way two buttons do not. It keeps the same 44px floor and the
 * same focus treatment, so it still reads as part of the same set.
 *
 * `role="switch"` with `aria-checked` is the accessible name for exactly this control;
 * a checkbox would announce as "checked" rather than "on", which is the wrong word for a
 * setting that turns a control on and off.
 */
export function QuickMarkToggle() {
  const [enabled, setEnabled] = useQuickMarkEnabled();

  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor="quick-mark-switch" className="text-body text-text-primary">
        Quick Mark
      </label>
      <button
        id="quick-mark-switch"
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled(!enabled)}
        className={`inline-flex min-h-touch-floor w-20 shrink-0 items-center rounded-full border px-1 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring motion-reduce:transition-none ${
          enabled
            ? "justify-end border-signal-orange bg-signal-orange"
            : "justify-start border-border-interactive bg-surface-raised"
        }`}
      >
        <span
          aria-hidden="true"
          className={`size-9 rounded-full transition-colors motion-reduce:transition-none ${
            enabled ? "bg-ink-on-orange" : "bg-text-muted"
          }`}
        />
        <span className="sr-only">{enabled ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
