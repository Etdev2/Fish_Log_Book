/**
 * Calendar data: the catch-shaped half of the month grid (founder requirements §7).
 *
 * The grid arithmetic itself now lives in `@/core/time/month-grid` — it moved down when
 * the tournament event calendar became its second caller, per ADR 005 §3's rule that a
 * shared thing goes down rather than sideways. What stays here is everything that knows
 * what a catch is: rolling the log into per-day counts, and saying a day out loud with
 * those counts in it.
 *
 * The grid pieces are re-exported rather than repointed at every call site. The calendar's
 * components and its tests import `monthCells` and friends from this module today; moving
 * the maths without moving the imports keeps that promotion to one file, and this module
 * stays the calendar's front door.
 *
 * The calendar is dated by the VIEWER's calendar (your days of fishing), not a tide
 * station's — the opposite of the tide chart, on purpose: a tide table is about a place;
 * a logbook is about a person.
 */

export {
  WEEKDAY_HEADERS,
  currentMonthCursor,
  localDateKey,
  monthCells,
  monthCursorOfDayKey,
  monthLabel,
  parseDayParam,
  shiftMonth,
  zonedParts,
  type DayCell,
  type MonthCursor,
} from "@/core/time/month-grid";

import { localDateKey, spokenDate } from "@/core/time/month-grid";

export interface DaySummary {
  /** Resolved catches (species known) landed that day. */
  readonly catches: number;
  /** Marks/catches still waiting on "what happened" — the amber flag, never hidden. */
  readonly needsDetails: number;
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
  const pretty = spokenDate(key);
  if (!summary || (summary.catches === 0 && summary.needsDetails === 0)) {
    return `${pretty} — no fishing logged`;
  }
  const parts: string[] = [];
  if (summary.catches > 0) parts.push(`${summary.catches} ${summary.catches === 1 ? "catch" : "catches"}`);
  if (summary.needsDetails > 0) parts.push(`${summary.needsDetails} needs details`);
  return `${pretty} — ${parts.join(", ")}`;
}
