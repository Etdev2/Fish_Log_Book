"use client";

/**
 * A month-by-month ENSO strip across the whole loaded tide range (ADR 012).
 *
 * The chart shows a week, which always sits inside a single ENSO state, so shading only the
 * week would say nothing. The ribbon shows the years-out context instead: observed episodes
 * in solid colour, CPC outlook months faded and labelled with their probability, and months
 * past the outlook left empty as "no forecast".
 */
import { useMemo } from "react";

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
  const span = Math.max(1, toMs - fromMs);
  const left = Math.max(0, Math.min(100, ((viewFromMs - fromMs) / span) * 100));
  const width = Math.max(0.8, Math.min(100 - left, ((viewToMs - viewFromMs) / span) * 100));

  return (
    <figure className="mx-4 mt-3" aria-label="El Niño and La Niña across the loaded tide range">
      <div className="relative flex h-4 overflow-hidden rounded border border-hairline">
        {months.map((m) => (
          <span
            key={`${m.year}-${m.month}`}
            title={monthTitle(m)}
            data-phase={m.phase ?? "none"}
            data-basis={m.basis}
            className="h-full flex-1"
            style={{
              background: m.phase === null ? "transparent" : FILL[m.phase],
              opacity: m.basis === "outlook" ? 0.55 : 1,
              backgroundImage:
                m.basis === "outlook"
                  ? "repeating-linear-gradient(45deg, transparent 0 3px, var(--color-background) 3px 5px)"
                  : undefined,
            }}
          />
        ))}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 border-2 border-text-primary"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
      <figcaption className="mt-1 flex flex-wrap gap-x-3 text-caption text-text-muted">
        <span><span aria-hidden="true" style={{ color: "var(--color-signal-orange)" }}>■</span> El Niño</span>
        <span><span aria-hidden="true" style={{ color: "var(--color-tide-cyan)" }}>■</span> La Niña</span>
        <span>▨ CPC outlook (issued {OUTLOOK_ISSUED})</span>
        <span>□ no forecast</span>
        <span>
          Source: <a className="text-text-link" href={ONI_SOURCE_URL}>NOAA CPC ONI v5</a> ·{" "}
          <a className="text-text-link" href={OUTLOOK_SOURCE_URL}>outlook</a>
        </span>
      </figcaption>
    </figure>
  );
}
