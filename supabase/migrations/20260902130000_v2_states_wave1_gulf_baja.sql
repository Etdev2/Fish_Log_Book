-- States expansion wave 1 (spec docs/specs/fish-legal-expansion.md, addendum
-- 2026-09-02): Gulf coast (TX/TPWD, LA/LDWF, MS/MDMR, AL/ADCNR) + Mexico (Baja
-- California, Baja California Sur — CONAPESCA NOM-017-PESC-1994, federal, so emitted
-- once per area). GENERATED deterministically from the six pack bundles via
-- scripts/gen-states-wave1.mts — edit bundles, regenerate; appendix species inserts
-- below mirror src/core/ontology/species.ts additions (puning guard in tests).
-- area.kind reuses 'ocean_region' — CHECK constraint untouched.

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('black_drum', 'Black drum', 'Pogonias cromis', false, null, 'salt', 'regulated', 437, false),
  ('tripletail', 'Tripletail', 'Lobotes surinamensis', false, null, 'salt', 'regulated', 438, false),
  ('gray_triggerfish', 'Gray triggerfish', 'Balistes capriscus', false, null, 'salt', 'regulated', 439, false),
  ('vermilion_snapper', 'Vermilion snapper (beeliner)', 'Rhomboplites aurorubens', false, null, 'salt', 'regulated', 440, false),
  ('lane_snapper', 'Lane snapper', 'Lutjanus synagris', false, null, 'salt', 'regulated', 441, false),
  ('mutton_snapper', 'Mutton snapper', 'Lutjanus analis', false, null, 'salt', 'regulated', 442, false),
  ('sand_seatrout', 'Sand seatrout (white trout)', 'Cynoscion arenarius', false, null, 'salt', 'open', 443, false)
on conflict (id) do nothing;

insert into public.reg_pack (id, version, published_at, notes) values
  ('texas-2026-09-01', 1, '2026-09-01T12:00:00Z', 'Texas (TPWD Outdoor Annual 2026-2027, valid Sep 1 2026–Aug 31 2027): flagship inshore + reef species with verbatim clause text; 2026-27 red snapper federal season flagged check-in-season. Tags (Red Drum Tag, Spotted Seatrout Tag) are the paper exception layer and are quoted, not modeled.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('tx-gulf', 'tpwd', 'ocean_region', 'Texas — coastal waters envelope', null, null, 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits', '2026-09-02', 'Envelope for pack resolution and boundary folds; 9-nm state/200-nm EEZ split quoted in rules, not drawn.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('red_drum', null, 'tx-gulf', 'salt', 'bag_limit', 'Red drum — Daily Bag: 3. Min Length: 20 inches. Max Length: 28 inches. During a license year, one red drum over the stated maximum length limit may be retained when affixed with a properly completed Red Drum Tag and one red drum over the stated maximum length limit may be retained when affixed with a properly completed Bonus Red Drum Tag; fish retained under authority of a tag may be retained in addition to the daily bag and possession limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/drum-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Drum Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 3, 6, 20, 28, 'total_length', null, null, false, 60),
  ('spotted_seatrout', null, 'tx-gulf', 'salt', 'bag_limit', 'Spotted seatrout — Daily Bag: 3. Min Length: 15 inches. Max Length: 20 inches. During a license year, one spotted seatrout over 28 inches may be retained when affixed with a properly completed Spotted Seatrout Tag and one over 28 inches via a Bonus Spotted Seatrout Tag; tag fish are retained in addition to the daily bag and possession limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/seatrout-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Seatrout Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 3, 6, 15, 20, 'total_length', null, null, false, 60),
  ('southern_flounder', null, 'tx-gulf', 'salt', 'bag_limit', 'Flounder — all species, their hybrids and subspecies: Daily Bag: 5. Min Length: 15 inches. Max Length: No limit. Daily bag is 5 fish except Nov 1 – Dec 14 (fishery closed; bag limit = 0). Possession limit = the daily bag.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/flounder-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Flounder Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 5, 5, 15, null, 'total_length', null, null, false, 60),
  ('southern_flounder', null, 'tx-gulf', 'salt', 'season', 'Flounder — all species: bag limit = 0 between Nov 1 and Dec 14 (fishery closed). Outside the closure, daily bag is 5 fish, min length 15 inches; possession limit = the daily bag.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/flounder-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Flounder Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   '2026-11-01', '2026-12-14', null, null, null, null, null, null, null, false, 60),
  ('black_drum', null, 'tx-gulf', 'salt', 'bag_limit', 'Black drum — Daily Bag: 5. Min Length: 14 inches. Max Length: 30 inches. No more than one black drum over 52 inches may be retained per person per day and counts as part of the daily bag limit and possession limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/drum-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Drum Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 5, 10, 14, 30, 'total_length', null, null, false, 60),
  ('sheepshead', null, 'tx-gulf', 'salt', 'bag_limit', 'Sheepshead — Daily Bag: 5. Min Length: 15 inches. Max Length: No limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/sheepshead-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Sheepshead Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 5, 10, 15, null, 'total_length', null, null, false, 60),
  ('common_snook', null, 'tx-gulf', 'salt', 'bag_limit', 'Snook — Daily Bag: 1. Min Length: 24 inches. Max Length: 28 inches.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/snook-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Snook Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 1, 2, 24, 28, 'total_length', null, null, false, 60),
  ('king_mackerel', null, 'tx-gulf', 'salt', 'bag_limit', 'King mackerel — Daily Bag: 3. Min Length: 27 inches. Max Length: No limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/mackerel-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Mackerel Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 3, 6, 27, null, 'total_length', null, null, false, 60),
  ('spanish_mackerel', null, 'tx-gulf', 'salt', 'bag_limit', 'Spanish mackerel — Daily Bag: 15. Min Length: 14 inches. Max Length: No limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/mackerel-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Mackerel Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 15, 30, 14, null, 'total_length', null, null, false, 60),
  ('red_snapper', null, 'tx-gulf', 'salt', 'bag_limit', 'Red Snapper in State Waters — Open: Year-round. Bag limit: 4 fish per person daily. Size limit: 15-in minimum. Applies to private recreational anglers in state waters. Means & Methods: it is unlawful to use any kind of hook other than a circle hook when using natural bait.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/snapper-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 4, 8, 15, null, 'total_length', null, 'State waters only (0–9 nm); federal-waters season is quota-managed.', false, 60),
  ('red_snapper', null, 'tx-gulf', 'salt', 'note', 'Red Snapper Season in Federal Waters — Opens: May 22, 2026. Closes: in-season harvest will be monitored to determine the closure date. Bag limit: 2 fish per person daily; Size limit: 16-in minimum. Applies to private recreational anglers in federal waters.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/snapper-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, null, null, null, null, null, null, 'Federal waters 9–200 nm; closure date set in-season by harvest monitoring.', true, 30),
  ('lane_snapper', null, 'tx-gulf', 'salt', 'min_size', 'Lane snapper — Daily Bag: No limit. Min Length: 8 inches. Max Length: No limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/snapper-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, null, null, 8, null, 'total_length', null, null, false, 60),
  ('vermilion_snapper', null, 'tx-gulf', 'salt', 'min_size', 'Vermilion snapper — Daily Bag: No limit. Min Length: 10 inches. Max Length: No limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/snapper-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, null, null, 10, null, 'total_length', null, null, false, 60),
  ('cobia', null, 'tx-gulf', 'salt', 'bag_limit', 'Cobia — Daily Bag: 1. Min Length: 40 inches. Max Length: No limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/cobia-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Cobia Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 1, 2, 40, null, 'total_length', null, null, false, 60),
  ('tripletail', null, 'tx-gulf', 'salt', 'bag_limit', 'Tripletail — Daily Bag: 3. Min Length: 17 inches. Max Length: No limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/tripletail-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Tripletail Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 3, 6, 17, null, 'total_length', null, null, false, 60),
  ('greater_amberjack', null, 'tx-gulf', 'salt', 'bag_limit', 'Amberjack, greater — Daily Bag: 1. Min Length: 38 inches. Max Length: No limit.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/amberjack-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Amberjack Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, 1, 2, 38, null, 'fork_length', null, null, false, 60),
  ('red_snapper', null, 'tx-gulf', 'salt', 'gear', 'Texas regulations now require all commercial and recreational anglers fishing in state waters to use a venting tool or rigged descending device on reef fish exhibiting signs of barotrauma; per the 2022 DESCEND Act, similar requirements are in place for boats fishing for reef fish in federal waters.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/saltwater-fishing/bag-length-limits/snapper-bag-length-limits', 'TPWD Outdoor Annual 2026-2027 — Snapper Bag & Length Limits (valid 2026-09-01..2027-08-31)', '2026-09-01', '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 60),
  (null, null, 'tx-gulf', 'salt', 'note', 'The daily bag limit is 1 fish for all allowable shark species INCLUDING Atlantic sharpnose, blacktip and bonnethead; non-offset, non-stainless steel circle hooks must be used when fishing for shark in state waters. Prohibited shark species may not be retained at all.', 'https://tpwd.texas.gov/regulations/outdoor-annual/fishing/shark-regulations', 'TPWD Outdoor Annual 2026-2027 — Shark Regulations', '2026-09-01', '2026-09-02', 1,
   null, null, 1, 2, null, null, null, null, null, false, 60);


insert into public.reg_pack (id, version, published_at, notes) values
  ('louisiana-2026-09-01', 1, '2026-09-01T12:00:00Z', 'Louisiana (LDWF 2025 Recreational Fishing Regulations + LDWF species pages): the .redfish/trout 2024 reset is encoded (trout 15 @ 13–20 slot w/ ≤2 over 20 inside the creel; redfish 4 @ 18–27, no oversize allowance, for-hire crew = zero). State-managed red snapper season/quotas are check-in-season.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('la-gulf', 'ldwf', 'ocean_region', 'Louisiana — coastal waters envelope', null, null, 'https://www.wlf.louisiana.gov/page/recreational-fishing-regulations', '2026-09-02', 'Envelope for pack resolution and boundary folds; state waters extend 3 nm (LDWF).')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('spotted_seatrout', null, 'la-gulf', 'salt', 'bag_limit', 'SPOTTED SEATROUT (Speckled Trout): 13” min total length, 20” max total length; 15 daily per person with no more than 2 over 20” max total length. Retention by captain and crew on charter or head boats while on a for-hire trip is prohibited. Take or possession of spotted seatrout in federal waters: same limits as state.', 'https://www.wlf.louisiana.gov/assets/Resources/Publications/Regulations/25LAFW.pdf', 'LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)', '2025-02-04', '2026-09-02', 1,
   null, null, 15, 30, 13, 20, 'total_length', null, 'Slot: no more than 2 over 20” inside the 15-fish creel; for-hire captain/crew creel = 0.', false, 60),
  ('red_drum', null, 'la-gulf', 'salt', 'bag_limit', 'RED DRUM (Redfish): 18” min total length; 27” max total length; 4 daily per person. No retention allowance for fish over 27 inches. Retention by captain and crew on charter or head boats while on a for-hire trip is prohibited. Take or possession of red drum in federal waters is prohibited.', 'https://www.wlf.louisiana.gov/assets/Resources/Publications/Regulations/25LAFW.pdf', 'LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)', '2025-02-04', '2026-09-02', 1,
   null, null, 4, 8, 18, 27, 'total_length', null, 'Fed-waters take prohibited; for-hire captain/crew creel = 0.', false, 60),
  ('black_drum', null, 'la-gulf', 'salt', 'bag_limit', 'BLACK DRUM: 16” min total length; 5 daily per person; no more than 1 over 27” (max TL) may be kept. Possession limit is twice the daily creel limit unless otherwise stated.', 'https://www.wlf.louisiana.gov/assets/Resources/Publications/Regulations/25LAFW.pdf', 'LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)', '2025-02-04', '2026-09-02', 1,
   null, null, 5, 10, 16, 27, 'total_length', null, 'One >27” bull counts inside the 5-fish creel.', false, 60),
  ('sheepshead', null, 'la-gulf', 'salt', 'bag_limit', 'SHEEPSHEAD: 10 daily per person; 12” min total length (12” fork-length conversions in older tables refer to fork length).', 'https://www.wlf.louisiana.gov/assets/Resources/Publications/Regulations/25LAFW.pdf', 'LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)', '2025-02-04', '2026-09-02', 1,
   null, null, 10, 20, 12, null, 'total_length', null, null, false, 60),
  ('southern_flounder', null, 'la-gulf', 'salt', 'bag_limit', 'SOUTHERN FLOUNDER — summarized, not quoted (exact LDWF clause text not captured at pack authoring): 10 daily per person, 12-inch minimum total length, year-round. Verify on the LDWF regulations page before each season; changes follow commission action.', 'https://www.wlf.louisiana.gov/page/recreational-saltwater-fishing', 'LDWF — Recreational saltwater fishing', null, '2026-09-02', 1,
   null, null, 10, 20, 12, null, 'total_length', null, null, true, 60),
  ('red_snapper', null, 'la-gulf', 'salt', 'note', 'RED SNAPPER (state management): seasons are opened/closed by LDWF against the state quota; when open, seasons run Fridays–Sundays per season notice; bag and size within state waters are set in the season notice (2024: 2/day, 16” min — verify the current notice). LAKES AND BAYOUS: possession in state waters when the season is closed is prohibited.', 'https://www.wlf.louisiana.gov/page/red-snapper', 'LDWF — Red Snapper', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, 'Season announced against quota; check LDWF before each trip.', true, 14),
  ('greater_amberjack', null, 'la-gulf', 'salt', 'bag_limit', 'AMBERJACK, GREATER: 34” min fork length; 1 daily per person.', 'https://www.wlf.louisiana.gov/assets/Resources/Publications/Regulations/25LAFW.pdf', 'LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)', '2025-02-04', '2026-09-02', 1,
   null, null, 1, 2, 34, null, 'fork_length', null, null, false, 60),
  ('gray_triggerfish', null, 'la-gulf', 'salt', 'bag_limit', 'GRAY TRIGGERFISH: 15” min fork length; 1 daily per person in aggregate (reef fish aggregate rules apply in federal waters as posted by the Gulf Council).', 'https://www.wlf.louisiana.gov/assets/Resources/Publications/Regulations/25LAFW.pdf', 'LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)', '2025-02-04', '2026-09-02', 1,
   null, null, 1, 2, 15, null, 'fork_length', null, null, false, 60),
  ('atlantic_tarpon', null, 'la-gulf', 'salt', 'note', 'Tarpon — summarized, not quoted: Louisiana treats tarpon harvest as effectively tag-limited and unusual; the in-practice rule is catch-and-release. Any retention requires confirming a current LDWF tarpon rule/tags before keeping.', 'https://www.wlf.louisiana.gov/page/recreational-saltwater-fishing', 'LDWF — Recreational saltwater fishing', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, true, 30),
  (null, null, 'la-gulf', 'salt', 'note', 'Possession limit is TWICE the daily creel limit unless otherwise stated. Recreational saltwater anglers may possess a two days’ bag limit on land; no person shall be in possession of fish over the daily bag limit in any one day or while fishing or while on the water.', 'https://www.wlf.louisiana.gov/assets/Resources/Publications/Regulations/25LAFW.pdf', 'LDWF — 2025 Louisiana Recreational Fishing Regulations (official booklet)', '2025-02-04', '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 60);


insert into public.reg_pack (id, version, published_at, notes) values
  ('mississippi-2026-09-01', 1, '2026-09-01T12:00:00Z', 'Mississippi (MDMR Recreational Catch Limits card): inshore + reef flagship species with the agency table''s own numbers; red snapper reporting (Tails n'' Scales) and announced season are quoted. State waters = 9 nm south of the barrier islands for state for-hire boats; federal Gulf rules apply beyond.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('ms-gulf', 'mdmr', 'ocean_region', 'Mississippi — coastal waters envelope', null, null, 'https://dmr.ms.gov/recreational-catch-limits/', '2026-09-02', 'Envelope for pack resolution and boundary folds (Biloxi/Gulfport inside).')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('spotted_seatrout', null, 'ms-gulf', 'salt', 'bag_limit', 'Spotted Seatrout: 15 TL minimum; 15 bag/possession.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 15, 15, 15, null, 'total_length', null, null, false, 60),
  ('red_drum', null, 'ms-gulf', 'salt', 'bag_limit', 'Red Drum: 18 TL to 30 TL; 3 bag/possession. Recreational fishermen may retain only one red drum over 30 inches.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 3, 3, 18, 30, 'total_length', null, 'One >30” bull counts inside the 3.', false, 60),
  ('southern_flounder', null, 'ms-gulf', 'salt', 'bag_limit', 'Flounder: 12 TL minimum; 10 bag/possession.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 10, 10, 12, null, 'total_length', null, null, false, 60),
  ('sheepshead', null, 'ms-gulf', 'salt', 'bag_limit', 'Sheepshead: 14 TL minimum; 15 bag/possession.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 15, 15, 14, null, 'total_length', null, null, false, 60),
  ('gray_snapper', null, 'ms-gulf', 'salt', 'bag_limit', 'Gray Snapper: 12 TL minimum; 10 bag/possession (see Reef Fish section for harvest in aggregate with other snapper species).', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 10, 10, 12, null, 'total_length', null, 'Federal 10-snapper aggregate applies in federal waters (gulfcouncil.org).', false, 60),
  ('red_snapper', null, 'ms-gulf', 'salt', 'bag_limit', 'Red Snapper: 16 TL minimum; 2 bag/possession. Reporting is required for Red Snapper trips and landings through the Tails n’ Scales program. Seasons are set annually by the Executive Director against the state quota (2025 season opened May 23 and ran seven days a week in state and federal waters until the annual catch limit was projected to be met).', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 2, 2, 16, null, 'total_length', null, 'Open/close announced per season; Tails n’ Scales reporting mandatory.', true, 30),
  ('cobia', null, 'ms-gulf', 'salt', 'bag_limit', 'Cobia: 36 FL minimum; 2 bag/possession.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 2, 2, 36, null, 'fork_length', null, null, false, 60),
  ('tripletail', null, 'ms-gulf', 'salt', 'bag_limit', 'Tripletail: 18 TL minimum; 3 bag/possession.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 3, 3, 18, null, 'total_length', null, null, false, 60),
  ('king_mackerel', null, 'ms-gulf', 'salt', 'bag_limit', 'King Mackerel: 24 FL minimum; 3 bag/possession.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 3, 3, 24, null, 'fork_length', null, null, false, 60),
  ('spanish_mackerel', null, 'ms-gulf', 'salt', 'bag_limit', 'Spanish Mackerel: 12 FL minimum; 15 bag/possession.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 15, 15, 12, null, 'fork_length', null, null, false, 60),
  ('vermilion_snapper', null, 'ms-gulf', 'salt', 'bag_limit', 'Vermilion Snapper: 10 TL minimum; 10 bag/possession; counts in the 20 Reef Fish Aggregate (with gray triggerfish, lane snapper, almaco jack, and tilefish).', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 10, 10, 10, null, 'total_length', null, '20 Reef Fish Aggregate is quoted, not yet a modeled group — pack-v2 debt.', false, 60),
  ('lane_snapper', null, 'ms-gulf', 'salt', 'bag_limit', 'Lane Snapper: 8 TL minimum; 20 bag/possession; counts in the 20 Reef Fish Aggregate.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 20, 20, 8, null, 'total_length', null, null, false, 60),
  ('greater_amberjack', null, 'ms-gulf', 'salt', 'bag_limit', 'Greater Amberjack: 34 FL minimum; 1 bag/possession.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, 1, 1, 34, null, 'fork_length', null, null, false, 60),
  ('atlantic_tarpon', null, 'ms-gulf', 'salt', 'note', 'Tarpon: 75 FL minimum; 1 per vessel. May not remove fish from water if over 40 inches in length unless harvesting within specified limits.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, null, null, 75, null, 'fork_length', 'boat', 'Per-VESSEL, not per-person.', false, 60),
  (null, null, 'ms-gulf', 'salt', 'note', 'It is illegal to sell any seafood taken with a recreational license.', 'https://dmr.ms.gov/recreational-catch-limits/', 'MDMR — Recreational Catch Limits (official quick card)', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 90);


insert into public.reg_pack (id, version, published_at, notes) values
  ('alabama-2026-09-01', 1, '2026-09-01T12:00:00Z', 'Alabama (ADCNR Marine Resources Division): inshore flagship slots verified against agency releases; red snapper via Snapper Check + announced season; sheepshead 2025 reduction (10→8) quoted from the regulation-change reports. Snapper Check is mandatory before landing — read the note row before your first snapper trip.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('al-gulf', 'adcnr', 'ocean_region', 'Alabama — coastal waters envelope', null, null, 'https://www.outdooralabama.com/marine-resources', '2026-09-02', 'Envelope for pack resolution and boundary folds (Gulf Shores/Orange Beach inside; Mobile city out).')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('spotted_seatrout', null, 'al-gulf', 'salt', 'bag_limit', 'Spotted seatrout (speckled trout): 6 daily per person; 15–22 inch total-length slot; only one spotted seatrout larger than 22 inches may be kept (within the 6-fish bag).', 'https://www.outdooralabama.com/node/2632', 'ADCNR — Seatrout, Flounder Limits Change August 1 (MRD regulation-change release)', '2019-07-02', '2026-09-02', 1,
   null, null, 6, 6, 15, 22, 'total_length', null, 'One fish >22” counts inside the 6.', false, 60),
  ('red_drum', null, 'al-gulf', 'salt', 'bag_limit', 'Red drum (redfish): 3 daily per person; 16–26 inch total-length slot; an allowance for one fish larger than 26 inches (bull red) is included. (2025 Advisory Board proposed removing the oversize allowance — verify before keeping a bull red.)', 'https://www.outdooralabama.com/node/2632', 'ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)', '2019-07-02', '2026-09-02', 1,
   null, null, 3, 3, 16, 26, 'total_length', null, 'One bull red >26” allowed inside the 3 (pending 2025 proposed change).', true, 60),
  ('southern_flounder', null, 'al-gulf', 'salt', 'bag_limit', 'Flounder: bag of five per person for recreational anglers; 14 inches total length minimum. The entire month of November is closed to flounder fishing, both recreational and commercial.', 'https://www.outdooralabama.com/node/2632', 'ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)', '2019-07-02', '2026-09-02', 1,
   null, null, 5, 5, 14, null, 'total_length', null, 'Closed all November.', false, 60),
  ('southern_flounder', null, 'al-gulf', 'salt', 'season', 'The entire month of November is closed to flounder fishing, both recreational and commercial (November is when flounder migrate to the Gulf of Mexico to spawn).', 'https://www.outdooralabama.com/node/2632', 'ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)', '2019-07-02', '2026-09-02', 1,
   '2026-11-01', '2026-11-30', null, null, null, null, null, null, null, false, 60),
  ('sheepshead', null, 'al-gulf', 'salt', 'bag_limit', 'Sheepshead: 12-inch fork length minimum; bag 8 per person per day — reduced from 10 in 2025 due to increased fishing pressure (verify the 2026 card; the reduction was approved in the 2025 regulation cycle).', 'https://www.outdooralabama.com/fishing/saltwater-fishing-and-reports', 'ADCNR — saltwater fishing reports & limits', null, '2026-09-02', 1,
   null, null, 8, 8, 12, null, 'fork_length', null, null, true, 60),
  ('red_snapper', null, 'al-gulf', 'salt', 'note', 'Red snapper: Alabama state waters and federal waters opened to private and state-licensed charter anglers on Friday, May 23, 2025; the 2025 private-angler quota was 664,552 pounds and the season closed December 31, 2025. The 2026 quota will be 664,552 pounds and MRD will announce the dates for the 2026 fishing season in the spring. Bag while open: 2 fish per person per day; 16-inch minimum. The owner or operator of each vessel landing red snapper in Alabama is required by law to complete one landing report per vessel trip of their harvested red snapper through Snapper Check prior to removing the fish from the boat.', 'https://www.outdooralabama.com/articles/alabamas-red-snapper-season-continues-through-december-31', 'ADCNR — Alabama’s Red Snapper Season Continues Through December 31 (2025-12-22)', '2025-12-22', '2026-09-02', 1,
   null, null, null, null, null, null, null, null, 'Season dates announced each spring; Snapper Check report required BEFORE landing.', true, 14),
  ('king_mackerel', null, 'al-gulf', 'salt', 'bag_limit', 'King mackerel: 24-inch fork length minimum; 3 per person per day (Alabama creel card; federal Gulf migratory-group rules control in federal waters).', 'https://www.outdooralabama.com/fishing/saltwater-fishing-and-reports', 'ADCNR — saltwater fishing reports & limits', null, '2026-09-02', 1,
   null, null, 3, 3, 24, null, 'fork_length', null, null, false, 60),
  ('spanish_mackerel', null, 'al-gulf', 'salt', 'bag_limit', 'Spanish mackerel: 15 per person per day; no minimum size in Alabama state rules (federal Gulf rules apply offshore).', 'https://www.outdooralabama.com/fishing/saltwater-fishing-and-reports', 'ADCNR — saltwater fishing reports & limits', null, '2026-09-02', 1,
   null, null, 15, 15, null, null, null, null, null, false, 60),
  ('gray_triggerfish', null, 'al-gulf', 'salt', 'bag_limit', 'Gray triggerfish: 1 per person per day; 15-inch fork length minimum (Alabama creel card); when the season is open triggerfish must be reported in Snapper Check.', 'https://www.outdooralabama.com/fishing/saltwater-fishing-and-reports', 'ADCNR — saltwater fishing reports & limits', null, '2026-09-02', 1,
   null, null, 1, 1, 15, null, 'fork_length', null, 'Snapper Check when season open.', true, 60),
  ('cobia', null, 'al-gulf', 'salt', 'bag_limit', 'Cobia: 36 inches fork length; 2 per person per day (MRD approval notice; consistent with federal regulations).', 'https://www.outdooralabama.com/node/2632', 'ADCNR — Seatrout, Flounder Limits Change August 1 (agency text)', '2019-07-02', '2026-09-02', 1,
   null, null, 2, 2, 36, null, 'fork_length', null, null, false, 60),
  (null, null, 'al-gulf', 'salt', 'gear', 'All vessels fishing for reef fish in federal waters are required to have a venting tool or descending device rigged and ready to use.', 'https://www.outdooralabama.com/articles/2025-red-snapper-season-modified-provide-increased-fishing-opportunities', 'ADCNR — 2025 Red Snapper Season announcement', '2025-03-13', '2026-09-02', 1,
   null, null, null, null, null, null, null, 'boat', null, false, 60),
  ('goliath_grouper', null, 'al-gulf', 'salt', 'prohibited', 'Goliath grouper and Nassau grouper are prohibited from harvest (Alabama and federal rules).', 'https://www.outdooralabama.com/fishing/saltwater-fishing-and-reports', 'ADCNR — saltwater fishing reports & limits', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 90);


insert into public.reg_pack (id, version, published_at, notes) values
  ('baja-california-2026-09-01', 1, '2026-09-01T12:00:00Z', 'Baja California (CONAPESCA / NOM-017-PESC-1994): federal sport catch ceilings apply nationwide — identical clauses as Baja California Sur. Envelope covers the Pacific coast (Tijuana–Punta Eugenia) and the Upper Gulf side to 28° N.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('mx-baja-california', 'conapesca', 'ocean_region', 'Baja California — coastal waters envelope', null, null, 'https://www.gob.mx/conapesca', '2026-09-02', 'Envelope spans peninsula (Ensenada & San Felipe inside; California out).')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  (null, null, 'mx-baja-california', 'salt', 'note', '4.7.1 Diez ejemplares diarios por pescador, con la siguiente composición por especie: No más de cinco de una misma especie. (Ten fish per person per day, no more than five of a single species.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 10, 10, null, null, null, null, 'Total-day composite rule; per-species ceilings below.', false, 90),
  ('striped_marlin', null, 'mx-baja-california', 'salt', 'bag_limit', 'Cuando se trate de marlin, pez vela, pez espada y tiburón, el límite máximo por pescador y día será de un solo ejemplar de cualquiera de estas especies, el cual será equivalente a cinco ejemplares de otras especies. (For marlin, sailfish, swordfish or shark: ONE specimen a day of any of these — counting as five of the day''s ten.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 1, 1, null, null, null, null, 'One billfish/shark of ANY of those species per day; counts as 5 of the 10.', false, 90),
  ('sailfish', null, 'mx-baja-california', 'salt', 'bag_limit', 'Cuando se trate de marlin, pez vela, pez espada y tiburón, el límite máximo por pescador y día será de un solo ejemplar de cualquiera de estas especies... (For marlin, sailfish, swordfish or shark: ONE specimen a day of any of these, counting as five of the day''s ten.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 1, 1, null, null, null, null, 'Shared with marlin/shark group — one total.', false, 90),
  ('dorado', null, 'mx-baja-california', 'salt', 'bag_limit', 'En el caso de sábalo, dorado o pez gallo, el límite máximo será de dos ejemplares de dichas especies, el cual será equivalente a cinco ejemplares de otras especies. (For tarpon, dorado or roosterfish: TWO per day from this group, each counting as five of the day''s ten.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 2, 2, null, null, null, null, 'Two TOTAL across tarpon/dorado/roosterfish; each counts as 5 of the 10.', false, 90),
  ('roosterfish', null, 'mx-baja-california', 'salt', 'bag_limit', 'En el caso de sábalo, dorado o pez gallo, el límite máximo será de dos ejemplares de dichas especies... (Tarpon, dorado or roosterfish: two per day from this group, each counting as five of the day''s ten.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 2, 2, null, null, null, null, 'Shared 2/day across the group.', false, 90),
  (null, null, 'mx-baja-california', 'salt', 'note', '4.8 En actividades de pesca deportivo recreativa con embarcaciones cuyos viajes tengan una duración de más de tres días, el número máximo acumulable de ejemplares... será el equivalente a tres días de pesca. (Trips longer than three days may accumulate at most three days'' quota.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, 'boat', null, false, 90),
  (null, null, 'mx-baja-california', 'salt', 'gear', '4.9 La pesca subacuática tendrá como límite máximo de captura cinco ejemplares... por pescador y día. (Spearfishing: five fish per person per day, inside the same composition rules.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 5, 5, null, null, null, 'diver', null, false, 90),
  (null, null, 'mx-baja-california', 'salt', 'note', '4.10 ...sin perjuicio de que pueda pescar un mayor número de ejemplares a condición de que los organismos que excedan a dichas cuotas, sean devueltos a su medio natural en buenas condiciones de sobrevivencia («captura y liberación»). (You may continue fishing past quota if the extras are released in good condition — legal catch-and-release.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 90),
  (null, null, 'mx-baja-california', 'salt', 'note', 'CONAPESCA Guía de Pesca Deportiva: las especies marlin, pez vela, pez espada, sábalo, pez gallo y pez dorado están destinadas exclusivamente a la pesca deportiva dentro de una franja de 50 millas náuticas; prohibido el desembarco de ejemplares fileteados. (Billfish, tarpon, roosterfish and dorado are sport-only inside 50 nm; you may not land fish already filleted.)', 'https://www.gob.mx/conapesca/documentos/guia-de-pesca-deportiva?state=published', 'CONAPESCA — Guía de Pesca Deportiva', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 90),
  (null, null, 'mx-baja-california', 'salt', 'note', 'La práctica de la pesca deportivo recreativa requiere permiso/licencia de la CONAPESCA... la pesca deportiva comercializable... está prohibida. (A Mexican sport-fishing permit is required for every person fishing; selling sport-caught fish is prohibited. Buy permits via CONAPESCA/authorized dealers.)', 'https://www.gob.mx/conapesca/documentos/guia-de-pesca-deportiva?state=published', 'CONAPESCA — Guía de Pesca Deportiva', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 90),
  (null, null, 'mx-baja-california', 'salt', 'note', '4.11 La práctica de la pesca deportivo recreativa queda sujeta a las tallas y pesos mínimos de captura por especie y zona, que establezca la Secretaría... medidas que se notificarán mediante avisos publicados en el Diario Oficial de la Federación. (Minimum sizes/weights by species and zone are set by DOF notices — check the current Diario Oficial notice before keeping unusual species.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, true, 60);


insert into public.reg_pack (id, version, published_at, notes) values
  ('baja-california-sur-2026-09-01', 1, '2026-09-01T12:00:00Z', 'Baja California Sur (CONAPESCA / NOM-017-PESC-1994): federal sport catch ceilings; same clauses as Baja California (no state-level catch-limit divergence found — state differences are in licensing/boat permits, not bags). Envelope covers La Paz to Cabo San Lucas.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('mx-baja-california-sur', 'conapesca', 'ocean_region', 'Baja California Sur — coastal waters envelope', null, null, 'https://www.gob.mx/conapesca', '2026-09-02', 'Envelope spans peninsula (Cabo San Lucas & La Paz inside).')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_group_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  (null, null, 'mx-baja-california-sur', 'salt', 'note', '4.7.1 Diez ejemplares diarios por pescador, con la siguiente composición por especie: No más de cinco de una misma especie. (Ten fish per person per day, no more than five of a single species.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 10, 10, null, null, null, null, 'Total-day composite rule; per-species ceilings below.', false, 90),
  ('striped_marlin', null, 'mx-baja-california-sur', 'salt', 'bag_limit', 'Cuando se trate de marlin, pez vela, pez espada y tiburón, el límite máximo por pescador y día será de un solo ejemplar de cualquiera de estas especies, el cual será equivalente a cinco ejemplares de otras especies. (For marlin, sailfish, swordfish or shark: ONE specimen a day of any of these — counting as five of the day''s ten.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 1, 1, null, null, null, null, 'One billfish/shark of ANY of those species per day; counts as 5 of the 10.', false, 90),
  ('sailfish', null, 'mx-baja-california-sur', 'salt', 'bag_limit', 'Cuando se trate de marlin, pez vela, pez espada y tiburón, el límite máximo por pescador y día será de un solo ejemplar de cualquiera de estas especies... (For marlin, sailfish, swordfish or shark: ONE specimen a day of any of these, counting as five of the day''s ten.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 1, 1, null, null, null, null, 'Shared with marlin/shark group — one total.', false, 90),
  ('dorado', null, 'mx-baja-california-sur', 'salt', 'bag_limit', 'En el caso de sábalo, dorado o pez gallo, el límite máximo será de dos ejemplares de dichas especies, el cual será equivalente a cinco ejemplares de otras especies. (For tarpon, dorado or roosterfish: TWO per day from this group, each counting as five of the day''s ten.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 2, 2, null, null, null, null, 'Two TOTAL across tarpon/dorado/roosterfish; each counts as 5 of the 10.', false, 90),
  ('roosterfish', null, 'mx-baja-california-sur', 'salt', 'bag_limit', 'En el caso de sábalo, dorado o pez gallo, el límite máximo será de dos ejemplares de dichas especies... (Tarpon, dorado or roosterfish: two per day from this group, each counting as five of the day''s ten.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 2, 2, null, null, null, null, 'Shared 2/day across the group.', false, 90),
  (null, null, 'mx-baja-california-sur', 'salt', 'note', '4.8 En actividades de pesca deportivo recreativa con embarcaciones cuyos viajes tengan una duración de más de tres días, el número máximo acumulable de ejemplares... será el equivalente a tres días de pesca. (Trips longer than three days may accumulate at most three days'' quota.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, 'boat', null, false, 90),
  (null, null, 'mx-baja-california-sur', 'salt', 'gear', '4.9 La pesca subacuática tendrá como límite máximo de captura cinco ejemplares... por pescador y día. (Spearfishing: five fish per person per day, inside the same composition rules.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, 5, 5, null, null, null, 'diver', null, false, 90),
  (null, null, 'mx-baja-california-sur', 'salt', 'note', '4.10 ...sin perjuicio de que pueda pescar un mayor número de ejemplares a condición de que los organismos que excedan a dichas cuotas, sean devueltos a su medio natural en buenas condiciones de sobrevivencia («captura y liberación»). (You may continue fishing past quota if the extras are released in good condition — legal catch-and-release.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 90),
  (null, null, 'mx-baja-california-sur', 'salt', 'note', 'CONAPESCA Guía de Pesca Deportiva: las especies marlin, pez vela, pez espada, sábalo, pez gallo y pez dorado están destinadas exclusivamente a la pesca deportiva dentro de una franja de 50 millas náuticas; prohibido el desembarco de ejemplares fileteados. (Billfish, tarpon, roosterfish and dorado are sport-only inside 50 nm; you may not land fish already filleted.)', 'https://www.gob.mx/conapesca/documentos/guia-de-pesca-deportiva?state=published', 'CONAPESCA — Guía de Pesca Deportiva', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 90),
  (null, null, 'mx-baja-california-sur', 'salt', 'note', 'La práctica de la pesca deportivo recreativa requiere permiso/licencia de la CONAPESCA... la pesca deportiva comercializable... está prohibida. (A Mexican sport-fishing permit is required for every person fishing; selling sport-caught fish is prohibited. Buy permits via CONAPESCA/authorized dealers.)', 'https://www.gob.mx/conapesca/documentos/guia-de-pesca-deportiva?state=published', 'CONAPESCA — Guía de Pesca Deportiva', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, false, 90),
  (null, null, 'mx-baja-california-sur', 'salt', 'note', '4.11 La práctica de la pesca deportivo recreativa queda sujeta a las tallas y pesos mínimos de captura por especie y zona, que establezca la Secretaría... medidas que se notificarán mediante avisos publicados en el Diario Oficial de la Federación. (Minimum sizes/weights by species and zone are set by DOF notices — check the current Diario Oficial notice before keeping unusual species.)', 'https://www.gob.mx/cms/uploads/attachment/file/311370/NOM_017_PESC.pdf', 'NORMA Oficial Mexicana NOM-017-PESC-1994 (DOF) — pesca deportivo-recreativa', null, '2026-09-02', 1,
   null, null, null, null, null, null, null, null, null, true, 60);
