"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { instant, type MetresPerHour, type Sourced } from "@/core/units";
import {
  heightAt,
  nextSlackAfter,
  nextTurnAfter,
  readTideAt,
  turnsIn,
  type TideMotion,
} from "@/core/rules/tide";
import { daylightSpans, moonPhaseAt, sunEventsFor } from "@/core/rules/astro";
import { useNow } from "@/lib/time/use-now";
import { useUnitPreference, type UnitPreference } from "@/features/settings/units";

import { STATION_LOCATION, STATION_TIME_ZONE, TIDE_SELECTED_AT, loadTideSeriesFixture } from "./queries/tide-series";
import { useLocalTimeZone } from "./use-local-time-zone";
import { SourcedValue, unwrapSourced } from "./components/sourced-value";
import { MoonPhaseVisual } from "./components/moon-phase-visual";
import { TideTimeline, type SunMarker, type TideTimelineHandle } from "./components/tide-timeline";
import { DatesSheet, type CalendarDay } from "./components/dates-sheet";
import { MoonDetailsSheet } from "./components/moon-details-sheet";
import { StationDetailsSheet } from "./components/station-details-sheet";
import { TideDetailsSheet } from "./components/tide-details-sheet";
import { localDayIndex, localMidnights } from "./tide-chart-geometry";
import {
  clock,
  compactDate,
  dayLabel,
  formatDurationMagnitude,
  formatHeight,
  formatMoonIllumination,
  formatMoonPhaseName,
  formatMotion,
  formatRate,
  toDisplayHeight,
  zoneAbbreviation,
} from "./format";

type SheetName = "station" | "moon" | "tide" | "dates";

/** Under a minute apart is "now" — the clock only advances every 30s anyway. */
const AT_NOW_TOLERANCE_MS = 60_000;

/**
 * The tide screen: one screen, no vertical scrolling, the curve as the instrument.
 *
 * The shape of this file is the redesign. Everything that is true all the time but read
 * rarely — the NOAA station number and datum, the loaded-window counter, the unit toggle,
 * the lunar detail, the numbers table, the chart key — has left the screen for a bottom
 * sheet or for Settings. What is left is the five things the founder wants answered inside
 * two seconds: where am I, what is the tide doing, how high is it, when does it change,
 * and which day am I looking at.
 *
 * The header follows the READ-HEAD, not the wall clock. That reverses `07-tide-chart.md`'s
 * original "the state tiles always describe now" rule, and it is a deliberate reversal:
 * with a fixed centre read-head the whole screen is one instrument pointed at one instant,
 * and a header that silently described a different instant than the marker under the line
 * would be the worst kind of quiet lie. The honesty the old rule was protecting is kept by
 * making the difference loud instead: the readout is stamped with the time it describes,
 * NOW is drawn on the curve wherever it falls, and a Now control appears the moment the
 * read-head is anywhere else.
 */
export function TideScreen() {
  const series = useMemo(() => loadTideSeriesFixture(), []);
  const seriesStart = Number(series.samples[0].at);
  const seriesEnd = Number(series.samples[series.samples.length - 1].at);
  const initialAt = Math.max(seriesStart, Math.min(seriesEnd, Number(TIDE_SELECTED_AT)));

  const [unit] = useUnitPreference();
  const now = useNow();
  const localTimeZone = useLocalTimeZone();
  const displayTimeZone = localTimeZone ?? STATION_TIME_ZONE;
  // Clock times convert to the reader's own zone; the DATE control and the chart's day
  // dividers stay on the station's calendar day (see `tide-chart-geometry.ts`). For a
  // reader in the station's zone those never disagree. For anyone else they can, and the
  // readout then carries its zone so "9:56pm" under "MON, AUG 31" is not a puzzle.
  const zoneDiffersFromStation = localTimeZone !== null && localTimeZone !== STATION_TIME_ZONE;

  const [selectedAt, setSelectedAt] = useState(initialAt);
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const timelineRef = useRef<TideTimelineHandle>(null);
  const anchoredToNowRef = useRef(false);

  const nowMs = now === null ? null : Number(now);
  const nowWithinRange = nowMs !== null && nowMs >= seriesStart && nowMs <= seriesEnd;
  const currentAt = nowWithinRange ? nowMs : null;
  const atNow = currentAt !== null && Math.abs(selectedAt - currentAt) < AT_NOW_TOLERANCE_MS;

  // First paint centres on the fixture's own anchor (SSR-safe, no clock). The moment the
  // real clock arrives on the client, the timeline re-centres on now — once, so it never
  // yanks the chart back out from under someone who has already started scrubbing.
  useEffect(() => {
    if (anchoredToNowRef.current || currentAt === null) return;
    anchoredToNowRef.current = true;
    setSelectedAt(currentAt);
    timelineRef.current?.scrollToAt(currentAt, false);
  }, [currentAt]);

  const dayBoundaries = useMemo(
    () => [seriesStart, ...localMidnights(seriesStart, seriesEnd, STATION_TIME_ZONE)],
    [seriesStart, seriesEnd],
  );
  const calendarDays: CalendarDay[] = useMemo(
    () =>
      dayBoundaries.map((from, index) => {
        const to = dayBoundaries[index + 1] ?? seriesEnd;
        const anchor = Math.round(from + (to - from) / 2);
        return { from, to, anchor, moon: moonPhaseAt(instant(anchor)) };
      }),
    [dayBoundaries, seriesEnd],
  );

  const dayIndex = localDayIndex(selectedAt, seriesStart, STATION_TIME_ZONE);
  const day = calendarDays[dayIndex] ?? calendarDays[0];
  const finalDayIndex = calendarDays.length - 1;

  const spans = useMemo(
    () => daylightSpans(instant(seriesStart), instant(seriesEnd), STATION_LOCATION),
    [seriesStart, seriesEnd],
  );
  const turns = useMemo(() => turnsIn(series, instant(seriesStart), instant(seriesEnd)), [series, seriesStart, seriesEnd]);

  const sunMarkers: SunMarker[] = useMemo(() => {
    const markers: SunMarker[] = [];
    for (let i = 1; i < spans.length; i++) {
      const previous = spans[i - 1];
      const span = spans[i];
      const isSunrise = previous.phase !== "day" && span.phase === "day";
      const isSunset = previous.phase === "day" && span.phase !== "day";
      if (isSunrise || isSunset) markers.push({ at: Number(span.from), kind: isSunrise ? "sunrise" : "sunset" });
    }
    return markers;
  }, [spans]);

  const reading = readTideAt(series, instant(selectedAt));
  const selectedMoon = useMemo(() => moonPhaseAt(instant(selectedAt)), [selectedAt]);
  const selectedSun = useMemo(() => sunEventsFor(instant(selectedAt), STATION_LOCATION), [selectedAt]);
  const selectedPhase = useMemo(
    () => spans.find((span) => selectedAt >= Number(span.from) && selectedAt <= Number(span.to))?.phase ?? "day",
    [spans, selectedAt],
  );

  const nextTurn = reading?.nextTurn ?? nextTurnAfter(series, instant(selectedAt));
  const nextSlack = nextSlackAfter(series, instant(selectedAt));
  const slackIsSooner =
    nextSlack !== null && (nextTurn === null || Number(unwrapSourced(nextSlack).centre) < Number(nextTurn.at));

  const phaseNote = selectedPhase === "night" ? ", in darkness" : selectedPhase === "civil-twilight" ? ", near dawn or dusk" : "";
  const selectedHeightForText = useMemo(() => {
    const height = heightAt(series, instant(selectedAt));
    return height ? unwrapSourced(height) : null;
  }, [series, selectedAt]);
  const valueText =
    selectedHeightForText !== null
      ? `${formatHeight(selectedHeightForText, unit)} at ${clock(instant(selectedAt), displayTimeZone)}, ${dayLabel(instant(selectedAt), displayTimeZone)}${phaseNote}`
      : `No tide prediction at ${clock(instant(selectedAt), displayTimeZone)}, ${dayLabel(instant(selectedAt), displayTimeZone)}${phaseNote}`;

  const goToAt = (at: number) => {
    const clamped = Math.round(Math.max(seriesStart, Math.min(seriesEnd, at)));
    setSelectedAt(clamped);
    timelineRef.current?.scrollToAt(clamped, true);
  };

  /** Same clock time, one station day over — so stepping days does not also move the hour. */
  const goToDay = (index: number) => {
    const target = calendarDays[index];
    if (!target) return;
    const offsetInDay = selectedAt - day.from;
    goToAt(Math.min(target.from + offsetInDay, target.to - 1));
  };

  return (
    <section className="tide-screen">
      <header className="tide-header">
        <div className="tide-header-top">
          <button type="button" className="tide-station-button" aria-haspopup="dialog" onClick={() => setSheet("station")}>
            <span>{series.station.name}</span>
            <InfoGlyph />
          </button>
          <button
            type="button"
            className="tide-moon-button"
            aria-haspopup="dialog"
            aria-label={`Moon: ${formatMoonPhaseName(selectedMoon.name)}, ${formatMoonIllumination(selectedMoon.illumination)}. Open moon detail.`}
            onClick={() => setSheet("moon")}
          >
            <MoonPhaseVisual className="tide-moon-chip" id="header-moon" phase={selectedMoon} compact />
            <span aria-hidden="true">
              <span className="tide-moon-name">{formatMoonPhaseName(selectedMoon.name)} · </span>
              {formatMoonIllumination(selectedMoon.illumination)}
            </span>
          </button>
        </div>

        <button type="button" className="tide-readout" aria-haspopup="dialog" onClick={() => setSheet("tide")}>
          <span className="tide-readout-main">
            {reading ? (
              <SourcedValue
                className="tide-readout-height"
                value={reading.height}
                render={(value) => (
                  <>
                    {toDisplayHeight(value, unit).toFixed(2)}
                    <small>{unit}</small>
                  </>
                )}
              />
            ) : (
              <span className="tide-readout-height">—</span>
            )}
            <span className="tide-readout-when">
              {atNow && <span className="tide-readout-nowtag">Now</span>}
              <strong>{clock(instant(selectedAt), displayTimeZone)}</strong>
              {zoneDiffersFromStation && <span>{zoneAbbreviation(instant(selectedAt), displayTimeZone)}</span>}
            </span>
          </span>
          <span className="tide-readout-lines">
            {reading && <MotionLine motion={reading.motion} rate={reading.rate} unit={unit} />}
            <span className="tide-readout-next">
              {nextTurn ? (
                <>
                  <strong>{nextTurn.kind === "high" ? "High" : "Low"} {formatHeight(nextTurn.height, unit)}</strong>{" "}
                  in {formatDurationMagnitude(Number(nextTurn.at) - selectedAt)}
                </>
              ) : (
                <>No further turn in this window</>
              )}
              {slackIsSooner && nextSlack !== null && (
                <SourcedValue
                  className="tide-readout-slack"
                  value={nextSlack}
                  render={(value) => <>Slack in {formatDurationMagnitude(Number(value.centre) - selectedAt)}</>}
                />
              )}
            </span>
            <span className="tide-readout-more" aria-hidden="true">
              Tide detail <Chevron />
            </span>
          </span>
        </button>
      </header>

      <div className="tide-datebar">
        <button
          type="button"
          className="tide-step-button"
          aria-label="Previous day"
          disabled={dayIndex <= 0}
          onClick={() => goToDay(dayIndex - 1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button type="button" className="tide-date-button" aria-haspopup="dialog" onClick={() => setSheet("dates")}>
          {compactDate(instant(selectedAt), STATION_TIME_ZONE)}
          <Chevron />
        </button>
        <button
          type="button"
          className="tide-step-button"
          aria-label="Next day"
          disabled={dayIndex >= finalDayIndex}
          onClick={() => goToDay(dayIndex + 1)}
        >
          <span aria-hidden="true">›</span>
        </button>
        <span className="tide-now-slot">
          {currentAt !== null && !atNow && (
            <button type="button" className="tide-now-button" onClick={() => goToAt(currentAt)}>
              Now
            </button>
          )}
        </span>
      </div>

      <TideTimeline
        ref={timelineRef}
        series={series}
        seriesStart={seriesStart}
        seriesEnd={seriesEnd}
        unit={unit}
        displayTimeZone={displayTimeZone}
        stationTimeZone={STATION_TIME_ZONE}
        selectedAt={selectedAt}
        onSelectedAtChange={setSelectedAt}
        now={atNow ? null : currentAt}
        spans={spans}
        turns={turns}
        sunMarkers={sunMarkers}
        dayBoundaries={dayBoundaries.slice(1)}
        valueText={valueText}
      />

      <p className="sr-only" aria-live="polite">
        {valueText}
      </p>

      <StationDetailsSheet
        open={sheet === "station"}
        onClose={() => setSheet(null)}
        series={series}
        location={STATION_LOCATION}
        stationTimeZone={STATION_TIME_ZONE}
        displayTimeZone={displayTimeZone}
        selectedAt={selectedAt}
        seriesStart={seriesStart}
        seriesEnd={seriesEnd}
        dayCount={calendarDays.length}
        now={now}
      />
      <MoonDetailsSheet
        open={sheet === "moon"}
        onClose={() => setSheet(null)}
        phase={selectedMoon}
        at={selectedAt}
        sun={selectedSun}
        displayTimeZone={displayTimeZone}
      />
      <TideDetailsSheet
        open={sheet === "tide"}
        onClose={() => setSheet(null)}
        series={series}
        unit={unit}
        displayTimeZone={displayTimeZone}
        stationTimeZone={STATION_TIME_ZONE}
        dayFrom={day.from}
        dayTo={day.to}
        selectedAt={selectedAt}
        sun={selectedSun}
      />
      <DatesSheet
        open={sheet === "dates"}
        onClose={() => setSheet(null)}
        days={calendarDays}
        activeIndex={dayIndex}
        onPick={goToDay}
        stationTimeZone={STATION_TIME_ZONE}
      />
    </section>
  );
}

/**
 * Direction and speed on ONE line, from ONE `Sourced` value — so the readout carries two
 * provenance markers at most (the height, and this), not one per number. Which way the
 * water is moving and how fast is a single fact to an angler, and the glyph carries the
 * direction as well as the colour does.
 */
function MotionLine({
  motion,
  rate,
  unit,
}: {
  motion: TideMotion;
  rate: Sourced<MetresPerHour>;
  unit: UnitPreference;
}) {
  const glyph = motion === "rising" ? "▲" : motion === "falling" ? "▼" : "—";
  return (
    <span className="tide-readout-motion" data-motion={motion}>
      <span aria-hidden="true">{glyph}</span> {formatMotion(motion)}
      {motion !== "slack" && (
        <SourcedValue value={rate} render={(value) => <span className="tide-readout-rate">{formatRate(value, unit)}</span>} />
      )}
    </span>
  );
}

function InfoGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="tide-glyph">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7v4M8 4.75v.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 8 8" className="tide-glyph">
      <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
