import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { WATER_CLARITIES, WATER_COLORS } from "./vocabulary";

/*
 * Clarity and colour vocabularies exist twice: seeded server-side in the migrations and
 * mirrored here for offline use. The mirror is tested against the migrations rather
 * than trusted (core cannot reach features — ADR 003 §6 — so this half of the parity
 * contract lives beside the mirror).
 */

const migrationsDir = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));
const sql = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(join(migrationsDir, name), "utf8"))
  .join("\n");

function seededIds(table: string): Set<string> {
  const ids = new Set<string>();
  const inserts = sql.matchAll(new RegExp(`insert into public\\.${table}[\\s\\S]*?;`, "g"));
  for (const insert of inserts) {
    for (const row of insert[0].matchAll(/\(\s*'([a-z_]+)'/g)) ids.add(row[1]);
  }
  return ids;
}

describe("water clarity parity", () => {
  const seeded = seededIds("water_clarity");

  it("every clarity option is seeded in a migration, and every seed is mirrored", () => {
    const mirrored = new Set(WATER_CLARITIES.map((c) => c.id));
    expect(WATER_CLARITIES.filter((c) => !seeded.has(c.id)).map((c) => c.id)).toEqual([]);
    expect([...seeded].filter((id) => !mirrored.has(id))).toEqual([]);
  });

  it("includes milky (founder requirement 2026-09-01 §3)", () => {
    expect(WATER_CLARITIES.map((c) => c.id)).toContain("milky");
    expect(seeded.has("milky")).toBe(true);
  });

  it("clarity stays an ordered scale from clearest to worst", () => {
    expect(WATER_CLARITIES.map((c) => c.id)).toEqual([
      "gin_clear",
      "clear",
      "lightly_stained",
      "stained",
      "milky",
      "muddy",
    ]);
  });
});

describe("water colour parity", () => {
  it("colours mirror the seeds exactly", () => {
    const seeded = seededIds("water_color");
    const mirrored = new Set(WATER_COLORS.map((c) => c.id));
    expect(WATER_COLORS.filter((c) => !seeded.has(c.id)).map((c) => c.id)).toEqual([]);
    expect([...seeded].filter((id) => !mirrored.has(id))).toEqual([]);
  });
});
