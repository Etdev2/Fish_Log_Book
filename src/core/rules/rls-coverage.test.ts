import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Every table in the public schema has row-level security. No exceptions, forever.
 *
 * This exists because the rule was already broken once and nothing noticed for three
 * days. `20260828120100_v1_rls.sql` covered every table that existed on 28 August and
 * ended with `revoke all on all tables in schema public from anon` — a statement that
 * only affects tables existing at the moment it runs. The regulation tables were created
 * on 1 September and inherited none of it.
 *
 * That is not a mistake somebody makes through carelessness; it is a mistake the shape of
 * the migration system invites, because the protection lives in one file and new tables
 * arrive in others. `catch_gear` and `location_condition` remembered. `reg_rule` did not.
 * The only durable fix is a test that reads the migrations and refuses to let the next one
 * forget.
 *
 * Static analysis of SQL text, deliberately. Running these migrations against a real
 * Postgres in CI would be a stronger check and is worth doing later; it is not a reason to
 * ship nothing today, and this catches the exact class of omission that occurred.
 */

const migrationsDir = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));

const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const sql = files.map((name) => readFileSync(migrationsDir + name, "utf8")).join("\n");

/** Tables the migrations create, in the public schema. */
function createdTables(text: string): readonly string[] {
  const found = new Set<string>();
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi;
  for (const m of text.matchAll(re)) found.add(m[1].toLowerCase());
  return [...found];
}

/**
 * Tables RLS is switched on for — both spellings.
 *
 * The original migration turns it on inside `do $$ … foreach t in array array[…]` loops
 * via `format()`, so a plain search for `alter table public.catch` finds nothing and would
 * report seventeen false failures. Any `do` block that mentions RLS has its array literals
 * harvested instead.
 */
function rlsEnabledTables(text: string): readonly string[] {
  const found = new Set<string>();

  for (const m of text.matchAll(
    /alter\s+table\s+(?:public\.)?([a-z_][a-z0-9_]*)\s+enable\s+row\s+level\s+security/gi,
  )) {
    found.add(m[1].toLowerCase());
  }

  for (const block of text.matchAll(/do\s+\$\$([\s\S]*?)\$\$\s*;/gi)) {
    const body = block[1];
    if (!/enable\s+row\s+level\s+security/i.test(body)) continue;
    for (const arr of body.matchAll(/array\s*\[([^\]]*)\]/gi)) {
      for (const name of arr[1].matchAll(/'([a-z_][a-z0-9_]*)'/gi)) {
        found.add(name[1].toLowerCase());
      }
    }
  }

  return [...found];
}

/**
 * Tables whose write verbs are revoked, harvested the same two ways as RLS above.
 *
 * Needed because the revokes also live inside `format()` loops, so a per-table literal
 * search finds nothing. An earlier version of this file asserted with a regex that had
 * `|'table_name'` as an alternation — which matched the table's own CREATE statement and
 * would have passed with every revoke deleted.
 */
function writeRevokedTables(text: string): readonly string[] {
  const found = new Set<string>();

  for (const m of text.matchAll(
    /revoke\s+[^;]*?\bon\s+(?:public\.)?([a-z_][a-z0-9_]*)\s+from\s+[^;]*;/gi,
  )) {
    found.add(m[1].toLowerCase());
  }

  for (const block of text.matchAll(/do\s+\$\$([\s\S]*?)\$\$\s*;/gi)) {
    const body = block[1];
    if (!/revoke\s+[^']*(insert|update|delete|all)/i.test(body)) continue;
    for (const arr of body.matchAll(/array\s*\[([^\]]*)\]/gi)) {
      for (const name of arr[1].matchAll(/'([a-z_][a-z0-9_]*)'/gi)) {
        found.add(name[1].toLowerCase());
      }
    }
  }

  return [...found];
}

describe("row-level security covers every table (ontology §6)", () => {
  const created = createdTables(sql);
  const protectedTables = new Set(rlsEnabledTables(sql));

  it("finds the migrations, so a moved directory cannot make this suite vacuous", () => {
    expect(files.length).toBeGreaterThan(5);
    expect(created.length).toBeGreaterThan(15);
  });

  it("parses the tables that are protected inside do-blocks, not just literal statements", () => {
    // `catch` is switched on through a format() loop. If the harvesting above regresses,
    // this fails loudly rather than the suite quietly passing everything.
    expect(protectedTables.has("catch")).toBe(true);
    expect(protectedTables.has("species")).toBe(true);
  });

  it("has row-level security on every table it creates", () => {
    const unprotected = created.filter((t) => !protectedTables.has(t)).sort();
    expect(
      unprotected,
      `These tables are created by a migration but never get RLS. A table without it is ` +
        `reachable through PostgREST with the anon key, which ships in every browser. Add ` +
        `RLS in the migration that creates the table — the blanket revoke in the 28 August ` +
        `migration does NOT cover tables created after it.`,
    ).toEqual([]);
  });

  it("keeps the regulation tables locked to read-only", () => {
    // Their content is what Fish Legal tells an angler the law is. Nobody writes it
    // through the API; rows arrive by migration.
    const revoked = new Set(writeRevokedTables(sql));
    for (const table of ["reg_area", "reg_group", "reg_pack", "reg_rule"]) {
      expect(protectedTables.has(table), `${table} has no RLS`).toBe(true);
      expect(revoked.has(table), `${table} never has its write verbs revoked`).toBe(true);
    }
  });

  it("revokes writes on every reference table, not only the regulation ones", () => {
    // The vocabularies are the same kind of data and the same rule applies to them.
    const revoked = new Set(writeRevokedTables(sql));
    for (const table of ["species", "lure_class", "bait_type", "water_color"]) {
      expect(revoked.has(table), `${table} never has its write verbs revoked`).toBe(true);
    }
  });
});
