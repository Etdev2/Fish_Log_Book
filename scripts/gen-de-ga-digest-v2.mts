/**
 * Generate supabase/migrations/20260903150000_v2_de_ga_digest.sql
 *
 *   npx tsx scripts/gen-de-ga-digest-v2.mts
 */
import { writeFileSync } from "node:fs";

import { DELAWARE } from "../src/features/fish-legal/delaware-pack";
import { GEORGIA } from "../src/features/fish-legal/georgia-pack";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

type Bundle = typeof DELAWARE;

function emitBundle(b: Bundle): string {
  const areaIds = b.areas.map((a) => v(a.id)).join(", ");
  let sql = `\ndelete from public.reg_rule where reg_area_id in (${areaIds});\n`;
  sql += `insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
  sql += b.areas
    .map(
      (a) =>
        `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
    )
    .join(",");
  sql += `\non conflict (id) do update set name = excluded.name, notes = excluded.notes, source_url = excluded.source_url;\n`;
  sql += `\ninsert into public.reg_rule\n  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,\n   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)\nvalues`;
  sql += b.rules
    .map(
      (r) =>
        `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${b.pack.version},\n   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
    )
    .join(",");
  sql += `;\n\n`;
  sql += `insert into public.reg_pack (id, version, published_at, notes) values\n  (${v(b.pack.id)}, ${b.pack.version}, ${v(b.pack.publishedAt)}, ${v(b.pack.notes)})\non conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;\n`;
  return sql;
}

let sql = `-- DE / GA v2 (2026-09-03): DNREC cobia/Spanish/weakfish/bluefish + CRD pelagics/BSB/tripletail/snapper.\n-- GENERATED via gen-de-ga-digest-v2.mts. Replaces wave-4 rows for these areas.\n`;
sql += emitBundle(DELAWARE);
sql += emitBundle(GEORGIA);

writeFileSync("supabase/migrations/20260903150000_v2_de_ga_digest.sql", sql);
console.log(`written ${sql.length} bytes; DE ${DELAWARE.rules.length} GA ${GEORGIA.rules.length}`);
