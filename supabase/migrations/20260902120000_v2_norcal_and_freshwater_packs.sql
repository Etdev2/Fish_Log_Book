-- California packs v2 (Fish Legal spec §3/§22 registry scaling): Northern CA
-- (Northern GMA groundfish + halibut/salmon) and statewide California freshwater
-- defaults. GENERATED deterministically from norcal-pack.ts + california-freshwater-pack.ts
-- — edit the bundle, run scripts/gen-california-migrations.mts, never hand-edit rows.
-- Water class is per-bundle (NorCal = salt, freshwater = fresh); reg_area.kind reuses
-- 'ocean_region' so the existing CHECK constraint stands untouched.

insert into public.reg_pack (id, version, published_at, notes) values
  ('norcal-2026-09-01', 1, '2026-09-01T12:00:00Z', 'Northern California (CDFW 2026): from the U.S.–Oregon line to 40°10′ N (Cape Mendocino) — groundfish table-verified; statewide rows (halibut, lingcod bag, no- retention quartet) restated verbatim from the summary. Saltwater only; rivers and salmon checks live behind checkInseason, not invented seasons.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('ca-ocean-northern', 'cdfw', 'ocean_region', 'Northern Management Area — 40°10′ N to the Oregon line', null, null, 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Northern', '2026-09-01', 'Envelope for pack resolution; coast-anchored east edge, open-ocean west edge.')
on conflict (id) do nothing;

-- The RCG rules below name individual rockfish by species, and `reg_rule.species_id` is
-- a foreign key. These eight were only seeded by the PNW pack four migrations later, so
-- against a real database this file failed on a foreign key that a text-concatenating
-- parity check could never see. Rows copied verbatim from their canonical definition in
-- `20260902160000_v1_pnw_wa_or_packs.sql`; `on conflict` makes that later insert a no-op.
insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('canary_rockfish', 'Canary rockfish', 'Sebastes pinniger', false, 'rockfish', 'salt', 'regulated', 456, false),
  ('blue_rockfish', 'Blue rockfish', 'Sebastes mystinus', false, 'rockfish', 'salt', 'regulated', 457, false),
  ('black_rockfish', 'Black rockfish', 'Sebastes melanops', false, 'rockfish', 'salt', 'regulated', 458, false),
  ('yellowtail_rockfish', 'Yellowtail rockfish', 'Sebastes flavidus', false, 'rockfish', 'salt', 'regulated', 459, false),
  ('widow_rockfish', 'Widow rockfish', 'Sebastes entomelas', false, 'rockfish', 'salt', 'regulated', 460, false),
  ('bocaccio', 'Bocaccio', 'Sebastes paucispinis', false, 'rockfish', 'salt', 'regulated', 461, false),
  ('copper_rockfish', 'Copper rockfish', 'Sebastes caurinus', false, 'rockfish', 'salt', 'regulated', 462, false),
  ('vermilion_rockfish', 'Vermilion rockfish', 'Sebastes miniatus', false, 'rockfish', 'salt', 'regulated', 464, false)
on conflict (id) do nothing;

insert into public.reg_group (id, name, member_species_ids, source_url, verified_at) values
  ('rcg-complex-norcal', 'Rockfish, Cabezon & Greenlings (RCG) — Northern combo', ARRAY['black_rockfish','blue_rockfish','brown_rockfish','calico_rockfish','china_rockfish','copper_rockfish','gopher_rockfish','grass_rockfish','kelp_rockfish','olive_rockfish','treefish','cabezon','kelp_greenling','bocaccio','canary_rockfish','vermilion_rockfish','widow_rockfish','yellowtail_rockfish']::text[], 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', '2026-09-01')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('rockfish', null, 'ca-ocean-northern', 'salt', 'season', 'Northern Management Area — Nearshore Rockfish, Cabezon, and Greenlings: Jan 1 – Mar 31 Closed — unlawful to possess in all waters. Apr 1 – Dec 31: Open all depths.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   '2026-01-01', '2026-03-31', null, null, null, null, null, 'boat', null, false, 60),
  ('rockfish', null, 'ca-ocean-northern', 'salt', 'season', 'Northern Management Area — Nearshore Rockfish, Cabezon, and Greenlings: Jan 1 – Mar 31 Closed — unlawful to possess in all waters. Apr 1 – Dec 31: Open all depths.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   '2026-04-01', '2026-12-31', null, null, null, null, null, 'boat', null, false, 60),
  (null, 'rcg-complex-norcal', 'ca-ocean-northern', 'salt', 'bag_limit', 'RCG Complex: 10 fish in combination per person, except: Copper rockfish 1 fish per person; Vermilion/sunset rockfish 4 fish per person combined in the Northern Management Area; Canary rockfish 2 fish per person.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   null, null, 10, 10, null, null, null, null, null, false, 60),
  ('copper_rockfish', null, 'ca-ocean-northern', 'salt', 'bag_limit', 'Copper rockfish: 1 fish per person within the 10-fish RCG combination.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   null, null, 1, 1, null, null, null, null, null, false, 60),
  ('vermilion_rockfish', null, 'ca-ocean-northern', 'salt', 'bag_limit', 'Vermilion/sunset rockfish: 4 fish per person combined, within the 10-fish RCG combination. (Northern Management Area cap; 2 per person applies in all other management areas.)', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   null, null, 4, 4, null, null, null, null, null, false, 60),
  ('canary_rockfish', null, 'ca-ocean-northern', 'salt', 'bag_limit', 'Canary rockfish: 2 fish per person within the 10-fish RCG combination.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   null, null, 2, 2, null, null, null, null, null, false, 60),
  (null, 'rcg-complex-norcal', 'ca-ocean-northern', 'salt', 'prohibited', 'No Retention at Any Time (CCR T14 §28.55): Bronzespotted Rockfish, Cowcod, Quillback Rockfish, and Yelloweye Rockfish may not be taken or possessed in California.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, false, 60),
  ('lingcod', null, 'ca-ocean-northern', 'salt', 'bag_limit', 'Lingcod (§28.27): 2 fish per person; minimum size 22 inches total length.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   null, null, 2, 2, 22, null, 'total_length', null, null, false, 60),
  ('lingcod', null, 'ca-ocean-northern', 'salt', 'season', 'Northern Management Area — Shelf and Slope Rockfish and Lingcod: Jan 1 – Mar 31 Closed. Apr 1 – Dec 31: Open all depths.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   '2026-01-01', '2026-03-31', null, null, null, null, null, 'boat', null, false, 60),
  ('pacific_halibut', null, 'ca-ocean-northern', 'salt', 'bag_limit', 'Pacific halibut: 1 fish per person; open May 1 – Oct 31 (California 2026 season per annual action — verify dates on the CDFW Pacific halibut page before each trip).', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Northern', 'CDFW — Northern region ocean sportfishing summary', '2026-09-01', '2026-09-01', 1,
   '2026-05-01', '2026-10-31', 1, 1, null, null, null, null, null, true, 30),
  ('chinook_salmon', null, 'ca-ocean-northern', 'salt', 'note', 'Chinook salmon (ocean): seasons, bag limits and boundaries are set annually by the Pacific Fishery Management Council and CDFW and can close in-season. Check the CDFW Ocean Salmon Regulations page and the season map before fishing; harvest off-season or with barbed hooks is prohibited.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Salmon', 'CDFW — Ocean Salmon Regulations', null, '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, true, 14),
  (null, 'rcg-complex-norcal', 'ca-ocean-northern', 'salt', 'gear', 'No person shall take or possess any federal groundfish and all greenlings of the genus Hexagrammos from any boat or other floating device without a descending device in possession and available for immediate use (CCR T14 §27.20(b)(2)).', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   null, null, null, null, null, null, null, 'boat', null, false, 60),
  ('ocean_whitefish', null, 'ca-ocean-northern', 'salt', 'note', 'Year-round opportunities in all depths, statewide (2026): ocean whitefish, California scorpionfish, leopard shark, soupfin shark, Dover sole, English sole, arrowtooth flounder, spiny dogfish, skates, ratfish, grenadiers, finescale codling, Pacific cod, Pacific whiting, sablefish and thornyheads.', 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', 'CDFW — 2026 Recreational Groundfish Summary (Updated January 6, 2026)', '2026-01-06', '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, false, 60);


insert into public.reg_pack (id, version, published_at, notes) values
  ('ca-freshwater-2026-09-01', 1, '2026-09-01T12:00:00Z', 'California freshwater (CDFW): statewide defaults only — named waters override these rows. Every card carries the special-waters caveat. Report-card species (sturgeon, steelhead, salmon) require the physical card under CCR T14 regardless of limit.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('ca-fresh-statewide', 'cdfw', 'ocean_region', 'California — statewide inland waters', null, null, 'https://wildlife.ca.gov/Regulations', '2026-09-01', 'State envelope. Freshwater = rivers, lakes, reservoirs; excludes ocean.')
on conflict (id) do nothing;

insert into public.reg_group (id, name, member_species_ids, source_url, verified_at) values
  ('ca-black-bass', 'Black bass (largemouth, smallmouth, spotted)', ARRAY['largemouth_bass','smallmouth_bass','spotted_bass']::text[], 'https://wildlife.ca.gov/Regulations', '2026-09-01')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  (null, 'ca-black-bass', 'ca-fresh-statewide', 'fresh', 'bag_limit', 'Black bass (largemouth, smallmouth, spotted — combined): 5 fish daily statewide default; 12-inch minimum size limit. Individual waters may impose stricter limits or catch-and-release — check the CDFW special-regulations list for the specific water.', 'https://wildlife.ca.gov/Regulations', 'CDFW — 2026 California Freshwater Sport Fishing Regulations (statewide defaults)', null, '2026-09-02', 1,
   null, null, 5, 5, 12, null, 'total_length', null, null, true, 30),
  ('trout', null, 'ca-fresh-statewide', 'fresh', 'bag_limit', 'Trout (all species except steelhead) — statewide default: 5 fish per day, 10 in possession. Lakes/reservoirs: open all year. Rivers/streams: open last Saturday in April through November 15; closed Nov 16 through the Friday before the last Saturday in April (barbless-artificial catch-and-release only in that window).', 'https://wildlife.ca.gov/Regulations', 'CDFW — 2026 California Freshwater Sport Fishing Regulations (statewide defaults)', null, '2026-09-02', 1,
   null, null, 5, 10, null, null, null, null, null, true, 30),
  ('steelhead', null, 'ca-fresh-statewide', 'fresh', 'prohibited', 'Steelhead: retention of WILD (adipose-fin-intact) steelhead is prohibited in most inland waters; hatchery steelhead (adipose clip) possession requires a steelhead report card. Wild steelhead are catch-and-release, barbless-hooks rules under special waters.', 'https://wildlife.ca.gov/Regulations', 'CDFW — 2026 California Freshwater Sport Fishing Regulations (statewide defaults)', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, true, 30),
  ('striped_bass', null, 'ca-fresh-statewide', 'fresh', 'bag_limit', 'Striped bass (inland/Delta): 2 fish per day, 18-inch minimum total length.', 'https://wildlife.ca.gov/Regulations', 'CDFW — 2026 California Freshwater Sport Fishing Regulations (statewide defaults)', null, '2026-09-02', 1,
   null, null, 2, 2, 18, null, 'total_length', null, null, false, 60),
  ('catfish', null, 'ca-fresh-statewide', 'fresh', 'bag_limit', 'Catfish: 10 per day combined, no size limit (statewide default).', 'https://wildlife.ca.gov/Regulations', 'CDFW — 2026 California Freshwater Sport Fishing Regulations (statewide defaults)', null, '2026-09-02', 1,
   null, null, 10, 10, null, null, null, null, null, false, 60),
  ('white_sturgeon', null, 'ca-fresh-statewide', 'fresh', 'bag_limit', 'White sturgeon: 1 fish per day, 40–60 inch fork-length slot; anything outside the slot must be released immediately. Sturgeon report card required. Snagging prohibited.', 'https://wildlife.ca.gov/Regulations', 'CDFW — 2026 California Freshwater Sport Fishing Regulations (statewide defaults)', null, '2026-09-02', 1,
   null, null, 1, 1, 40, 60, 'fork_length', null, null, true, 30),
  (null, 'ca-black-bass', 'ca-fresh-statewide', 'fresh', 'note', 'Special regulations may apply to individual waters (CCR T14 §7.50 etc.). This card shows the statewide default; the named water''s own line in the CDFW digest overrides it.', 'https://wildlife.ca.gov/Regulations', 'CDFW — 2026 California Freshwater Sport Fishing Regulations (statewide defaults)', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, true, 30);
