import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SOCAL } from "./reg-data";
import { FLORIDA } from "./florida-pack";
import { NORCAL } from "./norcal-pack";
import { CA_FRESHWATER } from "./california-freshwater-pack";
import { TEXAS } from "./texas-pack";
import { LOUISIANA } from "./louisiana-pack";
import { MISSISSIPPI } from "./mississippi-pack";
import { ALABAMA } from "./alabama-pack";
import { BAJA_CALIFORNIA } from "./baja-pack";
import { BAJA_CALIFORNIA_SUR } from "./bcs-pack";
import { MASSACHUSETTS } from "./massachusetts-pack";
import { RHODE_ISLAND } from "./rhode-island-pack";
import { NEW_YORK } from "./new-york-pack";
import { NEW_JERSEY } from "./new-jersey-pack";
import { CONNECTICUT } from "./connecticut-pack";
import { NEW_HAMPSHIRE } from "./new-hampshire-pack";
import { MAINE } from "./maine-pack";
import { DELAWARE } from "./delaware-pack";
import { MARYLAND } from "./maryland-pack";
import { VIRGINIA } from "./virginia-pack";
import { NORTH_CAROLINA } from "./north-carolina-pack";
import { SOUTH_CAROLINA } from "./south-carolina-pack";
import { GEORGIA } from "./georgia-pack";

const LATER_BUNDLES = [
  NORCAL, CA_FRESHWATER, TEXAS, LOUISIANA, MISSISSIPPI, ALABAMA,
  BAJA_CALIFORNIA, BAJA_CALIFORNIA_SUR,
  CONNECTICUT, NEW_HAMPSHIRE, MAINE,
  DELAWARE, MARYLAND, VIRGINIA, NORTH_CAROLINA, SOUTH_CAROLINA, GEORGIA,
];

/*
 * The regulations dataset exists twice by design: the SQL pack (server source of truth,
 * syncable) and this TypeScript bundle (the offline floor the app reads offshore).
 * Twice means drift is possible, so the bundle is tested against the migrations rather
 * than trusted — same discipline as the species vocabulary.
 */

const migrationsDir = fileURLToPath(new URL("../../../supabase/migrations/", import.meta.url));
const sql = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(migrationsDir + name, "utf8"))
  .join("\n")
  .replace(/''/g, "'"); // SQL string escaping, so sentence text compares equal

describe("pack ↔ migration parity (Fish Legal: both packs)", () => {
  // The four per-species zero-retention rows exist ONLY in the bundle for now: the SQL
  // side carries the single group-level §28.55 row. The bundle is the more precise form
  // (species-scoped prohibitions let the engine release exactly those four); a future
  // pack-v2 migration reconciles it (handoff noted in the PR).
  const BUNDLE_ONLY = new Set([
    "zero-yelloweye_rockfish",
    "zero-cowcod",
    "zero-bronzespotted_rockfish",
    "zero-quillback_rockfish",
  ]);

  it("every bundle rule's verbatim sentence exists in the migration (both packs)", () => {
    const missing = [...SOCAL.rules, ...FLORIDA.rules]
      .filter((r) => !BUNDLE_ONLY.has(r.id))
      .filter((r) => !sql.includes(r.verbatim));
    expect(missing.map((r) => r.id)).toEqual([]);
  });

  it("every Florida area + pack id exists in the migration", () => {
    for (const area of FLORIDA.areas) expect(sql).toContain(`'${area.id}'`);
    expect(sql).toContain(`'${FLORIDA.pack.id}', ${FLORIDA.pack.version}`);
  });

  it("every area id and name pair exists in the migration", () => {
    // Conservation-area geometry rows are bundle-only in v1: the SQL v1 schema keeps
    // boundary_geojson null until polygons ship as a pack-v2 migration (arch §3).
    const BUNDLE_ONLY_AREAS = new Set(["cca-santa-barbara", "cca-south", "mpa-pt-dume"]);
    for (const area of SOCAL.areas) {
      if (BUNDLE_ONLY_AREAS.has(area.id)) continue;
      expect(sql).toContain(`'${area.id}'`);
    }
  });

  it("every group id exists in the migration", () => {
    for (const group of SOCAL.groups) {
      expect(sql).toContain(`'${group.id}'`);
    }
  });

  it("bundle pack versions match the migration's reg_pack versions", () => {
    expect(sql).toContain(`'socal-2026-09-01', ${SOCAL.pack.version}`);
  });

  it("every later pack's rule verbatim sentence exists in its migration", () => {
    const missing = LATER_BUNDLES.flatMap((b) => b.rules).filter((r) => !sql.includes(r.verbatim));
    expect(missing.map((r) => r.id)).toEqual([]);
  });

  it("every later pack's area + pack ids exist in its migration", () => {
    for (const b of LATER_BUNDLES) {
      for (const a of b.areas) expect(sql).toContain(`'${a.id}'`);
      expect(sql).toContain(`'${b.pack.id}', ${b.pack.version}`);
    }
  });
});
