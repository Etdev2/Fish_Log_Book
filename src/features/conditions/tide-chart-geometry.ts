/**
 * Pure chart geometry: pixel scales, the Catmull-Rom path builder, and the scroll <-> time
 * conversions the timeline scrubs on. This is presentation (ADR 006 §1) — it plots whatever
 * heights it is given, and does not itself read the tide engine or the fixture.
 * `components/tide-timeline.tsx` is the only caller.
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

/**
 * The plot is no longer a fixed 300px box. The timeline fills whatever vertical room the
 * single-screen layout has left after the header and the shell nav, measured at runtime,
 * so the curve is the biggest thing on the screen on a tall phone and still legible on a
 * short one. These two constants are the fixed furniture inside that box: the strip above
 * the plot that holds the day divider tags and the NOW flag, and the strip below it that
 * holds the hour axis.
 */
export const DEFAULT_CHART_HEIGHT = 320;
export const MIN_CHART_HEIGHT = 200;
export const PLOT_TOP = 26;
export const PLOT_BOTTOM = 30;

export function plotHeightFor(chartHeight: number): number {
  return Math.max(40, chartHeight - PLOT_TOP - PLOT_BOTTOM);
}

/**
 * Calendar-day boundaries, computed for a real IANA zone via `Intl` rather than a
 * hardcoded UTC offset — a flat offset is wrong across any DST edge, including one
 * inside the station's own zone, so it was never actually safe even before a second
 * zone entered the picture. Code review caught a real bug this offset created: every
 * day boundary (the midnight gridlines, the day-nav buttons, the numbers table's
 * per-day sections) was computed against this fixed station offset while the LABELS
 * drawn on those same boundaries were rendered in the viewer's own zone — so a viewer
 * outside the station's zone could see a day's gridline sitting under the wrong
 * weekday, "next day" jumping to the wrong instant relative to their own clock, and a
 * table row filed under the wrong day's heading.
 *
 * Fixed by deliberately anchoring the chart's day/night structure — gridlines, the
 * date control, and the numbers table — to the STATION's calendar day, not the
 * viewer's: a tide table is inherently about a place, the same way NOAA's own daily
 * tide tables are dated by the station's calendar day regardless of who is reading
 * them. Every call site that labels one of these boundaries now passes
 * `STATION_TIME_ZONE`, matching the zone these functions compute against — see
 * `tide-screen.tsx` and the worklog. Anything that reports a single INSTANT's clock time
 * (the read-head readout, the sheets' event times) is unaffected and continues to convert
 * to the viewer's own zone, which is the feature this was never meant to break.
 */
function zonedYmd(at: number, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(at));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { y: Number(map.year), m: Number(map.month), d: Number(map.day) };
}

/** Integer day number in a flat UTC calendar, for exact calendar-day arithmetic that
 *  never has to reason about a day being 23 or 25 hours long. */
function dayNumber({ y, m, d }: { y: number; m: number; d: number }): number {
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** The UTC instant of local midnight for the given zone's calendar date, correcting once
 *  for the case where the naive guess and the real instant land in different UTC offsets
 *  (i.e. the guess itself straddles a DST transition). */
function zonedMidnightUtc(ymd: { y: number; m: number; d: number }, timeZone: string): number {
  const guess = Date.UTC(ymd.y, ymd.m - 1, ymd.d, 0, 0, 0);
  const offsetAt = (ts: number) => {
    const p = zonedYmdWithTime(ts, timeZone);
    return Date.UTC(p.y, p.m - 1, p.d, p.hour, p.minute, p.second) - ts;
  };
  const offset1 = offsetAt(guess);
  const corrected = guess - offset1;
  const offset2 = offsetAt(corrected);
  return offset2 === offset1 ? corrected : guess - offset2;
}

function zonedYmdWithTime(at: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(at));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { y: Number(map.year), m: Number(map.month), d: Number(map.day), hour: Number(map.hour), minute: Number(map.minute), second: Number(map.second) };
}

export function xFor(at: number, seriesStart: number): number {
  return LEFT_PADDING + (at - seriesStart) / MS_PER_PIXEL;
}

export function chartWidthFor(seriesStart: number, seriesEnd: number): number {
  return Math.round((seriesEnd - seriesStart) / MS_PER_PIXEL) + LEFT_PADDING + RIGHT_PADDING;
}

/**
 * The scrubbing contract, and the reason there is now exactly ONE selected-time indicator
 * on this screen.
 *
 * The timeline track is padded by half the viewport on each side, so the instant sitting
 * under the fixed centre read-head is a pure function of `scrollLeft` — no pointer state,
 * no long-press, no second "selected" position that can drift away from what the viewer is
 * looking at. `scrollLeftFor` is its exact inverse, which is what the date control, the Now
 * button, and the keyboard steps use to move the timeline.
 */
export function atFromScrollLeft(scrollLeft: number, seriesStart: number): number {
  return seriesStart + (scrollLeft - LEFT_PADDING) * MS_PER_PIXEL;
}

export function scrollLeftFor(at: number, seriesStart: number): number {
  return xFor(at, seriesStart);
}

/**
 * Greedy left-to-right label thinning: keep a label only if it clears the last kept one by
 * `minGapPx`. The tide curve's own highs and lows are the labels that matter, and at this
 * zoom they normally clear each other comfortably — but a mixed-tide day, or a future
 * station with a short second turn, can put two turns close enough together that both
 * plates overlap into mush. Dropping one label is honest (the marker stays, and every
 * number is in the tide-details sheet); overlapping them is not readable at all.
 *
 * `xs` must be sorted ascending.
 */
export function visibleLabelFlags(xs: readonly number[], minGapPx: number): boolean[] {
  let lastKept: number | null = null;
  return xs.map((x) => {
    if (lastKept !== null && x - lastKept < minGapPx) return false;
    lastKept = x;
    return true;
  });
}

/** 0-based index of the calendar day `at` falls in (in `timeZone`), relative to
 *  `seriesStart`'s day in that same zone. */
export function localDayIndex(at: number, seriesStart: number, timeZone: string): number {
  return dayNumber(zonedYmd(at, timeZone)) - dayNumber(zonedYmd(seriesStart, timeZone));
}

/** Every zone-local midnight at/after `seriesStart` and before `seriesEnd`, in `timeZone`. */
export function localMidnights(seriesStart: number, seriesEnd: number, timeZone: string): number[] {
  const result: number[] = [];
  const startDay = dayNumber(zonedYmd(seriesStart, timeZone));
  const endDay = dayNumber(zonedYmd(seriesEnd, timeZone));
  for (let day = startDay + 1; day <= endDay; day++) {
    const y = new Date(day * 86_400_000).getUTCFullYear();
    const m = new Date(day * 86_400_000).getUTCMonth() + 1;
    const d = new Date(day * 86_400_000).getUTCDate();
    const midnight = zonedMidnightUtc({ y, m, d }, timeZone);
    if (midnight > seriesStart && midnight < seriesEnd) result.push(midnight);
  }
  return result;
}

export function makeYFor(yMinimum: number, yMaximum: number, chartHeight: number) {
  const plotHeight = plotHeightFor(chartHeight);
  return (metres: Metres): number =>
    PLOT_TOP + plotHeight - ((metres - yMinimum) / (yMaximum - yMinimum)) * plotHeight;
}

/**
 * A backing-plate rect sized to sit behind an on-curve text label, so its actual
 * immediate background is an opaque colour rather than the composited day/night band
 * (which can drop required-information text below the 7:1 floor — see the worklog's
 * contrast table). Every label this is used for is drawn in `font-mono`, so a
 * monospace per-character advance is an honest way to size the plate without a DOM
 * measurement pass (`getComputedTextLength` would need a `useLayoutEffect` per label
 * and would not match during SSR). The multiplier is deliberately generous — a plate a
 * couple of pixels wider than the glyphs is invisible at this scale; a plate that
 * clips the text is not.
 *
 * `lines` sizes the plate for a stacked label (the turn labels are now two lines: the
 * height above the clock time, which is both narrower and easier to read at a glance
 * than one long run-on string).
 */
export function labelPlate(
  centerX: number,
  baselineY: number,
  text: string,
  fontSizePx: number,
  lines: number = 1,
): { x: number; y: number; width: number; height: number } {
  const charWidth = fontSizePx * 0.64;
  const paddingX = 5;
  const lineHeight = fontSizePx * 1.25;
  const width = text.length * charWidth + paddingX * 2;
  const height = fontSizePx + 8 + (lines - 1) * lineHeight;
  return { x: centerX - width / 2, y: baselineY - fontSizePx * 0.86, width, height };
}

/**
 * The height-axis grid values between `yMinimum` and `yMaximum`, on the chart's fixed
 * half-metre step. The last rounding exists because repeated floating-point addition
 * drifts (0.1 + 0.2 ≠ 0.3); the values drawn on screen are what the tests pin.
 */
export function gridValues(yMinimum: number, yMaximum: number): number[] {
  const values: number[] = [];
  const stepMetres = 0.5;
  for (let value = Math.ceil(yMinimum / stepMetres) * stepMetres; value <= yMaximum; value += stepMetres) {
    values.push(Math.round(value * 1000) / 1000);
  }
  return values;
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
