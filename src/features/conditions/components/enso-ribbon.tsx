"use client";

/**
 * A month-by-month ENSO strip across the whole loaded tide range (ADR 012).
 *
 * The chart shows a week, which always sits inside a single ENSO state, so shading only the
 * week would say nothing. The ribbon shows the years-out context instead: observed episodes
 * in solid colour, CPC outlook months hatched and labelled with their probability, and months
 * past the outlook left empty as "no forecast".
 *
 * The strip itself is a picture. With two years in a phone-width row, one month is about
 * 12–15px wide, far under the 48px touch floor (`docs/design/03-touch-and-interaction.md`),
 * so months are not tapped on the strip. Instead the row under it steps one month at a time
 * with full-size "Previous month" / "Next month" buttons, the strip outlines the month being
 * read, and the detail line
 * says its exact state in words. It starts on the month the chart's week sits in.
 */
import { useMemo, useState } from "react";

import { ensoMonths, isCoverageGap, type EnsoMonth } from "../enso/enso";
import { OUTLOOK_ISSUED, OUTLOOK_SOURCE_URL, ONI_SOURCE_URL } from "../enso/enso-data.generated";

// Not orange (that means "tap this") and not cyan (that means tide): the ribbon has its own
// pair, told apart by lightness (docs/design/02-semantic-colors.md, ENSO).
const FILL: Record<string, string> = {
  "el-nino": "var(--color-enso-warm)",
  "la-nina": "var(--color-enso-cool)",
  neutral: "var(--color-surface-raised)",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthTitle(m: EnsoMonth): string {
  const when = `${MONTHS[m.month - 1]} ${m.year}`;
  if (m.basis === "none" && isCoverageGap(m)) {
    return `${when}: no ENSO value yet (between the last observed season and CPC's outlook)`;
  }
  if (m.basis === "none") return `${when}: no ENSO forecast this far out`;
  const name = m.phase === "el-nino" ? "El Niño" : m.phase === "la-nina" ? "La Niña" : "Neutral";
  if (m.basis === "observed") return `${when}: ${name} (ONI ${m.oni! > 0 ? "+" : ""}${m.oni!.toFixed(2)} °C)`;
  return `${when}: ${name} ${m.probability}% (CPC outlook, RONI)`;
}

/**
 * Each month's share of `[fromMs, toMs]` in milliseconds, so the strip uses the same linear
 * time scale as the week marker. Partial endpoint months get only the slice they cover.
 */
export function monthSpans(months: readonly EnsoMonth[], fromMs: number, toMs: number): number[] {
  return months.map((m) => {
    const start = Math.max(fromMs, Date.UTC(m.year, m.month - 1, 1));
    const end = Math.min(toMs, Date.UTC(m.year, m.month, 1));
    return Math.max(0, end - start);
  });
}

/** The key of the month `delta` steps from `fromKey`, clamped to the loaded range. */
export function stepMonthKey(months: readonly EnsoMonth[], fromKey: string, delta: number): string | null {
  if (months.length === 0) return null;
  const at = months.findIndex((m) => `${m.year}-${m.month}` === fromKey);
  const next = Math.max(0, Math.min(months.length - 1, (at === -1 ? 0 : at) + delta));
  const m = months[next];
  return `${m.year}-${m.month}`;
}

const STEP =
  "flex min-h-touch-floor flex-1 items-center justify-center gap-2 rounded-md border border-border-interactive px-3 text-label text-text-link disabled:opacity-40 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export function EnsoRibbon({
  fromMs,
  toMs,
  viewFromMs,
  viewToMs,
}: {
  fromMs: number;
  toMs: number;
  viewFromMs: number;
  viewToMs: number;
}) {
  const months = useMemo(() => ensoMonths(fromMs, toMs), [fromMs, toMs]);
  const spans = useMemo(() => monthSpans(months, fromMs, toMs), [months, fromMs, toMs]);
  const [picked, setPicked] = useState<string | null>(null);
  const viewMid = new Date((viewFromMs + viewToMs) / 2);
  const viewKey = `${viewMid.getUTCFullYear()}-${viewMid.getUTCMonth() + 1}`;
  const keyOf = (m: EnsoMonth) => `${m.year}-${m.month}`;
  const selected =
    months.find((m) => keyOf(m) === picked) ?? months.find((m) => keyOf(m) === viewKey) ?? months[0];
  const span = Math.max(1, toMs - fromMs);
  const left = Math.max(0, Math.min(100, ((viewFromMs - fromMs) / span) * 100));
  const width = Math.max(0.8, Math.min(100 - left, ((viewToMs - viewFromMs) / span) * 100));

  return (
    <figure className="mx-4 mt-3" aria-label="El Niño and La Niña across the loaded tide range">
      <div className="relative flex h-4 overflow-hidden rounded border border-hairline">
        {months.map((m, i) => {
          const k = keyOf(m);
          const isSelected = selected !== undefined && keyOf(selected) === k;
          return (
            <span
              key={k}
              aria-hidden="true"
              data-phase={m.phase ?? "none"}
              data-basis={m.basis}
              className={`h-full min-w-0 ${isSelected ? "outline outline-2 -outline-offset-2 outline-text-primary" : ""}`}
              style={{
                flex: `${spans[i]} 1 0`,
                // Outlook months keep their full colour and carry the hatch instead of a fade:
                // fading pulled El Niño, La Niña and neutral under the 3:1 pair floor.
                background: m.phase === null ? "transparent" : FILL[m.phase],
                backgroundImage:
                  m.basis === "outlook"
                    ? "repeating-linear-gradient(45deg, transparent 0 3px, var(--color-background) 3px 5px)"
                    : undefined,
              }}
            />
          );
        })}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 border-2 border-text-primary"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
      <p aria-live="polite" className="mt-1 text-center text-caption text-text-primary">
        {selected !== undefined ? monthTitle(selected) : null}
      </p>
      {/* Words on the buttons, not just arrows: every icon button carries a visible label
          that is also its accessible name (docs/design/04-components.md). */}
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          className={STEP}
          disabled={selected === undefined || keyOf(selected) === keyOf(months[0])}
          onClick={() => selected && setPicked(stepMonthKey(months, keyOf(selected), -1))}
        >
          <span aria-hidden="true">◀</span> Previous month
        </button>
        <button
          type="button"
          className={STEP}
          disabled={selected === undefined || keyOf(selected) === keyOf(months[months.length - 1])}
          onClick={() => selected && setPicked(stepMonthKey(months, keyOf(selected), 1))}
        >
          Next month <span aria-hidden="true">▶</span>
        </button>
      </div>
      <figcaption className="mt-1 flex flex-wrap gap-x-3 text-caption text-text-muted">
        <span><span aria-hidden="true" style={{ color: FILL["el-nino"] }}>■</span> El Niño</span>
        <span><span aria-hidden="true" style={{ color: FILL["la-nina"] }}>■</span> La Niña</span>
        <span>▨ CPC outlook (issued {OUTLOOK_ISSUED})</span>
        <span>□ no forecast</span>
        <span>
          {/* Two index bases, named both times (docs/fl-1/decisions.md Q4): history is ONI,
              CPC verifies its outlook against RONI, and the two can differ by half a degree. */}
          Source: <a className="text-text-link" href={ONI_SOURCE_URL}>NOAA CPC ONI v5</a> (history) ·{" "}
          <a className="text-text-link" href={OUTLOOK_SOURCE_URL}>CPC outlook</a> (RONI)
        </span>
      </figcaption>
    </figure>
  );
}
