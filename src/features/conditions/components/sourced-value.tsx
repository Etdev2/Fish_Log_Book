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
            className="inline cursor-pointer text-caption font-normal text-text-muted marker:text-text-muted hover:text-text-primary"
            title={value.basis}
          >
            {CERTAINTY_TAG[value.certainty]}
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
