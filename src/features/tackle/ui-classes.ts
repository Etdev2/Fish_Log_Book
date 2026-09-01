/**
 * One shared visual spec for the tackle feature's repeated controls — chips, focus
 * rings, and the primary action. Component files import these instead of restating
 * class strings, so the treatment cannot drift between pages.
 */

export const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

export const CHIP_CLASS = `min-h-touch-floor rounded-full border px-4 text-label transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;
export const CHIP_ON = "border-signal-orange bg-signal-orange text-ink-on-orange";
export const CHIP_OFF = "border-border-interactive text-text-link";
export const CHIP_OFF_ON_SURFACE = "border-border-interactive bg-surface text-text-link";

export const PRIMARY_BUTTON = `inline-flex min-h-touch-floor items-center justify-center rounded-md bg-signal-orange px-4 text-label text-ink-on-orange transition-colors hover:bg-signal-orange-pressed ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;