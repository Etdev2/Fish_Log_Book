# ADR 008 — Regulations as versioned data, the geospatial model, offline packages, and Leaflet

> Renumbered from 007 on 2026-09-03. It was filed as 007 while
> `007-regional-expansion-and-catch-gps.md` already held that number, which made every
> bare "ADR 007" citation ambiguous. That ADR landed first and keeps 007; this one moves.
> Numbered "§N" citations elsewhere in the repo all refer to 007 — this ADR has never had
> numbered sections.

**Date:** 2026-09-01 · **Status:** accepted
**Supersedes:** nothing. **Amends:** `005-front-end-architecture.md` §6 (adds one
dependency to a deliberately frozen list).
**Depends on:** `003-web-prototype-boundary.md` (folder law, vectors), `004-offline-store-and-sync.md`
(local store is the read path), `006-tide-engine-boundary.md` (SI-only core, `Sourced<T>`)
**Implementation spec:** `docs/specs/regulations-architecture.md`

## Context

A new product area answers one question: *"I am here, today, and I caught this fish — what
is it, can I keep it, and am I legal where I am?"*

It is not a feature like the others. Every other screen in this app is wrong at worst
inconveniently. This one can be wrong expensively: a citation, a fine, a confiscated
catch, or a fish killed out of a marine protected area. That changes what "good enough"
means, and it changes it in a specific direction — **the design must be biased toward
saying less, more conservatively, with its sources visible.**

Two facts about the setting decide most of the architecture. The angler is offshore with
no signal, so nothing may require a network. And the rules change without warning:
in-season groundfish depth closures, emergency closures, annual bag-limit revisions. Those
two together rule out both of the obvious shapes — a server API, and rules compiled into
the app.

## The call

### 1. Regulations are versioned data. They are never application code.

A bag-limit change is a **dataset publish**, not a deploy. `regulation_dataset` is a
first-class versioned entity with `version`, `channel`, `content_hash`, an effective
window, `supersedes`, and `is_withdrawn`. Rules, areas, boundaries, species rows and ID
trees all belong to a dataset. The client holds two, so a rollback is a pointer flip in
`meta` rather than a re-download.

**Why.** An emergency closure that requires an App Store review is not an emergency
closure. A rule compiled into a binary is also unversioned by construction: nobody can
say which rules a given catch was logged under. Both problems dissolve if the rule is a
row with a version on it.

**Rejected: a server API that resolves regulations.** The obvious shape, and it is
correct for a product used on land. It fails the only requirement that matters here — the
question is asked exactly where there is no signal. Rejected on that alone; the fact that
it would also put a network round trip in front of the one screen an angler is impatient
on is a bonus argument.

**Rejected: rules as a TypeScript module in `core/`.** Type-safe, zero infrastructure,
and it makes every regulatory change an app release in both clients. It also makes the
Swift client a second copy of the rules, which is precisely the drift ADR 003 exists to
prevent, on the highest-stakes data in the product.

**Rejected: PDFs of the regulations, cached.** Genuinely the most legally defensible
option, and it answers none of the question. An angler holding a dying fish cannot search
a 140-page PDF. We link to it from every answer instead, which gets most of the
defensibility for none of the uselessness.

### 2. Provenance is structural, not a sentence

Every rule, area, boundary and dataset carries `RuleProvenance`: `sourceAgency`,
`sourceReference`, `sourceUrl`, `sourceUpdatedAt`, `verifiedAt`, `verifiedBy`,
`effectiveFrom`, `effectiveUntil`, `datasetVersion`, `publishedText`. It is rendered only
through `provenance-footer.tsx`, exactly as ADR 006 §5 renders `Sourced<T>` only through
`sourced-value.tsx`, with the same collapsed-disclosure pattern and the full text always
available to assistive tech.

**It is deliberately not `Sourced<T>`.** That wrapper attaches one short `basis` phrase to
one derived number. A regulation's provenance attaches to a whole rule and needs seven
independently queryable fields — *"show me every rule not verified in ninety days"* is a
real question and a `basis` string cannot answer it. The field names also avoid the
`value`/`certainty`/`basis` triple that `local/no-raw-sourced-value` fires on, so the two
patterns coexist without fighting.

**Staleness is a first-class UI state, not a colour.** `verifiedAt` drives four bands and
`expired` removes the keep affordance entirely and says "confirm with the agency" in
words. We would rather show nothing than silently present last year's limits as today's.

### 3. Geospatial: GeoJSON polygons in `jsonb`, point-in-polygon in `core/`. No PostGIS.

Boundaries are RFC 7946 `Polygon`/`MultiPolygon` in `jsonb`, with a denormalised bbox in
four numeric columns and a recorded `simplify_tolerance_m`. Nearshore/offshore, RCA depth
lines, MPAs, districts and lakes are all the same thing: a `management_area` with
polygons, a `restriction_class` and a `priority`. One mechanism.

The point-in-polygon test lives in `src/core/rules/geo/`, is pure, and has vectors.

**Why not PostGIS.** The test must run on the phone, offline, and be reimplemented in
Swift against the same vectors. A server-side geometry type would be a *second*
implementation of the single calculation that decides whether an angler is standing in a
marine protected area, and the day the two disagree is the day this feature stops being
trustworthy. Postgres stores and serves geometry here; it does not decide anything.

**The publisher's own disclaimer is part of the data.** Boundaries carry
`geometry_basis` (`legal_text` or `cartographic`) and a `legal_disclaimer` string.
California publishes both kinds: `ds3207`, digitised from CCR §632, and `ds582`, CDFW's
cartographic representation, which CDFW itself labels *"not intended for navigational use
or defining legal boundaries."* Where they disagree, the regulation text wins. Where only a
cartographic boundary exists, the disclaimer renders verbatim wherever that geometry is
drawn, and the ambiguity floor doubles from 50 m to 100 m. We do not make a legal claim the
agency that drew the line declines to make.

**`simplify_tolerance_m` is the honest field.** We ship simplified polygons because full
resolution is megabytes. Recording the tolerance means the resolver can widen its
ambiguity band by exactly the precision we threw away, rather than pretending a 50 m
simplification is a survey line.

**The conservative boundary rules, and they are not symmetric on purpose.** A point
exactly on an edge or vertex is **inside**. A point within
`max(gpsAccuracy, simplifyTolerance, 50 m)` of an edge is **straddling**, and a straddled
area's rules apply anyway, merged to the most restrictive value. Being told you are in an
MPA when you are twenty metres outside it costs an angler one fish. The opposite error
costs them a citation and costs a fish its life.

### 4. Regulations never learn about a photo classifier

The ID tree ranks candidates by additive weighted trait matching and reports a **band**
(`strong`/`moderate`/`weak`) with the traits that drove it — never a percentage. A future
photo classifier enters as one bounded evidence channel capped at 25% of total trait
weight: it can reorder candidates, it can never alone reach `strong`, and it can never
un-exclude a species a human observation excluded.

The enforcement is a type, not a convention: `resolveRegulations()` takes a branded
`ConfirmedSpeciesId` produced only by an explicit human tap. An `IdCandidate` or a
`ClassifierCandidate` cannot be passed to it and the compiler says so.

**Why not a probabilistic model.** We have no priors, no calibrated likelihoods and no
labelled data. "87% vermilion" is a frequency claim we cannot back, and it is the exact
kind of number a person will act on. Additive integer-weighted arithmetic is also
reproducible in Swift against the same vectors, where floating-point normalisation drifts;
and every input is auditable, so the app can say *why* a fish ranked first. A biologist can
author and defend a weight. Nobody here can defend a prior.

**Rejected: shipping the classifier first and the tree as a fallback.** It is the
demo-friendly order and it is backwards. The tree is the thing that has to be right; the
classifier is an accelerator for it.

### 5. Leaflet: yes. Raster tile packs: no, not in V1.

**Add `leaflet@1.9.4` + `@types/leaflet@1.9.22`. Do not add `react-leaflet`. Render
vector geometry only — no tile server, no tile cache, no basemap.**

This amends ADR 005 §6, which froze the dependency list and required a superseding ADR to
add one. This is that ADR, and the added dependency is one 42 kB library.

**Why Leaflet.** MapLibre GL JS is the right answer if we wanted vector tiles and a real
basemap — and it is ~200 kB, WebGL, a style spec, and a tile source we would have to host.
OpenLayers is more capable and much larger. Google and Mapbox need an API key, a network
call and per-load billing on a screen whose entire purpose is working with no network;
that is disqualifying on the requirement, before cost. A hand-rolled SVG polygon renderer
is genuinely tempting — we already need the geometry in `core/` — and it is rejected
because pinch-zoom, pan inertia, hit-testing and layer ordering on a wet touchscreen is
five hundred lines of exactly the code Leaflet has been debugging for fifteen years, and
we would still not have a scale bar or an attribution control.

**No `react-leaflet`.** ADR 005 §6's objection to component libraries is that they ship
structure the Swift client cannot inherit, and that applies here for a wrapper we need for
roughly four calls (`map`, `geoJSON`, `circle`, `fitBounds`). A ~120-line imperative
`useEffect` wrapper we own is smaller than the wrapper library's type definitions and
keeps the lifecycle explicit, which matters when the map has to be dynamically imported.

**SSR.** Leaflet reads `window` at module scope, so it must never be evaluated on the
server. `regulation-map.tsx` is loaded with `next/dynamic(..., { ssr: false })` **from
inside `regulations-entry.tsx`, which is already `'use client'`** — Next 16 errors if
`ssr: false` is used in a Server Component
(`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`). `regulation-map.tsx` is
the only file in this repo permitted to import `leaflet`, enforced by an ESLint
`no-restricted-imports` entry that also bans it from `src/core/**` and `src/app/**`.

**CSS, and why it does not violate ADR 005 §1.** `import "leaflet/dist/leaflet.css"` sits
inside `regulation-map.tsx`. Next's CSS guide is explicit that importing a stylesheet from
`node_modules` is permitted anywhere and best done in the component that requires it
(`01-getting-started/11-css.md`, "Import styles from `node_modules`"). ADR 005 §1 bans
*authoring* a second styling dialect — new `*.module.css` files and hand-written project
CSS. A vendored third-party stylesheet is neither; it is part of the dependency, like a
font file, and the `git ls-files '*.module.css'` tripwire is untouched because it is not a
tracked file. Two constraints hold the line: **we never edit Leaflet's CSS, and we never
add a project stylesheet to override it.**

**Colours without hex literals.** Leaflet path options take colour *strings*, and ADR 005
§2 bans hex in `.tsx`. The map reads its colours at runtime from the generated custom
properties — `getComputedStyle(el).getPropertyValue('--color-signal-orange')` via
`src/lib/tokens/read-token.ts`. `tokens.json` stays the source of truth and the tripwire
stays green. This is written down because the alternative gets solved with a hex literal
at two in the morning.

Also: `preferCanvas: true`. A hundred-plus MPA polygons as SVG paths will crawl on an old
phone.

**The tile ruling, priced honestly.**

A raster basemap only helps if it is detailed enough to show which side of an MPA line you
are on. That is z14, and z8–z14 over the SoCal bight is **150–400 MB** of PNG. z0–z12 is
tens of megabytes and too coarse to answer the question, which makes it the worst of both.
iOS Safari will not reliably hold that: `navigator.storage.persist()` is a request, not a
guarantee, and an evicted origin takes the *rules* with it, not just the pretty
background. There is a licensing cost too — OpenStreetMap's tile usage policy forbids bulk
download for offline use, so a legitimate offline pack means a paid provider or
self-hosting, which is a new hosted component in a stack that is currently one Supabase
project.

Against that, what the map actually has to answer is: *where is the line, and which side of
it am I on.* That needs boundary polygons, my position with its accuracy circle, a scale
bar, and enough coastline to orient. So V1 ships a real, interactive, pannable, zoomable
Leaflet map that renders: the boundary polygons from the offline package, a coarse
simplified coastline GeoJSON (~200 KB, shipped in the package), the angler's position with
its GPS accuracy circle drawn to scale, and attribution for the boundary source.

**What the angler loses, said plainly:** no satellite imagery, no place names beyond what
we label ourselves, no roads, no harbour detail. Orientation comes from the coastline
outline, the accuracy circle, and the named areas.

**What they gain, and it is not a consolation prize:** the map is drawn from *the same
geometry the resolver used*, so it cannot disagree with the answer above it. A raster
basemap can — the tiles come from a different vendor, at a different date, with a different
projection lineage, and a coastline that is 80 m off in the tiles while the polygon is
correct is a bug that would take a week to find and would destroy trust on the way. And it
renders identically online and offline, forever, because there is nothing to fetch. "What
happens with no tiles" has no answer here because there are no tiles.

**Deferred, with the trigger written down:** if real use on the water shows anglers cannot
orient without imagery, add an **optional, explicitly-downloaded, one-region** raster pack
— size shown before download, `navigator.storage.estimate()` checked first, and the rules
package never evictable behind it. That is a V2 ADR, not a V1 patch.

### 6. Offline packages are the delivery mechanism, and IndexedDB is the store

One gzipped JSON document per (jurisdiction × water class) — dataset, areas, boundaries,
rules, species, ID trees, media manifest, `content_hash` — served by a Supabase edge
function. Media is fetched lazily afterward; the ID screens work text-only and say so.
Install writes rows namespaced by `dataset_id`, then flips one pointer in `meta` in a
single transaction. The previous package is kept, which is what makes rollback a pointer
flip. `DB_VERSION` goes 2 → 3, purely additively; existing catches are not touched.

**IndexedDB, explicitly not localStorage.** localStorage is synchronous, string-only, and
capped around 5 MB — a single region package is ~8 MB, and a synchronous 8 MB parse on the
main thread is a frozen phone. This is stated because it is the mistake this kind of
feature attracts.

**Regulation stores are not syncable entities.** They are never added to `ENTITY_STORES`,
`SyncEntity` is not extended, and nothing regulatory ever enters the outbox. Reference
data flows one way — server to device — and the RLS on those tables is public-read,
service-role-write, which is the only place in this schema that is true.

### 7. Nav: `/rules` replaces `Setup`, and the contextual entry is mandatory regardless

The primary nav has five slots and they are full (`Calendar`, `Setup`, `Log`, `Tide`,
`Settings`). A sixth does not fit at 320 px, and the nav's own comment says adding one is a
conversation. This is the conversation.

**Recommendation: `Setup` leaves the primary nav and `Rules` takes the slot.** Setup is a
start-of-trip action, reached naturally from the Log and Trip surfaces, and D21a's sticky
rig means it is configured once and then inherited — it is exactly the kind of thing that
does not need a permanent global slot. Regulations is asked repeatedly, unpredictably,
mid-trip, under time pressure, with a fish in hand. An angler is legally exposed by not
checking the rules; nobody is exposed by tapping twice to reach Setup.

**Independent of that slot, and not optional: the catch form gets an inline "Can I keep
it?" block** that opens the regulations sheet with species, position, date and mode
prefilled. That is the highest-value entry point in the feature and it does not depend on
the nav answer at all. If the COO or `ux-ui` overrule the slot swap, this still ships.

`ux-ui` owns nav appearance (ADR 005 §4) and the COO owns sequencing, so both may overrule
the swap. Neither may overrule the contextual entry.

## What it costs us

- **A dependency on a deliberately frozen list.** 42 kB, a vendored stylesheet, and a
  library that owns a DOM node. Contained to one file, and one file is where it stays.
- **A map that looks less impressive than a competitor's.** No satellite tiles. We are
  choosing an honest map over a pretty one, and a screenshot will not flatter us for it.
- **~8 MB of device storage per region**, in a store iOS Safari can evict under pressure.
  Mitigated by asking for persistence and by degrading loudly, not silently.
- **A content pipeline we now own forever.** Somebody has to turn agency documents into
  packages and re-verify them. `verifiedAt` makes the debt visible rather than making it
  go away; a package nobody re-verifies eventually renders as `expired`, which is the
  correct outcome and will still be embarrassing.
- **Real liability.** This is the first surface in the product whose wrongness has legal
  consequences for a user. Disclaimer copy, the "confirm with the agency" line, and the
  always-visible source are not decoration; `counsel` should see them before the first
  package ships.
- **A large pure surface to vector-test.** Three vector files, roughly forty cases, all of
  which Swift will have to pass. That is the cost of the feature being trustworthy in two
  clients rather than one.

## Consequences a future agent must live with

- **`resolveRegulations()` will never take an ID result or a model output.** If you find
  yourself wanting to widen that signature so a photo can drive a legal answer, the answer
  is no, and §4 is why.
- **Straddling always resolves to the stricter rule and this will occasionally annoy an
  angler** standing forty metres outside an MPA with a bad fix. That is the intended
  error direction. Do not "fix" it.
- **The map may not acquire a tile layer without a superseding ADR.** Adding one silently
  turns the one screen that always works into one that sometimes does.
- **No file under `src/core/` or `src/features/regulations/` may name California.** No
  `if (jurisdiction === 'us_ca')`, no CA-specific enum. It is grep-checkable and someone
  should grep it.
- **`src/lib/offline/db.ts`'s `upgrade` must become a fall-through ladder before v3
  lands.** Its current early `return` in the `oldVersion >= 1` branch would skip the v3
  stores for an angler upgrading from v1. Nothing is broken today; it breaks the moment
  this feature merges. Detail in the spec, §6.2.
- **A regulation row is never written by a client.** If you are adding a write policy to
  one of these tables, you are building the wrong thing.
- **A regulation package may not mint a species id.** The vocabulary has one source of
  truth (ADR 001) and it is not this feature. A package referencing an unknown species
  fails validation and does not activate. New species arrive through `vocabulary_version`,
  which also needs no app release — so nothing is lost and the second source of truth is
  never created. This blocks the first California package on adding the named rockfishes
  to the vocabulary; see the spec, §3.7.
