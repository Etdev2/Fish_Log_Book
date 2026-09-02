/**
 * Regenerate supabase/migrations/20260903020000_v1_atlantic_wave_ma.sql —
 * Atlantic wave 1: Massachusetts pack (DMF saltwater table, updated 2026-04-28).
 * Deterministic from the TypeScript bundle; species appendix mirrors ontology.
 *
 *   npx tsx scripts/gen-atlantic-wave1.mts
 */
import { MASSACHUSETTS } from "../src/features/fish-legal/massachusetts-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

let sql = `-- Atlantic wave 1 (2026-09-03): Massachusetts first state. DMF recreational
-- saltwater table, page updated 2026-04-28. GENERATED via gen-atlantic-wave1.mts —
-- edit the bundle, regenerate. Species appendix mirrors src/core/ontology/species.ts.

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('scup', 'Scup (porgy)', 'Stenotomus chrysops', false, null, 'salt', 'regulated', 661, false),
  ('haddock', 'Haddock', 'Melanogrammus aeglefinus', false, null, 'salt', 'regulated', 662, false),
  ('winter_flounder', 'Winter flounder', 'Pseudopleuronectes americanus', false, null, 'salt', 'regulated', 663, false),
  ('yellowtail_flounder', 'Yellowtail flounder', 'Limanda ferruginea', false, null, 'salt', 'regulated', 664, false),
  ('american_plaice', 'American plaice (dab)', 'Hippoglossoides platessoides', false, null, 'salt', 'regulated', 665, false),
  ('witch_flounder', 'Witch flounder (grey sole)', 'Glyptocephalus cynoglossus', false, null, 'salt', 'regulated', 666, false),
  ('windowpane_flounder', 'Windowpane flounder', 'Scophthalmus aquosus', false, null, 'salt', 'protected', 667, false),
  ('ocean_pout', 'Ocean pout', 'Zoarces americanus', false, null, 'salt', 'protected', 668, false),
  ('atlantic_wolffish', 'Wolffish', 'Anarhichas lupus', false, null, 'salt', 'protected', 669, false),
  ('atlantic_halibut', 'Atlantic halibut', 'Hippoglossus hippoglossus', false, null, 'salt', 'regulated', 670, false),
  ('monkfish', 'Monkfish (goosefish)', 'Lophius americanus', false, null, 'salt', 'open', 671, false),
  ('acadian_redfish', 'Redfish (Acadian / ocean perch)', 'Sebastes fasciatus', false, null, 'salt', 'open', 672, false),
  ('atlantic_mackerel', 'Atlantic mackerel', 'Scomber scombrus', false, null, 'salt', 'regulated', 673, false),
  ('american_eel', 'American eel', 'Anguilla rostrata', false, null, 'salt', 'regulated', 674, false),
  ('white_perch', 'White perch', 'Morone americana', false, null, 'salt', 'regulated', 675, false),
  ('atlantic_bonito', 'Atlantic bonito', 'Sarda sarda', false, null, 'salt', 'regulated', 676, false),
  ('spiny_dogfish', 'Spiny dogfish', 'Squalus acanthias', false, null, 'salt', 'open', 677, false),
  ('american_shad', 'American shad', 'Alosa sapidissima', false, null, 'salt', 'regulated', 678, false),
  ('river_herring', 'River herring (alewife/blueback)', 'Alosa pseudoharengus / A. aestivalis', false, null, 'salt', 'protected', 679, false),
  ('rainbow_smelt', 'Rainbow smelt', 'Osmerus mordax', false, null, 'salt', 'regulated', 680, false)
on conflict (id) do nothing;

insert into public.reg_pack (id, version, published_at, notes) values
  (${v(MASSACHUSETTS.pack.id)}, ${MASSACHUSETTS.pack.version}, ${v(MASSACHUSETTS.pack.publishedAt)}, ${v(MASSACHUSETTS.pack.notes)})
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
sql += MASSACHUSETTS.areas
  .map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, ${a.polygon ? v(JSON.stringify(a.polygon)) : "null"}, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  )
  .join(",");
sql += "\non conflict (id) do nothing;\n";

sql += `\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
sql += MASSACHUSETTS.rules
  .map(
    (r) =>
      `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${r.packVersion},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
  )
  .join(",");
sql += ";\n";

writeFileSync("supabase/migrations/20260903020000_v1_atlantic_wave_ma.sql", sql);
console.log(`written ${sql.length} bytes; ${MASSACHUSETTS.rules.length} rules, ${MASSACHUSETTS.areas.length} areas`);
