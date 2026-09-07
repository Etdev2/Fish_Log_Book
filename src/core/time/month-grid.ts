/**
 * The month grid, as pure arithmetic: cursors, cells, and viewer-local day keys.
 *
 * This lived in `features/calendar/calendar-data.ts` and moved down here the moment a
 * second feature needed it — the tournament event calendar — which is exactly the trigger
 * ADR 005 §3 names ("if two features need the same thing it moves **down** into
 * `src/components/`, `src/core/`, or `src/lib/`, never sideways"). Nothing here knows a
 * catch from a tournament; it knows days.
 *
 * Two properties are load-bearing and easy to break:
 *
 * - **Every zone question goes through `Intl` with an explicit IANA zone.** A logbook and
 *   a tournament schedule are both dated by the viewer's calendar, and a local day is 23
 *   or 25 hours twice a year. Date arithmetic that ignores that drops a cell.
 * - **The clock is always a parameter, never read here.** `nowMs` is passed in by the
 *   caller, which is what keeps every function pure and every render reproducible.
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

/** `YYYY-MM-DD` for the instant in the given zone — the day a thing belongs to. */
export function localDateKey(atMs: number, timeZone: string): string {
  const { y, m, d } = zonedParts(atMs, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** The zone's current month as a cursor. `nowMs` is explicit — see the header. */
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

/** A spoken date for a day key — "Tue, September 5". Callers append their own counts. */
export function spokenDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d, 12));
}
