"use client";

/**
 * A month-by-month ENSO strip across the whole loaded tide range (ADR 012).
 *
 * The chart shows a week, which always sits inside a single ENSO state, so shading only the
 * week would say nothing. The ribbon shows the years-out context instead: observed episodes
 * in solid colour, CPC outlook months faded and labelled with their probability, and months
 * past the outlook left empty as "no forecast".
 *
 * The strip itself is a picture. With two years in a phone-width row, one month is about
 * 12–15px wide, far under the 48px touch floor (`docs/design/03-touch-and-interaction.md`),
 * so months are not tapped on the strip. Instead the row under it steps one month at a time
 * with full-size ◀ ▶ buttons, the strip outlines the month being read, and the detail line
 * says its exact state in words. It starts on the month the chart's week sits in.
 */
import { useMemo, useState } from "react";

import { ensoMonths, isCoverageGap, type EnsoMonth } from "../enso/enso";
import { OUTLOOK_ISSUED, OUTLOOK_SOURCE_URL, ONI_SOURCE_URL } from "../enso/enso-data.generated";

const FILL: Record<string, string> = {
  "el-nino": "var(--color-signal-orange)",
  "la-nina": "var(--color-tide-cyan)",
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
  return `${when}: ${name} ${m.probability}% (CPC outlook)`;
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
  "flex size-touch-floor shrink-0 items-center justify-center rounded-md border border-border-interactive text-label text-text-link disabled:opacity-40 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

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
                background: m.phase === null ? "transparent" : FILL[m.phase],
                opacity: m.basis === "outlook" ? 0.55 : 1,
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
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          className={STEP}
          aria-label="Previous month"
          disabled={selected === undefined || keyOf(selected) === keyOf(months[0])}
          onClick={() => selected && setPicked(stepMonthKey(months, keyOf(selected), -1))}
        >
          ◀
        </button>
        <p aria-live="polite" className="min-w-0 flex-1 text-center text-caption text-text-primary">
          {selected !== undefined ? monthTitle(selected) : null}
        </p>
        <button
          type="button"
          className={STEP}
          aria-label="Next month"
          disabled={selected === undefined || keyOf(selected) === keyOf(months[months.length - 1])}
          onClick={() => selected && setPicked(stepMonthKey(months, keyOf(selected), 1))}
        >
          ▶
        </button>
      </div>
      <figcaption className="mt-1 flex flex-wrap gap-x-3 text-caption text-text-muted">
        <span><span aria-hidden="true" style={{ color: "var(--color-signal-orange)" }}>■</span> El Niño</span>
        <span><span aria-hidden="true" style={{ color: "var(--color-tide-cyan)" }}>■</span> La Niña</span>
        <span>▨ CPC outlook (issued {OUTLOOK_ISSUED})</span>
        <span>□ no forecast</span>
        {/* UI-1: 48 px source links (were 17 px inline). */}
        <span className="flex flex-wrap items-center gap-x-3">
          Source:
          <a className="inline-flex min-h-touch-floor items-center text-text-link underline" href={ONI_SOURCE_URL}>NOAA CPC ONI v5</a>
          <a className="inline-flex min-h-touch-floor items-center text-text-link underline" href={OUTLOOK_SOURCE_URL}>CPC outlook</a>
        </span>
      </figcaption>
    </figure>
  );
}
