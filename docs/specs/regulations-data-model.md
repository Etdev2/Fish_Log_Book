# Regulations — Data Model

**Status:** proposed; lands with the SoCal starter dataset migration this session
(`20260901230000_v1_regulations_socal_starter.sql`).
**Companion:** `regulations-architecture.md` (the why); ontology.md (vocabulary).
**Date:** 2026-09-01.

---

## 1. Tables

### `reg_area` — the agency's geography, verbatim

| column | type | notes |
|---|---|---|
| `id` | text pk | stable slug from the agency's own name: `ca-ocean-southern`, `ca-gma-southern` |
| `authority` | text | `cdfw` (extensible: `noaa`, `cdf`, …) |
| `kind` | text | `ocean_region` \| `groundfish_management_area` \| `conservation_area` … |
| `name` | text | "Point Conception to the U.S.–Mexico border" |
| `parent_id` | text fk → reg_area | GMAs sit inside ocean regions; MPAs inside GMAs |
| `boundary_geojson` | jsonb | simplified polygon(s), single-precision WGS84; null until mapped |
| `source_url` | text not null | where the boundary is published |
| `verified_at` | date not null | human/agent read date |
| `notes` | text | e.g. CCR T14 §27.45(a) citation |

No lat/lon columns on catches point here; `reg_area` is *resolved against* catch GPS at
read time (architecture §3). Geography is interpretation, never a catch column (ADR 007).

### `reg_group` — complexes the law speaks in

| column | type | notes |
|---|---|---|
| `id` | text pk | `rcg-complex`, `paralabrax-bass` |
| `name` | text | "Rockfish, Cabezon, and Greenlings complex" |
| `member_species_ids` | text[] | existing vocabulary ids |
| `source_url`, `verified_at` | provenance | same contract as rules |

### `reg_rule` — one enforceable statement

One row = one statement of law about one species (or group) in one area. Composition
(combined bags, split seasons) is *rows that cite each other*, not nested JSON.

| column | type | notes |
|---|---|---|
| `id` | uuid pk default gen_random_uuid() | pack diffs match on (species, area, kind) |
| `species_id` | text fk → species vocabulary | null when the rule names a group |
| `reg_group_id` | text fk → reg_group | null when species-scoped |
| `reg_area_id` | text fk → reg_area | not null — a rule without a place is folklore |
| `water_class` | text check salt\|fresh | denormalised like condition_snapshot: "no rule because lake" vs "no rule because not fetched" stay distinguishable |
| `kind` | text not null | `season` \| `bag_limit` \| `possession_limit` \| `min_size` \| `max_size` \| `gear` \| `prohibited` \| `note` |
| `season_start` / `season_end` | date | null = year-round; in-season-changing fisheries also set `check_inseason` |
| `bag_daily` / `possession_limit` | integer | null = no limit stated |
| `bag_shares_with_group` | boolean | "5 in any combination [of the Paralabrax basses]" |
| `min_size_in` / `max_size_in` | numeric(5,2) | inches because the source says inches; the app converts for display like catches do |
| `size_measure` | text | `total_length` \| `fork_length` \| `alternate_total_length` — CDFW measures both ways; a number without its measure is not a rule |
| `platform_scope` | text | null = all; `boat` / `shore` / `diver` where the law splits them (sheephead; groundfish exemptions) |
| `depth_note` | text | "50 fathom inshore only" style textarea where a contour is the rule |
| `verbatim` | text not null | the agency's own sentence(s). When typed fields and this disagree for a reader, this wins |
| `check_inseason` | boolean not null default false | flips UI to "verify before you cast" copy + in-season link |
| `source_url`, `source_title` | text not null | provenance |
| `source_updated_at` | date | the agency's own "updated" stamp, when shown |
| `verified_at` | date not null | date a human/agent last read the source |
| `stale_after_days` | integer not null default 60 | 30 when `check_inseason` |
| `pack_version` | integer not null | which pack generation this row last changed in |

`deleted_at` rides along (ADR 004 soft-delete) so removals sync instead of lingering.

### What deliberately is NOT stored

- Fines/penalties, licence pricing, "is this catch legal" verdicts (architecture §1).
- Photos/texts of fish for identification (gated behind Fish ID architecture).
- MPA polygons in v1 (linked out; see architecture §3).

## 2. Query shape the UI needs (and only this)

```
rulesFor(speciesId, areaId, atDate)
  → rows joined area + group + species, ordered season → bag → size → gear → note
areaForPoint(lat, lng)      → point-in-polygon over reg_area.boundary_geojson (on device)
stalenessOf(rule, today)    → today > verified_at + stale_after_days
```

No search, no analytics, no catch-join in v1.

## 3. Starter dataset contract

Every seed row MUST have: `verbatim` copied from the source; `source_url` on
`wildlife.ca.gov` (or CFR); `verified_at = 2026-09-01`; the source's own updated stamp
where visible. Anything short of that contract stays out — the species then shows
"No verified data", which is a correct answer.
