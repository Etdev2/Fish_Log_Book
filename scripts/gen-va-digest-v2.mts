/**
 * Regenerate supabase/migrations/20260903130000_v2_virginia_digest.sql —
 * VMRC recreational table digest + Chesapeake striped-bass seasons.
 *
 *   npx tsx scripts/gen-va-digest-v2.mts
 */
import { VIRGINIA } from "../src/features/fish-legal/virginia-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

let sql = `-- Virginia v2 (2026-09-03): VMRC recreational marine table digest + Bay striper
-- seasons. GENERATED via gen-va-digest-v2.mts. Insert-only + pack upsert to version 2.

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
sql += VIRGINIA.areas
  .map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  )
  .join(",");
sql += `\non conflict (id) do update set name = excluded.name, notes = excluded.notes, source_url = excluded.source_url;\n`;

sql += `\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
sql += VIRGINIA.rules
  .map(
    (r) =>
      `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${VIRGINIA.pack.version},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
  )
  .join(",");
sql += `;\n\n`;

sql += `insert into public.reg_pack (id, version, published_at, notes) values
  (${v(VIRGINIA.pack.id)}, ${VIRGINIA.pack.version}, ${v(VIRGINIA.pack.publishedAt)}, ${v(VIRGINIA.pack.notes)})
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;\n`;

writeFileSync("supabase/migrations/20260903130000_v2_virginia_digest.sql", sql);
console.log(`written ${sql.length} bytes; ${VIRGINIA.rules.length} rules, ${VIRGINIA.areas.length} areas`);
