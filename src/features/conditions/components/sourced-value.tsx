"use client";

/**
 * The only reader of `Sourced<T>.value` under `src/features/**` (ADR 006 §5). Everywhere
 * else, `eslint.config.mjs`'s `local/no-raw-sourced-value` rule fails the build on it.
 *
 * Two exports, for the two legitimate reasons to need the raw value:
 *
 * `<SourcedValue>` is for anything rendered to the screen as a fact the angler reads. The
 * founder's own reaction to the first pass: the full engine `basis` sentences ("Centred
 * finite difference over the monotone height curve...") are correct but far too long to
 * sit on screen as body text. So the honesty requirement in ADR 006 §5 is now satisfied by
 * the full text being GENUINELY AVAILABLE, not by it being permanently printed:
 * `"published"` values render with no marker at all (a verbatim NOAA number needs no
 * disclaimer); `"interpolated"`/`"estimated"` values get a one-word marker
 * ("Interpolated"/"Estimated") inside a native `<details>`/`<summary>` disclosure, which is
 * keyboard-operable and screen-reader-exposed with zero extra ARIA wiring, and also carries
 * the full sentence in a `title` attribute for a plain pointer hover. Tapping/toggling the
 * marker reveals the full `basis` sentence below it; nothing is ever hidden from
 * assistive tech, only collapsed by default, which is the standard disclosure pattern.
 *
 * Second founder round: `text-text-muted` read as inert caption text, not as something
 * tappable, and there is no hover to discover it with on a phone. The marker is now
 * `text-text-link` — the token the shell nav already uses for interactive text — with an
 * explicit chevron, because a colour change alone is not a reliable "this opens" signal
 * for the target user. `text-text-link` was picked over `tide-cyan` specifically so the
 * marker never competes with the curve or the orange SELECTED read-head for attention;
 * see the worklog for the measured contrast (this product has one theme, not two —
 * `01-foundations.md`'s "$darkOnlyByDesign" note — so there is nothing separate to check
 * in "light mode").
 *
 * No `open` attribute is ever set, and nothing here persists disclosure state anywhere —
 * every `<details>` starts (and reloads) collapsed, on purpose.
 *
 * `unwrapSourced()` is the narrow escape hatch for values that are consumed as numbers, not
 * presented as a fact on their own — chart geometry (where a height becomes a pixel
 * coordinate along a continuous curve) and non-JSX string attributes such as
 * `aria-valuetext`.
 */
import type { Sourced } from "@/core/units";

const CERTAINTY_TAG: Record<Exclude<Sourced<unknown>["certainty"], "published">, string> = {
  interpolated: "Interpolated",
  estimated: "Estimated",
};

export function SourcedValue<T>({
  value,
  render,
  className,
}: {
  value: Sourced<T>;
  render: (value: T) => React.ReactNode;
  className?: string;
}) {
  return (
    <span className={className}>
      {render(value.value)}
      {value.certainty !== "published" && (
        <details className="ml-1 inline-block align-baseline">
          <summary
            className="inline-flex cursor-pointer list-none items-center gap-0.5 text-caption font-semibold text-text-link [&::-webkit-details-marker]:hidden hover:text-text-primary"
            title={value.basis}
          >
            {CERTAINTY_TAG[value.certainty]}
            <svg aria-hidden="true" width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
              <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <p className="mt-1 max-w-xs text-caption font-normal text-text-muted">{value.basis}</p>
        </details>
      )}
    </span>
  );
}

export function unwrapSourced<T>(value: Sourced<T>): T {
  return value.value;
}
