/**
 * Boat Games' repeated controls.
 *
 * Copied value-for-value from `features/catches/ui-classes.ts` for the reason stated
 * there: ADR 005 §3 forbids reaching into another feature's internals, and a handful of
 * class strings is a cheaper duplication than a cross-feature import.
 *
 * The two additions below are the ones a scoreboard needs and a log does not.
 */

export const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

export const CHIP_CLASS = `min-h-touch-floor rounded-full border px-4 text-label transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;
export const CHIP_ON = "border-signal-orange bg-signal-orange text-ink-on-orange";
export const CHIP_OFF = "border-border-interactive bg-surface text-text-link";

export const PRIMARY_BUTTON = `inline-flex min-h-touch-floor items-center justify-center rounded-md bg-signal-orange px-4 text-label font-semibold text-ink-on-orange transition-colors hover:bg-signal-orange-pressed ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

export const SECONDARY_BUTTON = `inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

export const DANGER_BUTTON = `inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-error-red transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

export const INPUT_CLASS = `min-h-touch-floor w-full rounded-md border border-border-interactive bg-background px-4 text-body text-text-primary placeholder:text-text-muted ${FOCUS_RING}`;

export const SELECT_CLASS = `min-h-touch-floor w-full rounded-md border border-border-interactive bg-background px-3 text-body text-text-primary ${FOCUS_RING}`;

export const CARD_CLASS = "rounded-lg border border-hairline bg-surface";

/**
 * The one action that has to be findable with wet hands while the boat is moving, so it
 * is taller than the touch floor rather than merely meeting it (design 03 §2).
 */
export const BIG_ACTION = `flex min-h-touch-primary-standard w-full items-center justify-center rounded-lg bg-signal-orange px-4 text-h3 font-semibold text-ink-on-orange transition-colors hover:bg-signal-orange-pressed ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

/**
 * A participant's colour, as a full class pair. Written out rather than interpolated
 * because Tailwind only ships classes it can see in the source — `bg-${key}` compiles to
 * nothing at all and the scoreboard would render every player grey.
 */
export const PARTICIPANT_CLASSES: Record<string, { readonly dot: string; readonly text: string }> = {
  "signal-orange": { dot: "bg-signal-orange", text: "text-signal-orange" },
  "tide-cyan": { dot: "bg-tide-cyan", text: "text-tide-cyan" },
  "moon-pale": { dot: "bg-moon-pale", text: "text-moon-pale" },
  "success-green": { dot: "bg-success-green", text: "text-success-green" },
  "amber-flag": { dot: "bg-amber-flag", text: "text-amber-flag" },
  "text-link": { dot: "bg-text-link", text: "text-text-link" },
};
