"use client";

import { useMemo } from "react";

import { instant, type Metres, type Sourced } from "@/core/units";
import {
  dailyRange,
  nextSlackAfter,
  readTideAt,
  turnsIn,
  type SlackWindow,
  type TidePredictionSeries,
} from "@/core/rules/tide";
import type { SunEvents } from "@/core/rules/astro";
import type { UnitPreference } from "@/features/settings/units";

import { BottomSheet, SheetRow } from "@/components/bottom-sheet";
import { SourcedValue } from "./sourced-value";
import { clock, dayLabel, formatHeight, formatMotion, formatPace, formatRate } from "../format";

/**
 * The numbers behind the curve, for the station day currently under the read-head.
 *
 * Scoped to ONE day on purpose. The old screen offered the whole cached window as a single
 * 78-row table behind a "Show the numbers instead" button, which is a different question
 * ("give me the raw data") from the one an angler actually asks at the rail ("what is this
 * day doing?"). Moving through days is what the timeline is for.
 */
export function TideDetailsSheet({
  open,
  onClose,
  series,
  unit,
  displayTimeZone,
  stationTimeZone,
  dayFrom,
  dayTo,
  selectedAt,
  sun,
}: {
  open: boolean;
  onClose: () => void;
  series: TidePredictionSeries;
  unit: UnitPreference;
  displayTimeZone: string;
  stationTimeZone: string;
  dayFrom: number;
  dayTo: number;
  selectedAt: number;
  sun: SunEvents;
}) {
  const turns = useMemo(() => turnsIn(series, instant(dayFrom), instant(dayTo)), [series, dayFrom, dayTo]);
  const range = useMemo(() => dailyRange(series, instant(dayFrom), instant(dayTo)), [series, dayFrom, dayTo]);
  const reading = useMemo(() => readTideAt(series, instant(selectedAt)), [series, selectedAt]);
  const slacks = useMemo(() => {
    const entries: { key: number; window: Sourced<SlackWindow> }[] = [];
    for (const turn of turns) {
      const window = nextSlackAfter(series, instant(Number(turn.at) - 1));
      if (window) entries.push({ key: Number(turn.at), window });
    }
    return entries;
  }, [series, turns]);
  const hourly = useMemo(() => {
    const rows: { at: number; height: Metres; turn: "high" | "low" | null }[] = [];
    for (const sample of series.samples) {
      const at = Number(sample.at);
      if (at < dayFrom || at >= dayTo) continue;
      const onTheHour = at % 3_600_000 === 0;
      if (!onTheHour && sample.turn === null) continue;
      rows.push({ at, height: sample.height, turn: sample.turn });
    }
    return rows;
  }, [series, dayFrom, dayTo]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow="Tide detail"
      title={dayLabel(instant(dayFrom), stationTimeZone)}
    >
      <ul className="app-sheet-turns">
        {turns.map((turn) => (
          <li key={String(turn.at)} data-turn={turn.kind}>
            <span>{turn.kind === "high" ? "High" : "Low"}</span>
            <strong>{formatHeight(turn.height, unit)}</strong>
            <span>{clock(turn.at, displayTimeZone)}</span>
          </li>
        ))}
        {turns.length === 0 && <li className="app-sheet-note">No turning point falls inside this day.</li>}
      </ul>

      <dl className="app-sheet-rows">
        <SheetRow label="Range this day">
          {range ? <SourcedValue value={range} render={(value) => <>{formatHeight(value, unit)}</>} /> : "—"}
        </SheetRow>
        <SheetRow label={`At ${clock(instant(selectedAt), displayTimeZone)}`}>
          {reading ? (
            <>
              <SourcedValue value={reading.height} render={(value) => <>{formatHeight(value, unit)}</>} /> ·{" "}
              {formatMotion(reading.motion)}{" "}
              <SourcedValue value={reading.rate} render={(value) => <>{formatRate(value, unit)}</>} />
              <span className="app-sheet-note">
                <SourcedValue value={reading.pace} render={(value) => <>{formatPace(value.class)} movement</>} />
                {reading.twelfths !== null && <> · about {reading.twelfths}/12 through this tide hour</>}
              </span>
            </>
          ) : (
            "No prediction at this time"
          )}
        </SheetRow>
        <SheetRow label="Slack windows">
          {slacks.length > 0 ? (
            <ul className="app-sheet-slacks">
              {slacks.map((entry) => (
                <li key={entry.key}>
                  <SourcedValue
                    value={entry.window}
                    render={(value) => (
                      <>
                        {clock(value.centre, displayTimeZone)}
                        <span className="app-sheet-note">
                          window {clock(value.from, displayTimeZone)}–{clock(value.to, displayTimeZone)}
                        </span>
                      </>
                    )}
                  />
                </li>
              ))}
            </ul>
          ) : (
            "—"
          )}
        </SheetRow>
        <SheetRow label="Light">
          {sun.sunrise && sun.sunset
            ? `Sunrise ${clock(sun.sunrise, displayTimeZone)} · Sunset ${clock(sun.sunset, displayTimeZone)}`
            : "The sun does not rise and set here today"}
        </SheetRow>
      </dl>

      <details className="app-sheet-disclosure">
        <summary>Every hour, in numbers</summary>
        <table className="app-sheet-table">
          <caption>Predicted height above {series.station.datum}, hourly, with the exact highs and lows.</caption>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Height</th>
              <th scope="col">Mark</th>
            </tr>
          </thead>
          <tbody>
            {hourly.map((row) => (
              <tr key={row.at} data-turn={row.turn ?? undefined}>
                <td>{clock(instant(row.at), displayTimeZone)}</td>
                <td>{formatHeight(row.height, unit)}</td>
                <td>{row.turn === "high" ? "High" : row.turn === "low" ? "Low" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </BottomSheet>
  );
}
