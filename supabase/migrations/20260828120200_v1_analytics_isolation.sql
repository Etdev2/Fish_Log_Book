-- =============================================================================
-- V1 analytics isolation
-- ontology.md §5.1, and §5's principle: exclusion is a permission, not a flag.
--
-- Four things must never enter a pooled query, and they get one mechanism rather
-- than four conventions:
--   * unresolved quick marks (D22) — never established as a fish
--   * journal text (D23) — prose is not data
--   * free-text notes on trip and catch — same reason
--   * incomplete-log trips (R2) — a flattering denominator
--
-- The mechanism: a `pooled_analyst` role holding USAGE on `analytics` and SELECT on
-- three views, and nothing else in the database. The server-side engine (P6) connects
-- as that role. It is not able to write the offending query, so no reviewer has to
-- catch it.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'pooled_analyst') then
    create role pooled_analyst nologin;
  end if;
end $$;

create schema if not exists analytics;

-- -----------------------------------------------------------------------------
-- The app's own countable view.
-- security_invoker = true: RLS applies, an angler sees only their own rows.
-- Nothing that computes a rate reads public.catch directly. Not a convention — the
-- filter lives here so a forgotten WHERE clause cannot invent a phantom fish.
-- -----------------------------------------------------------------------------

create view public.catch_countable
with (security_invoker = true) as
select *
  from public.catch
 where resolution_state = 'confirmed'
   and deleted_at is null;

comment on view public.catch_countable is
  'D22. The only thing a rate may be computed from on the client. Unresolved marks and '
  'tombstones are absent by construction.';

create view public.catch_unresolved
with (security_invoker = true) as
select *
  from public.catch
 where resolution_state = 'unresolved'
   and deleted_at is null;

comment on view public.catch_unresolved is
  'The needs-details queue. Also the number the UI must show prominently: an unresolved '
  'mark withholds its whole trip from the angler''s stats (ontology.md §2.2).';

grant select on public.catch_countable, public.catch_unresolved to authenticated;
revoke all on public.catch_countable, public.catch_unresolved from anon;

-- Trap, written down so it is found before it bites: `select *` freezes the column list
-- at creation time. A later `alter table public.catch add column` does NOT appear in
-- these views. Any migration that adds a catch column must recreate them.

-- -----------------------------------------------------------------------------
-- The pooled views.
--
-- These are intentionally NOT security_invoker: cross-user pooling is the whole point,
-- so they run with the owner's rights and bypass RLS.
--
-- *** That makes the REVOKE below load-bearing. A pooled view reachable from a browser
-- *** is a data breach, and it is one GRANT away at all times. ontology.md §5.1 calls
-- *** this the sharpest edge in the schema; this comment is the second warning.
--
-- Columns §6 names as leaks are absent: no spot names, no station or buoy ids, no raw
-- lat/lng, no free text. geo_cell_10km is the only geography that crosses.
-- -----------------------------------------------------------------------------

create view analytics.trip_effort as
select t.id                       as trip_id,
       t.angler_id,
       t.water_class,
       t.local_date,
       t.started_at,
       t.ended_at,
       extract(epoch from (t.ended_at - t.started_at)) / 3600.0 as hours_fished,
       t.platform,
       t.angler_count,
       t.target_species_ids,
       t.zero_catch_confirmed_at is not null                    as zero_catch_confirmed,
       t.conditions_verdict,
       t.capture_mode,                                       -- D24: always in front of you
       s.geo_cell_10km
  from public.trip t
  left join public.spot s on s.id = t.spot_id
 where t.deleted_at is null
   -- R2: only a completely logged trip is a denominator.
   and t.catch_log_confidence = 'complete'
   -- D22: a trip holding an unresolved mark has an unknown numerator, so it is not a
   -- valid denominator either. Strict, deliberate, and one line to soften if it proves
   -- too harsh in the field (ontology.md §8 item 7).
   and not exists (
     select 1 from public.catch c
      where c.trip_id = t.id
        and c.resolution_state = 'unresolved'
        and c.deleted_at is null);

create view analytics.catch_event as
select c.id                       as catch_id,
       c.trip_id,
       c.angler_id,
       c.local_date,
       c.caught_at,
       c.species_id,
       c.outcome,
       c.disposition,
       c.length_mm,
       c.weight_g,
       c.size_estimated,
       c.platform,
       c.depth_fished_m,
       c.bottom_depth_m,
       c.presentation,
       c.structure_type_id,
       c.cover_type_id,
       c.bait_type_id,
       ti.lure_class_id,            -- §4: the class pools; the angler's own lure does not
       c.inherited_fields,          -- an inherited value is a weaker claim than a typed one
       c.capture_mode,              -- D24
       c.gps_accuracy_m,
       c.geo_cell_10km
  from public.catch c
  left join public.tackle_item ti on ti.id = c.tackle_item_id
 where c.deleted_at is null
   and c.resolution_state = 'confirmed'      -- D22. The whole point of this file.
   and exists (select 1 from analytics.trip_effort te where te.trip_id = c.trip_id);

create view analytics.condition_observation as
select cs.id                      as snapshot_id,
       cs.trip_id,
       cs.catch_id,
       cs.angler_id,
       cs.kind,
       cs.observed_at,
       cs.water_class,
       cs.pressure_hpa, cs.pressure_trend_3h_hpa,
       cs.air_temp_c, cs.wind_speed_ms, cs.wind_dir_deg, cs.cloud_cover_pct,
       cs.moon_phase_angle_deg, cs.days_from_full, cs.days_from_new,
       cs.minutes_from_sunrise, cs.minutes_from_sunset, cs.day_of_year,
       cs.water_temp_c, cs.surface_condition, cs.bait_present, cs.bird_activity,
       cs.tide_height_m, cs.tide_rate_m_per_hr, cs.tide_state,
       cs.tide_pct_through_cycle, cs.tide_range_m,
       cs.current_term,                 -- the angler's assertion
       cs.current_bearing_deg,          -- D20: correlate on THIS, not on the term
       cs.current_axis_revision,
       cs.current_strength,
       cs.swell_height_m, cs.swell_period_s, cs.swell_dir_deg,
       cs.water_clarity_id, cs.water_color_id, cs.visibility_cm,
       cs.water_level_trend, cs.lake_elevation_m, cs.seasonal_pattern_id,
       cs.enrichment_status,
       cs.snapshot_basis,               -- D24: observed vs reconstructed from an archive
       cs.algo_version,
       cs.geo_cell_1km
  from public.condition_snapshot cs
 where cs.deleted_at is null
   and exists (select 1 from analytics.trip_effort te where te.trip_id = cs.trip_id);

-- -----------------------------------------------------------------------------
-- Grants. Read this block before changing anything above it.
-- -----------------------------------------------------------------------------

revoke all on schema analytics from public, anon, authenticated;
revoke all on all tables in schema analytics from public, anon, authenticated;

grant usage on schema analytics to pooled_analyst;
grant select on analytics.trip_effort,
                analytics.catch_event,
                analytics.condition_observation
      to pooled_analyst;

-- The point of the exercise: the analysis role cannot reach a base table, a note,
-- a journal page, a spot name or a station id, whatever query it is asked to run.
--
-- Two independent layers, because one of them is easy to undo by accident:
--   1. no table-level grant in `public` (below), and
--   2. RLS is enabled on every table in `public` and every policy names a specific
--      role (`authenticated`). `pooled_analyst` matches no policy, so even if someone
--      re-grants SELECT one afternoon, the rows still do not come back.
revoke all on all tables in schema public from pooled_analyst;
alter default privileges in schema public revoke all on tables from pooled_analyst;

alter default privileges in schema analytics revoke all on tables from anon, authenticated;

comment on schema analytics is
  'Pooled cross-user analysis only. Views here bypass RLS by design. Never grant '
  'anything in this schema to anon or authenticated. ontology.md §5.1.';
