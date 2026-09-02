/**
 * Regenerate supabase/migrations/20260902130000_v2_states_wave1_gulf_baja.sql from the
 * six TypeScript bundles (TX, LA, MS, AL, MX-BC, MX-BCS). Bundle is authored truth; SQL
 * is generated. Append-only: never touches earlier migrations. Emits the shared Mexico
 * rules TWICE, one instance per area — matches the two packs' runtime behavior and the
 * founder's Baja/BCS split.
 *
 *   npx tsx scripts/gen-states-wave1.mts
 */
import { TEXAS } from "../src/features/fish-legal/texas-pack";
import { LOUISIANA } from "../src/features/fish-legal/louisiana-pack";
import { MISSISSIPPI } from "../src/features/fish-legal/mississippi-pack";
import { ALABAMA } from "../src/features/fish-legal/alabama-pack";
import { BAJA_CALIFORNIA } from "../src/features/fish-legal/baja-pack";
import { BAJA_CALIFORNIA_SUR } from "../src/features/fish-legal/bcs-pack";
import type { RegBundle } from "../src/features/fish-legal/packs";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

function emit(bundle: RegBundle, waterClass: "salt" | "fresh"): string {
  let sql = `\ninsert into public.reg_pack (id, version, published_at, notes) values
  (${v(bundle.pack.id)}, ${bundle.pack.version}, ${v(bundle.pack.publishedAt)}, ${v(bundle.pack.notes)})
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
  sql += bundle.areas.map(
    (a) =>
      `\n  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, null, null, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
  ).join(",");
  sql += `\non conflict (id) do nothing;`;

  if (bundle.groups.length > 0) {
    sql += `\n\ninsert into public.reg_group (id, name, member_species_ids, source_url, verified_at) values`;
    sql += bundle.groups
      .map((g) => `\n  (${v(g.id)}, ${v(g.name)}, ARRAY[${g.memberSpeciesIds.map((m) => v(m)).join(",")}]::text[], null, '2026-09-01')`)
      .join(",");
    sql += `\non conflict (id) do nothing;`;
  }

  sql += `\n\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
  sql += bundle.rules.map(
    (r) =>
      `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, '${waterClass}', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${r.packVersion},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
  ).join(",");
  sql += ";\n";
  return sql;
}

const header = `-- States expansion wave 1 (spec docs/specs/fish-legal-expansion.md, addendum
-- 2026-09-02): Gulf coast (TX/TPWD, LA/LDWF, MS/MDMR, AL/ADCNR) + Mexico (Baja
-- California, Baja California Sur — CONAPESCA NOM-017-PESC-1994, federal, so emitted
-- once per area). GENERATED deterministically from the six pack bundles via
-- scripts/gen-states-wave1.mts — edit bundles, regenerate; appendix species inserts
-- below mirror src/core/ontology/species.ts additions (puning guard in tests).
-- area.kind reuses 'ocean_region' — CHECK constraint untouched.

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('black_drum', 'Black drum', 'Pogonias cromis', false, null, 'salt', 'regulated', 437, false),
  ('tripletail', 'Tripletail', 'Lobotes surinamensis', false, null, 'salt', 'regulated', 438, false),
  ('gray_triggerfish', 'Gray triggerfish', 'Balistes capriscus', false, null, 'salt', 'regulated', 439, false),
  ('vermilion_snapper', 'Vermilion snapper (beeliner)', 'Rhomboplites aurorubens', false, null, 'salt', 'regulated', 440, false),
  ('lane_snapper', 'Lane snapper', 'Lutjanus synagris', false, null, 'salt', 'regulated', 441, false),
  ('mutton_snapper', 'Mutton snapper', 'Lutjanus analis', false, null, 'salt', 'regulated', 442, false),
  ('sand_seatrout', 'Sand seatrout (white trout)', 'Cynoscion arenarius', false, null, 'salt', 'open', 443, false)
on conflict (id) do nothing;
`;

const sql =
  header +
  emit(TEXAS, "salt") + "\n" +
  emit(LOUISIANA, "salt") + "\n" +
  emit(MISSISSIPPI, "salt") + "\n" +
  emit(ALABAMA, "salt") + "\n" +
  emit(BAJA_CALIFORNIA, "salt") + "\n" +
  emit(BAJA_CALIFORNIA_SUR, "salt");

writeFileSync("supabase/migrations/20260902130000_v2_states_wave1_gulf_baja.sql", sql);
const total = [TEXAS, LOUISIANA, MISSISSIPPI, ALABAMA, BAJA_CALIFORNIA, BAJA_CALIFORNIA_SUR]
  .reduce((n, b) => n + b.rules.length, 0);
console.log(`written ${sql.length} bytes; ${total} rules across 6 packs`);
