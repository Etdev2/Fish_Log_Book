-- DE / GA v2 (2026-09-03): DNREC cobia/Spanish/weakfish/bluefish + CRD pelagics/BSB/tripletail/snapper.
-- GENERATED via gen-de-ga-digest-v2.mts. Replaces wave-4 rows for these areas.

delete from public.reg_rule where reg_area_id in ('de-tidal');
insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('de-tidal', 'de-dnrec', 'ocean_region', 'Delaware — state tidal / ocean to 3 nm', null, '[[-75.7,39.85],[-75,38.45],[-74.85,38.45],[-75.05,39.85],[-75.7,39.85]]', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=1&species=55', '2026-09-03', 'Federal waters closed to striped bass. EEZ follows NOAA.')
on conflict (id) do update set name = excluded.name, notes = excluded.notes, source_url = excluded.source_url;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('striped_bass', null, 'de-tidal', 'salt', 'bag_limit', 'Daily Limit / Person: 1 in State of Delaware waters (coast to 3 miles offshore), except catch & release only on spawning grounds April 1 to May 31. Size Limit: 28 inches to 31 inches, except 20 inches to 25 inches from July 1 through August 31 in the Delaware River, Delaware Bay and their tributaries. CLOSED in Federal waters.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=1&species=55', 'Delaware DNREC Fish Facts — Striped Bass', '2026-01-01', '2026-09-03', 2,
   null, null, 1, 1, 28, 31, 'total_length', null, 'Bay/River 20–25" Jul 1–Aug 31.', true, 30),
  ('striped_bass', null, 'de-tidal', 'salt', 'gear', 'In 2021, a new regulation requires using inline circle hooks when fishing for striped bass using cut or whole natural baits like clams, squid, mackerel, menhaden, seaworms, or eels.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=1&species=55', 'Delaware DNREC Fish Facts — Striped Bass', '2026-01-01', '2026-09-03', 2,
   null, null, null, null, null, null, null, null, null, true, 60),
  ('tautog', null, 'de-tidal', 'salt', 'bag_limit', 'Tautog: Season January 1 to May 15 July 1 to December 31. Size Limit 16 inch minimum (total length). Daily Limit / Person 4.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=187', 'Delaware DNREC Fish Facts — Tautog', '2026-01-01', '2026-09-03', 2,
   '2026-07-01', '2026-12-31', 4, 4, 16, null, 'total_length', null, 'Also open Jan 1–May 15.', true, 30),
  ('tautog', null, 'de-tidal', 'salt', 'season', 'Tautog season: January 1 to May 15 and July 1 to December 31.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=187', 'Delaware DNREC Fish Facts — Tautog', '2026-01-01', '2026-09-03', 2,
   '2026-01-01', '2026-05-15', null, null, null, null, null, null, null, true, 30),
  ('summer_flounder', null, 'de-tidal', 'salt', 'bag_limit', 'Summer Flounder: Season Open Year-Round. Size Limit January 1 - May 31: 16 inch minimum (total length) June 1 - December 31: 17.5 inch minimum (total length). Daily Limit / Person 4.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=185', 'Delaware DNREC Fish Facts — Summer Flounder', '2026-01-01', '2026-09-03', 2,
   '2026-06-01', '2026-12-31', 4, 4, 17.5, null, 'total_length', null, null, true, 30),
  ('summer_flounder', null, 'de-tidal', 'salt', 'bag_limit', 'Summer Flounder: January 1 - May 31: 16 inch minimum (total length). Daily Limit / Person 4.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=185', 'Delaware DNREC Fish Facts — Summer Flounder', '2026-01-01', '2026-09-03', 2,
   '2026-01-01', '2026-05-31', 4, 4, 16, null, 'total_length', null, null, true, 30),
  ('black_sea_bass', null, 'de-tidal', 'salt', 'bag_limit', 'Black Sea Bass: Season May 15 through September 30 and October 10 through December 31. Size Limit 13 inch minimum (measured from the tip of the snout or jaw (mouth shut) to the farthest extremity of the tail, not including the tail filament). Daily Limit / Person 15.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=93', 'Delaware DNREC Fish Facts — Black Sea Bass', '2026-01-01', '2026-09-03', 2,
   '2026-05-15', '2026-09-30', 15, 15, 13, null, 'total_length', null, 'Filament excluded.', true, 30),
  ('black_sea_bass', null, 'de-tidal', 'salt', 'bag_limit', 'Black Sea Bass: Season May 15 through September 30 and October 10 through December 31. Size Limit 13 inch minimum. Daily Limit / Person 15.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=93', 'Delaware DNREC Fish Facts — Black Sea Bass', '2026-01-01', '2026-09-03', 2,
   '2026-10-10', '2026-12-31', 15, 15, 13, null, 'total_length', null, 'Filament excluded.', true, 30),
  ('red_drum', null, 'de-tidal', 'salt', 'bag_limit', 'Red Drum: Season Open Year-Round in State of Delaware waters (coast to 3 miles offshore) CLOSED in Federal waters. Size Limit 20 to 27 inches (total length). Daily Limit / Person 5 in State of Delaware waters.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=150', 'Delaware DNREC Fish Facts — Red Drum', '2026-01-01', '2026-09-03', 2,
   null, null, 5, 5, 20, 27, 'total_length', null, 'EEZ closed.', true, 60),
  ('cobia', null, 'de-tidal', 'salt', 'bag_limit', 'Cobia: Season Open Year-Round. Size Limit 43 inches minimum length (total length). Daily Limit / Person 2 per angler or 2 per vessel.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=109', 'Delaware DNREC Fish Facts — Cobia', '2026-01-01', '2026-09-03', 2,
   null, null, 2, 2, 43, null, 'total_length', null, '2 per vessel cap.', true, 30),
  ('spanish_mackerel', null, 'de-tidal', 'salt', 'bag_limit', 'Spanish Mackerel: Season Open Year-Round. Size Limit 14 inch minimum. Daily Limit / Person 15.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=176', 'Delaware DNREC Fish Facts — Spanish Mackerel', '2026-01-01', '2026-09-03', 2,
   null, null, 15, 15, 14, null, 'total_length', null, null, true, 60),
  ('weakfish', null, 'de-tidal', 'salt', 'bag_limit', 'Weakfish: Season Open Year-Round. Size Limit 13 inch minimum (total length). Daily Limit / Person 1.', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=192', 'Delaware DNREC Fish Facts — Weakfish', '2026-01-01', '2026-09-03', 2,
   null, null, 1, 1, 13, null, 'total_length', null, null, true, 60),
  ('bluefish', null, 'de-tidal', 'salt', 'bag_limit', 'Bluefish: Season Open Year Round. Size Limit No Size Limit. Daily Limit / Person 3 per shore or private boat anglers. 5 per anglers on ‘for-hire’ vessels (Headboats and Charter boats).', 'https://fishspecies.dnrec.delaware.gov/FishSpecies.aspx?habitat=2&species=100', 'Delaware DNREC Fish Facts — Bluefish', '2026-01-01', '2026-09-03', 2,
   null, null, 3, 3, null, null, null, null, 'For-hire 5.', true, 60);

insert into public.reg_pack (id, version, published_at, notes) values
  ('delaware-2026-09-03', 2, '2026-09-03T23:55:00Z', 'Delaware DNREC Fish Facts v2: stripers/tautog/fluke/BSB/red drum as v1; cobia 43" TL @2 per angler or vessel; Spanish mackerel 14" @15; weakfish 13" @1; bluefish @3 (for-hire 5).')
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;

delete from public.reg_rule where reg_area_id in ('ga-state-waters');
insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('ga-state-waters', 'ga-crd', 'ocean_region', 'Georgia — state waters (0–3 nm)', null, '[[-81.8,32.1],[-80.8,30.7],[-81.45,30.7],[-81.8,32.1]]', 'https://coastalgadnr.org/limits', '2026-09-03', 'Federal 3–200 nm follows SAFMC.')
on conflict (id) do update set name = excluded.name, notes = excluded.notes, source_url = excluded.source_url;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('red_drum', null, 'ga-state-waters', 'salt', 'bag_limit', 'Red Drum: Season: All year. Limit: 5. Minimum size: 14" TL (Maximum 23" TL). Red Drum are a gamefish in Georgia [O.C.G.A. 27-1-2 (36)(I)]. As gamefish, Red Drum may only be fished for with pole and line (rod/reel) [O.C.G.A. 27-4-5].', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 5, 5, 14, 23, 'total_length', null, 'Rod and reel only.', true, 30),
  ('spotted_seatrout', null, 'ga-state-waters', 'salt', 'bag_limit', 'Spotted Seatrout: Season: All year. Limit: 15. Minimum size: 14" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 15, 15, 14, null, 'total_length', null, null, true, 30),
  ('southern_flounder', null, 'ga-state-waters', 'salt', 'bag_limit', 'Flounder: Season: All year. Limit: 15. Minimum size: 12" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 15, 15, 12, null, 'total_length', null, null, true, 60),
  ('striped_bass', null, 'ga-state-waters', 'salt', 'bag_limit', 'Striped Bass: Saltwater Season: All year. Limit: 2. Minimum size: 22" TL. Savannah River Season: All year. Limit: 2. Minimum size: 27" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 2, 2, 22, null, 'total_length', null, 'Savannah River 27" min.', true, 60),
  ('weakfish', null, 'ga-state-waters', 'salt', 'bag_limit', 'Weakfish: Season: All year. Limit: 1. Minimum size: 13" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 1, 1, 13, null, 'total_length', null, null, true, 60),
  ('black_drum', null, 'ga-state-waters', 'salt', 'bag_limit', 'Black Drum: Season: All year. Limit: 15. Minimum size: 14" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 15, 15, 14, null, 'total_length', null, null, true, 60),
  ('sheepshead', null, 'ga-state-waters', 'salt', 'bag_limit', 'Sheepshead: Season: All year. Limit: 15. Minimum size: 10" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 15, 15, 10, null, 'fork_length', null, null, true, 60),
  ('cobia', null, 'ga-state-waters', 'salt', 'bag_limit', 'Cobia: Season: March 1 - Oct. 31. Limit: 1 per angler, maximum 6 per boat. Minimum size: 36" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   '2026-03-01', '2026-10-31', 1, 1, 36, null, 'fork_length', null, '6 per boat.', true, 30),
  ('bluefish', null, 'ga-state-waters', 'salt', 'bag_limit', 'Bluefish: Season: May 1 - Feb. 28 annually. Limit: 15. Minimum size: 12" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   '2026-05-01', '2026-02-28', 15, 15, 12, null, 'fork_length', null, 'Wraps New Year''s.', true, 60),
  ('atlantic_tarpon', null, 'ga-state-waters', 'salt', 'bag_limit', 'Tarpon: Season: All year. Limit: 1. Minimum size: 68" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 1, 1, 68, null, 'fork_length', null, null, true, 90),
  ('king_mackerel', null, 'ga-state-waters', 'salt', 'bag_limit', 'Mackerel, King: Season: All year. Limit: 3. Minimum size: 24" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 3, 3, 24, null, 'fork_length', null, 'Federal 3–200 nm follows SAFMC.', true, 30),
  ('spanish_mackerel', null, 'ga-state-waters', 'salt', 'bag_limit', 'Mackerel, Spanish: Season: All year. Limit: 15. Minimum size: 12" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 15, 15, 12, null, 'fork_length', null, 'Federal 3–200 nm follows SAFMC.', true, 30),
  ('dorado', null, 'ga-state-waters', 'salt', 'bag_limit', 'Dolphin / Mahi Mahi: Season: All year. Limit: 10 (not to exceed 54 per boat, except headboats, which are allowed 10 per paying customer). Minimum size: 20" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 10, 10, 20, null, 'fork_length', null, '54 per boat.', true, 30),
  ('black_sea_bass', null, 'ga-state-waters', 'salt', 'bag_limit', 'Black Sea Bass: Season: All year. Limit: 15. Minimum size: 12" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 15, 15, 12, null, 'total_length', null, 'Federal 3–200 nm follows SAFMC.', true, 30),
  ('tripletail', null, 'ga-state-waters', 'salt', 'bag_limit', 'Tripletail: Season: All year. Limit: 2. Minimum size: 18" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 2, 2, 18, null, 'total_length', null, null, true, 60),
  ('greater_amberjack', null, 'ga-state-waters', 'salt', 'bag_limit', 'Amberjack: Season: All year. Limit: 1. Minimum size: 28" FL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 1, 1, 28, null, 'fork_length', null, 'Federal 3–200 nm follows SAFMC.', true, 30),
  ('red_snapper', null, 'ga-state-waters', 'salt', 'bag_limit', 'Red Snapper: Season: All year. Limit: 2. Minimum size: 20" TL.', 'https://coastalgadnr.org/limits', 'Georgia DNR CRD — Recreational finfish season, limits, and sizes', '2026-01-01', '2026-09-03', 2,
   null, null, 2, 2, 20, null, 'total_length', null, 'Federal 3–200 nm follows SAFMC; confirm federal season.', true, 14);

insert into public.reg_pack (id, version, published_at, notes) values
  ('georgia-2026-09-03', 2, '2026-09-03T23:55:00Z', 'Georgia CRD v2: drums/flounder/trout as v1; king 24" FL @3; Spanish 12" FL @15; dolphin 20" FL @10 / 54 boat; BSB 12" TL @15; tripletail 18" TL @2; amberjack 28" FL @1; red snapper 20" TL @2 (state waters; federal *).')
on conflict (id) do update set version = excluded.version, notes = excluded.notes, published_at = excluded.published_at;
