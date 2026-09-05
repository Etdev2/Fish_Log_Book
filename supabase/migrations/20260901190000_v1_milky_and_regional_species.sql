-- V1 expansion: founder requirements 2026-09-01 §3 (Milky water clarity) and §4/§5
-- (regional + freshwater species groundwork, ADR 007).
--
-- Additive only: one new water_clarity row and the regional species rows this prototype
-- mirrors offline in `src/core/ontology/species.ts`. Migrations stay append-only so the
-- offline floor and the server vocabulary never disagree about what an id means.
-- The parity test `src/core/ontology/species-parity.test.ts` fails if either side drifts.

-- §3 — Milky: sits between Stained and Muddy; muddy moves to keep the scale monotonic.
update public.water_clarity set sort_order = 15 where id = 'muddy';

insert into public.water_clarity (id, label, sort_order, needs_review) values
  ('milky', 'Milky', 14, false)
on conflict (id) do nothing;

-- §4/§5 — regional + freshwater species. sort_order bands: 400s mixed-coast &
-- anadromous, 410s Atlantic inshore, 420s Florida/Gulf inshore, 430s Florida/Gulf
-- offshore, 440s tropical offshore, 500s freshwater. water_class is the dominant
-- regulatory habitat; anadromous rows stay 'salt' where they are managed as such.
insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  -- inshore anadromous / mixed-coast
  ('striped_bass',       'Striped bass',                      'Morone saxatilis',           false, null, 'salt', 'regulated', 400, false),
  ('chinook_salmon',     'Chinook salmon',                    'Oncorhynchus tshawytscha',   false, null, 'salt', 'regulated', 401, false),
  ('coho_salmon',        'Coho salmon',                       'Oncorhynchus kisutch',       false, null, 'salt', 'regulated', 402, false),
  ('pacific_halibut',    'Pacific halibut',                   'Hippoglossus stenolepis',    false, null, 'salt', 'regulated', 403, false),
  ('white_sturgeon',     'White sturgeon',                    'Acipenser transmontanus',    false, null, 'salt', 'regulated', 404, false),

  -- Atlantic inshore
  ('bluefish',           'Bluefish',                          'Pomatomus saltatrix',        false, null, 'salt', 'regulated', 410, false),
  ('summer_flounder',    'Summer flounder (fluke)',           'Paralichthys dentatus',      false, null, 'salt', 'regulated', 411, false),
  ('black_sea_bass',     'Black sea bass',                    'Centropristis striata',      false, null, 'salt', 'regulated', 412, false),
  ('tautog',             'Tautog (blackfish)',                'Tautoga onitis',             false, null, 'salt', 'regulated', 413, false),
  ('atlantic_cod',       'Atlantic cod',                      'Gadus morhua',               false, null, 'salt', 'regulated', 414, false),
  ('pollock',            'Pollock',                           'Pollachius virens',          false, null, 'salt', 'open',      415, false),
  ('false_albacore',     'False albacore',                    'Euthynnus alletteratus',     false, null, 'salt', 'open',      416, false),
  ('weakfish',           'Weakfish',                          'Cynoscion regalis',          false, null, 'salt', 'regulated', 417, false),

  -- Florida / Gulf inshore + nearshore
  ('common_snook',       'Snook',                             'Centropomus undecimalis',    false, null, 'salt', 'regulated', 420, false),
  ('red_drum',           'Redfish (red drum)',                'Sciaenops ocellatus',        false, null, 'salt', 'regulated', 421, false),
  ('atlantic_tarpon',    'Tarpon',                            'Megalops atlanticus',        false, null, 'salt', 'regulated', 422, false),
  ('spotted_seatrout',   'Spotted seatrout (speckled trout)', 'Cynoscion nebulosus',        false, null, 'salt', 'regulated', 423, false),
  ('gray_snapper',       'Mangrove snapper (gray)',           'Lutjanus griseus',           false, null, 'salt', 'regulated', 424, false),
  ('yellowtail_snapper', 'Yellowtail snapper',                'Ocyurus chrysurus',          false, null, 'salt', 'regulated', 425, false),
  ('southern_flounder',  'Southern flounder',                 'Paralichthys lethostigma',   false, null, 'salt', 'regulated', 426, false),
  ('sheepshead',         'Sheepshead',                        'Archosargus probatocephalus',false, null, 'salt', 'regulated', 427, false),
  ('permit',             'Permit',                            'Trachinotus falcatus',       false, null, 'salt', 'regulated', 428, false),
  ('atlantic_bonefish',  'Bonefish',                          'Albula vulpes',              false, null, 'salt', 'regulated', 429, false),

  -- Florida / Gulf offshore
  ('red_snapper',        'Red snapper',                       'Lutjanus campechanus',       false, null, 'salt', 'regulated', 430, false),
  ('gag_grouper',        'Gag grouper',                       'Mycteroperca microlepis',    false, null, 'salt', 'regulated', 431, false),
  ('goliath_grouper',    'Goliath grouper',                   'Epinephelus itajara',        false, null, 'salt', 'protected', 432, false),
  ('king_mackerel',      'King mackerel',                     'Scomberomorus cavalla',      false, null, 'salt', 'regulated', 433, false),
  ('spanish_mackerel',   'Spanish mackerel',                  'Scomberomorus maculatus',    false, null, 'salt', 'regulated', 434, false),
  ('cobia',              'Cobia',                             'Rachycentron canadum',       false, null, 'salt', 'regulated', 435, false),
  ('greater_amberjack',  'Greater amberjack',                 'Seriola dumerili',           false, null, 'salt', 'regulated', 436, false),
  ('hogfish',            'Hogfish',                           'Lachnolaimus maximus',       false, null, 'salt', 'regulated', 437, false),

  -- tropical offshore — Hawaii, Baja, shared pelagics
  ('wahoo',              'Wahoo (ono)',                       'Acanthocybium solandri',     false, null, 'salt', 'open',      440, false),
  ('blue_marlin',        'Blue marlin',                       'Makaira nigricans',          false, null, 'salt', 'regulated', 441, false),
  ('black_marlin',       'Black marlin',                      'Istiompax indica',           false, null, 'salt', 'regulated', 442, false),
  ('striped_marlin',     'Striped marlin',                    'Kajikia audax',              false, null, 'salt', 'regulated', 443, false),
  ('sailfish',           'Pacific sailfish',                  'Istiophorus platypterus',    false, null, 'salt', 'regulated', 444, false),
  ('skipjack_tuna',      'Skipjack tuna (aku)',               'Katsuwonus pelamis',         false, null, 'salt', 'open',      445, false),
  ('giant_trevally',     'Giant trevally (ulua)',             'Caranx ignobilis',           false, null, 'salt', 'open',      446, false),
  ('bluefin_trevally',   'Bluefin trevally (omilu)',          'Caranx melampygus',          false, null, 'salt', 'open',      447, false),
  ('green_jobfish',      'Green jobfish (uku)',               'Aprion virescens',           false, null, 'salt', 'regulated', 448, false),
  ('roosterfish',        'Roosterfish',                       'Nematistius pectoralis',     false, null, 'salt', 'open',      449, false),
  ('sierra_mackerel',    'Sierra mackerel',                   'Scomberomorus sierra',       false, null, 'salt', 'open',      450, false),

  -- freshwater
  ('trout',              'Trout',                             'Salmonidae',                 true,  null,      'fresh', 'regulated', 500, true),
  ('catfish',            'Catfish',                           'Siluriformes',               true,  null,      'fresh', 'open',      501, true),
  ('walleye',            'Walleye',                           'Sander vitreus',             false, null,      'fresh', 'regulated', 502, false),
  ('yellow_perch',       'Yellow perch',                      'Perca flavescens',           false, null,      'fresh', 'open',      503, false),
  ('smallmouth_bass',    'Smallmouth bass',                   'Micropterus dolomieu',       false, null,      'fresh', 'regulated', 504, false),
  ('largemouth_bass',    'Largemouth bass',                   'Micropterus salmoides',      false, null,      'fresh', 'regulated', 505, false),
  ('lake_trout',         'Lake trout',                        'Salvelinus namaycush',       false, 'trout',   'fresh', 'regulated', 506, false),
  ('steelhead',          'Steelhead',                         'Oncorhynchus mykiss',        false, 'trout',   'fresh', 'regulated', 507, false),
  ('brown_trout',        'Brown trout',                       'Salmo trutta',               false, 'trout',   'fresh', 'regulated', 508, false),
  ('muskellunge',        'Muskellunge (muskie)',              'Esox masquinongy',           false, null,      'fresh', 'regulated', 509, false),
  ('northern_pike',      'Northern pike',                     'Esox lucius',                false, null,      'fresh', 'open',      510, false),
  ('black_crappie',      'Black crappie',                     'Pomoxis nigromaculatus',     false, null,      'fresh', 'regulated', 511, false),
  ('bluegill',           'Bluegill',                          'Lepomis macrochirus',        false, null,      'fresh', 'open',      512, false),
  ('channel_catfish',    'Channel catfish',                   'Ictalurus punctatus',        false, 'catfish', 'fresh', 'open',      513, false)
on conflict (id) do nothing;
