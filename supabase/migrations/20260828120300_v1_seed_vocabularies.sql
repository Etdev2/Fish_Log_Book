-- =============================================================================
-- V1 vocabulary seed
-- Source: docs/architecture/ontology.md §7, verbatim.
--
-- `needs_review = true` marks every entry the ontology flags with `?` — a term or a
-- boundary invented from outside the sport. It is the founder's red-pen queue and it
-- is queryable, so nobody has to remember which words were guesses. Correcting these
-- is a later migration, not an edit to this file.
--
-- Not waiting on the red pen was deliberate: a dropdown with provisional labels beats
-- no dropdown, and every label here is replaceable without touching a logged row —
-- the id is the key, the label is display.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Species. Groups first: most anglers log the group, not the species, so is_group
-- rows are first-class and specific species roll up to them (ontology.md §7).
-- -----------------------------------------------------------------------------

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('rockfish',            'Rockfish',                  'Sebastes spp.',              true,  null, 'salt', 'regulated', 10, true),
  ('surfperch',           'Surfperch',                 'Embiotocidae',               true,  null, 'salt', 'open',      11, true),
  ('croaker',             'Croaker',                   'Sciaenidae',                 true,  null, 'salt', 'open',      12, true),

  -- inshore / surf / bay
  ('california_halibut',  'California halibut',        'Paralichthys californicus',  false, null,        'salt', 'regulated', 100, false),
  ('barred_sand_bass',    'Barred sand bass',          'Paralabrax nebulifer',       false, null,        'salt', 'regulated', 101, false),
  ('spotted_sand_bass',   'Spotted sand bass',         'Paralabrax maculatofasciatus', false, null,      'salt', 'regulated', 102, false),
  ('kelp_bass',           'Kelp bass (calico)',        'Paralabrax clathratus',      false, null,        'salt', 'regulated', 103, false),
  ('california_corbina',  'California corbina',        'Menticirrhus undulatus',     false, 'croaker',   'salt', 'open',      104, false),
  ('barred_surfperch',    'Barred surfperch',          'Amphistichus argenteus',     false, 'surfperch', 'salt', 'open',      105, false),
  ('walleye_surfperch',   'Walleye surfperch',         'Hyperprosopon argenteum',    false, 'surfperch', 'salt', 'open',      106, false),
  ('yellowfin_croaker',   'Yellowfin croaker',         'Umbrina roncador',           false, 'croaker',   'salt', 'open',      107, false),
  ('spotfin_croaker',     'Spotfin croaker',           'Roncador stearnsii',         false, 'croaker',   'salt', 'open',      108, false),
  ('white_croaker',       'White croaker (tomcod)',    'Genyonemus lineatus',        false, 'croaker',   'salt', 'open',      109, false),
  ('queenfish',           'Queenfish',                 'Seriphus politus',           false, 'croaker',   'salt', 'open',      110, false),
  ('sargo',               'Sargo',                     'Anisotremus davidsonii',     false, null,        'salt', 'open',      111, true),
  ('opaleye',             'Opaleye',                   'Girella nigricans',          false, null,        'salt', 'open',      112, false),
  ('halfmoon',            'Halfmoon',                  'Medialuna californiensis',   false, null,        'salt', 'open',      113, false),
  ('jacksmelt',           'Jacksmelt',                 'Atherinopsis californiensis',false, null,        'salt', 'open',      114, true),
  ('round_stingray',      'Round stingray',            'Urobatis halleri',           false, null,        'salt', 'open',      115, false),
  ('shovelnose_guitarfish','Shovelnose guitarfish',    'Pseudobatos productus',      false, null,        'salt', 'open',      116, false),
  ('leopard_shark',       'Leopard shark',             'Triakis semifasciata',       false, null,        'salt', 'regulated', 117, false),
  ('bat_ray',             'Bat ray',                   'Myliobatis californica',     false, null,        'salt', 'open',      118, false),
  ('horn_shark',          'Horn shark',                'Heterodontus francisci',     false, null,        'salt', 'open',      119, true),

  -- nearshore / reef
  ('california_sheephead','California sheephead',      'Bodianus pulcher',           false, null,        'salt', 'regulated', 200, false),
  ('california_scorpionfish','California scorpionfish (sculpin)','Scorpaena guttata', false, null,       'salt', 'regulated', 201, true),
  ('lingcod',             'Lingcod',                   'Ophiodon elongatus',         false, null,        'salt', 'regulated', 202, false),
  ('cabezon',             'Cabezon',                   'Scorpaenichthys marmoratus', false, null,        'salt', 'regulated', 203, true),
  ('pacific_sanddab',     'Pacific sanddab',           'Citharichthys sordidus',     false, null,        'salt', 'open',      204, true),
  ('garibaldi',           'Garibaldi',                 'Hypsypops rubicundus',       false, null,        'salt', 'protected', 205, false),

  -- pelagic / offshore
  ('yellowtail',          'Yellowtail',                'Seriola dorsalis',           false, null,        'salt', 'regulated', 300, false),
  ('white_seabass',       'White seabass',             'Atractoscion nobilis',       false, null,        'salt', 'regulated', 301, false),
  ('pacific_bonito',      'Pacific bonito',            'Sarda chiliensis',           false, null,        'salt', 'open',      302, false),
  ('pacific_barracuda',   'Pacific barracuda',         'Sphyraena argentea',         false, null,        'salt', 'regulated', 303, false),
  ('pacific_mackerel',    'Pacific mackerel',          'Scomber japonicus',          false, null,        'salt', 'open',      304, false),
  ('jack_mackerel',       'Jack mackerel',             'Trachurus symmetricus',      false, null,        'salt', 'open',      305, true),
  ('bluefin_tuna',        'Bluefin tuna',              'Thunnus orientalis',         false, null,        'salt', 'regulated', 306, true),
  ('yellowfin_tuna',      'Yellowfin tuna',            'Thunnus albacares',          false, null,        'salt', 'regulated', 307, true),
  ('dorado',              'Dorado',                    'Coryphaena hippurus',        false, null,        'salt', 'open',      308, true),
  ('thresher_shark',      'Thresher shark',            'Alopias vulpinus',           false, null,        'salt', 'regulated', 309, true),

  -- fresh / bass (D18 puts these in V1). Minimal and honest: the ontology's §7 lists
  -- are saltwater; these are the species a CA bass angler cannot log without.
  ('largemouth_bass',     'Largemouth bass',           'Micropterus nigricans',      false, null, 'fresh', 'regulated', 400, false),
  ('smallmouth_bass',     'Smallmouth bass',           'Micropterus dolomieu',       false, null, 'fresh', 'regulated', 401, false),
  ('spotted_bass',        'Spotted bass',              'Micropterus punctulatus',    false, null, 'fresh', 'regulated', 402, true),
  ('striped_bass',        'Striped bass',              'Morone saxatilis',           false, null, 'fresh', 'regulated', 403, false),
  ('bluegill',            'Bluegill',                  'Lepomis macrochirus',        false, null, 'fresh', 'open',      404, false),
  ('redear_sunfish',      'Redear sunfish',            'Lepomis microlophus',        false, null, 'fresh', 'open',      405, true),
  ('black_crappie',       'Black crappie',             'Pomoxis nigromaculatus',     false, null, 'fresh', 'regulated', 406, false),
  ('channel_catfish',     'Channel catfish',           'Ictalurus punctatus',        false, null, 'fresh', 'open',      407, false),
  ('rainbow_trout',       'Rainbow trout',             'Oncorhynchus mykiss',        false, null, 'fresh', 'regulated', 408, false),
  ('common_carp',         'Common carp',               'Cyprinus carpio',            false, null, 'fresh', 'open',      409, true);

-- -----------------------------------------------------------------------------
-- Lure classes (ontology.md §7).
-- Open, and flagged: whether "surface iron"/"yo-yo iron" and the rigs are classes or
-- presentations is a distinction a fisherman settles in one sentence. Allowing both
-- would fragment the data, so they sit here provisionally and are marked for review.
-- -----------------------------------------------------------------------------

insert into public.lure_class (id, label, water_class, sort_order, needs_review) values
  ('swimbait_soft',    'Swimbait (soft plastic)', 'both',  10, false),
  ('plastic_grub',     'Plastic grub',            'both',  11, false),
  ('plastic_worm',     'Plastic worm',            'fresh', 12, false),
  ('jerkbait_hard',    'Jerkbait (hard)',         'both',  13, false),
  ('crankbait',        'Crankbait',               'both',  14, false),
  ('topwater_walker',  'Topwater walker',         'both',  15, false),
  ('popper',           'Popper',                  'both',  16, false),
  ('surface_iron',     'Surface iron',            'salt',  17, true),
  ('yoyo_iron',        'Yo-yo iron',              'salt',  18, true),
  ('lead_head_jig',    'Lead-head jig',           'both',  19, false),
  ('bucktail_jig',     'Bucktail jig',            'both',  20, false),
  ('spoon',            'Spoon',                   'both',  21, false),
  ('sabiki',           'Sabiki',                  'salt',  22, false),
  ('fly',              'Fly',                     'both',  23, false),
  ('trolled_plug',     'Trolled plug',            'both',  24, true),
  ('spinnerbait',      'Spinnerbait',             'fresh', 25, false),
  ('carolina_rig',     'Carolina rig',            'fresh', 26, true),
  ('dropper_loop_rig', 'Dropper loop rig',        'salt',  27, true);

-- -----------------------------------------------------------------------------
-- Bait types (ontology.md §7)
-- -----------------------------------------------------------------------------

insert into public.bait_type (id, label, water_class, sort_order, needs_review) values
  ('live_anchovy',    'Live anchovy',       'salt',  10, false),
  ('live_sardine',    'Live sardine',       'salt',  11, false),
  ('live_squid',      'Live squid',         'salt',  12, false),
  ('live_mackerel',   'Live mackerel',      'salt',  13, false),
  ('frozen_squid',    'Dead/frozen squid',  'salt',  14, false),
  ('frozen_anchovy',  'Frozen anchovy',     'salt',  15, false),
  ('sand_crab',       'Sand crab',          'salt',  16, false),
  ('ghost_shrimp',    'Ghost shrimp',       'salt',  17, false),
  ('market_shrimp',   'Market shrimp',      'both',  18, false),
  ('mussel',          'Mussel',             'salt',  19, false),
  ('bloodworm',       'Bloodworm',          'salt',  20, true),
  ('lugworm',         'Lugworm',            'salt',  21, true),
  ('cut_bait',        'Cut bait',           'both',  22, false),
  ('salted_anchovy',  'Salted anchovy',     'salt',  23, true),
  ('grunion',         'Grunion',            'salt',  24, true),
  ('nightcrawler',    'Nightcrawler',       'fresh', 25, true),
  ('live_shad',       'Live shad',          'fresh', 26, true),
  ('live_crawfish',   'Live crawfish',      'fresh', 27, true);

-- -----------------------------------------------------------------------------
-- Structure types — bottom geometry: where the fish is, not what it is hiding in.
-- -----------------------------------------------------------------------------

insert into public.structure_type (id, label, water_class, sort_order, needs_review) values
  ('sand_flat',            'Sand flat',              'salt',  10, false),
  ('eelgrass_bed',         'Eelgrass bed',           'salt',  11, false),
  ('sand_eelgrass_edge',   'Sand/eelgrass edge',     'salt',  12, false),
  ('reef',                 'Reef',                   'salt',  13, false),
  ('rocky_point',          'Rocky point',            'salt',  14, false),
  ('kelp_edge',            'Kelp edge',              'salt',  15, false),
  ('inside_kelp',          'Inside kelp',            'salt',  16, true),
  ('jetty',                'Jetty',                  'salt',  17, false),
  ('pier_pilings',         'Pier pilings',           'salt',  18, false),
  ('breakwall',            'Breakwall',              'salt',  19, false),
  ('harbour_dock',         'Harbour dock',           'salt',  20, false),
  ('channel_edge',         'Channel edge',           'both',  21, false),
  ('drop_off',             'Drop-off',               'both',  22, false),
  ('surf_trough',          'Surf trough',            'salt',  23, false),
  ('rip',                  'Rip',                    'salt',  24, false),
  ('sandbar',              'Sandbar',                'salt',  25, false),
  ('river_mouth',          'River mouth',            'salt',  26, false),
  ('wreck_artificial_reef','Wreck/artificial reef',  'salt',  27, false),
  ('boiler_rock',          'Boiler rock',            'salt',  28, true),
  ('main_lake_point',      'Main-lake point',        'fresh', 40, false),
  ('secondary_point',      'Secondary point',        'fresh', 41, false),
  ('creek_channel',        'Creek channel',          'fresh', 42, false),
  ('ledge',                'Ledge',                  'fresh', 43, false),
  ('rock_pile',            'Rock pile',              'fresh', 44, false),
  ('hump',                 'Hump',                   'fresh', 45, false),
  ('bluff_wall',           'Bluff wall',             'fresh', 46, false),
  ('flat',                 'Flat',                   'fresh', 47, false),
  ('dam_face',             'Dam face',               'fresh', 48, false),
  ('riprap',               'Riprap',                 'fresh', 49, false),
  ('submerged_roadbed',    'Submerged roadbed',      'fresh', 50, true),
  ('spawning_flat',        'Spawning flat',          'fresh', 51, false);

-- -----------------------------------------------------------------------------
-- Cover types. Structure vs cover is a distinction bass anglers make and saltwater
-- anglers mostly do not. Two fields, both nullable, both settable on one catch.
-- -----------------------------------------------------------------------------

insert into public.cover_type (id, label, water_class, sort_order, needs_review) values
  ('laydown',          'Laydown',          'fresh', 10, false),
  ('standing_timber',  'Standing timber',  'fresh', 11, false),
  ('brush_pile',       'Brush pile',       'fresh', 12, false),
  ('tule',             'Tule',             'fresh', 13, true),
  ('reeds',            'Reeds',            'fresh', 14, false),
  ('grass_hydrilla',   'Grass/hydrilla',   'fresh', 15, true),
  ('lily_pads',        'Lily pads',        'fresh', 16, false),
  ('dock',             'Dock',             'both',  17, false),
  ('overhanging_tree', 'Overhanging tree', 'fresh', 18, false),
  ('rock',             'Rock',             'both',  19, false);

-- -----------------------------------------------------------------------------
-- Water clarity and colour. Distinct on purpose: brown-and-clear is not green-and-clear.
-- Red tide is unresolved (ontology.md §8 item 4) and is seeded as a colour for now,
-- flagged, because leaving it out means it gets logged as a custom field instead.
-- -----------------------------------------------------------------------------

insert into public.water_clarity (id, label, sort_order, needs_review) values
  ('gin_clear',      'Gin clear',      10, false),
  ('clear',          'Clear',          11, false),
  ('lightly_stained','Lightly stained',12, false),
  ('stained',        'Stained',        13, false),
  ('muddy',          'Muddy',          14, true);

insert into public.water_color (id, label, sort_order, needs_review) values
  ('blue',        'Blue',            10, false),
  ('green',       'Green',           11, false),
  ('green_brown', 'Green-brown',     12, false),
  ('brown',       'Brown',           13, false),
  ('tannic',      'Tannic / tea',    14, true),
  ('algae_bloom', 'Algae bloom',     15, true),
  ('red_tide',    'Red tide',        16, true);

insert into public.seasonal_pattern (id, label, sort_order, needs_review) values
  ('prespawn',        'Prespawn',        10, false),
  ('spawn',           'Spawn',           11, false),
  ('postspawn',       'Postspawn',       12, false),
  ('summer',          'Summer',          13, false),
  ('fall_transition', 'Fall transition', 14, true),
  ('winter',          'Winter',          15, false);

-- The statement-level triggers above bumped the version once per table. Normalise it
-- so a fresh database and a migrated one agree on the number.
update public.vocabulary_version set version = 1, updated_at = now() where singleton;
