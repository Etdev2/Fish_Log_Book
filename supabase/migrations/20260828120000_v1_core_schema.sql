-- =============================================================================
-- V1 core schema
-- Implements: docs/architecture/ontology.md §1-§4, §6, and §2.1-§2.4 (D21a/D22/D23/D24)
-- Decisions:  ADR 001 (ontology shape), ADR 003 (where this file lives),
--             ADR 004 (sync columns)
--
-- Deliberately NOT here, per docs/team/PLAN.md §1:
--   the `private` schema and custom_field_definition / custom_field_value.
--   V2 has the only callers; building the isolation now is real work for nobody.
--
-- Conventions used throughout:
--   * Primary keys on user rows are client-generated UUIDv7 (ADR 004 §2).
--     gen_random_uuid() is a fallback for rows created by SQL, not the normal path.
--   * Vocabulary primary keys are stable text codes, not uuids. They are readable in
--     a log, identical across dev/staging/prod, diffable in a seed file, and cacheable
--     on a device that has no network. ontology.md §7.
--   * `updated_at` is server-owned (trigger). `client_updated_at` is device-owned.
--     They are different columns for different jobs; conflating them breaks the sync
--     cursor the first time a phone's clock is wrong. ADR 004 §5.
--   * Soft delete everywhere syncable: `deleted_at`. Tombstones sync. ADR 004 §4.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Shared trigger functions
-- -----------------------------------------------------------------------------

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

comment on function public.tg_set_updated_at() is
  'Server-authoritative updated_at. This is the sync cursor (ADR 004 §5) and a client '
  'must never set it.';

-- D24: a row the app witnessed and a row typed in from memory are different facts,
-- permanently. The client asserts which it is; the database pins it.
create or replace function public.tg_immutable_capture_mode()
returns trigger language plpgsql as $$
begin
  if new.capture_mode is distinct from old.capture_mode then
    raise exception
      'capture_mode is immutable (D24): % cannot become %', old.capture_mode, new.capture_mode
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

-- ontology.md §2.1: `AT TIME ZONE <text>` is STABLE, not IMMUTABLE — it reads the tz
-- database, which gets updated. So local_date cannot be a generated column.
create or replace function public.tg_set_trip_local_date()
returns trigger language plpgsql as $$
begin
  new.local_date := (new.started_at at time zone coalesce(new.started_tz, 'UTC'))::date;
  return new;
end $$;

create or replace function public.tg_set_catch_local_date()
returns trigger language plpgsql as $$
begin
  new.local_date := (new.caught_at at time zone coalesce(new.caught_tz, 'UTC'))::date;
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Reference vocabularies (ontology.md §7)
--
-- Tables, not enums. D15 makes this load-bearing: a Swift client, a later Kotlin
-- client and the server cannot share a compiled enum, and three copies of a list
-- disagree within one release. Rows are added without a deploy and served with a
-- version stamp for clients to cache against.
--
-- `needs_review` is true wherever ontology.md §7 marks a `?`. It is the founder's
-- red-pen queue, and analysis can see which terms are still provisional.
-- -----------------------------------------------------------------------------

create table public.vocabulary_version (
  singleton    boolean primary key default true check (singleton),
  version      integer not null default 1,
  updated_at   timestamptz not null default now()
);
insert into public.vocabulary_version (singleton) values (true);

comment on table public.vocabulary_version is
  'One row. Bumped whenever a vocabulary table changes. Clients cache the whole '
  'vocabulary bundle and re-fetch when this number moves.';

create or replace function public.tg_bump_vocabulary_version()
returns trigger language plpgsql as $$
begin
  update public.vocabulary_version
     set version = version + 1, updated_at = now()
   where singleton;
  return null;
end $$;

create table public.species (
  id               text primary key,
  common_name      text not null,
  scientific_name  text,
  aliases          text[] not null default '{}',
  is_group         boolean not null default false,
  rolls_up_to      text references public.species(id),
  water_class      text not null check (water_class in ('salt','fresh','both')),
  take_status      text not null default 'open'
                     check (take_status in ('open','protected','regulated')),
  sort_order       integer not null default 0,
  is_active        boolean not null default true,
  needs_review     boolean not null default false
);

create table public.lure_class (
  id            text primary key,
  label         text not null,
  water_class   text not null check (water_class in ('salt','fresh','both')),
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  needs_review  boolean not null default false
);

create table public.bait_type (
  id            text primary key,
  label         text not null,
  water_class   text not null check (water_class in ('salt','fresh','both')),
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  needs_review  boolean not null default false
);

create table public.structure_type (
  id            text primary key,
  label         text not null,
  water_class   text not null check (water_class in ('salt','fresh','both')),
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  needs_review  boolean not null default false
);

create table public.cover_type (
  id            text primary key,
  label         text not null,
  water_class   text not null check (water_class in ('salt','fresh','both')),
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  needs_review  boolean not null default false
);

create table public.water_clarity (
  id            text primary key,
  label         text not null,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  needs_review  boolean not null default false
);

create table public.water_color (
  id            text primary key,
  label         text not null,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  needs_review  boolean not null default false
);

create table public.seasonal_pattern (
  id            text primary key,
  label         text not null,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  needs_review  boolean not null default false
);

do $$
declare t text;
begin
  foreach t in array array['species','lure_class','bait_type','structure_type',
                           'cover_type','water_clarity','water_color','seasonal_pattern']
  loop
    execute format(
      'create trigger tg_%1$s_bump_vocab after insert or update or delete on public.%1$s
         for each statement execute function public.tg_bump_vocabulary_version()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Angler (ontology.md §2)
-- -----------------------------------------------------------------------------

create table public.angler (
  id                uuid primary key references auth.users(id) on delete cascade,
  unit_preference   text not null default 'imperial'
                      check (unit_preference in ('imperial','metric')),
  home_water_class  text check (home_water_class in ('salt','fresh')),
  home_tz           text not null default 'America/Los_Angeles',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on column public.angler.home_tz is
  'Default IANA zone for the calendar when the device has not reported one. '
  'ontology.md §2.1 — a calendar day is a local date, and it needs a zone to exist.';

-- -----------------------------------------------------------------------------
-- Spot (ontology.md §2, §3.1, §6)
-- -----------------------------------------------------------------------------

create table public.spot (
  id                     uuid primary key default gen_random_uuid(),
  angler_id              uuid not null references public.angler(id) on delete cascade,
  name                   text not null,
  water_class            text not null check (water_class in ('salt','fresh')),
  water_body_type        text,
  lat                    numeric(8,5),
  lng                    numeric(8,5),
  -- §6: degree grids, not equal-area cells. At 33.6°N, 0.01° is ~1.1 km of latitude
  -- and ~0.93 km of longitude. Precise enough for an enrichment cache key and for the
  -- coarsest aggregate we allow; deliberately not precise enough to identify a spot.
  geo_cell_1km           text generated always as (
                           case when lat is null or lng is null then null else
                             (floor(lat * 100))::int::text || '_' || (floor(lng * 100))::int::text
                           end) stored,
  geo_cell_10km          text generated always as (
                           case when lat is null or lng is null then null else
                             (floor(lat * 10))::int::text || '_' || (floor(lng * 10))::int::text
                           end) stored,
  tide_station_id        text,
  weather_station_id     text,
  buoy_id                text,
  tide_station_distance_m       integer,
  weather_station_distance_m    integer,
  buoy_distance_m               integer,
  -- D20 / §3.1. Salt only. Two explicit bearings, deliberately not constrained
  -- perpendicular: a jetty corner need not be 90°.
  alongshore_bearing_deg integer check (alongshore_bearing_deg between 0 and 359),
  offshore_bearing_deg   integer check (offshore_bearing_deg between 0 and 359),
  axis_source            text not null default 'unset'
                           check (axis_source in ('user_drawn','coastline_prefill','unset')),
  axis_revision          integer not null default 0,
  created_at             timestamptz not null default now(),
  client_updated_at      timestamptz,
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz,
  -- §3, fresh: a lake has no coastline axis. Not nullable-and-ignored — absent.
  constraint spot_axes_are_salt_only check (
    water_class = 'salt'
    or (alongshore_bearing_deg is null and offshore_bearing_deg is null)
  )
);

-- -----------------------------------------------------------------------------
-- Tackle (ontology.md §4) — the user's own lure points at a poolable class
-- -----------------------------------------------------------------------------

create table public.tackle_item (
  id                 uuid primary key default gen_random_uuid(),
  angler_id          uuid not null references public.angler(id) on delete cascade,
  label              text not null,
  lure_class_id      text not null references public.lure_class(id),
  color              text,
  size_label         text,
  is_favorite        boolean not null default false,
  created_at         timestamptz not null default now(),
  client_updated_at  timestamptz,
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

-- -----------------------------------------------------------------------------
-- Trip — the unit of effort and the denominator (D2)
-- -----------------------------------------------------------------------------

create table public.trip (
  id                       uuid primary key default gen_random_uuid(),
  angler_id                uuid not null references public.angler(id) on delete cascade,
  spot_id                  uuid references public.spot(id),
  water_class              text not null check (water_class in ('salt','fresh')),
  started_at               timestamptz not null,
  started_tz               text not null,
  ended_at                 timestamptz,
  ended_tz                 text,
  -- §2.1: the calendar day this trip belongs to. A trip that starts at 22:00 and lands
  -- a fish at 01:30 is one trip, on the day it started. Trigger-set, not generated.
  local_date               date not null,
  platform                 text,
  angler_count             integer not null default 1 check (angler_count >= 1),
  target_species_ids       text[] not null default '{}',
  zero_catch_confirmed_at  timestamptz,
  catch_log_confidence     text not null default 'unknown'
                             check (catch_log_confidence in ('complete','partial','unknown')),
  conditions_verdict       text check (conditions_verdict in ('good','ok','bad')),  -- D16
  notes                    text,
  -- D24
  capture_mode             text not null default 'live' check (capture_mode in ('live','backfill')),
  client_created_at        timestamptz,
  created_at               timestamptz not null default now(),
  client_updated_at        timestamptz,
  updated_at               timestamptz not null default now(),
  deleted_at               timestamptz,
  constraint trip_ends_after_it_starts check (ended_at is null or ended_at >= started_at),
  -- D24 §2.4: `live` cannot be inferred from clocks — offline means a genuinely live row
  -- can land six hours late. The client asserts it; this bounds the assertion.
  -- Logging from the truck at the end of a session is live. Typing in last April is not.
  constraint trip_live_window check (
    capture_mode = 'backfill'
    or (client_created_at is not null
        and started_at between client_created_at - interval '12 hours'
                            and client_created_at + interval '5 minutes')
  )
);

comment on column public.trip.notes is
  'About this trip. Not the day journal — see journal_entry and ontology.md §2.1. '
  'Never parsed for statistics; not exposed to the analytics role.';

-- -----------------------------------------------------------------------------
-- TripRig — the sticky rig (D21a, ontology.md §2.3)
--
-- APPEND-ONLY. Editing the rig inserts revision n+1. UPDATE and DELETE are revoked
-- from `authenticated` and blocked by trigger, so history cannot be rewritten even by
-- a buggy client. This is half of the guarantee that changing the rig at 3pm does not
-- change what the 11am fish was caught on; the other half is the copy onto each catch.
-- -----------------------------------------------------------------------------

create table public.trip_rig (
  id                  uuid primary key default gen_random_uuid(),
  angler_id           uuid not null references public.angler(id) on delete cascade,
  trip_id             uuid not null references public.trip(id) on delete cascade,
  revision            integer not null check (revision >= 1),
  effective_from      timestamptz not null,
  spot_id             uuid references public.spot(id),
  platform            text,
  tackle_item_id      uuid references public.tackle_item(id),
  bait_type_id        text references public.bait_type(id),
  depth_fished_m      numeric(6,2),
  target_species_ids  text[] not null default '{}',
  created_at          timestamptz not null default now(),
  unique (trip_id, revision)
);

create or replace function public.tg_trip_rig_append_only()
returns trigger language plpgsql as $$
begin
  raise exception
    'trip_rig is append-only (D21a): insert a new revision instead of editing revision %',
    old.revision using errcode = 'check_violation';
end $$;

create trigger tg_trip_rig_no_update before update or delete on public.trip_rig
  for each row execute function public.tg_trip_rig_append_only();

-- -----------------------------------------------------------------------------
-- Catch — including the D22 quick-mark lifecycle and the D21a inherited copy
-- -----------------------------------------------------------------------------

create table public.catch (
  id                  uuid primary key default gen_random_uuid(),
  angler_id           uuid not null references public.angler(id) on delete cascade,
  trip_id             uuid not null references public.trip(id) on delete cascade,
  caught_at           timestamptz not null,
  caught_tz           text not null,
  local_date          date not null,          -- §2.1. Trigger-set. May differ from the trip's.
  lat                 numeric(8,5),
  lng                 numeric(8,5),
  gps_accuracy_m      numeric(7,1),           -- a 60 m fix is a different fact from a 4 m fix
  geo_cell_1km        text generated always as (
                        case when lat is null or lng is null then null else
                          (floor(lat * 100))::int::text || '_' || (floor(lng * 100))::int::text
                        end) stored,
  geo_cell_10km       text generated always as (
                        case when lat is null or lng is null then null else
                          (floor(lat * 10))::int::text || '_' || (floor(lng * 10))::int::text
                        end) stored,

  -- D22: the man-overboard button writes a row that is not yet a fact.
  resolution_state    text not null default 'unresolved'
                        check (resolution_state in ('unresolved','confirmed','dismissed')),
  dismissed_reason    text check (dismissed_reason in ('mistap','not_a_fish_waypoint','duplicate')),
  resolved_at         timestamptz,
  resolved_by         uuid references public.angler(id),
  resolution_source   text check (resolution_source in ('live','needs_details_queue','backfill_edit')),

  species_id          text references public.species(id),
  outcome             text check (outcome in ('landed','lost','missed_bite','short_bite')),
  disposition         text check (disposition in ('kept','released','n/a')),
  length_mm           integer,
  weight_g            integer,
  size_estimated      boolean not null default false,

  -- D21a: copied from the standing rig at insert. These are the fields queries filter
  -- on, and an index scan here beats a temporal join across rig revisions at 100k rows.
  spot_id             uuid references public.spot(id),
  platform            text,
  tackle_item_id      uuid references public.tackle_item(id),
  bait_type_id        text references public.bait_type(id),
  depth_fished_m      numeric(6,2),
  rig_id              uuid references public.trip_rig(id),
  rig_revision        integer,
  -- which of the above the rig supplied rather than the angler's thumb. An inherited
  -- value is a weaker claim than a typed one, and the UI must be able to say so.
  inherited_fields    text[] not null default '{}',

  presentation        text,
  bottom_depth_m      numeric(6,2),
  structure_type_id   text references public.structure_type(id),
  cover_type_id       text references public.cover_type(id),
  notes               text,

  -- D24
  capture_mode        text not null default 'live' check (capture_mode in ('live','backfill')),
  client_created_at   timestamptz,
  created_at          timestamptz not null default now(),
  client_updated_at   timestamptz,
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,

  -- D22: confirming a mark means saying what happened. Species may stay null —
  -- "a fish, no idea what" is honest, and the needs-details queue exists for it.
  -- Outcome is the field that makes a row countable.
  constraint catch_confirmed_needs_outcome check (
    resolution_state <> 'confirmed' or outcome is not null),
  constraint catch_dismissed_needs_reason check (
    resolution_state <> 'dismissed' or dismissed_reason is not null),
  constraint catch_reason_only_when_dismissed check (
    resolution_state = 'dismissed' or dismissed_reason is null),
  constraint catch_unresolved_is_unresolved check (
    (resolution_state = 'unresolved') = (resolved_at is null)),
  constraint catch_live_window check (
    capture_mode = 'backfill'
    or (client_created_at is not null
        and caught_at between client_created_at - interval '12 hours'
                          and client_created_at + interval '5 minutes')
  )
);

-- D22: only a human moves a mark, and nothing ever goes back to unresolved.
-- No job auto-confirms. No age threshold auto-dismisses. A 2023 mark still sitting at
-- `unresolved` is excluded from every rate in 2027, and that is correct.
create or replace function public.tg_catch_resolution_guard()
returns trigger language plpgsql as $$
begin
  if old.resolution_state <> 'unresolved' and new.resolution_state = 'unresolved' then
    raise exception
      'a resolved mark cannot return to unresolved (D22): % -> unresolved', old.resolution_state
      using errcode = 'check_violation';
  end if;
  if new.resolution_state <> old.resolution_state and new.resolved_at is null
     and new.resolution_state <> 'unresolved' then
    new.resolved_at := now();
  end if;
  if new.resolution_state <> old.resolution_state and new.resolved_by is null then
    new.resolved_by := new.angler_id;
  end if;
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- ConditionSnapshot (ontology.md §2, §3) — immutable, repeatable, one per moment
-- -----------------------------------------------------------------------------

create table public.condition_snapshot (
  id                        uuid primary key default gen_random_uuid(),
  angler_id                 uuid not null references public.angler(id) on delete cascade,
  trip_id                   uuid not null references public.trip(id) on delete cascade,
  catch_id                  uuid references public.catch(id) on delete cascade,
  kind                      text not null
                              check (kind in ('trip_start','trip_end','catch','manual','interval')),
  observed_at               timestamptz not null,
  -- §3: denormalised so "tide is null because this is a lake" and "tide is null because
  -- the fetch failed" are distinguishable without a join and without a sentinel value.
  water_class               text not null check (water_class in ('salt','fresh')),
  geo_cell_1km              text,

  -- shared, automatic
  pressure_hpa              numeric(7,2),
  pressure_trend_3h_hpa     numeric(6,2),
  air_temp_c                numeric(5,2),
  wind_speed_ms             numeric(5,2),
  wind_dir_deg              integer check (wind_dir_deg between 0 and 359),
  cloud_cover_pct           integer check (cloud_cover_pct between 0 and 100),
  moon_phase_angle_deg      numeric(6,3),   -- correlate on this
  moon_illumination_fraction numeric(5,4),  -- display only
  days_from_full            numeric(5,2),   -- signed
  days_from_new             numeric(5,2),   -- signed
  moonrise_utc              timestamptz,
  moonset_utc               timestamptz,
  sunrise_utc               timestamptz,
  sunset_utc                timestamptz,
  civil_twilight_begin_utc  timestamptz,
  civil_twilight_end_utc    timestamptz,
  minutes_from_sunrise      integer,        -- signed
  minutes_from_sunset       integer,        -- signed
  day_of_year               integer,

  -- shared, user-entered
  water_temp_c              numeric(5,2),
  surface_condition         text,
  bait_present              text,
  bird_activity             text,

  -- salt only; null means not applicable when water_class = 'fresh'
  tide_height_m             numeric(6,3),
  tide_rate_m_per_hr        numeric(6,3),   -- signed: + flood, - ebb. Never called "current" (R7)
  tide_state                text check (tide_state in ('flood','ebb','slack')),
  tide_pct_through_cycle    numeric(5,2),
  twelfths_hour             integer,
  tide_range_m              numeric(6,3),
  current_term              text check (current_term in ('uphill','downhill','inshore','offshore')),
  current_bearing_deg       integer check (current_bearing_deg between 0 and 359),
  current_axis_revision     integer,
  current_strength          text,
  swell_height_m            numeric(5,2),
  swell_period_s            numeric(5,2),
  swell_dir_deg             integer check (swell_dir_deg between 0 and 359),

  -- fresh only
  water_clarity_id          text references public.water_clarity(id),
  water_color_id            text references public.water_color(id),
  visibility_cm             integer,
  water_level_trend         text,
  lake_elevation_m          numeric(8,2),
  seasonal_pattern_id       text references public.seasonal_pattern(id),

  -- provenance and enrichment (§2, §2.4)
  enrichment_status         text not null default 'pending'
                              check (enrichment_status in
                                ('pending','complete','partial','failed','unavailable')),
  -- D24: were these numbers captured near the moment, or reassembled from an archive?
  snapshot_basis            text not null default 'observed'
                              check (snapshot_basis in ('observed','historical_reconstruction')),
  provenance                jsonb not null default '{}'::jsonb,
  algo_version              integer not null default 1,
  enrichment_attempts       integer not null default 0,
  enrichment_last_error     text,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  deleted_at                timestamptz,

  -- §3: freshwater has no coastline axis and no along-shore current. Not nullable
  -- and ignored — absent. A meaningless nullable column gets filled in eventually.
  constraint snapshot_salt_only_fields check (
    water_class = 'salt' or (
      tide_height_m is null and tide_rate_m_per_hr is null and tide_state is null and
      current_term is null and current_bearing_deg is null and
      swell_height_m is null and swell_period_s is null and swell_dir_deg is null)
  ),
  constraint snapshot_fresh_only_fields check (
    water_class = 'fresh' or (
      water_clarity_id is null and water_color_id is null and
      lake_elevation_m is null and seasonal_pattern_id is null)
  ),
  constraint snapshot_catch_kind check (
    (kind = 'catch') = (catch_id is not null))
);

comment on column public.condition_snapshot.enrichment_status is
  'pending/failed are retried. `unavailable` is TERMINAL: no source covers this place '
  'and date, the fields stay null forever, and the retry job must stop asking. D24 makes '
  'that a routine outcome. Missing is null, never zero (biostat rule 1).';

-- -----------------------------------------------------------------------------
-- JournalEntry — the notebook page (D23, ontology.md §2.1)
--
-- Keyed on (angler_id, entry_date). A calendar day is a local date, not an instant:
-- one grid, one cell per day, forever. The zone is stored beside it as provenance and
-- is deliberately NOT part of the key.
-- No foreign key to trip in either direction. A day can hold two trips or none and
-- still have something written on it.
-- -----------------------------------------------------------------------------

create table public.journal_entry (
  id                 uuid primary key default gen_random_uuid(),
  angler_id          uuid not null references public.angler(id) on delete cascade,
  entry_date         date not null,
  entry_tz           text not null,
  body               text not null default '',
  capture_mode       text not null default 'live' check (capture_mode in ('live','backfill')),
  client_created_at  timestamptz,
  created_at         timestamptz not null default now(),
  client_updated_at  timestamptz,
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,
  unique (angler_id, entry_date),
  constraint journal_live_needs_client_clock check (
    capture_mode = 'backfill' or client_created_at is not null)
);

comment on table public.journal_entry is
  'D23. Never parsed for statistics, never pooled, never mined for keywords or sentiment. '
  'Enforced by the absence of any grant to the analytics role (ontology.md §5.1), not by '
  'anybody remembering. If a pattern in the prose matters it graduates into a canonical '
  'field, by ADR and migration.';

-- -----------------------------------------------------------------------------
-- sync_conflict (ADR 004 §4) — a losing patch is archived, never discarded
-- -----------------------------------------------------------------------------

create table public.sync_conflict (
  id                 uuid primary key default gen_random_uuid(),
  angler_id          uuid not null references public.angler(id) on delete cascade,
  entity             text not null,
  entity_id          uuid not null,
  device_id          text,
  losing_payload     jsonb not null,
  client_updated_at  timestamptz not null,
  row_updated_at     timestamptz not null,
  resolved_at        timestamptz,
  created_at         timestamptz not null default now()
);

comment on table public.sync_conflict is
  'Nothing this app does silently destroys something an angler typed. A patch that loses '
  'last-writer-wins lands here. Journal-body conflicts are surfaced on the day page with '
  'a chooser; everything else is archived quietly. ADR 004 §4.';

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

create trigger tg_trip_local_date before insert or update of started_at, started_tz
  on public.trip for each row execute function public.tg_set_trip_local_date();
create trigger tg_catch_local_date before insert or update of caught_at, caught_tz
  on public.catch for each row execute function public.tg_set_catch_local_date();

create trigger tg_catch_resolution before update on public.catch
  for each row execute function public.tg_catch_resolution_guard();

do $$
declare t text;
begin
  foreach t in array array['angler','spot','tackle_item','trip','catch',
                           'condition_snapshot','journal_entry']
  loop
    execute format(
      'create trigger tg_%1$s_updated_at before insert or update on public.%1$s
         for each row execute function public.tg_set_updated_at()', t);
  end loop;

  foreach t in array array['trip','catch','journal_entry']
  loop
    execute format(
      'create trigger tg_%1$s_capture_mode before update on public.%1$s
         for each row execute function public.tg_immutable_capture_mode()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Indexes
-- The calendar is the home screen, so (angler_id, local_date) is the hottest access
-- path in the product. The sync cursor (ADR 004 §5) is the second.
-- -----------------------------------------------------------------------------

create index idx_trip_angler_date       on public.trip (angler_id, local_date desc);
create index idx_trip_angler_updated    on public.trip (angler_id, updated_at, id);
create index idx_trip_spot              on public.trip (spot_id) where spot_id is not null;

create index idx_catch_angler_date      on public.catch (angler_id, local_date desc);
create index idx_catch_angler_updated   on public.catch (angler_id, updated_at, id);
create index idx_catch_trip             on public.catch (trip_id);
create index idx_catch_species          on public.catch (angler_id, species_id)
                                          where species_id is not null;
create index idx_catch_unresolved       on public.catch (angler_id, local_date desc)
                                          where resolution_state = 'unresolved'
                                            and deleted_at is null;
create index idx_catch_needs_species    on public.catch (angler_id)
                                          where species_id is null and deleted_at is null;

create index idx_journal_angler_date    on public.journal_entry (angler_id, entry_date desc);
create index idx_journal_angler_updated on public.journal_entry (angler_id, updated_at, id);

create index idx_rig_trip               on public.trip_rig (trip_id, revision);
-- trip_rig has no updated_at because it is append-only; created_at is its sync cursor.
create index idx_rig_angler_created     on public.trip_rig (angler_id, created_at, id);
create index idx_snapshot_trip          on public.condition_snapshot (trip_id);
create index idx_snapshot_catch         on public.condition_snapshot (catch_id)
                                          where catch_id is not null;
-- the enrichment worker's queue
create index idx_snapshot_enrichment    on public.condition_snapshot (enrichment_status, observed_at)
                                          where enrichment_status in ('pending','failed');
create index idx_spot_angler            on public.spot (angler_id) where deleted_at is null;
create index idx_tackle_angler          on public.tackle_item (angler_id) where deleted_at is null;
