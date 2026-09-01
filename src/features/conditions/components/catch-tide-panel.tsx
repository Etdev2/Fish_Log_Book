"use client";

import { useEffect, useRef } from "react";

import { saveConditionSnapshot } from "@/features/catches/store";
import type { ConditionSnapshotRecord } from "@/features/catches/conditions";
import { catchTideFillAt } from "@/core/rules/tide";
import { loadTideSeriesFixture } from "../queries/tide-series";
import type { UnitSystem } from "@/features/catches/format";

/** Schema tide_state → words. Kept here (not in conditions/format) because that module
    speaks the engine's TideMotion vocabulary; these are the *stored* state's words. */
const TIDE_STATE_LABEL: Record<"flood" | "ebb" | "slack", string> = {
  flood: "Flooding (coming in)",
  ebb: "Ebbing (going out)",
  slack: "Slack",
};

/**
 * The tide block on a Catch Detail page (founder Historical spec §6).
 *
 * Three honest states, no fourth:
 *
 *  1. **Captured** — the stored snapshot has tide numbers. Rendered exactly as stored;
 *     this component never recomputes a filled catch's tide, even if it could.
 *  2. **Filled now** — the snapshot is unfilled but the catch moment sits inside the
 *     cached tide series' window. The fill runs once, here, on device, and is written
 *     back to the same snapshot row. Next visit renders state 1.
 *  3. **Pending** — the moment is outside the cached window (most history today: the
 *     embedded fixture spans one station, a handful of days). The UI says so, in words,
 *     and shows nothing numeric. Nothing is estimated from a neighbouring day.
 *
 * Fresh water renders nothing at all: on a lake "no tide" is a fact of geography, not
 * a gap in data, and absence is information (the detail sheet's own rule).
 */
export function CatchTidePanel({
  snapshot,
  unitSystem,
}: {
  snapshot: ConditionSnapshotRecord | null;
  unitSystem: UnitSystem;
}) {
  // One fill attempt per snapshot per session. A null web series or an out-of-window
  // catch must not loop writes or recomputes; a later session (with a fresher cached
  // series) can try again.
  const attempted = useRef<string | null>(null);

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.tide_state !== null) return; // already captured
    if (snapshot.water_class !== "salt") return; // lakes have no tide to fill
    if (attempted.current === snapshot.id) return;
    attempted.current = snapshot.id;

    const atMs = Date.parse(snapshot.observed_at);
    const fill = catchTideFillAt(loadTideSeriesFixture(), atMs);
    if (fill === null) return; // outside the cached window: stays pending
    void saveConditionSnapshot({
      ...(snapshot as unknown as Record<string, unknown>),
      tide_height_m: fill.heightM,
      tide_rate_m_per_hr: fill.rateMPerHr,
      tide_state: fill.state,
      tide_pct_through_cycle: fill.pctThroughCycle,
      twelfths_hour: fill.twelfthsHour,
      tide_range_m: fill.rangeM,
      tide_curve: fill.curve,
      provenance: {
        ...snapshot.provenance,
        tide: "computed on device from the cached tide series at view time",
      },
      client_updated_at: new Date().toISOString(),
    } as unknown as { id: string } & Record<string, unknown>);
  }, [snapshot]);

  if (!snapshot || snapshot.water_class !== "salt") return null;

  if (snapshot.tide_state === null) {
    return (
      <section className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="text-h3">Tide</h2>
        <p className="mt-2 text-body text-text-muted">
          Tide for this catch is still pending — its moment is outside the tide window
          cached on this device. The record keeps waiting; nothing here is estimated.
        </p>
      </section>
    );
  }

  const height = metresDisplay(snapshot.tide_height_m, unitSystem);
  const range = metresDisplay(snapshot.tide_range_m, unitSystem);
  const rate =
    snapshot.tide_rate_m_per_hr === null
      ? null
      : metresPerHourDisplay(snapshot.tide_rate_m_per_hr, unitSystem);

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h2 className="text-h3">Tide at the catch</h2>
      <p className="mt-2 text-body">
        {[
          TIDE_STATE_LABEL[snapshot.tide_state],
          height !== null ? `${height} of water` : null,
          snapshot.tide_pct_through_cycle !== null
            ? `${Math.round(snapshot.tide_pct_through_cycle)}% through the ${snapshot.tide_state}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <p className="mt-1 text-caption text-text-muted">
        {[
          rate !== null ? `${rate}` : null,
          snapshot.twelfths_hour !== null
            ? `hour ${snapshot.twelfths_hour} of 6 by the rule of twelfths`
            : null,
          range !== null ? `day's range ${range}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {snapshot.tide_curve && snapshot.tide_curve.length > 1 ? (
        <TideCurve curve={snapshot.tide_curve} unitSystem={unitSystem} />
      ) : null}
    </section>
  );
}

/** Inline sparkline of the stored ±3h curve. Decorative; the numbers above carry the meaning. */
function TideCurve({
  curve,
  unitSystem,
}: {
  curve: readonly (readonly [number, number])[];
  unitSystem: UnitSystem;
}) {
  const minutes = curve.map(([m]) => m);
  const heights = curve.map(([, h]) => h);
  const minM = Math.min(...minutes);
  const maxM = Math.max(...minutes);
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const spanM = Math.max(1, maxM - minM);
  const spanH = Math.max(0.001, maxH - minH);

  const W = 280;
  const H = 64;
  const PAD = 4;
  const x = (m: number) => PAD + ((m - minM) / spanM) * (W - PAD * 2);
  const y = (h: number) => PAD + (1 - (h - minH) / spanH) * (H - PAD * 2);

  const path = curve
    .map(([m, h], i) => `${i === 0 ? "M" : "L"}${x(m).toFixed(1)},${y(h).toFixed(1)}`)
    .join(" ");

  const catchX = x(0);
  const unitLabel = unitSystem === "metric" ? "m" : "ft";

  return (
    <figure className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Tide height ±3 hours around the catch, ${minH.toFixed(2)} to ${maxH.toFixed(2)} metres`}
        className="w-full max-w-xs"
        preserveAspectRatio="none"
      >
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-link" />
        <line
          x1={catchX}
          y1={PAD}
          x2={catchX}
          y2={H - PAD}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          className="text-amber-flag"
        />
      </svg>
      <figcaption className="mt-1 text-caption text-text-muted">
        ±3h around the catch (dashed line), {minH.toFixed(2)}–{maxH.toFixed(2)} {unitLabel === "m" ? "m" : `${(minH * 3.28084).toFixed(1)}–${(maxH * 3.28084).toFixed(1)} ft`}.
      </figcaption>
    </figure>
  );
}

function metresDisplay(valueM: number | null, system: UnitSystem): string | null {
  if (valueM === null) return null;
  if (system === "metric") return `${valueM.toFixed(2)} m`;
  return `${(valueM * 3.28084).toFixed(1)} ft`;
}

function metresPerHourDisplay(valueMh: number, system: UnitSystem): string {
  const sign = valueMh > 0 ? "+" : "";
  if (system === "metric") return `${sign}${valueMh.toFixed(2)} m/h`;
  return `${sign}${(valueMh * 3.28084).toFixed(2)} ft/h`;
}
