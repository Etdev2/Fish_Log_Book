/**
 * The tournament section's control vocabulary.
 *
 * The previous version of this file was built on utilities that do not exist:
 * `bg-action`, `text-on-action`, `rounded-card`, `shadow-card`, `bg-surface-muted`.
 * Tailwind v4 generates utilities from the `@theme` block in `tokens.generated.css`, and
 * none of those names are in it — so every primary button in the tournament section
 * rendered as transparent text on the page background, and every card rendered as a
 * square with no radius. That is most of why this section looked unfinished next to the
 * rest of the app: it was not styled at all. Every class below is checked against
 * `src/core/design/tokens.json`.
 *
 * Values are the ones already agreed in `docs/design/04-components.md` and used by
 * `features/games/ui-classes.ts`. They are duplicated rather than imported for the reason
 * that file states: ADR 005 §3 forbids reaching into another feature's internals, and a
 * handful of class strings is a cheaper duplication than a cross-feature import.
 */

export const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";

/**
 * The page frame. Deliberately without horizontal padding of its own: the app shell
 * (`shell-frame.tsx`) already pads `main` by 16px, and the old wrapper added another 16 on
 * top of it, which cost 64px of a 390px phone before a card even started. Cards now run to
 * the shell's gutter, which is what gives a leaderboard row room to breathe.
 */
export const PAGE = "mx-auto flex w-full max-w-reading flex-col gap-space-6";

/** Resting card: `surface` fill, hairline border, radius-lg (design 04 → Card). */
export const CARD = "rounded-lg border border-hairline bg-surface";
export const CARD_PADDED = `${CARD} p-space-4`;

/** The open/active state of a card, and the frame for anything that sits above one. */
export const CARD_RAISED = "rounded-lg border border-border-interactive bg-surface-raised";
export const CARD_RAISED_PADDED = `${CARD_RAISED} p-space-4`;

/** An inset block *inside* a card — an evidence row, a rule line, a warning panel. */
export const INSET = "rounded-md border border-hairline bg-background p-space-3";

const BUTTON_BASE = `inline-flex min-h-touch-floor items-center justify-center gap-space-2 rounded-md px-space-4 text-label transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-disabled`;

export const PRIMARY_BUTTON = `${BUTTON_BASE} bg-signal-orange text-ink-on-orange hover:bg-signal-orange-pressed`;

export const SECONDARY_BUTTON = `${BUTTON_BASE} border border-border-interactive bg-surface-raised text-text-primary hover:border-text-link`;

/** No fill, no border. For "Back", "Skip", and other low-emphasis moves. */
export const TERTIARY_BUTTON = `${BUTTON_BASE} text-text-link hover:text-text-primary`;

/**
 * The screen-level primary action — 68px, full width (design 03 §1). The one control on a
 * live-competition screen that has to be hit with wet hands without looking.
 */
export const BIG_ACTION = `flex min-h-touch-primary-standard w-full items-center justify-center gap-space-2 rounded-lg bg-signal-orange px-space-4 text-h3 text-ink-on-orange transition-colors hover:bg-signal-orange-pressed ${FOCUS_RING} active:scale-95 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-disabled`;

export const INPUT = `min-h-touch-floor w-full rounded-md border border-border-interactive bg-background px-space-4 py-space-3 text-body text-text-primary placeholder:text-text-muted ${FOCUS_RING} focus:border-focus-ring`;

export const SELECT = `min-h-touch-floor w-full rounded-md border border-border-interactive bg-background px-space-3 text-body text-text-primary ${FOCUS_RING}`;

/**
 * Chip picker (design 04 → Select/Chip picker). Selected is an orange fill, because a
 * selected chip is a committed choice — the same weight as a tap on a button.
 */
export const CHIP = `inline-flex min-h-touch-floor items-center justify-center rounded-full border px-space-4 text-label transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;
export const CHIP_ON = "border-signal-orange bg-signal-orange text-ink-on-orange";
export const CHIP_OFF = "border-border-interactive bg-surface text-text-link hover:border-text-link";

/** The "← Tournaments" line at the top of a detail screen. 48px of tap area, not 20. */
export const BACK_LINK = `inline-flex min-h-touch-floor items-center gap-space-2 self-start rounded-md text-caption text-text-link transition-colors hover:text-text-primary ${FOCUS_RING}`;

/** Numbers that line up in a column: weights, ranks, counts, clocks. */
export const TABULAR = "font-mono tabular-nums";

/**
 * Kept as named aliases because `app/(app)/tournaments/error.tsx` and any future screen
 * outside this feature import by these names. Same values, real utilities underneath.
 */
export const TOURNAMENT_CARD = CARD_PADDED;
export const TOURNAMENT_PRIMARY_BUTTON = PRIMARY_BUTTON;
export const TOURNAMENT_SECONDARY_BUTTON = SECONDARY_BUTTON;
export const TOURNAMENT_INPUT = INPUT;
