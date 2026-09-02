/**
 * Regenerate supabase/migrations/20260902220000_v4_wa_crab.sql — Washington v4:
 * Crab Rules page verbatim (WDFW 2026-27 book, page updated 2026-06-18).
 * Insert-only; upsert the Washington pack row to version 4.
 * Two appendix species inserts mirror src/core/ontology/species.ts additions.
 * Also repairs the v3 sound-pamphlet source_urls (merged as .../fishing/ma-N,
 * correct path is .../fishing/marine-area-N).
 *
 *   npx tsx scripts/gen-wa-crab-v4.mts
 */
import { WASHINGTON } from "../src/features/fish-legal/washington-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

const NEW_AREAS = ["wa-ps-crab", "wa-willapa-bay", "wa-columbia-river"];
const NEW_RULES = [
  "wa-ps-crab-core-note", "wa-ps-crab-season-note",
  "wa-ps-dungeness-bag", "wa-ps-redrock-bag", "wa-ps-tanner-bag",
  "wa-ps-greencrab-prohibited",
  "wa-ma13-crab-closed", "wa-ma13-redrock-closed", "wa-ma13-tanner-closed",
  "wa-ocean-dungeness-bag", "wa-ocean-redrock-bag", "wa-ocean-crab-pot-season",
  "wa-willapa-crab-pot-season", "wa-willapa-dungeness-bag", "wa-willapa-redrock-bag",
  "wa-col-crab-season", "wa-col-dungeness-bag", "wa-col-redrock-bag",
];

let sql = `-- Washington v4 (2026-09-02): Crab Rules page verbatim (WDFW 2026-27 book,
-- page updated 2026-06-18). GENERATED via gen-wa-crab-v4.mts.
-- Insert-only + pack upsert to 4. Species appendix mirrors ontology additions.
-- Also PATCHES the v3 Puget Sound pamphlet rows: source_url shipped as
-- .../fishing/ma-N; the live page path is .../fishing/marine-area-N.

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('red_rock_crab', 'Red rock crab', 'Cancer productus', false, null, 'salt', 'regulated', 490, false),
  ('tanner_crab', 'Tanner crab', 'Chionoecetes bairdi', false, null, 'salt', 'regulated', 491, false)
on conflict (id) do nothing;

update public.reg_rule
set source_url = 'https://www.eregulations.com/washington/fishing/marine-area-' || substring(reg_area_id from 'wa-ma-(\\d+)')
where reg_area_id in ('wa-ma-9', 'wa-ma-10', 'wa-ma-13')
  and source_url like 'https://www.eregulations.com/washington/fishing/ma-%';

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

writeFileSync("supabase/migrations/20260902220000_v4_wa_crab.sql", sql);
console.log(`written ${sql.length} bytes; ${rows.length} rules, ${NEW_AREAS.length} areas`);
