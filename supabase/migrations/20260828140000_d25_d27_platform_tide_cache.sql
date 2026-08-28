-- =============================================================================
-- D25 / D26 / D27 schema follow-through, plus two open items from ontology §8.
--
-- New migration, never an edit to an applied one. Four concerns, in order:
--
--   1. D26 — `platform` becomes a real, constrained vocabulary on trip, trip_rig
--      and catch. It was a bare `text` column with no list behind it.
--   2. D25 — storage for a pre-fetched tide series, cached ahead of a trip and
--      readable offline. `biostat` owns the maths and the ingestion; this file
--      owns only where the numbers sit and how a cache miss is told apart from
--      a genuine absence.
--   3. Closes a provenance hole in the catch resolution rules found while
--      reviewing head-dev/schema-fixes: `resolved_by` could be nulled by a
--      same-state UPDATE and nothing repaired or rejected it.
--   4. Widens the D24 live-capture window from 12h to 18h (ontology §8 item 8).
--
-- D27 needs no DDL. `analytics.trip_effort` already excludes a trip holding any
-- unresolved mark, which is what the founder confirmed. The comment on that view
-- is corrected here so it stops describing the rule as one line away from being
-- softened.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. D26 — Trip.platform is real, and it is a vocabulary table
--
-- A table rather than a CHECK, matching species/bait_type/structure_type and for
-- the same reason (core schema §"Reference vocabularies"): a Swift client, a
-- later Kotlin client and the server cannot share a compiled enum, and the UI
-- needs a label and an order, not just an id. `is_vessel` exists because D26's
-- own rationale is that surf and party-boat catch rates are different
-- populations — it is the rollup analysis reaches for when n is small.
-- -----------------------------------------------------------------------------

create table public.platform (
  id            text primary key,
  label         text not null,
  water_class   text not null check (water_class in ('salt','fresh','both')),
  is_vessel     boolean not null default false,
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  needs_review  boolean not null default false
);

comment on table public.platform is
  'D26. The highest-value stratifier in the model and one tap to collect. Surf catch '
  'rates and party-boat catch rates are not the same population and must never be '
  'pooled. ontology.md §2 (Trip), §2.3 (it is a sticky-rig field).';
comment on column public.platform.is_vessel is
  'Coarse rollup for when a single platform has too few trips to stand alone. '
  'shore/surf/pier/jetty are false; everything that floats is true.';

-- Created BEFORE the seed, deliberately. Clients cache the whole vocabulary bundle
-- and re-fetch only when this number moves, so a new vocabulary seeded past a
-- statement trigger that did not exist yet is a list no existing client ever sees.
-- Caught by running this file, not by reading it.
create trigger tg_platform_bump_vocab
  after insert or update or delete on public.platform
  for each statement execute function public.tg_bump_vocabulary_version();

insert into public.platform (id, label, water_class, is_vessel, sort_order, needs_review) values
  ('shore',         'Shore',        'both',  false, 10, false),
  ('surf',          'Surf',         'salt',  false, 20, false),
  ('pier',          'Pier',         'both',  false, 30, false),
  ('jetty',         'Jetty',        'salt',  false, 40, false),
  ('kayak',         'Kayak',        'both',  true,  50, false),
  ('private_boat',  'Private boat', 'both',  true,  60, false),
  ('party_boat',    'Party boat',   'salt',  true,  70, false),
  -- These two are the same craft under two names in most of California. Kept apart
  -- because D26 lists both, flagged because merging them later is a vocabulary edit
  -- and splitting them later is not.
  ('float_tube',    'Float tube',   'fresh', true,  80, true),
  ('belly_boat',    'Belly boat',   'fresh', true,  90, true);

alter table public.platform enable row level security;
create policy platform_read on public.platform
  for select to authenticated using (true);
revoke all on public.platform from anon;
revoke insert, update, delete on public.platform from authenticated, anon;
grant select on public.platform to authenticated;

-- The three places a platform is recorded. `catch.platform` is the rig snapshot
-- (D21a, ontology §2.3) — it is already copied at insert and already named in
-- `inherited_fields`; all that was missing was the list behind it.
alter table public.trip
  add constraint trip_platform_fkey foreign key (platform) references public.platform(id);
alter table public.trip_rig
  add constraint trip_rig_platform_fkey foreign key (platform) references public.platform(id);
alter table public.catch
  add constraint catch_platform_fkey foreign key (platform) references public.platform(id);

comment on column public.trip.platform is
  'D26. Required by the UI on Start Fishing, deliberately NOT null in the column: an '
  'offline row must be able to land before the chip is tapped, and a backfilled paper '
  'log may genuinely not record it. A null here is honest; a wrong default is not.';
comment on column public.catch.platform is
  'D21a/D26. Snapshotted from the standing rig at insert, falling back to trip.platform '
  'in the client. Surf then jetty in one trip is one trip, so this is per-mark and not '
  'read through the trip. Listed in inherited_fields when the rig supplied it.';

-- -----------------------------------------------------------------------------
-- 2. D25 — storage for a pre-fetched, offline-readable tide series
--
-- Three tables, and the third is the one that matters:
--
--   tide_station   the place the numbers are about. `spot.tide_station_id` has
--                  pointed at nothing since it was written; now it points here.
--   tide_series    the points themselves.
--   tide_coverage  what has been fetched. Without it a client cannot tell "no
--                  rows because nobody fetched this day" from "no rows because
--                  there is nothing to fetch", and on a boat with no signal that
--                  distinction is the entire feature. Missing is null, never
--                  zero, and never an empty chart presented as a flat tide.
--
-- `series_type` is here so that resolving ontology §8 item 9 — whether CO-OPS
-- *verified water levels* are worth a second fetch for backfill — never needs a
-- migration. Predictions are what D25 ships; observations have a column waiting.
--
-- NOT designed here, on purpose: which station is nearest, how far ahead to
-- fetch, interpolation between points, state/rate/twelfths. That is `biostat`'s
-- and duplicating it would produce two answers.
-- -----------------------------------------------------------------------------

create table public.tide_station (
  id          text primary key,                      -- NOAA CO-OPS station id
  name        text not null,
  source      text not null default 'noaa_coops',
  lat         numeric(8,5),
  lng         numeric(8,5),
  state       text,
  timezone    text not null default 'America/Los_Angeles',   -- IANA, for local-day coverage
  datum       text not null default 'MLLW',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.tide_station is
  'D25. Reference data about a public NOAA station, not about an angler. Readable by '
  'any signed-in user, written only by the ingestion worker. Deliberately NOT visible '
  'to the analytics role: ontology §6 names station ids as a location leak.';

-- Seeded with the id only. Coordinates come from the CO-OPS metadata API during
-- ingestion; inventing them here would put a guess in a column that reads as a fact.
insert into public.tide_station (id, name, state) values
  ('9410580', 'Santa Monica, CA', 'CA');

create table public.tide_series (
  station_id        text not null references public.tide_station(id) on delete cascade,
  series_type       text not null default 'prediction'
                      check (series_type in ('prediction','observation')),
  point_kind        text not null check (point_kind in ('extreme','interval')),
  datum             text not null default 'MLLW',
  at_time           timestamptz not null,
  height_m          numeric(6,3) not null,           -- SI in the column, feet at the glass
  extreme_type      text check (extreme_type in ('H','L')),
  interval_minutes  integer check (interval_minutes > 0),
  source            text not null default 'noaa_coops',
  fetched_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (station_id, series_type, point_kind, datum, at_time),
  constraint tide_series_extreme_shape check (
    (point_kind = 'extreme') = (extreme_type is not null)),
  constraint tide_series_interval_shape check (
    (point_kind = 'interval') = (interval_minutes is not null))
);

comment on table public.tide_series is
  'D25. One row per predicted (or, later, observed) point. Both the high/low extremes '
  'and a regular interval series live here; `point_kind` separates them because they '
  'answer different questions and are fetched as different products. Immutable in '
  'practice — a re-fetch of the same point is an upsert, not a second row.';
comment on column public.tide_series.series_type is
  'ontology §8 item 9. `prediction` is what D25 ships and what works offline, because '
  'predictions are computed in advance. `observation` (CO-OPS verified water levels) is '
  'a strictly better dataset for a past date and is `biostat`''s call to make; the '
  'column exists so saying yes later costs a fetch and not a migration.';

create index idx_tide_series_window
  on public.tide_series (station_id, at_time);

create table public.tide_coverage (
  station_id   text not null references public.tide_station(id) on delete cascade,
  series_type  text not null default 'prediction'
                 check (series_type in ('prediction','observation')),
  point_kind   text not null check (point_kind in ('extreme','interval')),
  datum        text not null default 'MLLW',
  covers_date  date not null,                        -- the STATION's local date
  point_count  integer not null default 0 check (point_count >= 0),
  status       text not null default 'complete'
                 check (status in ('complete','partial','unavailable')),
  fetched_at   timestamptz not null default now(),
  source       text not null default 'noaa_coops',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (station_id, series_type, point_kind, datum, covers_date)
);

comment on table public.tide_coverage is
  'D25. The answer to "do I have tide for this day, here, right now?" — asked offline, '
  'so it has to be a row and not a network call. A day with no coverage row has never '
  'been fetched. A day with status `unavailable` has been fetched and there is nothing '
  'there; that is TERMINAL and the retry job must stop asking, same contract as '
  'condition_snapshot.enrichment_status.';
comment on column public.tide_coverage.covers_date is
  'The station''s local calendar date, not UTC and not the angler''s. A day is a local '
  'date everywhere in this schema (§2.1); this is the one place the relevant locality '
  'is the station''s rather than the device''s.';

create index idx_tide_coverage_station_date
  on public.tide_coverage (station_id, covers_date);

-- spot.tide_station_id has been a dangling text column since it was written.
alter table public.spot
  add constraint spot_tide_station_fkey
  foreign key (tide_station_id) references public.tide_station(id);

create trigger tg_tide_station_updated_at before insert or update on public.tide_station
  for each row execute function public.tg_set_updated_at();
create trigger tg_tide_series_updated_at before insert or update on public.tide_series
  for each row execute function public.tg_set_updated_at();
create trigger tg_tide_coverage_updated_at before insert or update on public.tide_coverage
  for each row execute function public.tg_set_updated_at();

-- Public facts about public stations: any signed-in angler reads them, no client
-- writes them, the pooled analyst never sees them (ontology §6 — a station id is a
-- location). The ingestion worker uses the service role.
do $$
declare t text;
begin
  foreach t in array array['tide_station','tide_series','tide_coverage']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %1$s_read on public.%1$s for select to authenticated using (true)', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke insert, update, delete on public.%I from authenticated, anon', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('revoke all on public.%I from pooled_analyst', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. A provenance hole in the resolution rules
--
-- Found reviewing head-dev/schema-fixes, which is otherwise correct. The trigger
-- fills `resolved_by` when a mark changes state, and `catch_unresolved_is_
-- unresolved` rejects a resolved row with a null `resolved_at`. Nothing covered
-- `resolved_by`: a same-state UPDATE could null it and both the trigger and the
-- CHECK let it through, leaving a resolved mark with no record of who resolved it.
-- D22 says the act of resolving is recorded, so make it structural rather than
-- something the trigger happens to catch on the paths it fires for.
-- -----------------------------------------------------------------------------

alter table public.catch
  add constraint catch_resolved_has_resolver check (
    resolution_state = 'unresolved' or resolved_by is not null);

-- -----------------------------------------------------------------------------
-- 4. The live-capture window is 18 hours, not 12 (ontology §8 item 8)
--
-- 12 was a number I picked, and it was wrong for the fishery this app is for. A
-- full-day SoCal party boat out of San Pedro runs 12-14 hours; logging the whole
-- session from the truck in the car park afterwards is the normal case, and under
-- a 12h bound a fish caught in hour one would have been rejected, forcing the
-- client to relabel a genuinely witnessed row as `backfill` — which is exactly the
-- lie D24 exists to prevent. 18h covers a full-day boat plus the drive home and
-- still puts a kitchen table the next morning firmly outside.
--
-- The constraint stays. It bounds a client *assertion*; it does not certify one.
-- -----------------------------------------------------------------------------

alter table public.trip drop constraint trip_live_window;
alter table public.trip add constraint trip_live_window check (
  capture_mode = 'backfill'
  or (client_created_at is not null
      and started_at between client_created_at - interval '18 hours'
                          and client_created_at + interval '5 minutes')
);

alter table public.catch drop constraint catch_live_window;
alter table public.catch add constraint catch_live_window check (
  capture_mode = 'backfill'
  or (client_created_at is not null
      and caught_at between client_created_at - interval '18 hours'
                        and client_created_at + interval '5 minutes')
);

-- -----------------------------------------------------------------------------
-- 5. D27 — no DDL, one corrected comment
-- -----------------------------------------------------------------------------

comment on view analytics.trip_effort is
  'The denominator. D27 (SETTLED 2026-08-28): a trip holding ANY unresolved mark is '
  'held out entirely, not merely the mark — an unknown numerator invalidates the '
  'denominator under it. This is no longer "one line to soften"; softening it needs a '
  'new decision. The accepted cost is that a forgotten tap mutes a real trip, and it '
  'is accepted only because the exclusion is visible and fixable: unresolved marks '
  'surface at End Trip and carry the calendar''s amber flag '
  '(docs/product/ux-calendar-notebook.md). A muted trip must never be a silent hole.';
