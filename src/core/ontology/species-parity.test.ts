import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SPECIES } from "./species";

/*
 * The vocabulary exists twice by design: seeded server-side in the migrations and
 * mirrored into TypeScript as the offline floor (the species picker must work with no
 * signal, spec §4). Twice means drift is possible, so the mirror is tested against the
 * migrations rather than trusted.
 */

const migrationsDir = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));
const sql = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(migrationsDir + name, "utf8"))
  .join("\n");

function seededIds(table: string): Set<string> {
  const ids = new Set<string>();
  // First column of every values row of an insert into this table, across migrations.
  const inserts = sql.matchAll(new RegExp(`insert into public\\.${table}[\\s\\S]*?;`, "g"));
  for (const insert of inserts) {
    for (const row of insert[0].matchAll(/\(\s*'([a-z_]+)'/g)) ids.add(row[1]);
  }
  return ids;
}

describe("species vocabulary parity", () => {
  const seeded = seededIds("species");

  it("every offline-floor species is seeded in a migration", () => {
    const missing = SPECIES.filter((s) => !seeded.has(s.id)).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it("every seeded species id exists in the offline floor", () => {
    const mirrored = new Set(SPECIES.map((s) => s.id));
    const missing = [...seeded].filter((id) => !mirrored.has(id));
    expect(missing).toEqual([]);
  });

  it("species ids are unique in the offline floor", () => {
    const ids = SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
