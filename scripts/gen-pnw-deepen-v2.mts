/**
 * Regenerate supabase/migrations/20260902180000_v2_pnw_deepen.sql — PNW deepen v2:
 * Washington inside-waters/North-Coast doctrine + Oregon groundfish/shellfish additions.
 * Insert-only for new areas/rules/species; upsert both pack rows to version 2.
 *
 *   npx tsx scripts/gen-pnw-deepen-v2.mts
 */
import { OREGON } from "../src/features/fish-legal/oregon-pack";
import { WASHINGTON } from "../src/features/fish-legal/washington-pack";
import { SPECIES } from "../src/core/ontology/species";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

const NEW_SPECIES = ["dungeness_crab", "european_green_crab", "razor_clam"];
const WA_NEW_AREAS = ["wa-ma-5-13-inside", "wa-ma-5-10-halibut", "wa-yrca"];
const WA_NEW_RULES = [
  "wa14-flatfish-plus5", "wa34-20fm-restriction", "wa34c-yrca-closed", "wa34-wolfeel-closed",
  "wa-ma613-rockfish-prohibited", "wa-ma513-barbless", "wa-ps-halibut-season", "wa-ps-halibut-bag",
];
const OR_NEW_RULES = [
  "or-descender-30fm", "or-multispecies-halibut-longleader", "or-dungeness-rule",
  "or-sh-crab-license-note", "or-green-crab", "or-razor-clam-clatsop", "or-razor-first15",
];

let sql = `-- PNW deepen v2 (2026-09-02): Washington v2 (inside-waters doctrine, North Coast
-- 20-fm rule, yelloweye C-area) + Oregon v2 (groundfish combos, crab/clam shellfish).
-- GENERATED from the bundles via gen-pnw-deepen-v2.mts. Insert-only; upsert packs to v2.

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values`;
sql += SPECIES.filter((s) => NEW_SPECIES.includes(s.id))
  .map(
    (s) =>
      `\n  (${v(s.id)}, ${v(s.commonName)}, ${v(s.scientificName)}, ${s.isGroup}, ${v(s.rollsUpTo)}, ${v(s.waterClass)}, ${v(s.takeStatus)}, ${s.sortOrder}, false)`,
  )
  .join(",");
sql += `\non conflict (id) do nothing;\n`;

let sqlAreas = `\ninsert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
sqlAreas += WASHINGTON.areas
  .filter((a) => WA_NEW_AREAS.includes(a.id))
  .map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  )
  .join(",");
sqlAreas += `\non conflict (id) do nothing;\n`;
sql += sqlAreas;

const rulesFor = (bundle: typeof WASHINGTON, ids: string[]) => {
  const rows = bundle.rules.filter((r) => ids.includes(r.id));
  sql += `\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
  sql += rows
    .map(
      (r) =>
        `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${bundle.pack.version},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
    )
    .join(",");
  sql += ";\n";
};

rulesFor(WASHINGTON, WA_NEW_RULES);
rulesFor(OREGON, OR_NEW_RULES);

sql += `
insert into public.reg_pack (id, version, published_at, notes) values
  (${v(WASHINGTON.pack.id)}, ${WASHINGTON.pack.version}, ${v(WASHINGTON.pack.publishedAt)}, ${v(WASHINGTON.pack.notes)}),
  (${v(OREGON.pack.id)}, ${OREGON.pack.version}, ${v(OREGON.pack.publishedAt)}, ${v(OREGON.pack.notes)})
on conflict (id) do update set version = excluded.version, notes = excluded.notes;
`;

writeFileSync("supabase/migrations/20260902180000_v2_pnw_deepen.sql", sql);
console.log(`written ${sql.length} bytes; ${WA_NEW_RULES.length} WA + ${OR_NEW_RULES.length} OR rules, ${WA_NEW_AREAS.length} areas, ${NEW_SPECIES.length} species`);
