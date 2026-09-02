# Regulations data model — normalized, multi-jurisdiction

**Author:** biostat (Regulations/Data lead) · **Date:** 2026-09-01 · **Status:** proposed
**Scope:** the record format and field semantics. Storage, module layout and pipeline
structure belong to `docs/specs/regulations-architecture.md` (architect) — where this
document and that one overlap, **the architect wins on structure and this document wins on
what a field means**.
**Content companion:** `docs/specs/regulations-socal-research.md`.
**Depends on:** ADR 006 §3 (SI in `core/`), ADR 006 §5 (`Sourced<T>` and its lint rule),
ADR 001 (one canonical vocabulary).

---

## 1. The one-sentence version

A regulation record answers exactly one question — *"in this place, for this fish, in this
mode, on this date, what does the law say?"* — and it is required to be able to answer
**"we do not know"** as a first-class result, distinguishable from "there is no limit" and
from "you may not keep this at all".

Everything below exists to keep those three apart.

## 2. Why not one flat table

The founder's field list is a good flat record and a bad schema, for one reason: California's
RCG complex puts **one bag limit on roughly sixty species at once**, with per-species
sub-limits inside it. Flattened, the number `10` is copied sixty times, and the day the
Commission changes it to 9 there are sixty rows to find and one to miss. The same shape
recurs everywhere — the Gulf reef-fish aggregate, UK sea-bass, Australian mixed-species
bags — so it is not a California special case to hack around.

So: **five record types**, not one table.

| Record | Answers | Cardinality |
|---|---|---|
| `Jurisdiction` | Who makes the law, in what timezone, citing what. | ~1 per state/country |
| `Boundary` | Where a rule applies. Geometry lives here, not in the rule. | many |
| `LimitGroup` | An aggregate/complex bag shared by several species. | few |
| `SpeciesGrouping` | Which species belong to which group. | many |
| `RegulationRule` | The rule itself. **This is the founder's record.** | many |

The founder's flat record is preserved as a *view*: joining the five gives back exactly the
listed fields, plus the additions in §11. Nothing is lost, and the `10` is stored once.

---

## 3. Units — SI is canonical, published text is authoritative

ADR 006 §3 already decided this and it is not reopened here: **`src/core/**` is SI and only
SI.** Applied to regulations:

| Quantity | Canonical field | SI unit | Notes |
|---|---|---|---|
| Fish length | `length_mm` | **millimetres, integer** | Not centimetres. Not inches. Ever. |
| Fish weight | `weight_g` | **grams, integer** | For jurisdictions with weight limits. |
| Depth | `depth_m` | **metres** | Fathoms and feet are labels only — see §7. |
| Distance from shore | `distance_m` | **metres** | Nautical miles are a label. |
| Time | `Instant` | **UTC epoch-ms** | Per ADR 006 §3. See §8. |

### 3.1 The published value and the SI value coexist, deliberately

Every measurement field is a pair:

```ts
interface SizeLimit {
  readonly published_text: string;     // "22 inches total length"  <- legally citable
  readonly length_mm: number | null;   // 559                        <- what the app computes with
  readonly length_basis: LengthBasis;  // "total"                    <- see §3.3
  readonly rounding: "up" | "down" | "exact";
}
```

**The app displays `published_text`. The app computes with `length_mm`. It never displays a
back-conversion of `length_mm`.**

The reason is small and real. `22 in` is `558.8 mm` exactly. Stored as an integer that is
`559 mm`, and converting `559 mm` back gives `22.008 in`, which a formatter will render as
`22.01"` or, worse, round to `22"` and look fine right up until a limit lands on a value
that does not round back cleanly. The published string is the legal artefact; the SI number
is a derived convenience. Displaying the derived form and citing it as the law would be the
app asserting a number the regulator never wrote.

### 3.2 Rounding direction is a safety decision, not a formatting one

Because `length_mm` is an integer and most US limits are inch-denominated, rounding is
forced. It is resolved **toward the angler releasing the fish**, never toward keeping it:

| Limit kind | Round | Why |
|---|---|---|
| `minimum_size` | **up** | `22 in` → `559 mm`. A 558.9 mm fish is called short. Worst case: the angler releases a barely-legal fish. Harmless. |
| `maximum_size` | **down** | A slot's upper bound tightens. Worst case: the angler releases a barely-legal fish. Harmless. |
| metric-published limits | **exact** | `71 cm` → `710 mm`. No rounding occurs; `rounding: "exact"`. |

The inverse convention would produce a "keep it" verdict on an illegal fish. That is the
only outcome this model treats as unacceptable, so the arithmetic is bent away from it.
`rounding` is stored so the choice is auditable rather than folklore.

### 3.3 Length basis is part of the number

A size limit without its measurement basis is not actionable — `22 in total length` and
`22 in fork length` are different fish, and CDFW uses more than one basis (research §6).

```ts
type LengthBasis =
  | "total"        // snout to tip of tail
  | "fork"         // snout to fork of tail
  | "alternate"    // CDFW-specific; reported mid-repeal (research §6)
  | "carapace"     // crustaceans
  | "girth"
  | "fillet"       // a processed-fish rule, not a whole-fish size limit
  | "unknown";     // the source did not state a basis
```

Open enum with an explicit `"unknown"` member, **not** a closed union — because
"alternate length" is reportedly being repealed, meaning the valid set is itself
time-varying, and a closed union would have to be recompiled by a rulemaking.

`"unknown"` is not cosmetic: a size limit with `length_basis: "unknown"` **must not drive a
legal/short verdict**. The app can show the published text and say "we can't tell you which
measurement this uses". It cannot measure a fish against it.

### 3.4 A note on the `Sourced<T>` lint tripwire

ADR 006 §5 defines `Sourced<T>` as `{ value, certainty, basis }` and an ESLint rule fires on
any type carrying all three of those property names. **No type in this document uses that
triple.** The near-misses were deliberate:

- measurement basis is `length_basis`, not `basis`
- quantities use `state` + `count`, not `value`
- provenance uses `verification_status`, not `certainty`

That is not merely lint-avoidance. `Sourced<T>` means *"we derived this number and here is
how confident we are"*. A regulation is not derived and our confidence in it is irrelevant —
either the regulator published it or we do not know it. Reusing the wrapper would blur a
measurement estimate with a legal fact, which is a worse bug than a lint failure.

---

## 4. Aggregate and complex limits — the hard one

### 4.1 The shape of the problem

California's RCG complex is: **10 fish per person per day in combination**, across the whole
rockfish genus plus cabezon plus greenlings, with sub-limits *inside* that ten — reportedly
1 copper, 2 vermilion/sunset **combined**, 2 canary — and several members at **zero**.
(All figures Tier B; see research §4.)

Four things must be true at once, and any one of them breaks a naive design:

1. The `10` exists **once**.
2. A sub-limit can name **a set** of species, not just one — "vermilion *and* sunset,
   2 combined", because the two were recently split taxonomically and anglers cannot tell
   them apart in the boat.
3. A member can be at **zero** while the group is open, and "zero" here means
   *zero-retention*, not *no data*.
4. A species can belong to a group **and** carry an independent limit of its own from a
   different instrument (lingcod sits inside RCG for some purposes and has its own 2-fish
   bag and 22-inch minimum).

### 4.2 The solution: the group owns the aggregate, rules point at it

```ts
interface LimitGroup {
  readonly group_id: string;              // "ca_rcg_complex"
  readonly jurisdiction_id: string;
  readonly display_name: string;          // "Rockfish, Cabezon and Greenling (RCG) complex"
  readonly aggregate_bag: Quantity;       // the 10, stored ONCE
  readonly aggregate_possession: Quantity;
  readonly plain_language: string;        // "Ten fish total per day across all of these."
}

interface SpeciesGrouping {
  readonly group_id: string;
  readonly species_ids: readonly string[];  // one member, or a set (see §4.3)
  readonly member_kind: "counts_toward" | "excluded";
}
```

A `RegulationRule` then declares how it relates to the group:

```ts
type LimitScope =
  | { kind: "individual" }                             // limit stands alone
  | { kind: "aggregate_member"; group_id: string }     // counts toward the group, no own cap
  | { kind: "sub_limit"; group_id: string };           // counts toward it AND is capped inside it
```

So:

- The `10` is written once, on `LimitGroup.aggregate_bag`.
- A plain member (say gopher rockfish) is `{ kind: "aggregate_member", group_id }` with
  `bag_limit.state === "no_limit"` — meaning *no limit of its own*, the group's cap governs.
- Copper is `{ kind: "sub_limit", group_id }` with `bag_limit = count 1`.
- Cowcod is `{ kind: "sub_limit", group_id }` with `bag_limit.state === "zero_retention"`.
- Lingcod gets **two rules**: one `aggregate_member` for RCG counting, one `individual`
  for its own 2-fish bag and 22-inch minimum. Two instruments, two records, no contradiction.

Changing the aggregate from 10 to 9 is **one edit**.

### 4.3 Sub-limits over a set of species

`SpeciesGrouping.species_ids` is an array, and a sub-limit rule may target a `SpeciesGrouping`
row rather than a bare species id. "Vermilion and sunset, 2 combined" becomes:

```
SpeciesGrouping { group_id: "ca_rcg_vermilion_sunset", species_ids: ["vermilion_rockfish", "sunset_rockfish"] }
RegulationRule  { species_scope: { kind: "set", grouping_id: "ca_rcg_vermilion_sunset" },
                  limit_scope: { kind: "sub_limit", group_id: "ca_rcg_complex" },
                  bag_limit: { state: "count", count: 2 } }
```

This generalizes: a nested sub-group is just another grouping. It is deliberately **not**
recursive beyond one level of nesting in the resolver — two levels covers every real case
found, and unbounded recursion in a legal-safety calculation is a way to get a wrong answer
slowly.

### 4.4 Species scope

```ts
type SpeciesScope =
  | { kind: "species"; species_id: string }        // "lingcod"
  | { kind: "set"; grouping_id: string }           // vermilion + sunset
  | { kind: "group"; species_id: string }          // the ontology group id, e.g. "rockfish"
  | { kind: "all" };                               // "all finfish", for general rules
```

`kind: "group"` uses the *ontology's* `isGroup` entries (`rockfish`, `surfperch`, `croaker`),
which lets a rule attach to the roll-up an angler actually picked when they could not
identify to species. The resolver must then say so out loud: if the angler logged
`rockfish` and the group contains members at zero retention, the honest answer is
**"depends which rockfish this is"**, not the group's most permissive member's limit.

---

## 5. Quantity — the three-way distinction, made four

Conflating "no limit", "unknown" and "zero retention" is a legal-safety bug. A single sum
type makes it impossible to write one where another is meant.

```ts
type Quantity =
  | { readonly state: "count"; readonly count: number }
  | { readonly state: "no_limit" }
  | { readonly state: "zero_retention" }
  | { readonly state: "not_applicable" }
  | { readonly state: "unknown"; readonly unknown_reason: UnknownReason };

type UnknownReason =
  | "not_yet_researched"
  | "source_unreachable"     // this session: egress policy blocked every official domain
  | "sources_conflict"       // e.g. quillback, research §4.2
  | "source_ambiguous"       // e.g. halibut "5" — bag or possession? research §5.1
  | "superseded_pending";    // an instrument changed it and we have not read the new text
```

Semantics, and the UI state each one drives (`ux-ui` writes the final copy from this):

| State | Means | App must say, roughly | App must **not** |
|---|---|---|---|
| `count` | The regulator published this number. | "5 per day" | — |
| `no_limit` | The regulator affirmatively set no limit here. | "No limit published for this" | say "unlimited — keep as many as you like" |
| `zero_retention` | Known, and it is zero. Catch-and-release or fully protected. | "You may not keep this fish" | show it as a bag limit of 0 next to real numbers |
| `not_applicable` | The concept does not apply. A size limit on a species that has none; a depth rule for a shore angler. | show nothing, or "n/a" | show "0" or "unknown" |
| `unknown` | **We do not know.** | "We haven't confirmed this — check CDFW before you fish", with a link | show a number, guess, or fall back to a neighbouring rule |

Three of these render as visually different things, and that is the point. `zero_retention`
is a red stop. `unknown` is a grey "go look it up". `no_limit` is a neutral fact.
A `0` rendered in the same style as a `5` is the failure mode this type exists to prevent.

**The default is `unknown`.** A record with a missing field is `unknown`, never `0`, never
`no_limit`. Absence of data is not permission.

---

## 6. Verification and provenance

```ts
type VerificationStatus =
  | "verified"       // a human or fetcher read the official source and confirmed it
  | "unverified"     // we have a candidate value from a non-authoritative read
  | "stale"          // was verified, but past its re-check horizon
  | "disputed";      // sources conflict

interface Provenance {
  readonly source_agency: string;          // "California Department of Fish and Wildlife"
  readonly source_reference: string;       // "CCR T14 §28.55(b)(1)" — free text; see research §9
  readonly source_url: string | null;
  readonly source_quote: string | null;    // verbatim regulation text, if captured
  readonly source_updated_at: Instant | null;  // when the SOURCE last changed
  readonly retrieved_at: Instant | null;       // when WE last fetched it
  readonly verified_at: Instant | null;        // when a human last confirmed it
  readonly verified_by: string | null;
  readonly verification_status: VerificationStatus;
  readonly verification_note: string | null;   // why it is unverified, in plain English
}
```

Four separate timestamps, because they answer four different questions and the product
needs all four:

- `source_updated_at` — "the regulation changed on this date"
- `retrieved_at` — "we last looked at the page on this date"
- `verified_at` — "a person last checked on this date"
- `effective_from` — "the law started applying on this date"

Collapsing them is how an app ends up saying "up to date" because it re-fetched an
unchanged cached page in 2026 that was last verified in 2019. (The MPA dataset in research
§7 is reportedly current "as of January 1, 2019" — exactly this situation.)

**Nothing with `verification_status !== "verified"` may be presented as a limit.**
Given research §0, that is currently *every record in the Southern California dataset*.

---

## 7. Depth and zone constraints

The most important structural finding of the research: **a "20-fathom line" is not a depth.**
It is a fixed legal polyline of published waypoints in CCR T-14 §35.00 that only approximates
20 fathoms. Computing depth from bathymetry and comparing to 20 fathoms gives a legally
wrong answer near the line (research §4.3).

So a rule never stores a depth number as its constraint. It stores a **reference to a
boundary**, and the fathom figure is a human label:

```ts
interface Boundary {
  readonly boundary_id: string;              // "ca_20fm_line", "ca_smca_southern", "cca_western"
  readonly jurisdiction_id: string;
  readonly kind: "management_area" | "depth_line" | "closed_area" | "mpa" | "water_body";
  readonly display_name: string;
  readonly geometry_source_url: string | null;   // GeoJSON/shapefile/KML — research §7
  readonly geometry_format: "geojson" | "shapefile" | "kml" | "waypoint_list" | null;
  readonly defining_citation: string | null;     // "CCR T14 §35.00" / "50 CFR §660.70"
  readonly nominal_label: string | null;         // "20 fathoms (~120 ft)" — LABEL ONLY
  readonly is_legal_boundary: boolean;           // see below
  readonly geometry_status: "loaded" | "reference_only" | "unavailable";
}

type SpatialRelation =
  | "inside" | "outside"
  | "shoreward_of" | "seaward_of"
  | "north_of" | "south_of";

interface AreaConstraint {
  readonly boundary_id: string;
  readonly relation: SpatialRelation;
}
```

`RegulationRule.area_constraints: readonly AreaConstraint[]` — all must hold (AND).

Three deliberate properties:

1. **`nominal_label` can never be parsed.** It is a string for humans. If code ever reads
   `"20 fathoms"` and converts it to `36.576 m` to compare against a sounder reading, that
   is the bug this field's name is trying to prevent. If a genuine depth-in-metres rule
   exists elsewhere in the world (some jurisdictions do write true depth rules), it gets its
   own `depth_m` field on the constraint — but California's fathom lines do not use it.

2. **`is_legal_boundary`** exists because CDFW ships its MPA dataset with the disclaimer
   *"not intended for navigational use or defining legal boundaries"* (research §7). When
   this is `false`, the UI must not render an in/out verdict — only "near" or "approximate".
   Escalated to `counsel` before any map ships.

3. **`geometry_status: "reference_only"`** is the honest state for every boundary today: we
   know the boundary exists and where it is published, and we have zero vertices. A rule
   whose `area_constraints` reference a `reference_only` boundary **cannot be evaluated for
   a given position**, and the resolver must return `unknown` rather than ignoring the
   constraint. Ignoring a spatial constraint you cannot evaluate is how an app tells someone
   they can fish inside a reserve.

---

## 8. Seasons and time

### 8.1 The controlling clock is the jurisdiction's, not the phone's and not the angler's

The app's general rule (house policy) is that a catch timestamp displays in the **catch
location's** local time. Regulations are the one place that rule does not apply, because a
season boundary is a legal fact fixed to the **regulator's** civil calendar. "November 1"
in a CDFW regulation means midnight Pacific time, and it means that for an angler whose
phone is on UTC, for a visitor from Arizona in July, and for a boat that has crossed a
timezone. Those happen to coincide in California; they will not in Western Australia or
Alaska, and the model must not accidentally depend on the coincidence.

### 8.2 Store the civil date plus the zone; derive the instant

```ts
interface EffectiveWindow {
  readonly from_civil_date: string;        // "2026-11-01"  (ISO calendar date, no zone)
  readonly until_civil_date: string | null;// "2026-11-30", null = open-ended
  readonly zone: string;                   // IANA, e.g. "America/Los_Angeles"
  readonly from_instant: Instant;          // derived: local midnight at start of from_civil_date
  readonly until_instant: Instant | null;  // derived: local midnight at END of until_civil_date
  readonly boundary_convention: "inclusive_end_of_day";
}
```

Civil date + zone is the **stored truth**; the two `Instant`s are a derived cache, and
`core/` computes with the instants per ADR 006 §3. This ordering matters for three reasons:

- A regulation says "November 1", not "1762070400000". Storing only the instant loses the
  legal text.
- IANA zone rules change. A stored instant silently becomes the wrong wall-clock moment;
  a civil date plus a zone can be recomputed.
- **DST.** A season that ends on a fall-back date has a 25-hour last day. Computing
  `until_instant` as `from + n*86400000` gets the last hour wrong. It must be computed as
  *local midnight at the end of the final civil day*, which is what
  `boundary_convention: "inclusive_end_of_day"` records. `2026-11-30` means the season is
  open through 23:59:59 local on the 30th, not up to 00:00 on the 30th.

### 8.3 Recurring annual seasons

Many seasons recur annually with the year unstated ("open May 1 through September 30").
Those are stored as `season_windows` with a year-less form and materialized per year:

```ts
interface SeasonWindow {
  readonly opens: { readonly month: number; readonly day: number };
  readonly closes: { readonly month: number; readonly day: number };
  readonly wraps_year_end: boolean;   // true for e.g. Dec 1 -> Feb 28
  readonly zone: string;
}
```

`wraps_year_end` is explicit rather than inferred from `closes < opens`, because inference
silently produces a zero-length season for a same-day window and nobody notices until
someone is told the fishery is shut.

### 8.4 Season status

```ts
type SeasonStatus = "open" | "closed" | "unknown" | "not_applicable";
```

`unknown` is a real answer and — per research §4.3 — is currently the correct answer for
every Southern California groundfish species. The app says "we don't know whether this is
open today". It does not default to open, and it does not default to closed either:
defaulting to closed sounds safe but trains anglers to disbelieve the app, which then gets
disbelieved on the day it is right.

---

## 9. Precedence — when two rules disagree

An emergency regulation overrides the annual booklet. A federal rule and a state rule can
both apply. Two records will conflict, and the resolver must not just pick one.

```ts
type AuthorityLevel = "international" | "federal" | "state" | "local" | "advisory";

interface Precedence {
  readonly authority_level: AuthorityLevel;
  readonly instrument_kind: "statute" | "annual_regulation" | "emergency_regulation"
                          | "in_season_action" | "guidance";
  readonly supersedes: readonly string[];   // rule_ids this record explicitly replaces
}
```

Resolution order:

1. An explicit `supersedes` link wins. Always.
2. Otherwise `instrument_kind`: `in_season_action` > `emergency_regulation` >
   `annual_regulation` > `statute` > `guidance`. (In-season action is *last published*, and
   in this domain the most recent instrument is the operative one.)
3. Otherwise the later `effective_from` wins.
4. **If still tied: return both, marked `disputed`, and show the angler both with their
   sources.**

Step 4 is not a cop-out and it is deliberately *not* "most restrictive wins". Auto-picking
the stricter rule feels safe and is quietly dishonest: it invents a legal position no
regulator took, and it hides from us that our data is broken. Two conflicting official
sources is information the angler should have — it is the moment to phone CDFW, and the
app should say so.

---

## 10. Fishing mode

```ts
type FishingMode = "boat" | "shore" | "pier" | "diving" | "any";
```

Not cosmetic. Research §5.1 found California sheephead **closed to boat-based anglers in
January and February south of Point Conception, while divers and shore anglers may fish
year-round** — one species, one area, one date, three different answers by mode.

Rules:
- `"any"` means the rule genuinely applies to all modes, and is an assertion, not a default.
- A rule whose mode-dependence is **unresearched** does not get `"any"`. It gets a record
  per known mode with `unknown` quantities, so the app says "we don't know if this differs
  for shore anglers" rather than silently applying the boat rule to a diver.
- `"pier"` is separate from `"shore"` because several jurisdictions (California included)
  write public-pier-specific exemptions.

Spearfishing sits under `"diving"`. If a jurisdiction distinguishes them, it becomes a
sixth member — an open enum, same argument as `LengthBasis`.

---

## 11. The full `RegulationRule` record

The founder's field list, plus what the research showed was genuinely missing. Additions
are marked **(+)**.

```ts
interface RegulationRule {
  // identity
  readonly rule_id: string;                       // (+) stable id, for supersedes links
  readonly dataset_version: string;               // e.g. "ca-socal-2026.09.01"

  // what law, where
  readonly jurisdiction: string;                  // "US-CA"
  readonly management_area: string | null;        // boundary_id of the area, or null = whole jurisdiction
  readonly water_class: "salt" | "fresh" | "any"; // (+) mirrors the ontology; freshwater story
  readonly area_constraints: readonly AreaConstraint[];  // (+) depth lines, closed areas — §7

  // what fish
  readonly species_scope: SpeciesScope;           // replaces bare species_id — §4.4
  readonly limit_scope: LimitScope;               // (+) how it relates to an aggregate — §4.2

  // what kind of rule
  readonly regulation_type: RegulationType;       // §11.1
  readonly fishing_mode: FishingMode;

  // when
  readonly effective_from: EffectiveWindow;       // §8.2
  readonly effective_until: EffectiveWindow | null;
  readonly season_windows: readonly SeasonWindow[];  // (+) recurring annual — §8.3
  readonly season_status: SeasonStatus;

  // the numbers
  readonly bag_limit: Quantity;
  readonly possession_limit: Quantity;
  readonly minimum_size: SizeLimit | null;
  readonly maximum_size: SizeLimit | null;
  readonly weight_limit: Quantity | null;         // (+) grams; some jurisdictions use weight

  // the rest
  readonly special_conditions: readonly SpecialCondition[];  // (+) structured, not free text
  readonly plain_language: string;                // (+) one sentence a non-expert can read
  readonly precedence: Precedence;                // (+) §9
  readonly provenance: Provenance;                // §6 — covers source_agency, source_reference,
                                                  //   source_url, source_updated_at, verified_at
}
```

### 11.1 `regulation_type`

```ts
type RegulationType =
  | "bag_and_size"        // the common case: limits on take
  | "season"              // a pure open/closed window
  | "prohibition"         // zero retention / protected species
  | "area_closure"        // MPA, conservation area, GEA
  | "gear_restriction"
  | "permit_requirement"
  | "reporting_requirement";
```

A record carries *all* constraint fields and `regulation_type` names its **dominant**
character — it is a classification for filtering and UI grouping, not a discriminated union
that gates which fields exist. That is a deliberate trade: making it a true union would mean
splitting the bag limit and the size limit of a single published table row into two records
that must then be re-joined, and every join is a chance to show one without the other.

### 11.2 `special_conditions`

Free text here would become a dumping ground that no code can act on and no UI can render
consistently. It is structured, with an escape hatch:

```ts
interface SpecialCondition {
  readonly code: string;        // "fillet_length_required", "descending_device_required",
                                // "barbless_hooks", "report_card_required", "permit_required"
  readonly detail: string;      // human-readable specifics
  readonly published_text: string | null;   // verbatim, if captured
}
```

Known codes get UI affordances; unknown codes render as their `detail` string. New
jurisdictions add codes without a schema change.

### 11.3 What is **not** on this record, on purpose

- **No `is_open_today` / `can_i_keep_it` boolean.** Those are computed by a resolver from
  the rules that apply, and caching a verdict on a record is how a stale "yes" survives a
  regulation change.
- **No species-level `takeStatus`.** The ontology has one (research §10). It is an editorial
  hint for sorting and badge colour and must never be wired to a retention verdict — it has
  no jurisdiction, no date, no mode and no area.

---

## 12. Worked example — vermilion rockfish, boat, Southern Management Area, 2026-09-01

**This is what the record set looks like today, honestly.** It is mostly `unknown`, because
no official source was reachable (research §0). That is the point of the example: the model
has to be able to express our actual state of knowledge, and this is our actual state of
knowledge.

> **Blocking dependency:** `vermilion_rockfish` **does not exist** in
> `src/core/ontology/species.ts` — the ontology has only the group `rockfish`
> (research §5.3). The id below is written as **PROPOSED**. These records cannot be
> created until `architect`/`head-dev` extend the species vocabulary and its seed
> migration, since ADR 001 gives that vocabulary a single source of truth.

### 12.1 Jurisdiction and boundaries

```json
{
  "jurisdiction_id": "US-CA",
  "display_name": "California (ocean sport fishing)",
  "agency": "California Department of Fish and Wildlife",
  "zone": "America/Los_Angeles",
  "citation_scheme": "CCR Title 14"
}
```

```json
[
  {
    "boundary_id": "ca_gf_southern_management_area",
    "jurisdiction_id": "US-CA",
    "kind": "management_area",
    "display_name": "Southern Groundfish Management Area",
    "geometry_source_url": null,
    "geometry_format": null,
    "defining_citation": null,
    "nominal_label": "34°27' N (Point Conception) to the US/Mexico border",
    "is_legal_boundary": true,
    "geometry_status": "reference_only"
  },
  {
    "boundary_id": "ca_20fm_line",
    "jurisdiction_id": "US-CA",
    "kind": "depth_line",
    "display_name": "20-fathom boundary line",
    "geometry_source_url": null,
    "geometry_format": "waypoint_list",
    "defining_citation": "CCR T14 §35.00",
    "nominal_label": "20 fathoms (~120 ft)",
    "is_legal_boundary": true,
    "geometry_status": "reference_only"
  }
]
```

Both are `reference_only`: we know they exist and what defines them, and we hold **zero
vertices**. Any rule constrained by them therefore resolves to `unknown` for a given
position — see §7.3.

### 12.2 The RCG complex group

```json
{
  "group_id": "ca_rcg_complex",
  "jurisdiction_id": "US-CA",
  "display_name": "Rockfish, Cabezon and Greenling (RCG) complex",
  "aggregate_bag": { "state": "unknown", "unknown_reason": "source_unreachable" },
  "aggregate_possession": { "state": "unknown", "unknown_reason": "not_yet_researched" },
  "plain_language": "These species share one daily limit between them. We have not been able to confirm what that limit is."
}
```

The candidate value is 10 (research §4.1, Tier B). It is **not** written into
`aggregate_bag`, because a Tier-B number in the field that the UI renders as a bag limit is
the exact failure this whole design is built to prevent. It lives in
`provenance.verification_note` on the rules, where a verifier will find it.

### 12.3 The vermilion/sunset grouping

```json
{
  "group_id": "ca_rcg_vermilion_sunset",
  "species_ids": ["vermilion_rockfish", "sunset_rockfish"],
  "member_kind": "counts_toward"
}
```

Both ids are **PROPOSED** and absent from the ontology. The pairing exists because the
reported sub-limit is "2 fish **combined**" across two species that were recently split and
that an angler cannot reliably tell apart on the deck.

### 12.4 The rule

```json
{
  "rule_id": "us-ca_socal_rcg_vermilion-sunset_boat_2026",
  "dataset_version": "ca-socal-2026.09.01",

  "jurisdiction": "US-CA",
  "management_area": "ca_gf_southern_management_area",
  "water_class": "salt",
  "area_constraints": [
    { "boundary_id": "ca_20fm_line", "relation": "shoreward_of" }
  ],

  "species_scope": { "kind": "set", "grouping_id": "ca_rcg_vermilion_sunset" },
  "limit_scope": { "kind": "sub_limit", "group_id": "ca_rcg_complex" },

  "regulation_type": "bag_and_size",
  "fishing_mode": "boat",

  "effective_from": {
    "from_civil_date": "2026-01-01",
    "until_civil_date": null,
    "zone": "America/Los_Angeles",
    "from_instant": 1767254400000,
    "until_instant": null,
    "boundary_convention": "inclusive_end_of_day"
  },
  "effective_until": null,
  "season_windows": [],
  "season_status": "unknown",

  "bag_limit":        { "state": "unknown", "unknown_reason": "source_unreachable" },
  "possession_limit": { "state": "unknown", "unknown_reason": "not_yet_researched" },
  "minimum_size": null,
  "maximum_size": null,
  "weight_limit": null,

  "special_conditions": [
    {
      "code": "descending_device_required",
      "detail": "California requires a descending device to be carried and used when releasing rockfish. NOT VERIFIED — carried as a candidate condition only.",
      "published_text": null
    }
  ],

  "plain_language": "Vermilion and sunset rockfish share one sub-limit inside California's combined rockfish/cabezon/greenling daily limit. We have not been able to confirm the current numbers or whether the season is open today. Check CDFW before you fish.",

  "precedence": {
    "authority_level": "state",
    "instrument_kind": "annual_regulation",
    "supersedes": []
  },

  "provenance": {
    "source_agency": "California Department of Fish and Wildlife",
    "source_reference": "CCR T14 §27.20 / §28.55 (section numbers unconfirmed)",
    "source_url": "https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=185058",
    "source_quote": null,
    "source_updated_at": null,
    "retrieved_at": null,
    "verified_at": null,
    "verified_by": null,
    "verification_status": "unverified",
    "verification_note": "Candidate values from search-engine summaries only, never read from source: RCG aggregate 10/day; vermilion+sunset sub-limit 2 combined. Every official domain (wildlife.ca.gov, nrm.dfg.ca.gov, ecfr.gov, data.ca.gov) returns HTTP 403 at the egress proxy, so no primary text was read. Season window and depth constraint are contradictory across sources — see docs/specs/regulations-socal-research.md §4.3. Do not display as a limit."
  }
}
```

### 12.5 What the app renders from this

Not a bag limit. A card that says, roughly — and `ux-ui` owns the final wording:

> **Vermilion rockfish** — *we can't tell you the limit yet.*
> This fish shares a combined daily limit with cabezon, greenling and other rockfish, and
> has its own sub-limit within it. We haven't been able to confirm the current numbers.
> We also don't know whether the season is open today.
> **Check CDFW before you keep this fish.** → [CDFW ocean sport fishing regulations]

That card is a correct, useful, and honest product. A card reading "Daily limit: 2" would
be none of those things, because we do not know that it is 2.

### 12.6 A companion record, to show the contrast

Once verification confirms it, cowcod's rule differs in exactly one field, and that field
changes the entire UI treatment:

```json
{
  "species_scope": { "kind": "species", "species_id": "cowcod" },
  "limit_scope": { "kind": "sub_limit", "group_id": "ca_rcg_complex" },
  "regulation_type": "prohibition",
  "bag_limit": { "state": "zero_retention" },
  "plain_language": "You may not keep cowcod. Release it."
}
```

`{ "state": "zero_retention" }` versus `{ "state": "unknown" }` versus
`{ "state": "count", "count": 0 }` — the first is a red stop, the second is a grey
"go look it up", and the third **must never be written**. §5 exists so that it cannot be.

---

## 13. What this model does not solve

Said plainly, so nobody discovers it later:

- **It does not make the data correct.** It makes the data's *state of knowledge*
  expressible. Populating it correctly needs network access to official sources, which this
  session did not have.
- **It does not do spatial evaluation.** Deciding "is this catch inside the Southern
  Management Area" needs loaded geometry and a point-in-polygon test the architect owns.
  Today every boundary is `reference_only`, so the answer is `unknown`.
- **It does not auto-update.** Research §8 found no regulations API anywhere in California —
  everything is PDF and HTML. Any pipeline should be *"detect a change, alert a human"*, not
  *"parse a PDF, ship a bag limit"*. Auto-parsing legal limits out of PDFs and pushing them
  to anglers is a liability the product should decline.
- **It does not replace reading the regulations.** Every screen built on this needs a
  "check CDFW before you fish" link and a visible `verified_at` date. That is not a
  disclaimer for lawyers; it is the accurate description of what the app knows.
