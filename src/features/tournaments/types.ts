/**
 * One tournament, as every screen in this section reads it.
 *
 * This shape used to be called `TournamentRecord` and live in `demo-store.ts`, which was
 * honest while the only tournaments were seeded ones on a phone. It stopped being honest
 * the moment `use-tournament.ts` and `queries/use-events.ts` started casting real Supabase
 * rows to it: the production data path was being typed as demo data, and a reader checking
 * whether a field was safe to use had to work out that "Demo" no longer meant demo.
 *
 * The name is the fix. The demo store produces `TournamentRecord`s; so does Supabase; the
 * screens do not know or care which they were handed.
 */
export interface TournamentRecord {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly visibility: string;
  readonly starts_at: string | null;
  readonly ends_at: string | null;

  /*
    The event's public face — added with the event calendar. Every one of these is nullable
    because a host creates a draft long before they know all of it, and a screen that
    demanded them would make an event impossible to start.
  */
  readonly location_name: string | null;
  readonly registration_closes_at: string | null;
  /** Base entry cost in minor units. Null means the host has not priced it — not free. */
  readonly entry_fee_minor: number | null;
  /** What the pot holds right now, in minor units. Null means not known here. */
  readonly prize_pool_minor: number | null;
  /** The host's own words on withdrawals and cancellations. Null means none published. */
  readonly refund_policy: string | null;
  readonly currency: string;
  readonly entrant_count: number;
  /** Whether the viewer runs this one. */
  readonly hosting: boolean;

  readonly organization_id: string;
  readonly active_rule_set_version_id: string | null;
  readonly active_scoring_version_id: string | null;
  readonly active_verification_policy_version_id: string | null;
  readonly active_boundary_version_id: string | null;
}

/*
  Two column lists, because there are two tables to read a tournament from and they do not
  hold the same columns.

  `tournament` is the real row, readable by members of the owning organisation.
  `public_tournament` is the projection everyone else reads: it carries the flyer — where,
  when, what it costs — and none of the internal version pointers. Asking the view for a
  column it does not have is not a soft failure; PostgREST rejects the request and the whole
  events list goes with it.

  Each is a single literal on purpose: supabase-js parses the string at the type level to
  shape the row it returns, and a concatenated expression is just `string` to it, which
  collapses the result type into an error type.
*/
export const TOURNAMENT_COLUMNS =
  "id,name,status,visibility,starts_at,ends_at,location_name,registration_closes_at,entry_fee_minor,currency,refund_policy,organization_id,active_rule_set_version_id,active_scoring_version_id,active_verification_policy_version_id,active_boundary_version_id";

export const PUBLIC_TOURNAMENT_COLUMNS =
  "id,name,status,visibility,starts_at,ends_at,location_name,registration_closes_at,entry_fee_minor,currency,refund_policy,organization_id";

/**
 * Narrow an unknown row into a `TournamentRecord`, filling what the row does not carry.
 *
 * Every screen used to do `data as TournamentRecord`, which is not a check — it is a
 * promise to the compiler that nobody verified. A row from PostgREST is network input: a
 * column renamed in a migration, a view that drops a field, or an RLS policy that hides one
 * all produce a row that satisfies the cast and then reads `undefined` three screens later,
 * where it renders as "NaN" or an empty card rather than as an error anybody can act on.
 *
 * The defaults are deliberate and each one is the safe direction:
 * - a missing name is an empty string, never "undefined";
 * - a missing fee or pot is `null` ("not known"), never `0` ("free"), because the
 *   difference is money;
 * - a missing currency is USD, matching the column's own default.
 */
export function toTournamentRecord(row: unknown, overrides: Partial<TournamentRecord> = {}): TournamentRecord {
  const source = (row ?? {}) as Record<string, unknown>;
  const text = (key: string): string | null => {
    const value = source[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };
  const wholeNumber = (key: string): number | null => {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    // PostgREST returns bigint columns as strings once they exceed a safe integer.
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return null;
  };

  return {
    id: text("id") ?? "",
    name: text("name") ?? "",
    status: text("status") ?? "DRAFT",
    visibility: text("visibility") ?? "PRIVATE",
    starts_at: text("starts_at"),
    ends_at: text("ends_at"),
    location_name: text("location_name"),
    registration_closes_at: text("registration_closes_at"),
    entry_fee_minor: wholeNumber("entry_fee_minor"),
    prize_pool_minor: wholeNumber("prize_pool_minor"),
    refund_policy: text("refund_policy"),
    currency: text("currency") ?? "USD",
    entrant_count: wholeNumber("entrant_count") ?? 0,
    hosting: source.hosting === true,
    organization_id: text("organization_id") ?? "",
    active_rule_set_version_id: text("active_rule_set_version_id"),
    active_scoring_version_id: text("active_scoring_version_id"),
    active_verification_policy_version_id: text("active_verification_policy_version_id"),
    active_boundary_version_id: text("active_boundary_version_id"),
    ...overrides,
  };
}
