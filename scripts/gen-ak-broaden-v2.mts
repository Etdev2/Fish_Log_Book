/**
 * Regenerate supabase/migrations/20260902190000_v2_ak_broaden.sql — Alaska broaden v2:
 * North Gulf Coast (Southcentral 2026) + Kodiak/Southwest (2026) saltwater tables.
 * Insert-only for new areas/rules; upsert the Alaska pack row to version 2.
 *
 *   npx tsx scripts/gen-ak-broaden-v2.mts
 */
import { ALASKA } from "../src/features/fish-legal/alaska-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

const NEW_AREAS = ["ak-ngc", "ak-res-bay", "ak-kodiak", "ak-kodiak-north-belt", "ak-kodiak-afognak-north"];
const NEW_RULES = [
  "akngc-general","akngc-halibut-season","akngc-halibut-jan-closed","akngc-kings-rb-fall1","akngc-kings-rb-fall2",
  "akngc-kings-rb-summer","akngc-kings-outside","akngc-salmon4-rb","akngc-salmon4-outside","akngc-steelhead-closed",
  "akngc-dolly","akngc-lingcod-rb-closed","akngc-lingcod-outside","akngc-lingcod-outside-closed","akngc-rockfish-eo",
  "akngc-yelloweye-spring-closed","akngc-sharks",
  "akk-general","akk-kings-eo","akk-kings-west-closed","akk-salmon4","akk-steelhead","akk-dolly",
  "akk-lingcod-season","akk-lingcod-closed-h1","akk-lingcod-afognak","akk-halibut","akk-rockfish-belt-eo",
  "akk-rockfish-afognak","akk-rockfish-remainder","akk-sable-shark-dogfish","akk-crabs",
];

let sql = `-- Alaska broaden v2 (2026-09-02): North Gulf Coast (2026 Southcentral book) and
-- Kodiak Island / Alaska Peninsula / Aleutian Islands salt water (2026 Southwest book).
-- GENERATED from the bundle via gen-ak-broaden-v2.mts. Insert-only + pack upsert.

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
sql += ALASKA.areas
  .filter((a) => NEW_AREAS.includes(a.id))
  .map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  )
  .join(",");
sql += `\non conflict (id) do nothing;\n`;

const rows = ALASKA.rules.filter((r) => NEW_RULES.includes(r.id));
sql += `\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
sql += rows
  .map(
    (r) =>
      `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${ALASKA.pack.version},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
  )
  .join(",");
sql += ";\n\n";

sql += `insert into public.reg_pack (id, version, published_at, notes) values
  (${v(ALASKA.pack.id)}, ${ALASKA.pack.version}, ${v(ALASKA.pack.publishedAt)}, ${v(ALASKA.pack.notes)})
on conflict (id) do update set version = excluded.version, notes = excluded.notes;
`;

writeFileSync("supabase/migrations/20260902190000_v2_ak_broaden.sql", sql);
console.log(`written ${sql.length} bytes; ${rows.length} rules / ${NEW_RULES.length} expected, ${NEW_AREAS.length} areas`);
if (rows.length !== NEW_RULES.length) process.exit(1);
