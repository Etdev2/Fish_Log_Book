/**
 * Regenerate supabase/migrations/20260902120000_v2_norcal_and_freshwater_packs.sql from
 * the TypeScript bundles (bundle is authored through code review; SQL never drifts).
 *
 *   npx tsx scripts/gen-california-migrations.mts
 *
 * Same invariant as gen-florida-migration.mts: the bundle is the single source of
 * truth; migrations are append-only (20260902090000 is shipped and frozen).
 */
import { NORCAL } from "../src/features/fish-legal/norcal-pack";
import { CA_FRESHWATER } from "../src/features/fish-legal/california-freshwater-pack";
import type { RegBundle } from "../src/features/fish-legal/packs";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

function emit(bundle: RegBundle, waterClass: "salt" | "fresh"): string {
  let sql = `\ninsert into public.reg_pack (id, version, published_at, notes) values
  (${v(bundle.pack.id)}, ${bundle.pack.version}, ${v(bundle.pack.publishedAt)}, ${v(bundle.pack.notes)})
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
  sql += bundle.areas.map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, null, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  ).join(",");
  sql += `\non conflict (id) do nothing;`;

  if (bundle.groups.length > 0) {
    sql += `\n\ninsert into public.reg_group (id, name, member_species_ids, source_url, verified_at) values`;
    sql += bundle.groups
      .map(
        (g) =>
          `\n  (${v(g.id)}, ${v(g.name)}, ARRAY[${g.memberSpeciesIds.map((m) => v(m)).join(",")}]::text[], null, '2026-09-01')`,
      )
      .join(",");
    sql += `\non conflict (id) do nothing;`;
  }

  sql += `\n\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
  sql += bundle.rules.map(
    (r) =>
      `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, '${waterClass}', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${r.packVersion},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
  ).join(",");
  sql += ";\n";
  return sql;
}

const header = `-- California packs v2 (Fish Legal spec §3/§22 registry scaling): Northern CA
-- (Northern GMA groundfish + halibut/salmon) and statewide California freshwater
-- defaults. GENERATED deterministically from norcal-pack.ts + california-freshwater-pack.ts
-- — edit the bundle, run scripts/gen-california-migrations.mts, never hand-edit rows.
-- Water class is per-bundle (NorCal = salt, freshwater = fresh); reg_area.kind reuses
-- 'ocean_region' so the existing CHECK constraint stands untouched.
`;

const sql = header + emit(NORCAL, "salt") + "\n" + emit(CA_FRESHWATER, "fresh");
writeFileSync("supabase/migrations/20260902120000_v2_norcal_and_freshwater_packs.sql", sql);
console.log(
  `written ${sql.length} bytes; ${NORCAL.rules.length} NorCal rules + ${CA_FRESHWATER.rules.length} freshwater rules`,
);
