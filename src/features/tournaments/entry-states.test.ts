import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ENTRY_STATE_TABLES } from "./format";

/**
 * The copy tables in `format.ts` are a second copy of the `check` constraints on
 * `public.tournament_entry`, and two copies of anything drift. This reads the constraint
 * out of the migration itself and fails when a state exists in the database that no screen
 * knows how to say out loud.
 *
 * It is deliberately a test rather than a tripwire: a new entry state is a normal thing for
 * the backend lane to add, and the right consequence is a failing test that says "give this
 * one a sentence", not a blocked commit.
 */

const MIGRATION = path.join(
  process.cwd(),
  "supabase/migrations/20260905190000_tournament_registration.sql",
);

/**
 * Scoped to the `tournament_entry` block first. `tournament_boat` lives in the same
 * migration and has its own `registration_status` with a different set of values
 * (`APPROVED` rather than `CONFIRMED`), so a file-wide search silently reads the boat's
 * constraint and reports the wrong answer — which is what it did on the first run.
 */
function entryTableSql(sql: string): string {
  const start = sql.indexOf("create table if not exists public.tournament_entry (");
  if (start === -1) throw new Error("tournament_entry table not found. Has the migration moved?");
  const end = sql.indexOf(");", start);
  return sql.slice(start, end);
}

function constraintValues(sql: string, column: string): string[] {
  const match = new RegExp(`${column} in \\(([^)]*)\\)`).exec(entryTableSql(sql));
  if (!match) throw new Error(`No check constraint found for ${column}. Has the migration moved?`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((value) => value[1]);
}

describe("entry state copy", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  for (const [column, table] of Object.entries(ENTRY_STATE_TABLES)) {
    describe(column, () => {
      const values = constraintValues(sql, column);

      it("covers every state the database can store", () => {
        const missing = values.filter((value) => !(value in table));
        expect(missing, `no copy for ${column}: ${missing.join(", ")}`).toEqual([]);
      });

      it("invents no state the database cannot store", () => {
        const extra = Object.keys(table).filter((key) => !values.includes(key));
        expect(extra, `${column} has copy for states that do not exist: ${extra.join(", ")}`).toEqual(
          [],
        );
      });

      it("says something useful about each one", () => {
        for (const [state, copy] of Object.entries(table)) {
          expect(copy.value, state).not.toMatch(/_/);
          expect(copy.hint.length, state).toBeGreaterThan(0);
        }
      });
    });
  }
});
