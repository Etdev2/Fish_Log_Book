# Regulations & Fish ID — architecture specification

**Date:** 2026-09-01 · **Status:** normative for the `Regulations & Fish ID` initiative
**Decision record:** `docs/architecture/decisions/007-regulations-and-geospatial.md`
**Constrained by:** ADR 003 (folder law, vectors), ADR 004 (local store is the read path),
ADR 005 (tokens, server/client boundary, dependency freeze), ADR 006 (SI-only core,
`Sourced<T>` disclosure precedent)

This is the implementable half. ADR 007 is the reasoning; where the two disagree, ADR 007
wins and this file is wrong.

---

## 1. The question, and the one sentence that constrains everything

*"I am here, today, and I caught this fish — what is it, can I keep it, and am I legal?"*

The angler asking it is forty minutes offshore with no signal, holding a fish that is
dying while they read. Therefore:

**Regulations are versioned data shipped to the device, never application code, and every
answer is computed locally from data already on the phone.** A bag-limit change is a
dataset publish. It is never a deploy, and it never requires a network call at the moment
of the question.

---

## 2. Module map

Nothing below imports React, Next, `src/app`, `src/features` or `src/lib` from `core/`.

```
src/core/regulations/                 TYPES ONLY. No behaviour, therefore no vector.
  types.ts          RegulationPackage, RegulationDataset, ManagementArea, Boundary,
                    SpeciesRegulation, EffectiveRule, ResolutionQuery, RegulationResult,
                    Advisory, RuleProvenance, StalenessBand, FishingMode
  ids.ts            branded ids: DatasetId, AreaId, RuleId, TreeId, ConfirmedSpeciesId
  package-schema.ts PACKAGE_SCHEMA constant + pure validatePackage() -> Issue[]

src/core/fish-id/                     TYPES ONLY.
  types.ts          IdTree, IdTrait, IdTraitOption, IdEvidence, IdCandidate, IdResult,
                    ConfidenceBand, ClassifierCandidate

src/core/rules/geo/                   VECTOR: src/core/rules/vectors/geo.json
  bbox.ts           bboxContains, bboxOfGeometry, bboxIntersects
  point-in-polygon.ts  ray casting, even-odd, holes, multipolygon, edge/vertex inclusive
  distance.ts       haversineM, pointToSegmentM, distanceToBoundaryM
  index.ts

src/core/rules/regulations/           VECTOR: src/core/rules/vectors/regulations.json
  resolve.ts        the algorithm in §7. Pure. Takes the package as an argument.
  season.ts         season-window evaluation in a named IANA timezone
  merge.ts          most-restrictive merge across overlapping areas
  advisory.ts       deriveAdvisory() — the conservative UI state, computed not designed
  staleness.ts      staleness bands
  mode.ts           fishingModeForPlatform() — maps the catch `platform` vocabulary
  index.ts

src/core/rules/fish-id/               VECTOR: src/core/rules/vectors/fish-id.json
  score.ts          trait matching, exclusion, ranking, confidence band
  next-question.ts  which unanswered trait discriminates most among live candidates
  classifier.ts     the bounded photo-classifier evidence channel
  index.ts

src/lib/geo/
  position.ts       navigator.geolocation: permission state, accuracy, timeout,
                    last-known-position cached in `meta`. Browser API, so lib not core.

src/lib/offline/
  db.ts             DB_VERSION 3 and the new stores (§6)
  regulations-store.ts   read/write the reg_* stores, install, activate, roll back.
                    Knows stores and keys. Knows nothing about what a bag limit is.

src/lib/tokens/
  read-token.ts     getComputedStyle(el).getPropertyValue('--color-…'). Exists so the
                    Leaflet layer can be token-coloured without a hex literal (ADR 007 §5)

src/features/regulations/
  components/  regulations-entry.tsx   'use client'. THE one client entry for /rules.
               regulation-map.tsx      the ONLY file in the repo importing `leaflet`
               rule-card.tsx  season-line.tsx  size-line.tsx
               provenance-footer.tsx   the ONLY component that renders RuleProvenance
               staleness-banner.tsx  area-picker.tsx  mode-picker.tsx
               id-wizard.tsx  trait-question.tsx  candidate-list.tsx  candidate-card.tsx
  queries/     package.ts (read active package), updates.ts (poll/install/rollback),
               resolve.ts (thin: load package -> call core resolver)
  types.ts     view-model types only

src/app/(app)/rules/page.tsx    Server Component. Renders <RegulationsEntry/>. Fetches nothing.

supabase/migrations/2026090X_v1_regulations.sql
supabase/functions/regulations-package/    package delivery + emergency channel
```

**Why types are in `core/regulations/` but logic is in `core/rules/regulations/`.** The
vector tripwire (ADR 003 §6) demands a JSON vector beside every rule module. A type file
has no behaviour to assert, and a vector file written to satisfy a tripwire is a lie in
the repo. Types therefore sit outside `core/rules/`, logic sits inside it, and every file
inside it is genuinely testable against a fixture.

**Vector enforcement gap, stated so nobody is surprised.** `scripts/check-tripwires.mjs`
currently scans only top-level `.ts` files directly in `src/core/rules/`; it does not
recurse. `geo.json`, `regulations.json` and `fish-id.json` are therefore required by this
spec and not yet by CI. `head-dev`: if making the scan recurse (mapping
`core/rules/<dir>/**` to `vectors/<dir>.json`) is a small change, do it in this lane —
but it will demand renaming `catch-rules.json` to `catch.json`, which is another lane's
file. If so, leave it and open an issue.

---

## 3. Data schema

Types are given as TypeScript for `core/` and Postgres for the migration. Field names are
`snake_case` on the wire and in Postgres, `camelCase` in `core/` types; the package loader
in `lib/offline/regulations-store.ts` is the one place that converts.

### 3.1 `RuleProvenance` — carried by every rule, area, boundary and dataset

```ts
interface RuleProvenance {
  readonly sourceAgency: string;      // "California Department of Fish and Wildlife"
  readonly sourceReference: string;   // "CCR T14 §27.20(b)" or "2026 Ocean Sport Fishing Regs p.14"
  readonly sourceUrl: string;         // deep link if one exists, agency page if not
  readonly sourceUpdatedAt: string;   // ISO date the AGENCY last changed it
  readonly verifiedAt: string;        // ISO date a HUMAN last checked it against the source
  readonly verifiedBy: string;        // who. "" is not allowed; "unverified-import" is.
  readonly effectiveFrom: string;     // ISO date-time, inclusive
  readonly effectiveUntil: string | null;  // exclusive. null = open-ended
  readonly datasetVersion: string;    // denormalised so a snapshot is self-describing
  readonly publishedText: string | null;  // the agency's own words, verbatim, unconverted
}
```

**Deliberately NOT `Sourced<T>`.** ADR 006 §5's wrapper attaches one short `basis` phrase
to one derived number and is policed by `local/no-raw-sourced-value`, which fires on any
`features/**` type carrying `value` + `certainty` + `basis`. A regulation's provenance is
attached to a whole rule, not a number, and needs seven independently renderable and
independently queryable fields — "every rule not verified in 90 days" is a real query and
a `basis` string cannot answer it. `RuleProvenance` therefore has none of those three
field names and cannot trip that rule.

What it *does* copy is the discipline: **`provenance-footer.tsx` is the only component
permitted to render a `RuleProvenance`**, exactly as `sourced-value.tsx` is for
`Sourced<T>`, using the same collapsed `<details>` disclosure with the full basis text
always reachable by assistive tech. That component is "View Official Rule". `head-dev`
should add the analogous ESLint rule `local/no-raw-rule-provenance`, firing on a
`features/**` type carrying `sourceAgency` + `sourceReference` + `verifiedAt`.

`Sourced<T>` **is** reused for one thing: `distanceToNearestEdgeM` is
`Sourced<Metres>` with `certainty: "estimated"` and
`basis: "measured against a boundary simplified to 50 m"`, because it is exactly what
that wrapper was built for — a derived number whose honesty depends on a caveat.

### 3.2 `jurisdiction`

| field | type | notes |
|---|---|---|
| `id` | text PK | stable slug, `us_ca`, `us_or`, `mx_bc` |
| `name` | text | "California" |
| `country_code` | text | ISO 3166-1 alpha-2 |
| `subdivision_code` | text null | ISO 3166-2 |
| `timezone` | text | IANA. **Seasons are evaluated in this zone, never the device's.** |
| `water_classes` | text[] | subset of `{salt,fresh}` |
| `default_agency` | text | fallback for rules with no own agency |
| `license_url` | text null | |
| `sort_order` | int | |
| `is_active` | bool | |

### 3.3 `management_area`

| field | type | notes |
|---|---|---|
| `id` | text PK | `ca_mpa_pt_dume_smca` |
| `jurisdiction_id` | text FK | |
| `parent_id` | text null FK self | nesting: state water > district > sub-area |
| `name` | text | shown verbatim in `reasons` |
| `kind` | text | `jurisdiction_water` \| `district` \| `groundfish_management_area` \| `mpa` \| `rca` \| `closure` \| `depth_zone` \| `water_body` \| `port_complex` |
| `water_class` | text | `salt` \| `fresh` \| `both` |
| `restriction_class` | text | `normal` \| `restricted` \| `no_take` |
| `priority` | int | resolution precedence when polygons overlap; higher wins |
| `depth_min_m` / `depth_max_m` | numeric null | only for `kind='depth_zone'` |
| `effective_from` / `effective_until` | timestamptz | a closure is an area with a window |
| `notes` | text null | |
| provenance | 10 columns | §3.1 |

Nearshore/offshore, the 60-fathom RCA line and the 3-mile state-water line are all
`kind='depth_zone'` or `kind='rca'` areas with polygons. There is exactly one geospatial
mechanism, and it is the polygon.

### 3.4 `boundary`

| field | type | notes |
|---|---|---|
| `id` | text PK | |
| `management_area_id` | text FK | one area may have several disjoint boundaries |
| `geojson` | jsonb | RFC 7946 `Polygon` or `MultiPolygon`, WGS84, **lon,lat order**, interior rings allowed |
| `bbox_min_lon` `bbox_min_lat` `bbox_max_lon` `bbox_max_lat` | numeric(9,6) | four columns, not an array, so the pre-filter is an index-usable predicate |
| `geometry_basis` | text | `legal_text` \| `cartographic`. **Not cosmetic — see below.** |
| `legal_disclaimer` | text null | the publisher's own words, rendered verbatim wherever the geometry is drawn |
| `simplify_tolerance_m` | int | the tolerance the stored geometry was simplified at. **Feeds the ambiguity radius in §7 step 3** — this is the field that stops us claiming precision we discarded. |
| `vertex_count` | int | |
| `effective_from` / `effective_until` | timestamptz | |
| provenance | 10 columns | |

**No PostGIS.** The point-in-polygon test must run on the client, offline, in `core/`, in
a form Swift reimplements against the same vectors. A server-side geometry type would be
a second implementation of the one calculation that decides whether an angler is in a
marine protected area, and the two would eventually disagree. Postgres stores and serves;
it does not decide. Rejected explicitly in ADR 007 §3.

**`geometry_basis`, and why it is a required field.** `docs/specs/regulations-socal-research.md`
§7 found that California publishes two MPA boundary datasets: `ds3207`, whose coordinates
are extracted from the regulation text (CCR §632), and `ds582`, which is CDFW's
*cartographic representation* and carries CDFW's own disclaimer — *"not intended for
navigational use or defining legal boundaries."* Where the two disagree, **the regulation
text wins**, and the package builder must prefer `geometry_basis = 'legal_text'`. When only
a `cartographic` boundary exists, `legal_disclaimer` is non-null and the UI renders it
verbatim wherever that geometry is drawn or used. An app that draws a polygon and says
"you are outside the reserve" is making a legal claim the publisher declines to make; we
do not make it either. Resolution treats a `cartographic` boundary as inherently less
certain: its effective ambiguity radius is `max(..., 100 m)` rather than 50 m, and any
result resting on one is `caution` at best. `counsel` reviews this copy before a package
ships.

Antimeridian: a bbox crossing ±180° is rejected at package build time. Not a V1 problem
on this coast, and a silent wrap bug here would be a catastrophic one.

### 3.5 `regulation_dataset` — the version

| field | type | notes |
|---|---|---|
| `id` | text PK | `us_ca-salt-2026.09.1` |
| `jurisdiction_id` | text FK | |
| `water_class` | text | `salt` \| `fresh` |
| `version` | text | `YYYY.MM.N` |
| `channel` | text | `stable` \| `emergency` |
| `package_schema` | int | the wire format version. A client whose `PACKAGE_SCHEMA` is lower **refuses** the package rather than misreading it. |
| `published_at` | timestamptz | |
| `effective_from` / `effective_until` | timestamptz | |
| `supersedes` | text null FK self | |
| `content_hash` | text | `sha256:…` over the canonical JSON. Integrity, and cheap change detection. |
| `size_bytes` `rule_count` `area_count` `species_count` | int | shown before download |
| `is_withdrawn` | bool | **the rollback switch.** Set on the server; clients honour it on the next poll. |
| provenance | 10 columns | `verifiedAt` on the dataset drives the staleness band |

### 3.6 `species_regulation` — the rule row

| field | type | notes |
|---|---|---|
| `id` | text PK | |
| `dataset_id` | text FK | |
| `jurisdiction_id` | text FK | |
| `management_area_id` | text null FK | **null = jurisdiction-wide** |
| `species_id` | text FK `public.species(id)` | may be a roll-up group id such as `rockfish` |
| `applies_to_group` | bool | true when the row targets a group; members inherit unless they have their own row |
| `fishing_modes` | text[] | subset of `{shore,pier,boat,kayak,spearfishing,float_tube}`. Empty = all. |
| `take_status` | text | `open` \| `no_take` \| `catch_and_release` \| `permit_required` |
| `open_by_default` | bool | closed-unless-open vs open-unless-closed. Groundfish needs the former. |
| `season_open` / `season_close` | text null | recurring `MM-DD`. May wrap the year end. |
| `season_windows` | jsonb null | explicit `[{from,to}]` ISO dates. Overrides the recurring pair. Emergency closures use this. |
| `bag_limit` | int null | |
| `sub_bag_limit` / `sub_bag_of` | int / text null | "2 of the 10 may be `bocaccio`" |
| `aggregate_group` | text null | shared bucket id: rockfish + cabezon + greenlings |
| `possession_multiplier` | numeric null | |
| `min_length_mm` / `max_length_mm` | int null | **millimetres. ADR 006: core is SI.** |
| `length_measure` | text | `total` \| `fork` \| `alternate_total` |
| `min_weight_g` / `max_weight_g` | int null | |
| `depth_max_m` | numeric null | metres |
| `gear_restrictions` | text[] | `single_barbless`, `two_hook_max`, `descending_device_required`, … |
| `permit_required` | text null | `ca_report_card_sturgeon` |
| `precedence` | int | tiebreak at equal specificity |
| `notes` | text null | |
| `row_confidence` | text | `verified` \| `unverified` — deliberately not named `certainty` (§3.1) |
| provenance | 10 columns | including `published_text` |

**Field *semantics* are `docs/specs/regulations-data-model.md`'s, not this document's.**
That doc is `biostat`'s and it defers to this one on structure; this one defers to it on
what a field means — rounding direction, length basis, aggregate/complex limits,
`regulation_type`, `special_conditions`. Where the two disagree on a field's meaning, that
one wins. Where they disagree on where code lives or how data reaches the device, this one
wins.

**One thing adopted from it that corrects this document: a nullable number must not
conflate "unknown" with "no limit".** `bag_limit: null` currently means both, and that is
the difference between "we could not verify this" and "take as many as you like" — the
worst possible ambiguity in this feature. Every optional quantity is therefore a tagged
value, not a bare null:

```ts
type Quantity =
  | { kind: 'value'; value: number }
  | { kind: 'none' }        // explicitly no limit, verified
  | { kind: 'unknown' };    // not verified. The UI says so and offers the source link.
```

`kind: 'unknown'` never renders as a permission. It resolves to `caution` at minimum in
`deriveAdvisory()`, and to `stop` when combined with a restricted species.

**The fathom boundary, stated because it will otherwise be crossed in the client.**
Groundfish depths are published in fathoms and sizes in inches. Conversion to SI happens
**once, at package build time**, in the ETL that turns an agency document into rows.
`depth_max_m` is metres, `min_length_mm` is millimetres, and `published_text` keeps the
agency's own words verbatim ("20 fathoms", "22 inches total length") so the UI can show
both. 1 fathom = 1.8288 m exactly; 1 inch = 25.4 mm exactly. `src/lib/units/` formats SI
back to the angler's chosen unit for display. **No conversion ever happens inside
`core/rules/`.**

### 3.7 `species` — extended, not replaced

`public.species` stays the canonical vocabulary and `src/core/ontology/species.ts` stays
the compiled offline floor. Regulation packages carry a `species` array whose rows are
keyed by the same `species_id`, adding only what regulation and ID need
(`regional_common_names`, `is_regulated_here`).

**A package may NOT mint a species id.** A package referencing a `species_id` that is not
in the vocabulary is a **validation failure at install** (`validatePackage()` returns an
issue and the package does not activate). ADR 001 gives the vocabulary exactly one source
of truth — `supabase/migrations/…_v1_seed_vocabularies.sql`, mirrored into
`src/core/ontology/species.ts` and guarded by a test — and a regulation package minting
ids would quietly become a second one. This still does not require an app release: new
species arrive through the existing `vocabulary_version` mechanism, which the local store
already overwrites the compiled floor from. Two versioned streams, one vocabulary.

**Consequence, and it blocks part of this feature: the named rockfishes do not exist yet.**
`docs/specs/regulations-socal-research.md` §5.3 verified that `species.ts` contains exactly
one rockfish entry, the group `rockfish`. Per-species RCG sub-limits ("2 of the 10 may be
…") and the rockfish ID tree are therefore *unrepresentable today* — there is no
`vermilion_rockfish` id to attach anything to.

**The ruling:** the ~20 named rockfishes are added to the vocabulary in one bounded
migration plus the mirrored constant, before the first CA package is authored. Id
convention `<common_name>_rockfish` (`vermilion_rockfish`, `copper_rockfish`,
`yelloweye_rockfish`, `bocaccio`, `cowcod`), each `rollsUpTo: 'rockfish'`,
`waterClass: 'salt'`, `takeStatus: 'regulated'`, mirroring how `barred_surfperch` rolls up
to `surfperch`. That is a vocabulary change and belongs to whoever owns the vocabulary
lane, **not** to the regulations lane — but the regulations lane is blocked on it and the
COO should sequence it first.

Species and regulation are joined only on `(species_id, jurisdiction_id,
management_area_id)`. There is no foreign key from `species` to any regulation table.
That is the decoupling requirement, and it is what makes §11 work.

### 3.8 `id_tree` and its rows

```ts
interface IdTree {
  id: string;                 // 'ca_rockfish_v1'
  jurisdictionId: string;
  scopeSpeciesId: string;     // the roll-up this tree resolves, e.g. 'rockfish'
  version: string;
  treeSchema: number;
  candidates: readonly string[];   // species ids this tree can produce
  traits: readonly IdTrait[];
  evidence: readonly IdEvidence[];
  provenance: RuleProvenance;
}

interface IdTrait {
  id: string;                 // 'anal_fin_spines'
  prompt: string;             // "How many spines in the anal fin?"
  help: string | null;        // where to look, in plain words
  imageId: string | null;     // reference image in reg_media
  options: readonly { id: string; label: string; imageId: string | null }[];
  weight: number;             // 0..1 discriminative power. Authored, not learned.
  order: number;
  requiresFishInHand: boolean; // gill rakers do; body colour does not
}

interface IdEvidence {
  traitId: string;
  optionId: string;
  speciesId: string;
  score: -1 | 0 | 1;          // against / neutral / for
  excludes: boolean;          // hard contradiction. Ranks the species out, never deletes it.
  note: string | null;        // shown as the reason, e.g. "vermilion never has 3 spines"
}
```

Traits and evidence are **package data, not code.** Only the evaluator is code. Adding a
species to the rockfish tree is a dataset publish.

---

## 4. Postgres migration outline

`supabase/migrations/2026090X_v1_regulations.sql`, written by `head-dev`:

- Seven tables above, plus `id_trait`, `id_trait_option`, `id_evidence` normalised out of
  `id_tree` (or a single `payload jsonb` on `id_tree` if the row count stays under a few
  thousand — `head-dev`'s call; the wire format is jsonb either way).
- Indexes: `species_regulation (dataset_id, species_id)`, `species_regulation
  (dataset_id, management_area_id)`, `boundary (management_area_id)`, `management_area
  (jurisdiction_id, kind)`, and a bbox composite on `boundary (bbox_min_lon,
  bbox_max_lon)`.
- **RLS, and this is the one that must not be copy-pasted from elsewhere in the schema:**
  every table here is `select` to `authenticated` and `anon`, and **no client write policy
  at all**. Reference data flows one way, server to device, service-role only. Every other
  table in this schema is angler-owned with an `angler_id` predicate; these are not, and a
  reviewer who spots the difference should know it is deliberate.
- `catch` gains the six columns in §10, with a trigger making `regulation_snapshot`
  immutable once non-null, mirroring the D24 immutability pattern already present.

---

## 5. Fishing mode

The catch table already has `platform` with the ontology §2 vocabulary (`shore`, `surf`,
`pier`, `jetty`, `kayak`, `private_boat`, `party_boat`, `float_tube`, `belly_boat`).
Regulations use a coarser regulatory concept:

```ts
type FishingMode = 'shore' | 'pier' | 'boat' | 'kayak' | 'spearfishing' | 'float_tube';
```

`fishingModeForPlatform(platform)` in `core/rules/regulations/mode.ts` is the only mapping:
`shore`/`surf` → `shore`; `pier`/`jetty` → `pier`; `private_boat`/`party_boat` → `boat`;
`kayak` → `kayak`; `float_tube`/`belly_boat` → `float_tube`.

**`spearfishing` is a method, not a platform, and the catch schema has no method column.**
It is therefore an explicit input on the regulations screen and defaults to off. If the
founder wants spearfishing rules to apply automatically to a logged catch, that needs a
`take_method` column on `catch` — a separate, small ask, deliberately not in this lane.

---

## 6. IndexedDB: DB_VERSION 2 → 3

### 6.1 New stores

All prefixed `reg_` so a future reader can see at a glance which stores are angler data
and which are reference data.

| store | key | indexes |
|---|---|---|
| `reg_package` | `id` (dataset id) | `by_scope` = `${jurisdiction_id}:${water_class}` |
| `reg_dataset` | `id` | `by_scope` |
| `reg_area` | `id` | `by_dataset`, `by_jurisdiction` |
| `reg_boundary` | `id` | `by_area`, `by_dataset` |
| `reg_rule` | `id` | `by_dataset`, `by_dataset_species` = `${dataset_id}:${species_id}`, `by_area` |
| `reg_species` | `id` | `by_dataset` |
| `reg_id_tree` | `id` | `by_dataset`, `by_scope_species` |
| `reg_media` | `id` | `by_tree` — blobs, kept out of rows so a list query never drags megabytes |

`reg_package` rows carry `state: 'installing' | 'active' | 'superseded' | 'withdrawn'`.

**These stores are NOT added to `ENTITY_STORES` and `SyncEntity` is NOT extended.**
Reference data never enters the outbox. It flows one way. Anything that puts a regulation
row in the outbox is a defect.

`meta` gains `active_dataset:{jurisdiction}:{water_class}` → dataset id,
`regulations_last_check_at`, and `server_clock_skew_s` (§7 step 9).

### 6.2 The upgrade path, and a structural note head-dev must act on

`src/lib/offline/db.ts` today reads:

```js
upgrade(db, oldVersion) {
  if (oldVersion >= 1) { /* create location_condition */ return; }
  /* create everything, fresh */
}
```

That is correct for v1→v2 and **structurally wrong for v3**: the `return` inside the
`oldVersion >= 1` branch will skip any step added after it, so an angler on v1 who
upgrades straight to v3 would get `location_condition` and none of the regulation stores.
Nothing is broken today; it breaks the moment this lane lands.

Replace it with a fall-through ladder, no early returns, each step guarded:

```js
upgrade(db, oldVersion) {
  if (oldVersion < 1) { /* v1 stores */ }
  if (oldVersion < 2) { if (!db.objectStoreNames.contains('location_condition')) { … } }
  if (oldVersion < 3) { /* the eight reg_ stores, each behind a contains() guard */ }
}
```

Purely additive: no store is deleted, no `keyPath` changes, no existing index is dropped.
**Existing catches survive because nothing touches them.** The v1→v3 and v2→v3 paths both
need a manual check in a browser before this merges — `head-dev` should say plainly
whether they ran it.

### 6.3 Storage budget, honestly

One region package, `us_ca` salt:

| part | size |
|---|---|
| ~600 rule rows | ~0.4 MB |
| species + ID traits + evidence | ~0.3 MB |
| MPA + RCA + district boundaries, simplified to 50 m | 1–2 MB |
| coarse coastline GeoJSON for the map | ~0.2 MB |
| ~80 ID reference images, WebP | ~5 MB |
| **total** | **~8 MB** |

Caps: **25 MB per package, 60 MB total across packages.** The installer checks
`navigator.storage.estimate()` first, shows the size before download, and refuses past the
cap with a named reason rather than failing opaquely. Images are fetched lazily after the
rules; the ID screens work text-only when an image is missing, and say so.

For comparison, and this is the number that decides ADR 007 §5: a raster basemap for the
same coast at a zoom that can show which side of an MPA line you are on is **150–400 MB**.

---

## 7. The resolution algorithm

`resolveRegulations(pkg: RegulationPackage, query: ResolutionQuery): RegulationResult`

Pure. The package is an **argument**, not something the function loads — that is what
makes it vector-testable and what keeps `core/` free of I/O.

```ts
interface ResolutionQuery {
  at: string;                  // ISO instant, UTC
  position: { lat: number; lon: number; accuracyM: number } | null;
  manualAreaId: string | null;
  speciesId: ConfirmedSpeciesId;   // branded. An IdCandidate cannot be passed here.
  fishingMode: FishingMode;
  waterClass: 'salt' | 'fresh';
  depthM: number | null;
  deviceClockSkewS: number | null; // from meta, null if never synced
}
```

### Steps

1. **Select the dataset.** Candidates: matching `jurisdiction` (from position or manual
   area) and `water_class`, `is_withdrawn === false`, `package_schema <= PACKAGE_SCHEMA`,
   `effective_from <= at` and (`effective_until` null or `> at`). Rank
   `channel='emergency'` above `stable`, then by `published_at` desc. None →
   `outcome: 'no_dataset'`, and stop. The screen still renders, with the reason.

2. **Locate.** With a position: bbox-reject every boundary, then point-in-polygon (ray
   casting, even-odd rule, interior rings subtract, multipolygon is the union) on
   lon/lat treated as planar. Planar is acceptable because no area here spans more than
   ~2° and the residual error is smaller than the ambiguity band step 3 applies anyway.
   Collect **all** matching areas; they nest and overlap by design. With no position, use
   `manualAreaId`. With neither → `outcome: 'location_unknown'`, return the
   jurisdiction-wide rules with `flags.locationAssumed = true`. Never refuse to answer.

3. **Boundary ambiguity — the step that matters most.**
   `ambiguityRadiusM = max(position.accuracyM ?? 0, boundary.simplifyToleranceM, floor)`,
   where `floor` is 50 m for a `legal_text` boundary and **100 m for a `cartographic`
   one** (§3.4).
   For each area, compute `distanceToNearestEdgeM` (point-to-segment, haversine metres),
   returned as `Sourced<Metres>` with `certainty: 'estimated'`.
   - Inside, and further than `ambiguityRadiusM` from any edge → `certainty: 'inside'`.
   - Inside or outside, but within `ambiguityRadiusM` of an edge → `certainty:
     'straddling'`, and the area **enters the result set anyway**.
   - **Exactly on an edge or a vertex → inside.** Chosen deliberately: being counted
     inside a marine protected area is the safe error, and being counted outside one is
     not.

4. **Area precedence.** Sort by `priority` desc, then specificity (smaller bbox first),
   then id. If any contained-or-straddled area has `restriction_class = 'no_take'` and is
   in effect at `at`, short-circuit to `outcome: 'no_take'` with the area named in
   `reasons`. Species rules cannot open a closed area.

5. **Select candidate rules.** From the dataset, rules where all hold:
   - `species_id` equals the query species, **or** is a transitive `rolls_up_to` ancestor
     of it (via `core/ontology/species.ts` semantics, carried in the package);
   - `management_area_id` is in the resolved area set, or is null;
   - `fishing_modes` is empty or contains the mode;
   - the rule's own `effective_from <= at < effective_until`;
   - if `depth_max_m` is set and `query.depthM` is null, the rule still applies — see
     step 8, absent depth resolves to the most restrictive branch.

6. **Rank by specificity.** Tuple, descending: (exact species > group), (most specific
   area > parent area > jurisdiction-wide), `precedence`, `effective_from`. The top row is
   the base rule. When a group row supplied it, set
   `flags.groupRuleInherited = true` and name the group in `reasons` — an angler is
   entitled to know they are being told the rockfish rule, not the vermilion rule.

7. **Evaluate the season, in `jurisdiction.timezone`.** Not the device's zone, not UTC.
   `season_windows` if present, otherwise the recurring `MM-DD` pair, which may wrap the
   year end (11-01 → 03-15 is one window spanning New Year). A season flips at 00:00 local
   in the jurisdiction's zone. Result: `open`, `closed`, `opens_on(date)`,
   `closes_on(date)`, plus the boundary instant so the UI can say "closes in 6 hours".

8. **Conservative merge.** When more than one rule survives at equal specificity, or when
   any area is `straddling`, merge field by field to the **most restrictive** value:
   `min(bag_limit)`, `max(min_length_mm)`, `min(max_length_mm)`, `min(depth_max_m)`, union
   of `gear_restrictions`, closed beats open, `no_take` beats everything, a
   `permit_required` survives. Set `flags.conservativeMergeApplied = true` and list the
   disagreeing areas. **Never average. Never pick the friendlier one.** Absent depth with
   a depth-constrained rule takes the same path: assume the constraint bites.

9. **Clock sanity.** If `|deviceClockSkewS| > 900`, or `at` precedes the active dataset's
   `effective_from`, or `at` is more than 24 h past `effective_until`, set
   `flags.clockSuspect = true`. The resolver still answers — refusing on a boat is worse
   than answering with a visible caveat — and the UI must then show the date it used and
   offer manual date entry. `server_clock_skew_s` is captured from the `Date` header of
   the last successful network call and stored in `meta`; null means never synced, which
   is not suspicious, only unknown.

10. **Staleness.** `days = floor((at - dataset.provenance.verifiedAt) / 1d)`.
    `fresh` ≤ 30 · `aging` ≤ 90 · `stale` ≤ 365 · `expired` > 365 or past
    `effective_until`. `expired` is not a colour change: the answer is shown under an
    explicit block saying it is out of date, with `sourceUrl`, and no keep affordance.

### Result

```ts
interface RegulationResult {
  outcome: 'resolved' | 'no_take' | 'no_rule' | 'no_dataset' | 'location_unknown';
  speciesId: ConfirmedSpeciesId;
  jurisdictionId: string | null;
  areas: readonly ResolvedArea[];   // { areaId, name, kind, certainty, distanceToEdgeM }
  rule: EffectiveRule | null;       // the merged, most-restrictive rule
  season: SeasonState;
  reasons: readonly Reason[];       // { code, areaId?, ruleId?, text }
  provenance: readonly RuleProvenance[];  // every source that contributed, winner first
  datasetId: string; datasetVersion: string;
  staleness: { band: StalenessBand; days: number; verifiedAt: string; effectiveUntil: string | null };
  flags: { locationAssumed: boolean; conservativeMergeApplied: boolean;
           straddling: boolean; clockSuspect: boolean; groupRuleInherited: boolean };
}
```

`reasons` is load-bearing. **The UI never composes its own explanation of why an answer is
what it is.** If a sentence is missing, add a `Reason` code in `core/`, not a string in a
component.

### Vector cases — `src/core/rules/vectors/regulations.json`

1. inside exactly one area · 2. on a shared edge of two areas → inside both, merged ·
3. on a vertex · 4. outside all areas, inside jurisdiction water → jurisdiction-wide rule ·
5. accuracy 300 m, 120 m from an MPA line → `straddling` → `no_take` applied ·
6. accuracy 3 m, 400 m from the line → `inside`, not straddling ·
7. season wrapping New Year, evaluated 23:59 Dec 31 and 00:01 Jan 1 local ·
8. device in UTC, jurisdiction `America/Los_Angeles`, evaluated across the local midnight
   flip · 9. device clock 3 days fast across a closure date → `clockSuspect` ·
10. `rockfish` group rule inherited by a species with no own row → `groupRuleInherited` ·
11. species row overrides the group row on bag limit · 12. emergency dataset outranks
stable for the same instant · 13. withdrawn dataset ignored, falls back to the prior ·
14. no dataset → `no_dataset` · 15. no position and no manual area → `location_unknown`
with jurisdiction-wide rules and `locationAssumed` · 16. two overlapping areas disagree on
bag → min taken, merge flagged · 17. depth-constrained rule with `depthM: null` → applied ·
18. dataset past `effective_until` → `expired`.

`src/core/rules/vectors/geo.json`: inside · outside · on an edge · on a vertex · inside a
hole (interior ring) → outside · multipolygon union · bbox fast-reject · distance to edge
from inside and from outside · degenerate polygon (< 3 points) rejected.

---

## 8. The ID decision tree

### 8.1 The model, and why it is not probabilistic

Ranking is **additive weighted trait matching**, not Bayes.

For each answered trait `t` with chosen option `o`:

```
raw[s]      = Σ  weight(t) × score(s, t, o)          score ∈ {-1, 0, +1}
W           = Σ  weight(t)                            over answered traits only
matchRatio[s] = (raw[s] + W) / (2W)                   ∈ [0, 1]
excluded[s] = any answered (t,o) where evidence(s,t,o).excludes === true
```

Excluded species are **ranked out, never deleted**. They appear in a "ruled out" list with
the trait that did it, because an angler who mis-answered one question must be able to see
what that cost them and go back.

Confidence is a **band**, never a percentage:

```
answeredFraction = W / (Σ weight over all traits in the tree)
separation       = matchRatio[1st] - matchRatio[2nd live candidate]

strong    matchRatio[1] ≥ 0.85 AND separation ≥ 0.20 AND answeredFraction ≥ 0.6
moderate  matchRatio[1] ≥ 0.65 AND separation ≥ 0.10
weak      otherwise
```

Hard override: the band can never exceed `moderate` while any live candidate is within
0.05 of the top. Two fish that look the same are two fish that look the same, and the
arithmetic must not launder that into certainty.

**Why not naive Bayes or a learned model.** We have no priors, no calibrated likelihoods,
and no labelled catch data. A number like "87%" is a frequency claim, and we cannot back
it. Three further reasons, each sufficient on its own: (a) additive integer-weighted
arithmetic is trivially reproducible in Swift against the same vectors, where
floating-point normalisation in a probabilistic model drifts across languages; (b) every
input is auditable, so the UI can say *"ranked here because: 3 anal fin spines, black
blotch on the spiny dorsal"* — an explanation a probability cannot give; (c) authoring a
weight is a judgement a fish biologist can make and defend, and a prior is not.

`IdResult` carries `because: Reason[]` (the traits that drove the top candidate) and
`ruledOutBy` per excluded species.

### 8.2 Next question

`nextTrait()` picks the unanswered trait that best splits the **live** candidate set: the
trait maximising the number of live candidates whose evidence differs across its options,
tie-broken by `weight` desc, then `order` asc. Deterministic — the same answers always
produce the same next question, in both clients. Traits with
`requiresFishInHand: true` are deprioritised when the caller says the fish is already
released.

### 8.3 The photo classifier seam — the line the regulatory engine must never cross

A future classifier emits:

```ts
interface ClassifierCandidate {
  speciesId: string; score: number;   // 0..1, the model's own number, uncalibrated
  modelId: string; modelVersion: string;
}
```

It enters `score.ts` as **one bounded evidence channel**, through `classifier.ts`:

```
classifierBudget = 0.25 × (Σ weight over all traits in the tree)
raw[s] += classifierBudget × clamp01(score[s])
W      += classifierBudget            // once, not per species
```

Three invariants, and they are what make this safe:

1. **A photo can reorder candidates. It can never, by itself, reach the `strong` band** —
   0.25 of the total weight cannot clear the 0.85 / 0.20 / 0.6 gate alone.
2. **A classifier cannot un-exclude a species** that a trait answer excluded. Human
   observation of the fish beats a model looking at a photograph of it.
3. **`resolveRegulations()` never sees an `IdResult` or a `ClassifierCandidate`.** Its
   `speciesId` is a branded `ConfirmedSpeciesId`, produced only by
   `confirmSpecies(speciesId)` called from an explicit human tap. The type system, not a
   convention, is what stops a model's guess becoming a legal answer. This is the single
   most important sentence in §8.

### Vector cases — `src/core/rules/vectors/fish-id.json`

single diagnostic trait → `strong` · two candidates tied → `weak`, band capped · exclusion
removes a candidate and records `ruledOutBy` · an "I don't know" answer contributes zero
weight and does not move the ranking · classifier reorders but cannot reach `strong` ·
classifier cannot un-exclude · `nextTrait` determinism across a permuted answer order.

---

## 9. Conservative UI state

`deriveAdvisory(result: RegulationResult, idResult: IdResult | null): Advisory` — pure, in
`core/rules/regulations/advisory.ts`. The UI renders it and never computes it, which is
what makes the conservative behaviour vector-testable instead of dependent on a designer
remembering.

```ts
interface Advisory {
  level: 'ok' | 'caution' | 'stop';
  headline: string;
  blockers: readonly Reason[];
  actionsAllowed: readonly ('keep' | 'measure' | 'release' | 'photo')[];
  requiresSpeciesConfirmation: boolean;
}
```

Level is `stop` if **any** of these hold:

- `outcome === 'no_take'`, or the merged rule's `take_status` is `no_take` /
  `catch_and_release`;
- the season is `closed`;
- **any live ID candidate** — not just the top one — resolves to `no_take`, `protected`,
  `catch_and_release` or a closed season, while the band is `weak` or `moderate`;
- `staleness.band === 'expired'`.

Level is `caution` if any of: `flags.straddling`, `flags.conservativeMergeApplied`,
`flags.clockSuspect`, `flags.locationAssumed`, `staleness.band === 'stale'`,
`flags.groupRuleInherited`, or the ID band is below `strong`.

When level is not `ok`:

- the screen leads with the **most restrictive applicable answer**, not the top-ranked
  candidate's answer;
- **no green affordance and no "Keep" button is rendered.** Not disabled — absent.
- the named blocker is shown in the angler's words: *"Vermilion rockfish is still one of
  your candidates, and it is closed here today."*
- `requiresSpeciesConfirmation` forces an explicit species tap before any keep action,
  and that tap is what sets `species_confirmed_by` (§10);
- `provenance-footer.tsx` always shows `sourceAgency` and `verifiedAt`, and when the band
  is `stale` or `expired` it says, verbatim, **"Confirm with the agency before you keep
  this fish."**

There is no configuration to turn this off.

---

## 10. Log Fish integration contract

`catch` gains exactly six columns:

| column | type | notes |
|---|---|---|
| `regulation_dataset_id` | text null | the dataset that answered |
| `regulation_version` | text null | denormalised, so a snapshot is self-describing |
| `regulation_snapshot` | jsonb null | the immutable `RegulationResult`, geometry stripped |
| `regulation_resolved_at` | timestamptz null | |
| `regulation_status` | text | `resolved` \| `no_take` \| `no_rule` \| `no_dataset` \| `location_unknown` \| `skipped` |
| `species_confirmed_by` | text | `angler` \| `angler_after_id_tree` \| `angler_after_photo` |

`id_result jsonb null` is a seventh, optional column: the ranked candidates and band, kept
so a later species correction can be understood rather than guessed at.

Rules:

1. **The snapshot is written at the moment the catch is logged**, from the local package,
   offline, in the same transaction as the catch row and its outbox mutation (ADR 004 §1's
   atomicity rule). It is **never recomputed**. A dataset update in October must not change
   what a September catch says it was told.
2. **Immutable.** A trigger rejects any `UPDATE` that changes `regulation_snapshot` once it
   is non-null. Correcting the species writes a *new* resolution alongside, it does not
   overwrite history.
3. Geometry is stripped: areas are stored as `{ areaId, name, kind, certainty }`. Target
   size ≤ 4 KB. A snapshot that would exceed 16 KB is truncated to the winning rule plus
   provenance and marked `truncated: true`.
4. **`species_confirmed_by` can never be `photo` or `model`.** A model does not confirm a
   species; a person does, and the column records which path the person came through.
5. **Regulations never block a save.** No package installed → `regulation_status =
   'no_dataset'`, snapshot null, catch logs normally. The quick mark (D22) does not resolve
   regulations at all; it resolves them when the mark is resolved into a catch, if a
   species is present by then.

---

## 11. Freshwater and other jurisdictions — why this does not need a redesign

Three expansions, each shown as data only:

- **Oregon saltwater.** One `jurisdiction` row (`us_or`, timezone
  `America/Los_Angeles`), its own datasets, areas, boundaries and rules. Zero code.
- **California freshwater.** A `water_class = 'fresh'` dataset under the *same*
  `us_ca` jurisdiction. `management_area.kind = 'water_body'` with a lake polygon; the
  point-in-polygon path is unchanged. Species already carry `water_class` in the existing
  vocabulary, and the rule row already keys on `(species_id, jurisdiction, area)`.
  A lake with its own season is a `season_windows` array. Zero code.
- **A jurisdiction with a different tree of areas** — say federal EEZ over state water
  over a county closure. That is `parent_id` nesting and `priority`, which already exist.

The proof is negative and checkable: **there is no `if (jurisdiction === 'us_ca')` and no
California-named enum anywhere under `src/core/` or `src/features/regulations/`.** Every
input to the resolver comes from the package or the query. A reviewer can grep for it.

**The honest limit.** The model expresses rules as `(area × species × mode × time window)`.
It does **not** express per-angler state carried across trips: annual tags, harvest cards,
report cards, season-long quotas. Those are `permit_required` today, which tells an angler
a permit exists and stops short of tracking whether they have used it. Doing it properly
needs a `permit_holding` entity that is angler-owned and syncable — a V2 addition that
extends this schema rather than replacing it, because it joins on `permit_required` which
already exists.

---

## 12. Deliberately deferred

- **Raster basemap tiles.** ADR 007 §5. Vector-only in V1, with the trigger for revisiting
  written down.
- **Per-angler permits, tags and harvest cards.** §11.
- **Automatic reciprocal-jurisdiction handling** (fishing federal water off one state,
  landing in another). One jurisdiction per resolution in V1; a straddle across two
  jurisdictions returns the most restrictive and flags it.
- **Antimeridian-crossing boundaries.** Rejected at package build.
- **A `take_method` column on `catch`** for spearfishing. §5.
- **Recursing the vector tripwire.** §2, if it forces another lane's rename.
- **Everything in `docs/specs/regulations-socal-research.md` §11 ("COULD NOT VERIFY").**
  That doc is research, not data. No number in it enters a package without a human
  verifying it against the source; `verifiedBy` exists so that is recorded rather than
  assumed.
- **The ETL that turns agency documents into packages.** It is a real project with real
  liability, it is not architecture, and `counsel` should see the disclaimer copy before
  the first package ships.
