/**
 * The chart's view window (ADR 011): a short slice of a long `TidePredictionSeries`.
 *
 * `TideTimeline` lays the series out at a fixed pixels-per-hour, which is right for a week
 * and absurd for two years. Rather than teach the chart about zoom, the screen hands it a
 * slice. One sample either side of the window is kept so the curve reaches the edges
 * instead of starting at the first turn inside it.
 */
import { tideSeries, type TidePredictionSeries } from "@/core/rules/tide";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days shown before and after the anchor. Matches the original week-long window. */
export const VIEW_BEFORE_MS = 2 * DAY_MS;
export const VIEW_AFTER_MS = 5 * DAY_MS;

export function viewWindowAround(anchorMs: number): { fromMs: number; toMs: number } {
  return { fromMs: anchorMs - VIEW_BEFORE_MS, toMs: anchorMs + VIEW_AFTER_MS };
}

export function sliceSeries(
  series: TidePredictionSeries,
  fromMs: number,
  toMs: number,
): TidePredictionSeries {
  const samples = series.samples;
  let first = samples.findIndex((s) => Number(s.at) >= fromMs);
  if (first === -1) first = samples.length - 1;
  let last = first;
  while (last + 1 < samples.length && Number(samples[last + 1].at) <= toMs) last++;
  const start = Math.max(0, first - 1);
  const end = Math.min(samples.length - 1, last + 1);
  if (start === 0 && end === samples.length - 1) return series;
  return tideSeries({
    station: series.station,
    samples: samples.slice(start, end + 1),
    provider: series.provider,
    retrievedAt: series.retrievedAt,
  });
}

/**
 * `YYYY-MM-DD` on the station's calendar, for `<input type="date">` min/max/value. The
 * chart's date bar divides days in the station's zone, so the picker must too — a UTC day
 * runs ahead of a Pacific one every evening.
 */
export function isoDay(ms: number, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/**
 * Zoom (FL-1, ±365 d). `week` is the detailed chart sliced around the anchor; `month` and
 * `year` are an overview of each station day's tide range, because the detailed chart lays
 * out at a fixed 560 px a day and a year of it would be 200,000 px of unreadable labels.
 */
export type TideZoom = "week" | "month" | "year";

export const ZOOM_LEVELS: readonly TideZoom[] = ["week", "month", "year"];

/** How many station days one screen width shows at each zoom. */
export const ZOOM_SPAN_DAYS: Record<TideZoom, number> = { week: 7, month: 31, year: 365 };

/** One station-calendar day's highest high and lowest low, from the turns. */
export interface DayRange {
  /** `YYYY-MM-DD` on the station's calendar. */
  readonly day: string;
  /** The first turn of that day, as an instant to anchor the week view on. */
  readonly atMs: number;
  readonly lowM: number;
  readonly highM: number;
}

/**
 * Group the series' turns by station day. Days with no turn (only possible at the very ends
 * of the window) are left out rather than drawn as zero — a missing bar is honest, a bar at
 * datum is a wrong tide.
 */
export function dailyRanges(series: TidePredictionSeries, timeZone: string): DayRange[] {
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const out: DayRange[] = [];
  let current: { day: string; atMs: number; lowM: number; highM: number } | null = null;
  for (const sample of series.samples) {
    if (sample.turn === null) continue;
    const at = Number(sample.at);
    const height = Number(sample.height);
    const day = format.format(new Date(at));
    if (current === null || current.day !== day) {
      if (current !== null) out.push(current);
      current = { day, atMs: at, lowM: height, highM: height };
    } else {
      current.lowM = Math.min(current.lowM, height);
      current.highM = Math.max(current.highM, height);
    }
  }
  if (current !== null) out.push(current);
  return out;
}

/** Whether the slice handed to the chart carries any hourly points, or only turns. */
export function hasHourly(series: TidePredictionSeries): boolean {
  return series.samples.some((s) => s.turn === null);
}

/**
 * Noon on a station calendar day, as an instant. The view's anchor is held here rather than
 * at UTC midnight: 00:00 UTC is still the previous evening in Pacific time, which made the
 * picker show yesterday (Oct 15 on Fri Oct 16). Noon is the same station day in every zone
 * we list, and it only changes when the station's date does, so the slice stays put.
 */
export function stationDayNoon(day: string, timeZone: string): number {
  const guess = Date.parse(`${day}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return guess - (wall - guess);
}

/** Today's (or any instant's) station day, as its noon. */
export function stationNoonOf(ms: number, timeZone: string): number {
  return stationDayNoon(isoDay(ms, timeZone), timeZone);
}

/** Compact range label for the toolbar: "Oct 16 '25 – Oct 16 '27", fits a 390 px phone. */
export function compactRange(fromMs: number, toMs: number, timeZone: string): string {
  const fmt = (ms: number) => {
    const [y, m, d] = isoDay(ms, timeZone).split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[Number(m) - 1]} ${Number(d)} '${y.slice(2)}`;
  };
  return `${fmt(fromMs)} – ${fmt(toMs)}`;
}

/**
 * Month labels for the overview that never overlap (year view at New Year put "Dec" and
 * "Jan 27" on top of each other). Walks left to right; a label that would collide with the
 * last kept one is dropped — unless it is January, which carries the year and wins.
 */
export function placeMonthLabels(
  starts: readonly { index: number; label: string }[],
  dayPx: number,
  charPx: number,
  gapPx = 6,
): { index: number; label: string }[] {
  const kept: { index: number; label: string }[] = [];
  const right = (l: { index: number; label: string }) => l.index * dayPx + 4 + l.label.length * charPx + gapPx;
  for (const start of starts) {
    const prev = kept.at(-1);
    if (prev === undefined || start.index * dayPx >= right(prev)) {
      kept.push(start);
    } else if (start.label.includes(" ")) {
      // January (labelled with its year) replaces whatever it would overlap.
      kept.pop();
      while (kept.length > 0 && start.index * dayPx < right(kept.at(-1)!)) kept.pop();
      kept.push(start);
    }
  }
  return kept;
}
