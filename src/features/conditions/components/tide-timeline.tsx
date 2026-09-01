"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { instant, metres } from "@/core/units";
import { heightAt, type TidePredictionSeries, type TideTurn } from "@/core/rules/tide";
import type { DaylightSpan } from "@/core/rules/astro";

import { unwrapSourced } from "./sourced-value";
import { clusterCatchMarkers, type CatchMarkerInput } from "../catch-markers";
import {
  DEFAULT_CHART_HEIGHT,
  MIN_CHART_HEIGHT,
  PLOT_TOP,
  atFromScrollLeft,
  chartWidthFor,
  curvePath,
  gridValues,
  labelPlate,
  makeYFor,
  plotHeightFor,
  scrollLeftFor,
  visibleLabelFlags,
  xFor as xForAt,
} from "../tide-chart-geometry";
import { clock, dividerDay, formatHeight, hourLabel, hourLabels } from "../format";
import type { UnitPreference } from "@/features/settings/units";

const CURVE_STEP_MS = 15 * 60_000;
const KEY_STEP_MS = 15 * 60_000;
const KEY_STEP_MS_FAST = 180 * 60_000;
/** Pointer travel, in pixels, above which a press is a pan and not a tap on a marker. */
const TAP_SLOP_PX = 6;
/** Two turn labels closer together than this share pixels; the later one drops its text. */
const TURN_LABEL_MIN_GAP_PX = 78;
/** Catches closer together than this read as one clustered marker with a count. */
const CATCH_CLUSTER_MIN_GAP_PX = 32;
/** The most a cluster's reveal panel lists; past that it says "+N more". */
const CATCH_REVEAL_MAX_LINES = 4;
/**
 * The height-axis labels sit on the same left line as the readout card and the day
 * stepper, rather than jammed against the screen edge. Kept in sync with `--tide-gutter`
 * in `tide-chart.css` by hand — the chart itself is full-bleed, so there is no box here to
 * inherit the padding from.
 */
const AXIS_LABEL_INSET_PX = 16;

// Founder-measured: the previous, more conservative shading read as invisible; these two
// opacities are what the founder asked to keep. No text is drawn directly on the shaded
// fill — every label that has to sit AT the curve's own height gets an opaque
// `labelPlate()` backing rect, so its real background is `--color-background` rather than
// the composited band, and every colour used on that backing (text-muted 7.05:1,
// text-primary 17.24:1, tide-cyan 9.53:1, amber-flag 10.21:1) clears this project's 7:1
// floor for required information (`docs/design/06-accessibility-baseline.md` §1). This
// product is dark-only by design (`tokens.json`'s `$darkOnlyByDesign`), so there is one
// theme to measure, not two.
const NIGHT_SHADE_OPACITY = 0.9;
const DAY_SHADE_OPACITY = 0.12;

export type SunMarker = { at: number; kind: "sunrise" | "sunset" };

export type TideTimelineHandle = {
  /** Move the timeline so `at` sits under the fixed read-head. */
  scrollToAt(at: number, smooth?: boolean): void;
};

/**
 * The tide timeline: one continuous curve the angler scrubs horizontally, with a single
 * fixed read-head at the centre of the viewport.
 *
 * The interaction model is the whole point of this component. The track is padded by half
 * the viewport on each side, so the instant under the read-head is exactly
 * `atFromScrollLeft(scrollLeft)` — the browser's own scroller (with its momentum, its
 * rubber-banding, and its trackpad and keyboard support) IS the scrubbing control. There is
 * no long-press, no drag-to-select, and no second "selected point" that can wander off
 * screen: what is under the read-head is what the header reads out, always.
 */
export function TideTimeline({
  ref,
  series,
  seriesStart,
  seriesEnd,
  unit,
  displayTimeZone,
  stationTimeZone,
  selectedAt,
  onSelectedAtChange,
  now,
  spans,
  turns,
  sunMarkers,
  catchMarkers,
  dayBoundaries,
  valueText,
  nowAction,
}: {
  ref?: React.Ref<TideTimelineHandle>;
  series: TidePredictionSeries;
  seriesStart: number;
  seriesEnd: number;
  unit: UnitPreference;
  displayTimeZone: string;
  stationTimeZone: string;
  selectedAt: number;
  onSelectedAtChange: (at: number) => void;
  now: number | null;
  spans: readonly DaylightSpan[];
  turns: readonly TideTurn[];
  sunMarkers: readonly SunMarker[];
  /** Logged catches whose `caught_at` falls inside the plotted window (§6 founder
   *  requirements): drawn on the curve at their instant; tap reveals and pins the
   *  read-head onto the catch. */
  catchMarkers?: readonly CatchMarkerInput[];
  dayBoundaries: readonly number[];
  valueText: string;
  /** Returns the read-head to the present. Null while it is already there, or while the
   *  clock falls outside the cached window. */
  nowAction: (() => void) | null;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  // Mirrored into a ref (from an effect, never during render) so the re-anchor effect
  // below can read the current instant without listing `selectedAt` as a dependency —
  // which would re-scroll the timeline on every scroll event it just produced.
  const selectedAtRef = useRef(selectedAt);
  useEffect(() => {
    selectedAtRef.current = selectedAt;
  }, [selectedAt]);

  const [box, setBox] = useState({ width: 0, height: DEFAULT_CHART_HEIGHT });
  const [revealedSunAt, setRevealedSunAt] = useState<number | null>(null);
  const [revealedCatchKey, setRevealedCatchKey] = useState<string | null>(null);

  const chartHeight = Math.max(MIN_CHART_HEIGHT, box.height);
  const plotHeight = plotHeightFor(chartHeight);
  const plotBottom = PLOT_TOP + plotHeight;
  const chartWidth = chartWidthFor(seriesStart, seriesEnd);
  const padInline = box.width / 2;
  const xFor = (at: number) => xForAt(at, seriesStart);
  const clampAt = (at: number) => Math.round(Math.max(seriesStart, Math.min(seriesEnd, at)));

  // Catches cluster only when their marks would print on top of each other at this
  // scale (founder §6). `xFor` closes over `seriesStart`, so that edge is the dep.
  const catchClusters = useMemo(
    () => clusterCatchMarkers(catchMarkers ?? [], xFor, CATCH_CLUSTER_MIN_GAP_PX),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- xFor is xForAt(_, seriesStart)
    [catchMarkers, seriesStart],
  );

  const { yMinimum, yMaximum } = useMemo(() => {
    const heights = series.samples.map((s) => Number(s.height));
    const low = Math.min(...heights);
    const high = Math.max(...heights);
    const pad = (high - low) * 0.2;
    return { yMinimum: low - pad, yMaximum: high + pad };
  }, [series]);
  const yFor = useMemo(
    () => makeYFor(yMinimum, yMaximum, chartHeight),
    [yMinimum, yMaximum, chartHeight],
  );

  // The plotted curve reads heights from the engine's monotone-cubic heightAt, not the raw
  // sample tuples. Dense uniform sampling (plus every published sample instant, so the
  // curve still passes exactly through each one) means the shape between turns follows the
  // engine's monotone Hermite curve — which cannot overshoot a published high/low — rather
  // than whatever the Catmull-Rom smoothing pass invents between coarse points.
  const path = useMemo(() => {
    const instants = new Set<number>();
    for (const sample of series.samples) instants.add(Number(sample.at));
    for (let t = seriesStart; t <= seriesEnd; t += CURVE_STEP_MS) instants.add(t);
    instants.add(seriesEnd);
    const sorted = [...instants].sort((a, b) => a - b);
    // A point is dropped rather than plotted at a fabricated 0m if `heightAt` ever returns
    // null inside its own inclusive range, instead of drawing a curve that dives to zero.
    const points: (readonly [number, number])[] = [];
    for (const t of sorted) {
      const height = heightAt(series, instant(t));
      if (!height) continue;
      points.push([xForAt(t, seriesStart), yFor(unwrapSourced(height))]);
    }
    return curvePath(points);
  }, [series, seriesStart, seriesEnd, yFor]);

  const selectedHeight = useMemo(() => {
    const height = heightAt(series, instant(selectedAt));
    return height ? unwrapSourced(height) : null;
  }, [series, selectedAt]);

  const nowHeight = useMemo(() => {
    if (now === null || now < seriesStart || now > seriesEnd) return null;
    const height = heightAt(series, instant(now));
    return height ? unwrapSourced(height) : null;
  }, [series, now, seriesStart, seriesEnd]);

  const scrollToAt = (at: number, smooth = true) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({
      left: scrollLeftFor(clampAt(at), seriesStart),
      behavior: smooth && !reducedMotion ? "smooth" : "auto",
    });
  };

  useImperativeHandle(ref, () => ({ scrollToAt }));

  // The viewport's real size drives both the plot height (the curve gets whatever room the
  // single-screen layout leaves it) and the track padding (which is what puts the read-head
  // exactly at the centre).
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((current) =>
        Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5
          ? current
          : { width, height },
      );
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  // Re-anchor on any width change (first measure, rotation, split screen): the padding that
  // defines "centre" just changed, so the same scrollLeft now means a different instant.
  useEffect(() => {
    if (box.width === 0) return;
    scrollToAt(selectedAtRef.current, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.width, seriesStart]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    },
    [],
  );

  const handleScroll = () => {
    if (box.width === 0 || scrollFrameRef.current !== null) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      onSelectedAtChange(clampAt(atFromScrollLeft(scroller.scrollLeft, seriesStart)));
    });
  };

  // Mouse drag-to-pan. Touch already pans natively (and better, with momentum); this is
  // only so the chart is scrubbable on a desktop without a horizontal wheel.
  const dragRef = useRef<{ pointerId: number; startX: number; startScroll: number; moved: boolean } | null>(null);

  const turnLabelVisible = useMemo(
    () => visibleLabelFlags(turns.map((turn) => xForAt(Number(turn.at), seriesStart)), TURN_LABEL_MIN_GAP_PX),
    [turns, seriesStart],
  );

  return (
    <div className="tide-timeline" ref={viewportRef}>
      <div
        ref={scrollerRef}
        className="tide-timeline-scroller"
        tabIndex={0}
        role="slider"
        aria-label="Tide timeline. Swipe sideways to move through time; the reading under the centre line updates as you go. Left and right arrows step 15 minutes."
        aria-valuemin={0}
        aria-valuemax={Math.round(seriesEnd - seriesStart)}
        aria-valuenow={Math.round(selectedAt - seriesStart)}
        aria-valuetext={valueText}
        onScroll={handleScroll}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") return;
          const scroller = scrollerRef.current;
          if (!scroller) return;
          dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startScroll: scroller.scrollLeft, moved: false };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          const scroller = scrollerRef.current;
          if (!drag || !scroller || drag.pointerId !== event.pointerId) return;
          const travel = event.clientX - drag.startX;
          if (!drag.moved && Math.abs(travel) < TAP_SLOP_PX) return;
          if (!drag.moved) {
            drag.moved = true;
            scroller.setPointerCapture(event.pointerId);
          }
          scroller.scrollLeft = drag.startScroll - travel;
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        onLostPointerCapture={() => {
          dragRef.current = null;
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? KEY_STEP_MS_FAST : KEY_STEP_MS;
          if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollToAt(selectedAt + step, false);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollToAt(selectedAt - step, false);
          } else if (event.key === "Home") {
            event.preventDefault();
            scrollToAt(seriesStart, false);
          } else if (event.key === "End") {
            event.preventDefault();
            scrollToAt(seriesEnd, false);
          }
        }}
      >
        <div className="tide-timeline-track" style={{ paddingInline: `${padInline}px` }}>
          <svg
            width={chartWidth}
            height={chartHeight}
            role="img"
            aria-label={`Continuous tide prediction for ${series.station.name} across the loaded window, with labelled highs and lows, daylight and night shading, and sunrise and sunset markers on the curve.`}
          >
            <defs>
              <linearGradient id="tide-area" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="var(--color-tide-cyan)" stopOpacity=".32" />
                <stop offset="1" stopColor="var(--color-tide-cyan)" stopOpacity="0" />
              </linearGradient>
              {/* One gradient per civil-twilight span: dawn runs night-colour -> day-colour
                  left to right, dusk the other way, so twilight reads as a transition
                  rather than a third arbitrary flat colour. */}
              {spans.map((span, index) => {
                if (span.phase !== "civil-twilight") return null;
                const isDawn = spans[index - 1]?.phase === "night";
                return (
                  <linearGradient key={`grad-${span.from}`} id={`twilight-${span.from}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor={isDawn ? "var(--color-background)" : "var(--color-moon-pale)"} stopOpacity={isDawn ? NIGHT_SHADE_OPACITY : DAY_SHADE_OPACITY} />
                    <stop offset="1" stopColor={isDawn ? "var(--color-moon-pale)" : "var(--color-background)"} stopOpacity={isDawn ? DAY_SHADE_OPACITY : NIGHT_SHADE_OPACITY} />
                  </linearGradient>
                );
              })}
            </defs>

            {/* Day/night shading, clipped to exactly the plot's vertical span so no text
                ever sits on the composited band. */}
            {spans.map((span) => {
              const x1 = xFor(Number(span.from));
              const width = Math.max(0, xFor(Number(span.to)) - x1);
              const fill =
                span.phase === "civil-twilight"
                  ? `url(#twilight-${span.from})`
                  : span.phase === "night"
                    ? "var(--color-background)"
                    : "var(--color-moon-pale)";
              const opacity = span.phase === "civil-twilight" ? 1 : span.phase === "night" ? NIGHT_SHADE_OPACITY : DAY_SHADE_OPACITY;
              return <rect key={`${span.from}-${span.phase}`} x={x1} y={PLOT_TOP} width={width} height={plotHeight} fill={fill} opacity={opacity} />;
            })}

            {gridValues(yMinimum, yMaximum).map((value) => (
              <line key={value} x1="0" x2={chartWidth} y1={yFor(metres(value))} y2={yFor(metres(value))} stroke="var(--color-hairline)" />
            ))}

            {dayBoundaries.map((at) => (
              <g key={at}>
                <line x1={xFor(at)} x2={xFor(at)} y1={PLOT_TOP - 12} y2={plotBottom + 26} stroke="var(--color-border-interactive)" strokeDasharray="2 5" />
                <text x={xFor(at) + 8} y={PLOT_TOP - 6} className="fill-text-muted font-mono text-[11px] font-semibold tracking-widest">{dividerDay(instant(at), stationTimeZone)}</text>
              </g>
            ))}

            {hourLabels(seriesStart, seriesEnd, displayTimeZone).map((at) => (
              <text key={at} x={xFor(at)} y={plotBottom + 22} textAnchor="middle" className="fill-text-muted font-mono text-[13px]">{hourLabel(instant(at), displayTimeZone)}</text>
            ))}

            <path d={`${path}L${xFor(seriesEnd)},${plotBottom}L${xFor(seriesStart)},${plotBottom}Z`} fill="url(#tide-area)" />
            <path d={path} fill="none" stroke="var(--color-tide-cyan)" strokeOpacity=".12" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke="var(--color-tide-cyan)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Highs and lows are the only points labelled on the curve — a number on every
                sample is noise. The label stacks height over time, which is narrower than
                one run-on string and is the order the eye wants them in. */}
            {turns.map((turn, index) => {
              const x = xFor(Number(turn.at));
              const y = yFor(turn.height);
              const isHigh = turn.kind === "high";
              const firstLineY = isHigh ? y - 30 : y + 26;
              const heightText = formatHeight(turn.height, unit);
              const timeText = clock(turn.at, displayTimeZone);
              const plateText = heightText.length > timeText.length ? heightText : timeText;
              const plate = labelPlate(x, firstLineY, plateText, 13, 2);
              return (
                <g key={String(turn.at)}>
                  <circle cx={x} cy={y} r="5" fill="var(--color-tide-cyan)" stroke="var(--color-surface)" strokeWidth="2" />
                  {turnLabelVisible[index] && (
                    <>
                      <rect x={plate.x} y={plate.y} width={plate.width} height={plate.height} rx="4" fill="var(--color-background)" />
                      <text x={x} y={firstLineY} textAnchor="middle" className="fill-text-primary font-mono text-[13px] font-semibold">{heightText}</text>
                      <text x={x} y={firstLineY + 16} textAnchor="middle" className="fill-text-muted font-mono text-[13px]">{timeText}</text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Sunrise/sunset sit ON the curve at its real height, so the chart answers
                "what is the tide doing at sunrise" with no mental arithmetic. The time is
                revealed on tap rather than printed permanently — the old always-on labels
                were a large part of what made this screen unreadable. Every one of these
                times is also plain text in the tide-details sheet, so nothing here is
                reachable only by tapping a 20px glyph. */}
            {sunMarkers.map((marker) => {
              const height = heightAt(series, instant(marker.at));
              if (!height) return null;
              const x = xFor(marker.at);
              const y = yFor(unwrapSourced(height));
              const isSunrise = marker.kind === "sunrise";
              const label = isSunrise ? "Sunrise" : "Sunset";
              const time = clock(instant(marker.at), displayTimeZone);
              const revealed = revealedSunAt === marker.at;
              const labelY = isSunrise ? y - 20 : y + 30;
              const plate = labelPlate(x, labelY, `${label} ${time}`, 12);
              return (
                <g
                  key={`sun-${marker.at}`}
                  data-sun-transition={marker.kind}
                  role="button"
                  tabIndex={0}
                  aria-label={`${label}, ${time}, tide ${formatHeight(unwrapSourced(height), unit)}. Activate to show or hide the time on the chart.`}
                  onClick={() => {
                    if (dragRef.current?.moved) return;
                    setRevealedSunAt((current) => (current === marker.at ? null : marker.at));
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    setRevealedSunAt((current) => (current === marker.at ? null : marker.at));
                  }}
                >
                  <SunTransitionGlyph kind={marker.kind} x={x} y={y} />
                  {revealed && (
                    <>
                      <rect x={plate.x} y={plate.y} width={plate.width} height={plate.height} rx="3" fill="var(--color-background)" />
                      <text x={x} y={labelY} textAnchor="middle" className="fill-text-primary font-mono text-[12px] font-semibold"><tspan fill={isSunrise ? "var(--color-amber-flag)" : "var(--color-signal-orange)"}>{isSunrise ? "↑" : "↓"}</tspan> {label} <tspan className="fill-text-muted font-normal">{time}</tspan></text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Catch markers (founder requirements §6): every logged catch sits ON the
                curve at its exact instant. Tapping one does two things — reveals
                species + time, and pins the read-head onto the catch, so the header
                readout immediately answers "what was the tide doing when I caught it"
                (height and movement at that instant). Clusters carry a count instead
                of overlapping glyphs. Same tap-not-pan guard and keyboard contract as
                the sun markers above. */}
            {catchClusters.map((cluster) => {
              const height = heightAt(series, instant(cluster.at));
              if (!height) return null;
              const x = xFor(cluster.at);
              const y = yFor(unwrapSourced(height));
              const revealed = revealedCatchKey === cluster.key;
              const markerFill = cluster.anyNeedsDetails ? "var(--color-amber-flag)" : "var(--color-signal-orange)";
              const inkFill = cluster.anyNeedsDetails ? "var(--color-background)" : "var(--color-ink-on-orange)";
              const count = cluster.members.length;
              const memberLines = cluster.members
                .slice(0, CATCH_REVEAL_MAX_LINES)
                .map((m) => `${m.label} · ${clock(instant(m.at), displayTimeZone)}`);
              const lines =
                count > CATCH_REVEAL_MAX_LINES
                  ? [...memberLines, `+${count - CATCH_REVEAL_MAX_LINES} more`]
                  : memberLines;
              const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), "");
              // Bubble unfolds with its last line just above the marker (y - 22)…
              let firstBaseline = y - 22 - (lines.length - 1) * 15;
              // …unless that runs off the chart: then it unfolds below the marker.
              if (firstBaseline < PLOT_TOP + 12) firstBaseline = y + 26;
              const plate = labelPlate(x, firstBaseline + (lines.length - 1) * 15, longest, 12, 1);
              const desc =
                count === 1
                  ? `${cluster.members[0].label} caught ${clock(instant(cluster.at), displayTimeZone)}, tide ${formatHeight(unwrapSourced(height), unit)}`
                  : `${count} catches here, ${cluster.members
                      .slice(0, 3)
                      .map((m) => m.label)
                      .join(", ")}${count > 3 ? "…" : ""}`;
              return (
                <g
                  key={cluster.key}
                  data-catch-marker={cluster.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`${desc}. Activate to show it and point the read-head at the catch.`}
                  onClick={() => {
                    if (dragRef.current?.moved) return;
                    onSelectedAtChange(cluster.at);
                    setRevealedCatchKey((current) => (current === cluster.key ? null : cluster.key));
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onSelectedAtChange(cluster.at);
                    setRevealedCatchKey((current) => (current === cluster.key ? null : cluster.key));
                  }}
                >
                  <circle cx={x} cy={y} r="9" fill={markerFill} stroke="var(--color-surface)" strokeWidth="2" />
                  {count === 1 ? (
                    // A fish body with a tail, sized to sit inside the marker.
                    <path
                      d={`M ${x - 4.4} ${y} Q ${x - 1} ${y - 3.2} ${x + 2.2} ${y - 1.3} L ${x + 4.4} ${y - 2.8} L ${x + 4.4} ${y + 2.8} L ${x + 2.2} ${y + 1.3} Q ${x - 1} ${y + 3.2} ${x - 4.4} ${y} Z`}
                      fill={inkFill}
                    />
                  ) : (
                    <text x={x} y={y + 4} textAnchor="middle" dominantBaseline="middle" className="font-mono text-[11px] font-bold" fill={inkFill}>
                      {count}
                    </text>
                  )}
                  {revealed && (
                    <>
                      <rect x={plate.x} y={plate.y - (lines.length - 1) * 15} width={plate.width} height={plate.height + (lines.length - 1) * 15} rx="4" fill="var(--color-background)" />
                      {lines.map((line, index) => (
                        <text key={line} x={x} y={firstBaseline + index * 15} textAnchor="middle" className="fill-text-primary font-mono text-[12px] font-semibold">{line}</text>
                      ))}
                    </>
                  )}
                </g>
              );
            })}

            {/* NOW is deliberately quiet and deliberately different from the read-head: this
                is where the clock is, not where you are looking. */}
            {now !== null && nowHeight !== null && (
              <g>
                <line x1={xFor(now)} x2={xFor(now)} y1={PLOT_TOP} y2={plotBottom} stroke="var(--color-text-muted)" strokeWidth="2" strokeDasharray="1 4" />
                <circle cx={xFor(now)} cy={yFor(nowHeight)} r="4.5" fill="var(--color-surface)" stroke="var(--color-text-muted)" strokeWidth="2" />
                {(() => {
                  const plate = labelPlate(xFor(now), PLOT_TOP - 6, "NOW", 11);
                  return <rect x={plate.x - 2} y={plate.y} width={plate.width + 4} height={plate.height} rx="3" fill="var(--color-background)" />;
                })()}
                <text x={xFor(now)} y={PLOT_TOP - 6} textAnchor="middle" className="fill-text-muted font-mono text-[11px] font-semibold tracking-chart-pill">NOW</text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* The read-head and the height axis do not scroll: one fixed line, one dot on the
          curve, and the height scale pinned to the left edge where it stays readable. */}
      <svg className="tide-readhead" width={box.width} height={chartHeight} aria-hidden="true">
        {gridValues(yMinimum, yMaximum).map((value) => {
          const y = yFor(metres(value));
          const text = formatHeight(metres(value), unit).replace(` ${unit}`, "");
          const plate = labelPlate(0, y + 4, text, 12);
          if (y < PLOT_TOP + 6 || y > plotBottom - 6) return null;
          return (
            <g key={value}>
              <rect x={AXIS_LABEL_INSET_PX} y={plate.y + 1} width={plate.width} height={plate.height - 2} fill="var(--color-background)" fillOpacity=".8" />
              <text x={AXIS_LABEL_INSET_PX + plate.width / 2} y={y + 4} textAnchor="middle" className="fill-text-muted font-mono text-[12px]">{text}</text>
            </g>
          );
        })}
        {box.width > 0 && (
          <g>
            <path d={`M${padInline - 7},${PLOT_TOP - 12} L${padInline + 7},${PLOT_TOP - 12} L${padInline},${PLOT_TOP - 2} Z`} fill="var(--color-signal-orange)" />
            <line x1={padInline} x2={padInline} y1={PLOT_TOP - 2} y2={plotBottom} stroke="var(--color-signal-orange)" strokeWidth="2" />
            {selectedHeight !== null && (
              <>
                <circle cx={padInline} cy={yFor(selectedHeight)} r="9" fill="var(--color-signal-orange)" fillOpacity=".22" />
                <circle cx={padInline} cy={yFor(selectedHeight)} r="6" fill="var(--color-signal-orange)" stroke="var(--color-background)" strokeWidth="2.5" />
              </>
            )}
          </g>
        )}
      </svg>

      {/* Anchored to the chart's own top-right corner on the shared gutter. It appears and
          disappears as the read-head leaves and returns to the present, and because it is
          positioned out of flow that costs no layout anywhere on the screen. */}
      {nowAction !== null && (
        <button type="button" className="tide-now-button" onClick={nowAction}>
          Now
        </button>
      )}
    </div>
  );
}

function SunTransitionGlyph({ kind, x, y }: { kind: "sunrise" | "sunset"; x: number; y: number }) {
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
      <path d={`M ${x - 4.5} ${horizonY} Q ${x} ${arcControlY} ${x + 4.5} ${horizonY}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={x - 6.5} x2={x + 6.5} y1={horizonY} y2={horizonY} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={x} x2={x} y1={arrowTailY} y2={arrowTipY} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d={`M ${x - 2.25} ${arrowWingY} L ${x} ${arrowTipY} L ${x + 2.25} ${arrowWingY}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}


