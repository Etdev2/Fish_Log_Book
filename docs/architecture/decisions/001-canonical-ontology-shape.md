# 001 — The shape of the canonical ontology

**Date:** 2026-08-28 · **Status:** proposed (needs the founder's domain session)
**Implements:** D11, D13 · **Resolves:** O5 (draft) · **Detail:** `docs/architecture/ontology.md`

## Context

Custom fields cannot be pooled across users (D11). Pooling is the only escape from
per-user sample sizes of 50–100 (R1). So every field anglers genuinely care about has to
be canonical, or it leaves the poolable set permanently (R5). Separately, D13 asks one
system to serve two vocabularies — saltwater and bass — without collapsing into a
generic key/value soup.

## The call

1. **Trip is the unit of effort and the denominator.** Catch never exists without a
   Trip. Blank is derived (`count(catches) = 0`), never a stored flag. Trip carries
   `catch_log_confidence`, and only `complete` trips count toward a rate — that is what
   separates "caught nothing" from "stopped logging" (R2).
2. **ConditionSnapshot is a separate, immutable, repeatable entity**, not columns on
   Catch. `trip_id NOT NULL`, `catch_id NULL`, plus a `kind`. No polymorphic FK.
3. **One schema, two vocabularies.** Divergence lives in nullability and in
   `water_class`-scoped vocabulary tables, not in table structure. `water_class` is
   denormalised onto Trip and ConditionSnapshot so "not applicable" is derivable without
   a join and without a sentinel value.
4. **Two-level tackle.** The user's own lure (`tackle_item`, free text, not poolable)
   points at a canonical `lure_class` (poolable). The user names their gear once and
   every later catch inherits a poolable class for free.
5. **Custom-field exclusion is a Postgres permission, not a boolean.** Those tables live
   in a `private` schema with no `SELECT` grant to the role that runs cross-user
   analysis. The UI label explains it; the grant enforces it.
6. **Promotion reads definition metadata only, never values**, and is always an ADR plus
   a migration — never automatic.
7. **Full precision for the user, coarse cells for everything else.** Lat/lng to 5 dp
   plus `gps_accuracy_m`; generated `geo_cell_1km` (enrichment cache) and `geo_cell_10km`
   (the finest any cross-user aggregate may group by). Station IDs are location-bearing
   and never appear in pooled output.

## What it costs us

- ConditionSnapshot as its own table means a join on every catch view, and 3–5 snapshot
  rows per trip. At 100k catches that is fine; it is a deliberate write amplification.
- The two-level tackle model is one more tap the first time a user adds a lure.
- The `private` schema means the analysis layer cannot ever quietly "just check" a custom
  field. That is the point, but it will feel obstructive one day.
- Vocabulary tables instead of enums means seed data, an admin path, and a migration
  discipline that Postgres enums would have given us for free.

## Rejected

- **A wide `catches` table with condition columns inline.** Cannot represent trip-start
  or blank-trip conditions, which is the whole D2 value.
- **jsonb for custom values.** Kills numeric indexing at 100k rows.
- **Two schemas, one for salt and one for bass.** Doubles every query, every type, and
  every migration to serve a mode with zero users (D13 sequencing).
- **A `poolable = false` column.** A note-to-self that some future join forgets.
- **PostGIS in V1.** Not needed until radius search over spots exists; revisit then.
