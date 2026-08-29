"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  TIDE_BASE_UTC,
  TIDE_SELECTED_MINUTES,
  TIDE_POINTS,
  TIDE_STATION,
  TIDE_STATION_NAME,
} from "./tide-fixture";

const DAY_WIDTH = 560;
const MINUTES_PER_PIXEL = 1440 / DAY_WIDTH;
const LEFT_PADDING = 10;
const RIGHT_PADDING = 24;
const CHART_HEIGHT = 300;
const PLOT_TOP = 22;
const PLOT_BOTTOM = 48;
const PLOT_HEIGHT = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
const TOTAL_MINUTES = TIDE_POINTS.at(-1)?.[0] ?? 0;
const CHART_WIDTH = Math.round(TOTAL_MINUTES / MINUTES_PER_PIXEL) + LEFT_PADDING + RIGHT_PADDING;
const STATION_TIME_ZONE = "America/Los_Angeles";
const STATION_TIME_ZONE_LABEL = "PDT";

function dateAt(minutes: number) {
  return new Date(TIDE_BASE_UTC + minutes * 60_000);
}

function heightAt(minutes: number) {
  if (minutes <= TIDE_POINTS[0][0]) return TIDE_POINTS[0][1];
  for (let index = 1; index < TIDE_POINTS.length; index += 1) {
    const previous = TIDE_POINTS[index - 1];
    const next = TIDE_POINTS[index];
    if (minutes <= next[0]) {
      return previous[1] + ((minutes - previous[0]) / (next[0] - previous[0])) * (next[1] - previous[1]);
    }
  }
  return TIDE_POINTS.at(-1)?.[1] ?? 0;
}

function tideLegAt(minutes: number) {
  const turningPoints = TIDE_POINTS.filter(([, , mark]) => mark);
  const start = [...turningPoints].reverse().find(([turningMinute]) => turningMinute <= minutes);
  const end = turningPoints.find(([turningMinute]) => turningMinute > minutes);
  if (!start || !end) return null;
  const rising = end[2] === "H";
  const height = heightAt(minutes);
  const progress = rising
    ? (height - start[1]) / (end[1] - start[1])
    : (start[1] - height) / (start[1] - end[1]);
  const tideHour = Math.min(6, Math.max(1, Math.ceil(((minutes - start[0]) / (end[0] - start[0])) * 6)));
  const twelfths = [1, 2, 3, 3, 2, 1][tideHour - 1];
  return { percentage: Math.round(progress * 100), tideHour, twelfths };
}

function meters(millimeters: number) {
  return `${(millimeters / 1000).toFixed(2)} m`;
}

function clock(minutes: number) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: STATION_TIME_ZONE })
    .format(dateAt(minutes))
    .replace(" ", "")
    .toLowerCase();
}

function dayLabel(minutes: number) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", timeZone: STATION_TIME_ZONE }).format(dateAt(minutes));
}

function shortDay(minutes: number) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", timeZone: STATION_TIME_ZONE }).format(dateAt(minutes));
}

function monthDay(minutes: number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: STATION_TIME_ZONE }).format(dateAt(minutes));
}

function stationHour(minutes: number) {
  const hour = new Intl.DateTimeFormat("en-US", { hour: "2-digit", hourCycle: "h23", timeZone: STATION_TIME_ZONE })
    .formatToParts(dateAt(minutes))
    .find((part) => part.type === "hour")?.value;
  return Number(hour ?? "0");
}

function dayIndex(minutes: number) {
  return Math.floor((17 * 60 + minutes) / 1440);
}

function xFor(minutes: number) {
  return LEFT_PADDING + minutes / MINUTES_PER_PIXEL;
}

const heights = TIDE_POINTS.map((point) => point[1]);
const low = Math.min(...heights);
const high = Math.max(...heights);
const yMinimum = low - (high - low) * 0.2;
const yMaximum = high + (high - low) * 0.2;
function yFor(millimeters: number) {
  return PLOT_TOP + PLOT_HEIGHT - ((millimeters - yMinimum) / (yMaximum - yMinimum)) * PLOT_HEIGHT;
}

function curvePath() {
  const points = TIDE_POINTS.map(([minute, millimeters]) => [xFor(minute), yFor(millimeters)] as const);
  let path = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    path += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return path;
}

export function TideChart() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cursor, setCursor] = useState(TIDE_SELECTED_MINUTES);
  const [reading, setReading] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [centerMinute, setCenterMinute] = useState(TIDE_SELECTED_MINUTES);
  const [tooltipX, setTooltipX] = useState(50);
  const path = useMemo(() => curvePath(), []);

  const scrollToMinute = (minute: number, smooth = true) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ left: Math.max(0, xFor(minute) - scroller.clientWidth / 2), behavior: smooth && !reducedMotion ? "smooth" : "auto" });
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => scrollToMinute(TIDE_SELECTED_MINUTES, false));
    return () => cancelAnimationFrame(frame);
  }, []);

  const updateCenter = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setCenterMinute(Math.max(0, Math.min(TOTAL_MINUTES, (scroller.scrollLeft + scroller.clientWidth / 2 - LEFT_PADDING) * MINUTES_PER_PIXEL)));
  };

  const readPointer = (clientX: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const bounds = scroller.getBoundingClientRect();
    setCursor(Math.max(0, Math.min(TOTAL_MINUTES, (clientX - bounds.left + scroller.scrollLeft - LEFT_PADDING) * MINUTES_PER_PIXEL)));
    setTooltipX(Math.max(64, Math.min(bounds.width + 46 - 64, clientX - bounds.left + 46)));
  };

  const rate = heightAt(TIDE_SELECTED_MINUTES + 30) - heightAt(TIDE_SELECTED_MINUTES - 30);
  const rising = rate > 0;
  const slack = Math.abs(rate) < 50;
  const selectedLeg = tideLegAt(TIDE_SELECTED_MINUTES);
  const nextHigh = TIDE_POINTS.find(([minute, , mark]) => mark === "H" && minute > TIDE_SELECTED_MINUTES);
  const todayPoints = TIDE_POINTS.filter(([minute]) => minute >= 420 && minute <= 1860).map(([, millimeters]) => millimeters);
  const currentDay = dayIndex(centerMinute);
  const finalDay = dayIndex(TOTAL_MINUTES);
  const cursorHeight = heightAt(cursor);
  const cursorX = xFor(cursor);
  const cursorY = yFor(cursorHeight);

  const moveReadHead = (amount: number) => {
    const next = Math.max(0, Math.min(TOTAL_MINUTES, cursor + amount));
    setCursor(next);
    scrollToMinute(next);
  };

  return (
    <section className="mx-auto w-full max-w-[820px] overflow-x-hidden px-4 pb-14 pt-5 sm:px-5">
      <header className="flex flex-col gap-1 pb-4 pt-3">
        <p className="font-mono text-sm font-medium uppercase tracking-[.14em] text-text-muted">Station {TIDE_STATION} · {TIDE_STATION_NAME}</p>
        <h1 className="text-h1">Tide</h1>
        <p className="text-caption text-text-muted">Predicted height above MLLW · station-local time ({STATION_TIME_ZONE_LABEL}) · selected fixture instant: {dayLabel(TIDE_SELECTED_MINUTES)}, {clock(TIDE_SELECTED_MINUTES)}</p>
        <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-hairline bg-surface-raised px-3 py-1.5 font-mono text-[13px] tracking-wide text-text-muted before:size-2 before:rounded-full before:bg-text-muted">Cached fixture — not a live reading</span>
      </header>

      <dl className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-4">
        <StatusCell label="Selected"><span>{meters(heightAt(TIDE_SELECTED_MINUTES))}</span></StatusCell>
        <StatusCell label="State" cyan>
          <span aria-hidden="true">{slack ? "—" : rising ? "▲" : "▼"} </span>{slack ? "Slack" : rising ? "Flooding" : "Ebbing"}
          {slack ? <><small>At the turn</small><small>Movement: 0.00 m/h</small><small>Rule: turning</small></> : <><small>{selectedLeg?.percentage ?? 0}% through {rising ? "flood" : "ebb"}</small><small>Movement: {rising ? "+" : ""}{(rate / 1000).toFixed(2)} m/h</small><small aria-label={`Rule of twelfths: approximately ${selectedLeg?.twelfths ?? 0} twelfths of the tidal range this tide hour`}>Rule: ~{selectedLeg?.twelfths ?? 0}/12</small></>}
        </StatusCell>
        <StatusCell label="Next high">{nextHigh ? <><span>{clock(nextHigh[0])}</span><small>in {Math.floor((nextHigh[0] - TIDE_SELECTED_MINUTES) / 60)}h {(nextHigh[0] - TIDE_SELECTED_MINUTES) % 60}m</small></> : "—"}</StatusCell>
        <StatusCell label={`${monthDay(TIDE_SELECTED_MINUTES)} range`}>{meters(Math.max(...todayPoints) - Math.min(...todayPoints))}</StatusCell>
      </dl>

      <div className="overflow-hidden rounded-lg border border-hairline bg-surface pb-1.5 pt-3.5">
        <div className="flex items-center justify-between gap-2 px-3.5 pb-3">
          <h2 className="min-w-0 truncate text-lg font-bold">{dayLabel(centerMinute)}</h2>
          <div className="flex shrink-0 gap-2">
            <button className="size-[52px] rounded-md border border-border-interactive bg-surface-raised text-xl hover:border-tide-cyan disabled:opacity-45" type="button" aria-label="Previous day" disabled={currentDay <= 0} onClick={() => scrollToMinute(Math.max(0, (currentDay - 1) * 1440 - 17 * 60 + 720))}>‹</button>
            <button className="h-[52px] rounded-md border border-signal-orange bg-surface-raised px-3 font-mono text-sm font-semibold tracking-widest text-signal-orange hover:bg-signal-orange hover:text-ink-on-orange" type="button" aria-label={`Jump to selected fixture time: ${dayLabel(TIDE_SELECTED_MINUTES)}, ${clock(TIDE_SELECTED_MINUTES)}`} onClick={() => { setCursor(TIDE_SELECTED_MINUTES); scrollToMinute(TIDE_SELECTED_MINUTES); }}>SEP 1</button>
            <button className="size-[52px] rounded-md border border-border-interactive bg-surface-raised text-xl hover:border-tide-cyan disabled:opacity-45" type="button" aria-label="Next day" disabled={currentDay >= finalDay} onClick={() => scrollToMinute(Math.min(TOTAL_MINUTES, (currentDay + 1) * 1440 - 17 * 60 + 720))}>›</button>
          </div>
        </div>

        <div className="relative flex">
          <svg className="z-10 w-[46px] shrink-0 bg-surface" width="46" height={CHART_HEIGHT} aria-hidden="true">
            {gridValues().map((value) => <text className="fill-text-muted font-mono text-[11px]" key={value} x="36" y={yFor(value) + 4} textAnchor="end">{(value / 1000).toFixed(1)}</text>)}
            <text className="fill-text-muted font-mono text-[11px]" x="36" y={PLOT_TOP + PLOT_HEIGHT + 24} textAnchor="end">m</text>
          </svg>
          <div
            ref={scrollerRef}
            className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            tabIndex={0}
            role="slider"
            aria-label="Tide height by time. Use left and right arrows to read the curve."
            aria-valuemin={0}
            aria-valuemax={TOTAL_MINUTES}
            aria-valuenow={Math.round(cursor)}
            aria-valuetext={`${meters(cursorHeight)} at ${clock(cursor)} ${STATION_TIME_ZONE_LABEL}, ${dayLabel(cursor)}`}
            onScroll={updateCenter}
            onFocus={() => setReading(true)}
            onBlur={() => setReading(false)}
            onPointerMove={(event) => { if (event.pointerType === "mouse") { readPointer(event.clientX); setReading(true); } }}
            onPointerLeave={() => setReading(false)}
            onPointerDown={(event) => { if (event.pointerType !== "mouse") holdTimeout.current = setTimeout(() => { readPointer(event.clientX); setReading(true); }, 260); }}
            onPointerUp={(event) => { if (holdTimeout.current) clearTimeout(holdTimeout.current); holdTimeout.current = null; if (event.pointerType !== "mouse") setReading(false); }}
            onPointerCancel={(event) => { if (holdTimeout.current) clearTimeout(holdTimeout.current); holdTimeout.current = null; if (event.pointerType !== "mouse") setReading(false); }}
            onPointerMoveCapture={() => { if (holdTimeout.current) { clearTimeout(holdTimeout.current); holdTimeout.current = null; } }}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 180 : 15;
              if (event.key === "ArrowRight") { event.preventDefault(); moveReadHead(step); }
              else if (event.key === "ArrowLeft") { event.preventDefault(); moveReadHead(-step); }
              else if (event.key === "Home") { event.preventDefault(); setCursor(0); scrollToMinute(0); }
              else if (event.key === "End") { event.preventDefault(); setCursor(TOTAL_MINUTES); scrollToMinute(TOTAL_MINUTES); }
            }}
          >
            <svg width={CHART_WIDTH} height={CHART_HEIGHT} role="img" aria-label="Continuous tide curve for Newport Bay Entrance across three days, with labelled highs and lows.">
              <defs><linearGradient id="tide-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--color-tide-cyan)" stopOpacity=".3"/><stop offset="1" stopColor="var(--color-tide-cyan)" stopOpacity="0"/></linearGradient></defs>
              {gridValues().map((value) => <line key={value} x1="0" x2={CHART_WIDTH} y1={yFor(value)} y2={yFor(value)} stroke="var(--color-hairline)" />)}
              {midnights().map((minute) => <g key={minute}><line x1={xFor(minute)} x2={xFor(minute)} y1={PLOT_TOP - 14} y2={PLOT_TOP + PLOT_HEIGHT + 30} stroke="var(--color-border-interactive)" strokeDasharray="2 5"/><text x={xFor(minute) + 8} y={PLOT_TOP - 6} className="fill-text-muted font-mono text-[11px] font-semibold tracking-widest">{shortDay(minute).toUpperCase()}</text></g>)}
              {timeLabels().map((minute) => <text key={minute} x={xFor(minute)} y={PLOT_TOP + PLOT_HEIGHT + 24} textAnchor="middle" className="fill-text-muted font-mono text-[12px]">{String(stationHour(minute)).padStart(2, "0")}:00</text>)}
              <path d={`${path}L${xFor(TOTAL_MINUTES)},${PLOT_TOP + PLOT_HEIGHT}L${xFor(0)},${PLOT_TOP + PLOT_HEIGHT}Z`} fill="url(#tide-area)"/>
              <path d={path} fill="none" stroke="var(--color-tide-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {TIDE_POINTS.filter(([, , mark]) => mark).map(([minute, millimeters, mark]) => <g key={minute}><circle cx={xFor(minute)} cy={yFor(millimeters)} r="5" fill="var(--color-tide-cyan)" stroke="var(--color-surface)" strokeWidth="2"/><text x={xFor(minute)} y={yFor(millimeters) + (mark === "H" ? -14 : 22)} textAnchor="middle" className="fill-text-primary font-mono text-[12px] font-semibold">{meters(millimeters)} <tspan className="fill-text-muted font-normal">{clock(minute)}</tspan></text></g>)}
              <line x1={xFor(TIDE_SELECTED_MINUTES)} x2={xFor(TIDE_SELECTED_MINUTES)} y1={PLOT_TOP - 8} y2={PLOT_TOP + PLOT_HEIGHT} stroke="var(--color-signal-orange)" strokeWidth="2" strokeDasharray="3 4"/><rect x={xFor(TIDE_SELECTED_MINUTES) - 30} y={PLOT_TOP - 20} width="60" height="17" rx="8.5" fill="var(--color-signal-orange)"/><text x={xFor(TIDE_SELECTED_MINUTES)} y={PLOT_TOP - 7.5} textAnchor="middle" className="fill-ink-on-orange font-mono text-[10px] font-semibold tracking-[.08em]">FIXTURE</text><circle cx={xFor(TIDE_SELECTED_MINUTES)} cy={yFor(heightAt(TIDE_SELECTED_MINUTES))} r="6.5" fill="var(--color-signal-orange)" stroke="var(--color-surface)" strokeWidth="2.5"/>
              {reading && <><line x1={cursorX} x2={cursorX} y1="8" y2={PLOT_TOP + PLOT_HEIGHT} stroke="var(--color-border-interactive)"/><circle cx={cursorX} cy={cursorY} r="6" fill="var(--color-text-primary)" stroke="var(--color-surface)" strokeWidth="2"/></>}
            </svg>
          </div>
          {reading && <div className="pointer-events-none absolute top-1 z-20 rounded-md border border-border-interactive bg-surface-raised px-3 py-1.5 font-mono text-sm" style={{ left: tooltipX, transform: "translateX(-50%)" }}><b className="block text-[17px]">{meters(cursorHeight)}</b><span className="text-[13px] text-text-muted">{clock(cursor)} · {shortDay(cursor)}</span></div>}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-3.5 pt-2 font-mono text-[13px] text-text-muted"><span className="inline-flex items-center gap-2 before:h-[3px] before:w-4 before:rounded before:bg-tide-cyan">Tide height</span><span className="inline-flex items-center gap-2 before:h-[3px] before:w-4 before:rounded before:bg-signal-orange">Selected fixture time</span><span>Drag the curve · ← → to read</span></div>
      </div>

      <button className="mt-4 min-h-[68px] w-full rounded-lg border border-border-interactive bg-surface-raised px-5 text-lg font-semibold hover:border-tide-cyan" type="button" aria-expanded={tableOpen} aria-controls="tide-table" onClick={() => setTableOpen((open) => !open)}>{tableOpen ? "Hide the numbers" : "Show the numbers instead"}</button>
      {tableOpen && <div id="tide-table" className="mt-3 overflow-x-auto rounded-lg border border-hairline"><table className="w-full border-collapse font-mono text-[15px]"><caption className="p-3 text-left text-sm text-text-muted">Predicted height above MLLW, hourly, with the exact highs and lows. Station-local time ({STATION_TIME_ZONE_LABEL}).</caption><thead><tr className="border-t border-hairline text-left text-[13px] uppercase tracking-wider text-text-muted"><th className="px-3.5 py-2 font-medium">Time</th><th className="px-3.5 py-2 font-medium">Height</th><th className="px-3.5 py-2 font-medium">Mark</th></tr></thead><tbody>{tableRows()}</tbody></table></div>}
      <p className="mt-6 border-t border-hairline pt-4 text-[15px] text-text-muted">78 renderable points across a 71-hour window, with every exact turning point kept. Embedded NOAA CO-OPS prediction fixture from the approved prototype; retrieval timestamp was not recorded. Window: Aug 31, 2026 5:00pm–Sep 3, 2026 4:00pm {STATION_TIME_ZONE_LABEL}. Station <code className="font-mono text-[13px] text-text-primary">{TIDE_STATION}</code>, datum <code className="font-mono text-[13px] text-text-primary">MLLW</code>, metric.</p>
    </section>
  );
}

function StatusCell({ label, cyan = false, children }: { label: string; cyan?: boolean; children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-0.5 bg-surface p-3"><dt className="font-mono text-xs uppercase tracking-widest text-text-muted">{label}</dt><dd className={`m-0 font-mono text-xl font-semibold tabular-nums [&_small]:mt-1 [&_small]:block [&_small]:text-[13px] [&_small]:font-normal [&_small]:text-text-muted ${cyan ? "text-tide-cyan" : ""}`}>{children}</dd></div>;
}

function gridValues() { const values: number[] = []; for (let value = Math.ceil(yMinimum / 500) * 500; value <= yMaximum; value += 500) values.push(value); return values; }
function midnights() { const minutes: number[] = []; for (let minute = 420; minute < TOTAL_MINUTES; minute += 1440) minutes.push(minute); return minutes; }
function timeLabels() { const minutes: number[] = []; for (let minute = 0; minute <= TOTAL_MINUTES; minute += 180) if (stationHour(minute) !== 0) minutes.push(minute); return minutes; }
function tableRows() {
  let previousDay = -1;
  return TIDE_POINTS.filter(([minute, , mark]) => minute % 60 === 0 || Boolean(mark)).flatMap(([minute, millimeters, mark]) => {
    const rows: React.ReactNode[] = []; const current = dayIndex(minute);
    if (current !== previousDay) { rows.push(<tr key={`day-${minute}`} className="border-t border-hairline bg-surface-raised text-[13px] font-semibold uppercase tracking-wider text-text-muted"><td colSpan={3} className="px-3.5 py-2">{dayLabel(minute)}</td></tr>); previousDay = current; }
    rows.push(<tr key={minute} className={`border-t border-hairline ${mark ? "font-semibold text-tide-cyan" : ""}`}><td className="px-3.5 py-2">{clock(minute)}</td><td className="px-3.5 py-2">{meters(millimeters)}</td><td className="px-3.5 py-2">{mark === "H" ? "High" : mark === "L" ? "Low" : ""}</td></tr>); return rows;
  });
}
