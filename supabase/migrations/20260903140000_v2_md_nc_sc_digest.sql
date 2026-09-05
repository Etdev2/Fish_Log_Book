-- MD / NC / SC v2 (2026-09-03): COMAR tautog/drums/specks/Spanish + DMF pelagics/BSB + SCDNR pelagics/cobia.
-- GENERATED via gen-md-nc-sc-digest-v2.mts. Replaces wave-4 rows for these areas.

delete from public.reg_rule where reg_area_id in ('md-atlantic', 'md-chesapeake');
insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('md-atlantic', 'md-dnr', 'ocean_region', 'Maryland — Atlantic Ocean, coastal bays and tributaries', null, '[[-75.4,38.45],[-75,38],[-74.9,38.45],[-75.05,38.55],[-75.4,38.45]]', 'https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PubNotStripedBassATLCoastRec_Effective1-1-2026.pdf', '2026-09-03', 'Does not apply to Chesapeake Bay.'),
  ('md-chesapeake', 'md-dnr', 'ocean_region', 'Maryland — Chesapeake Bay and tidal tributaries', null, null, 'https://dnr.maryland.gov/fisheries/Documents/Reg_Changes/DNR-FS-2025-3_StripedBass_RecreationalSeasons.pdf', '2026-09-03', 'Excludes Susquehanna Flats specials.')
on conflict (id) do update set name = excluded.name, notes = excluded.notes, source_url = excluded.source_url;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('striped_bass', null, 'md-atlantic', 'salt', 'bag_limit', 'Effective 12:01 a.m. January 1, 2026: Anglers may keep one striped bass per person per day from the Atlantic Ocean, its coastal bays, and their tributaries. The minimum size for striped bass is 28 inches, total length. The maximum size is 31 inches, total length.', 'https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PubNotStripedBassATLCoastRec_Effective1-1-2026.pdf', 'Maryland DNR — 2026 Atlantic Coast Recreational and Charter Boat Striped Bass Fishery', '2026-01-01', '2026-09-03', 2,
   null, null, 1, 1, 28, 31, 'total_length', null, null, true, 30),
  ('striped_bass', null, 'md-chesapeake', 'salt', 'bag_limit', 'RULES FOR STRIPED BASS EFFECTIVE 4/1/2026 Chesapeake Bay and Tidal Tributaries: SEP. 1–DEC. 5 All areas open. 1 fish per day. Must be at least 19" and cannot exceed 24". Circle hook rules remain the same.', 'https://dnr.maryland.gov/fisheries/Documents/Reg_Changes/DNR-FS-2025-3_StripedBass_RecreationalSeasons.pdf', 'Maryland DNR — DNR-FS-2025-3 Striped Bass Recreational Seasons (rules effective 4/1/2026)', '2026-04-01', '2026-09-03', 2,
   '2026-09-01', '2026-12-05', 1, 1, 19, 24, 'total_length', null, null, true, 14),
  ('striped_bass', null, 'md-chesapeake', 'salt', 'season', 'AUG. 1–AUG. 31 All areas closed to striped bass fishing. CLOSED. Attempting to catch striped bass is illegal during this time period. No targeting.', 'https://dnr.maryland.gov/fisheries/Documents/Reg_Changes/DNR-FS-2025-3_StripedBass_RecreationalSeasons.pdf', 'Maryland DNR — DNR-FS-2025-3 Striped Bass Recreational Seasons (rules effective 4/1/2026)', '2026-04-01', '2026-09-03', 2,
   '2026-09-01', '2026-12-05', null, null, null, null, null, null, 'Aug closed; Dec 6–31 C&R only.', true, 14),
  ('summer_flounder', null, 'md-atlantic', 'salt', 'bag_limit', 'In State waters, the season is open January 1, 2026 – December 31, 2026. The minimum size is 17-1/2 inches from June 1, 2026 through December 31, 2026. In State waters, anglers may keep up to 4 fish per person per day.', 'https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PN_2026_SummerFlounder_Effective4_19_2026.pdf', 'Maryland DNR — 2026 Summer Flounder Fishery (effective 4/19/2026)', '2026-04-19', '2026-09-03', 2,
   '2026-06-01', '2026-12-31', 4, 4, 17.5, null, 'total_length', null, 'Federal waters 18.5" @3 May 8–Sep 30.', true, 30),
  ('summer_flounder', null, 'md-atlantic', 'salt', 'bag_limit', 'In State waters: The minimum size is 16 inches from January 1, 2026 through May 31, 2026. In State waters, anglers may keep up to 4 fish per person per day.', 'https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PN_2026_SummerFlounder_Effective4_19_2026.pdf', 'Maryland DNR — 2026 Summer Flounder Fishery (effective 4/19/2026)', '2026-04-19', '2026-09-03', 2,
   '2026-01-01', '2026-05-31', 4, 4, 16, null, 'total_length', null, null, true, 30),
  ('tautog', null, 'md-atlantic', 'salt', 'bag_limit', 'From July 1 through October 31, an individual may not catch and possess more than two tautog per day. An individual may not catch or possess a tautog less than 16 inches total length; and a tautog from May 16 through June 30.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-20', 'COMAR 08.02.05.20 — Tautog', '2020-07-16', '2026-09-03', 2,
   '2026-07-01', '2026-10-31', 2, 2, 16, null, 'total_length', null, null, true, 30),
  ('tautog', null, 'md-atlantic', 'salt', 'bag_limit', 'From November 1 through May 15 of the following year, an individual may not catch and possess more than four tautog per day.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-20', 'COMAR 08.02.05.20 — Tautog', '2020-07-16', '2026-09-03', 2,
   '2026-11-01', '2026-05-15', 4, 4, 16, null, 'total_length', null, null, true, 30),
  ('tautog', null, 'md-atlantic', 'salt', 'season', 'An individual may not catch or possess a tautog from May 16 through June 30.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-20', 'COMAR 08.02.05.20 — Tautog', '2020-07-16', '2026-09-03', 2,
   '2026-07-01', '2026-10-31', null, null, null, null, null, null, null, true, 30),
  ('tautog', null, 'md-atlantic', 'salt', 'season', 'Tautog recreational open November 1 through May 15 (closed May 16–June 30).', 'https://news.maryland.gov/dnr/2026/03/04/maryland-fishing-report-march-4-2/', 'Maryland DNR — Fishing Report March 4, 2026 (tautog 2026 season)', '2026-03-04', '2026-09-03', 2,
   '2026-11-01', '2026-05-15', null, null, null, null, null, null, null, true, 30),
  ('red_drum', null, 'md-atlantic', 'salt', 'bag_limit', 'A person may not catch or possess red drum less than 18 inches in total length or greater than 27 inches in total length. A person may not catch or possess more than one red drum per day.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-16', 'COMAR 08.02.05.16 — Red Drum', '2009-10-19', '2026-09-03', 2,
   null, null, 1, 1, 18, 27, 'total_length', null, null, true, 60),
  ('red_drum', null, 'md-chesapeake', 'salt', 'bag_limit', 'A person may not catch or possess red drum less than 18 inches in total length or greater than 27 inches in total length. A person may not catch or possess more than one red drum per day.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-16', 'COMAR 08.02.05.16 — Red Drum', '2009-10-19', '2026-09-03', 2,
   null, null, 1, 1, 18, 27, 'total_length', null, null, true, 60),
  ('black_drum', null, 'md-atlantic', 'salt', 'bag_limit', 'The daily catch and possession limit per individual is one black drum. The daily catch and possession limit per boat is six black drum. A person may not catch or possess black drum less than 16 inches in total length.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-15', 'COMAR 08.02.05.15 — Black Drum', '2019-12-30', '2026-09-03', 2,
   null, null, 1, 1, 16, null, 'total_length', null, '6 per boat.', true, 60),
  ('black_drum', null, 'md-chesapeake', 'salt', 'bag_limit', 'The daily catch and possession limit per individual is one black drum. The daily catch and possession limit per boat is six black drum. A person may not catch or possess black drum less than 16 inches in total length.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-15', 'COMAR 08.02.05.15 — Black Drum', '2019-12-30', '2026-09-03', 2,
   null, null, 1, 1, 16, null, 'total_length', null, '6 per boat.', true, 60),
  ('spotted_seatrout', null, 'md-chesapeake', 'salt', 'bag_limit', 'A recreational angler may not catch or possess spotted sea trout less than 14 inches in total length. Except for a person licensed to catch finfish for sale, a person may not catch or possess more than one weakfish and four spotted sea trout per day.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-13', 'COMAR 08.02.05.13 — Weakfish and Spotted Sea Trout', '2014-04-14', '2026-09-03', 2,
   null, null, 4, 4, 14, null, 'total_length', null, null, true, 60),
  ('weakfish', null, 'md-chesapeake', 'salt', 'bag_limit', 'A recreational angler may not catch or possess weakfish less than 13 inches in total length. Except for a person licensed to catch finfish for sale, a person may not catch or possess more than one weakfish and four spotted sea trout per day.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-13', 'COMAR 08.02.05.13 — Weakfish and Spotted Sea Trout', '2014-04-14', '2026-09-03', 2,
   null, null, 1, 1, 13, null, 'total_length', null, null, true, 60),
  ('spanish_mackerel', null, 'md-atlantic', 'salt', 'bag_limit', 'An individual may not catch or possess a Spanish mackerel less than 14 inches total length. An individual may not catch or possess more than 15 Spanish mackerel per day. The recreational season for catching Spanish mackerel is January 1 through December 31.', 'https://www.law.cornell.edu/regulations/maryland/COMAR-08-02-05-14', 'COMAR 08.02.05.14 — Spanish Mackerel', '2012-07-23', '2026-09-03', 2,
   null, null, 15, 15, 14, null, 'total_length', null, null, true, 60);

insert into public.reg_pack (id, version, published_at, notes) values
  ('maryland-2026-09-03', 2, '2026-09-03T23:45:00Z', 'Maryland DNR 2026 v2: Atlantic stripers 28–31" @1; Bay 19–24" @1 Sep 1–Dec 5 (Aug closed); fluke 16" then 17.5" @4; tautog 16" closed May 16–Jun 30 (2/day Jul–Oct, 4/day Nov–May 15); red drum 18–27" @1; black drum 16" @1 / 6 boat; specks 14" @4; weakfish 13" @1; Spanish mackerel 14" @15.')
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;

delete from public.reg_rule where reg_area_id in ('nc-coastal');
insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('nc-coastal', 'nc-dmf', 'ocean_region', 'North Carolina — coastal and joint waters', null, '[[-78.6,36.55],[-75.5,35.2],[-77.9,33.85],[-78.6,33.85],[-78.6,36.55]]', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', '2026-09-03', 'Internal CSMA stripers are closed; ocean slot is a footnote (A).')
on conflict (id) do update set name = excluded.name, notes = excluded.notes, source_url = excluded.source_url;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('red_drum', null, 'nc-coastal', 'salt', 'bag_limit', 'Red Drum (Channel Bass, Puppy Drum): 18" Min - 27" Max TL. 1/Day. Unlawful to possess red drum greater than 27" TL. Unlawful to gig, spear, or gaff red drum.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 1, 1, 18, 27, 'total_length', null, null, true, 30),
  ('southern_flounder', null, 'nc-coastal', 'salt', 'bag_limit', 'Flounder (All Species): Sep 1-14: OPEN Sep 15-30: CLOSED UNLAWFUL TO POSSESS. (Spring 2026 ocean-only window was Mar 9–22, 1 fish, 15-inch TL, hook-and-line.)', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   '2026-09-01', '2026-09-14', 1, 1, 15, null, 'total_length', null, 'Mandatory harvest reporting.', true, 7),
  ('southern_flounder', null, 'nc-coastal', 'salt', 'season', 'Flounder (All Species): Sep 1-14: OPEN. Sep 15-30: CLOSED UNLAWFUL TO POSSESS.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   '2026-09-01', '2026-09-14', null, null, null, null, null, null, null, true, 7),
  ('spotted_seatrout', null, 'nc-coastal', 'salt', 'bag_limit', 'Spotted Seatrout (Speckled Trout): 14"- 20" TL, 1 greater than 26'' TL. 3/day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 3, 3, 14, 20, 'total_length', null, 'Table allows 1 fish greater than 26" TL.', true, 30),
  ('weakfish', null, 'nc-coastal', 'salt', 'bag_limit', 'Weakfish (Gray Trout): 12" TL. 1/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 1, 1, 12, null, 'total_length', null, null, true, 60),
  ('sheepshead', null, 'nc-coastal', 'salt', 'bag_limit', 'Sheepshead: 14" TL. 5/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 5, 5, 14, null, 'total_length', null, null, true, 60),
  ('black_drum', null, 'nc-coastal', 'salt', 'bag_limit', 'Black Drum: 14" Min - 25" Max TL. 10/Day. One black drum per person per day over 25" TL is allowed.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 10, 10, 14, 25, 'total_length', null, 'One over 25" allowed.', true, 60),
  ('striped_bass', null, 'nc-coastal', 'salt', 'prohibited', 'Striped Bass: UNLAWFUL TO POSSESS (A). Albemarle Sound Management Area: SEASON CURRENTLY CLOSED; Central Southern Management Area (CSMA): Unlawful to possess striped bass (including hybrid bass); Atlantic Ocean: Year-round: 1 per person per day and a harvest slot limit of 28 inches to 31 inches TL. Unlawful to gig, spear, or gaff striped bass.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 0, 0, null, null, null, null, 'Ocean slot 28–31 @1 is footnote (A); internal CSMA is closed.', true, 14),
  ('bluefish', null, 'nc-coastal', 'salt', 'bag_limit', 'Bluefish: None minimum length. 5/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 5, 5, null, null, null, null, null, true, 60),
  ('atlantic_tarpon', null, 'nc-coastal', 'salt', 'prohibited', 'Tarpon: UNLAWFUL TO POSSESS.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 0, 0, null, null, null, null, null, false, 120),
  ('king_mackerel', null, 'nc-coastal', 'salt', 'bag_limit', 'King Mackerel: 24" FL. 3/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 3, 3, 24, null, 'fork_length', null, null, true, 30),
  ('spanish_mackerel', null, 'nc-coastal', 'salt', 'bag_limit', 'Spanish Mackerel: 12" FL. 15/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 15, 15, 12, null, 'fork_length', null, null, true, 30),
  ('dorado', null, 'nc-coastal', 'salt', 'bag_limit', 'Dolphin: 10/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 10, 10, null, null, null, null, null, true, 30),
  ('wahoo', null, 'nc-coastal', 'salt', 'bag_limit', 'Wahoo: 2/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 2, 2, null, null, null, null, null, true, 30),
  ('cobia', null, 'nc-coastal', 'salt', 'bag_limit', 'Cobia: 36" FL. 1/Day. Recreational cobia is proclamation-managed; confirm the current proclamation before keeping a fish.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 1, 1, 36, null, 'fork_length', null, 'Confirm proclamation.', true, 14),
  ('black_sea_bass', null, 'nc-coastal', 'salt', 'bag_limit', 'Black Sea Bass north of Cape Hatteras: 13" TL. 15/Day. Season May 1–December 31. South of Cape Hatteras: 13" TL, 7/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   '2026-05-01', '2026-12-31', 15, 15, 13, null, 'total_length', null, 'North of Cape Hatteras. South of Hatteras is 7/day year-round on the same table.', true, 14),
  ('scup', null, 'nc-coastal', 'salt', 'bag_limit', 'Scup north of Cape Hatteras: 9" TL. 30/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 30, 30, 9, null, 'total_length', null, 'North of Cape Hatteras.', true, 30),
  ('red_snapper', null, 'nc-coastal', 'salt', 'prohibited', 'Red snapper: prohibited in coastal and joint waters. Snapper-grouper species are managed by proclamation. It is unlawful to take both the state and federal bag limit of the same species on the same trip.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 2,
   null, null, 0, 0, null, null, null, null, null, true, 14);

insert into public.reg_pack (id, version, published_at, notes) values
  ('north-carolina-2026-09-03', 2, '2026-09-03T23:45:00Z', 'NC DMF rec table (effective 2026-09-02) v2: drums/flounder/specks as v1; king 24" FL @3; Spanish 12" FL @15; dolphin @10; wahoo @2; cobia 36" FL @1; BSB 13" @15 N of Hatteras May 1–Dec 31 (7 S of Hatteras); scup 9" @30 N of Hatteras; red snapper prohibited in coastal/joint waters.')
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;

delete from public.reg_rule where reg_area_id in ('sc-state-waters');
insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('sc-state-waters', 'sc-dnr', 'ocean_region', 'South Carolina — state waters (saltwater-freshwater line to 3 nm)', null, '[[-80.9,33.85],[-78.5,32.1],[-80.85,32.05],[-81.1,32.5],[-80.9,33.85]]', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', '2026-09-03', 'Red drum possession prohibited in federal waters.')
on conflict (id) do update set name = excluded.name, notes = excluded.notes, source_url = excluded.source_url;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('red_drum', null, 'sc-state-waters', 'salt', 'bag_limit', 'Red Drum: 1 per person per day (state waters) not to exceed 2 per boat per day. Possession prohibited in federal waters. 18-inch to 25-inch TL. May only be taken by rod & reel and gig. May not be harvested by gig Dec. 1 - Feb. 28. Effective July 1, 2026 (Act No. 231).', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 1, 1, 18, 25, 'total_length', null, '2 per boat cap.', true, 30),
  ('spotted_seatrout', null, 'sc-state-waters', 'salt', 'bag_limit', 'Spotted Seatrout: 10 per person per day. 14-inch TL. May only be taken by rod & reel and gig. May not be harvested by gig Dec. 1 - Feb. 28.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 10, 10, 14, null, 'total_length', null, null, true, 30),
  ('southern_flounder', null, 'sc-state-waters', 'salt', 'bag_limit', 'Flounders (Southern, Summer & Gulf): 5 per person per day not to exceed 10 per boat per day. 16-inch TL. Bag limit applies to hook and line or gig.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 5, 5, 16, null, 'total_length', null, '10 per boat.', true, 30),
  ('striped_bass', null, 'sc-state-waters', 'salt', 'season', 'Striped Bass: Possession prohibited: June 16 - Sept. 30 except in lower reach of the Savannah River. 3 fish per person per day: Oct. 1 - June 15 except in lower reach of the Savannah River. 26 inch TL. May only be taken by rod & reel.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   '2026-10-01', '2026-06-15', 3, 3, 26, null, 'total_length', null, 'Closed Jun 16–Sep 30 (wraps New Year).', true, 14),
  ('black_drum', null, 'sc-state-waters', 'salt', 'bag_limit', 'Black Drum: 5 per person per day. 14-inch to 27-inch TL.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 5, 5, 14, 27, 'total_length', null, null, true, 60),
  ('sheepshead', null, 'sc-state-waters', 'salt', 'bag_limit', 'Sheepshead: 10 per person per day not to exceed 30 per boat per day. 14-inch TL.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 10, 10, 14, null, 'total_length', null, '30 per boat.', true, 60),
  ('weakfish', null, 'sc-state-waters', 'salt', 'bag_limit', 'Weakfish: 1 per person per day. 12-inch TL.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 1, 1, 12, null, 'total_length', null, null, true, 60),
  ('bluefish', null, 'sc-state-waters', 'salt', 'bag_limit', 'Bluefish: 5 per person per day (7 per person in the for-hire fishery).', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 5, 5, null, null, null, null, 'For-hire 7.', true, 60),
  ('cobia', null, 'sc-state-waters', 'salt', 'bag_limit', 'Cobia: 36-inch FL. 1 per person per day not to exceed 3 per boat per day south of 32°31′N (Jeremy Inlet). 1 per person not to exceed 6 per boat north of 32°31′N and in federal waters. Closed May 1–31 south of 32°31′N.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 1, 1, 36, null, 'fork_length', null, 'May 1–31 closed south of Jeremy Inlet / 32°31′N.', true, 14),
  ('dorado', null, 'sc-state-waters', 'salt', 'bag_limit', 'Dolphin: 20-inch FL. 10 per person per day not to exceed 54 per boat per day.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 10, 10, 20, null, 'fork_length', null, '54 per boat.', true, 30),
  ('king_mackerel', null, 'sc-state-waters', 'salt', 'bag_limit', 'King Mackerel: 24-inch FL. 3 per person per day.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 3, 3, 24, null, 'fork_length', null, null, true, 30),
  ('spanish_mackerel', null, 'sc-state-waters', 'salt', 'bag_limit', 'Spanish Mackerel: 12-inch FL. 15 per person per day.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 15, 15, 12, null, 'fork_length', null, null, true, 30),
  ('wahoo', null, 'sc-state-waters', 'salt', 'bag_limit', 'Wahoo: 2 per person per day.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 2, 2, null, null, null, null, null, true, 30),
  ('atlantic_tarpon', null, 'sc-state-waters', 'salt', 'bag_limit', 'Tarpon: 77-inch FL. 1 per person per day.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 1, 1, 77, null, 'fork_length', null, null, true, 60),
  ('tripletail', null, 'sc-state-waters', 'salt', 'bag_limit', 'Tripletail: 18-inch TL. 3 per person per day not to exceed 9 per boat per day.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 2,
   null, null, 3, 3, 18, null, 'total_length', null, '9 per boat.', true, 60);

insert into public.reg_pack (id, version, published_at, notes) values
  ('south-carolina-2026-09-03', 2, '2026-09-03T23:45:00Z', 'SCDNR 2026-27 v2: drums/flounder/trout as v1; cobia 36" FL @1 (May 1–31 closed south of 32°31′N); dolphin 20" FL @10 / 54 boat; king 24" FL @3; Spanish 12" FL @15; wahoo @2; tarpon 77" FL @1; tripletail 18" @3 / 9 boat.')
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;
