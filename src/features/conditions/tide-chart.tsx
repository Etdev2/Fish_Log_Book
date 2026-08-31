"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { instant, metres, type Metres } from "@/core/units";
import {
  dailyRange,
  heightAt,
  nextSlackAfter,
  nextTurnAfter,
  readTideAt,
  turnsIn,
  type TideMotion,
} from "@/core/rules/tide";
import { daylightSpans, moonPhaseAt, sunEventsFor, type DaylightSpan } from "@/core/rules/astro";
import { useNow } from "@/lib/time/use-now";
import { useUnitPreference } from "@/features/settings/units";

import { TIDE_SELECTED_AT, loadTideSeriesFixture, STATION_LOCATION, STATION_TIME_ZONE } from "./queries/tide-series";
import { useLocalTimeZone } from "./use-local-time-zone";
import { SourcedValue, unwrapSourced } from "./components/sourced-value";
import { MoonPhaseVisual } from "./components/moon-phase-visual";
import {
  CHART_HEIGHT,
  LEFT_PADDING,
  MS_PER_PIXEL,
  PLOT_HEIGHT,
  PLOT_TOP,
  chartWidthFor,
  curvePath,
  labelPlate,
  localDayIndex,
  localMidnights,
  makeYFor,
  xFor as xForAt,
} from "./tide-chart-geometry";
import {
  clock,
  calendarDayNumber,
  calendarWeekday,
  dayLabel,
  formatCountdown,
  formatHeight,
  formatMoonIllumination,
  formatMoonPhaseName,
  formatMotion,
  formatPace,
  formatRate,
  monthDay,
  shortDay,
  stationHour,
  zoneAbbreviation,
} from "./format";

const CURVE_STEP_MS = 15 * 60_000;
// Founder-measured: the previous, more conservative shading read as invisible; these two
// opacities are what the founder asked to keep. The comment that used to sit here claimed
// they kept every foreground colour above "the 4.5:1 text floor" — that number is plain
// WCAG AA, not this project's own 7:1 floor for required information
// (`docs/design/06-accessibility-baseline.md` §1), and measuring against it was
// papering over a real gap: text-muted over the day band alone measures 4.88:1.
// Solved structurally instead of by dimming the band (which the founder explicitly
// asked to keep strong) or lowering the standard (not this role's file to change):
// no text sits directly on the shaded fill any more. The band itself (below) is now
// clipped to exactly the plot's vertical span, so the day-of-week and hour-axis labels
// above/below it fall on the card's plain, unshaded `surface` instead — where
// `text-muted` already has a documented, accepted 6.48:1 exception for this exact
// category of helper label (`01-foundations.md` §1.2). Every label that has to sit AT
// the curve's own height — the H/L labels, the sunrise/sunset labels, NOW — gets an
// opaque `labelPlate()` backing rect instead, so its real background is
// `--color-background`, not the composited band; every colour used on that backing
// (text-muted 7.05:1, text-primary 17.24:1, tide-cyan 9.53:1, amber-flag 10.21:1) clears
// 7:1. This product is dark-only by design (`tokens.json`'s `$darkOnlyByDesign`; the
// "dark-mode" media-query block in `tokens.generated.css` is byte-identical to the base
// tokens) — there is one theme to measure, not two; see the worklog for the full ratio
// table, including the composited band colours these numbers were checked against.
const NIGHT_SHADE_OPACITY = 0.9;
const DAY_SHADE_OPACITY = 0.12;
// A sunrise/sunset marker this close (in pixels) to a turn marker suppresses its own
// text label to avoid the two colliding at this chart's zoom; the marker and its
// accessible name stay either way.
const SUN_TURN_LABEL_COLLISION_PX = 40;
const KEY_STEP_MS = 15 * 60_000;
const KEY_STEP_MS_FAST = 180 * 60_000;
const DRAG_EDGE_PX = 72;
const LONG_PRESS_MS = 260;

type ChartPointer = {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  active: boolean;
};

export function TideChart() {
  const series = useMemo(() => loadTideSeriesFixture(), []);
  const seriesStart = Number(series.samples[0].at);
  const seriesEnd = Number(series.samples[series.samples.length - 1].at);
  const totalMs = seriesEnd - seriesStart;
  // The fixture's own anchor for the demo read-head — chosen at fetch time to sit near
  // "now", clamped into the loaded window in case the snapshot has since aged past it.
  const initialSelectedAt = Math.max(seriesStart, Math.min(seriesEnd, Number(TIDE_SELECTED_AT)));

  const [unit, setUnit] = useUnitPreference();
  const now = useNow();
  // The viewer's own zone, resolved after hydration; the station's zone is the
  // SSR-safe fallback so server and first-client-render markup match exactly.
  const localTimeZone = useLocalTimeZone();
  const displayTimeZone = localTimeZone ?? STATION_TIME_ZONE;
  const zoneDiffersFromStation = localTimeZone !== null && localTimeZone !== STATION_TIME_ZONE;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const calendarRailRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<ChartPointer | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centerFrameRef = useRef<number | null>(null);
  const [selectedAt, setSelectedAt] = useState<number>(initialSelectedAt);
  const [tableOpen, setTableOpen] = useState(false);
  const [centerAt, setCenterAt] = useState<number>(initialSelectedAt);

  const xFor = (at: number) => xForAt(at, seriesStart);
  const chartWidth = chartWidthFor(seriesStart, seriesEnd);

  const { yMinimum, yMaximum } = useMemo(() => {
    const heights = series.samples.map((s) => Number(s.height));
    const low = Math.min(...heights);
    const high = Math.max(...heights);
    const pad = (high - low) * 0.2;
    return { yMinimum: low - pad, yMaximum: high + pad };
  }, [series]);
  const yFor = useMemo(() => makeYFor(yMinimum, yMaximum), [yMinimum, yMaximum]);

  // The plotted curve reads heights from the engine's monotone-cubic heightAt, not the raw
  // sample tuples. Dense uniform sampling (plus every published sample instant, so the
  // curve still passes exactly through each one) means the shape between turns follows the
  // engine's monotone Hermite curve — which cannot overshoot a published high/low — rather
  // than whatever the Catmull-Rom smoothing pass below would invent between coarse points.
  // Catmull-Rom stays as presentation, drawn through these engine-sourced points.
  const path = useMemo(() => {
    const instants = new Set<number>();
    for (const sample of series.samples) instants.add(Number(sample.at));
    for (let t = seriesStart; t <= seriesEnd; t += CURVE_STEP_MS) instants.add(t);
    instants.add(seriesEnd);
    const sorted = [...instants].sort((a, b) => a - b);
    // heightAt cannot actually return null for any `t` in this loop — every value here is
    // `seriesStart <= t <= seriesEnd`, and heightAt's own range check is inclusive at both
    // ends — but the point is dropped rather than plotted at a fabricated 0m if that
    // invariant is ever wrong, instead of drawing a curve that silently dives to zero.
    const points: (readonly [number, number])[] = [];
    for (const t of sorted) {
      const height = heightAt(series, instant(t));
      if (!height) continue;
      points.push([xFor(t), yFor(unwrapSourced(height))]);
    }
    return curvePath(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, seriesStart, seriesEnd, yFor]);

  const reading = readTideAt(series, instant(selectedAt));
  // Genuinely nullable, not defaulted to 0m — `clampAt` keeps `selectedAt` inside the
  // series today, so `reading` is never actually null in this build, but the SELECTED
  // marker and its aria-valuetext both key off this null rather than assuming that
  // holds forever (a live fetch with a real gap, or a future catch-marker click, could
  // make it false) — see the worklog.
  const selectedHeight: Metres | null = reading ? unwrapSourced(reading.height) : null;
  const selectedX = xFor(selectedAt);
  const selectedY = selectedHeight !== null ? yFor(selectedHeight) : null;
  const nowWithinRange = now !== null && Number(now) >= seriesStart && Number(now) <= seriesEnd;
  const currentAt = nowWithinRange && now !== null ? Number(now) : null;

  // Day boundaries are anchored to the STATION's calendar day, not the viewer's — a tide
  // table is about a place, the same way NOAA's own daily tables are dated by the
  // station's day regardless of who reads them. Every label attached to one of these
  // boundaries (the gridline weekday, the day-nav heading, the numbers table's sections)
  // uses STATION_TIME_ZONE for exactly this reason; a specific instant's own clock time
  // still converts to the viewer's zone everywhere else on this screen.
  const dayBoundaryStarts = useMemo(
    () => [seriesStart, ...localMidnights(seriesStart, seriesEnd, STATION_TIME_ZONE)],
    [seriesStart, seriesEnd],
  );
  const calendarDays = useMemo(
    () =>
      dayBoundaryStarts.map((from, index) => {
        const to = dayBoundaryStarts[index + 1] ?? seriesEnd;
        const anchor = Math.round(from + (to - from) / 2);
        return { from, to, anchor, moon: moonPhaseAt(instant(anchor)) };
      }),
    [dayBoundaryStarts, seriesEnd],
  );
  const currentReading = currentAt !== null ? readTideAt(series, instant(currentAt)) : null;
  const currentDayIndex = currentAt !== null ? localDayIndex(currentAt, seriesStart, STATION_TIME_ZONE) : null;
  const currentDayStart = currentDayIndex !== null ? (dayBoundaryStarts[currentDayIndex] ?? seriesStart) : null;
  const currentDayEnd = currentDayIndex !== null ? (dayBoundaryStarts[currentDayIndex + 1] ?? seriesEnd) : null;
  const currentRange =
    currentDayStart !== null && currentDayEnd !== null
      ? dailyRange(series, instant(currentDayStart), instant(currentDayEnd))
      : null;
  const currentNextSlack = currentAt !== null ? nextSlackAfter(series, instant(currentAt)) : null;
  const currentNextTurn =
    currentAt !== null ? (currentReading?.nextTurn ?? nextTurnAfter(series, instant(currentAt))) : null;

  const turns = useMemo(
    () => turnsIn(series, instant(seriesStart), instant(seriesEnd)),
    [series, seriesStart, seriesEnd],
  );

  // All turns' slack windows in the loaded range, for the on-curve markers.
  const slackWindows = useMemo(() => {
    return turns
      .map((turn) => nextSlackAfter(series, instant(Number(turn.at) - 1)))
      .filter((window): window is NonNullable<typeof window> => window !== null);
  }, [series, turns]);

  // Day/night shading, the real astro engine (ADR 006 §2). Iterate and paint — no date
  // arithmetic here, per biostat's note: the spans are already contiguous and gap-free.
  const spans = useMemo(
    () => daylightSpans(instant(seriesStart), instant(seriesEnd), STATION_LOCATION),
    [seriesStart, seriesEnd],
  );
  const chartMoon = useMemo(() => moonPhaseAt(instant(centerAt)), [centerAt]);
  const selectedDaySun = useMemo(() => sunEventsFor(instant(selectedAt), STATION_LOCATION), [selectedAt]);

  // The day <-> twilight transition instants, for the on-curve sun markers (drawn at the
  // curve's own height, the same way the H/L turn dots are — not floating above it).
  const sunMarkers = useMemo(() => {
    const markers: { at: number; kind: "sunrise" | "sunset" }[] = [];
    for (let i = 1; i < spans.length; i++) {
      const previous = spans[i - 1];
      const span = spans[i];
      const isSunrise = previous.phase !== "day" && span.phase === "day";
      const isSunset = previous.phase === "day" && span.phase !== "day";
      if (isSunrise || isSunset) {
        markers.push({ at: Number(span.from), kind: isSunrise ? "sunrise" : "sunset" });
      }
    }
    return markers;
  }, [spans]);

  // What the shading already says visually — needed as the non-visual equivalent on the
  // scroller's aria-valuetext, per the brief, and also to answer the founder's own stated
  // glance test directly on the "Next turn" cell ("is the next turn in daylight").
  const selectedPhase = useMemo(() => phaseAtFrom(spans, selectedAt), [spans, selectedAt]);
  const chartPhase = useMemo(() => phaseAtFrom(spans, centerAt), [spans, centerAt]);
  const chartPhaseLabel = chartPhase === "day" ? "Daylight" : chartPhase === "night" ? "Night" : "Twilight";
  const chartPhaseSymbol = chartPhase === "day" ? "☀" : chartPhase === "night" ? "☾" : "◐";
  const selectedPhaseNote =
    selectedPhase === "night" ? ", in darkness" : selectedPhase === "civil-twilight" ? ", near dawn or dusk" : "";
  // Not memoized — a handful-of-elements linear scan over `spans`, cheap enough to just
  // compute on every render (the compiler itself declined to memoize this exact shape;
  // see the worklog).
  const nextTurnPhase = currentNextTurn ? phaseAtFrom(spans, Number(currentNextTurn.at)) : null;
  const nextTurnPhaseLabel =
    nextTurnPhase === "night" ? "after dark" : nextTurnPhase === "civil-twilight" ? "near dawn/dusk" : nextTurnPhase === "day" ? "in daylight" : null;

  // The sighted view already gates its height display on `reading` (nothing renders in
  // the header pill or the "Selected" status cell when it's null). aria-valuetext must be
  // gated identically — reading a fabricated "0.00 ft" aloud as if it were real would be
  // the same lie in a worse place: a screen-reader user would hear a reading a sighted
  // user is never shown.
  const selectedValueText = reading
    ? `${formatHeight(selectedHeight as Metres, unit)} at ${clock(instant(selectedAt), displayTimeZone)}, ${dayLabel(instant(selectedAt), displayTimeZone)}${selectedPhaseNote}`
    : `No tide prediction available at ${clock(instant(selectedAt), displayTimeZone)}, ${dayLabel(instant(selectedAt), displayTimeZone)}${selectedPhaseNote}`;

  // The "Now" nav button: honest about the two ways it can't act, rather than
  // scrolling to a clamped edge and implying that edge is "now" (same rule as the
  // live curve marker).
  const nowButtonDisabledReason =
    now === null
      ? "Waiting for the clock."
      : !nowWithinRange
        ? "Now falls outside this cached window."
        : null;
  const atNow = nowWithinRange && now !== null && Math.abs(selectedAt - Number(now)) < 60_000;
  const nowHeightValue = useMemo(() => {
    if (!nowWithinRange || now === null) return null;
    const h = heightAt(series, now);
    return h ? unwrapSourced(h) : null;
  }, [nowWithinRange, now, series]);

  const scrollToAt = (at: number, smooth = true) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({
      left: Math.max(0, xFor(at) - scroller.clientWidth / 2),
      behavior: smooth && !reducedMotion ? "smooth" : "auto",
    });
  };

  const clampAt = (at: number) => Math.round(Math.max(seriesStart, Math.min(seriesEnd, at)));

  const updateCenter = () => {
    const scroller = scrollerRef.current;
    if (!scroller || centerFrameRef.current !== null) return;
    centerFrameRef.current = requestAnimationFrame(() => {
      centerFrameRef.current = null;
      setCenterAt(clampAt(seriesStart + (scroller.scrollLeft + scroller.clientWidth / 2 - LEFT_PADDING) * MS_PER_PIXEL));
    });
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollToAt(initialSelectedAt, false);
      updateCenter();
    });
    return () => {
      cancelAnimationFrame(frame);
      if (centerFrameRef.current !== null) cancelAnimationFrame(centerFrameRef.current);
      if (longPressTimerRef.current !== null) clearTimeout(longPressTimerRef.current);
    };
    // Runs once, to center the initial read-head after layout — scrollToAt/updateCenter
    // intentionally excluded, same as the original chart's mount-only effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedAt]);

  const keepVisible = (at: number, scroller: HTMLDivElement) => {
    const relativeX = xFor(at) - scroller.scrollLeft;
    if (relativeX < DRAG_EDGE_PX) scroller.scrollLeft = Math.max(0, xFor(at) - DRAG_EDGE_PX);
    if (relativeX > scroller.clientWidth - DRAG_EDGE_PX) {
      scroller.scrollLeft = Math.min(scroller.scrollWidth - scroller.clientWidth, xFor(at) - scroller.clientWidth + DRAG_EDGE_PX);
    }
  };

  const selectAt = (at: number, keepInView = false) => {
    const scroller = scrollerRef.current;
    const next = clampAt(at);
    setSelectedAt(next);
    if (!scroller) return;
    if (keepInView) keepVisible(next, scroller);
  };

  const jumpToDay = (dayIndex: number) => {
    const day = calendarDays[dayIndex];
    if (!day) return;
    const isFinalDay = dayIndex === calendarDays.length - 1;
    const nowFallsInDay =
      currentAt !== null &&
      currentAt >= day.from &&
      (isFinalDay ? currentAt <= day.to : currentAt < day.to);
    const target = nowFallsInDay ? currentAt : day.anchor;
    selectAt(target);
    scrollToAt(target);
  };

  const atFromPointer = (clientX: number, scroller: HTMLDivElement) => {
    const rect = scroller.getBoundingClientRect();
    const contentX = scroller.scrollLeft + clientX - rect.left;
    return seriesStart + (contentX - LEFT_PADDING) * MS_PER_PIXEL;
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const endPointer = (pointerId: number) => {
    if (dragRef.current?.pointerId !== pointerId) return;
    clearLongPress();
    dragRef.current = null;
  };

  const moveReadHead = (deltaMs: number) => selectAt(selectedAt + deltaMs, true);

  const currentDay = localDayIndex(centerAt, seriesStart, STATION_TIME_ZONE);
  const finalDay = localDayIndex(seriesEnd, seriesStart, STATION_TIME_ZONE);

  useEffect(() => {
    const rail = calendarRailRef.current;
    const active = rail?.querySelector<HTMLButtonElement>(`[data-day-index="${currentDay}"]`);
    if (!rail || !active) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({
      left: Math.max(0, active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [currentDay]);

  // The next upcoming event (of turn vs. slack) gets slightly stronger emphasis, per brief.
  const soonestIsSlack =
    currentNextSlack !== null &&
    (currentNextTurn === null || Number(unwrapSourced(currentNextSlack).centre) < Number(currentNextTurn.at));

  return (
    <section className="tide-page">
      <header className="tide-page-header">
        <div className="tide-title-row">
          <div className="tide-title-block">
            <h1 className="tide-page-title">Tides</h1>
            <p className="tide-station-name">{series.station.name}</p>
          </div>
          <UnitToggle unit={unit} onChange={setUnit} />
        </div>
        <div className="tide-meta-row">
          <span>NOAA {series.station.id} · {calendarDays.length} station days loaded</span>
        </div>
      </header>

      <div className="tide-chart-card">
        <div className="tide-chart-header">
          <div className="tide-day-navigator">
            <button
              className="tide-day-button"
              type="button"
              disabled={currentDay <= 0}
              onClick={() => jumpToDay(currentDay - 1)}
            >
              <span aria-hidden="true">‹</span> Prev
            </button>
            <h2 className="tide-day-heading">
              {dayLabel(instant(centerAt), STATION_TIME_ZONE)}
              <small>Station date</small>
            </h2>
            <button
              className="tide-day-button"
              type="button"
              disabled={currentDay >= finalDay}
              onClick={() => jumpToDay(currentDay + 1)}
            >
              Next <span aria-hidden="true">›</span>
            </button>
          </div>

          <div
            className="tide-moon-panel"
            data-chart-moon={chartMoon.name}
            data-chart-illumination={Math.round(chartMoon.illumination * 100)}
            data-chart-light={chartPhase}
          >
            <MoonPhaseVisual
              className="tide-chart-moon"
              id="chart-date"
              phase={chartMoon}
            />
            <div className="tide-moon-copy">
              <span>Chart moon</span>
              <strong>{formatMoonPhaseName(chartMoon.name)}</strong>
              <small>
                {formatMoonIllumination(chartMoon.illumination)} · <span aria-hidden="true">{chartPhaseSymbol}</span>{" "}
                {chartPhaseLabel}
              </small>
            </div>
          </div>

          <div className="tide-calendar-block">
            <div className="tide-calendar-heading">
              <span>Chart calendar</span>
              <small>
                {monthDay(instant(calendarDays[0].from), STATION_TIME_ZONE)}–{monthDay(instant(calendarDays[calendarDays.length - 1].to), STATION_TIME_ZONE)}
              </small>
            </div>
            <div ref={calendarRailRef} className="tide-calendar-rail" role="group" aria-label="Loaded tide prediction dates">
              {calendarDays.map((day, index) => {
                const active = index === currentDay;
                return (
                  <button
                    key={day.from}
                    type="button"
                    className="tide-calendar-day"
                    data-day-index={index}
                    aria-pressed={active}
                    aria-label={`${dayLabel(instant(day.anchor), STATION_TIME_ZONE)}, ${formatMoonPhaseName(day.moon.name)}, ${formatMoonIllumination(day.moon.illumination)}`}
                    onClick={() => jumpToDay(index)}
                  >
                    <span>{calendarWeekday(instant(day.anchor), STATION_TIME_ZONE)}</span>
                    <strong>{calendarDayNumber(instant(day.anchor), STATION_TIME_ZONE)}</strong>
                    <MoonPhaseVisual
                      className="tide-calendar-moon"
                      id={`calendar-${day.from}`}
                      phase={day.moon}
                      compact
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="tide-chart-viewport">
          <svg className="tide-axis" width="46" height={CHART_HEIGHT} aria-hidden="true">
            {gridValues(yMinimum, yMaximum).map((value) => (
              <text className="fill-text-muted font-mono text-[11px]" key={value} x="36" y={yFor(metres(value)) + 4} textAnchor="end">
                {formatHeight(metres(value), unit).replace(` ${unit}`, "")}
              </text>
            ))}
            <text className="fill-text-muted font-mono text-[11px]" x="36" y={PLOT_TOP + PLOT_HEIGHT + 24} textAnchor="end">
              {unit}
            </text>
          </svg>
          <div
            ref={scrollerRef}
            className="tide-chart-scroller"
            tabIndex={0}
            role="slider"
            aria-label="Tide height by time. Swipe horizontally to move through time. Press and hold to select a point. Use left and right arrows to adjust the selected point."
            aria-valuemin={0}
            aria-valuemax={totalMs}
            aria-valuenow={Math.round(selectedAt - seriesStart)}
            aria-valuetext={selectedValueText}
            onScroll={updateCenter}
            onPointerDown={(event) => {
              clearLongPress();
              const pointer: ChartPointer = {
                pointerId: event.pointerId,
                pointerType: event.pointerType,
                startX: event.clientX,
                startY: event.clientY,
                active: event.pointerType === "mouse",
              };
              dragRef.current = pointer;
              if (pointer.active) {
                event.currentTarget.setPointerCapture(event.pointerId);
                selectAt(atFromPointer(event.clientX, event.currentTarget));
                return;
              }
              longPressTimerRef.current = setTimeout(() => {
                const pending = dragRef.current;
                const scroller = scrollerRef.current;
                if (!pending || pending.pointerId !== event.pointerId || !scroller) return;
                pending.active = true;
                scroller.setPointerCapture(event.pointerId);
                selectAt(atFromPointer(pending.startX, scroller));
              }, LONG_PRESS_MS);
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) {
                if (event.pointerType === "mouse" && event.buttons === 0) {
                  selectAt(atFromPointer(event.clientX, event.currentTarget));
                }
                return;
              }
              const horizontalDistance = event.clientX - drag.startX;
              const verticalDistance = event.clientY - drag.startY;
              if (!drag.active) {
                if (Math.hypot(horizontalDistance, verticalDistance) < 8) return;
                clearLongPress();
                dragRef.current = null;
                return;
              }
              event.preventDefault();
              selectAt(atFromPointer(event.clientX, event.currentTarget), true);
            }}
            onPointerUp={(event) => {
              endPointer(event.pointerId);
            }}
            onPointerCancel={(event) => {
              endPointer(event.pointerId);
            }}
            onKeyDown={(event) => {
              const step = event.shiftKey ? KEY_STEP_MS_FAST : KEY_STEP_MS;
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveReadHead(step);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveReadHead(-step);
              } else if (event.key === "Home") {
                event.preventDefault();
                selectAt(seriesStart, true);
              } else if (event.key === "End") {
                event.preventDefault();
                selectAt(seriesEnd, true);
              }
            }}
          >
            <svg
              width={chartWidth}
              height={CHART_HEIGHT}
              role="img"
              aria-label="Continuous tide prediction for Newport Bay Entrance across the loaded window, with labelled highs and lows, explicit daylight and night shading, distinct sunrise-up and sunset-down markers, and estimated slack markers."
            >
              <defs>
                <linearGradient id="tide-area" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="var(--color-tide-cyan)" stopOpacity=".3" />
                  <stop offset="1" stopColor="var(--color-tide-cyan)" stopOpacity="0" />
                </linearGradient>
                {/* One gradient per civil-twilight span: dawn goes night-color -> day-color
                    left to right, dusk goes the other way. This is what makes twilight read
                    as a transition rather than a third, arbitrary flat colour. */}
                {spans.map((span, index) => {
                  if (span.phase !== "civil-twilight") return null;
                  const previous = spans[index - 1];
                  const isDawn = previous?.phase === "night";
                  return (
                    <linearGradient key={`grad-${span.from}`} id={`twilight-${span.from}`} x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0" stopColor={isDawn ? "var(--color-background)" : "var(--color-moon-pale)"} stopOpacity={isDawn ? NIGHT_SHADE_OPACITY : DAY_SHADE_OPACITY} />
                      <stop offset="1" stopColor={isDawn ? "var(--color-moon-pale)" : "var(--color-background)"} stopOpacity={isDawn ? DAY_SHADE_OPACITY : NIGHT_SHADE_OPACITY} />
                    </linearGradient>
                  );
                })}
              </defs>

              {/* Day/night shading. A warm, clearly lighter tint by day and a deep, clearly
                  darker one by night, with civil twilight as the gradient between them —
                  the founder's ask was to tell at a glance whether an event falls in daylight
                  or darkness, and a single flat "unshaded = day" look measured as too subtle
                  to answer that. Clipped to exactly the plot's vertical span (no more bleed
                  into the day-of-week row above or the hour-axis row below) — see the
                  NIGHT_SHADE_OPACITY comment above for why, and the worklog for every
                  measured ratio. */}
              {spans.map((span) => {
                const x1 = xFor(Number(span.from));
                const x2 = xFor(Number(span.to));
                const width = Math.max(0, x2 - x1);
                const fill =
                  span.phase === "civil-twilight"
                    ? `url(#twilight-${span.from})`
                    : span.phase === "night"
                      ? "var(--color-background)"
                      : "var(--color-moon-pale)";
                const opacity = span.phase === "civil-twilight" ? 1 : span.phase === "night" ? NIGHT_SHADE_OPACITY : DAY_SHADE_OPACITY;
                return (
                  <rect
                    key={`${span.from}-${span.phase}`}
                    x={x1}
                    y={PLOT_TOP}
                    width={width}
                    height={PLOT_HEIGHT}
                    fill={fill}
                    opacity={opacity}
                  />
                );
              })}

              {gridValues(yMinimum, yMaximum).map((value) => (
                <line key={value} x1="0" x2={chartWidth} y1={yFor(metres(value))} y2={yFor(metres(value))} stroke="var(--color-hairline)" />
              ))}
              {dayBoundaryStarts.slice(1).map((at) => (
                <g key={at}>
                  <line x1={xFor(at)} x2={xFor(at)} y1={PLOT_TOP - 14} y2={PLOT_TOP + PLOT_HEIGHT + 30} stroke="var(--color-border-interactive)" strokeDasharray="2 5" />
                  <text x={xFor(at) + 8} y={PLOT_TOP - 6} className="fill-text-muted font-mono text-[11px] font-semibold tracking-widest">
                    {shortDay(instant(at), STATION_TIME_ZONE).toUpperCase()}
                  </text>
                </g>
              ))}
              {timeLabels(seriesStart, seriesEnd, displayTimeZone).map((at) => (
                <text key={at} x={xFor(at)} y={PLOT_TOP + PLOT_HEIGHT + 24} textAnchor="middle" className="fill-text-muted font-mono text-[12px]">
                  {String(stationHour(instant(at), displayTimeZone)).padStart(2, "0")}:00
                </text>
              ))}

              <path d={`${path}L${xFor(seriesEnd)},${PLOT_TOP + PLOT_HEIGHT}L${xFor(seriesStart)},${PLOT_TOP + PLOT_HEIGHT}Z`} fill="url(#tide-area)" />
              <path d={path} fill="none" stroke="var(--color-tide-cyan)" strokeOpacity=".12" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              <path d={path} fill="none" stroke="var(--color-tide-cyan)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {turns.map((turn) => {
                const labelText = `${formatHeight(turn.height, unit)} ${clock(turn.at, displayTimeZone)}`;
                const labelX = xFor(Number(turn.at));
                const labelY = yFor(turn.height) + (turn.kind === "high" ? -14 : 22);
                const plate = labelPlate(labelX, labelY, labelText, 12);
                return (
                  <g key={String(turn.at)}>
                    <circle cx={labelX} cy={yFor(turn.height)} r="5" fill="var(--color-tide-cyan)" stroke="var(--color-surface)" strokeWidth="2" />
                    {/* Opaque backing plate: this label sits at the curve's own height, which
                        can fall anywhere inside the day or night band, so its real background
                        has to be a solid colour rather than the composited band underneath —
                        see the NIGHT_SHADE_OPACITY comment above. */}
                    <rect x={plate.x} y={plate.y} width={plate.width} height={plate.height} rx="3" fill="var(--color-background)" />
                    <text x={labelX} y={labelY} textAnchor="middle" className="fill-text-primary font-mono text-[12px] font-semibold">
                      {formatHeight(turn.height, unit)} <tspan className="fill-text-muted font-normal">{clock(turn.at, displayTimeZone)}</tspan>
                    </text>
                  </g>
                );
              })}

              {/* Sunrise/sunset, ON the curve at its actual height — not floating above it —
                  so the chart answers "what is the tide doing at sunrise" without any mental
                  arithmetic. A sun glyph (not another coloured circle) keeps it visually
                  distinct from the cyan H/L dots, the orange SELECTED read-head, and the
                  muted NOW marker. */}
              {sunMarkers.map((marker) => {
                const h = heightAt(series, instant(marker.at));
                if (!h) return null;
                const value = unwrapSourced(h);
                const x = xFor(marker.at);
                const y = yFor(value);
                const isSunrise = marker.kind === "sunrise";
                const label = isSunrise ? "Sunrise" : "Sunset";
                const direction = isSunrise ? "↑" : "↓";
                const accessibleName = `${label}, ${clock(instant(marker.at), displayTimeZone)}, tide ${formatHeight(value, unit)}`;
                const collidesWithTurn = turns.some((turn) => Math.abs(xFor(Number(turn.at)) - x) < SUN_TURN_LABEL_COLLISION_PX);
                const labelY = isSunrise ? y - 18 : y + 28;
                return (
                  <g
                    key={`sun-${marker.at}`}
                    data-sun-transition={marker.kind}
                    {...(collidesWithTurn ? { role: "img", "aria-label": accessibleName } : {})}
                  >
                    <SunTransitionGlyph kind={marker.kind} x={x} y={y} />
                    {!collidesWithTurn && (
                      <>
                        {(() => {
                          const plate = labelPlate(x, labelY, `${direction} ${label} ${clock(instant(marker.at), displayTimeZone)}`, 11);
                          return <rect x={plate.x} y={plate.y} width={plate.width} height={plate.height} rx="3" fill="var(--color-background)" />;
                        })()}
                        <text x={x} y={labelY} textAnchor="middle" className="fill-text-primary font-mono text-[11px] font-semibold">
                          <tspan fill={isSunrise ? "var(--color-amber-flag)" : "var(--color-signal-orange)"}>{direction}</tspan>{" "}
                          {label} <tspan className="fill-text-muted font-normal">{clock(instant(marker.at), displayTimeZone)}</tspan>
                        </text>
                      </>
                    )}
                  </g>
                );
              })}

              {/* Slack markers — estimated, so a diamond rather than the turn's filled circle.
                  Skipped, not drawn at a fabricated 0m, if the height is unavailable — same
                  pattern as the sun markers above and the NOW marker below. */}
              {slackWindows.map((window) => {
                const centre = unwrapSourced(window).centre;
                const h = heightAt(series, centre);
                if (!h) return null;
                const value = unwrapSourced(h);
                const x = xFor(Number(centre));
                const y = yFor(value);
                return (
                  <rect
                    key={`slack-${centre}`}
                    aria-hidden="true"
                    x={x - 4.5}
                    y={y - 4.5}
                    width="9"
                    height="9"
                    transform={`rotate(45 ${x} ${y})`}
                    fill="none"
                    stroke="var(--color-text-muted)"
                    strokeWidth="2"
                  />
                );
              })}

              {nowWithinRange && now !== null && nowHeightValue !== null && (
                <g>
                  <line x1={xFor(Number(now))} x2={xFor(Number(now))} y1={PLOT_TOP - 8} y2={PLOT_TOP + PLOT_HEIGHT} stroke="var(--color-text-muted)" strokeWidth="2" strokeDasharray="1 3" />
                  <circle cx={xFor(Number(now))} cy={yFor(nowHeightValue)} r="5" fill="var(--color-surface)" stroke="var(--color-text-muted)" strokeWidth="2" />
                  {(() => {
                    const plate = labelPlate(xFor(Number(now)), PLOT_TOP - 12, "NOW", 10);
                    return <rect x={plate.x - 3} y={plate.y} width={plate.width + 6} height={plate.height} rx="3" fill="var(--color-background)" />;
                  })()}
                  <text x={xFor(Number(now))} y={PLOT_TOP - 12} textAnchor="middle" className="fill-text-muted font-mono text-[10px] font-semibold tracking-chart-pill">
                    NOW
                  </text>
                </g>
              )}

              {/* Gated on a real reading rather than drawing the dot at a fabricated 0m — this
                  cannot actually happen today (`clampAt` always keeps `selectedAt` inside the
                  series), but the honest failure mode is no marker, not a marker in the wrong
                  place implying a real reading exists. */}
              {selectedY !== null && (
                <>
                  <line x1={selectedX} x2={selectedX} y1={PLOT_TOP} y2={PLOT_TOP + PLOT_HEIGHT} stroke="var(--color-signal-orange)" strokeWidth="2" strokeDasharray="3 4" />
                  <circle cx={selectedX} cy={selectedY} r="6.5" fill="var(--color-signal-orange)" stroke="var(--color-surface)" strokeWidth="2.5" />
                </>
              )}
            </svg>
          </div>
        </div>
        <div className="tide-selection-strip" aria-live="polite">
          <div className="tide-selected-reading">
            <span className="tide-reading-label">Selected point</span>
            {reading ? (
              <>
                <SourcedValue
                  value={reading.height}
                  render={(value) => <strong>{formatHeight(value, unit)}</strong>}
                />
                <span>
                  {formatMotion(reading.motion)} · {clock(instant(selectedAt), displayTimeZone)} · {shortDay(instant(selectedAt), displayTimeZone)}
                </span>
              </>
            ) : (
              <strong>Unavailable</strong>
            )}
          </div>
          <button
            className="tide-now-button"
            type="button"
            aria-pressed={atNow || undefined}
            title={nowButtonDisabledReason ?? undefined}
            aria-describedby={nowButtonDisabledReason ? "now-button-reason" : undefined}
            disabled={!nowWithinRange}
            onClick={() => {
              if (!nowWithinRange || now === null) return;
              selectAt(Number(now));
              scrollToAt(Number(now));
            }}
          >
            {atNow ? "At now" : "Jump to now"}
          </button>
        </div>
        {nowButtonDisabledReason && (
          <span id="now-button-reason" className="sr-only">
            {nowButtonDisabledReason}
          </span>
        )}
        <div className="tide-chart-footer">
          <p className="tide-gesture-hint">Swipe to move through time · Press and hold to inspect</p>
          <details className="tide-legend-disclosure">
            <summary className="tide-disclosure-summary">
              Chart key
              <DisclosureChevron />
            </summary>
            <div className="tide-legend-grid">
              <span className="tide-legend-tide">Tide height</span>
              <span className="tide-legend-selected">Selected time</span>
              <span className="tide-legend-slack">Estimated slack</span>
              <span className="tide-legend-sunrise">Sunrise · daylight begins</span>
              <span className="tide-legend-sunset">Sunset · darkness follows</span>
              <span>Background bands show daylight, twilight, and night · Arrow keys adjust by 15 minutes</span>
            </div>
          </details>
        </div>
      </div>

      <section className="tide-current-card" aria-labelledby="current-tide-heading">
        <header className="tide-current-header">
          <div>
            <p className="tide-live-label"><span aria-hidden="true" /> Right now</p>
            <h2 id="current-tide-heading" className="tide-current-heading">
              {currentAt !== null ? `${clock(instant(currentAt), displayTimeZone)} ${zoneAbbreviation(instant(currentAt), displayTimeZone)}` : "Outside the cached window"}
            </h2>
          </div>
          {currentReading && <MotionPill motion={currentReading.motion} />}
        </header>

        {currentReading && currentAt !== null ? (
          <>
            <div className="tide-current-overview">
              <div className="tide-current-height">
                <span>Predicted height</span>
                <SourcedValue value={currentReading.height} render={(value) => <strong>{formatHeight(value, unit)}</strong>} />
              </div>
              <div className="tide-movement-details">
                <SourcedValue value={currentReading.rate} render={(value) => <span>{formatRate(value, unit)}</span>} />
                <SourcedValue value={currentReading.pace} render={(value) => <span>{formatPace(value.class)} movement</span>} />
                {currentReading.twelfths !== null && (
                  <span aria-label={`Rule of twelfths: approximately ${currentReading.twelfths} twelfths of the tidal range this tide hour`}>
                    About {currentReading.twelfths}/12 through this tide hour
                  </span>
                )}
              </div>
            </div>

            <dl className="tide-event-list">
              <EventCell
                label={currentNextTurn ? `Next ${currentNextTurn.kind}` : "Next turn"}
                emphasis={!soonestIsSlack && currentNextTurn !== null}
              >
                {currentNextTurn ? (
                  <>
                    <strong>{clock(currentNextTurn.at, displayTimeZone)}</strong>
                    <span>
                      {formatCountdown(Number(currentNextTurn.at) - currentAt, currentNextTurn.kind)}
                      {nextTurnPhaseLabel && <> · {nextTurnPhaseLabel}</>}
                    </span>
                  </>
                ) : "—"}
              </EventCell>
              <EventCell label="Next slack" emphasis={soonestIsSlack}>
                {currentNextSlack ? (
                  <SourcedValue
                    value={currentNextSlack}
                    render={(value) => (
                      <>
                        <strong>{clock(value.centre, displayTimeZone)}</strong>
                        <span>
                          {formatCountdown(Number(value.centre) - currentAt, "slack")} · window {clock(value.from, displayTimeZone)}–{clock(value.to, displayTimeZone)}
                        </span>
                      </>
                    )}
                  />
                ) : "—"}
              </EventCell>
              <EventCell label={`${monthDay(instant(currentAt), displayTimeZone)} range`}>
                {currentRange ? <SourcedValue value={currentRange} render={(value) => <strong>{formatHeight(value, unit)}</strong>} /> : "—"}
              </EventCell>
            </dl>
          </>
        ) : (
          <p className="tide-current-unavailable">
            This saved prediction does not cover the current time. Explore the cached dates above, but do not treat them as a live reading.
          </p>
        )}
      </section>
      {/* PRIMARY/SECONDARY info stays visible: what the numbers mean, and the two things
          that are required disclosures (cached-fixture, and the aged-out-window warning
          when it applies, which is a safety-relevant "don't trust this marker" notice, not
          decoration). Everything else that used to sit here as its own paragraph — the
          zone-difference explanation, the sun/moon-are-calculated disclaimer, and the raw
          data-provenance footnote — is TERTIARY: true every time, useful rarely, and was
          part of the wall of simultaneous caption text this pass was asked to fix. Folded
          into one disclosure below rather than removed. */}
      <div className="tide-data-panel">
        <p className="tide-datum-line">
          Predicted height above {series.station.datum} · times shown in {zoneAbbreviation(instant(selectedAt), displayTimeZone)}
        </p>
        <span className="tide-cache-badge">
          Cached prediction — not a live reading
        </span>
        {now !== null && !nowWithinRange && (
          <p className="tide-stale-warning">
            Live clock: {dayLabel(now, displayTimeZone)}, {clock(now, displayTimeZone)} —{" "}
            {Number(now) < seriesStart ? "before" : "after"} this cached window, so there is no live marker on the chart today,
            and the cached data itself is aging out of date.
          </p>
        )}
        <details className="tide-about-disclosure">
          <summary className="tide-disclosure-summary">
            More about this chart
            <DisclosureChevron />
          </summary>
          <div className="tide-about-content">
            {zoneDiffersFromStation && (
              <p>
                Station {series.station.name} is in {zoneAbbreviation(instant(selectedAt), STATION_TIME_ZONE)}; every clock
                time on this screen is converted to your local{" "}
                {zoneAbbreviation(instant(selectedAt), displayTimeZone)}. The day divisions (the day-nav buttons, the
                gridlines, the numbers table) follow the station&rsquo;s own calendar day.
              </p>
            )}
            <p>
              Sun and moon times are calculated, not measured.{" "}
              {selectedDaySun.sunrise && selectedDaySun.sunset
                ? `Sunrise ${clock(selectedDaySun.sunrise, displayTimeZone)} · Sunset ${clock(selectedDaySun.sunset, displayTimeZone)}.`
                : "The sun does not rise or set here today."}
            </p>
            <p>
              {series.samples.length} renderable points across the loaded window, with every exact turning point kept. Real
              NOAA CO-OPS predictions{series.retrievedAt !== null && (
                <> retrieved {dayLabel(series.retrievedAt, displayTimeZone)}, {clock(series.retrievedAt, displayTimeZone)}</>
              )}. Station <code className="font-mono text-caption text-text-primary">{series.station.id}</code>, datum{" "}
              <code className="font-mono text-caption text-text-primary">{series.station.datum}</code>.
            </p>
          </div>
        </details>
      </div>

      <button
        className="tide-table-button"
        type="button"
        aria-expanded={tableOpen}
        aria-controls="tide-table"
        onClick={() => setTableOpen((open) => !open)}
      >
        {tableOpen ? "Hide the numbers" : "Show the numbers instead"}
      </button>
      {tableOpen && (
        <div id="tide-table" className="tide-table-wrap">
          <table className="tide-tide-table">
            <caption className="p-3 text-left text-caption text-text-muted">
              Predicted height above {series.station.datum}, hourly, with the exact highs and lows. Station-local time.
            </caption>
            <thead>
              <tr className="border-t border-hairline text-left text-caption uppercase tracking-wider text-text-muted">
                <th className="px-3.5 py-2 font-medium">Time</th>
                <th className="px-3.5 py-2 font-medium">Height</th>
                <th className="px-3.5 py-2 font-medium">Mark</th>
              </tr>
            </thead>
            <tbody>{tableRows(series, seriesStart, unit, STATION_TIME_ZONE)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UnitToggle({ unit, onChange }: { unit: "ft" | "m"; onChange: (unit: "ft" | "m") => void }) {
  return (
    <fieldset className="tide-unit-toggle">
      <legend className="sr-only">Height units</legend>
      <button type="button" aria-pressed={unit === "ft"} onClick={() => onChange("ft")}>Feet</button>
      <button type="button" aria-pressed={unit === "m"} onClick={() => onChange("m")}>Metres</button>
    </fieldset>
  );
}

function MotionPill({ motion }: { motion: TideMotion }) {
  const glyph = motion === "rising" ? "▲" : motion === "falling" ? "▼" : "—";
  return (
    <span className="tide-motion-pill">
      <span aria-hidden="true">{glyph}</span> {formatMotion(motion)}
    </span>
  );
}

function SunTransitionGlyph({
  kind,
  x,
  y,
}: {
  kind: "sunrise" | "sunset";
  x: number;
  y: number;
}) {
  const isSunrise = kind === "sunrise";
  const color = isSunrise ? "var(--color-amber-flag)" : "var(--color-signal-orange)";
  const horizonY = isSunrise ? y + 3 : y - 3;
  const arcControlY = isSunrise ? y - 5 : y + 5;
  const arrowTipY = isSunrise ? y - 7 : y + 7;
  const arrowTailY = isSunrise ? y + 1 : y - 1;
  const arrowWingY = isSunrise ? arrowTipY + 2.5 : arrowTipY - 2.5;

  return (
    <g aria-hidden="true">
      <circle cx={x} cy={y} r="10" fill="var(--color-background)" stroke={color} strokeWidth="1.25" />
      <path
        d={`M ${x - 4.5} ${horizonY} Q ${x} ${arcControlY} ${x + 4.5} ${horizonY}`}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line x1={x - 6.5} x2={x + 6.5} y1={horizonY} y2={horizonY} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={x} x2={x} y1={arrowTailY} y2={arrowTipY} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d={`M ${x - 2.25} ${arrowWingY} L ${x} ${arrowTipY} L ${x + 2.25} ${arrowWingY}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function EventCell({
  label,
  emphasis = false,
  children,
}: {
  label: string;
  emphasis?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`tide-event-cell ${emphasis ? "tide-event-cell-emphasis" : ""}`}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function DisclosureChevron() {
  return (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 8 8">
      <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function phaseAtFrom(spans: readonly DaylightSpan[], at: number): DaylightSpan["phase"] {
  return spans.find((span) => at >= Number(span.from) && at <= Number(span.to))?.phase ?? "day";
}

function gridValues(yMinimum: number, yMaximum: number): number[] {
  const values: number[] = [];
  const stepMetres = 0.5;
  for (let value = Math.ceil(yMinimum / stepMetres) * stepMetres; value <= yMaximum; value += stepMetres) {
    values.push(Math.round(value * 1000) / 1000);
  }
  return values;
}

function timeLabels(seriesStart: number, seriesEnd: number, timeZone: string): number[] {
  const result: number[] = [];
  const hourMs = 3_600_000;
  for (let t = Math.ceil(seriesStart / hourMs) * hourMs; t <= seriesEnd; t += hourMs) {
    const hour = stationHour(instant(t), timeZone);
    if (hour !== 0 && hour % 3 === 0) result.push(t);
  }
  return result;
}

// Station-zone throughout, deliberately — the caption says "station-local time" and this
// keeps that literally true, and keeps each row filed under the same station-day section
// header that the day-nav and gridlines above use (see the note on `dayBoundaryStarts`).
function tableRows(series: ReturnType<typeof loadTideSeriesFixture>, seriesStart: number, unit: "ft" | "m", timeZone: string) {
  let previousDay = -1;
  const rows: React.ReactNode[] = [];
  for (const sample of series.samples) {
    const minutesSinceStart = Math.round((Number(sample.at) - seriesStart) / 60_000);
    const isHour = minutesSinceStart % 60 === 0;
    if (!isHour && sample.turn === null) continue;
    const day = localDayIndex(Number(sample.at), seriesStart, timeZone);
    if (day !== previousDay) {
      rows.push(
        <tr key={`day-${sample.at}`} className="border-t border-hairline bg-surface-raised text-caption font-semibold uppercase tracking-wider text-text-muted">
          <td colSpan={3} className="px-3.5 py-2">
            {dayLabel(sample.at, timeZone)}
          </td>
        </tr>,
      );
      previousDay = day;
    }
    rows.push(
      <tr key={String(sample.at)} className={`border-t border-hairline ${sample.turn ? "font-semibold text-tide-cyan" : ""}`}>
        <td className="px-3.5 py-2">{clock(sample.at, timeZone)}</td>
        <td className="px-3.5 py-2">{formatHeight(sample.height, unit)}</td>
        <td className="px-3.5 py-2">{sample.turn === "high" ? "High" : sample.turn === "low" ? "Low" : ""}</td>
      </tr>,
    );
  }
  return rows;
}
