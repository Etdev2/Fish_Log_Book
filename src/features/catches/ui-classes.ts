/**
 * One visual spec for the Fish Log's repeated controls.
 *
 * These deliberately match `features/tackle/ui-classes.ts` value for value rather than
 * importing it: ADR 005 §3 forbids one feature reaching into another's internals, and a
 * shared control that both features must agree on belongs in `src/components/` when a
 * third caller appears. Until then, duplication of four class strings is the cheaper
 * mistake than a cross-feature import.
 */

export const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

export const CHIP_CLASS = `min-h-touch-floor rounded-full border px-4 text-label transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;
export const CHIP_ON = "border-signal-orange bg-signal-orange text-ink-on-orange";
export const CHIP_OFF = "border-border-interactive text-text-link";
export const CHIP_OFF_ON_SURFACE = "border-border-interactive bg-surface text-text-link";

export const PRIMARY_BUTTON = `inline-flex min-h-touch-floor items-center justify-center rounded-md bg-signal-orange px-4 text-label font-semibold text-ink-on-orange transition-colors hover:bg-signal-orange-pressed ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

export const SECONDARY_BUTTON = `inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

export const INPUT_CLASS = `min-h-touch-floor w-full rounded-md border border-border-interactive bg-background px-4 text-body text-text-primary placeholder:text-text-muted ${FOCUS_RING}`;

/** Cards in the log list. One height rule, one radius, one border — spec §43. */
export const CARD_CLASS = "rounded-lg border border-hairline bg-surface";
