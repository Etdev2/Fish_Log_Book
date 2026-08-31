"use client";

import { useEffect, useRef } from "react";

import { instant } from "@/core/units";
import type { MoonPhase } from "@/core/rules/astro";

import { BottomSheet } from "@/components/bottom-sheet";
import { MoonPhaseVisual } from "./moon-phase-visual";
import { calendarDayNumber, calendarWeekday, formatMoonIllumination, formatMoonPhaseName, dayLabel, monthDay } from "../format";

export type CalendarDay = { from: number; to: number; anchor: number; moon: MoonPhase };

/**
 * The date strip, moved off the main screen.
 *
 * The founder left one call to this pass: whether the strip stays permanently visible.
 * It does not. On an iPhone-sized viewport the strip was worth 80–100px of chart, and the
 * chart is the thing being read; the date is already legible in the control that opens
 * this sheet, and the timeline itself crosses midnight without anyone touching a date
 * control at all. So the strip is here, one tap away, and the screen keeps the pixels.
 *
 * The calendar still never promises data that is not loaded: it is built only from the
 * cached prediction window, and dates outside it are omitted rather than shown as if the
 * app could open them.
 */
export function DatesSheet({
  open,
  onClose,
  days,
  activeIndex,
  onPick,
  stationTimeZone,
}: {
  open: boolean;
  onClose: () => void;
  days: readonly CalendarDay[];
  activeIndex: number;
  onPick: (index: number) => void;
  stationTimeZone: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLButtonElement>(`[data-day-index="${activeIndex}"]`);
    if (!rail || !active) return;
    rail.scrollTo({
      left: Math.max(0, active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2),
      behavior: "auto",
    });
  }, [open, activeIndex]);

  const first = days[0];
  const last = days[days.length - 1];

  return (
    <BottomSheet open={open} onClose={onClose} eyebrow="Dates" title="Cached days">
      <p className="app-sheet-note">
        {first && last
          ? `${monthDay(instant(first.from), stationTimeZone)}–${monthDay(instant(last.to), stationTimeZone)}, station dates. Nothing outside this window is loaded.`
          : "No days are loaded."}
      </p>
      <div ref={railRef} className="tide-date-rail" role="group" aria-label="Loaded tide prediction dates">
        {days.map((day, index) => (
          <button
            key={day.from}
            type="button"
            className="tide-date-chip"
            data-day-index={index}
            aria-pressed={index === activeIndex}
            aria-label={`${dayLabel(instant(day.anchor), stationTimeZone)}, ${formatMoonPhaseName(day.moon.name)}, ${formatMoonIllumination(day.moon.illumination)}`}
            onClick={() => {
              onPick(index);
              onClose();
            }}
          >
            <span>{calendarWeekday(instant(day.anchor), stationTimeZone)}</span>
            <strong>{calendarDayNumber(instant(day.anchor), stationTimeZone)}</strong>
            <MoonPhaseVisual className="tide-date-chip-moon" id={`date-chip-${day.from}`} phase={day.moon} compact />
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
