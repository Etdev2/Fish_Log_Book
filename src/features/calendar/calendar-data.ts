/**
 * Calendar data: the pure half of the month grid (founder requirements 2026-09-01 §7).
 *
 * The calendar is dated by the VIEWER's calendar (your days of fishing), not a tide
 * station's — the opposite of the tide chart, on purpose and documented: a tide table is
 * about a place; a logbook is about a person. All zone work goes through `Intl` with an
 * explicit IANA zone so the grid is right in Pago Pago the same as in PDT, including on
 * DST edges (a local day is 23 or 25 hours twice a year; Date arithmetic that ignores
 * that drops a cell).
 */

export interface MonthCursor {
  /** Four-digit year. */
  readonly year: number;
  /** 0-based month (Date convention: January = 0). */
  readonly month: number;
}

export interface DayCell {
  /** Local calendar key, `YYYY-MM-DD`, in the viewer's zone. */
  readonly key: string;
  readonly dayOfMonth: number;
  readonly inCurrentMonth: boolean;
  readonly isToday: boolean;
}

export interface DaySummary {
  /** Resolved catches (species known) landed that day. */
  readonly catches: number;
  /** Marks/catches still waiting on "what happened" — the amber flag, never hidden. */
  readonly needsDetails: number;
}

/** Monday-first, the way a fishing week actually runs into the weekend. */
export const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const CELLS = 42; // six weeks — deep enough that the grid never reflows month to month

/** Year/month/day in the given zone, via Intl. */
export function zonedParts(atMs: number, timeZone: string): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(atMs));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { y: Number(map.year), m: Number(map.month), d: Number(map.day) };
}

/** `YYYY-MM-DD` for the instant in the given zone — the day a catch belongs to. */
export function localDateKey(atMs: number, timeZone: string): string {
  const { y, m, d } = zonedParts(atMs, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** The zone's current month as a cursor. `nowMs` is explicit — the clock is the
 *  caller's job (render-purity rule), which keeps every function here pure. */
export function currentMonthCursor(timeZone: string, nowMs: number): MonthCursor {
  const { y, m } = zonedParts(nowMs, timeZone);
  return { year: y, month: m - 1 };
}

export function shiftMonth(cursor: MonthCursor, delta: number): MonthCursor {
  const total = cursor.year * 12 + cursor.month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

export function monthLabel(cursor: MonthCursor): string {
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long" }).format(
    new Date(cursor.year, cursor.month, 15),
  );
}

/**
 * The full week rows of one viewer-local month (5–6 rows; a wholly out-of-month row is
 * trimmed rather than rendered as dead grey cells). Cell dates are built with local-noon
 * Date values (never midnight) so a DST hour change inside a cell can never slide it
 * into the wrong day — noon survives the worst one-hour jump either way.
 */
export function monthCells(cursor: MonthCursor, timeZone: string, nowMs: number): readonly DayCell[] {
  const first = new Date(cursor.year, cursor.month, 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayKey = localDateKey(nowMs, timeZone);

  const all = Array.from({ length: CELLS }, (_, i) => {
    const cell = new Date(cursor.year, cursor.month, 1 - mondayOffset + i, 12);
    const key = `${cell.getFullYear()}-${pad(cell.getMonth() + 1)}-${pad(cell.getDate())}`;
    return {
      key,
      dayOfMonth: cell.getDate(),
      inCurrentMonth: cell.getMonth() === cursor.month,
      isToday: key === todayKey,
    };
  });
  let rows = CELLS / 7;
  while (rows > 1 && all.slice((rows - 1) * 7).every((cell) => !cell.inCurrentMonth)) rows -= 1;
  return all.slice(0, rows * 7);
}

/** Roll the store's catches into per-day counts. Deleted rows never reach the glass. */
export function summarizeDays(
  catches: readonly { caught_at: string; deleted_at: string | null; species_id: string | null; species_other: string | null }[],
  timeZone: string,
): ReadonlyMap<string, DaySummary> {
  const byDay = new Map<string, DaySummary>();
  for (const c of catches) {
    if (c.deleted_at !== null) continue;
    const at = Date.parse(c.caught_at);
    if (Number.isNaN(at)) continue; // a bad clock is not a day on the grid
    const key = localDateKey(at, timeZone);
    const needsDetails = c.species_id === null && c.species_other === null;
    const current = byDay.get(key) ?? { catches: 0, needsDetails: 0 };
    byDay.set(key, {
      catches: current.catches + (needsDetails ? 0 : 1),
      needsDetails: current.needsDetails + (needsDetails ? 1 : 0),
    });
  }
  return byDay;
}

/** Full spoken date + honest counts ("Tue, September 5 — 2 catches, 1 needs details"). */
export function ariaForKey(key: string, summary: DaySummary | undefined): string {
  const [y, m, d] = key.split("-").map(Number);
  const pretty = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d, 12));
  if (!summary || (summary.catches === 0 && summary.needsDetails === 0)) {
    return `${pretty} — no fishing logged`;
  }
  const parts: string[] = [];
  if (summary.catches > 0) parts.push(`${summary.catches} ${summary.catches === 1 ? "catch" : "catches"}`);
  if (summary.needsDetails > 0) parts.push(`${summary.needsDetails} needs details`);
  return `${pretty} — ${parts.join(", ")}`;
}

/** Strict `YYYY-MM-DD` that points at a real calendar day, or null. */
export function parseDayParam(raw: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const [, ys, ms, ds] = match;
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (y < 2000 || y > 2200) return null;
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() + 1 !== m || probe.getUTCDate() !== d) return null;
  return `${ys}-${ms}-${ds}`;
}

/** Strict key → the month its day page belongs to (for "view this month" links). */
export function monthCursorOfDayKey(key: string): MonthCursor {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m - 1 };
}
