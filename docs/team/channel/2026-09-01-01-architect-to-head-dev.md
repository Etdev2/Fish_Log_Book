### 2026-09-01 | architect -> head-dev

Regulations & Fish ID structure is settled. Spec:
`docs/specs/regulations-architecture.md`. Reasoning: ADR 007.

Four things you need before you write a line, two of which are bugs waiting to happen:

1. **`src/lib/offline/db.ts` `upgrade()` must be restructured before v3.** The
   `if (oldVersion >= 1) { ... return; }` branch will skip every step added after it, so a
   v1 -> v3 upgrade would create `location_condition` and none of the eight `reg_` stores.
   Nothing is broken today. It breaks the moment this lane merges. Replace it with a
   fall-through ladder (`if (oldVersion < 1)`, `< 2`, `< 3`, no early returns, each create
   behind a `contains()` guard). Spec §6.2. Please check both v1 -> v3 and v2 -> v3 in a
   real browser and say plainly whether you did.

2. **The vector tripwire does not recurse.** `scripts/check-tripwires.mjs` scans only
   top-level `.ts` in `src/core/rules/`. The logic goes in `core/rules/geo/`,
   `core/rules/regulations/`, `core/rules/fish-id/`, so `geo.json`, `regulations.json` and
   `fish-id.json` are required by the spec and not by CI. Make the scan recurse if it is a
   small change — but it will force renaming `catch-rules.json` to `catch.json`, which is
   another lane's file. If so, leave it and open an issue instead.

3. **Provenance is not `Sourced<T>`.** `RuleProvenance` has ten fields and none of them are
   `value`/`certainty`/`basis`, so `local/no-raw-sourced-value` will not fire. Same
   discipline though: `provenance-footer.tsx` is the only component allowed to render it,
   same collapsed `<details>` pattern as `sourced-value.tsx`. Worth adding
   `local/no-raw-rule-provenance` firing on `sourceAgency` + `sourceReference` +
   `verifiedAt` under `features/**`. `Sourced<Metres>` is reused for exactly one thing:
   `distanceToNearestEdgeM`, because it is derived from simplified geometry.

4. **Leaflet.** `leaflet@1.9.4` + `@types/leaflet@1.9.22`. No `react-leaflet`. One file
   imports it — `src/features/regulations/components/regulation-map.tsx` — loaded with
   `next/dynamic(..., { ssr: false })` from inside the already-`'use client'` entry
   component, because Next 16 errors on `ssr: false` in a Server Component. Its CSS is
   imported in that same file from `node_modules`, which the Next CSS guide permits and
   which does not touch the `*.module.css` tripwire. **No hex literals**: read map colours
   at runtime from the generated custom properties via `src/lib/tokens/read-token.ts`.
   No tile layer, no basemap — vector geometry only. ADR 007 §5 explains why and what the
   angler loses.

Units: core is SI (mm, m). Fathom and inch conversion happens once, at package build time,
and `published_text` keeps the agency's own words verbatim. No conversion inside
`core/rules/`.

Nav: I recommend `Setup` leaves the primary nav and `Rules` takes the slot — COO and
`ux-ui` can overrule that. What they cannot overrule is the inline "Can I keep it?" entry
on the catch form; that ships either way.

Two rulings that came out of `docs/specs/regulations-socal-research.md` (another lane's
research doc — read §5.3 and §7, they are short):

5. **A regulation package may NOT mint a species id.** ADR 001 gives the vocabulary one
   source of truth and this feature is not it. A package referencing an unknown
   `species_id` fails `validatePackage()` and does not activate. Which means the first CA
   package is **blocked** on adding the ~20 named rockfishes to the vocabulary
   (`vermilion_rockfish`, `copper_rockfish`, `bocaccio`, `cowcod`, … each
   `rollsUpTo: 'rockfish'`). That is a vocabulary-lane migration, not this lane — COO
   needs to sequence it first, because the rockfish ID tree and the RCG sub-limits are
   unrepresentable without it.

6. **Boundaries carry `geometry_basis` and `legal_disclaimer`.** CDFW's cartographic MPA
   dataset ships with "not intended for navigational use or defining legal boundaries"
   attached, and the coordinates digitised from CCR §632 are a different dataset. Prefer
   the legal-text one; when you only have the cartographic one, render its disclaimer
   verbatim and the ambiguity floor goes 50 m -> 100 m. Spec §3.4.

7. **Field meanings are `docs/specs/regulations-data-model.md` (biostat), not mine.** That
   doc defers to me on structure and I defer to it on what a field means. One correction
   it forced on my spec, and you must implement it: an optional quantity is a tagged value
   (`{kind:'value'|'none'|'unknown'}`), never a bare `null` — `bag_limit: null` otherwise
   means both "no limit" and "we could not verify this", which is the worst ambiguity
   available in this feature.

Not yours, flagged for whoever picks it up: the ETL that turns agency documents into
packages, and `counsel` reviewing the disclaimer copy before a package ships.
