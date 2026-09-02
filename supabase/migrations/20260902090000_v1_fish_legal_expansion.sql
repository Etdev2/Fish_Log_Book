-- Fish Legal expansion (Phases 1+2+3, spec: docs/specs/fish-legal-expansion.md):
-- GENERATED deterministically from src/features/fish-legal/florida-pack.ts —
-- edit the bundle, run scripts/gen-florida-migration.mts, never hand-edit rows here.
-- Parity of verbatim sentences is test-guarded in BOTH directions (reg-data-parity).
-- Open question for the pack-v2 migration: species-scoped zero-retention rows and the
-- CCA/MPA geometry today only exist in the bundle (SQL v1 keeps boundary_geojson null).

alter table public.catch
  add column if not exists regulation_snapshot jsonb null;

comment on column public.catch.regulation_snapshot is
  'Fish Legal Phase 2 snapshot (spec §18): {pack_id, pack_version, jurisdiction_label, verdict, verdict_reason, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, evaluated_date} — the law as the card computed it at log time.';

insert into public.species (id, common_name, scientific_name, is_group, rolls_up_to, water_class, take_status, sort_order, needs_review) values
  ('florida_pompano', 'Florida Pompano', 'Trachinotus carolinus', false, null, 'salt', 'regulated', 429, false)
on conflict (id) do nothing;

insert into public.reg_pack (id, version, published_at, notes) values
  ('florida-2026-09-01', 1, '2026-09-01T12:00:00Z', 'Florida (FWC) saltwater v1: twelve flagship species, state-waters-first presentation with coast-split notes where Florida law itself splits. Grouper/snapper fisheries take federal season action mid-year — conditional verdicts point at the live source.')
on conflict (id) do nothing;

insert into public.reg_area (id, authority, kind, name, parent_id, boundary_geojson, source_url, verified_at, notes) values
  ('fl-state-waters', 'fwc', 'ocean_region', 'Florida state waters (all coasts, orientation ring)', null, null, 'https://www.eregulations.com/florida/fishing/saltwater/', '2026-09-01', 'State waters = shore to 3nm Atlantic / 9nm Gulf. Ring is the coastline envelope + panhandle land outline; use for ''which pack'', never for a line close call.'),
  ('fl-keys', 'fwc', 'ocean_region', 'Florida Keys corridor (orientation ring)', 'fl-state-waters', null, 'https://www.eregulations.com/florida/fishing/saltwater/', '2026-09-01', 'Oversized on purpose: catches the full Keys chain without self-intersection.'),
  ('fl-irl-cnr', 'fwc', 'conservation_area', 'Indian River Lagoon (catch & release only)', 'fl-state-waters', null, 'https://www.eregulations.com/florida/fishing/saltwater/coastal-species', '2026-09-01', 'FWC conservation-order zone for seatrout/redfish/snook. Orientation box over the lagoon corridor; inside it, harvest is prohibited regardless of statewide text.')
on conflict (id) do nothing;

insert into public.reg_rule
  (species_id, reg_area_id, water_class, kind, verbatim, source_url, source_title, source_updated_at, verified_at, pack_version,
   season_start, season_end, bag_daily, possession_limit, min_size_in, max_size_in, size_measure, platform_scope, depth_note, check_inseason, stale_after_days)
values
  ('red_drum', 'fl-state-waters', 'salt', 'bag_limit', 'Red drum: 1 fish per person per day where harvest is open; 18 to 27 inches total length slot; vessel limits vary by region (2–4). Catch and release only in the Indian River Lagoon zone.', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, 1, 1, 18, 27, 'total_length', null, null, false, 60),
  ('red_drum', 'fl-state-waters', 'salt', 'gear', 'Red drum must remain in whole condition until landed ashore (heads, fins, and tails intact).', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, false, 60),
  ('red_drum', 'fl-irl-cnr', 'salt', 'prohibited', 'Catch and release only in the Indian River Lagoon zone (FWC conservation order).', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, false, 30),
  ('spotted_seatrout', 'fl-state-waters', 'salt', 'bag_limit', 'Spotted seatrout: bag limit varies by management region (2–5 per person; most regions 3). Slot limit: not less than 15 or more than 19 inches total length; one fish over 19 inches allowed per vessel (or per person from shore) where the region allows it.', 'https://myfwc.com/fishing/saltwater/recreational/spotted-seatrout/', 'FWC — Spotted Seatrout recreational regulations (9-region table, 2026)', '2026-02-04', '2026-09-01', 1,
   null, null, 3, 3, 15, 19, 'total_length', null, null, true, 30),
  ('spotted_seatrout', 'fl-state-waters', 'salt', 'note', 'Region system (2026): Panhandle March 1–Jan 31 (closed February); Indian River Lagoon January 1–October 31 (closed Nov–Dec) with NO over-slot allowance; Big Bend open year-round, 5 per person; all other regions open year-round, 3 per person.', 'https://myfwc.com/fishing/saltwater/recreational/spotted-seatrout/', 'FWC — Spotted Seatrout recreational regulations (9-region table, 2026)', '2026-02-04', '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, true, 30),
  ('common_snook', 'fl-state-waters', 'salt', 'bag_limit', 'Common snook: 1 fish per person per day. Slot: 28–33 inches total length in Gulf regions; 28–32 inches in Atlantic regions. Snook permit ($10) required in addition to a saltwater license. Hook and line only; fish must remain whole until landed ashore; captain and crew cannot retain on for-hire trips.', 'https://content.govdelivery.com/accounts/FLFFWCC/bulletins/38c9f7d', 'FWC — Snook seasons by region (GovDelivery notice, 2026)', '2026-02-01', '2026-09-01', 1,
   null, null, 1, 1, 28, 33, 'total_length', null, null, true, 30),
  ('common_snook', 'fl-state-waters', 'salt', 'season', 'Open season (most regions): September 1 – November 30 fall and March 1 – April 30 spring.', 'https://content.govdelivery.com/accounts/FLFFWCC/bulletins/38c9f7d', 'FWC — Snook seasons by region (GovDelivery notice, 2026)', '2026-02-01', '2026-09-01', 1,
   '2026-09-01', '2026-11-30', null, null, null, null, null, null, null, true, 30),
  ('common_snook', 'fl-state-waters', 'salt', 'season', 'Open season (most regions): September 1 – November 30 fall and March 1 – April 30 spring. Charlotte Harbor/Southwest reopen October 1.', 'https://content.govdelivery.com/accounts/FLFFWCC/bulletins/38c9f7d', 'FWC — Snook seasons by region (GovDelivery notice, 2026)', '2026-02-01', '2026-09-01', 1,
   '2026-03-01', '2026-04-30', null, null, null, null, null, null, null, true, 30),
  ('atlantic_tarpon', 'fl-state-waters', 'salt', 'prohibited', 'Tarpon: catch and release only; possession prohibited except in pursuit of an IGFA world record with a $51.50 tarpon tag. Gear: hook and line only. Tarpon over 40 inches must remain in the water.', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, false, 60),
  ('dorado', 'fl-state-waters', 'salt', 'bag_limit', 'Dolphinfish: Gulf state waters — 10 per person or 60 per vessel, whichever is less, no minimum size. Atlantic state waters — 5 per person or 30 per vessel, whichever is less, with a 20-inch fork length minimum. Legal gear: hook and line, spearing. Captain and crew are prohibited from retaining a bag limit.', 'https://myfwc.com/fishing/saltwater/recreational/dolphinfish/', 'FWC — Dolphinfish/Mahi-Mahi recreational regulations', null, '2026-09-01', 1,
   null, null, 10, 10, null, null, null, null, null, false, 60),
  ('dorado', 'fl-state-waters', 'salt', 'min_size', 'Atlantic state waters (incl. Monroe County direction): minimum size 20 inches fork length. Gulf state waters: no minimum size.', 'https://myfwc.com/fishing/saltwater/recreational/dolphinfish/', 'FWC — Dolphinfish/Mahi-Mahi recreational regulations', null, '2026-09-01', 1,
   null, null, null, null, 20, null, 'fork_length', null, null, false, 60),
  ('king_mackerel', 'fl-state-waters', 'salt', 'bag_limit', 'King mackerel: 24-inch fork length minimum; 3 per person per day (Gulf-Atlantic fishery reduced to 1 per person when federal waters are closed to all harvest). Fish must remain whole until landed ashore.', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, 3, 3, 24, null, 'fork_length', null, null, true, 60),
  ('hogfish', 'fl-state-waters', 'salt', 'bag_limit', 'Hogfish: 5 per harvester per day in Gulf state waters (14-inch fork minimum, year-round); Atlantic state and federal waters south of Cape Sable incl. the Keys: 1 per harvester per day, 16-inch fork minimum, open May 1–Oct 31.', 'https://myfwc.com/fishing/saltwater/recreational/hogfish/', 'FWC — Hogfish recreational regulations', null, '2026-09-01', 1,
   null, null, 5, 5, 14, null, 'fork_length', null, null, false, 60),
  ('hogfish', 'fl-state-waters', 'salt', 'gear', 'Legal gear: spears, gigs, hook and line, seine, cast net. Reef fish gear requirements apply.', 'https://myfwc.com/fishing/saltwater/recreational/hogfish/', 'FWC — Hogfish recreational regulations', null, '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, false, 60),
  ('sheepshead', 'fl-state-waters', 'salt', 'bag_limit', 'Sheepshead: 12-inch total length minimum; 8 per harvester per day; vessel limit 50 fish during March and April.', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, 8, 8, 12, null, 'total_length', null, null, false, 60),
  ('florida_pompano', 'fl-state-waters', 'salt', 'bag_limit', 'Florida pompano: 11-inch fork length minimum; 6 per harvester per day. State regulations apply in federal waters. Hook and line only; harvest prohibited with the use of any multiple hook in conjunction with live or dead bait.', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, 6, 6, 11, null, 'fork_length', null, null, false, 60),
  ('spanish_mackerel', 'fl-state-waters', 'salt', 'bag_limit', 'Spanish mackerel: 12-inch fork length minimum; 15 per harvester per day. Fish must remain in whole condition until landed ashore.', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, 15, 15, 12, null, 'fork_length', null, null, false, 60),
  ('gag_grouper', 'fl-state-waters', 'salt', 'bag_limit', 'Gag grouper: 24-inch total length minimum. State waters of the Gulf: 2 per person within the 4-grouper aggregate; 2026 harvest opens September 1 season-limited — verify dates on MyFWC. Atlantic: 1 per person within the 3-fish aggregate, season closed Aug 2, 2026 – Apr 30, 2027.', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, 2, 2, 24, null, 'total_length', null, null, true, 14),
  ('gag_grouper', 'fl-state-waters', 'salt', 'gear', 'Reef fish / snapper-grouper gear rules: circle hooks required when using natural baits in state waters north of 28° North; a descending device is required on board in federal waters; dehooker required. Must be landed with head and fins intact.', 'https://www.eregulations.com/florida/fishing/saltwater/', 'FWC eRegulations — Florida Saltwater (2026, last updated July 20, 2026)', '2026-07-20', '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, false, 60),
  ('red_snapper', 'fl-state-waters', 'salt', 'bag_limit', 'Red snapper: Gulf state waters 16-inch total length minimum, 2 per person per day (captain and crew zero on for-hire boats), season dates announced by FWC each year. Atlantic state waters 20-inch total length minimum, 2 per person per day, open year-round. Federal Atlantic: 2026 recreational season rests on an Exempted Fishing Permit — 1 per person, no minimum size, 10-fish snapper-grouper aggregate applies.', 'https://myfwc.com/fishing/saltwater/recreational/atlantic-red-snapper/', 'FWC — Atlantic Recreational Red Snapper (2026 season page)', '2026-05-22', '2026-09-01', 1,
   null, null, 2, 2, 16, null, 'total_length', null, null, true, 14),
  ('red_snapper', 'fl-state-waters', 'salt', 'note', '2026 Atlantic private recreational fishing requires a State Reef Fish Angler designation (free) and trip declaration in the FWC Atlantic Red Snapper Reporting System before leaving the dock; anglers are encouraged to report post-trip. Federal season action can reroute mid-year — this row is deliberately checkInseason.', 'https://myfwc.com/fishing/saltwater/recreational/atlantic-red-snapper/', 'FWC — Atlantic Recreational Red Snapper (2026 season page)', '2026-05-22', '2026-09-01', 1,
   null, null, null, null, null, null, null, null, null, true, 14);
