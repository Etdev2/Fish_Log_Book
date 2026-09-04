-- Maine DMR leftover rec rows (2026-09-05). Insert-only + pack upsert.

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('atlantic_halibut', null, 'me-coast', 'salt', 'bag_limit', 'ATLANTIC HALIBUT: Size: Minimum size 41 inches. Bag limit: Vessels may land no more than 5 fish (recreational) / 25 fish (charter) per year. All retained fish shall immediately be tagged with an approved landings tag. Maine territorial waters; Season: Halibut can be retained from sunrise on May 18 through sunset on June 13th. No fishing on Wednesdays and Thursdays. Federal waters: No season, no more than 1 fish per day.', 'https://www.maine.gov/dmr/sites/maine.gov.dmr/files/inline-files/2026_sportfish_regs_Gabrielle%20Page_0.pdf', 'Maine DMR — 2026 Saltwater Recreational Fishing Regulations (Groundfish and Other Finfish, posted July 14, 2026)', '2026-07-01', '2026-09-05', 2,
   '2026-05-18', '2026-06-13', null, 5, 41, null, 'total_length', null, 'Territorial: tags, 5/year rec, no Wed/Thu. Federal 1/day, no season.', true, 30),
  ('atlantic_halibut', null, 'me-coast', 'salt', 'season', 'Maine territorial waters; Season: Halibut can be retained from sunrise on May 18 through sunset on June 13th. No fishing on Wednesdays and Thursdays (no harvesting or gear in the water).', 'https://www.maine.gov/dmr/sites/maine.gov.dmr/files/inline-files/2026_sportfish_regs_Gabrielle%20Page_0.pdf', 'Maine DMR — 2026 Saltwater Recreational Fishing Regulations (Groundfish and Other Finfish, posted July 14, 2026)', '2026-07-01', '2026-09-05', 2,
   '2026-05-18', '2026-06-13', null, null, null, null, null, null, 'No Wed/Thu in territorial waters.', true, 30),
  ('acadian_redfish', null, 'me-coast', 'salt', 'bag_limit', 'ACADIAN REDFISH: Size: Minimum size 9 inches. No bag limit.', 'https://www.maine.gov/dmr/sites/maine.gov.dmr/files/inline-files/2026_sportfish_regs_Gabrielle%20Page_0.pdf', 'Maine DMR — 2026 Saltwater Recreational Fishing Regulations (Groundfish and Other Finfish, posted July 14, 2026)', '2026-07-01', '2026-09-05', 2,
   null, null, null, null, 9, null, 'total_length', null, 'No bag limit.', false, 120),
  ('monkfish', null, 'me-coast', 'salt', 'bag_limit', 'MONKFISH: Size: Minimum size 17 inches. Bag limit: none.', 'https://www.maine.gov/dmr/sites/maine.gov.dmr/files/inline-files/2026_sportfish_regs_Gabrielle%20Page_0.pdf', 'Maine DMR — 2026 Saltwater Recreational Fishing Regulations (Groundfish and Other Finfish, posted July 14, 2026)', '2026-07-01', '2026-09-05', 2,
   null, null, null, null, 17, null, 'total_length', null, 'No bag limit.', false, 120),
  ('american_eel', null, 'me-coast', 'salt', 'bag_limit', 'AMERICAN EEL: Method of take: speargun, harpoon, trap or hook and line. Bag Limit: 25 eels per angler per day, personal use only. Size: minimum size 9 inches.', 'https://www.maine.gov/dmr/sites/maine.gov.dmr/files/inline-files/2026_searun_regs.pdf', 'Maine DMR — 2026 Sea Run Recreational Fishing Regulations', '2026-03-19', '2026-09-05', 2,
   null, null, 25, 25, 9, null, 'total_length', null, 'Personal use only.', false, 90),
  ('american_shad', null, 'me-coast', 'salt', 'bag_limit', 'AMERICAN SHAD: Method of take: hook and line only. Bag limit: a person may take or possess only 2 fish per day. Size: No minimum size.', 'https://www.maine.gov/dmr/sites/maine.gov.dmr/files/inline-files/2026_searun_regs.pdf', 'Maine DMR — 2026 Sea Run Recreational Fishing Regulations', '2026-03-19', '2026-09-05', 2,
   null, null, 2, 2, null, null, null, null, 'Hook and line only.', true, 60);

insert into public.reg_pack (id, version, published_at, notes) values
  ('maine-2026-09-03', 2, '2026-09-05T18:00:00Z', 'Maine DMR v2 leftover: territorial halibut 41" May 18–Jun 13; redfish 9"; monkfish 17"; shad 2/day; eel 9" @25.')
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;
