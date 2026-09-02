/**
 * Regenerate supabase/migrations/20260902140000_v2_gulf_baja_full_digest.sql from the
 * v2 bundles. Digest pass strategy: DELETE the prior wave-1 rows for the six areas,
 * then insert the bundles' current rule sets in full — deterministic and idempotent,
 * never editing shipped migrations (20260902130000 stays as-is for history).
 *
 *   npx tsx scripts/gen-gulf-digest-v2.mts
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

const AREA_IDS = [
  "tx-gulf", "la-gulf", "ms-gulf", "al-gulf", "mx-baja-california", "mx-baja-california-sur",
];

let sql = `-- Gulf + Baja FULL DIGEST pass (states expansion v2, 2026-09-02): TPWD 2026-27
-- Annual digest-completeness for Texas; LDWF 2025 booklet's complete saltwater tables
-- for Louisiana; MDMR's full catch-limits card for Mississippi; ADCNR's July 2025 creel
-- card for Alabama; NOM-017 digest rows (billfish rows per species, 4.7.2 freshwater
-- tier) for both Baja packs. Strategy: replace rows for the six areas (local-first log:
-- the tables are pack-served, not user-authored), then insert the bundles wholesale.
-- GENERATED deterministically via scripts/gen-gulf-digest-v2.mts — never hand-edit.

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('red_grouper', 'Red grouper', 'Epinephelus morio', false, null, 'salt', 'regulated', 444, false),
  ('black_grouper', 'Black grouper', 'Mycteroperca bonaci', false, null, 'salt', 'regulated', 445, false),
  ('scamp', 'Scamp', 'Mycteroperca phenax', false, null, 'salt', 'regulated', 446, false),
  ('warsaw_grouper', 'Warsaw grouper', 'Epinephelus nigritus', false, null, 'salt', 'regulated', 447, false),
  ('speckled_hind', 'Speckled hind (kitty mitchell)', 'Epinephelus drummondhayi', false, null, 'salt', 'regulated', 448, false),
  ('white_marlin', 'White marlin', 'Kajikia albida', false, null, 'salt', 'regulated', 449, false),
  ('swordfish', 'Swordfish', 'Xiphias gladius', false, null, 'salt', 'regulated', 450, false),
  ('bigeye_tuna', 'Bigeye tuna', 'Thunnus obesus', false, null, 'salt', 'regulated', 451, false),
  ('striped_mullet', 'Striped mullet', 'Mugil cephalus', false, null, 'salt', 'regulated', 452, false),
  ('almaco_jack', 'Almaco jack', 'Seriola rivoliana', false, null, 'salt', 'regulated', 453, false),
  ('lesser_amberjack', 'Lesser amberjack', 'Seriola fasciata', false, null, 'salt', 'regulated', 454, false),
  ('alligator_gar', 'Alligator gar', 'Atractosteus spatula', false, null, 'salt', 'regulated', 660, false)
on conflict (id) do nothing;

-- Replace, keyed by area (packs are served data, catches never point at reg_rule rows).
delete from public.reg_rule where reg_area_id in (${AREA_IDS.map((a) => `'${a}'`).join(", ")});
`;

function emitRules(bundle: RegBundle): string {
  let out = `\ninsert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values`;
  out += bundle.rules.map(
    (r) =>
      `\n  (${v(r.speciesId)}, ${v(r.regGroupId)}, ${v(r.regAreaId)}, 'salt', ${v(r.kind)}, ${v(r.verbatim)}, ${v(r.sourceUrl)}, ${v(r.sourceTitle)}, ${r.sourceUpdatedAt ? v(r.sourceUpdatedAt) : "null"}, ${v(r.verifiedAt)}, ${r.packVersion},
   ${seasonDate(r.seasonStart)}, ${seasonDate(r.seasonEnd)}, ${v(r.bagDaily)}, ${v(r.possessionLimit)}, ${v(r.minSizeIn)}, ${v(r.maxSizeIn)}, ${v(r.sizeMeasure)}, ${v(r.platformScope)}, ${v(r.depthNote)}, ${r.checkInseason}, ${r.staleAfterDays})`,
  ).join(",");
  return out + ";";
}

for (const b of [TEXAS, LOUISIANA, MISSISSIPPI, ALABAMA, BAJA_CALIFORNIA, BAJA_CALIFORNIA_SUR]) {
  sql += `\ninsert into public.reg_pack (id, version, published_at, notes) values (${v(b.pack.id)}, ${b.pack.version}, ${v(b.pack.publishedAt)}, ${v(b.pack.notes)})\non conflict (id) do update set version = excluded.version, notes = excluded.notes;\n`;
  sql += emitRules(b) + "\n";
}

writeFileSync("supabase/migrations/20260902140000_v2_gulf_baja_full_digest.sql", sql);
const total = [TEXAS, LOUISIANA, MISSISSIPPI, ALABAMA, BAJA_CALIFORNIA, BAJA_CALIFORNIA_SUR]
  .reduce((n, b) => n + b.rules.length, 0);
console.log(`written ${sql.length} bytes; ${total} rules in v2 (full digest)`);
