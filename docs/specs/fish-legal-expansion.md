---
date: 2026-09-02 (implementation passthrough); founder spec received 2026-09-01
status: SHIPPED (Phases 1–3 in PR #24; Phase 4 future)
governs: src/features/fish-legal/, src/app/fish-legal/, supabase/migrations/20260902090000
supersedes (in the rules-surface: none — EXTENDS docs/specs/regulations-architecture.md)
---

# Fish Legal — Rules & Regulations Expansion

Captured founder spec (full text lives in the PR body and the originating message; this
document is the architecture-side capture). Locked resolutions from the ask_user round:

1. **Scope of PR:** Phases 1 + 2 + 3 (founder picked the everything option again).
2. **Florida depth:** ~12 flagship species (red drum, spotted seatrout, snook, tarpon,
   gag grouper, red snapper, king mackerel, dolphinfish, hogfish, sheepshead, pompano,
   Spanish mackerel), state-waters-first with coast-split notes where Florida law splits.
3. **Photos:** bundled local files per species (off-spec choice forced by offline §16);
   licensing is tracked per-image in `species-photos.ts` with the explicit stand-in
   "source-restricted — attribution shown; Wikimedia/NOAA swap owed before release" —
   that swap pass is a known debt, surfaced in the PR body too.
4. **Nav label:** "Legal".

## How each spec section landed (traceable commitments)

- §2 rename → `/fish-legal` routes, nav "Legal", section titles "Fish Legal". The
  Feature internal name stays `fish-legal/`; earlier regulation* file names kept
  (renaming the feature directory would have churned 40 files for zero behavior).
- §3 region-aware → `packs.ts` registry; **region→pack is data, not code** (the §26.2
  acceptance test is literally `packForRegion("florida")`).
- §4 hierarchy → kept as the area parent's chain on `reg_area.parent_id` (existing
  schema); primaryArea per pack is the entry row. Full nested-hierarchy UI is Phase 4+.
- §5 statuses → verdict banner copy now reads LEGAL TO KEEP / CATCH & RELEASE ONLY /
  SEASON CLOSED / SPECIAL REGULATIONS APPLY (derived from verdict + reason; protected
  species surface as C&R-only + noRetention flag from the wizard profiles).
- §6 full-rule facets → RegRule already possessed possession_limit/gear/max_size kinds;
  Florida pack exercises them (slots, gear rows, permits notes) and Maryland-free
  rendering falls to verbatim text.
- §7 verification columns → already the schema; survival guaranteed by parity tests.
- §8 legal-team workflow → NOT automated: the channel post coordinates it; engine keeps
  `verifiedAt`/`sourceUpdatedAt` gating and renders them every card.
- §9 Mexico → schema+registry-ready (jurisdictionLabel is free text; sections in packs
  list); no Mexico pack shipped — deliberately, because zero rows sourced yet.
- §10/§11 photos + ID → bundled photos + attribution; wizard untouched (rockfish
  profiles continue to serve SoCal; Florida IDs are out of Phase-1 scope).
- §12 catch tracking → `catch-limits.ts` + today's limits page + log-form banner +
  quick-log integration (kept-fish only, group aggregates, over-limit state).
- §13/§14 boundaries → `boundary-alerts.ts` fold machine (outside/near/inside, exactly
  one event per transition) + inbox (`alerts.ts`) + Settings-in-Settings toggles live on
  `/fish-legal/alerts`.
- §15 two locations → home page shows the selected region vs GPS-detected jurisdiction
  side by side and CALLS OUT the mismatch in amber.
- §16 offline → packs are bundles; photos are local; the offline page lists them per
  pack with versions.
- §17 versions → pack ids + versions everywhere the answer matters; pave known cards.
- §18 snapshot → `catch.regulation_snapshot` jsonb + create.ts wiring + edit-path
  refresh semantics documented on the column comment.
- §19 hierarchy → cards already render verdict-first with disclosure layers.
- §20 disclaimer → lives on the alerts page footer + every card's provenance block.
- §21 map → not blocking; boundary-leaflet generalized to any pack's polygons; CDFW map
  remains linked authority for the MPA inventory.
- §23 entities → existing schema covers all but species_images (photos are app assets
  with attribution metadata; a species_images table arrives when photos sync).
- §24 notifications → device-local inbox + four toggles; compliance banners stay up
  regardless by design.
- §26 acceptance — the region-switch test the founder described (SoCal ↔ Florida)
  passes on the deployed app: pick Florida in Settings, the Species page becomes the FWC
  pack; pick back, SoCal returns. No hard-coded region in any component (grepable:
  `southern_california` appears only in the pack registry and the boundary RCA ribbon,
  both data-model legitimate).

## Round 2 (2026-09-02, PR #25) — California scaling + limits audit + CDFW photos

Landed, gates green (412/412, tsc/eslint/build clean, 10-route smoke 200):

- **Northern California pack** `norcal-2026-09-01` (regionId `northern_california`):
  Northern GMA groundfish verbatim from the CDFW Summary (updated 2026-01-06) —
  RCG 10 combo, copper 1, **vermilion/sunset 4 (vs SoCal's 2 — the §9 divergence, now
  encoded)**, canary 2, zero-retention quartet, lingcod 2/22″, Jan–Mar closed /
  Apr–Dec open-all-depths seasons, halibut + salmon as checkInseason notes.
- **California Freshwater pack** `ca-freshwater-2026-09-01` behind a NEW Settings region
  `california_freshwater` ("California — Freshwater", matching CDFW's digest split):
  statewide defaults only; every row checkInseason with the named-waters-override
  caveat. Black bass 5/12″, trout SR/SL calendar, wild-steelhead prohibition, striper
  2/18″, catfish 10, sturgeon 40–60″ fork slot.
- **SQL**: migration `20260902120000_v2_norcal_and_freshwater_packs.sql`, generated by
  `scripts/gen-california-migrations.mts`; v1 migration frozen. area.kind reuses
  `ocean_region` — no CHECK constraint change.
- **Jurisdiction chips**: `BundledPack.shortCode` ("FL"/"SoCal"/"NorCal"/"CA·FW") +
  shared `JurisdictionChip` on home, species browser, species pages, limits page.
- **Limits audit** (founder "kept fish didn't count" report): `keptAudit()` enumerates
  every kept tally; the limits page renders a "Kept fish audit" section naming what each
  kept species counts against, and rule-less kept species are listed **UNMETERED** —
  visible, honest, never silently dropped.
- **CDFW photos**: 38 species re-sourced to the CA Marine Species Portal
  (marinespecies.wildlife.ca.gov — CDFW's own Bachar ID illustrations), license `W`,
  sRGB ≤900px ~50–90 KB. Florida species remain on their prior sources (FWC-swap is
  the analogous next batch).

## Wave: US states + Mexico (2026-09-02, wave 1 = Gulf + Baja)

Locked with the founder: 24 US coastal states + Mexico, flagship-only (8–15 rules per
state), verified-or-nothing, States ADD to Settings (existing regions untouched, saved
settings never break), Mexico split Baja California / Baja California Sur like
NorCal/SoCal. **Wave 1 lands**: Texas, Louisiana, Mississippi, Alabama, Baja
California, Baja California Sur (+ legacy `cabo_baja` resolves to BCS). All rules are
primary-sourced on the day of authoring: TPWD Outdoor Annual 2026–27 per-species pages
("Valid Sep 1, 2026 through Aug 31, 2027"), LDWF 2025 booklet + species pages, MDMR
Recreational Catch Limits card, ADCNR/MRC releases + 2025 snapper-season closure, and
NOM-017-PESC-1994 (DOF) for both Mexico packs. Waves 2–4 (South Atlantic, Mid-Atlantic,
New England, Pacific NW, AK/HI) follow as PRs of 5–6 packs each.

Key findings encoded:
- TX speckled trout: 3/day, 15–20" slot (post-March 2025 reset, confirmed against the
  2026–27 Annual page), tag system quoted; redfish 3/day 20–28 + tag bonus.
- LA: trout 15/day 13–20 slot with ≤2 over 20 **inside** the creel; redfish 4/day 18–27,
  no oversize allowance; for-hire captain/crew creel = 0 for both.
- MS: 15/15 trout, 3@18–30 reds, flounder 10@12; Tails n’ Scales reporting is law.
- AL: 6/day 15–22 slot trout; **November flounder closure**; red snapper is announced
  every spring against the 664,552-lb quota (2025 ran to Dec 31); Snapper Check prior
  to landing is legally mandatory.
- MX: NOM-017 composition — 10/day, ≤5 of a kind; billfish/shark **1/day = 5 of the
  10**; tarpon/dorado/rooster **2/day = 5 each**; ≥4-day trips cap at 3 days' quota;
  spearfishing 5/day; catch-and-release beyond quota is explicitly lawful (4.10). No
  BC/BCS catch-limit divergence exists — state split maps to envelopes only.

### Digest pass (same day, pack version 2)

Founder asked for full digests over flagship: **TX, LA, MS, AL, BC, BCS are now digest-
complete** (156 rules, 85 KB SQL in `20260902140000_v2_gulf_baja_full_digest.sql`,
strategy DELETE-by-area + insert-from-bundle, pack reg_pack rows upsert to version 2).
Every row on each agency's full table is encoded verbatim:
- TX: every Annual saltwater page (grouper incl. goliath/nassau 0-bags, trigger 20/16,
  marlin/sailfish size-only rows, tarpon 85", shark per-class minima + prohibited list,
  mullet Oct–Jan >12" ban, alligator gar + reporting, 2× possession doctrine).
- LA: complete LDWF saltwater tables — cobia 1@36 ≤2/vessel, flounder **no-possession
  Oct 15–Nov 30** (corrects wave-1's slot guess), red snapper 4/day subject-to-change,
  full grouper/mutton/lane/vermilion aggregate quotes, HMS size rows, shark governance,
  EEZ gear rules, ROLP landing permit note, prohibited species list.
- MS: reef/pelagic/shark tables in full (per-vessel tarpon & grouper caps, 20-reef
  aggregate verbatim), billfish LJFL minima note row.
- AL: July 2025 creel card in full — **red drum bull allowance removed (2025 rule)**
  corrected; cobia 1/person ≤2/vessel corrected; grouper 4-aggregate with 2-red/2-gag
  caps; snook 1@28; tarpon $67 tag; shark table + 220-3-.77 pier-chumming ban;
  stripers-in-MRD note; license/requirements note; party-boat no-creel note.
- MX: billfish per-species rows (marlin/sail) share the 1-a-day ceiling, tarpon/dorado/
  rooster 2-a-day tier, spear 5, 3-day cap, C&R clause, freshwater 5/day (4.7.2).

## Standing debts (handoff carries these)

1. Photo-licensing compliance pass (Wikimedia/NOAA-only) before any public release —
   FL species + bronzespotted still on prior sources; CDFW pass covers CA.
2. pack-v2 migration reconciling the three SoCal bundle-only carve-outs + Florida
   species-scoped zero rows (parity test guardrails say exactly which).
3. Grouper aggregate groups modeled as spent `reg_group` rows for Florida, not notes.
4. Native GPS-in-canvas watermark camera / boundary proximity vs boat speed (§14's
   "avoid continuous notification" is one-event-per-transition; time-based cooldown is
   Phase 4 UI polish).
5. Bronzespotted rockfish has no CDFW Portal entry — photo lawfully pending.
6. Rockfish wizard/vocabulary: NorCal-only species ids (widow, yellowtail_rockfish,
   treefish…) exist in pack groups; picker surfacing is a UX decision, not data debt.
