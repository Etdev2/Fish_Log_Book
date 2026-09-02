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

## Standing debts (handoff carries these)

1. Photo-licensing compliance pass (Wikimedia/NOAA-only) before any public release.
2. pack-v2 migration reconciling the three SoCal bundle-only carve-outs + Florida
   species-scoped zero rows (parity test guardrails say exactly which).
3. Grouper aggregate groups modeled as spent `reg_group` rows for Florida, not notes.
4. Native GPS-in-canvas watermark camera / boundary proximity vs boat speed (§14's
   "avoid continuous notification" is one-event-per-transition; time-based cooldown is
   Phase 4 UI polish).
