/**
 * Fish Log search and filters (spec §28, §29).
 *
 * Multi-token AND across every field an angler might reach for: species, gear, lure,
 * location, notes, tags. "bluefin streaker" finds the fish caught on that jig; "40 lb
 * fluoro" finds the leader. Each token must match somewhere, but not all in the same
 * field — that is what makes two-word searches feel like they read your mind rather
 * than returning nothing.
 *
 * Pure and index-free on purpose: at prototype volumes a linear scan over a filtered
 * page is faster than any structure we would have to keep in sync, and this is the
 * function a real index later has to agree with.
 */

import type { CatchGear, CatchRecord, Disposition } from "./types";

export interface SearchableCatch {
  readonly record: CatchRecord;
  readonly speciesName: string | null;
  readonly spotName: string | null;
  readonly gear: readonly CatchGear[];
}

function haystack(item: SearchableCatch): string {
  const { record } = item;
  return [
    item.speciesName ?? "",
    record.species_other ?? "",
    item.spotName ?? "",
    record.notes ?? "",
    record.presentation ?? "",
    record.platform ?? "",
    ...record.tags,
    ...item.gear.flatMap((g) => [g.label, g.detail ?? "", g.role.replace(/_/g, " ")]),
  ]
    .join(" ")
    .toLowerCase();
}

export function tokenize(query: string): readonly string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

export function matchesQuery(item: SearchableCatch, query: string): boolean {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  const text = haystack(item);
  return tokens.every((token) => text.includes(token));
}

export type LogView = "all" | "favorites" | "needs_details";

export interface CatchFilters {
  readonly query: string;
  readonly view: LogView;
  readonly speciesId: string | null;
  readonly spotId: string | null;
  readonly tripId: string | null;
  readonly disposition: Disposition | null;
  /** Inclusive local-date bounds, `YYYY-MM-DD`. */
  readonly fromDate: string | null;
  readonly toDate: string | null;
}

export const NO_FILTERS: CatchFilters = {
  query: "",
  view: "all",
  speciesId: null,
  spotId: null,
  tripId: null,
  disposition: null,
  fromDate: null,
  toDate: null,
};

export function filterCatches(
  items: readonly SearchableCatch[],
  filters: CatchFilters,
): readonly SearchableCatch[] {
  return items.filter(({ record, ...rest }) => {
    if (record.deleted_at !== null) return false;

    // `needs_details` is the D22 queue: marks a human has not yet said anything about.
    if (filters.view === "favorites" && !record.favorite) return false;
    if (filters.view === "needs_details" && record.resolution_state !== "unresolved") return false;

    if (filters.speciesId !== null && record.species_id !== filters.speciesId) return false;
    if (filters.spotId !== null && record.spot_id !== filters.spotId) return false;
    if (filters.tripId !== null && record.trip_id !== filters.tripId) return false;
    if (filters.disposition !== null && record.disposition !== filters.disposition) return false;
    if (filters.fromDate !== null && record.local_date < filters.fromDate) return false;
    if (filters.toDate !== null && record.local_date > filters.toDate) return false;

    return matchesQuery({ record, ...rest }, filters.query);
  });
}

/** Newest first. Ties break on the id, which is UUIDv7 and therefore mint-ordered. */
export function sortByMostRecent(
  items: readonly SearchableCatch[],
): readonly SearchableCatch[] {
  return [...items].sort((a, b) => {
    if (a.record.caught_at !== b.record.caught_at) {
      return a.record.caught_at < b.record.caught_at ? 1 : -1;
    }
    return a.record.id < b.record.id ? 1 : -1;
  });
}

/** Local date -> catches, newest day first. The shape the log and calendar both want. */
export function groupByLocalDate(
  items: readonly SearchableCatch[],
): readonly { date: string; items: readonly SearchableCatch[] }[] {
  const byDate = new Map<string, SearchableCatch[]>();
  for (const item of items) {
    const bucket = byDate.get(item.record.local_date);
    if (bucket) bucket.push(item);
    else byDate.set(item.record.local_date, [item]);
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, dayItems]) => ({ date, items: sortByMostRecent(dayItems) }));
}
