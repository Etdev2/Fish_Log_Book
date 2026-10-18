-- Quillback rockfish: no retention at any time in California (CCR T14 §28.55).
-- Source: CDFW, Summary of Recreational Groundfish Fishing Regulations
-- (https://wildlife.ca.gov/fishing/ocean/regulations/groundfish-summary, updated 2026-06-23),
-- retrieved live by the coordinator on 2026-10-18.
-- Forward-only. The species row stays take_status = 'regulated': the no-retention rule is
-- California-only (Alaska DSR allows one per day; Washington closes only May–July), so it is
-- expressed as an area-scoped 'prohibited' rule, never as a global species status.

-- Species-level twin of the group-level §28.55 row on the Northern California region:
-- the engine only lets a species' own prohibited row release it.
insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('quillback_rockfish', null, 'ca-ocean-northern', 'salt', 'prohibited', 'These Rockfishes May Not Be Taken or Possessed in California - No Retention at Any Time: Bronzespotted Rockfish, Cowcod, Quillback Rockfish, and Yelloweye Rockfish (CCR T14, §28.55). Fishing is closed year-round, at all depths, no retention at any time (zero fish per person).', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — Summary of Recreational Groundfish Fishing Regulations (updated June 23, 2026)', '2026-06-23', '2026-10-18', 1,
   null, null, 0, 0, null, null, null, null, null, false, 60);
