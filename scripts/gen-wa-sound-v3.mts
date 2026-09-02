/**
 * Regenerate supabase/migrations/20260902210000_v3_wa_puget_sound.sql — Washington v3:
 * Puget Sound pamphlet tables (Marine Areas 9/10/13, 2026-27 book) + salmon notes.
 * Insert-only; upsert the Washington pack row to version 3 (par with v1+v2 state).
 *
 *   npx tsx scripts/gen-wa-sound-v3.mts
 */
import { WASHINGTON } from "../src/features/fish-legal/washington-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

const NEW_AREAS = ["wa-ma-9", "wa-ma-10", "wa-ma-13"];
const NEW_RULES = [
  ...["wa-ma-9", "wa-ma-10", "wa-ma-13"].flatMap((a) => {
    const tag = a.replace("wa-", "");
    return [
      `${tag}-bottomfish-15`, `${tag}-lingcod-season`, `${tag}-lingcod-closed`, `${tag}-lingcod-closed2`,
      `${tag}-surfperch`, `${tag}-rockfish-closed`, `${tag}-cod-hake-wolfeel-closed`,
      `${tag}-sharks-closed`, `${tag}-cabezon`,
    ];
  }),
  "wa-ma9-salmon-note", "wa-ma10-salmon-note", "wa-ma13-salmon-note", "wa-ma13-halibut-closed",
];

let sql = `-- Washington v3 (2026-09-02): Puget Sound pamphlet tables — Marine Areas 9, 10, 13
-- (WDFW 2026-27 Sport Fishing Rules). GENERATED via gen-wa-sound-v3.mts.
-- Insert-only + pack upsert to version 3.

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
sql += WASHINGTON.areas
  .filter((a) => NEW_AREAS.includes(a.id))
  .map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  )
  .join(",");
sql += `\non conflict (id) do nothing;\n`;

const rows = WASHINGTON.rules.filter((r) => NEW_RULES.includes(r.id));
if (rows.length !== NEW_RULES.length) {
  console.error(`expected ${NEW_RULES.length} got ${rows.length}:`,
    NEW_RULES.filter((id) => !WASHINGTON.rules.some((r) => r.id === id)));
  process.exit(1);
}
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
on conflict (id) do update set version = excluded.version, notes = excluded.notes;
`;

writeFileSync("supabase/migrations/20260902210000_v3_wa_puget_sound.sql", sql);
console.log(`written ${sql.length} bytes; ${rows.length} rules, ${NEW_AREAS.length} areas`);
