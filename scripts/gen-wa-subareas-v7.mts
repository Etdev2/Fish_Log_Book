/**
 * Regenerate supabase/migrations/20260903040000_v7_wa_subareas.sql —
 * remaining WDFW pamphlet Marine Areas 5, 6, 7, 8-1, 8-2, 11, 12.
 *
 *   npx tsx scripts/gen-wa-subareas-v7.mts
 */
import { WASHINGTON } from "../src/features/fish-legal/washington-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

const NEW_AREAS = ["wa-ma-5", "wa-ma-6", "wa-ma-7", "wa-ma-8-1", "wa-ma-8-2", "wa-ma-11", "wa-ma-12"];
const AREA_PREFIX = NEW_AREAS;

let sql = `-- Washington v7 (2026-09-03): remaining pamphlet Marine Areas 5, 6, 7, 8-1,
-- 8-2, 11, 12 (WDFW 2026-27 Sport Fishing Rules, updated 2026-06-18). GENERATED
-- via gen-wa-subareas-v7.mts. Insert-only + pack upsert to version 7.

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
sql += WASHINGTON.areas
  .filter((a) => NEW_AREAS.includes(a.id))
  .map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  )
  .join(",");
sql += `\non conflict (id) do nothing;\n`;

const rows = WASHINGTON.rules.filter((r) => AREA_PREFIX.some((id) => r.regAreaId === id));
sql += `\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
sql += rows
  .map(
    (r) =>
      `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${WASHINGTON.pack.version},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
  )
  .join(",");
sql += ";\n\n";

sql += `insert into public.reg_pack (id, version, published_at, notes) values
  (${v(WASHINGTON.pack.id)}, ${WASHINGTON.pack.version}, ${v(WASHINGTON.pack.publishedAt)}, ${v(WASHINGTON.pack.notes)})
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;\n`;

writeFileSync("supabase/migrations/20260903040000_v7_wa_subareas.sql", sql);
console.log(`written ${sql.length} bytes; ${rows.length} rules, ${NEW_AREAS.length} areas`);
