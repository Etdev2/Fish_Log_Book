# Phase 0 — Repository audit: what already exists, and what the expansion brief assumes wrongly

**Status:** Findings — read before any other file in this directory
**Date:** 2026-09-15
**Governs:** every spec in `docs/specs/expansion/`
**Extends:** `docs/architecture/ontology.md`, `docs/architecture/tournament-domain-model.md`
**Supersedes:** nothing

> The founder brief ("Fishing Intelligence Platform Expansion") asks for twelve
> implementation-ready specifications and says, twice, *inspect the existing application
> first and reuse existing systems*. This file is that inspection. It exists because six
> of the brief's twelve asks are already half-built in this repository, one of them is
> built **wrong** in a way the brief itself warns against, and two of them were explicitly
> killed by a founder decision three weeks ago on cost grounds.
>
> Every other file in this directory cites this one instead of re-deriving it.

---

## 1. What was inspected

Read in full or in relevant part, 2026-09-15:

- 62 SQL migrations (`supabase/migrations/`), 8,830 lines, 79 tables.
- 442 files under `src/`.
- `docs/architecture/ontology.md`, `docs/architecture/tournament-domain-model.md`,
  ADRs 001–010, `docs/product/SPEC.md`, `docs/product/ROADMAP.md`,
  `docs/design/01`–`12`, `docs/specs/*`.
- The running application. `npm ci` then `npm run dev`, Chromium at 320 / 360 / 390 /
  430 px, with measurements recorded in §7 and in `ui-ux-critic-loop.md`.

---

## 2. The shape of the thing today

```text
Next.js 16.3.3 (Turbopack) · React 19.2.8 · Tailwind v4 · TypeScript strict
Supabase (Postgres + RLS + PostgREST) · IndexedDB via idb · Leaflet
```

Four layers, enforced by ADR 003/005 and by tests:

| Layer | Path | Rule |
|---|---|---|
| Pure domain | `src/core/` | No React, no I/O, no clock, no id minting. Vector-tested against JSON fixtures so the future Swift client reproduces the same arithmetic. |
| Features | `src/features/` | One directory per product area. Never reaches into another feature's internals. |
| Infrastructure | `src/lib/` | Knows stores, transactions, HTTP. Knows nothing about what a catch is. |
| Routes | `src/app/` | Thin. `(app)` / `(auth)` / `(internal)` route groups. |

This separation is the single most valuable asset the expansion inherits. Every
"intelligence platform" feature the brief describes — enrichment, aggregation, scoring,
identification, re-identification — is a pure function over stored facts, and `src/core/`
is where those functions already live and are already vector-tested.

---

## 3. What already exists (reuse, do not rebuild)

### 3.1 The catch record and its snapshot — substantially there

`public.catch` (migration `20260828120000_v1_core_schema.sql`) already carries, today:

`caught_at` + `caught_tz` + trigger-set `local_date`, `lat`/`lng` at 5 dp,
**`gps_accuracy_m`**, **`geo_cell_1km`** and **`geo_cell_10km`** as *generated stored
columns*, `species_id`, `outcome`, `disposition`, `length_mm`, `weight_g`,
`size_estimated`, `depth_fished_m`, `bottom_depth_m`, `spot_id`, `platform`,
`tackle_item_id`, `bait_type_id`, `rig_id` + `rig_revision`, `inherited_fields[]`,
`presentation`, `structure_type_id`, `cover_type_id`, `notes`, `capture_mode`
(`live`/`backfill`), and a resolution lifecycle (`unresolved`/`confirmed`/`dismissed`)
with a trigger that forbids going backwards.

`public.condition_snapshot` already carries pressure + **3 h trend**, air temp, wind speed
and bearing, cloud cover, moon phase angle / illumination / days-from-full / days-from-new
/ moonrise / moonset, sunrise / sunset / civil twilight / minutes-from-sunrise /
minutes-from-sunset / day-of-year, user water temp, tide height / rate / state /
pct-through-cycle / twelfths / range, current term + bearing + strength, swell height /
period / direction, and freshwater clarity / colour / visibility / level trend /
elevation / seasonal pattern.

And — this matters more than any column — it already carries **provenance**:

```sql
enrichment_status text   -- pending | complete | partial | failed | unavailable
snapshot_basis    text   -- observed | historical_reconstruction
provenance        jsonb
algo_version      integer
enrichment_attempts integer
enrichment_last_error text
```

with a schema comment stating that `unavailable` is terminal and that *missing is null,
never zero*.

**Verdict.** The brief's section 3 ("Enriched catch record") is ~70 % existing schema. What
is genuinely missing is: sea-surface temperature, current *speed* (as opposed to the
angler's four-word vocabulary), wave height/direction/period as distinct from swell,
chlorophyll, bathymetry, marine zone, time-to-next-tide-turn, and a **per-field**
provenance discipline (today `provenance` is one free jsonb blob with no enforced shape).
`catch-environmental-enrichment.md` specifies only those deltas.

### 3.2 Privacy primitives — the foundation is laid, the policy is not

`ontology.md` §6 already names the six leak paths (photo EXIF, station ids, spot names in
logs, enrichment request logs, small-group aggregates, export) and already rules that
`geo_cell_10km` is "the finest granularity any cross-user aggregate may ever group by".
RLS is default-deny on every user-owned table, keyed `angler_id = (select auth.uid())`.

What does not exist: consent records, data-access grants, a minimum-group-size gate, a
coordinate-access audit log, sensitive-species location hardening, deletion/retention
machinery, or an export path. `privacy-consent-and-data-governance.md` covers those, and
nothing in this directory may ship ahead of it.

### 3.3 Fish Legal — far more built than the brief assumes

Not a California prototype. There are **~50 region packs** in `src/features/fish-legal/`
covering the US Pacific, Atlantic and Gulf coasts, Washington's marine areas 1–13,
California's five Groundfish Management Areas, California freshwater, Hawaii, Alaska,
Baja California and Baja California Sur. Server-side there are `reg_pack` / `reg_area` /
`reg_group` / `reg_rule` tables with their own RLS migration. `regulation-snapshot.ts`
already writes pack id, pack version, jurisdiction label, verdict, reason, bag, possession,
min/max size, size measure and evaluated date onto **every catch**, and already returns
`null` rather than a guess when no verified rule exists.

**Verdict.** The brief's "clear labelling when a dataset only covers California" is a
mis-description of the current state. The real gaps are: no agency-authored packs (all
data is second-hand research, however well cited), no freshness SLA, no agency-facing
publication workflow. `fish-legal-agency-integration.md` addresses those.

### 3.4 Tournaments — 40+ tables and a full financial domain

`docs/architecture/tournament-domain-model.md` (1,333 lines) is ratified architecture, and
most of it is migrated: organizations with personal-org tenancy, divisions, award
categories, teams, boats, entries and identity claims, versioned rule sets / scoring /
verification policy / boundaries, catch + evidence with immutability triggers, fair-play
signals, QR verification with rotation, adjudication, penalties, disputes, standings,
leaderboard snapshots, final results, orders, payments, Stripe and crypto providers,
refunds, prize pools, payouts, platform fees, and a Stripe webhook with tests.

**Verdict.** The brief's "the tournament experience is currently the area that needs the
most improvement" is correct — but the deficit is **not** backend capability. It is
information architecture and screen design. See §7 and `tournament-experience-redesign.md`.

### 3.5 Offline — designed, specified, and working

ADR 004 plus `src/core/sync/` (outbox envelope, retry state machine, uuidv7) and
`src/lib/offline/db.ts` (IndexedDB, one store per entity, **row and outbox record written
in one transaction**). `create.ts` encodes the offline contract in its ordering comment:
*the catch row is written first and everything optional happens around it.*

**Verdict.** The brief's "support offline logging" is done for the personal log. What is
missing is offline **enrichment queueing** (today every web write lands
`enrichment_status = 'pending'` and nothing ever picks it up — there is no enrichment
worker at all) and an offline tournament submission queue that shares this machinery
rather than reinventing it.

### 3.6 Dependent equipment selection — the mechanism exists

ADR 008 and `src/features/tackle/types.ts` already implement `dependsOn` / `optionsBy` /
`fieldOptions()`: reel *type* already filters reel *size* options, because spinning reels
are numbered in thousands and conventional reels in line classes. The brief's
type → brand → family → model → size ladder is **the same mechanism with two more rungs
and a shared catalog behind it**, not a new subsystem. `equipment-product-catalog.md`
extends; it does not replace.

### 3.7 Identification — a deterministic baseline already ships

`src/features/fish-id/` ships trait-key packs (Pacific salmon from the WDFW/ADF&G key,
rockfish) driven by `src/core/rules/identification/`. Its stated organising principle is
**consequence, not coverage**.

This is the number any AI model must beat. A published agency key applied to two questions
an angler can answer with the fish in hand is a strong, auditable, offline, zero-cost
baseline. `ai-fish-identification.md` treats it as the control arm, not as legacy.

---

## 4. The finding that changes the brief

> **There are already two catch-record systems, and the brief's own prohibition is already
> violated.**

`public.tournament_catch` (migration `20260905193000_tournament_catch_evidence.sql`) has
no foreign key to `public.catch`. It re-declares `species_id`, `species_other`,
`caught_at_device`, `length_mm`, `weight_g` and `disposition` as its own columns, with its
own immutability trigger and its own `client_generated_id` idempotency key. Nothing in the
schema links a tournament catch to the personal catch the same fish produced.

Consequences, today:

1. An angler in a tournament logs the same fish twice, in two screens, into two tables.
2. The fish is in the Fish Log **or** on the leaderboard, and no query can tell you it is
   both. Personal bests, the Passport, species collections and every future aggregate
   silently undercount tournament fish.
3. The environmental snapshot, the regulation snapshot, the rig, the tackle and the GPS
   accuracy — every enrichment this expansion is about — attach to `public.catch` and are
   therefore **absent from every tournament catch**. The most heavily evidenced,
   judge-reviewed, highest-quality catches in the system are the ones carrying the least
   scientific metadata.
4. Any future "fishing effort" or CPUE figure computed from `public.catch` alone is wrong
   by exactly the tournament volume — the one segment where effort is precisely known.

This is not a criticism of ARCH-001, which was solving tenancy and immutability under time
pressure and solved them well. It is a statement that the expansion cannot proceed over
the top of it. **Ticket 1 in `phased-delivery-roadmap.md` is the reconciliation**, and it
is specified in `data-architecture-expansion.md` §4.

---

## 5. Founder decisions this brief collides with

| Prior decision | Where | Collision |
|---|---|---|
| ~~Photo storage: "❌ NOT NOW — 2026-09-03, founder, on cost."~~ **REVERSED 2026-09-15 — `SPEC.md` D28.** | `ROADMAP.md` Part 2 A2 | Photos are in scope. AI Fish ID (§10), biometrics (§11) and tournament evidence (§7) are unblocked. EXIF stripping on ingest comes with the reversal, not after it. The cost that motivated the original no is unchanged, so `cfo` prices storage and egress before bulk upload. |
| **"Fish identification from photos — different product, enormous effort, and wrong answers are worse than no feature."** | `ROADMAP.md` Part 3 | Partly reversed already by the passport spec (AI as ranked suggestion, never a verification status or a legal conclusion). The brief agrees with the reversal's terms. Keep the terms. |
| **Leaderboards and gamified logging corrupt the denominator.** | `ROADMAP.md` Part 3 | The brief's §11 incentive system (conservation points, recapture badges, prizes) is exactly the mechanic that was ruled out because *rewarding logging corrupts the data we are selling.* `fish-biometric-reidentification.md` §12 keeps it, but only in the form the earlier ruling allows: reward **honest confirmation and data quality**, never catching more, never re-catching the same fish. |
| ~~The log stays on-device for now; database sync comes later.~~ **LIFTED 2026-09-15 — `SPEC.md` D29.** | `setup-flow-and-quiver.md` preamble, founder 2026-09-04 | Sync is on. Enrichment, aggregation, dashboards and exports are unblocked. Offline stays mandatory (D3) and reads still never touch the network (ADR 004 §1) — sync is how rows reach the server afterwards, never a round trip the angler waits on. |
| **Dark-only by design.** `tokens.json` `$darkOnlyByDesign` states there is no light theme in V1, deliberately, because a light UI is actively harmful in bright sun on open water. | `src/core/design/tokens.json` | The brief asks to validate "dark, light, and night modes". There is one mode. Do not build two more to satisfy a checklist; `ui-ux-critic-loop.md` §9 replaces that item with the test that actually matters here — sunlight legibility and a true red-preserving night mode. |

**None of these are overruled by this audit.** They are surfaced so the founder overrules
them knowingly, in writing, where they choose to.

---

## 6. Gaps: what genuinely does not exist

| # | Gap | Blocks |
|---|---|---|
| G1 | No enrichment worker. Every snapshot written by the web client is `pending` forever. | Everything in §3 of the brief |
| G2 | No server media/object storage, no EXIF stripping, no content hashing at rest | AI ID, biometrics, tournament photo evidence |
| G3 | No consent records, access grants, coordinate-access audit log, or k-anonymity gate | Any sharing, any research export, any agency feature |
| G4 | No aggregate/analytics store. Everything is transactional Postgres. | Maps, dashboards, CPUE, exports |
| G5 | No equipment catalog (manufacturer/family/model); only per-angler free text + chips | Dependent gear selection |
| G6 | No link between `public.catch` and `public.tournament_catch` (§4) | Effort statistics, personal bests, enrichment of tournament catches |
| G7 | No organization type for a government agency; `organization.kind` is tournament-shaped | Agency dashboards, licence integration |
| G8 | No map beyond the Fish Legal Leaflet boundary view; no tiles, no clustering, no time slider | Fisheries intelligence map |
| G9 | No species taxonomy beyond a flat `species` table with `is_group` — no ranks, no synonyms, no ITIS/WoRMS/FishBase identifiers | AI labels, agency exchange, research export |
| G10 | Tournament UI reads a **local demo store** when Supabase is unconfigured, and that is every environment today | Any claim that the tournament flow is proven |

---

## 7. Measured UI facts (evidence for the critic loop)

Chromium, `next dev`, `DEV_AUTH_BYPASS=true`, device-scale 2, mobile emulation.

| Measurement | Value | Where |
|---|---|---|
| Bottom navigation height at 320 px | **97 px** (two rows) | `shell-nav.tsx`; 15 % of a 640 px viewport |
| Bottom navigation height at 390 px | 49 px (one row) | same |
| Primary action (`Compete now — log a catch`) top offset, tournament overview | **740 px at 320 px, 712 px at 390 px** | below the fold on every phone, in a 640 px viewport |
| Anchor count, one tournament overview screen | **33** | 14 of them the always-mounted drawer |
| Navigation systems on that one screen | **2, disagreeing** | chips `Home / ①Entry / ②Compete / ③Results / Rules` vs cards `1 Enter / 2 Know the rules / 3 Compete / 4 Results` |
| Horizontal overflow at 320 px | none on any screen tested | good, and worth keeping |
| Touch targets below 48 px | 1 (`Log`, 45×48 at 390 px) | otherwise the 48 px floor holds |
| Validation error shown before any input | yes — "Every angler needs a name." under an untouched field | `/tournaments/[id]/register` |

Full scoring and the five critique rounds are in `ui-ux-critic-loop.md`.

---

## 8. What this audit recommends before anything else is built

1. **Reconcile the two catch records** (§4). Nothing else in this directory is safe until
   `public.catch` is genuinely the single source of truth.
2. **Write the governance rules first.** `privacy-consent-and-data-governance.md` is a
   dependency of the map, the research export, the agency dashboard, AI ID and biometrics.
   It is cheap now and impossible to retrofit.
3. **Build the enrichment worker** (G1). It unlocks the brief's headline feature and needs
   no new product surface.
4. ~~Get a founder ruling on server media (G2).~~ **Done, 2026-09-15: reversed in favour
   of storage (`SPEC.md` D28), and sync lifted (D29).** Both gates are open, so the honest
   remaining constraint on Phase 3 is data collection time, not permission.
5. **Fix the tournament information architecture** (§7). It is the highest user-visible
   return in the whole brief and it requires no new backend at all.
