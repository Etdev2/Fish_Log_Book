"use client";

import { instant, type Instant } from "@/core/units";
import type { TidePredictionSeries } from "@/core/rules/tide";
import type { GeoPoint } from "@/core/rules/astro";

import { ConditionsSheet, SheetRow } from "./conditions-sheet";
import { clock, dayLabel, formatCoordinates, monthDay, zoneAbbreviation } from "../format";

/**
 * Everything technical about where these numbers come from, in one sheet.
 *
 * This is the content that used to sit permanently under the chart — the NOAA station
 * number, the datum, the "N station days loaded" counter, the provenance footnote. All of
 * it is true, none of it changes minute to minute, and an angler needs it roughly once.
 * The two things that are safety-relevant rather than merely informative — that this is a
 * cached prediction, and the warning when the cache no longer covers the current time —
 * lead the sheet instead of being buried in it.
 */
export function StationDetailsSheet({
  open,
  onClose,
  series,
  location,
  stationTimeZone,
  displayTimeZone,
  selectedAt,
  seriesStart,
  seriesEnd,
  dayCount,
  now,
}: {
  open: boolean;
  onClose: () => void;
  series: TidePredictionSeries;
  location: GeoPoint;
  stationTimeZone: string;
  displayTimeZone: string;
  selectedAt: number;
  seriesStart: number;
  seriesEnd: number;
  dayCount: number;
  now: Instant | null;
}) {
  const zonesDiffer = displayTimeZone !== stationTimeZone;
  const nowOutsideWindow = now !== null && (Number(now) < seriesStart || Number(now) > seriesEnd);

  return (
    <ConditionsSheet open={open} onClose={onClose} eyebrow="Station" title={series.station.name}>
      <p className="tide-sheet-badge">Cached prediction — not a live reading</p>

      {nowOutsideWindow && now !== null && (
        <p className="tide-sheet-warning">
          Your clock reads {dayLabel(now, displayTimeZone)}, {clock(now, displayTimeZone)} —{" "}
          {Number(now) < seriesStart ? "before" : "after"} this cached window. There is no live marker on the chart,
          and the cached data itself is aging out of date.
        </p>
      )}

      <dl className="tide-sheet-rows">
        <SheetRow label="NOAA station">{series.station.id}</SheetRow>
        <SheetRow label="Datum">Heights are measured above {series.station.datum}</SheetRow>
        <SheetRow label="Position">{formatCoordinates(location.latitude, location.longitude)}</SheetRow>
        <SheetRow label="Station clock">{zoneAbbreviation(instant(selectedAt), stationTimeZone)}</SheetRow>
        <SheetRow label="Times shown in">
          {zoneAbbreviation(instant(selectedAt), displayTimeZone)}
          {zonesDiffer && (
            <span className="tide-sheet-note">
              Your own zone. Clock times convert to it; the date divisions follow the station&rsquo;s calendar day, the
              way NOAA&rsquo;s own daily tables are dated.
            </span>
          )}
        </SheetRow>
        <SheetRow label="Loaded window">
          {monthDay(instant(seriesStart), stationTimeZone)}–{monthDay(instant(seriesEnd), stationTimeZone)} ·{" "}
          {dayCount} station days
        </SheetRow>
        <SheetRow label="Predictions">
          {series.samples.length} points, every exact turning point kept
        </SheetRow>
        <SheetRow label="Source">
          Real NOAA CO-OPS predictions
          {series.retrievedAt !== null && (
            <span className="tide-sheet-note">
              Retrieved {dayLabel(series.retrievedAt, displayTimeZone)}, {clock(series.retrievedAt, displayTimeZone)}
            </span>
          )}
        </SheetRow>
      </dl>

      <p className="tide-sheet-note">
        One station is loaded. Choosing between stations is a separate decision and is not built yet.
      </p>
    </ConditionsSheet>
  );
}
