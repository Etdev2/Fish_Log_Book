/**
 * The passport's repeated controls.
 *
 * Copied value-for-value from `features/catches/ui-classes.ts` for the reason stated
 * there: ADR 005 §3 forbids reaching into another feature's internals, and four class
 * strings are a cheaper duplication than a cross-feature import. When a third caller
 * appears these move to `src/components/`.
 */

export const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

export const CHIP_CLASS = `min-h-touch-floor rounded-full border px-4 text-label transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;
export const CHIP_ON = "border-signal-orange bg-signal-orange text-ink-on-orange";
export const CHIP_OFF = "border-border-interactive bg-surface text-text-link";

export const SECONDARY_BUTTON = `inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

export const CARD_CLASS = "rounded-lg border border-hairline bg-surface";

export const SELECT_CLASS = `min-h-touch-floor rounded-md border border-border-interactive bg-background px-3 text-label text-text-primary ${FOCUS_RING}`;
