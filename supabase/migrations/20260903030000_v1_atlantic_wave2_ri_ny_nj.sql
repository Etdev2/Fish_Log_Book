-- Atlantic wave 2 (2026-09-03): Rhode Island DEM, New York DEC, New Jersey DEP
-- recreational saltwater tables. GENERATED via gen-atlantic-wave2.mts — edit bundles,
-- regenerate. No new species rows (wave-1 ontology already covers the table).

insert into public.reg_pack (id, version, published_at, notes) values
  ('rhode-island-2026-09-03', 1, '2026-09-03T18:00:00Z', 'Rhode Island (DEM recreational table, Rev. 9/1/2026): striped bass 28"-<31" @1 year-round + circle-hook bait rule; bluefish 5 general / 7 party-charter; scup shore 9.5" vs private/rental 11" @30 May 1–Dec 31; fluke 19" @6 Apr 1–Dec 31 with special-shore 17" (2 of 6); tautog 16" (one >21", vessel 10) 3/closed/3/5; black sea bass 16" general 3 May 16–Dec 31 (party/charter 4 then 6); cod prohibited; winter flounder 12" @2 Mar 1–Dec 31 with Narragansett Bay north-of-Colregs prohibition.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('ri-statewide', 'ri-dem', 'ocean_region', 'Rhode Island — coastal waters envelope', null, '[[-71.9,41.85],[-71.12,41.85],[-71.12,41.15],[-71.9,41.15],[-71.9,41.85]]', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', '2026-09-03', 'Envelope (Narragansett Bay + Block Island Sound). State-waters table.'),
  ('ri-narragansett-north-colregs', 'ri-dem', 'conservation_area', 'Narragansett Bay north of the Colregs Line + Potter Pond, Point Judith Pond, Harbor of Refuge', null, null, 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', '2026-09-03', 'Winter flounder harvest/possession prohibited.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('striped_bass', null, 'ri-statewide', 'salt', 'bag_limit', 'Striped Bass: 28"-<31". Season 1/1 - 12/31. Possession limit: 1 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   null, null, 1, 1, 28, 31, 'total_length', null, 'Slot 28" to less than 31".', true, 30),
  ('striped_bass', null, 'ri-statewide', 'salt', 'gear', 'Striped Bass Circle Hook Provision: Required when fishing recreationally for striped bass with bait.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   null, null, null, null, null, null, null, null, null, true, 30),
  ('bluefish', null, 'ri-statewide', 'salt', 'bag_limit', 'Bluefish General Recreational: No minimum. 1/1 - 12/31. 5 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   null, null, 5, 5, null, null, null, null, 'Party and Charter: 7 fish/person/day.', true, 60),
  ('scup', null, 'ri-statewide', 'salt', 'bag_limit', 'Scup Shore: 9.5". 5/1 - 12/31. 30 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-05-01', '2026-12-31', 30, 30, 9.5, null, 'total_length', 'shore', null, true, 30),
  ('scup', null, 'ri-statewide', 'salt', 'bag_limit', 'Scup Private and Rental: 11". 5/1 - 12/31. 30 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-05-01', '2026-12-31', 30, 30, 11, null, 'total_length', 'boat', 'Party/charter: 30 May 1–Aug 31; 40 Sep 1–Oct 31; 30 Nov 1–Dec 31.', true, 30),
  ('summer_flounder', null, 'ri-statewide', 'salt', 'bag_limit', 'Summer Flounder (Fluke): 19". 4/1 - 12/31. 6 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-04-01', '2026-12-31', 6, 6, 19, null, 'total_length', null, 'Special shore sites: up to 2 fish 17"+ count toward the 6; remainder 19"+.', true, 30),
  ('summer_flounder', null, 'ri-statewide', 'salt', 'season', 'Summer Flounder (Fluke): open 4/1 - 12/31.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-04-01', '2026-12-31', null, null, null, null, null, null, null, true, 30),
  ('tautog', null, 'ri-statewide', 'salt', 'bag_limit', 'Tautog: 16". Only one fish may be greater than 21". Max of 10 fish/vsl during all periods. 4/1 - 5/31: 3 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-04-01', '2026-05-31', 3, 3, 16, null, 'total_length', null, 'One fish >21"; vessel cap 10.', true, 30),
  ('tautog', null, 'ri-statewide', 'salt', 'season', 'Tautog: 6/1 - 7/31 CLOSED.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-06-01', '2026-07-31', 0, 0, null, null, null, null, 'Closed.', true, 30),
  ('tautog', null, 'ri-statewide', 'salt', 'bag_limit', 'Tautog: 16". Only one fish may be greater than 21". 8/1 - 10/14: 3 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-08-01', '2026-10-14', 3, 3, 16, null, 'total_length', null, 'One fish >21"; vessel cap 10.', true, 30),
  ('tautog', null, 'ri-statewide', 'salt', 'bag_limit', 'Tautog: 16". Only one fish may be greater than 21". 10/15 - 12/31: 5 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-10-15', '2026-12-31', 5, 5, 16, null, 'total_length', null, 'One fish >21"; vessel cap 10.', true, 30),
  ('black_sea_bass', null, 'ri-statewide', 'salt', 'bag_limit', 'Black Sea Bass General Recreational: 16". 5/16 - 12/31. 3 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-05-16', '2026-12-31', 3, 3, 16, null, 'total_length', null, 'Party/charter: 4 May 16–Aug 31; 6 Sep 1–Dec 31.', true, 30),
  ('atlantic_cod', null, 'ri-statewide', 'salt', 'prohibited', 'Cod: NA. 1/1 - 12/31. Prohibited.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   null, null, 0, 0, null, null, null, null, null, true, 30),
  ('weakfish', null, 'ri-statewide', 'salt', 'bag_limit', 'Weakfish (Squeteague): 16". 1/1 - 12/31. 1 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   null, null, 1, 1, 16, null, 'total_length', null, null, true, 60),
  ('winter_flounder', null, 'ri-statewide', 'salt', 'bag_limit', 'Winter Flounder (Blackback): 12". 3/1 - 12/31. 2 fish/person/day.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   '2026-03-01', '2026-12-31', 2, 2, 12, null, 'total_length', null, null, true, 60),
  ('winter_flounder', null, 'ri-narragansett-north-colregs', 'salt', 'prohibited', 'The harvesting or possession of winter flounder is PROHIBITED in Narragansett Bay north of the Colregs Line of Demarcation as well as in Potter Pond, Point Judith Pond, and the Harbor of Refuge.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   null, null, 0, 0, null, null, null, null, null, false, 90),
  ('american_eel', null, 'ri-statewide', 'salt', 'bag_limit', 'American eel: 9". 1/1 - 12/31. 25 eels/person/day. 50 eels/vsl/day for licensed party/charter vessels.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   null, null, 25, 25, 9, null, 'total_length', null, 'Party/charter vessel 50/day.', false, 90),
  ('haddock', null, 'ri-statewide', 'salt', 'bag_limit', 'Haddock: 18". 1/1 - 12/31. No limit.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   null, null, null, null, 18, null, 'total_length', null, 'No possession limit.', false, 120),
  ('pollock', null, 'ri-statewide', 'salt', 'bag_limit', 'Pollock: 19". 1/1 - 12/31. No limit.', 'https://dem.ri.gov/natural-resources-bureau/marine-fisheries/marine-fisheries-minimum-sizes-possession-limits', 'Rhode Island DEM — Marine Fisheries Minimum Sizes & Possession Limits (recreational)', '2026-09-01', '2026-09-03', 1,
   null, null, null, null, 19, null, 'total_length', null, 'No possession limit.', false, 120);

insert into public.reg_pack (id, version, published_at, notes) values
  ('new-york-2026-09-03', 1, '2026-09-03T18:00:00Z', 'New York (DEC recreational saltwater table, last changed 2026-05-12): marine stripers 28–31" @1 Apr 15–Dec 15 (Hudson north of GWB 23–28" Apr 1–Nov 30); fluke 19" May 4–Aug 1 then 19.5" Aug 2–Oct 15 @3; BSB 16" 3 then 6; scup shore 9.5" / vessel 11" @30; tautog LIS vs NY Bight split; bluefish 5/7; winter flounder Apr 1–May 30 @2.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('ny-marine', 'ny-dec', 'ocean_region', 'New York — Marine & Coastal District (south of George Washington Bridge)', null, '[[-74.26,40.92],[-71.85,41.3],[-71.85,40.5],[-73.9,40.4],[-74.26,40.5],[-74.26,40.92]]', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', '2026-09-03', 'Envelope for marine waters beginning at the Hudson south of the GWB + ocean/bays.'),
  ('ny-hudson-north-gwb', 'ny-dec', 'ocean_region', 'Hudson River north of the George Washington Bridge', null, null, 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', '2026-09-03', 'Striped bass slot 23–28"; river herring possession allowed Mar 15–Jun 15.'),
  ('ny-lis', 'ny-dec', 'ocean_region', 'Long Island Sound Region (east of Throgs Neck Bridge, west of Orient Point–Watch Hill line)', null, null, 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', '2026-09-03', 'Tautog LIS windows.'),
  ('ny-bight', 'ny-dec', 'ocean_region', 'NY Bight Region (marine waters outside the Long Island Sound Region)', null, null, 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', '2026-09-03', 'Tautog NY Bight windows.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('striped_bass', null, 'ny-marine', 'salt', 'bag_limit', 'Striped Bass: marine waters (beginning at the Hudson River south of George Washington Bridge) & Delaware River: Slot size 28" - 31". Possession 1. Open April 15 - Dec 15.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-04-15', '2026-12-15', 1, 1, 28, 31, 'total_length', null, null, true, 30),
  ('striped_bass', null, 'ny-hudson-north-gwb', 'salt', 'bag_limit', 'Striped Bass: Hudson River (north of George Washington Bridge): Slot size 23" - 28". Possession 1. Open April 1 - Nov 30.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-04-01', '2026-11-30', 1, 1, 23, 28, 'total_length', null, null, true, 30),
  ('striped_bass', null, 'ny-marine', 'salt', 'gear', 'Non-offset (inline) circle hooks must be used when recreationally fishing for striped bass using bait defined as any live or dead, whole or part of a marine or aquatic organism or terrestrial invertebrate. Exemption: Circle hooks are not required when fishing with an artificial lure, whether or not they are tipped with bait as previously defined.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   null, null, null, null, null, null, null, null, null, true, 30),
  ('summer_flounder', null, 'ny-marine', 'salt', 'bag_limit', 'Summer flounder (fluke): 19". Possession 3. Open May 4 - Aug 1.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-05-04', '2026-08-01', 3, 3, 19, null, 'total_length', null, 'No head/tail removal at sea except white-side fillet for bait.', true, 30),
  ('summer_flounder', null, 'ny-marine', 'salt', 'bag_limit', 'Summer flounder (fluke): 19.5". Possession 3. Open Aug 2 - Oct 15.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-08-02', '2026-10-15', 3, 3, 19.5, null, 'total_length', null, 'No head/tail removal at sea except white-side fillet for bait.', true, 30),
  ('black_sea_bass', null, 'ny-marine', 'salt', 'bag_limit', 'Black Sea Bass: 16". Possession 3. Open May 16 - Aug 31.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-05-16', '2026-08-31', 3, 3, 16, null, 'total_length', null, 'Tail filament excluded.', true, 30),
  ('black_sea_bass', null, 'ny-marine', 'salt', 'bag_limit', 'Black Sea Bass: 16". Possession 6. Open Sept 1 - Dec 31.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-09-01', '2026-12-31', 6, 6, 16, null, 'total_length', null, 'Tail filament excluded.', true, 30),
  ('scup', null, 'ny-marine', 'salt', 'bag_limit', 'Scup (Porgy): Shore-based anglers 9.5". Possession 30. Open May 1 - Dec 31.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-05-01', '2026-12-31', 30, 30, 9.5, null, 'total_length', 'shore', null, true, 30),
  ('scup', null, 'ny-marine', 'salt', 'bag_limit', 'Scup (Porgy): Vessel-based anglers 11". Possession 30. Open May 1 - Dec 31.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-05-01', '2026-12-31', 30, 30, 11, null, 'total_length', 'boat', 'Party/charter: 30 May–Aug; 40 Sep–Oct; 30 Nov–Dec.', true, 30),
  ('tautog', null, 'ny-lis', 'salt', 'season', 'Tautog (blackfish): Long Island Sound Region open April 1 - April 30 and Oct 11 - Dec 9.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-04-01', '2026-04-30', null, null, null, null, null, null, null, true, 30),
  ('tautog', null, 'ny-lis', 'salt', 'season', 'Tautog (blackfish): Long Island Sound Region open Oct 11 - Dec 9.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-10-11', '2026-12-09', null, null, null, null, null, null, null, true, 30),
  ('tautog', null, 'ny-lis', 'salt', 'bag_limit', 'Tautog (blackfish): Long Island Sound Region: 16". Possession 2. Open April 1 - April 30.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-04-01', '2026-04-30', 2, 2, 16, null, 'total_length', null, null, true, 30),
  ('tautog', null, 'ny-lis', 'salt', 'bag_limit', 'Tautog (blackfish): Long Island Sound Region: 16". Possession 3. Open Oct 11 - Dec 9.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-10-11', '2026-12-09', 3, 3, 16, null, 'total_length', null, null, true, 30),
  ('tautog', null, 'ny-bight', 'salt', 'season', 'Tautog (blackfish): NY Bight Region open April 1 - April 30 and Oct 15 - Dec 22.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-04-01', '2026-04-30', null, null, null, null, null, null, null, true, 30),
  ('tautog', null, 'ny-bight', 'salt', 'season', 'Tautog (blackfish): NY Bight Region open Oct 15 - Dec 22.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-10-15', '2026-12-22', null, null, null, null, null, null, null, true, 30),
  ('tautog', null, 'ny-bight', 'salt', 'bag_limit', 'Tautog (blackfish): NY Bight Region: 16". Possession 2. Open April 1 - April 30.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-04-01', '2026-04-30', 2, 2, 16, null, 'total_length', null, null, true, 30),
  ('tautog', null, 'ny-bight', 'salt', 'bag_limit', 'Tautog (blackfish): NY Bight Region: 16". Possession 4. Open Oct 15 - Dec 22.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-10-15', '2026-12-22', 4, 4, 16, null, 'total_length', null, null, true, 30),
  ('bluefish', null, 'ny-marine', 'salt', 'bag_limit', 'Bluefish (including "snappers"): No size limit. 5 for individuals. 7 for anglers aboard licensed party/charter boats. All year.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   null, null, 5, 5, null, null, null, null, 'Party/charter 7.', true, 60),
  ('winter_flounder', null, 'ny-marine', 'salt', 'bag_limit', 'Winter Flounder: 12". Possession 2. Open April 1 - May 30.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-04-01', '2026-05-30', 2, 2, 12, null, 'total_length', null, null, true, 60),
  ('weakfish', null, 'ny-marine', 'salt', 'bag_limit', 'Weakfish: 16" (10" filleted; 12" dressed). Possession 1. All year.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   null, null, 1, 1, 16, null, 'total_length', null, null, true, 60),
  ('atlantic_cod', null, 'ny-marine', 'salt', 'bag_limit', 'Atlantic cod: 23". Possession 5. Open Sept 1 - May 31.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   '2026-09-01', '2026-05-31', 5, 5, 23, null, 'total_length', null, 'Year-wrap window; federal SNE no-retention may be tighter.', true, 14),
  ('american_eel', null, 'ny-marine', 'salt', 'bag_limit', 'American Eel: 9". 25 for individuals. 50 for anglers aboard licensed party/charter boats. All year.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   null, null, 25, 25, 9, null, 'total_length', null, null, false, 90),
  ('cobia', null, 'ny-marine', 'salt', 'bag_limit', 'Cobia: 43". Fishing from shore: 1 per angler. Fishing from vessel: 1 per angler and a maximum of 2 per vessel. All year.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   null, null, 1, 1, 43, null, 'total_length', null, 'Vessel cap 2.', true, 60),
  ('river_herring', null, 'ny-marine', 'salt', 'prohibited', 'Anadromous river herring (alewife and blueback herring) (south of George Washington Bridge): No possession allowed.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   null, null, 0, 0, null, null, null, null, null, false, 90),
  ('american_shad', null, 'ny-marine', 'salt', 'prohibited', 'American shad: No possession allowed.', 'https://dec.ny.gov/things-to-do/saltwater-fishing/recreational-fishing-regulations', 'NYSDEC — Recreational Saltwater Fishing Regulations', '2026-05-12', '2026-09-03', 1,
   null, null, 0, 0, null, null, null, null, null, false, 90);

insert into public.reg_pack (id, version, published_at, notes) values
  ('new-jersey-2026-09-03', 1, '2026-09-03T18:00:00Z', 'New Jersey (NJDEP Attention Anglers 2026): stripers 28–31" @1 (ocean 0–3 mi year-round; other marine Mar 1–Dec 31; EEZ closed); fluke 18" @3 May 4–Sep 25 (Delaware Bay 17"; IBSP 16" @2); BSB 12.5" 10/1/10/15 windows; tautog 15" 4/4/1/5 with March and May–July closed; bluefish 5 private/shore, 7 for-hire; weakfish 13" @1.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('nj-marine', 'nj-dep', 'ocean_region', 'New Jersey — all marine waters (except named carve-outs)', null, '[[-75.55,39.8],[-73.9,40.55],[-73.9,38.85],[-75.55,38.85],[-75.55,39.8]]', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', '2026-09-03', 'Envelope. Delaware Bay and Island Beach State Park fluke carve-outs are separate areas.'),
  ('nj-delaware-bay', 'nj-dep', 'ocean_region', 'Delaware Bay & Tributaries (NJ)', null, null, 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', '2026-09-03', 'Fluke 17" @3.'),
  ('nj-ibsp', 'nj-dep', 'ocean_region', 'Island Beach State Park (shore)', null, null, 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', '2026-09-03', 'Fluke 16" @2.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('striped_bass', null, 'nj-marine', 'salt', 'bag_limit', 'Striped Bass or Hybrid Striped Bass: 1 fish at 28 inches to 31 inches. Atlantic Ocean: 0-3 miles from shore, no closed season. Greater than 3 miles from shore, closed. All Other Marine Waters: Open Mar 1 – Dec 31.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   null, null, 1, 1, 28, 31, 'total_length', null, 'EEZ closed. Bonus Program (24" to <28") is permit-only — see digest.', true, 30),
  ('summer_flounder', null, 'nj-marine', 'salt', 'bag_limit', 'Summer Flounder (Fluke) All marine waters except those noted below: 3 fish at 18 inches. Open Season: May 4 – Sept 25.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-05-04', '2026-09-25', 3, 3, 18, null, 'total_length', null, null, true, 30),
  ('summer_flounder', null, 'nj-delaware-bay', 'salt', 'bag_limit', 'Summer Flounder (Fluke) Delaware Bay & Tributaries: 3 fish at 17 inches. Open Season: May 4 – Sept 25.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-05-04', '2026-09-25', 3, 3, 17, null, 'total_length', null, null, true, 30),
  ('summer_flounder', null, 'nj-ibsp', 'salt', 'bag_limit', 'Summer Flounder (Fluke) Island Beach State Park: 2 fish at 16 inches. Open Season: May 4 – Sept 25.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-05-04', '2026-09-25', 2, 2, 16, null, 'total_length', 'shore', null, true, 30),
  ('black_sea_bass', null, 'nj-marine', 'salt', 'bag_limit', 'Black Sea Bass: 10 fish at 12.5 inches May 15 – June 21.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-05-15', '2026-06-21', 10, 10, 12.5, null, 'total_length', null, 'Caudal filament excluded.', true, 30),
  ('black_sea_bass', null, 'nj-marine', 'salt', 'bag_limit', 'Black Sea Bass: 1 fish at 12.5 inches June 22 – Sept 22.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-06-22', '2026-09-22', 1, 1, 12.5, null, 'total_length', null, 'Caudal filament excluded.', true, 30),
  ('black_sea_bass', null, 'nj-marine', 'salt', 'bag_limit', 'Black Sea Bass: 10 fish at 12.5 inches Sept 23 – Oct 31.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-09-23', '2026-10-31', 10, 10, 12.5, null, 'total_length', null, 'Caudal filament excluded.', true, 30),
  ('black_sea_bass', null, 'nj-marine', 'salt', 'bag_limit', 'Black Sea Bass: 15 fish at 12.5 inches Nov 1 – Dec 31.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-11-01', '2026-12-31', 15, 15, 12.5, null, 'total_length', null, 'Caudal filament excluded.', true, 30),
  ('tautog', null, 'nj-marine', 'salt', 'bag_limit', 'Tautog: 15 inches. 4 fish Jan 1 – Feb 28.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-01-01', '2026-02-28', 4, 4, 15, null, 'total_length', null, null, true, 30),
  ('tautog', null, 'nj-marine', 'salt', 'bag_limit', 'Tautog: 15 inches. 4 fish Apr 1 – Apr 30.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-04-01', '2026-04-30', 4, 4, 15, null, 'total_length', null, null, true, 30),
  ('tautog', null, 'nj-marine', 'salt', 'bag_limit', 'Tautog: 15 inches. 1 fish Aug 1 – Nov 15.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-08-01', '2026-11-15', 1, 1, 15, null, 'total_length', null, null, true, 30),
  ('tautog', null, 'nj-marine', 'salt', 'bag_limit', 'Tautog: 15 inches. 5 fish Nov 16 – Dec 31.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-11-16', '2026-12-31', 5, 5, 15, null, 'total_length', null, null, true, 30),
  ('bluefish', null, 'nj-marine', 'salt', 'bag_limit', 'Bluefish: Private/Shore Angler – 5 fish. For-Hire Vessel – 7 fish. Open Season: Jan 1 – Dec 31.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   null, null, 5, 5, null, null, null, null, 'For-hire 7.', true, 60),
  ('weakfish', null, 'nj-marine', 'salt', 'bag_limit', 'Weakfish: 1 fish at 13 inches. Open Season: Jan 1 – Dec 31.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   null, null, 1, 1, 13, null, 'total_length', null, null, true, 60),
  ('winter_flounder', null, 'nj-marine', 'salt', 'bag_limit', 'Winter Flounder: 2 fish at 12 inches. Open Season: Mar 1 – Dec 31.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-03-01', '2026-12-31', 2, 2, 12, null, 'total_length', null, null, true, 60),
  ('scup', null, 'nj-marine', 'salt', 'bag_limit', 'Scup (Porgy): 30 fish: Jan 1-June 30 and Sept 1-Dec 31. 10".', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-09-01', '2026-12-31', 30, 30, 10, null, 'total_length', null, 'Also open Jan 1–Jun 30 at 30/10".', true, 30),
  ('scup', null, 'nj-marine', 'salt', 'bag_limit', 'Scup (Porgy): 30 fish: Jan 1-June 30 and Sept 1-Dec 31. 10".', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-01-01', '2026-06-30', 30, 30, 10, null, 'total_length', null, null, true, 30),
  ('atlantic_cod', null, 'nj-marine', 'salt', 'bag_limit', 'Cod: 5 fish: Jan 1-May 31 and Sept 1-Dec 31. 23".', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   '2026-09-01', '2026-12-31', 5, 5, 23, null, 'total_length', null, 'Also open Jan 1–May 31.', true, 30),
  ('black_drum', null, 'nj-marine', 'salt', 'bag_limit', 'Black Drum: 3. 16".', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   null, null, 3, 3, 16, null, 'total_length', null, null, true, 60),
  ('red_drum', null, 'nj-marine', 'salt', 'bag_limit', 'Red Drum: 1. 18" to less than 27".', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   null, null, 1, 1, 18, 27, 'total_length', null, null, true, 60),
  ('american_eel', null, 'nj-marine', 'salt', 'bag_limit', 'American Eel: 25. 9".', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   null, null, 25, 25, 9, null, 'total_length', null, null, false, 90),
  ('river_herring', null, 'nj-marine', 'salt', 'prohibited', 'River Herring: CLOSED.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   null, null, 0, 0, null, null, null, null, null, false, 90),
  (null, null, 'nj-marine', 'salt', 'note', 'Fish are measured from tip of snout to tip of tail (except Black Sea Bass and Sharks). Cleaning or filleting of fish with a minimum size limit while at sea is prohibited.', 'https://dep.nj.gov/njfw/wp-content/uploads/njfw/attention-anglers-2026.pdf', 'NJDEP Fish & Wildlife — Attention Anglers 2026 Recreational Size Limits, Possession Limits and Seasons', '2026-03-01', '2026-09-03', 1,
   null, null, null, null, null, null, null, null, null, false, 90);
