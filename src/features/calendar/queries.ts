import { createClient } from "@/lib/supabase/server";
import { monthBounds, type IsoDate, type IsoMonth } from "./month";

/** What the calendar knows about a single day. */
export type DayMarks = {
  hasTrip: boolean;
  hasJournal: boolean;
  unresolvedCount: number; // D22 quick marks awaiting a human — "needs a look"
};

export type MonthData =
  | { status: "ok"; days: Map<IsoDate, DayMarks> }
  /**
   * The migrations in supabase/migrations/ have not been applied to this project.
   * Kept separate from "error" on purpose: it is the one failure with a known fix
   * (scripts/phase0-apply-schema.sh), and telling the angler "something went wrong"
   * when we know exactly what went wrong is the kind of dishonesty this product is
   * supposed to be against.
   */
  | { status: "schema-missing"; table: string }
  | { status: "error"; message: string };

const SCHEMA_MISSING = "PGRST205";

function emptyMarks(): DayMarks {
  return { hasTrip: false, hasJournal: false, unresolvedCount: 0 };
}

export async function fetchMonth(month: IsoMonth): Promise<MonthData> {
  const supabase = await createClient();
  const { first, last } = monthBounds(month);

  const [trips, journals, marks] = await Promise.all([
    supabase
      .from("trip")
      .select("local_date")
      .gte("local_date", first)
      .lte("local_date", last)
      .is("deleted_at", null),
    supabase
      .from("journal_entry")
      .select("entry_date")
      .gte("entry_date", first)
      .lte("entry_date", last)
      .is("deleted_at", null),
    supabase
      .from("catch")
      .select("local_date")
      .gte("local_date", first)
      .lte("local_date", last)
      .eq("resolution_state", "unresolved")
      .is("deleted_at", null),
  ]);

  for (const [table, res] of [
    ["trip", trips],
    ["journal_entry", journals],
    ["catch", marks],
  ] as const) {
    if (res.error) {
      if (res.error.code === SCHEMA_MISSING) return { status: "schema-missing", table };
      return { status: "error", message: res.error.message };
    }
  }

  const days = new Map<IsoDate, DayMarks>();
  const touch = (date: IsoDate): DayMarks => {
    const existing = days.get(date) ?? emptyMarks();
    days.set(date, existing);
    return existing;
  };

  for (const row of trips.data ?? []) touch(row.local_date as IsoDate).hasTrip = true;
  for (const row of journals.data ?? []) touch(row.entry_date as IsoDate).hasJournal = true;
  for (const row of marks.data ?? []) touch(row.local_date as IsoDate).unresolvedCount += 1;

  return { status: "ok", days };
}
