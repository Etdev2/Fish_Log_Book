"use client";

/**
 * The only reader of `Sourced<T>.value` under `src/features/**` (ADR 006 §5). Everywhere
 * else, `eslint.config.mjs`'s `local/no-raw-sourced-value` rule fails the build on it.
 *
 * Two exports, for the two legitimate reasons to need the raw value:
 *
 * `<SourcedValue>` is for anything rendered to the screen as a fact the angler reads — it
 * always shows `basis` alongside the value (a quiet caption for `"interpolated"`, an
 * "Estimated" prefix for `"estimated"`; `"published"` needs no disclaimer at all).
 *
 * `unwrapSourced()` is the narrow escape hatch for values that are consumed as numbers, not
 * presented as a fact on their own — chart geometry (where a height becomes a pixel
 * coordinate along a continuous curve) and non-JSX string attributes such as
 * `aria-valuetext`. The curve as a whole already carries its uncertainty via the "Cached
 * fixture" badge and the "Estimated" markers on the discrete points (slack, pace) that ARE
 * presented as facts; captioning every one of a few hundred plotting points along the line
 * itself would be exactly the clutter the brief said not to add.
 */
import type { Sourced } from "@/core/units";

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
        // The engine's own basis strings already say "Estimated ..." / "Interpolated ..."
        // (see height.ts, pace.ts, turns.ts) — no separate prefix needed here.
        <small className="mt-0.5 block text-caption font-normal text-text-muted">{value.basis}</small>
      )}
    </span>
  );
}

export function unwrapSourced<T>(value: Sourced<T>): T {
  return value.value;
}
