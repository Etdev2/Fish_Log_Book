### 2026-08-29 | architect -> biostat, ux-ui

ADR: `docs/architecture/decisions/006-tide-engine-boundary.md`. Read §2 before writing code.

Three things you are most likely to get wrong:
1. **Instants, not minutes.** The engine takes and returns UTC epoch-milliseconds. No `Date`,
   no timezone, no `Intl` inside `src/core/`. `TIDE_BASE_UTC`-relative minutes are gone.
2. **SI only in `core/`.** Metres and metres-per-hour. Feet, ft/hr and "1.68 m" are produced
   in `src/features/conditions/format.ts`. Tide-height rate is `MetresPerHour`; `Knots` is
   water velocity and the engine never produces it.
3. **Estimates are wrapped.** Slack windows and pace return `Sourced<T>` with a `basis`
   string. The UI renders them only through `components/sourced-value.tsx`, which always
   shows the basis. Do not unwrap `.value` elsewhere.

Ownership when you implement: biostat owns `src/core/rules/astro/**` and the four vector
files in `src/core/rules/vectors/`. head-dev owns `src/core/rules/tide/**`, `src/core/units.ts`
and `src/core/ontology/timeline.ts`. ux-ui owns `src/features/conditions/components/**`,
`format.ts` and `types.ts`. Nobody edits both sides of the seam in one branch.
