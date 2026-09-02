/**
 * Regenerate supabase/migrations/20260902200000_v2_hi_regulated_areas.sql — Hawaii v2:
 * Regulated Fishing Areas layer (West Hawai'i RFMA + Miloli'i CBSFA + four MLCDs).
 * Insert-only; upsert the Hawaii pack row to version 2.
 *
 *   npx tsx scripts/gen-hi-rfa-v2.mts
 */
import { HAWAII } from "../src/features/fish-legal/hawaii-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;

const NEW_AREAS = [
  "hi-west-hawaii-rfma", "hi-milolii-cbsfa", "hi-kealakekua-mlcd",
  "hi-lapakahi-mlcd", "hi-oldkona-mlcd", "hi-waialea-mlcd",
];
const NEW_RULES = [
  "hi-westhawaii-rfma-doctrine", "hi-milolii-cbsfa-note", "hi-kealakekua-mlcd-note",
  "hi-lapakahi-mlcd-note", "hi-oldkona-mlcd-note", "hi-waialea-mlcd-note",
];

let sql = `-- Hawaii v2 (2026-09-02): DLNR Regulated Fishing Areas layer (verbatim).
-- GENERATED from the bundle via gen-hi-rfa-v2.mts. Insert-only + pack upsert.

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
sql += HAWAII.areas
  .filter((a) => NEW_AREAS.includes(a.id))
  .map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  )
  .join(",");
sql += `\non conflict (id) do nothing;\n`;

const rows = HAWAII.rules.filter((r) => NEW_RULES.includes(r.id));
sql += `\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
sql += rows
  .map(
    (r) =>
      `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${HAWAII.pack.version},
   null, null, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
  )
  .join(",");
sql += ";\n\n";

sql += `insert into public.reg_pack (id, version, published_at, notes) values
  (${v(HAWAII.pack.id)}, ${HAWAII.pack.version}, ${v(HAWAII.pack.publishedAt)}, ${v(HAWAII.pack.notes)})
on conflict (id) do update set version = excluded.version, notes = excluded.notes;
`;

writeFileSync("supabase/migrations/20260902200000_v2_hi_regulated_areas.sql", sql);
console.log(`written ${sql.length} bytes; ${rows.length}/${NEW_RULES.length} rules, ${NEW_AREAS.length} areas`);
if (rows.length !== NEW_RULES.length) process.exit(1);
