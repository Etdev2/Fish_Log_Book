import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { PUBLIC_TOURNAMENT_COLUMNS, TOURNAMENT_COLUMNS, toTournamentRecord } from "./types";

/**
 * Narrowing a row from PostgREST, which is network input rather than something we wrote.
 *
 * Every screen used to do `data as TournamentRecord`. A cast is not a check — it is a
 * promise to the compiler that nobody verified — and the failures it hides are quiet ones:
 * a column renamed in a migration, a view that does not carry a field, or an RLS policy
 * that hides one all satisfy the cast and then surface three screens later as an empty card
 * or "NaN", with nothing in the logs.
 */
describe("toTournamentRecord", () => {
  it("keeps what the row has", () => {
    const record = toTournamentRecord({
      id: "t1",
      name: "Harbor Bay Shootout",
      status: "LIVE",
      visibility: "PUBLIC",
      starts_at: "2026-09-07T15:00:00Z",
      ends_at: null,
      location_name: "Dana Point Harbor",
      registration_closes_at: "2026-09-06T18:00:00Z",
      entry_fee_minor: 15000,
      currency: "USD",
      organization_id: "org1",
    });
    expect(record.name).toBe("Harbor Bay Shootout");
    expect(record.entry_fee_minor).toBe(15000);
    expect(record.location_name).toBe("Dana Point Harbor");
  });

  it("gives a missing price null, never zero — the difference is money", () => {
    // A view that does not carry `entry_fee_minor` must not turn every event free.
    const record = toTournamentRecord({ id: "t1", name: "X" });
    expect(record.entry_fee_minor).toBeNull();
    expect(record.prize_pool_minor).toBeNull();
  });

  it("keeps a real zero as zero, because free is a price", () => {
    expect(toTournamentRecord({ entry_fee_minor: 0 }).entry_fee_minor).toBe(0);
  });

  it("reads a bigint that arrived as a string", () => {
    // PostgREST sends bigint as a string once it exceeds a safe integer; `Number(...)` on
    // the whole row would otherwise leave a price that renders as text.
    expect(toTournamentRecord({ entry_fee_minor: "25000" }).entry_fee_minor).toBe(25000);
  });

  it("never produces undefined for a field a screen will render", () => {
    const record = toTournamentRecord(null);
    expect(record.name).toBe("");
    expect(record.currency).toBe("USD");
    expect(record.entrant_count).toBe(0);
    expect(record.hosting).toBe(false);
    for (const value of Object.values(record)) {
      expect(value).not.toBeUndefined();
    }
  });

  it("does not invent a status or a visibility that would widen access", () => {
    // A row with no visibility must read as the most private option, not the most public.
    const record = toTournamentRecord({});
    expect(record.status).toBe("DRAFT");
    expect(record.visibility).toBe("PRIVATE");
  });

  it("lets the caller override what the row cannot know", () => {
    const record = toTournamentRecord({ id: "t1" }, { hosting: true, entrant_count: 31 });
    expect(record.hosting).toBe(true);
    expect(record.entrant_count).toBe(31);
  });

  it("rejects a non-finite number rather than storing NaN as a fee", () => {
    expect(toTournamentRecord({ entry_fee_minor: Number.NaN }).entry_fee_minor).toBeNull();
    expect(toTournamentRecord({ entry_fee_minor: "not a number" }).entry_fee_minor).toBeNull();
  });
});

describe("column lists", () => {
  /**
   * The public projection genuinely has fewer columns than the table, and asking it for one
   * it does not have is not a soft failure — PostgREST rejects the request and the whole
   * events list goes with it. That bug shipped once already.
   */
  it("never asks the public view for a column it does not carry", () => {
    const internalOnly = ["active_rule_set_version_id", "active_scoring_version_id", "active_verification_policy_version_id", "active_boundary_version_id"];
    const publicColumns = PUBLIC_TOURNAMENT_COLUMNS.split(",");
    for (const column of internalOnly) {
      expect(TOURNAMENT_COLUMNS.split(",")).toContain(column);
      expect(publicColumns).not.toContain(column);
    }
  });

  it("still asks the public view for the three facts an event card shows", () => {
    for (const column of ["location_name", "entry_fee_minor", "registration_closes_at"]) {
      expect(PUBLIC_TOURNAMENT_COLUMNS.split(",")).toContain(column);
    }
  });

  it("has no spaces, which PostgREST would send as part of a column name", () => {
    expect(TOURNAMENT_COLUMNS).not.toMatch(/\s/);
    expect(PUBLIC_TOURNAMENT_COLUMNS).not.toMatch(/\s/);
  });
});

describe("the public view actually carries what the code asks it for", () => {
  /**
   * The bug this exists for shipped in the same change that added the column list: the code
   * asked `public_tournament` for `location_name`, `entry_fee_minor` and `currency`, and the
   * view selected none of them. PostgREST does not degrade on an unknown column — it rejects
   * the request — so the entire events list would have failed for every signed-in angler,
   * and nothing in the type system or the test suite would have said a word.
   *
   * Reads the migrations rather than a database, because there is no database in CI and the
   * mismatch is decidable from the SQL alone.
   */
  const viewColumns = (() => {
    const dir = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));
    const files = readdirSync(dir).filter((name) => name.endsWith(".sql")).sort();
    let latest: string | null = null;
    for (const file of files) {
      const sql = readFileSync(`${dir}${file}`, "utf8");
      const match = /create or replace view public\.public_tournament as([\s\S]*?);/i.exec(sql);
      // Later migrations replace earlier ones, so the last definition wins — same as the
      // database would resolve it.
      if (match) latest = match[1];
    }
    if (latest === null) return null;
    return [...latest.matchAll(/\bt\.([a-z_][a-z0-9_]*)/gi)].map((m) => m[1].toLowerCase());
  })();

  it("finds the view definition, so a moved directory cannot make this vacuous", () => {
    expect(viewColumns).not.toBeNull();
    expect(viewColumns).toContain("name");
  });

  it("selects every column PUBLIC_TOURNAMENT_COLUMNS asks for", () => {
    const missing = PUBLIC_TOURNAMENT_COLUMNS.split(",").filter(
      (column) => !(viewColumns ?? []).includes(column),
    );
    expect(
      missing,
      `public_tournament does not select these, and PostgREST rejects a request for a ` +
        `column a view does not have — which fails the whole events list rather than ` +
        `hiding one field: ${missing.join(", ")}`,
    ).toEqual([]);
  });
});
