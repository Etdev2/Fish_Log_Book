# Founder requirements — 2026-09-01 — expansion & forward-looking direction

**Status: received, rulings taken (below), foundations landed 2026-09-01 (this repo).**
This file is the intake record. ADR 007 carries the architectural decisions; this file
carries what was asked and how each item maps to work.

## The founder's ten items

1. **Fish Log → GPS map integration.** GPS per catch, offline-then-sync, map of markers,
   tap a marker → full snapshot (species, time, GPS, spot, setup, bait, conditions, tide,
   weather).
2. **Fishing Spots vs catch GPS.** Two kinds of location stay separate; spots are named,
   optional-GPS, with environment/depth notes; catches keep their exact fix AND can
   reference a spot. Enables Spot → area → conditions → setup → species analysis.
3. **Water clarity: add Milky.** Keep the rest. ✅ **Shipped in this PR.**
4. **Region-based species suggestions.** Fishing-region preference in Settings (SoCal,
   NorCal, Florida, Hawaii, Cabo/Baja, Gulf Coast, Northeast, Great Lakes, Custom);
   region steers suggestions and defaults, never restricts search/add. ✅ **Shipped.**
5. **Freshwater support.** Never hard-code ocean assumptions; environments eventually
   ocean/inshore/bay/harbor/lake/reservoir/river/stream; each environment surfaces the
   conditions that actually matter to it. ✅ **Type groundwork shipped** (`environments.ts`).
6. **Catch markers on the tide chart.** Exact catch time on the curve, tap → catch info,
   overlapping markers cluster/stack. _Next slice._
7. **Calendar view.** Month grid with activity dots; day → catches/spots/conditions;
   moves Catch ↔ Day ↔ Chart ↔ Map. _Next slice — the `/` page is an honest stub today._
8. **Catch filtering.** Species, spot, GPS area, region, date range, setup, bait, depth,
   clarity, tide stage, conditions. Scales with history. _After #1/#2 data exists._
9. **Appearance modes.** Light, Dark, and eventually a purpose-built **Night Fishing
   Mode** (extreme low brightness, reduced glare) — kept separate from Dark Mode on
   purpose. _Later slice — needs a light token palette (design lane)._
10. **Don't Forget List / trip gear.** Trip gear prep wired to the tackle box:
    already-have / need-to-buy / don't-forget-that-you-own. Long-term: trip requirements
    ↔ inventory diff. _Later slice._

## Central concept (founder)

**Every catch is a snapshot in time** — Fish + Time + GPS + Spot + Rod + Rig + Bait +
Conditions + Tide + Environment — explored through Map, Tide Chart, Calendar, Catch List,
Spots, and eventually Analytics. Architecture must anticipate the analytics layer.

**Design principle (founder):** no Southern-California assumptions in the data model.
SoCal is the default experience, never a constraint.

## Rulings (founder, 2026-09-01, taken via the team's question round)

- **Staging:** foundations first (docs, clarity, GPS schema, spots model, region
  preference, freshwater types); views land on top in later slices.
- **Map:** offline-first geometry map. Markers on built-in coastline/chart geometry that
  works with zero signal; rich tiles cached opportunistically later. No gray dead map
  offshore.
- **GPS capture:** permission asked once (first log, with a why), save never blocks on a
  fix, accuracy recorded, honest pending/filled-later states. — **Discovery:** this exact
  pattern already shipped with the fish log (`startPositionRequest` /
  `attachPositionLater` in `src/features/catches/create.ts`): the fix request starts when
  the sheet opens, is *read* (never awaited) at save, and late fixes patch the row.
  Requirement ratified, not rebuilt.
- **Species data:** verified starter lists per region from public fishery sources;
  search and manual add always reach the whole vocabulary.

## What this round intentionally did NOT change

- The GPS capture pipeline (already correct — see ruling above).
- The `/spots` and `/` route stubs (views are the next slice by the founder's staging).
- Any Southern-California *behavior* in the picker (order only changes when the angler
  changes the region preference — default unchanged).
