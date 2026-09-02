/**
 * Regenerate supabase/migrations/20260902150000_v2_ca_gma_layer.sql — California GMA
 * layer (founder callout: seasons × depth × management areas for all five CDFW GMAs).
 * NorCal pack v2 gains ca-gma-northern/mendocino/san-francisco/central areas + verbatim
 * season windows; SoCal v2 gains the GMA-crossing / transit / GEA doctrine rows.
 * Insert-only for new rows; upsert the two pack rows to v2. Never touches older
 * migrations.
 *
 *   npx tsx scripts/gen-ca-gma-layer.mts
 */
import { NORCAL, NC_GMA_RULES, NC_AREAS } from "../src/features/fish-legal/norcal-pack";
import { SOCAL } from "../src/features/fish-legal/reg-data";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

const GMA_AREA_IDS = ["ca-gma-northern", "ca-gma-mendocino", "ca-gma-san-francisco", "ca-gma-central"];
const SOCAL_NEW_IDS = ["gma-crossing-possession", "gma-transit-provision", "gea-eight-note"];

let sql = `-- California GMA layer v2 (Fish Legal: "break up California further" — seasons,
-- depth restrictions, GMAs). GENERATED from the bundles via gen-ca-gma-layer.mts.
-- kind 'groundfish_management_area' is an existing CHECK-allowed value; no schema work.

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
sql += NC_AREAS.filter((a) => GMA_AREA_IDS.includes(a.id))
  .map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, null, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  )
  .join(",");
sql += `\non conflict (id) do nothing;\n`;

const insertRules = (rows: readonly (typeof NC_GMA_RULES)[number][]) => {
  sql += `\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
  sql += rows
    .map(
      (r) =>
        `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, 2,
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
    )
    .join(",");
  sql += ";\n";
};

insertRules(NC_GMA_RULES);
insertRules(SOCAL.rules.filter((r) => SOCAL_NEW_IDS.includes(r.id)));

sql += `
insert into public.reg_pack (id, version, published_at, notes) values
  (${v(NORCAL.pack.id)}, ${NORCAL.pack.version}, ${v(NORCAL.pack.publishedAt)}, ${v(NORCAL.pack.notes)}),
  (${v(SOCAL.pack.id)}, ${SOCAL.pack.version}, ${v(SOCAL.pack.publishedAt)}, ${v(SOCAL.pack.notes)})
on conflict (id) do update set version = excluded.version, notes = excluded.notes;
`;

writeFileSync("supabase/migrations/20260902150000_v2_ca_gma_layer.sql", sql);
console.log(`written ${sql.length} bytes; ${NC_GMA_RULES.length} NC + ${SOCAL_NEW_IDS.length} SoCal rows, ${GMA_AREA_IDS.length} areas`);
