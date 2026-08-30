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
} from "@/core/rules/tide";
import { daylightSpans, moonPhaseAt, sunEventsFor } from "@/core/rules/astro";
import { useNow } from "@/lib/time/use-now";
import { useUnitPreference } from "@/features/settings/units";

import { TIDE_SELECTED_AT, loadTideSeriesFixture, STATION_LOCATION, STATION_TIME_ZONE } from "./queries/tide-series";
import { useLocalTimeZone } from "./use-local-time-zone";
import { SourcedValue, unwrapSourced } from "./components/sourced-value";
import type { MoonPhaseName } from "./types";
import {
  CHART_HEIGHT,
  LEFT_PADDING,
  MS_PER_PIXEL,
  PLOT_HEIGHT,
  PLOT_TOP,
  chartWidthFor,
  curvePath,
  localDayIndex,
  localMidnights,
  makeYFor,
  xFor as xForAt,
} from "./tide-chart-geometry";
import {
  clock,
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
// Founder-measured: the previous, more conservative shading read as invisible. These two
// opacities are the ceiling that keeps every foreground colour drawn on top of the
// lighter "day" band above the 4.5:1 text floor (see the worklog for the full table);
// pushing DAY_SHADE_OPACITY higher starts failing that floor for muted caption text.
const NIGHT_SHADE_OPACITY = 0.9;
const DAY_SHADE_OPACITY = 0.12;
// A sunrise/sunset marker this close (in pixels) to a turn marker suppresses its own
// text label to avoid the two colliding at this chart's zoom; the marker and its
// accessible name stay either way.
const SUN_TURN_LABEL_COLLISION_PX = 40;
const KEY_STEP_MS = 15 * 60_000;
const KEY_STEP_MS_FAST = 180 * 60_000;
const DRAG_EDGE_PX = 72;

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
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; startAt: number; active: boolean } | null>(
    null,
  );
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
    const points = sorted.map((t) => {
      const height = heightAt(series, instant(t));
      const value = height ? unwrapSourced(height) : metres(0);
      return [xFor(t), yFor(value)] as const;
    });
    return curvePath(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, seriesStart, seriesEnd, yFor]);

  const reading = readTideAt(series, instant(selectedAt));
  const selectedHeight: Metres = reading ? unwrapSourced(reading.height) : metres(0);
  const selectedX = xFor(selectedAt);
  const selectedY = yFor(selectedHeight);

  const dayBoundaryStarts = useMemo(() => [seriesStart, ...localMidnights(seriesStart, seriesEnd)], [seriesStart, seriesEnd]);
  const selectedDayIndex = localDayIndex(selectedAt, seriesStart);
  const selectedDayStart = dayBoundaryStarts[selectedDayIndex] ?? seriesStart;
  const selectedDayEnd = dayBoundaryStarts[selectedDayIndex + 1] ?? seriesEnd;
  const range = dailyRange(series, instant(selectedDayStart), instant(selectedDayEnd));

  const nextSlack = nextSlackAfter(series, instant(selectedAt));
  const nextTurn = reading?.nextTurn ?? nextTurnAfter(series, instant(selectedAt));

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
  const moon = useMemo(() => moonPhaseAt(instant(selectedAt)), [selectedAt]);
  const selectedDaySun = useMemo(() => sunEventsFor(instant(selectedAt), STATION_LOCATION), [selectedAt]);

  // The day <-> twilight transition instants, for the on-curve sun markers (drawn at the
  // curve's own height, the same way the H/L turn dots are — not floating above it).
  const sunMarkers = useMemo(() => {
    const markers: { at: number; isSunrise: boolean }[] = [];
    for (let i = 1; i < spans.length; i++) {
      const previous = spans[i - 1];
      const span = spans[i];
      const isSunrise = previous.phase !== "day" && span.phase === "day";
      const isSunset = previous.phase === "day" && span.phase !== "day";
      if (isSunrise || isSunset) markers.push({ at: Number(span.from), isSunrise });
    }
    return markers;
  }, [spans]);

  // What the shading already says visually — needed as the non-visual equivalent on the
  // scroller's aria-valuetext, per the brief.
  const selectedPhase = useMemo(() => {
    const found = spans.find((span) => selectedAt >= Number(span.from) && selectedAt <= Number(span.to));
    return found?.phase ?? "day";
  }, [spans, selectedAt]);
  const selectedPhaseNote =
    selectedPhase === "night" ? ", in darkness" : selectedPhase === "civil-twilight" ? ", near dawn or dusk" : "";

  const nowWithinRange = now !== null && Number(now) >= seriesStart && Number(now) <= seriesEnd;
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
    if (!scroller) return;
    setCenterAt(clampAt(seriesStart + (scroller.scrollLeft + scroller.clientWidth / 2 - LEFT_PADDING) * MS_PER_PIXEL));
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollToAt(initialSelectedAt, false);
      updateCenter();
    });
    return () => cancelAnimationFrame(frame);
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

  const moveReadHead = (deltaMs: number) => selectAt(selectedAt + deltaMs, true);

  const currentDay = localDayIndex(centerAt, seriesStart);
  const finalDay = localDayIndex(seriesEnd, seriesStart);

  // The next upcoming event (of turn vs. slack) gets slightly stronger emphasis, per brief.
  const soonestIsSlack = nextSlack !== null && (nextTurn === null || Number(unwrapSourced(nextSlack).centre) < Number(nextTurn.at));

  return (
    <section className="mx-auto w-full max-w-reading overflow-x-hidden px-4 pb-14 pt-5 sm:px-5">
      <header className="flex flex-col gap-1 pb-3 pt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-caption font-medium uppercase tracking-station text-text-muted">
            Station {series.station.id} · {series.station.name}
          </p>
          <MoonBadge illumination={moon.illumination} name={moon.name} />
        </div>
        <h1 className="text-h1">Tide</h1>
      </header>

      <div className="overflow-hidden rounded-lg border border-hairline bg-surface pb-1.5 pt-3.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3.5 pb-3">
          <h2 className="order-1 min-w-0 shrink truncate text-lg font-bold">
            {dayLabel(instant(centerAt), displayTimeZone)}
          </h2>
          {reading && (
            <span className="order-3 mt-1 inline-flex min-w-0 shrink basis-full items-center gap-1.5 rounded-md border border-border-interactive border-l-2 border-l-signal-orange bg-surface-raised py-1 pl-2 pr-2.5 sm:order-2 sm:mt-0 sm:basis-0 sm:flex-1">
              {/* A distinct surface (not just darker text) so this reads as live data next
                  to the date heading, not as more heading text. The left edge ties it to
                  the orange SELECTED read-head it tracks, as a border accent rather than
                  coloured text — every word in here is required information and has to
                  clear the 7:1 floor on its own, which text-text-primary/tide-cyan do and
                  text-signal-orange itself (6.2:1 on this surface) would not. */}
              <span className="min-w-0 truncate font-mono text-caption">
                <b className="font-mono font-bold text-text-primary">{formatHeight(selectedHeight, unit)}</b>
                <span className="text-text-muted"> · </span>
                <span className="text-text-primary">{clock(instant(selectedAt), displayTimeZone)}</span>
                <span className="text-text-muted"> · </span>
                <span className="font-semibold text-tide-cyan">
                  <span aria-hidden="true">
                    {reading.motion === "slack" || reading.motion === "near-slack" ? "—" : reading.motion === "rising" ? "▲" : "▼"}
                  </span>{" "}
                  {formatMotion(reading.motion)}
                </span>
              </span>
            </span>
          )}
          <div className="order-2 ml-auto flex shrink-0 gap-2 sm:order-3">
            <button
              className="size-touch-nav-day rounded-md border border-border-interactive bg-surface-raised text-xl hover:border-tide-cyan disabled:opacity-45"
              type="button"
              aria-label="Previous day"
              disabled={currentDay <= 0}
              onClick={() => scrollToAt(dayBoundaryStarts[currentDay - 1] ?? seriesStart)}
            >
              ‹
            </button>
            <button
              className="h-touch-nav-day rounded-md border border-signal-orange bg-surface-raised px-3 font-mono text-label font-semibold tracking-widest text-signal-orange hover:bg-signal-orange hover:text-ink-on-orange disabled:opacity-45"
              type="button"
              aria-label="Jump to now"
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
              Now
            </button>
            <button
              className="size-touch-nav-day rounded-md border border-border-interactive bg-surface-raised text-xl hover:border-tide-cyan disabled:opacity-45"
              type="button"
              aria-label="Next day"
              disabled={currentDay >= finalDay}
              onClick={() => scrollToAt(dayBoundaryStarts[currentDay + 1] ?? seriesEnd)}
            >
              ›
            </button>
          </div>
          {nowButtonDisabledReason && (
            <span id="now-button-reason" className="sr-only">
              {nowButtonDisabledReason}
            </span>
          )}
        </div>

        <div className="flex">
          <svg className="z-10 w-axis-gutter shrink-0 bg-surface" width="46" height={CHART_HEIGHT} aria-hidden="true">
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
            className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [touch-action:pan-y] [&::-webkit-scrollbar]:hidden"
            tabIndex={0}
            role="slider"
            aria-label="Tide height by time. Drag horizontally to select a point on the curve. Use left and right arrows to adjust the selected point."
            aria-valuemin={0}
            aria-valuemax={totalMs}
            aria-valuenow={Math.round(selectedAt - seriesStart)}
            aria-valuetext={`${formatHeight(selectedHeight, unit)} at ${clock(instant(selectedAt), displayTimeZone)}, ${dayLabel(instant(selectedAt), displayTimeZone)}${selectedPhaseNote}`}
            onScroll={updateCenter}
            onPointerDown={(event) => {
              dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startAt: selectedAt, active: false };
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              const horizontalDistance = event.clientX - drag.startX;
              const verticalDistance = event.clientY - drag.startY;
              if (!drag.active) {
                if (Math.abs(horizontalDistance) < 8 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return;
                drag.active = true;
                event.currentTarget.setPointerCapture(event.pointerId);
              }
              event.preventDefault();
              selectAt(drag.startAt + horizontalDistance * MS_PER_PIXEL, true);
            }}
            onPointerUp={(event) => {
              if (dragRef.current?.pointerId === event.pointerId) {
                dragRef.current = null;
              }
            }}
            onPointerCancel={(event) => {
              if (dragRef.current?.pointerId === event.pointerId) {
                dragRef.current = null;
              }
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
              aria-label="Continuous tide curve for Newport Bay Entrance across three days, with labelled highs and lows, shaded for daylight, and marked for slack water."
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
                  to answer that. Both bands still leave every foreground colour above the
                  4.5:1 text floor; see the worklog for the exact ratios measured. */}
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
                    y={PLOT_TOP - 14}
                    width={width}
                    height={PLOT_HEIGHT + 44}
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
                    {shortDay(instant(at), displayTimeZone).toUpperCase()}
                  </text>
                </g>
              ))}
              {timeLabels(seriesStart, seriesEnd, displayTimeZone).map((at) => (
                <text key={at} x={xFor(at)} y={PLOT_TOP + PLOT_HEIGHT + 24} textAnchor="middle" className="fill-text-muted font-mono text-[12px]">
                  {String(stationHour(instant(at), displayTimeZone)).padStart(2, "0")}:00
                </text>
              ))}

              <path d={`${path}L${xFor(seriesEnd)},${PLOT_TOP + PLOT_HEIGHT}L${xFor(seriesStart)},${PLOT_TOP + PLOT_HEIGHT}Z`} fill="url(#tide-area)" />
              <path d={path} fill="none" stroke="var(--color-tide-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {turns.map((turn) => (
                <g key={String(turn.at)}>
                  <circle cx={xFor(Number(turn.at))} cy={yFor(turn.height)} r="5" fill="var(--color-tide-cyan)" stroke="var(--color-surface)" strokeWidth="2" />
                  <text x={xFor(Number(turn.at))} y={yFor(turn.height) + (turn.kind === "high" ? -14 : 22)} textAnchor="middle" className="fill-text-primary font-mono text-[12px] font-semibold">
                    {formatHeight(turn.height, unit)} <tspan className="fill-text-muted font-normal">{clock(turn.at, displayTimeZone)}</tspan>
                  </text>
                </g>
              ))}

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
                const label = marker.isSunrise ? "Sunrise" : "Sunset";
                const accessibleName = `${label}, ${clock(instant(marker.at), displayTimeZone)}, tide ${formatHeight(value, unit)}`;
                const collidesWithTurn = turns.some((turn) => Math.abs(xFor(Number(turn.at)) - x) < SUN_TURN_LABEL_COLLISION_PX);
                const labelY = marker.isSunrise ? y - 16 : y + 26;
                return (
                  <g key={`sun-${marker.at}`} {...(collidesWithTurn ? { role: "img", "aria-label": accessibleName } : {})}>
                    <circle cx={x} cy={y} r="4.5" fill="var(--color-amber-flag)" stroke="var(--color-surface)" strokeWidth="1.5" aria-hidden="true" />
                    {[0, 60, 120, 180, 240, 300].map((angle) => {
                      const rad = (angle * Math.PI) / 180;
                      // Rounded to 2dp: Math.sin/cos are not guaranteed bit-identical
                      // across JS engines (Node's V8 build for SSR vs. the browser's for
                      // hydration can differ in the last ULP), which was producing a real,
                      // if extremely rare, hydration mismatch on these exact coordinates.
                      // Sub-hundredth-pixel differences are invisible; collapsing them to
                      // the same rounded string removes the mismatch outright.
                      const round2 = (n: number) => Math.round(n * 100) / 100;
                      return (
                        <line
                          key={angle}
                          x1={round2(x + Math.cos(rad) * 6.5)}
                          y1={round2(y + Math.sin(rad) * 6.5)}
                          x2={round2(x + Math.cos(rad) * 9.5)}
                          y2={round2(y + Math.sin(rad) * 9.5)}
                          stroke="var(--color-amber-flag)"
                          strokeWidth="1.25"
                          strokeLinecap="round"
                          aria-hidden="true"
                        />
                      );
                    })}
                    {!collidesWithTurn && (
                      <text x={x} y={labelY} textAnchor="middle" className="fill-text-primary font-mono text-[11px] font-semibold">
                        {label} <tspan className="fill-text-muted font-normal">{clock(instant(marker.at), displayTimeZone)}</tspan>
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Slack markers — estimated, so a diamond rather than the turn's filled circle. */}
              {slackWindows.map((window) => {
                const centre = unwrapSourced(window).centre;
                const h = heightAt(series, centre);
                const value = h ? unwrapSourced(h) : metres(0);
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
                  <text x={xFor(Number(now))} y={PLOT_TOP - 12} textAnchor="middle" className="fill-text-muted font-mono text-[10px] font-semibold tracking-chart-pill">
                    NOW
                  </text>
                </g>
              )}

              <line x1={selectedX} x2={selectedX} y1={PLOT_TOP - 8} y2={PLOT_TOP + PLOT_HEIGHT} stroke="var(--color-signal-orange)" strokeWidth="2" strokeDasharray="3 4" />
              <rect x={selectedX - 34} y={PLOT_TOP - 20} width="68" height="17" rx="8.5" fill="var(--color-signal-orange)" />
              <text x={selectedX} y={PLOT_TOP - 7.5} textAnchor="middle" className="fill-ink-on-orange font-mono text-[10px] font-semibold tracking-chart-pill">
                SELECTED
              </text>
              <circle cx={selectedX} cy={selectedY} r="6.5" fill="var(--color-signal-orange)" stroke="var(--color-surface)" strokeWidth="2.5" />
            </svg>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-3.5 pt-2 font-mono text-caption text-text-muted">
          <span className="inline-flex items-center gap-2 before:h-0.75 before:w-4 before:rounded before:bg-tide-cyan">Tide height</span>
          <span className="inline-flex items-center gap-2 before:h-0.75 before:w-4 before:rounded before:bg-signal-orange">Selected time</span>
          <span className="inline-flex items-center gap-1">
            <svg width="10" height="10" aria-hidden="true">
              <rect x="1.5" y="1.5" width="7" height="7" transform="rotate(45 5 5)" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" />
            </svg>
            Estimated slack
          </span>
          <span className="inline-flex items-center gap-2 before:size-2 before:rounded-full before:bg-amber-flag">Sunrise / sunset</span>
          <span>Shading: night to day · Drag the curve · ← → to adjust</span>
        </div>
      </div>

      <dl className="mt-4 mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-3">
        <StatusCell label="Selected">
          {reading ? <SourcedValue value={reading.height} render={(v) => <span>{formatHeight(v, unit)}</span>} /> : "—"}
        </StatusCell>

        <StatusCell label="State" cyan>
          {reading && (
            <>
              <span aria-hidden="true">
                {reading.motion === "slack" || reading.motion === "near-slack" ? "—" : reading.motion === "rising" ? "▲" : "▼"}{" "}
              </span>
              {formatMotion(reading.motion)}
              <SourcedValue
                className="mt-1 block text-caption font-normal text-text-muted"
                value={reading.rate}
                render={(v) => <>Rate: {formatRate(v, unit)}</>}
              />
              <SourcedValue
                className="mt-1 block text-caption font-normal text-text-muted"
                value={reading.pace}
                render={(v) => <>Pace: {formatPace(v.class)}</>}
              />
              {reading.twelfths !== null && (
                <small aria-label={`Rule of twelfths: approximately ${reading.twelfths} twelfths of the tidal range this tide hour`}>
                  Rule: ~{reading.twelfths}/12
                </small>
              )}
            </>
          )}
        </StatusCell>

        <StatusCell label="Next turn" emphasis={!soonestIsSlack && nextTurn !== null}>
          {nextTurn ? (
            <>
              <span>{clock(nextTurn.at, displayTimeZone)}</span>
              <small>
                {nextTurn.kind === "high" ? "High" : "Low"} · {formatCountdown(Number(nextTurn.at) - selectedAt, nextTurn.kind)}
              </small>
            </>
          ) : (
            "—"
          )}
        </StatusCell>

        <StatusCell label="Next slack" emphasis={soonestIsSlack}>
          {nextSlack ? (
            <SourcedValue
              value={nextSlack}
              render={(v) => (
                <>
                  <span>
                    {clock(v.from, displayTimeZone)}–{clock(v.to, displayTimeZone)}
                  </span>
                  <small>{formatCountdown(Number(v.centre) - selectedAt, "slack")}</small>
                </>
              )}
            />
          ) : (
            "—"
          )}
        </StatusCell>

        <StatusCell label={`${monthDay(instant(selectedAt), displayTimeZone)} range`}>
          {range ? <SourcedValue value={range} render={(v) => <span>{formatHeight(v, unit)}</span>} /> : "—"}
        </StatusCell>
      </dl>
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-caption text-text-muted">
          Predicted height above {series.station.datum} · times shown in{" "}
          {zoneAbbreviation(instant(selectedAt), displayTimeZone)} · selected: {dayLabel(instant(selectedAt), displayTimeZone)},{" "}
          {clock(instant(selectedAt), displayTimeZone)}
        </p>
        {zoneDiffersFromStation && (
          <p className="text-caption text-text-muted">
            Station {series.station.name} is in {zoneAbbreviation(instant(selectedAt), STATION_TIME_ZONE)}; every time on this
            screen is converted to your local {zoneAbbreviation(instant(selectedAt), displayTimeZone)}.
          </p>
        )}
        <p className="text-caption text-text-muted">
          Sun and moon times are calculated, not measured.{" "}
          {selectedDaySun.sunrise && selectedDaySun.sunset
            ? `Sunrise ${clock(selectedDaySun.sunrise, displayTimeZone)} · Sunset ${clock(selectedDaySun.sunset, displayTimeZone)}.`
            : "The sun does not rise or set here today."}
        </p>
        <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-hairline bg-surface-raised px-3 py-1.5 font-mono text-caption tracking-wide text-text-muted before:size-2 before:rounded-full before:bg-text-muted">
          Cached fixture — not a live reading
        </span>
        {now !== null && !nowWithinRange && (
          <p className="text-caption text-text-muted">
            Live clock: {dayLabel(now, displayTimeZone)}, {clock(now, displayTimeZone)} —{" "}
            {Number(now) < seriesStart ? "before" : "after"} this cached window, so there is no live marker on the chart today.
          </p>
        )}
      </div>


      <button
        className="mt-4 min-h-touch-primary-standard w-full rounded-lg border border-border-interactive bg-surface-raised px-5 text-lg font-semibold hover:border-tide-cyan"
        type="button"
        aria-expanded={tableOpen}
        aria-controls="tide-table"
        onClick={() => setTableOpen((open) => !open)}
      >
        {tableOpen ? "Hide the numbers" : "Show the numbers instead"}
      </button>
      {tableOpen && (
        <div id="tide-table" className="mt-3 overflow-x-auto rounded-lg border border-hairline">
          <table className="w-full border-collapse font-mono text-caption">
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
            <tbody>{tableRows(series, seriesStart, unit, displayTimeZone)}</tbody>
          </table>
        </div>
      )}
      <p className="mt-6 border-t border-hairline pt-4 text-caption text-text-muted">
        {series.samples.length} renderable points across the loaded window, with every exact turning point kept. Real NOAA
        CO-OPS predictions{series.retrievedAt !== null && (
          <> retrieved {dayLabel(series.retrievedAt, displayTimeZone)}, {clock(series.retrievedAt, displayTimeZone)}</>
        )}. Station{" "}
        <code className="font-mono text-caption text-text-primary">{series.station.id}</code>, datum{" "}
        <code className="font-mono text-caption text-text-primary">{series.station.datum}</code>.
      </p>

      <div className="sr-only">
        <label>
          Height units
          <select value={unit} onChange={(event) => setUnit(event.target.value === "m" ? "m" : "ft")}>
            <option value="ft">Feet</option>
            <option value="m">Metres</option>
          </select>
        </label>
      </div>
    </section>
  );
}

function MoonBadge({ illumination, name }: { illumination: number; name: MoonPhaseName }) {
  return (
    <p className="font-mono text-caption font-medium uppercase tracking-station text-text-muted">
      {formatMoonPhaseName(name)} · {formatMoonIllumination(illumination)}
    </p>
  );
}

function StatusCell({
  label,
  cyan = false,
  emphasis = false,
  children,
}: {
  label: string;
  cyan?: boolean;
  emphasis?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-0.5 bg-surface p-3 ${emphasis ? "ring-2 ring-inset ring-signal-orange" : ""}`}>
      <dt className="font-mono text-caption uppercase tracking-widest text-text-muted">{label}</dt>
      <dd
        className={`m-0 font-mono text-xl font-semibold tabular-nums [&_small]:mt-1 [&_small]:block [&_small]:text-caption [&_small]:font-normal [&_small]:text-text-muted ${
          cyan ? "text-tide-cyan" : ""
        }`}
      >
        {children}
      </dd>
    </div>
  );
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
  for (let t = seriesStart; t <= seriesEnd; t += 3 * 3_600_000) {
    if (stationHour(instant(t), timeZone) !== 0) result.push(t);
  }
  return result;
}

function tableRows(series: ReturnType<typeof loadTideSeriesFixture>, seriesStart: number, unit: "ft" | "m", timeZone: string) {
  let previousDay = -1;
  const rows: React.ReactNode[] = [];
  for (const sample of series.samples) {
    const minutesSinceStart = Math.round((Number(sample.at) - seriesStart) / 60_000);
    const isHour = minutesSinceStart % 60 === 0;
    if (!isHour && sample.turn === null) continue;
    const day = localDayIndex(Number(sample.at), seriesStart);
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
