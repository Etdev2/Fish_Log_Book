/**
 * Pure chart geometry: pixel scales and the Catmull-Rom path builder. This is presentation
 * (ADR 006 §1) — it plots whatever heights it is given, and does not itself read the tide
 * engine or the fixture. `tide-chart.tsx` is the only caller.
 *
 * Time here is a plain epoch-millisecond `number`, not the branded `Instant` — this file
 * never touches `core/`, so there is nothing for the brand to protect against here, and
 * every caller already has a real `Instant` to pass in (a branded number is still a number).
 */
import type { Metres } from "@/core/units";

export const DAY_WIDTH = 560;
export const MS_PER_PIXEL = 86_400_000 / DAY_WIDTH;
export const LEFT_PADDING = 10;
export const RIGHT_PADDING = 24;
export const CHART_HEIGHT = 300;
export const PLOT_TOP = 22;
export const PLOT_BOTTOM = 48;
export const PLOT_HEIGHT = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;

/**
 * Local calendar-day boundaries for this fixture only. Newport Bay Entrance is fixed at
 * UTC-7 (PDT) for the whole Aug 31 - Sep 3, 2026 window, with no DST edge inside it, so a
 * flat offset is exact here. A live, multi-station feed that can cross a DST boundary or
 * span time zones needs a real `Intl`-based day-boundary calculation instead — flagged as
 * follow-up, not solved here.
 */
const STATION_UTC_OFFSET_MS = 7 * 3_600_000; // local midnight = 07:00 UTC

export function xFor(at: number, seriesStart: number): number {
  return LEFT_PADDING + (at - seriesStart) / MS_PER_PIXEL;
}

export function chartWidthFor(seriesStart: number, seriesEnd: number): number {
  return Math.round((seriesEnd - seriesStart) / MS_PER_PIXEL) + LEFT_PADDING + RIGHT_PADDING;
}

/** 0-based index of the local calendar day `at` falls in, relative to `seriesStart`'s day. */
export function localDayIndex(at: number, seriesStart: number): number {
  return Math.floor((at - seriesStart + STATION_UTC_OFFSET_MS) / 86_400_000);
}

/** Every local midnight at/after `seriesStart` and before `seriesEnd`. */
export function localMidnights(seriesStart: number, seriesEnd: number): number[] {
  const result: number[] = [];
  let at = seriesStart + STATION_UTC_OFFSET_MS;
  while (at < seriesEnd) {
    if (at > seriesStart) result.push(at);
    at += 86_400_000;
  }
  return result;
}

export function makeYFor(yMinimum: number, yMaximum: number) {
  return (metres: Metres): number =>
    PLOT_TOP + PLOT_HEIGHT - ((metres - yMinimum) / (yMaximum - yMinimum)) * PLOT_HEIGHT;
}

/** Catmull-Rom through the given (x, y) points, as an SVG path `d` string. Presentation only. */
export function curvePath(points: readonly (readonly [number, number])[]): string {
  if (points.length === 0) return "";
  let path = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;
    path += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)} ${(
      p2[0] -
      (p3[0] - p1[0]) / 6
    ).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return path;
}
