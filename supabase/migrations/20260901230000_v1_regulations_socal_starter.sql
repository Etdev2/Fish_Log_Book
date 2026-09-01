-- v1: regulations feature — schema + the small VERIFIED SoCal starter dataset
-- (founder intake, Claude/GPT joint spec §18: docs-first; architecture and model docs
-- are docs/specs/regulations-architecture.md and regulations-data-model.md).
--
-- Every rule row here was read from its source on 2026-09-01 (verified_at) and carries
-- the agency's own sentence (verbatim) plus the typed interpretation. Species without a
-- row render "No verified data" by design (architecture §4). Sources:
--   A = https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern
--       ("Point Conception to the U.S.-Mexico Border", stamped updated September 1, 2026)
--   B = https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary
--       (stamped updated June 23, 2026; Southern Management Area table)
-- Migration rule honoured: additive only; seed vocabulary migration untouched.

-- New species ids (mirrored into src/core/ontology/species.ts in the same slice; the
-- species-parity test enforces the join).
insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('ocean_whitefish',  'Ocean whitefish',                   'Caulolatilus princeps',      false, null, 'salt', 'regulated', 206, false),
  ('giant_sea_bass',   'Giant sea bass (black sea bass)',   'Stereolepis gigas',          false, null, 'salt', 'protected', 207, false),
  ('kelp_greenling',   'Kelp greenling',                    'Hexagrammos decagrammus',    false, null, 'salt', 'regulated', 208, false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Tables (see docs/specs/regulations-data-model.md for the full contract)
-- ---------------------------------------------------------------------------

create table public.reg_area (
  id               text primary key,
  authority        text not null,
  kind             text not null
                     check (kind in ('ocean_region','groundfish_management_area','conservation_area')),
  name             text not null,
  parent_id        text references public.reg_area(id),
  boundary_geojson jsonb,
  source_url       text not null,
  verified_at      date not null,
  notes            text,
  created_at       timestamptz not null default now()
);

comment on table public.reg_area is
  'Regulation geography is the agency''s geography, verbatim. Polygons ride the pack, '
  'resolve on device (architecture §3); null until mapped — v1 resolves by home-region preference.';

create table public.reg_group (
  id                 text primary key,
  name               text not null,
  member_species_ids text[] not null default '{}',
  source_url         text not null,
  verified_at        date not null,
  created_at         timestamptz not null default now()
);

create table public.reg_pack (
  id          text primary key,
  version     integer not null,
  published_at timestamptz not null default now(),
  notes       text
);

create table public.reg_rule (
  id                    uuid primary key default gen_random_uuid(),
  species_id            text references public.species(id),
  reg_group_id          text references public.reg_group(id),
  reg_area_id           text not null references public.reg_area(id),
  water_class           text not null check (water_class in ('salt','fresh')),
  kind                  text not null check (kind in
                          ('season','bag_limit','possession_limit','min_size','max_size','gear','prohibited','note')),
  season_start          date,
  season_end            date,
  bag_daily             integer,
  possession_limit      integer,
  bag_shares_with_group boolean not null default false,
  min_size_in           numeric(5,2),
  max_size_in           numeric(5,2),
  size_measure          text check (size_measure in ('total_length','fork_length','alternate_total_length')),
  platform_scope        text check (platform_scope in ('boat','shore','diver')),
  depth_note            text,
  verbatim              text not null,
  check_inseason        boolean not null default false,
  source_url            text not null,
  source_title          text not null,
  source_updated_at     date,
  verified_at           date not null,
  stale_after_days      integer not null default 60,
  pack_version          integer not null,
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  constraint reg_rule_subject check (
    (species_id is not null) or (reg_group_id is not null)
  )
);

comment on table public.reg_rule is
  'One enforceable statement about one species-or-group in one agency area. verbatim is '
  'the agency''s own words; typed fields are our translation of it, and the words win '
  '(architecture §2). Absence of a row is displayed as "No verified data", never paraphrased.';

comment on column public.reg_rule.size_measure is
  'CDFW measures both total length and fork length (and publishes alternate lengths). '
  'A size without its measure is not a rule, so the measure is its own column.';

-- ---------------------------------------------------------------------------
-- Geography: CDFW ocean sportfishing region + groundfish management area (source A/B).
-- boundary_geojson deliberately null until the simplified polygons are mapped.
-- ---------------------------------------------------------------------------

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('ca-ocean-southern', 'cdfw', 'ocean_region',
   'Southern — 34°27'' N (Point Conception) to the U.S.–Mexico border',
   null, null,
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   '2026-09-01',
   'Includes a portion of Santa Barbara County, and all of Ventura, Los Angeles, Orange and San Diego counties.'),
  ('ca-gma-southern', 'cdfw', 'groundfish_management_area',
   'Southern Management Area — 34°27'' N to the U.S.–Mexico border',
   'ca-ocean-southern', null,
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   '2026-09-01',
   'CCR T14 §27.45(a). Eight Groundfish Exclusion Areas apply (§27.50) — linked out per architecture §3.')
on conflict (id) do nothing;

insert into public.reg_pack (id, version, notes) values
  ('socal-2026-09-01', 1, 'Hand-verified SoCal starter set; architecture docs-first slice.')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Groups the law speaks in
-- ---------------------------------------------------------------------------

insert into public.reg_group (id, name, member_species_ids, source_url, verified_at) values
  ('paralabrax-bass', 'Kelp bass, barred sand bass, spotted sand bass (Paralabrax)',
   '{kelp_bass,barred_sand_bass,spotted_sand_bass}',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern', '2026-09-01'),
  ('rcg-complex', 'Rockfish, Cabezon, and Greenlings complex (RCG)',
   '{rockfish,cabezon,kelp_greenling}',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary', '2026-09-01')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Verified rules. Source A rows: source_updated_at 2026-09-01.
-- ---------------------------------------------------------------------------

-- California halibut
insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, size_measure) values
  ('california_halibut', 'ca-ocean-southern', 'salt', 'season',
   'The recreational fishery for California halibut (Paralichthys californicus) remains open year-round.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, null, null),
  ('california_halibut', 'ca-ocean-southern', 'salt', 'bag_limit',
   'The daily bag and possession limit is five fish south of Point Sur, Monterey County.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, 5, 5, null, null),
  ('california_halibut', 'ca-ocean-southern', 'salt', 'min_size',
   'The minimum size limit is 22 inches total length.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, 22, 'total_length');

-- Paralabrax basses: combination bag lives on the group; the barred sand bass exception
-- is its own species row so a per-species view still names the tighter number.
insert into public.reg_rule
  (reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, bag_daily, possession_limit, bag_shares_with_group, min_size_in, size_measure) values
  ('paralabrax-bass', 'ca-ocean-southern', 'salt', 'season',
   'The fisheries for kelp bass, barred sand bass, and spotted sand bass (Paralabrax species) remains open year-round.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, false, null, null),
  ('paralabrax-bass', 'ca-ocean-southern', 'salt', 'bag_limit',
   'The daily bag and possession limit is five fish in any combination of species, except no more than 4 barred sand bass may be taken.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, 5, 5, true, null, null),
  ('paralabrax-bass', 'ca-ocean-southern', 'salt', 'min_size',
   'The minimum size limit is 14 inches total length or 10 inches alternate length.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, false, 14, 'total_length');

insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   bag_daily, bag_shares_with_group) values
  ('barred_sand_bass', 'ca-ocean-southern', 'salt', 'bag_limit',
   'no more than 4 barred sand bass may be taken',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   4, true);

-- White seabass: year-round bag 3 statewide, but So of Pt Conception (= this region) is
-- 1 fish Mar 15–Jun 15. Both stated; the overlapping season row carries the window.
insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   bag_daily, possession_limit, min_size_in, size_measure, season_start, season_end, check_inseason, stale_after_days) values
  ('white_seabass', 'ca-ocean-southern', 'salt', 'season',
   'The recreational fishery for white seabass (Atractoscion nobilis) remains open year-round.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, null, null, false, 60),
  ('white_seabass', 'ca-ocean-southern', 'salt', 'bag_limit',
   'The daily bag and possession limit is three fish except that only one fish may be taken in waters south of Point Conception between March 15 and June 15.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   3, 3, null, null, null, null, false, 60),
  ('white_seabass', 'ca-ocean-southern', 'salt', 'bag_limit',
   'between March 15 and June 15 [ south of Point Conception ] only one fish may be taken',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   1, 1, null, null, '2026-03-15', '2026-06-15', false, 60),
  ('white_seabass', 'ca-ocean-southern', 'salt', 'min_size',
   'The minimum size limit is 28 inches total length or 20 inches alternate length.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, 28, 'total_length', null, null, false, 60);

-- California sheephead: the platform split is real law (boat season vs shore/diver year-round)
insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, size_measure, platform_scope) values
  ('california_sheephead', 'ca-ocean-southern', 'salt', 'season',
   'open year-round to divers and shore-based anglers',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, null, null, 'diver'),
  ('california_sheephead', 'ca-ocean-southern', 'salt', 'season',
   'open year-round to divers and shore-based anglers',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, null, null, 'shore'),
  ('california_sheephead', 'ca-ocean-southern', 'salt', 'season',
   'This fishery is open to boat-based anglers from March 1, 2026 through December 31, 2026.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   '2026-03-01', '2026-12-31', null, null, null, null, 'boat'),
  ('california_sheephead', 'ca-ocean-southern', 'salt', 'bag_limit',
   'The daily bag and possession limit is 2 fish',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, 2, 2, null, null, null),
  ('california_sheephead', 'ca-ocean-southern', 'salt', 'min_size',
   'a minimum size limit of 12 inches total length',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, 12, 'total_length', null);

-- Ocean whitefish / scorpionfish / leopard shark / yellowtail: simple honest rows.
insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   bag_daily, possession_limit, min_size_in, size_measure, depth_note) values
  ('ocean_whitefish', 'ca-ocean-southern', 'salt', 'season',
   'The recreational fishery for ocean whitefish (Caulolatilus princeps) is open year-round, at all depths.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, 'all depths'),
  ('ocean_whitefish', 'ca-ocean-southern', 'salt', 'bag_limit',
   'The daily bag and possession limit is 10 fish within the general daily bag limit of 20 fish total.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   10, 10, null, null, null),
  ('california_scorpionfish', 'ca-ocean-southern', 'salt', 'season',
   'The recreational fishery for California scorpionfish (Scorpaena guttata) is open year-round, at all depths.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, 'all depths'),
  ('california_scorpionfish', 'ca-ocean-southern', 'salt', 'bag_limit',
   'The daily bag and possession limit is 5 fish with no minimum size limit.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   5, 5, null, null, null),
  ('leopard_shark', 'ca-ocean-southern', 'salt', 'season',
   'The recreational fishery for leopard shark (Triakis semifasciata) is open year-round, at all depths.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, 'all depths'),
  ('leopard_shark', 'ca-ocean-southern', 'salt', 'bag_limit',
   'The daily bag and possession limit is 3 fish with a minimum size limit of 36 inches total length.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   3, 3, 36, 'total_length', null),
  ('yellowtail', 'ca-ocean-southern', 'salt', 'season',
   'The fishery for yellowtail (Seriola dorsalis) remains open year-round.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, null, null),
  ('yellowtail', 'ca-ocean-southern', 'salt', 'bag_limit',
   'The daily bag and possession limit is ten fish.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   10, 10, null, null, null),
  ('yellowtail', 'ca-ocean-southern', 'salt', 'min_size',
   'The minimum size limit is 24 inches fork length, except that up to five fish less than 24 inches fork length may be taken or possessed.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, 24, 'fork_length', null);

-- Giant (black) sea bass: prohibited, period. One row, kind prohibited — the strongest
-- reading of "Closed" on the source page.
insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version) values
  ('giant_sea_bass', 'ca-ocean-southern', 'salt', 'prohibited',
   'Giant Sea Bass (a.k.a. black sea bass) — Closed. Take of broomtail grouper, gulf grouper, and giant (black) sea bass (a type of grouper) is prohibited.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1);

-- Ocean salmon (South of Pigeon Point to the border, this region): September-only season
-- with a harvest guideline → check_inseason + 30-day staleness, per model doc §2.
insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, min_size_in, size_measure, check_inseason, stale_after_days) values
  ('chinook_salmon', 'ca-ocean-southern', 'salt', 'season',
   'The recreational fishery for ocean salmon is open beginning September 1, 2026 south of Pigeon Point, San Mateo County, to the US-Mexico border. In this area, the season will continue through September 30, 2026 or until the 20,000 fish harvest guideline is reached, whichever is earlier.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   '2026-09-01', '2026-09-30', null, null, null, true, 30),
  ('chinook_salmon', 'ca-ocean-southern', 'salt', 'bag_limit',
   'The daily bag and possession limit is 2 salmon of any species except coho (silver), which may not be taken or possessed.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, 2, null, null, true, 30),
  ('chinook_salmon', 'ca-ocean-southern', 'salt', 'min_size',
   'The salmon minimum size limit is 20 inches total length.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   null, null, null, 20, 'total_length', true, 30),
  ('coho_salmon', 'ca-ocean-southern', 'salt', 'prohibited',
   'coho (silver) [salmon] may not be taken or possessed',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Southern',
   'Current California Ocean Recreational Fishing Regulations — Southern Region', '2026-09-01', '2026-09-01', 1,
   '2026-09-01', '2026-09-30', null, null, null, true, 30);

-- ---------------------------------------------------------------------------
-- Groundfish (source B, stamped updated June 23, 2026 → source_updated_at).
-- RCG complex bag + no-retention species; lingcod; Southern GMA season windows.
-- ---------------------------------------------------------------------------

insert into public.reg_rule
  (reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   bag_daily, possession_limit, bag_shares_with_group) values
  ('rcg-complex', 'ca-gma-southern', 'salt', 'bag_limit',
   'RCG Complex: 10 fish in combination per person, except: Copper rockfish: 1 fish per person; Vermilion/sunset rockfish: 2 fish per person combined [all areas except Northern]; Canary rockfish: 2 fish per person.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   10, 10, true),
  ('rcg-complex', 'ca-gma-southern', 'salt', 'min_size',
   'All Rockfish: No minimum size limit. Cabezon and Greenlings: No minimum size limit.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   null, null, false),
  ('rcg-complex', 'ca-gma-southern', 'salt', 'prohibited',
   'These Rockfishes May Not Be Taken or Possessed in California — No Retention at Any Time: Bronzespotted Rockfish, Cowcod, Quillback Rockfish, and Yelloweye Rockfish (CCR T14, §28.55). Fishing is closed year-round, at all depths, no retention at any time (zero fish per person).',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   null, null, false),
  ('rcg-complex', 'ca-gma-southern', 'salt', 'gear',
   'Descending Devices Required: No one may take or possess any federal groundfish from any boat or other floating device in ocean waters without a descending device in possession (CCR T14, §27.20(b)(2)).',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   null, null, false);

insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   bag_daily, min_size_in, size_measure) values
  ('lingcod', 'ca-gma-southern', 'salt', 'bag_limit',
   'Lingcod (§28.27): 2 fish per person.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   2, null, null),
  ('lingcod', 'ca-gma-southern', 'salt', 'min_size',
   'Lingcod (§28.27): minimum size 22" total length.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   null, 22, 'total_length');

-- Southern Management Area season windows, verbatim from the table. Nearshore RCG vs
-- Shelf/Slope+Lingcod split differently Oct–Dec, hence both families get their windows.
insert into public.reg_rule
  (reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, depth_note, check_inseason, stale_after_days) values
  -- Nearshore rockfish / cabezon / greenlings
  ('rcg-complex', 'ca-gma-southern', 'salt', 'season',
   'Southern Management Area, Nearshore Rockfish, Cabezon, and Greenlings: Jan 1 - Mar 31: Closed — unlawful to possess in all waters.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   '2026-01-01', '2026-03-31', 'closed — unlawful to possess in all waters', true, 30),
  ('rcg-complex', 'ca-gma-southern', 'salt', 'season',
   'Southern Management Area, Nearshore Rockfish, Cabezon, and Greenlings: April 1 - June 30: Open All Depths.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   '2026-04-01', '2026-06-30', 'open all depths', true, 30),
  ('rcg-complex', 'ca-gma-southern', 'salt', 'season',
   'Southern Management Area, Nearshore Rockfish, Cabezon, and Greenlings: July 1 - Sep 30: 50 Fathom - Inshore Only. Take is prohibited seaward of the 50 fathom (300 feet) Rockfish Conservation Area boundary line.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   '2026-07-01', '2026-09-30', '50 fathom RCA: inshore only (take prohibited seaward of the waypoint line, 50 CFR 660 Subpart C)', true, 30),
  ('rcg-complex', 'ca-gma-southern', 'salt', 'season',
   'Southern Management Area, Nearshore Rockfish, Cabezon, and Greenlings: Oct 1 - Dec 31: Closed — unlawful to possess in all waters.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   '2026-10-01', '2026-12-31', 'closed — unlawful to possess in all waters', true, 30);

-- Shelf/Slope + Lingcod windows hang off lingcod (the shelf/slope species ids we hold
-- are too few to claim the group; rockfish rows above cover the RCG seasons that match
-- its nearshore members; lingcod's oct-dec differs and is recorded here).
insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, depth_note, check_inseason, stale_after_days) values
  ('lingcod', 'ca-gma-southern', 'salt', 'season',
   'Southern Management Area, Shelf and Slope Rockfish and Lingcod: Jan 1 - Mar 31: Closed — unlawful to possess in all waters.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   '2026-01-01', '2026-03-31', 'closed — unlawful to possess in all waters', true, 30),
  ('lingcod', 'ca-gma-southern', 'salt', 'season',
   'Southern Management Area, Shelf and Slope Rockfish and Lingcod: April 1 - June 30: Open All Depths.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   '2026-04-01', '2026-06-30', 'open all depths', true, 30),
  ('lingcod', 'ca-gma-southern', 'salt', 'season',
   'Southern Management Area, Shelf and Slope Rockfish and Lingcod: July 1 - Sep 30: 50 Fathom - Inshore Only. Take is prohibited seaward of the 50 fathom (300 feet) Rockfish Conservation Area boundary line.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   '2026-07-01', '2026-09-30', '50 fathom RCA: inshore only (take prohibited seaward of the waypoint line, 50 CFR 660 Subpart C)', true, 30),
  ('lingcod', 'ca-gma-southern', 'salt', 'season',
   'Southern Management Area, Shelf and Slope Rockfish and Lingcod: Oct 1 - Dec 31: 50 Fathom - Offshore Only. Take is prohibited shoreward of the 50 fathom (300 feet) Rockfish Conservation Area boundary line.',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   '2026-10-01', '2026-12-31', '50 fathom RCA: offshore only (take prohibited shoreward of the waypoint line, 50 CFR 660 Subpart C)', true, 30);

-- Shore/diver groundfish exemption (footnote 2) as a note, because seasons above would
-- otherwise read as boat-law against a pier angler.
insert into public.reg_rule
  (reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   depth_note, check_inseason, stale_after_days) values
  ('rcg-complex', 'ca-gma-southern', 'salt', 'note',
   'Shore-based anglers and spear divers are exempt from seasons and depths. Divers and shore-based anglers are exempt from season and depth restrictions affecting the RCG Complex and other federally managed groundfish (CCR T14, §27.20(b)(1)(C) and (b)(1)(D)).',
   'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary',
   'Summary of Recreational Groundfish Fishing Regulations', '2026-06-23', '2026-09-01', 1,
   null, true, 30);
