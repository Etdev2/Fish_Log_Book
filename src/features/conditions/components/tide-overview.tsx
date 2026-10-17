"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { DayRange, TideZoom } from "../view-window";
import { placeMonthLabels, ZOOM_SPAN_DAYS } from "../view-window";

/** Width of one IBM Plex Mono glyph at the caption token (16px): 0.6 em. */
const LABEL_CHAR_PX = 9.6;

/**
 * Month and year zoom (FL-1, ±365 d): one vertical bar per station day, from that day's
 * lowest low to its highest high. Spring and neap cycles read at a glance; tapping a day
 * opens the detailed week chart there.
 *
 * Deliberately separate from `TideTimeline`, whose geometry is a fixed 560 px per day. The
 * overview needs a few pixels per day and no per-turn labels — teaching the detailed chart
 * to do both would put a year's worth of label collisions into the instrument.
 */
export function TideOverview({
  days,
  zoom,
  todayDay,
  anchorDay,
  formatHeight,
  onPickDay,
}: {
  days: readonly DayRange[];
  zoom: Exclude<TideZoom, "week">;
  /** `YYYY-MM-DD` of today on the station calendar, or null before the clock is read. */
  todayDay: string | null;
  /** `YYYY-MM-DD` the view is centred on. */
  anchorDay: string;
  formatHeight: (metres: number) => string;
  onPickDay: (day: DayRange) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = scrollerRef.current;
    if (element === null) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((current) =>
        Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5
          ? current
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // One screen width shows the zoom's span; a day never gets thinner than one pixel.
  const dayPx = box.width > 0 ? Math.max(1, box.width / ZOOM_SPAN_DAYS[zoom]) : 0;
  const width = dayPx * days.length;
  const height = Math.max(160, box.height);
  const top = 30;
  const bottom = 30;

  const { yMin, yMax } = useMemo(() => {
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (const d of days) {
      lo = Math.min(lo, d.lowM);
      hi = Math.max(hi, d.highM);
    }
    if (!Number.isFinite(lo)) return { yMin: 0, yMax: 1 };
    const pad = (hi - lo) * 0.08 || 0.1;
    return { yMin: lo - pad, yMax: hi + pad };
  }, [days]);
  const yFor = (m: number) => top + ((yMax - m) / (yMax - yMin)) * (height - top - bottom);

  const anchorIndex = Math.max(0, days.findIndex((d) => d.day >= anchorDay));
  const todayIndex = todayDay === null ? -1 : days.findIndex((d) => d.day === todayDay);

  // Centre the anchor whenever the zoom, the anchor or the width changes.
  useEffect(() => {
    const element = scrollerRef.current;
    if (element === null || dayPx === 0) return;
    element.scrollLeft = Math.max(0, (anchorIndex + 0.5) * dayPx - box.width / 2);
  }, [anchorIndex, dayPx, box.width, zoom]);

  /** Month starts get a divider and a label; in year zoom only every month, never days. */
  const monthStarts = useMemo(
    () => days.flatMap((d, index) => (d.day.endsWith("-01") || index === 0 ? [{ index, label: monthLabel(d.day) }] : [])),
    [days],
  );
  // Dividers for every month; labels only where they fit, so they never overlap.
  const monthLabels = useMemo(() => placeMonthLabels(monthStarts, dayPx, LABEL_CHAR_PX), [monthStarts, dayPx]);

  const scrollBy = (direction: -1 | 1) => {
    const element = scrollerRef.current;
    if (element === null) return;
    element.scrollBy({ left: direction * box.width * 0.9, behavior: "smooth" });
  };

  const pick = (clientX: number) => {
    const element = scrollerRef.current;
    if (element === null || dayPx === 0) return;
    const x = clientX - element.getBoundingClientRect().left + element.scrollLeft;
    const day = days[Math.min(days.length - 1, Math.max(0, Math.floor(x / dayPx)))];
    if (day) onPickDay(day);
  };

  const today = todayIndex >= 0 ? days[todayIndex] : null;

  return (
    <div className="tide-overview">
      <p className="tide-overview-caption">
        Daily tide range, lowest low to highest high
        {today ? ` · today ${formatHeight(today.lowM)} – ${formatHeight(today.highM)}` : ""}. Tap a day
        for its hours.
      </p>
      <div className="tide-overview-body">
        <button type="button" className="tide-overview-step" aria-label={`Earlier ${zoom}`} onClick={() => scrollBy(-1)}>
          ‹
        </button>
        <div
          ref={scrollerRef}
          className="tide-overview-scroller"
          role="group"
          aria-label={`Tide range by day, ${zoom} view. Use the date picker or the arrows to move.`}
        >
          {width > 0 && (
            <svg width={width} height={height} onClick={(event) => pick(event.clientX)} role="presentation">
              {monthStarts.map(({ index }) => (
                <line key={index} x1={index * dayPx} x2={index * dayPx} y1={top - 6} y2={height - bottom} stroke="var(--color-hairline)" />
              ))}
              {monthLabels.map(({ index, label }) => (
                <text key={`l${index}`} x={index * dayPx + 4} y={height - 6} className="fill-text-muted font-mono text-caption">
                  {label}
                </text>
              ))}
              {days.map((d, index) => {
                const x = index * dayPx + dayPx / 2;
                const selected = index === anchorIndex;
                return (
                  <line
                    key={d.day}
                    x1={x}
                    x2={x}
                    y1={yFor(d.highM)}
                    y2={yFor(d.lowM)}
                    stroke={selected ? "var(--color-signal-orange)" : "var(--color-text-link)"}
                    strokeWidth={Math.max(1, Math.min(dayPx * 0.6, 8))}
                    strokeLinecap="round"
                  />
                );
              })}
              {todayIndex >= 0 && (
                <g>
                  <line
                    x1={todayIndex * dayPx + dayPx / 2}
                    x2={todayIndex * dayPx + dayPx / 2}
                    y1={top - 4}
                    y2={height - bottom}
                    stroke="var(--color-text-primary)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                  <text
                    // Kept fully inside the drawing so "TODAY" is never clipped at either end.
                    x={Math.min(width - 30, Math.max(30, todayIndex * dayPx + dayPx / 2))}
                    y={top - 8}
                    textAnchor="middle"
                    className="fill-text-primary font-mono text-caption font-semibold tracking-chart-pill"
                  >
                    TODAY
                  </text>
                </g>
              )}
            </svg>
          )}
        </div>
        <button type="button" className="tide-overview-step" aria-label={`Later ${zoom}`} onClick={() => scrollBy(1)}>
          ›
        </button>
      </div>
    </div>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct" or, in January, "Jan '27" so the year boundary is never ambiguous. */
function monthLabel(day: string): string {
  const [year, month] = day.split("-");
  const name = MONTHS[Number(month) - 1] ?? month;
  return month === "01" ? `${name} '${year.slice(2)}` : name;
}
