import { isCountable } from "@/core/rules/catch/rules";
import type { CatchRecord, TripRecord } from "@/core/rules/catch/types";
import { localDateKey } from "@/core/time/month-grid";

/** A record that shows someone was on the water: not deleted, not a dismissed mis-tap. */
export function isOnTheWater(record: CatchRecord): boolean {
  return record.deleted_at === null && record.resolution_state !== "dismissed";
}

/**
 * The day an instant belongs to in the viewer's zone, as the calendar buckets it. Stored
 * `local_date` is the day where the record was made, which can differ after travel.
 */
function dayIn(at: string, zone: string): string | null {
  const ms = Date.parse(at);
  return Number.isNaN(ms) ? null : localDateKey(ms, zone);
}

/** Every day, in the viewer's zone, with a catch or trip on it. */
export function fishedDays(
  catches: readonly CatchRecord[],
  trips: readonly TripRecord[],
  zone: string,
): ReadonlySet<string> {
  const days = new Set<string>();
  for (const c of catches) {
    const day = isOnTheWater(c) ? dayIn(c.caught_at, zone) : null;
    if (day !== null) days.add(day);
  }
  for (const t of trips) {
    const day = t.deleted_at === null ? dayIn(t.started_at, zone) : null;
    if (day !== null) days.add(day);
  }
  return days;
}

/**
 * Fish landed in the month `monthPrefix` ("2026-10"), bucketed in the viewer's zone.
 * Only confirmed, landed fish count (D22): an open quick mark, a dismissed mis-tap or a
 * fish that got away is not a fish.
 */
export function fishInMonth(catches: readonly CatchRecord[], monthPrefix: string, zone: string): number {
  return catches
    .filter((c) => isCountable(c) && (dayIn(c.caught_at, zone) ?? "").startsWith(monthPrefix))
    .reduce((sum, c) => sum + (c.quantity ?? 1), 0);
}

export interface WeekDay {
  readonly key: string;
  readonly letter: string;
  readonly dayOfMonth: string;
  readonly spoken: string;
}

/**
 * Monday to Sunday around `todayKey`, built from calendar dates rather than by adding
 * 24-hour steps to an instant, so a daylight-saving change can't skip or repeat a day.
 * Each date is formatted at noon UTC, where it cannot slip into a neighbour.
 */
export function weekOf(todayKey: string): readonly WeekDay[] {
  const [y, m, d] = todayKey.split("-").map(Number);
  const today = Date.UTC(y, m - 1, d, 12);
  const mondayOffset = (new Date(today).getUTCDay() + 6) % 7;
  const format = (options: Intl.DateTimeFormatOptions, ms: number) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(ms);
  return Array.from({ length: 7 }, (_, i) => {
    const ms = Date.UTC(y, m - 1, d - mondayOffset + i, 12);
    return {
      key: new Date(ms).toISOString().slice(0, 10),
      letter: format({ weekday: "narrow" }, ms),
      dayOfMonth: format({ day: "numeric" }, ms),
      spoken: format({ weekday: "long", month: "long", day: "numeric" }, ms),
    };
  });
}
