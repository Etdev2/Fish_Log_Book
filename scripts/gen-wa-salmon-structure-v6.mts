/**
 * Regenerate supabase/migrations/20260903010000_v6_wa_salmon_structure.sql —
 * Washington v6: promote the MA9/10/13 salmon headline notes to structured chinook
 * season rows (verbatim windows retained; wild/hatch release clauses in depthNote).
 * Insert-only; upsert the Washington pack row to version 6.
 *
 *   npx tsx scripts/gen-wa-salmon-structure-v6.mts
 */
import { WASHINGTON } from "../src/features/fish-legal/washington-pack";
import { writeFileSync } from "node:fs";

const esc = (s: string) => s.replaceAll("'", "''");
const v = (x: unknown): string =>
  x === null || x === undefined ? "null" : typeof x === "number" ? String(x) : `'${esc(String(x))}'`;
// Book-year MM-DD bounds → pinned 2026 dates to match existing rows.
const seasonDate = (md: string | null): string => (md ? `'2026-${md.length === 5 ? md : md.slice(5)}'` : "null");

const NEW_RULES = [
  "wa-ma9-chinook-opener", "wa-ma9-chinook-closed-summer",
  "wa-ma10-chinook-release-early", "wa-ma10-chinook-opener", "wa-ma10-chinook-release-late",
  "wa-ma10-salmon-closed-winter", "wa-ma10-chinook-spring",
  "wa-ma13-chinook-summer", "wa-ma13-chinook-winter",
];

let sql = `-- Washington v6 (2026-09-03): structured chinook season rows for Marine Areas
-- 9/10/13 — verbatim windows from the 2026-27 pamphlet tables; the v3 headline note
-- rows stay as the full verbatim of record (incl. sub-area pointer lists).
-- GENERATED via gen-wa-salmon-structure-v6.mts. Insert-only + pack upsert to 6.

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

writeFileSync("supabase/migrations/20260903010000_v6_wa_salmon_structure.sql", sql);
console.log(`written ${sql.length} bytes; ${rows.length} rules, 0 areas`);
