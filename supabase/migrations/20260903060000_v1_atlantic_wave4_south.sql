-- Atlantic wave 4 (2026-09-03): DE DNREC, MD DNR, VA MRC, NC DMF, SC DNR, GA CRD
-- GENERATED via gen-atlantic-wave4.mts. Insert-only.

insert into public.reg_pack (id, version, published_at, notes) values
  ('delaware-2026-09-03', 1, '2026-09-03T22:00:00Z', 'Delaware DNREC 2026: stripers 28–31" @1 (20–25" Jul 1–Aug 31 in DE River/Bay/tributaries); tautog 16" @4 Jan 1–May 15 and Jul 1–Dec 31; fluke 16" then 17.5" @4; BSB 13" @15 May 15–Sep 30 and Oct 10–Dec 31; red drum 20–27" @5 state waters.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('de-tidal', 'de-dnrec', 'ocean_region', 'Delaware — state tidal / ocean to 3 nm', null, '[[-75.7,39.85],[-75,38.45],[-74.85,38.45],[-75.05,39.85],[-75.7,39.85]]', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=1&species=55', '2026-09-03', 'Federal waters closed to striped bass. EEZ follows NOAA.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('striped_bass', null, 'de-tidal', 'salt', 'bag_limit', 'Daily Limit / Person: 1 in State of Delaware waters (coast to 3 miles offshore), except catch & release only on spawning grounds April 1 to May 31. Size Limit: 28 inches to 31 inches, except 20 inches to 25 inches from July 1 through August 31 in the Delaware River, Delaware Bay and their tributaries. CLOSED in Federal waters.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=1&species=55', 'Delaware DNREC Fish Facts — Striped Bass', '2026-01-01', '2026-09-03', 1,
   null, null, 1, 1, 28, 31, 'total_length', null, 'Bay/River 20–25" Jul 1–Aug 31.', true, 30),
  ('striped_bass', null, 'de-tidal', 'salt', 'gear', 'In 2021, a new regulation requires using inline circle hooks when fishing for striped bass using cut or whole natural baits like clams, squid, mackerel, menhaden, seaworms, or eels.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=1&species=55', 'Delaware DNREC Fish Facts — Striped Bass', '2026-01-01', '2026-09-03', 1,
   null, null, null, null, null, null, null, null, null, true, 60),
  ('tautog', null, 'de-tidal', 'salt', 'bag_limit', 'Tautog: Season January 1 to May 15 July 1 to December 31. Size Limit 16 inch minimum (total length). Daily Limit / Person 4.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=187', 'Delaware DNREC Fish Facts — Tautog', '2026-01-01', '2026-09-03', 1,
   '2026-07-01', '2026-12-31', 4, 4, 16, null, 'total_length', null, 'Also open Jan 1–May 15.', true, 30),
  ('tautog', null, 'de-tidal', 'salt', 'season', 'Tautog season: January 1 to May 15 and July 1 to December 31.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=187', 'Delaware DNREC Fish Facts — Tautog', '2026-01-01', '2026-09-03', 1,
   '2026-01-01', '2026-05-15', null, null, null, null, null, null, null, true, 30),
  ('summer_flounder', null, 'de-tidal', 'salt', 'bag_limit', 'Summer Flounder: Season Open Year-Round. Size Limit January 1 - May 31: 16 inch minimum (total length) June 1 - December 31: 17.5 inch minimum (total length). Daily Limit / Person 4.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=185', 'Delaware DNREC Fish Facts — Summer Flounder', '2026-01-01', '2026-09-03', 1,
   '2026-06-01', '2026-12-31', 4, 4, 17.5, null, 'total_length', null, null, true, 30),
  ('summer_flounder', null, 'de-tidal', 'salt', 'bag_limit', 'Summer Flounder: January 1 - May 31: 16 inch minimum (total length). Daily Limit / Person 4.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=185', 'Delaware DNREC Fish Facts — Summer Flounder', '2026-01-01', '2026-09-03', 1,
   '2026-01-01', '2026-05-31', 4, 4, 16, null, 'total_length', null, null, true, 30),
  ('black_sea_bass', null, 'de-tidal', 'salt', 'bag_limit', 'Black Sea Bass: Season May 15 through September 30 and October 10 through December 31. Size Limit 13 inch minimum (measured from the tip of the snout or jaw (mouth shut) to the farthest extremity of the tail, not including the tail filament). Daily Limit / Person 15.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=93', 'Delaware DNREC Fish Facts — Black Sea Bass', '2026-01-01', '2026-09-03', 1,
   '2026-05-15', '2026-09-30', 15, 15, 13, null, 'total_length', null, 'Filament excluded.', true, 30),
  ('black_sea_bass', null, 'de-tidal', 'salt', 'bag_limit', 'Black Sea Bass: Season May 15 through September 30 and October 10 through December 31. Size Limit 13 inch minimum. Daily Limit / Person 15.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=93', 'Delaware DNREC Fish Facts — Black Sea Bass', '2026-01-01', '2026-09-03', 1,
   '2026-10-10', '2026-12-31', 15, 15, 13, null, 'total_length', null, 'Filament excluded.', true, 30),
  ('red_drum', null, 'de-tidal', 'salt', 'bag_limit', 'Red Drum: Season Open Year-Round in State of Delaware waters (coast to 3 miles offshore) CLOSED in Federal waters. Size Limit 20 to 27 inches (total length). Daily Limit / Person 5 in State of Delaware waters.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=150', 'Delaware DNREC Fish Facts — Red Drum', '2026-01-01', '2026-09-03', 1,
   null, null, 5, 5, 20, 27, 'total_length', null, 'EEZ closed.', true, 60);

insert into public.reg_pack (id, version, published_at, notes) values
  ('maryland-2026-09-03', 1, '2026-09-03T22:00:00Z', 'Maryland DNR 2026: Atlantic coast stripers 28–31" @1; Chesapeake 19–24" @1 with Aug closed / Dec 6–31 C&R; state-water fluke 16" Jan–May then 17.5" @4 year-round.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('md-atlantic', 'md-dnr', 'ocean_region', 'Maryland — Atlantic Ocean, coastal bays and tributaries', null, '[[-75.4,38.45],[-75,38],[-74.9,38.45],[-75.05,38.55],[-75.4,38.45]]', 'https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PubNotStripedBassATLCoastRec_Effective1-1-2026.pdf', '2026-09-03', 'Does not apply to Chesapeake Bay.'),
  ('md-chesapeake', 'md-dnr', 'ocean_region', 'Maryland — Chesapeake Bay and tidal tributaries', null, null, 'https://dnr.maryland.gov/fisheries/Documents/Reg_Changes/DNR-FS-2025-3_StripedBass_RecreationalSeasons.pdf', '2026-09-03', 'Excludes Susquehanna Flats specials.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('striped_bass', null, 'md-atlantic', 'salt', 'bag_limit', 'Effective 12:01 a.m. January 1, 2026: Anglers may keep one striped bass per person per day from the Atlantic Ocean, its coastal bays, and their tributaries. The minimum size for striped bass is 28 inches, total length. The maximum size is 31 inches, total length.', 'https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PubNotStripedBassATLCoastRec_Effective1-1-2026.pdf', 'Maryland DNR — 2026 Atlantic Coast Recreational and Charter Boat Striped Bass Fishery', '2026-01-01', '2026-09-03', 1,
   null, null, 1, 1, 28, 31, 'total_length', null, null, true, 30),
  ('striped_bass', null, 'md-chesapeake', 'salt', 'bag_limit', 'RULES FOR STRIPED BASS EFFECTIVE 4/1/2026 Chesapeake Bay and Tidal Tributaries: SEP. 1–DEC. 5 All areas open. 1 fish per day. Must be at least 19" and cannot exceed 24". Circle hook rules remain the same.', 'https://dnr.maryland.gov/fisheries/Documents/Reg_Changes/DNR-FS-2025-3_StripedBass_RecreationalSeasons.pdf', 'Maryland DNR — DNR-FS-2025-3 Striped Bass Recreational Seasons (rules effective 4/1/2026)', '2026-04-01', '2026-09-03', 1,
   '2026-09-01', '2026-12-05', 1, 1, 19, 24, 'total_length', null, null, true, 14),
  ('striped_bass', null, 'md-chesapeake', 'salt', 'season', 'AUG. 1–AUG. 31 All areas closed to striped bass fishing. CLOSED. Attempting to catch striped bass is illegal during this time period. No targeting.', 'https://dnr.maryland.gov/fisheries/Documents/Reg_Changes/DNR-FS-2025-3_StripedBass_RecreationalSeasons.pdf', 'Maryland DNR — DNR-FS-2025-3 Striped Bass Recreational Seasons (rules effective 4/1/2026)', '2026-04-01', '2026-09-03', 1,
   '2026-09-01', '2026-12-05', null, null, null, null, null, null, 'Aug closed; Dec 6–31 C&R only.', true, 14),
  ('summer_flounder', null, 'md-atlantic', 'salt', 'bag_limit', 'In State waters, the season is open January 1, 2026 – December 31, 2026. The minimum size is 17-1/2 inches from June 1, 2026 through December 31, 2026. In State waters, anglers may keep up to 4 fish per person per day.', 'https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PN_2026_SummerFlounder_Effective4_19_2026.pdf', 'Maryland DNR — 2026 Summer Flounder Fishery (effective 4/19/2026)', '2026-04-19', '2026-09-03', 1,
   '2026-06-01', '2026-12-31', 4, 4, 17.5, null, 'total_length', null, 'Federal waters 18.5" @3 May 8–Sep 30.', true, 30),
  ('summer_flounder', null, 'md-atlantic', 'salt', 'bag_limit', 'In State waters: The minimum size is 16 inches from January 1, 2026 through May 31, 2026. In State waters, anglers may keep up to 4 fish per person per day.', 'https://dnr.maryland.gov/fisheries/Documents/Public_Notices/PN_2026_SummerFlounder_Effective4_19_2026.pdf', 'Maryland DNR — 2026 Summer Flounder Fishery (effective 4/19/2026)', '2026-04-19', '2026-09-03', 1,
   '2026-01-01', '2026-05-31', 4, 4, 16, null, 'total_length', null, null, true, 30);

insert into public.reg_pack (id, version, published_at, notes) values
  ('virginia-2026-09-03', 1, '2026-09-03T22:00:00Z', 'Virginia MRC: coastal stripers 28–31" @1 (open Jan 1–Mar 31 and May 16–Dec 31); BSB 13" @15 May 11–Dec 31 (2026).')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('va-coast', 'va-mrc', 'ocean_region', 'Virginia — coastal / state marine waters', null, '[[-76.4,38.05],[-75.4,36.55],[-75.3,36.55],[-75.9,38.05],[-76.4,38.05]]', 'https://law.lis.virginia.gov/admincode/title4/agency20/chapter950/section45/', '2026-09-03', 'Chesapeake Bay striped-bass seasons are a separate VMRC chapter — not encoded here.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('striped_bass', null, 'va-coast', 'salt', 'bag_limit', '4 VAC 20-252-110. Coastal area striped bass recreational fishery. A. The open seasons for the coastal area striped bass recreational fishery shall be January 1 through March 31 and May 16 through December 31, inclusive. B. The minimum size limit shall be 28 inches total length. C. The maximum size limit shall be 31 inches total length. D. The daily possession limit shall be one fish per person.', 'https://www.mrc.virginia.gov/Notices/2024/2024-03-26-RC252-draft.pdf', 'Virginia MRC — 4VAC 20-252 coastal area striped bass recreational fishery', '2024-03-26', '2026-09-03', 1,
   '2026-05-16', '2026-12-31', 1, 1, 28, 31, 'total_length', null, 'Also open Jan 1–Mar 31.', true, 30),
  ('striped_bass', null, 'va-coast', 'salt', 'season', 'The open seasons for the coastal area striped bass recreational fishery shall be January 1 through March 31 and May 16 through December 31, inclusive.', 'https://www.mrc.virginia.gov/Notices/2024/2024-03-26-RC252-draft.pdf', 'Virginia MRC — 4VAC 20-252 coastal area striped bass recreational fishery', '2024-03-26', '2026-09-03', 1,
   '2026-01-01', '2026-03-31', null, null, null, null, null, null, null, true, 30),
  ('black_sea_bass', null, 'va-coast', 'salt', 'bag_limit', 'A. It shall be unlawful for any person fishing with hook-and-line, rod and reel, spear, gig, or other recreational gear to possess more than 15 black sea bass. C. In 2026, the open recreational fishing season shall be from May 11 through December 31.', 'https://law.lis.virginia.gov/admincode/title4/agency20/chapter950/section45/', '4VAC20-950-45. Recreational possession limits and seasons (black sea bass)', '2026-01-01', '2026-09-03', 1,
   '2026-05-11', '2026-12-31', 15, 15, null, null, null, null, 'Size minimum lives in a companion VMRC chapter; this row is bag+2026 season only.', true, 30);

insert into public.reg_pack (id, version, published_at, notes) values
  ('north-carolina-2026-09-03', 1, '2026-09-03T22:00:00Z', 'NC DMF rec table (effective 2026-09-02): red drum 18–27" @1; flounder open Sep 1–14 then closed; speckled trout 14–20" / 3/day; weakfish 12" @1; sheepshead 14" @5; CSMA/internal stripers unlawful, Atlantic Ocean 28–31" @1.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('nc-coastal', 'nc-dmf', 'ocean_region', 'North Carolina — coastal and joint waters', null, '[[-78.6,36.55],[-75.5,35.2],[-77.9,33.85],[-78.6,33.85],[-78.6,36.55]]', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', '2026-09-03', 'Internal CSMA stripers are closed; ocean slot is a footnote (A).')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('red_drum', null, 'nc-coastal', 'salt', 'bag_limit', 'Red Drum (Channel Bass, Puppy Drum): 18" Min - 27" Max TL. 1/Day. Unlawful to possess red drum greater than 27" TL. Unlawful to gig, spear, or gaff red drum.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   null, null, 1, 1, 18, 27, 'total_length', null, null, true, 30),
  ('southern_flounder', null, 'nc-coastal', 'salt', 'bag_limit', 'Flounder (All Species): Sep 1-14: OPEN Sep 15-30: CLOSED UNLAWFUL TO POSSESS. (Spring 2026 ocean-only window was Mar 9–22, 1 fish, 15-inch TL, hook-and-line.)', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   '2026-09-01', '2026-09-14', 1, 1, 15, null, 'total_length', null, 'Mandatory harvest reporting.', true, 7),
  ('southern_flounder', null, 'nc-coastal', 'salt', 'season', 'Flounder (All Species): Sep 1-14: OPEN. Sep 15-30: CLOSED UNLAWFUL TO POSSESS.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   '2026-09-01', '2026-09-14', null, null, null, null, null, null, null, true, 7),
  ('spotted_seatrout', null, 'nc-coastal', 'salt', 'bag_limit', 'Spotted Seatrout (Speckled Trout): 14"- 20" TL, 1 greater than 26'' TL. 3/day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   null, null, 3, 3, 14, 20, 'total_length', null, 'Table allows 1 fish greater than 26" TL.', true, 30),
  ('weakfish', null, 'nc-coastal', 'salt', 'bag_limit', 'Weakfish (Gray Trout): 12" TL. 1/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   null, null, 1, 1, 12, null, 'total_length', null, null, true, 60),
  ('sheepshead', null, 'nc-coastal', 'salt', 'bag_limit', 'Sheepshead: 14" TL. 5/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   null, null, 5, 5, 14, null, 'total_length', null, null, true, 60),
  ('black_drum', null, 'nc-coastal', 'salt', 'bag_limit', 'Black Drum: 14" Min - 25" Max TL. 10/Day. One black drum per person per day over 25" TL is allowed.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   null, null, 10, 10, 14, 25, 'total_length', null, 'One over 25" allowed.', true, 60),
  ('striped_bass', null, 'nc-coastal', 'salt', 'prohibited', 'Striped Bass: UNLAWFUL TO POSSESS (A). Albemarle Sound Management Area: SEASON CURRENTLY CLOSED; Central Southern Management Area (CSMA): Unlawful to possess striped bass (including hybrid bass); Atlantic Ocean: Year-round: 1 per person per day and a harvest slot limit of 28 inches to 31 inches TL. Unlawful to gig, spear, or gaff striped bass.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   null, null, 0, 0, null, null, null, null, 'Ocean slot 28–31 @1 is footnote (A); internal CSMA is closed.', true, 14),
  ('bluefish', null, 'nc-coastal', 'salt', 'bag_limit', 'Bluefish: None minimum length. 5/Day.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   null, null, 5, 5, null, null, null, null, null, true, 60),
  ('atlantic_tarpon', null, 'nc-coastal', 'salt', 'prohibited', 'Tarpon: UNLAWFUL TO POSSESS.', 'https://www.deq.nc.gov/about/divisions/marine-fisheries/rules-proclamations-and-size-and-bag-limits/recreational-size-and-bag-limits', 'NC DEQ DMF — Recreational Size and Bag Limits (effective September 2, 2026)', '2026-09-02', '2026-09-03', 1,
   null, null, 0, 0, null, null, null, null, null, false, 120);

insert into public.reg_pack (id, version, published_at, notes) values
  ('south-carolina-2026-09-03', 1, '2026-09-03T22:00:00Z', 'SCDNR 2026-27 (updated 2026-08-11): red drum 18–25" @1 / 2 per boat (Act 231 Jul 1 2026); trout 14" @10; flounder 16" @5 not to exceed 10/boat; stripers closed Jun 16–Sep 30 in salt water.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('sc-state-waters', 'sc-dnr', 'ocean_region', 'South Carolina — state waters (saltwater-freshwater line to 3 nm)', null, '[[-80.9,33.85],[-78.5,32.1],[-80.85,32.05],[-81.1,32.5],[-80.9,33.85]]', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', '2026-09-03', 'Red drum possession prohibited in federal waters.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('red_drum', null, 'sc-state-waters', 'salt', 'bag_limit', 'Red Drum: 1 per person per day (state waters) not to exceed 2 per boat per day. Possession prohibited in federal waters. 18-inch to 25-inch TL. May only be taken by rod & reel and gig. May not be harvested by gig Dec. 1 - Feb. 28. Effective July 1, 2026 (Act No. 231).', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 1,
   null, null, 1, 1, 18, 25, 'total_length', null, '2 per boat cap.', true, 30),
  ('spotted_seatrout', null, 'sc-state-waters', 'salt', 'bag_limit', 'Spotted Seatrout: 10 per person per day. 14-inch TL. May only be taken by rod & reel and gig. May not be harvested by gig Dec. 1 - Feb. 28.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 1,
   null, null, 10, 10, 14, null, 'total_length', null, null, true, 30),
  ('southern_flounder', null, 'sc-state-waters', 'salt', 'bag_limit', 'Flounders (Southern, Summer & Gulf): 5 per person per day not to exceed 10 per boat per day. 16-inch TL. Bag limit applies to hook and line or gig.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 1,
   null, null, 5, 5, 16, null, 'total_length', null, '10 per boat.', true, 30),
  ('striped_bass', null, 'sc-state-waters', 'salt', 'season', 'Striped Bass: Possession prohibited: June 16 - Sept. 30 except in lower reach of the Savannah River. 3 fish per person per day: Oct. 1 - June 15 except in lower reach of the Savannah River. 26 inch TL. May only be taken by rod & reel.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 1,
   '2026-10-01', '2026-06-15', 3, 3, 26, null, 'total_length', null, 'Closed Jun 16–Sep 30 (wraps New Year).', true, 14),
  ('black_drum', null, 'sc-state-waters', 'salt', 'bag_limit', 'Black Drum: 5 per person per day. 14-inch to 27-inch TL.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 1,
   null, null, 5, 5, 14, 27, 'total_length', null, null, true, 60),
  ('sheepshead', null, 'sc-state-waters', 'salt', 'bag_limit', 'Sheepshead: 10 per person per day not to exceed 30 per boat per day. 14-inch TL.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 1,
   null, null, 10, 10, 14, null, 'total_length', null, '30 per boat.', true, 60),
  ('weakfish', null, 'sc-state-waters', 'salt', 'bag_limit', 'Weakfish: 1 per person per day. 12-inch TL.', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 1,
   null, null, 1, 1, 12, null, 'total_length', null, null, true, 60),
  ('bluefish', null, 'sc-state-waters', 'salt', 'bag_limit', 'Bluefish: 5 per person per day (7 per person in the for-hire fishery).', 'https://www.eregulations.com/southcarolina/fishing/finfish-size-catch-limits', 'South Carolina DNR — Finfish Size & Catch Limits (Last Updated August 11, 2026)', '2026-08-11', '2026-09-03', 1,
   null, null, 5, 5, null, null, null, null, 'For-hire 7.', true, 60);

insert into public.reg_pack (id, version, published_at, notes) values
  ('georgia-2026-09-03', 1, '2026-09-03T22:00:00Z', 'Georgia CRD recreational table: red drum 14–23" @5 rod-and-reel gamefish; speckled trout 14" @15; flounder 12" @15; stripers 22" @2 saltwater / 27" Savannah; weakfish 13" @1.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('ga-state-waters', 'ga-crd', 'ocean_region', 'Georgia — state waters (0–3 nm)', null, '[[-81.8,32.1],[-80.8,30.7],[-81.45,30.7],[-81.8,32.1]]', 'https://coastalgadnr.org/limits', '2026-09-03', 'Federal 3–200 nm follows SAFMC.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('red_drum', null, 'ga-state-waters', 'salt', 'bag_limit', 'Red Drum: Season: All year. Limit: 5. Minimum size: 14" TL (Maximum 23" TL). Red Drum are a gamefish in Georgia [O.C.G.A. 27-1-2 (36)(I)]. As gamefish, Red Drum may only be fished for with pole and line (rod/reel) [O.C.G.A. 27-4-5].', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   null, null, 5, 5, 14, 23, 'total_length', null, 'Rod and reel only.', true, 30),
  ('spotted_seatrout', null, 'ga-state-waters', 'salt', 'bag_limit', 'Spotted Seatrout: Season: All year. Limit: 15. Minimum size: 14" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   null, null, 15, 15, 14, null, 'total_length', null, null, true, 30),
  ('southern_flounder', null, 'ga-state-waters', 'salt', 'bag_limit', 'Flounder: Season: All year. Limit: 15. Minimum size: 12" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   null, null, 15, 15, 12, null, 'total_length', null, null, true, 60),
  ('striped_bass', null, 'ga-state-waters', 'salt', 'bag_limit', 'Striped Bass: Saltwater Season: All year. Limit: 2. Minimum size: 22" TL. Savannah River Season: All year. Limit: 2. Minimum size: 27" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   null, null, 2, 2, 22, null, 'total_length', null, 'Savannah River 27" min.', true, 60),
  ('weakfish', null, 'ga-state-waters', 'salt', 'bag_limit', 'Weakfish: Season: All year. Limit: 1. Minimum size: 13" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   null, null, 1, 1, 13, null, 'total_length', null, null, true, 60),
  ('black_drum', null, 'ga-state-waters', 'salt', 'bag_limit', 'Black Drum: Season: All year. Limit: 15. Minimum size: 14" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   null, null, 15, 15, 14, null, 'total_length', null, null, true, 60),
  ('sheepshead', null, 'ga-state-waters', 'salt', 'bag_limit', 'Sheepshead: Season: All year. Limit: 15. Minimum size: 10" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   null, null, 15, 15, 10, null, 'fork_length', null, null, true, 60),
  ('cobia', null, 'ga-state-waters', 'salt', 'bag_limit', 'Cobia: Season: March 1 - Oct. 31. Limit: 1 per angler, maximum 6 per boat. Minimum size: 36" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   '2026-03-01', '2026-10-31', 1, 1, 36, null, 'fork_length', null, '6 per boat.', true, 30),
  ('bluefish', null, 'ga-state-waters', 'salt', 'bag_limit', 'Bluefish: Season: May 1 - Feb. 28 annually. Limit: 15. Minimum size: 12" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   '2026-05-01', '2026-02-28', 15, 15, 12, null, 'fork_length', null, 'Wraps New Year''s.', true, 60),
  ('atlantic_tarpon', null, 'ga-state-waters', 'salt', 'bag_limit', 'Tarpon: Season: All year. Limit: 1. Minimum size: 68" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 1,
   null, null, 1, 1, 68, null, 'fork_length', null, null, true, 90);
