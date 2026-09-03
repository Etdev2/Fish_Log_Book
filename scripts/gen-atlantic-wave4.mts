/**
 * Regenerate supabase/migrations/20260903060000_v1_atlantic_wave4_south.sql —
 * Atlantic wave 4: DE MD VA NC SC GA.
 *
 *   npx tsx scripts/gen-atlantic-wave4.mts
 */
import { DELAWARE } from "../src/features/fish-legal/delaware-pack";
import { GEORGIA } from "../src/features/fish-legal/georgia-pack";
import { MARYLAND } from "../src/features/fish-legal/maryland-pack";
import { NORTH_CAROLINA } from "../src/features/fish-legal/north-carolina-pack";
import { SOUTH_CAROLINA } from "../src/features/fish-legal/south-carolina-pack";
import { VIRGINIA } from "../src/features/fish-legal/virginia-pack";
import type { RegBundle } from "../src/features/fish-legal/packs";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

function emit(bundle: RegBundle): string {
  let sql = `\ninsert into public.reg_pack (id, version, published_at, notes) values
  (${v(bundle.pack.id)}, ${bundle.pack.version}, ${v(bundle.pack.publishedAt)}, ${v(bundle.pack.notes)})
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
  sql += bundle.areas
    .map(
      (a) =>
        `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
    )
    .join(",");
  sql += `\non conflict (id) do nothing;\n`;

  sql += `\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
  sql += bundle.rules
    .map(
      (r) =>
        `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${r.packVersion},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
    )
    .join(",");
  sql += ";\n";
  return sql;
}

const bundles = [DELAWARE, MARYLAND, VIRGINIA, NORTH_CAROLINA, SOUTH_CAROLINA, GEORGIA];
const header = `-- Atlantic wave 4 (2026-09-03): DE DNREC, MD DNR, VA MRC, NC DMF, SC DNR, GA CRD
-- GENERATED via gen-atlantic-wave4.mts. Insert-only.
`;
const sql = header + bundles.map(emit).join("");
writeFileSync("supabase/migrations/20260903060000_v1_atlantic_wave4_south.sql", sql);
const n = bundles.reduce((a, b) => a + b.rules.length, 0);
console.log(`written ${sql.length} bytes; ${n} rules across ${bundles.length} packs`);
