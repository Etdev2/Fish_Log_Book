import { isCountable } from "@/core/rules/catch/rules";
import type { CatchRecord } from "@/core/rules/catch/types";

/** A record that shows someone was on the water: not deleted, not a dismissed mis-tap. */
export function isOnTheWater(record: CatchRecord): boolean {
  return record.deleted_at === null && record.resolution_state !== "dismissed";
}

/**
 * Fish landed in the month whose local dates start with `monthPrefix` ("2026-10").
 * Only confirmed, landed fish count (D22): an open quick mark, a dismissed mis-tap or a
 * fish that got away is not a fish.
 */
export function fishInMonth(catches: readonly CatchRecord[], monthPrefix: string): number {
  return catches
    .filter((c) => isCountable(c) && c.local_date.startsWith(monthPrefix))
    .reduce((sum, c) => sum + (c.quantity ?? 1), 0);
}
