/**
 * Calendar month arithmetic, done entirely on `YYYY-MM-DD` strings.
 *
 * Every date column this reads against (`trip.local_date`, `catch.local_date`,
 * `journal_entry.entry_date`) is a Postgres `date`, deliberately: schema §2.1 puts a
 * trip on the day it *started*, so a 22:00 trip that lands a fish at 01:30 is one trip
 * on one day. Passing those through `Date` here would reintroduce exactly the UTC drift
 * the schema went to trouble to avoid — a day boundary crossed in the wrong timezone
 * silently moves a trip to the day before. So: strings in, strings out, no Date objects
 * anywhere in this module.
 */

export type IsoDate = string; // YYYY-MM-DD
export type IsoMonth = string; // YYYY-MM

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isIsoMonth(value: string): value is IsoMonth {
  return MONTH_RE.test(value);
}

function daysInMonth(year: number, month1: number): number {
  // month1 is 1-12. Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function parseMonth(month: IsoMonth): { year: number; month1: number } {
  const [y, m] = month.split("-");
  return { year: Number(y), month1: Number(m) };
}

export function monthLabel(month: IsoMonth): string {
  const { year, month1 } = parseMonth(month);
  const name = new Date(Date.UTC(year, month1 - 1, 1)).toLocaleString("en-US", {
    month: "long",
    timeZone: "UTC",
  });
  return `${name} ${year}`;
}

export function shiftMonth(month: IsoMonth, delta: number): IsoMonth {
  const { year, month1 } = parseMonth(month);
  const zero = year * 12 + (month1 - 1) + delta;
  const y = Math.floor(zero / 12);
  const m = (zero % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function monthBounds(month: IsoMonth): { first: IsoDate; last: IsoDate } {
  const { year, month1 } = parseMonth(month);
  const mm = String(month1).padStart(2, "0");
  return {
    first: `${year}-${mm}-01`,
    last: `${year}-${mm}-${String(daysInMonth(year, month1)).padStart(2, "0")}`,
  };
}

export type CalendarCell = {
  date: IsoDate | null; // null = leading/trailing blank, keeps the 7-column grid honest
  day: number | null;
};

/** Sunday-first grid, padded to whole weeks. */
export function monthGrid(month: IsoMonth): CalendarCell[] {
  const { year, month1 } = parseMonth(month);
  const total = daysInMonth(year, month1);
  const firstWeekday = new Date(Date.UTC(year, month1 - 1, 1)).getUTCDay();
  const mm = String(month1).padStart(2, "0");

  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push({ date: null, day: null });
  for (let d = 1; d <= total; d += 1) {
    cells.push({ date: `${year}-${mm}-${String(d).padStart(2, "0")}`, day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
  return cells;
}

/** Today as YYYY-MM-DD in the viewer's own timezone, not UTC. */
export function todayIso(now: Date = new Date()): IsoDate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
