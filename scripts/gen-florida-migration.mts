/**
 * Regenerate supabase/migrations/20260902090000_v1_fish_legal_expansion.sql from the
 * TypeScript bundle (bundle is authored through code review; SQL never drifts).
 *
 *   npx tsx scripts/gen-florida-migration.mts
 *
 * Identities: rule rows are uuid-keyed on the SQL side, so re-running prints the same
 * row set; the migration is intentionally run once per pack version bump. Parity of
 * verbatim sentences is test-guarded (reg-data-parity.test.ts) in BOTH directions.
 */
import { FLORIDA } from "../src/features/fish-legal/florida-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");
const areaParent = (id: string): string | null =>
  id === "fl-state-waters" ? null : "fl-state-waters";

let sql = `-- Fish Legal expansion (Phases 1+2+3, spec: docs/specs/fish-legal-expansion.md):
-- GENERATED deterministically from src/features/fish-legal/florida-pack.ts —
-- edit the bundle, run scripts/gen-florida-migration.mts, never hand-edit rows here.
-- Parity of verbatim sentences is test-guarded in BOTH directions (reg-data-parity).
-- Open question for the pack-v2 migration: species-scoped zero-retention rows and the
-- CCA/MPA geometry today only exist in the bundle (SQL v1 keeps boundary_geojson null).

alter table public.catch
  add column if not exists regulation_snapshot jsonb null;

comment on column public.catch.regulation_snapshot is
  'Fish Legal Phase 2 snapshot (spec §18): {pack_id, pack_version, jurisdiction_label, verdict, verdict_reason, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, evaluated_date} — the law as the card computed it at log time.';

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('florida_pompano', 'Florida Pompano', 'Trachinotus carolinus', false, null, 'salt', 'regulated', 429, false)
on conflict (id) do nothing;

insert into public.reg_pack (id, version, published_at, notes) values
  (${v(FLORIDA.pack.id)}, ${FLORIDA.pack.version}, ${v(FLORIDA.pack.publishedAt)}, ${v(FLORIDA.pack.notes)})
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values`;
sql += FLORIDA.areas.map(
  (a) => `
  (${v(a.id)}, ${v(a.authority)}, ${v(a.kind)}, ${v(a.name)}, ${v(areaParent(a.id))}, null, ${v(a.sourceUrl)}, ${v(a.verifiedAt)}, ${v(a.notes ?? null)})`,
).join(",");
sql += `
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
sql += FLORIDA.rules.map(
  (r) => `
  (${v(r.speciesId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${r.packVersion},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
).join(",");
sql += ";\n";

writeFileSync("supabase/migrations/20260902090000_v1_fish_legal_expansion.sql", sql);
console.log(`written ${sql.length} bytes; ${FLORIDA.rules.length} rules from bundle`);
