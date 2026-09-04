-- NH / RI leftover groundfish from official rec tables (2026-09-04). Insert-only + pack upsert.

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('american_plaice', null, 'nh-coast', 'salt', 'bag_limit', 'American Plaice Recreational: Closed Season: No closed season. Minimum Length: 14 inches. Daily Bag Limit: No bag limit.', 'https://www.eregulations.com/newhampshire/fishing/saltwater/recreational-commercial-regulations', 'New Hampshire Fish & Game — Saltwater Recreational & Commercial Regulations', '2026-08-17', '2026-09-04', 2,
   null, null, null, null, 14, null, 'total_length', null, 'No bag limit.', false, 120),
  ('monkfish', null, 'nh-coast', 'salt', 'bag_limit', 'Monkfish Recreational: Closed Season: No closed season. Minimum Length: 17 inches. Daily Bag Limit: No bag limit.', 'https://www.eregulations.com/newhampshire/fishing/saltwater/recreational-commercial-regulations', 'New Hampshire Fish & Game — Saltwater Recreational & Commercial Regulations', '2026-08-17', '2026-09-04', 2,
   null, null, null, null, 17, null, 'total_length', null, 'No bag limit.', false, 120),
  ('pollock', null, 'nh-coast', 'salt', 'bag_limit', 'Pollock Recreational: Closed Season: No closed season. Minimum Length: No minimum length. Daily Bag Limit: No bag limit. Special Rules: 19 inches, if taken in federal waters.', 'https://www.eregulations.com/newhampshire/fishing/saltwater/recreational-commercial-regulations', 'New Hampshire Fish & Game — Saltwater Recreational & Commercial Regulations', '2026-08-17', '2026-09-04', 2,
   null, null, null, null, null, null, null, null, 'Federal waters 19" min.', false, 120),
  ('acadian_redfish', null, 'nh-coast', 'salt', 'bag_limit', 'Redfish Recreational: Closed Season: No closed season. Minimum Length: 9 inches. Daily Bag Limit: No bag limit.', 'https://www.eregulations.com/newhampshire/fishing/saltwater/recreational-commercial-regulations', 'New Hampshire Fish & Game — Saltwater Recreational & Commercial Regulations', '2026-08-17', '2026-09-04', 2,
   null, null, null, null, 9, null, 'total_length', null, 'No bag limit.', false, 120),
  ('yellowtail_flounder', null, 'nh-coast', 'salt', 'bag_limit', 'Yellowtail Flounder Recreational: Closed Season: No closed season. Minimum Length: 13 inches. Daily Bag Limit: No bag limit.', 'https://www.eregulations.com/newhampshire/fishing/saltwater/recreational-commercial-regulations', 'New Hampshire Fish & Game — Saltwater Recreational & Commercial Regulations', '2026-08-17', '2026-09-04', 2,
   null, null, null, null, 13, null, 'total_length', null, 'No bag limit.', false, 120),
  ('witch_flounder', null, 'nh-coast', 'salt', 'bag_limit', 'Witch Flounder Recreational: Closed Season: No closed season. Minimum Length: No minimum length. Daily Bag Limit: No limit.', 'https://www.eregulations.com/newhampshire/fishing/saltwater/recreational-commercial-regulations', 'New Hampshire Fish & Game — Saltwater Recreational & Commercial Regulations', '2026-08-17', '2026-09-04', 2,
   null, null, null, null, null, null, null, null, 'No limit.', false, 120),
  ('white_perch', null, 'nh-coast', 'salt', 'bag_limit', 'White Perch Recreational: Closed Season: No closed season. Minimum Length: No minimum length. Daily Bag Limit: 25 fish per day. Special Rules: Sale is prohibited.', 'https://www.eregulations.com/newhampshire/fishing/saltwater/recreational-commercial-regulations', 'New Hampshire Fish & Game — Saltwater Recreational & Commercial Regulations', '2026-08-17', '2026-09-04', 2,
   null, null, 25, 25, null, null, null, null, 'Sale prohibited.', false, 90),
  ('spiny_dogfish', null, 'nh-coast', 'salt', 'bag_limit', 'Dogfish, Spiny Recreational: Closed Season: No closed season. Minimum Length: No minimum length. Daily Bag Limit: No bag limit. Special Rules: Finning prohibited.', 'https://www.eregulations.com/newhampshire/fishing/saltwater/recreational-commercial-regulations', 'New Hampshire Fish & Game — Saltwater Recreational & Commercial Regulations', '2026-08-17', '2026-09-04', 2,
   null, null, null, null, null, null, null, null, 'No bag limit. Finning prohibited.', false, 120),
  ('american_plaice', null, 'ri-statewide', 'salt', 'bag_limit', 'American plaice (dab): 14". 1/1 - 12/31. No limit.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-04', 2,
   null, null, null, null, 14, null, 'total_length', null, 'No possession limit.', false, 120),
  ('monkfish', null, 'ri-statewide', 'salt', 'bag_limit', 'Monkfish (Goosefish): 17" whole / 11" tail. 1/1 - 12/31. 50 lbs tails/day or 166 lbs whole/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-04', 2,
   null, null, null, null, 17, null, 'total_length', null, '50 lbs tails/day or 166 lbs whole/day.', false, 90),
  ('witch_flounder', null, 'ri-statewide', 'salt', 'bag_limit', 'Witch Flounder (Gray Sole): 14". 1/1 - 12/31. No limit.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-04', 2,
   null, null, null, null, 14, null, 'total_length', null, 'No possession limit.', false, 120),
  ('yellowtail_flounder', null, 'ri-statewide', 'salt', 'bag_limit', 'Yellowtail Flounder: 13". 1/1 - 12/31. No limit.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-04', 2,
   null, null, null, null, 13, null, 'total_length', null, 'No possession limit.', false, 120);

insert into public.reg_pack (id, version, published_at, notes) values
  ('new-hampshire-2026-09-03', 2, '2026-09-04T23:30:00Z', 'New Hampshire F&G v2 leftover groundfish from the 2026-08-17 table.'),
  ('rhode-island-2026-09-03', 2, '2026-09-04T23:30:00Z', 'Rhode Island DEM v2 leftover rec-table groundfish. No cobia/Spanish/king.')
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;
