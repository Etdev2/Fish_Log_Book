-- =============================================================================
-- Environmental provenance: the tables the enrichment worker writes into.
--
-- `condition_snapshot` was built for this in the v1 core schema. It has the columns, the
-- `enrichment_status` lifecycle, `snapshot_basis`, `algo_version`, a retry counter and a
-- schema comment explaining that `unavailable` is terminal. Nothing ever filled it in,
-- because no worker was ever built — so every snapshot in the system is `pending` and
-- always has been.
--
-- What was genuinely missing is not columns. It is the discipline that makes an
-- environmental number usable by somebody who was not there: which provider, which
-- dataset version, what KIND of observation, observed when, retrieved when, at what
-- resolution, how far from the source. `condition_snapshot.provenance` is one free-form
-- jsonb blob with no enforced shape, which means nothing can be relied on later.
--
-- So: `environmental_observation` is the truth, one row per field per catch per provider,
-- and the denormalised columns on `condition_snapshot` become a rebuildable projection of
-- it for the fast catch-detail render. One writer, one direction.
--
-- Spec: docs/specs/expansion/catch-environmental-enrichment.md §8,
--       docs/specs/expansion/data-architecture-expansion.md §7.1.
-- =============================================================================

create table if not exists public.environmental_provider (
  id text primary key,
  name text not null,
  -- counsel signs these off before a provider is added. Several free marine datasets
  -- permit research use and forbid commercial redistribution, and an export that reships
  -- them is a licensing breach that the export manifest has to be able to describe.
  licence text not null,
  licence_url text not null,
  attribution_required boolean not null default true,
  attribution_text text,
  commercial_use_permitted boolean not null,
  redistribution_permitted boolean not null,
  terms_verified_at date not null,
  created_at timestamptz not null default now()
);

comment on table public.environmental_provider is
  'Every source of an environmental number, with its licence terms. A provider with no '
  'verified terms is not added — the export manifest has to be able to state what may be '
  'redistributed, and it cannot invent that later.';

create table if not exists public.environmental_observation (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.condition_snapshot(id) on delete cascade,
  field_name text not null,
  value_numeric numeric,
  value_text text,
  -- Canonical SI, matching src/core/units.ts. Display conversion happens at the edge only.
  unit text not null,

  provider_id text not null references public.environmental_provider(id),
  dataset_id text not null,
  -- NOT NULL on purpose. A value whose dataset version is unknown cannot be reproduced,
  -- and an irreproducible number in a scientific dataset is worse than a missing one.
  dataset_version text not null,

  /*
    The distinction the founder brief asks for, made structural rather than editorial.

    These are NOT confidence levels and must not be sorted as if they were: a buoy 30 km
    away (SENSOR) may describe the water at the fish worse than a 1 km model analysis.
    They say what KIND of claim a number is, so a later correlation can exclude the kinds
    it must not treat as measurement — which is exactly what `biostat` will need and
    cannot reconstruct from a jsonb blob.
  */
  observation_kind text not null check (observation_kind in (
    'USER_MEASURED','SENSOR','SATELLITE','MODEL_ANALYSIS','MODEL_FORECAST',
    'INTERPOLATED','CLIMATOLOGY')),

  -- When the world was like this, versus when we asked. Satellite composites make the
  -- gap days wide, and calling that "real-time" is the claim this column exists to refuse.
  observed_at timestamptz,
  retrieved_at timestamptz not null,

  spatial_resolution_m integer,
  temporal_resolution_s integer,
  -- Distance from the station, buoy or grid centre. A tide from the wrong side of a
  -- headland is not data, and this is the column that lets anyone check.
  distance_to_source_m integer,
  -- The provider's own flag, verbatim. Never reinterpreted into ours.
  quality_flag text,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  algo_version integer not null default 1,

  created_at timestamptz not null default now(),

  -- A row that carries neither a number nor a string is not an observation. "We looked
  -- and there is nothing" is a refusal, and refusals do not get stored as empty values.
  constraint observation_has_a_value check (value_numeric is not null or value_text is not null),
  -- One value per field per provider per dataset version. A re-fetch of the same version
  -- is idempotent; a new version is a new row and the old one is kept.
  constraint observation_unique_per_version
    unique (snapshot_id, field_name, provider_id, dataset_version)
);

create index if not exists environmental_observation_snapshot_idx
  on public.environmental_observation (snapshot_id, field_name);
create index if not exists environmental_observation_kind_idx
  on public.environmental_observation (observation_kind, field_name);

comment on column public.environmental_observation.observation_kind is
  'What kind of claim this number is. Not a confidence ranking — a buoy 30 km away may be '
  'a worse description of this water than a 1 km model. Correlations filter on it.';

-- -----------------------------------------------------------------------------
-- The fields the brief asks for that the v1 schema does not have.
--
-- Salt-only ones join the existing snapshot_salt_only_fields constraint below, so a
-- freshwater row cannot acquire a sea-surface temperature by accident.
-- -----------------------------------------------------------------------------
alter table public.condition_snapshot
  add column if not exists sst_c                     numeric(5,2),
  add column if not exists current_speed_ms          numeric(5,2),
  add column if not exists current_speed_dir_deg     integer
    check (current_speed_dir_deg is null or current_speed_dir_deg between 0 and 359),
  add column if not exists wave_height_m             numeric(5,2),
  add column if not exists wave_period_s             numeric(5,2),
  add column if not exists wave_dir_deg              integer
    check (wave_dir_deg is null or wave_dir_deg between 0 and 359),
  add column if not exists chlorophyll_mg_m3         numeric(7,3),
  add column if not exists seafloor_depth_m          numeric(7,2),
  add column if not exists minutes_to_next_tide_turn integer,
  add column if not exists next_tide_turn_kind       text
    check (next_tide_turn_kind is null or next_tide_turn_kind in ('high','low','slack')),
  add column if not exists marine_zone_id            text,
  add column if not exists regulatory_area_id        text,
  add column if not exists tide_station_id           text,
  add column if not exists buoy_id                   text;

comment on column public.condition_snapshot.sst_c is
  'Satellite sea-surface temperature. NEVER the same fact as water_temp_c, which is the '
  'angler''s own thermometer in the water. A 1 km composite over several days is not the '
  'temperature at the fish, and the provenance row says so.';

comment on column public.condition_snapshot.current_speed_ms is
  'Measured or modelled water speed. Distinct from current_term (D20), which is the '
  'angler''s four-word vocabulary for direction along the coastline. Coverage is coastal '
  'and patchy; null is the common, correct answer.';

comment on column public.condition_snapshot.seafloor_depth_m is
  'Modelled bathymetry, ~450 m resolution. NOT a substitute for bottom_depth_m, which is '
  'what the angler''s sounder actually read under the boat.';

-- LOCATION-BEARING. ontology.md §6 item 2: a subordinate tide station with one pier next
-- to it identifies the pier. Neither of these may appear in any cross-user output, and
-- the comment lives here so the next person to write an export sees it in \d.
comment on column public.condition_snapshot.tide_station_id is
  'LOCATION-BEARING (ontology.md §6 item 2). Never in cross-user output, exports or '
  'aggregates. A station id with one pier beside it identifies the pier.';
comment on column public.condition_snapshot.buoy_id is
  'LOCATION-BEARING (ontology.md §6 item 2). Never in cross-user output, exports or '
  'aggregates.';

-- The salt-only rule, restated to cover the new columns. ontology.md §3 is firm that
-- freshwater has no tide and no swell: the fields are ABSENT, not nullable-and-ignored,
-- because "a meaningless nullable column gets filled in eventually".
alter table public.condition_snapshot
  drop constraint if exists snapshot_salt_only_fields_v2;
alter table public.condition_snapshot
  add constraint snapshot_salt_only_fields_v2 check (
    water_class = 'salt' or (
      sst_c is null and current_speed_ms is null and current_speed_dir_deg is null and
      wave_height_m is null and wave_period_s is null and wave_dir_deg is null and
      chlorophyll_mg_m3 is null and minutes_to_next_tide_turn is null and
      next_tide_turn_kind is null and tide_station_id is null and buoy_id is null)
  );

-- -----------------------------------------------------------------------------
-- RLS. An observation is as private as the snapshot it hangs off, which is as private
-- as the catch, which is the angler's.
-- -----------------------------------------------------------------------------
alter table public.environmental_observation enable row level security;
revoke all on public.environmental_observation from anon;
grant select on public.environmental_observation to authenticated;

-- Read-only to the angler. Only the worker (service_role, which bypasses RLS) writes
-- these: the device has no provider access and must never be able to assert provenance.
create policy environmental_observation_read on public.environmental_observation
for select to authenticated using (
  exists (
    select 1 from public.condition_snapshot s
     where s.id = snapshot_id and s.angler_id = (select auth.uid())
  )
);

-- The provider registry is reference data: readable by any signed-in angler so the app can
-- render an attribution line, writable only by migration.
alter table public.environmental_provider enable row level security;
revoke insert, update, delete on public.environmental_provider from authenticated, anon;
grant select on public.environmental_provider to authenticated;
create policy environmental_provider_read on public.environmental_provider
for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- The one provider the app can already talk to.
--
-- NOAA CO-OPS, which features/conditions/queries/noaa-tides.ts already fetches. US
-- federal government work, so public domain; the attribution line is courtesy and the
-- disclaimer is theirs.
-- -----------------------------------------------------------------------------
insert into public.environmental_provider
  (id, name, licence, licence_url, attribution_required, attribution_text,
   commercial_use_permitted, redistribution_permitted, terms_verified_at)
values
  ('noaa-coops', 'NOAA CO-OPS Tides and Currents',
   'US Government work, public domain (17 U.S.C. §105)',
   'https://tidesandcurrents.noaa.gov/disclaimers.html',
   true, 'Tide data from NOAA CO-OPS. Predictions are not measurements.',
   true, true, date '2026-09-15')
on conflict (id) do nothing;
