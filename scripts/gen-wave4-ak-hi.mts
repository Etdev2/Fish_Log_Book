/**
 * Regenerate supabase/migrations/20260902170000_v1_wave4_ak_hi_packs.sql — Wave 4:
 * Alaska Southeast (ADF&G Region 1 general saltwater) + Hawaii (DLNR DAR) v1 packs
 * plus the species rows the packs reference. Insert-only; ids new, nothing existing
 * touched.
 *
 *   npx tsx scripts/gen-wave4-ak-hi.mts
 */
import { ALASKA } from "../src/features/fish-legal/alaska-pack";
import { HAWAII } from "../src/features/fish-legal/hawaii-pack";
import { SPECIES } from "../src/core/ontology/species";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

const NEW_SPECIES = [
  "pink_salmon", "chum_salmon", "sockeye_salmon", "dolly_varden", "moi",
  "oio_bonefish", "awa", "aholehole", "uhu", "weke", "kole", "manini", "kala",
  "onaga", "opakapaka", "ehu", "hapuu",
];

let sql = `-- Wave 4 v1 (24-state expansion, 2026-09-02): Alaska Southeast (ADF&G) and Hawaii
-- (DLNR DAR) packs. GENERATED from the bundles via gen-wave4-ak-hi.mts.
-- Insert-only; older migrations are history and stay frozen.

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values`;
sql += SPECIES.filter((s) => NEW_SPECIES.includes(s.id))
  .map(
    (s) =>
      `\n  (${v(s.id)}, ${v(s.commonName)}, ${v(s.scientificName)}, ${s.isGroup}, ${v(s.rollsUpTo)}, ${v(s.waterClass)}, ${v(s.takeStatus)}, ${s.sortOrder}, false)`,
  )
  .join(",");
sql += `\non conflict (id) do nothing;\n`;

const emit = (bundle: typeof HAWAII) => {
  sql += `\ninsert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
  sql += bundle.areas
    .map(
      (a) =>
        `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
    )
    .join(",");
  sql += `\non conflict (id) do nothing;\n`;

  sql += `\ninsert into public.reg_group (id, name, member_species_ids, source_url, verified_at) values`;
  sql += bundle.groups
    .map(
      (g) =>
        `\n  (${v(g.id)}, ${v(g.name)}, ${v(JSON.stringify(g.memberSpeciesIds))}, ${v(bundle.areas[0].sourceUrl)}, ${v(VERIFIANT)})`,
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
        `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${bundle.pack.version},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
    )
    .join(",");
  sql += ";\n";

  sql += `\ninsert into public.reg_pack (id, version, published_at, notes) values
  (${v(bundle.pack.id)}, ${bundle.pack.version}, ${v(bundle.pack.publishedAt)}, ${v(bundle.pack.notes)})
on conflict (id) do update set version = excluded.version, notes = excluded.notes;\n`;
};

const VERIFIANT = "2026-09-02";

emit(ALASKA);
emit(HAWAII);

writeFileSync("supabase/migrations/20260902170000_v1_wave4_ak_hi_packs.sql", sql);
console.log(`written ${sql.length} bytes; ${NEW_SPECIES.length} species, ${ALASKA.rules.length} AK + ${HAWAII.rules.length} HI rules`);
