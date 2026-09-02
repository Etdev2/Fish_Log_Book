# Regulations & Fish ID — Architecture (Track B, docs-first)

**Status:** proposed architecture, reviewed against founder intake (Claude/GPT joint spec)
and house ADRs. Unblocks the *small verified starter dataset*; gates all UI (founder §18:
no major UI until this review exists).
**Date:** 2026-09-01.
**Supersedes:** PR #19 (see §9).

---

## 1. What this feature is — and what it never is

A regulation is **data with a citation**, or it is not shown. The app's house rule from
ADR 007 stays in force: the logbook itself never *implies* a season or a limit (suggestion
lists carry no legal baggage). This feature is the opposite pole and the two meet at a
single disciplined seam:

- The log is a diary: it records what happened, never what "should" have happened.
- The regulations surface is an almanac: it records what the source said, when we checked,
  and where to verify — never what the angler caught.

There is no "your 20 inch calico was short!" judgement UI in v1. That is a cross-feature
claim joining fish + law + place, and we do not build out sirens until the law data is
boring and proven.

## 2. Source of truth: the agency, verbatim

Source hierarchy, in order of authority:

1. **The agency's own published rule text** — CDFW California Code of Regulations Title 14
   and the CDFW summary pages (`wildlife.ca.gov/Fishing/Ocean/…`), which carry their own
   "updated" stamps.
2. **Federal managers where they lead** — NOAA Fisheries for HMS/tunas; the CFR text when
   CDFW defers.
3. Nothing else. Third-party aggregators are scouting reports, never sources.

**What we ingest is verbatim + structured translation:** each rule row stores the agency's
own sentence(s) alongside our typed interpretation fields. When the two ever disagree for
a reader, the sentence wins — and the presence of both is what makes a future
"we translated wrong" bug fixable without losing trust.

## 3. Geography: adopt the agency's map, never invent one

CDFW already drew the map we need:

- **Ocean sport fishing regions** (regulation summaries): Northern, Mendocino, San
  Francisco, Central, Southern, San Francisco Bay.
- **Groundfish Management Areas** (§27.25–§27.45): Northern, Mendocino, San Francisco,
  Central, Southern — plus RCA depth contour lines and Cowcod/GEA polygons.

Decision: **regulation geography = the agency's named areas, verbatim**, stored as
vocabulary rows (`reg_area`) with simplified polygons bundled in the pack. No
fish-app-invented zones, ever — same reason ADR 007 forbids app regions in the catch
model: invented geography rots quietly.

**Resolution is point-in-polygon on device.** The catch's own GPS + bundled polygons →
the area. No geocoding, no network, works in a canyon. A device-local "home region"
preference (the ADR 007 §4 mechanism) decides what an angler with no fix sees. Errors
fail toward *showing the source page*, never toward guessing a stricter or looser rule.

**Map approach — FOUNDER OVERRIDE, 2026-09-01 (this section now describes shipped reality):**
  the founder's spec §8–§10 ("GPS → area resolution, YOU ARE HERE, overlay toggles,
  boundary-approach warnings") wins over my earlier v1 "no interactive map" stance;
  the regulations PR ships the map alongside the first pages.
- Interactive map ships in v1, on **Leaflet with NO tile layer**: an ocean-colored panel
  plus the pack's simplified polygons/polylines. Zero network, zero basemap tiles, works
  at any depth of signal. Lines are labeled "simplified" everywhere they render, and the
  50-fm RCA is declared up front as a **coordinate-defined line** — its authority is the
  CFR waypoint list, our drawing is orientation, never the legal statement (spec §9).
- Shipped overlays: Southern Management Area ring, the SoCal RCA boundary polyline, the
  two Cowcod Conservation Areas, and ONE example MPA inset (Point Dume) as a styling
  proof. The full MPA/GEA inventory stays with CDFW's official interactive map, which is
  deep-linked from the same page — 800+ MPA polygons kept current is not a floor-bundle
  job (spec §10's "small overlays only" allowance applied).
- Boundary proximity: when GPS gives a fix inside ~0.5 nm of the RCA line, the page
  states the distance to the line and which side reads as allowed today. Accuracy is
  shown (±m) and declared as orientation-grade math (equirectangular), not survey.
- This keeps the map consistent with the offline-first ADRs (004/006): all data lives in
  the pack; the only network objects are outbound links the user explicitly taps.

## 4. The pack model (how data arrives and ages)

Regulations ship as **versioned packs**: a JSON document per jurisdiction, bundled with
the app now, syncable rows later (a `reg_pack`/`reg_rule` schema lands with the dataset —
see `regulations-data-model.md`).

Rules of the road:

- **Never fetched ad-hoc at view time.** Pack data is read from the local store like
  everything else (ADR 004). Refresh is an explicit, background-able event.
- **Every row carries provenance:** `source_url`, `source_title`, `verified_at`
  (when a human/agent last read the source), plus the agency's own "updated" date when
  published (`source_updated_at`).
- **Staleness is displayed, not hidden.** UI renders "Verified <date>" with every rule.
  Beyond the freshness horizon (default 60 days; 30 for species the agency flags
  "subject to in-season change"), the row still shows but behind an amber
  **"stale — verify before fishing"** banner with a link to the source. The source link
  is always visible, fresh data or not.
- **Absence is a first-class state:** species without a verified row render
  **"No verified data"** and nothing else — no paraphrase, no folklore, no "probably 5
  a day". This is the spec's user-chosen starter stance and it is permanent behaviour,
  not a launch gap.
- **Seasons are intervals, open or closed, plus "check" markers.** In-season-species
  (tunas, salmon) store their printable season plus a `check_inseason` flag that changes
  the copy to "verify before you cast — this fishery changes in-season" with the CDFW
  in-season page link.

## 5. Species linkage

Rules key on the existing species vocabulary `id` (single source, no parallel taxonomy —
the vocabulary already carries scientific names used by agencies). Where agencies regulate
**complexes** (RCG complex, "kelp/sand/spotted bass in combination"), the group gets its
own `reg_group` row and member rules cite it; per-species exceptions (no more than 4
barred sand bass; copper rockfish 1/day) hang off the species row and name the group they
qualify.

Fish ID content (photos/keys/comparison notes) stays gated behind the Fish ID
architecture chunk — this document deliberately stores nothing about identification. A
rule needle-points to a species; identification is a separate trust problem.

## 6. Freshwater

The schema is water-class aware (`reg_rule.water_class` = salt | fresh, mirroring
`condition_snapshot`'s denormalisation logic). v1 data is ocean-only because the founder's
water is; freshwater packs consume the same tables when they land — no migration.

## 7. What this enables next (in order)

1. ~~SoCal starter dataset (this session)~~ → **shipped** (tables + SoCal rows, PR #21).
2. ~~A read-only "Regulations" browser~~ → **SHIPPED, 2026-09-01** as one PR per founder's
   instruction: regulations home ("My current regulations" header: area + date + mode +
   dataset stamp), Species & Limits with search → verdict cards, the bundled pack as
   the offline floor, the Rockfish ID decision tree, and the §8–§10 boundary map
   (Leaflet, no tiles) — sixth nav destination "Rules" included per spec §16.
3. Catch-context adornment: on a catch detail page, the *area-resolved* "Regulations in
   effect — verified <date>" card. The RegulationCard component + regulationCard engine
   now exist; wiring them onto catch pages is the next slice.
4. Synced pack updates (server-curated diffs) once row counts justify the wire. The
   v1 pack is bundle-only; SQL ⇄ bundle parity is currently **test-guarded**
   (`reg-data-parity.test.ts`) and full SQL ingest is the remaining §12 item.

## 8. Failure modes we are explicitly accepting

- **A rule changes and our copy is stale.** Mitigated by: banners + source links + the
  agency-first copy rule ("It is the reader's responsibility…" shown where CDFW shows it).
- **A GPS fix falls in the wrong polygon.** Mitigated by: displaying the polygon name
  resolved, so disagreement is visible; never auto-correcting.
- **The agency renames an area.** Polygon rows version with the pack; old catches keep
  the name their pack knew (immutable history, ADR 004 philosophy).

## 9. Why PR #19 is closed as superseded

PR #19 (Claude-authored) inlined regulation content as static strings beside the tackle
UI. It fails this architecture on first contact: no provenance, no staleness, no
agency-geography, no "No verified data" state, and it lands the UI the founder's §18
explicitly gates. Its species-pick insight (start with SoCal saltwater) survives — it is
the v1 dataset — but the deliverable is data + architecture, not UI. Closing note should
link this document.
