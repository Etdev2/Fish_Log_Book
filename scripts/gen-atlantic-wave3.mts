/**
 * Regenerate supabase/migrations/20260903050000_v1_atlantic_wave3_ct_nh_me.sql —
 * Atlantic wave 3: Connecticut, New Hampshire, Maine packs.
 *
 *   npx tsx scripts/gen-atlantic-wave3.mts
 */
import { CONNECTICUT } from "../src/features/fish-legal/connecticut-pack";
import { MAINE } from "../src/features/fish-legal/maine-pack";
import { NEW_HAMPSHIRE } from "../src/features/fish-legal/new-hampshire-pack";
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

const header = `-- Atlantic wave 3 (2026-09-03): Connecticut DEEP, New Hampshire F&G, Maine DMR
-- recreational saltwater tables. GENERATED via gen-atlantic-wave3.mts — edit bundles,
-- regenerate. Insert-only.
`;

const sql = header + emit(CONNECTICUT) + emit(NEW_HAMPSHIRE) + emit(MAINE);
writeFileSync("supabase/migrations/20260903050000_v1_atlantic_wave3_ct_nh_me.sql", sql);
const n = CONNECTICUT.rules.length + NEW_HAMPSHIRE.rules.length + MAINE.rules.length;
console.log(`written ${sql.length} bytes; ${n} rules across 3 packs`);
