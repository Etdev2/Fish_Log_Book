# Data architecture expansion

**Status:** Proposed — architecture ruling required from `architect` before any migration
**Date:** 2026-09-15
**Governs:** schema for the whole expansion, storage tiering, ownership boundaries, sync, versioning
**Extends:** `docs/architecture/ontology.md`, `docs/architecture/tournament-domain-model.md`, ADR 004
**Audit:** `00-repository-audit.md` §4 (the two catch records), §6
**Phase:** 0 (§4 reconciliation) → 1 → 2

---

## 1. Problem statement

The repository holds 79 tables across two domains that were designed three months apart
and never joined. The personal domain (`catch`, `condition_snapshot`, `trip`, `trip_rig`)
is ontology-driven, privacy-aware and offline-first. The tournament domain
(`tournament_catch`, `catch_evidence`, and 40 more) is multi-tenant, immutable and
server-authoritative. **They describe the same fish and do not know it.**

On top of that, the expansion adds eleven new data families — environmental provenance,
taxonomy, AI results, biometric embeddings, equipment catalog, government organizations,
licences, consent, grants, research projects, aggregated geospatial datasets — and three of
them (embeddings, tiles, aggregates) are the kind of data that destroys a transactional
Postgres database if stored there.

This spec decides what lives where, what is immutable, what syncs, and what the API
boundary is.

---

## 2. Users and stakeholders

`architect` (owns the ruling), `head-dev` (implements), `biostat` (analytical store and
units), `counsel` (retention and grant enforcement at the schema level), the future Swift
client (must reproduce `core/` arithmetic exactly), agency and research consumers (API
stability), `git-integrator` (migration ordering).

---

## 3. Product goals

1. One catch, one identity, many roles.
2. Storage tier chosen by access pattern, not by convenience.
3. Provenance and version on every derived value.
4. Immutable where a record is evidence; editable where a record is a note.
5. Offline sync extends the existing outbox rather than growing a second protocol.
6. Every new table has an RLS policy the day it is created.

---

## 4. Non-goals

- Rewriting the tournament domain. ARCH-001 stands. §5 adds a link, not a replacement.
- Microservices. This is a Next.js app with Postgres. The "analytical store" in §8 is a
  separate database, not a separate team.
- A graph database, a vector database as primary storage, or a message bus in Phase 1.
- Multi-region active-active. Not a Phase-1 problem and pretending otherwise costs months.

---

## 5. The reconciliation: one catch, many roles

**This is the single most important change in the entire expansion.**

### 5.1 The rule

`public.catch` is the fact that a fish was caught. Everything else — a tournament claim, a
research submission, a regulatory report — is a **role** that fact plays, and is modelled
as a row that points at it.

```text
                    ┌──────────────────┐
                    │  public.catch    │  the fact. one row per fish.
                    │  (owner: angler) │
                    └────────┬─────────┘
          ┌──────────────────┼──────────────────┬──────────────────┐
          │                  │                  │                  │
  condition_snapshot   regulation_snapshot  tournament_catch   report_submission
  (enrichment)         (jsonb on catch)     (competition role) (agency role)
```

### 5.2 The migration

```sql
alter table public.tournament_catch
  add column catch_id uuid references public.catch(id) on delete restrict;

create unique index tournament_catch_one_per_event
  on public.tournament_catch (tournament_id, catch_id)
  where catch_id is not null;
```

Nullable, deliberately: a guest entrant with no Fish Log Book account has no `public.catch`
row and must still be able to compete. That is the honest reason for the null, and it is
the only one. For an entrant **with** an account, `catch_id` is required — enforced by a
trigger that reads the entry's identity, not by a blanket `not null` that would lock guests
out.

`on delete restrict`, not cascade: deleting a personal catch must not silently delete a
competitive result that a payout was computed from. The account-deletion job (privacy spec
§6.6) handles the conflict explicitly by severing the link and retaining the tournament
row, which is the behaviour the compliance boundary already requires.

### 5.3 What changes in behaviour

| Today | After |
|---|---|
| Angler logs a tournament fish twice | Logs once, in the normal flow, and taps *"Enter in Harbor Bay Shootout"* |
| Tournament catches carry no enrichment | Inherit `condition_snapshot` and `regulation_snapshot` from `public.catch` |
| Personal bests miss tournament fish | Complete |
| Effort statistics wrong by tournament volume | Correct, and tournament trips have the **best**-known effort denominator in the dataset |
| Two immutability models | Personal catch stays editable (founder: "existing catches ARE editable"); the **tournament claim stays immutable**, because the claim is evidence of what was submitted, not of what is true |

**Rule D1.** Editing a personal catch after it has been submitted to a tournament does
**not** alter the tournament claim. It writes a `catch_amendment` row (§7.3) which the
judge sees as a correction request. The immutability trigger on `tournament_catch` is
correct and stays.

---

## 6. Storage tiering — what lives where

The brief is explicit: *do not store every large scientific or map dataset inside the
transactional database.* Here is the ruling.

| Data | Store | Why |
|---|---|---|
| Catch, trip, rig, gear, snapshot, consent, grant, audit, tournament domain | **Transactional Postgres (Supabase)** | Row-level access control, small rows, RLS is the security model |
| The environmental values **at a catch** | **Snapshot column on `condition_snapshot`** | A catch's conditions are part of the catch forever. Re-querying a provider in 2031 for a 2026 fish is a different number. |
| Provider responses, verbatim | **Object storage, keyed by `(provider, dataset_version, cell_1km, hour)`** | Auditable, replayable, deduplicated across anglers fishing the same water |
| Tide/weather/SST grids, bathymetry, chlorophyll rasters | **Never in Postgres.** External API + object-store cache | GB–TB. Queried by cell+time, not by row |
| Regulation packs | **Postgres (`reg_*`) + compiled client packs** | Already the pattern; small, versioned, must work offline |
| Species taxonomy | **Postgres**, with external identifiers | Small, joined constantly |
| Photos, video | **Object storage** (Supabase Storage or S3), EXIF-stripped on ingest, content-hashed | Blocked on the founder's cost ruling — audit §5 |
| AI embeddings, biometric embeddings | **Dedicated vector index** (pgvector in a *separate* database, or a managed index) | High-dimensional, rebuilt on model change, must be deletable with its source |
| Map tiles | **Tile service / CDN**, pre-rendered from the analytical store | Never generated per request from Postgres |
| Aggregated cells, CPUE, time series | **Analytical store** (§8) | Full scans, no RLS, rebuilt not mutated |
| Audit log | **Postgres, partitioned by month, no update/delete policy** | Must be as durable as the data it protects |

**Rule D2.** Anything rebuilt from source on a schedule lives in the analytical store and
is never written to by the application. Anything the application writes lives in Postgres.
A table that is both is a bug.

---

## 7. Entities

Only the additions. Existing entities are as documented in `ontology.md` and ARCH-001.

### 7.1 Environmental provenance

```sql
environmental_observation (
  id uuid pk,
  snapshot_id uuid not null references condition_snapshot(id) on delete cascade,
  field_name text not null,             -- 'sst_c', 'wind_speed_ms', ...
  value_numeric numeric,
  value_text text,
  unit text not null,                   -- canonical SI, per core/units.ts
  provider_id text not null references environmental_provider(id),
  dataset_id text not null,
  dataset_version text not null,
  observation_kind text not null check (observation_kind in
    ('USER_MEASURED','SENSOR','SATELLITE','MODEL_ANALYSIS','MODEL_FORECAST','INTERPOLATED','CLIMATOLOGY')),
  observed_at timestamptz,              -- when the world was like this
  retrieved_at timestamptz not null,    -- when we asked
  spatial_resolution_m integer,
  temporal_resolution_s integer,
  distance_to_source_m integer,         -- station/grid-centre distance
  quality_flag text,                    -- provider's own flag, verbatim
  confidence numeric,                   -- 0..1, ours, and only where defensible
  algo_version integer not null,
  primary key (id),
  unique (snapshot_id, field_name, provider_id, dataset_version)
);

environmental_provider (
  id text pk, name text not null, licence text not null, licence_url text not null,
  attribution_required boolean not null, commercial_use_permitted boolean not null,
  redistribution_permitted boolean not null, terms_verified_at date not null
);
```

`observation_kind` is the brief's "clearly distinguish" requirement made structural. The
existing `provenance jsonb` column on `condition_snapshot` becomes a **denormalised
read-model** of these rows for the fast catch-detail render; `environmental_observation`
is the truth. One writer, one direction.

**Rule D3.** A field with no `environmental_observation` row is null and displays as
"not recorded". There is no path by which a value appears without provenance.

### 7.2 Species taxonomy

```sql
species_taxon (
  id text pk,                            -- our stable id, never reused
  rank text not null check (rank in ('SPECIES','SUBSPECIES','GENUS','FAMILY','GROUP')),
  scientific_name text, common_name text not null, parent_id text references species_taxon(id),
  worms_aphia_id integer, itis_tsn integer, fishbase_id integer, gbif_key integer,
  is_group boolean not null default false, water_class text,
  version integer not null, superseded_by text references species_taxon(id)
);
species_alias (taxon_id text, alias text, locale text, region_id text, kind text
  check (kind in ('COMMON','LOCAL','MISSPELLING','OBSOLETE_SCIENTIFIC')));
```

The existing flat `species` table becomes a view over this for compatibility. Taxonomy
**changes** — a split or a merge writes a new version and sets `superseded_by`; it never
rewrites a historic catch's `species_id`. A 2026 catch keeps the name it was logged under
plus a resolvable pointer to today's accepted taxon.

### 7.3 Amendments

```sql
catch_amendment (
  id uuid pk, catch_id uuid not null references catch(id) on delete cascade,
  field_name text not null, old_value jsonb, new_value jsonb,
  reason text not null, amended_by uuid not null, amended_at timestamptz not null default now(),
  source text not null check (source in ('ANGLER','JUDGE','AI_CORRECTION','EXPERT_REVIEW','IMPORT_FIX')),
  affects_tournament_claim boolean not null default false,
  review_status text check (review_status in ('NOT_REQUIRED','PENDING','ACCEPTED','REJECTED'))
);
```

Every correction to a catch that has left the angler's device is an amendment, not an
overwrite. This is how the brief's "corrections through an auditable amendment process"
is satisfied without making the personal log immutable — which would break the founder's
explicit ruling that existing catches are editable.

### 7.4 The rest, by reference

| Family | Table(s) | Spec |
|---|---|---|
| AI identification | `ai_identification_run`, `ai_identification_candidate`, `ai_model_version` | `ai-fish-identification.md` §8 |
| Biometrics | `fish_biometric_profile`, `biometric_observation`, `recapture_candidate`, `recapture_confirmation` | `fish-biometric-reidentification.md` §8 |
| Equipment catalog | `product_manufacturer`, `product_family`, `product_model`, `product_variant`, `product_spec_snapshot` | `equipment-product-catalog.md` §8 |
| Government | `government_organization`, `agency_program`, `license_link`, `report_submission` | `government-fisheries-partnership.md` §8 |
| Consent & access | `consent_record`, `data_access_grant`, `location_access_audit`, `research_project`, `species_location_policy` | `privacy-consent-and-data-governance.md` §8 |
| Aggregates | `agg_catch_cell_period`, `agg_effort_cell_period`, `agg_species_cell_period` | §8 below |

---

## 8. The analytical store

**Not** a second application database. A read-only, rebuilt-on-schedule store fed from
Postgres by a batch job.

```text
Postgres (truth)  --nightly/hourly ETL-->  analytical store  --> tiles, dashboards, exports
```

Phase 2 recommendation: **Postgres with `timescaledb` or plain partitioned tables in a
separate Supabase project**, not a warehouse. Reasons: the team is small, the data at
pilot scale is millions of rows not billions, and the ETL is a handful of `insert ...
select` statements. Move to DuckDB/Parquet-on-object-store or BigQuery only when a
measured query exceeds the budget — `cfo` holds that trigger, not engineering taste.

Aggregate grain:

```sql
agg_catch_cell_period (
  cell_id text, cell_level text,          -- CELL_10KM | CELL_50KM
  period_start date, period_grain text,   -- DAY | WEEK | MONTH | SEASON | YEAR
  species_id text, water_class text,
  catch_count integer, angler_count integer, trip_count integer,
  dominance_ratio numeric,                -- max single-angler share; feeds the k-gate
  kept_count integer, released_count integer,
  length_mm_p50 integer, length_mm_p90 integer, weight_g_p50 integer,
  sst_c_p50 numeric, tide_state_mode text, moon_phase_bin text,
  suppressed boolean not null,            -- computed by core/privacy/k-anonymity
  suppression_reason text,
  built_at timestamptz not null, build_version integer not null
);
```

**Rule D4.** `suppressed` is computed **at build time**, and suppressed rows are written
with their counts nulled — not filtered out. A missing row and a suppressed row are
different facts, and a map that cannot tell them apart will render "no fish here" over a
place that is simply private.

Effort is its own table because its denominator is different and harder:

```sql
agg_effort_cell_period (
  cell_id, cell_level, period_start, period_grain,
  angler_hours numeric,                   -- null when not derivable
  trip_count integer, angler_count integer,
  effort_quality text check (effort_quality in ('MEASURED','INFERRED','UNKNOWN')),
  unresolved_mark_trips integer,          -- D27: these trips are excluded from rates
  suppressed boolean
);
```

**Rule D5.** CPUE is published only where `effort_quality = 'MEASURED'` and the trip had
no unresolved marks (`SPEC.md` D27). Everywhere else the map shows catch counts and says
so. This is the difference between a dataset a fisheries scientist will use and one they
will not.

---

## 9. API boundaries

```text
/api/catches/*        owner-scoped, RLS-backed              (exists via PostgREST)
/api/enrichment/*     service-role, internal, cell-rounded  (new, Phase 1)
/api/aggregates/*     grant-gated, k-gated, read-only       (new, Phase 2)
/api/exports/*        grant-gated, async, manifested        (new, Phase 2)
/api/agency/*         organization-scoped, audited          (new, Phase 4)
/api/catalog/*        public read, admin write              (new, Phase 1)
```

Rules:

1. **No cross-boundary joins in the client.** A screen that needs catch + aggregate makes
   two calls; the aggregate call cannot see the catch.
2. **Every list endpoint is cursor-paginated** on `(updated_at, id)`, matching the existing
   sync indexes (`idx_catch_angler_updated`).
3. **Every mutating endpoint takes an idempotency key.** The tournament domain already
   does this with `client_generated_id`; the personal domain does it with uuidv7 primary
   keys minted on the client. Do not add a third mechanism.
4. **Versioned by path** (`/api/v1/`) for anything an agency or researcher consumes.
   Internal endpoints are not versioned and are not documented externally.
5. **Agency and research endpoints are read-only** in Phases 2–4. A write path from outside
   is a much larger security surface and nothing in the brief requires it yet.

---

## 10. Offline sync and conflicts

Extends ADR 004; does not replace it.

| Entity | Syncs? | Notes |
|---|---|---|
| `catch`, `catch_gear`, `condition_snapshot`, `trip`, `trip_rig`, `location_condition` | Yes, existing outbox | unchanged |
| `catch_amendment` | Yes, insert-only | |
| `consent_record` | **No.** Online only (privacy §10) | withdrawal patches are queued |
| `tournament_catch`, `catch_evidence` | Yes, via the existing tournament ingest with `client_generated_id` | must now also carry `catch_id` |
| `environmental_observation` | **No.** Server-written only | the device has no provider access |
| Catalog reads | Cached, read-only | versioned bundle, like regulation packs |
| Embeddings | No | server-side, derived |

Conflict rules, unchanged in spirit:

- **Insert with an existing primary key = done, not error** (ADR 004 §4).
- **Same client id, identical payload = idempotent replay. Same id, different payload =
  explicit conflict, never an overwrite** (`core/tournaments/catch-sync.ts`, already
  implemented and tested). Reuse it verbatim for the personal domain rather than writing a
  second reconciler.
- **Patch carries changed fields only.**
- A rejected mutation is surfaced, never silently dropped.

**New rule D6.** Enrichment is never a conflict. The device owns the *facts of the catch*;
the server owns the *environment around it*. The enrichment worker writes only snapshot
fields the device never writes, so the two can never collide. The field split is enforced
by a column allow-list in the worker, tested.

---

## 11. Immutability matrix

| Record | Mutable? | Enforcement |
|---|---|---|
| `catch` | Yes (founder ruling), with `catch_amendment` trail once submitted anywhere | trigger writes the amendment |
| `condition_snapshot` astronomical fields | No, after first write | already computed on device, deterministic |
| `condition_snapshot` enriched fields | Append-only via `environmental_observation`; the denormalised columns are a rebuildable projection | worker-only write |
| `regulation_snapshot` jsonb | **No** | the law as of the catch; rewriting it is falsifying history |
| `tournament_catch` factual claim | **No** | existing trigger, keep |
| `catch_evidence` original | **No** | existing trigger, keep |
| `consent_record` | No, except `withdrawn_at` | new trigger |
| `location_access_audit` | No | no update/delete policy for any role |
| `data_access_grant` | Status transitions only | check constraint on the transition |
| `product_spec_snapshot` on saved gear | **No** | the spec as it was when the angler chose it |
| Aggregates | Rebuilt wholesale, never updated in place | build_version |

---

## 12. Geospatial indexing

- Keep `geo_cell_1km` / `geo_cell_10km` as generated columns. Add `geo_cell_50km`.
- **Do not adopt PostGIS in Phase 1 for the personal domain.** The cells answer every
  Phase-1 query and a b-tree on a text cell is faster and simpler than a GiST index at this
  scale. The existing `src/features/fish-legal/geospatial.ts` (point-in-ring,
  distance-to-line) already serves boundary checks on device.
- **Do adopt PostGIS in the analytical store** in Phase 2, where polygon intersection
  against marine zones, MPAs and regulatory areas is the actual workload.
- Cells are strings of the form `floor(lat*N)_floor(lng*N)`. They are **not** valid across
  the antimeridian or at the poles. Documented limitation; a Phase-5 international
  expansion replaces them with H3 or S2, which is a migration with a clear trigger rather
  than a speculative dependency now.

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| Guest tournament entrant, no account | `tournament_catch.catch_id` null; enrichment unavailable; the leaderboard says nothing about it |
| Angler deletes a catch that is a tournament claim | Link severed, tournament row retained, `catch_amendment` records the severance |
| Species split in taxonomy after 10,000 catches logged | New taxon version; old id resolves via `superseded_by`; historical rows untouched; aggregates rebuilt under both labels with a mapping note |
| Two devices log the same fish | uuidv7 differs, so two rows. Detected by a duplicate heuristic (same angler, < 90 s, < 50 m) and offered as a merge, never auto-merged |
| Enrichment provider changes its dataset version mid-backfill | New `environmental_observation` rows; old ones retained; the denormalised projection takes the highest-confidence current version |
| Catch with no GPS | Enrichment attempts region-level only, marks `INTERPOLATED`, or returns `unavailable` — never silently uses the trip's spot |
| Clock skew on device | `caught_at` vs `client_created_at` constraint already exists (12 h live window). Tournament domain has its own trust model (ARCH-001 §16). Do not add a third. |
| Analytical rebuild fails halfway | Build is atomic by `build_version`; readers see the previous version until a build completes |

---

## 14. Failure states

- **Enrichment worker down** → snapshots stay `pending`, indefinitely and visibly. There is
  a queue depth metric and an alert. Today this failure is invisible because there is no
  worker at all.
- **Provider returns 4xx for a location** → `unavailable`, terminal, stop retrying
  (existing schema comment already specifies this).
- **Provider returns 5xx** → `pending`, exponential backoff, cap at 10 attempts then
  `failed`, which is retried by a weekly sweep, not by the hot loop.
- **Analytical store unreachable** → map and dashboards show a loading/error state; the
  personal app is unaffected. The two must not share a failure domain.
- **Vector index unreachable** → AI ID and biometrics degrade to unavailable with an
  explicit message; logging never blocks.
- **Migration ordering conflict** → `scripts/check-migration-versions.mjs` already guards
  this; new migrations follow the existing timestamp convention.

---

## 15. Analytics and success metrics

| Metric | Target |
|---|---|
| Tournament catches with a non-null `catch_id` (accounted entrants) | > 95 % within one season |
| Snapshots reaching `complete` or `partial` within 15 min of sync | > 95 % |
| Snapshots stuck `pending` > 24 h | < 1 % |
| `environmental_observation` rows with a null `dataset_version` | **0** |
| Aggregate rebuild wall time | < 30 min at 1 M catches |
| p95 catch-list query | < 150 ms at 100 k catches per angler |
| Schema drift (tables without an RLS policy) | 0, enforced by the existing `rls-coverage.test.ts` |

---

## 16. Acceptance criteria

1. `tournament_catch.catch_id` exists, is populated for every account-holding entrant by a
   backfill, and a trigger prevents new account-holder rows without it.
2. A test proves a tournament catch inherits its personal catch's `condition_snapshot` and
   `regulation_snapshot` through a documented join.
3. `environmental_observation` rejects a row with a null `dataset_version`, `retrieved_at`
   or `observation_kind` at the database level.
4. The enrichment worker's column allow-list is a constant, and a test fails if it
   intersects the device-written column set.
5. `catch_amendment` is written by trigger for any update to a submitted catch; a test
   proves an update with no amendment is impossible.
6. Every table added by this directory appears in `rls-coverage.test.ts`.
7. The analytical ETL is idempotent: running it twice produces an identical
   `build_version` output, proven by a checksum test.
8. `agg_*` suppressed rows are present with nulled counts, not absent (Rule D4), proven by
   a test.
9. `npm run verify` passes: tokens, tripwires, migration versions, lint, `tsc --noEmit`,
   vitest.
10. `db:check` applies every migration against a clean Postgres, which the repo already
    scripts.

---

## 17. Dependencies

- `architect` ruling on §5 (the reconciliation) and §8 (the analytical store choice).
  **Nothing else in this directory should be built first.**
- `biostat` on the effort/CPUE grain and the `effort_quality` definition.
- `cfo` on the analytical store and vector index cost, and on the trigger for moving off
  Postgres.
- `counsel` on retention schedules encoded as partition-drop migrations.
- The founder's ruling on server media (audit §5), which gates embeddings and evidence.

---

## 18. Risks and unanswered questions

1. **The backfill of `catch_id` is a data-quality problem, not a schema problem.** Matching
   existing tournament catches to personal catches requires a heuristic (same angler, same
   species, ± 5 min, ± 200 m) that will be wrong sometimes. *Open: do we backfill with a
   review queue, or do we leave history unlinked and only link going forward?* The cheaper,
   more honest answer is probably: link going forward, leave history unlinked and labelled.
2. **`environmental_observation` is one row per field per catch.** At 1 M catches × 20
   fields that is 20 M rows. Fine in Postgres, but it is the table most likely to need
   partitioning first. Monitor, do not pre-optimise.
3. **The denormalised projection can drift** from the observations it summarises. Mitigated
   by "worker writes both in one transaction", but a rebuild-and-compare job is needed and
   is not specified here.
4. **Cells break at the antimeridian.** Phase 5 problem, stated now so it is not a surprise.
5. **Two sync protocols already exist** (personal outbox, tournament ingest). This spec
   asks them to converge on `core/tournaments/catch-sync.ts`'s reconciler. *Open: does
   `architect` accept a shared reconciler, or keep them separate and accept the
   duplication?*
6. **Taxonomy versioning is under-tested in the wild.** Splits are rare but catastrophic
   for a longitudinal dataset. A rehearsal migration on a real split (e.g. the vermilion /
   sunset rockfish complex) is worth doing before the pilot.

---

## 19. Recommended implementation phase

**Phase 0** — §5 reconciliation ruling and migration; `environmental_provider` and
`environmental_observation` schema; taxonomy schema; amendment table. No product surface.

**Phase 1** — enrichment worker writing observations; `catch_amendment` triggers; catalog
tables; `geo_cell_50km`.

**Phase 2** — analytical store, ETL, `agg_*`, `/api/aggregates`, `/api/exports`.

**Phase 3** — vector index for AI and biometrics.

**Phase 4** — `/api/agency`, government tables.
