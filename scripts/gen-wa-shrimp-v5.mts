/**
 * Regenerate supabase/migrations/20260902230000_v5_wa_shrimp.sql — Washington v5:
 * Shrimp Rules page verbatim (WDFW 2026-27 book, page updated 2026-06-18).
 * Insert-only; upsert the Washington pack row to version 5.
 * Three appendix species inserts mirror src/core/ontology/species.ts additions.
 *
 *   npx tsx scripts/gen-wa-shrimp-v5.mts
 */
import { WASHINGTON } from "../src/features/fish-legal/washington-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
const seasonDate = (md: string | null): string => (md ? `'2026-${md}'` : "null");

const NEW_RULES = [
  "wa-ps-shrimp-spot-bag", "wa-ps-shrimp-gear-note", "wa-ps-shrimp-season-note",
  "wa-ps-spot-closed-2026",
  "wa-ma9-spotshrimp-closed", "wa-ma10-spotshrimp-closed", "wa-ma13-spotshrimp-closed",
  "wa-ocean-shrimp-bag", "wa-ocean-shrimp-season", "wa-ocean-spot-cap",
];

let sql = `-- Washington v5 (2026-09-02): Shrimp Rules page verbatim (WDFW 2026-27 book,
-- page updated 2026-06-18); no new areas — reuses wa-ma-5-13-inside, wa-ma-9/10/13,
-- and wa-ma-1-4-coastal. GENERATED via gen-wa-shrimp-v5.mts.
-- Insert-only + pack upsert to 5. Species appendix mirrors ontology additions.

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('spot_shrimp', 'Spot shrimp', 'Pandalus platyceros', false, null, 'salt', 'regulated', 492, false),
  ('coonstripe_shrimp', 'Coonstripe shrimp (dock/humpback)', 'Pandalus danae / P. hypsinotus', false, null, 'salt', 'regulated', 493, false),
  ('pink_shrimp', 'Pink shrimp', 'Pandalus eous / P. jordani', false, null, 'salt', 'regulated', 494, false)
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;

const rows = WASHINGTON.rules.filter((r) => NEW_RULES.includes(r.id));
if (rows.length !== NEW_RULES.length) {
  console.error(`expected ${NEW_RULES.length} got ${rows.length}:`,
    NEW_RULES.filter((id) => !WASHINGTON.rules.some((r) => r.id === id)));
  process.exit(1);
}
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

writeFileSync("supabase/migrations/20260902230000_v5_wa_shrimp.sql", sql);
console.log(`written ${sql.length} bytes; ${rows.length} rules, 0 areas`);
