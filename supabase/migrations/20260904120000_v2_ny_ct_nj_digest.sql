-- NY / CT / NJ v2 leftover pelagics (2026-09-04). Insert-only + pack upsert.

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('spanish_mackerel', null, 'ny-marine', 'salt', 'bag_limit', 'Spanish mackerel: 14". Possession 15. All year.', 'https://dec.ny.gov/things-to-do/freshwater-fishing/regulations/saltwater-size-catch-limits', 'New York DEC — Recreational Saltwater Fishing Size, Catch, and Season Limits', '2026-05-12', '2026-09-04', 2,
   null, null, 15, 15, 14, null, 'total_length', null, null, true, 60),
  ('king_mackerel', null, 'ny-marine', 'salt', 'bag_limit', 'King mackerel: 23". Possession 3. All year.', 'https://dec.ny.gov/things-to-do/freshwater-fishing/regulations/saltwater-size-catch-limits', 'New York DEC — Recreational Saltwater Fishing Size, Catch, and Season Limits', '2026-05-12', '2026-09-04', 2,
   null, null, 3, 3, 23, null, 'total_length', null, null, true, 60),
  ('red_drum', null, 'ny-marine', 'salt', 'bag_limit', 'Red drum: No size limit. No limit for fish less than 27" TL. Fish greater than 27" TL shall not be possessed. All year.', 'https://dec.ny.gov/things-to-do/freshwater-fishing/regulations/saltwater-size-catch-limits', 'New York DEC — Recreational Saltwater Fishing Size, Catch, and Season Limits', '2026-05-12', '2026-09-04', 2,
   null, null, null, null, null, 27, 'total_length', null, 'No daily bag under 27".', true, 60),
  ('red_drum', null, 'ct-lis', 'salt', 'bag_limit', 'Red Drum (Redfish): Maximum length: 27 inches. Daily creel limit: 1 fish per angler. Open Season: Open Year Round.', 'https://portal.ct.gov/deep/fishing/saltwater-fishing-guide/species-regulations', 'Connecticut DEEP — Saltwater Fishing Guide: Species Regulations', '2026-04-01', '2026-09-04', 2,
   null, null, 1, 1, null, 27, 'total_length', null, null, true, 60),
  ('american_shad', null, 'ct-lis', 'salt', 'prohibited', 'American Shad: all state waters closed, except the Connecticut River System.', 'https://portal.ct.gov/deep/fishing/saltwater-fishing-guide/species-regulations', 'Connecticut DEEP — Saltwater Fishing Guide: Species Regulations', '2026-04-01', '2026-09-04', 2,
   null, null, 0, 0, null, null, null, null, 'Open only on the Connecticut River System.', false, 90),
  ('cobia', null, 'nj-marine', 'salt', 'bag_limit', 'Cobia: 1 per person, 2 per vessel. 43".', 'https://dep.nj.gov/njfw/fishing/marine/marine-regulations/', 'New Jersey DEP — Attention Anglers 2026 recreational marine table', '2026-01-01', '2026-09-04', 2,
   null, null, 1, 1, 43, null, 'total_length', null, '2 per vessel.', true, 60),
  ('spanish_mackerel', null, 'nj-marine', 'salt', 'bag_limit', 'Spanish Mackerel: 10. 14".', 'https://dep.nj.gov/njfw/fishing/marine/marine-regulations/', 'New Jersey DEP — Attention Anglers 2026 recreational marine table', '2026-01-01', '2026-09-04', 2,
   null, null, 10, 10, 14, null, 'total_length', null, null, true, 60),
  ('king_mackerel', null, 'nj-marine', 'salt', 'bag_limit', 'King Mackerel: 3. 23".', 'https://dep.nj.gov/njfw/fishing/marine/marine-regulations/', 'New Jersey DEP — Attention Anglers 2026 recreational marine table', '2026-01-01', '2026-09-04', 2,
   null, null, 3, 3, 23, null, 'total_length', null, null, true, 60);

insert into public.reg_pack (id, version, published_at, notes) values
  ('new-york-2026-09-03', 2, '2026-09-04T22:00:00Z', 'New York DEC v2: v1 table plus Spanish mackerel 14" @15; king mackerel 23" @3; red drum no possession over 27".'),
  ('connecticut-2026-09-03', 2, '2026-09-04T22:00:00Z', 'Connecticut DEEP v2: v1 table plus red drum 27" max @1; American shad closed in LIS (CT River only).'),
  ('new-jersey-2026-09-03', 2, '2026-09-04T22:00:00Z', 'New Jersey NJDEP v2: v1 table plus cobia 43" @1 / 2 vessel; Spanish mackerel 14" @10; king mackerel 23" @3.')
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;
