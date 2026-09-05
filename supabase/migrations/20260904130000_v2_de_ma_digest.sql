-- DE leftover Fish Facts + MA shad prohibited (2026-09-04). Insert-only + pack upsert.

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('cobia', null, 'de-tidal', 'salt', 'bag_limit', 'Cobia: Season Open Year-Round. Size Limit 43 inches minimum length (total length). Daily Limit / Person 2 per angler or 2 per vessel.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=109', 'Delaware DNREC Fish Facts — Cobia', '2026-01-01', '2026-09-04', 2,
   null, null, 2, 2, 43, null, 'total_length', null, '2 per vessel.', true, 60),
  ('spanish_mackerel', null, 'de-tidal', 'salt', 'bag_limit', 'Spanish Mackerel: Season Open Year-Round. Size Limit 14 inch minimum. Daily Limit / Person 15.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=176', 'Delaware DNREC Fish Facts — Spanish Mackerel', '2026-01-01', '2026-09-04', 2,
   null, null, 15, 15, 14, null, 'total_length', null, null, true, 60),
  ('scup', null, 'de-tidal', 'salt', 'bag_limit', 'Scup: Season Open Year-Round. Size Limit 9 inch minimum (total length). Daily Limit / Person 30.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=160', 'Delaware DNREC Fish Facts — Scup', '2026-01-01', '2026-09-04', 2,
   null, null, 30, 30, 9, null, 'total_length', null, null, true, 60),
  ('bluefish', null, 'de-tidal', 'salt', 'bag_limit', 'Bluefish: Season Open Year Round. Size Limit No Size Limit. Daily Limit / Person 5 per shore or private boat anglers. 7 per anglers on ''for-hire'' vessels (Headboats and Charter boats).', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=100', 'Delaware DNREC Fish Facts — Bluefish', '2026-01-01', '2026-09-04', 2,
   null, null, 5, 5, null, null, null, null, 'For-hire 7.', true, 60),
  ('weakfish', null, 'de-tidal', 'salt', 'bag_limit', 'Weakfish: Season Open Year-Round. Size Limit 13 inch minimum (total length). Daily Limit / Person 1.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=192', 'Delaware DNREC Fish Facts — Weakfish', '2026-01-01', '2026-09-04', 2,
   null, null, 1, 1, 13, null, 'total_length', null, null, true, 60);

insert into public.reg_pack (id, version, published_at, notes) values
  ('delaware-2026-09-03', 2, '2026-09-04T23:00:00Z', 'Delaware DNREC v2: v1 table plus cobia 43" @2 (2/vessel); Spanish mackerel 14" @15; scup 9" @30; bluefish 5 (7 for-hire); weakfish 13" @1.'),
  ('massachusetts-2026-09-03', 2, '2026-09-04T23:00:00Z', 'Massachusetts DMF v2: American shad other waters prohibited; Merrimack/Connecticut Rivers 3-fish is freshwater.')
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;
