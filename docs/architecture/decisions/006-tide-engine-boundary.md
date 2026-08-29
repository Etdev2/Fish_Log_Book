# 006 — Tide engine boundary: a pure SI engine in `core/`, a dumb chart in `features/`

**Date:** 2026-08-29 · **Status:** accepted
**Depends on:** `003-web-prototype-boundary.md` (§2 folder law, §3 written-once, §4 vectors),
`005-front-end-architecture.md` (§3 directories, §5 client boundary, §6 state)
**Related:** `002-current-direction-storage.md` · **Scope:** the module boundary only.

## Context

`src/features/conditions/tide-chart.tsx` is one 290-line client component holding the whole
stack: interpolation, rule-of-twelfths, a rate of `heightAt(t+30) - heightAt(t-30)`, a slack
test of `Math.abs(rate) < 50`, Catmull-Rom path building, and every `Intl` formatter. The
founder now wants sun shading, moon phase, slack countdowns, rate of change, a pace
classification, a live time marker, later catch markers — then all of it feeding a score.

Each is a reason to grow that file. None is a reason to put maths in a React component. ADR
003 §3 already classified cross-client maths as **written once** in `core/rules/`, policed by
vectors. The tide engine is that. The chart is view layer, duplicable in SwiftUI.

## 1. The layering seam, as file paths

```
src/core/units.ts                    branded scalars. No domain, no I/O.
src/core/ontology/timeline.ts        TimeAnchoredMarker — the overlay type (§6)
src/core/rules/tide/
  source.ts     INPUT contract: TideStation, TidePredictionSample, TidePredictionSeries
  height.ts     heightAt, rateAt, dailyRange
  turns.ts      turnsIn, nextTurnAfter, previousTurnBefore, nextSlackAfter
  state.ts      readTideAt — assembles the TideReading the UI consumes
  pace.ts       paceAt — percentile-banded "fast for this station and cycle" (§2a)
  index.ts      the only import path anything outside this folder may use
src/core/rules/astro/index.ts        sunEventsFor, daylightSpans, moonPhaseAt (biostat)
src/core/rules/conditions/           RESERVED. The scoring seam. Empty this round.
src/core/rules/vectors/              tide-state.json, tide-pace.json, slack-estimate.json,
                                     daylight-spans.json
src/features/conditions/
  queries/tide-series.ts             loads a TidePredictionSeries. Fixture now, store later.
  fixtures/newport-9410580.ts        today's tide-fixture.ts, moved. Wire units (mm) end here.
  format.ts                          Instant + SI -> localized strings. Every Intl call.
  types.ts                           view-only types
  components/tide-chart.tsx          'use client' entry. SVG only. No tide maths.
  components/tide-chart-geometry.ts  scales + Catmull-Rom. View layer, duplicable.
  components/sourced-value.tsx       the only reader of Sourced<T>.value (§5)
  components/tide-status-cells.tsx, tide-table.tsx
src/lib/time/use-now.ts              the ONLY place the wall clock is read
```

Data flows one way: `queries/` → engine → `format.ts` → components. Nothing skips left.

## 2. The engine's public surface

```ts
// src/core/units.ts
declare const brand: unique symbol;
type Unit<T extends string> = number & { readonly [brand]: T };
export type Instant = Unit<"epoch-ms">;   // UTC. The only time representation in core.
export type Millis = Unit<"ms">;
export type Metres = Unit<"m">;
export type MetresPerHour = Unit<"m/h">;  // rate of tide HEIGHT change
export type Knots = Unit<"kn">;           // speed of WATER. See §4.
export type Degrees = Unit<"deg">;

export type Certainty = "published" | "interpolated" | "estimated";
export interface Sourced<T> {
  readonly value: T;
  readonly certainty: Certainty;
  /** Phrase the UI must render beside the value, e.g. "estimated from height predictions". */
  readonly basis: string;
}

// src/core/rules/tide/source.ts — the input a live NOAA fetch must satisfy unchanged
export interface TideStation {
  readonly id: string; readonly name: string;
  readonly timeZone: string;                     // IANA. Presentation metadata only (§3).
  readonly datum: "MLLW" | "MSL" | "NAVD88";
}
export interface TidePredictionSample {
  readonly at: Instant;
  readonly height: Metres;                       // above station.datum
  readonly turn: "high" | "low" | null;
}
export interface TidePredictionSeries {
  readonly station: TideStation;
  readonly samples: readonly TidePredictionSample[];   // ascending, non-empty, validated
  readonly provider: "noaa-coops" | "fixture";
  readonly retrievedAt: Instant | null;          // null = provenance unrecorded
}
export function tideSeries(input: {
  station: TideStation;
  samples: readonly TidePredictionSample[];
  provider: TidePredictionSeries["provider"];
  retrievedAt?: Instant | null;
}): TidePredictionSeries;                        // throws on empty or unsorted input

// src/core/rules/tide/index.ts — the output the UI consumes
export type TideMotion = "rising" | "falling" | "near-slack" | "slack";
export interface TideTurn { readonly at: Instant; readonly kind: "high" | "low"; readonly height: Metres }
export interface SlackWindow {
  readonly centre: Instant; readonly from: Instant; readonly to: Instant;
  readonly turn: "high" | "low";
}
export type PaceClass = "very-slow" | "slow" | "normal" | "fast" | "very-fast";
export interface PaceBaseline {
  readonly source: "series";                     // the LOADED window, not station climatology
  readonly sampleInterval: Millis;               // fixed step the distribution was sampled at
  readonly sampleCount: number;
  readonly medianPeakRate: MetresPerHour;
}
export interface TidePace {
  readonly class: PaceClass;                     // derived from `percentile`, never from `ratio`
  readonly percentile: number;                   // 0..1. |rate| against the sampled distribution.
  readonly ratio: number;                        // |rate| / baseline.medianPeakRate. Display only.
  readonly baseline: PaceBaseline;
}
/** Upper percentile bound of each band. Tuning these is a vector change, not a type change. */
export const PACE_BANDS: readonly { readonly upTo: number; readonly class: PaceClass }[] = [
  { upTo: 0.10, class: "very-slow" }, { upTo: 0.30, class: "slow" },
  { upTo: 0.70, class: "normal" },    { upTo: 0.90, class: "fast" },
  { upTo: 1.00, class: "very-fast" },
];
export interface TideReading {
  readonly at: Instant;
  readonly height: Sourced<Metres>;
  readonly rate: Sourced<MetresPerHour>;         // signed: + rising, - falling
  readonly motion: TideMotion;
  readonly previousTurn: TideTurn | null;
  readonly nextTurn: TideTurn | null;
  readonly cycleProgress: number | null;         // 0..1 through the current flood/ebb leg
  readonly ruleOfTwelfthsHour: 1 | 2 | 3 | 4 | 5 | 6 | null;
  readonly twelfths: 1 | 2 | 3 | null;
  readonly pace: Sourced<TidePace>;
}
export interface TideReadOptions {
  readonly rateWindow?: Millis;                  // default RATE_WINDOW = 60 min, centred
  readonly slackBelow?: MetresPerHour;           // default SLACK_BELOW = 0.05
  readonly nearSlackBelow?: MetresPerHour;       // default NEAR_SLACK_BELOW = 0.15
}
export function heightAt(s: TidePredictionSeries, at: Instant): Sourced<Metres> | null;
export function rateAt(s: TidePredictionSeries, at: Instant, w?: Millis): Sourced<MetresPerHour> | null;
export function turnsIn(s: TidePredictionSeries, from: Instant, to: Instant): readonly TideTurn[];
export function nextTurnAfter(s: TidePredictionSeries, at: Instant): TideTurn | null;
export function previousTurnBefore(s: TidePredictionSeries, at: Instant): TideTurn | null;
export function nextSlackAfter(s: TidePredictionSeries, at: Instant, o?: TideReadOptions): Sourced<SlackWindow> | null;
export function dailyRange(s: TidePredictionSeries, from: Instant, to: Instant): Sourced<Metres> | null;
export function readTideAt(s: TidePredictionSeries, at: Instant, o?: TideReadOptions): TideReading | null;

// src/core/rules/astro/index.ts — SHAPE only. biostat owns the algorithms.
export interface GeoPoint { readonly latitude: Degrees; readonly longitude: Degrees }
export type DaylightPhase = "night" | "civil-twilight" | "day";
export interface DaylightSpan { readonly from: Instant; readonly to: Instant; readonly phase: DaylightPhase }
export interface SunEvents {
  readonly sunrise: Instant | null; readonly sunset: Instant | null;
  readonly civilDawn: Instant | null; readonly civilDusk: Instant | null;
  readonly solarNoon: Instant;
}
export interface MoonPhase {
  readonly illumination: number;                 // 0..1
  readonly ageDays: number;                      // 0..29.53
  readonly name: "new" | "waxing-crescent" | "first-quarter" | "waxing-gibbous"
              | "full" | "waning-gibbous" | "last-quarter" | "waning-crescent";
}
export function sunEventsFor(at: Instant, where: GeoPoint): SunEvents;
export function daylightSpans(from: Instant, to: Instant, where: GeoPoint): readonly DaylightSpan[];
export function moonPhaseAt(at: Instant): MoonPhase;
```

`daylightSpans` returns contiguous, sorted, gap-free spans covering `[from, to]`. The chart
shades by iterating them and never computes a day boundary itself.

## 2a. Pace is classified by percentile, not by ratio

Five bands: `very-slow | slow | normal | fast | very-fast`, and the middle one is **normal**.

**Classify on `percentile`, never on `ratio`.** `|rate|` over a tidal cycle is near-sinusoidal
— zero at each turn, peak mid-leg, mean about 0.64 of peak. Five bands cut around a ratio of
1.0 would therefore file most of the day as slow and almost nothing as fast, which is both
useless and quietly wrong. Percentile against the actual sampled distribution puts the band
boundaries where the data is. `ratio` stays on the type because "0.8× the usual peak" is a
sentence an angler can read; it is a display number and nothing branches on it.

The distribution is `|rate|` sampled at a **fixed interval** across the loaded series —
fixed, so the result is reproducible and vector-testable rather than a function of how NOAA
happened to space its samples. `baseline.sampleInterval` and `sampleCount` are on the type so
the number can be audited later.

**The honesty constraint holds.** The baseline is the loaded window, not station climatology:
`baseline.source` is `"series"`, and on a three-day fixture "very-fast" means fast *for these
three days*. That is why `pace` is `Sourced<TidePace>` with certainty `estimated` and a
`basis` string the UI must render. When real climatology arrives, `source` gains a second
member and the bands are re-derived — the type survives, the meaning improves.

## 3. Units and time — one rule each

**Units.** `core/` is SI and only SI. Feet, ft/hr and `"1.68 m"` are produced in
`features/conditions/format.ts` from the unit preference in `meta` (ADR 005 §6). The
fixture's millimetres are a *wire* format: converted to `Metres` inside
`fixtures/newport-9410580.ts` and never seen again. A foot inside `core/` is a bug.

**Time.** The engine takes and returns `Instant`, a UTC epoch-millisecond. No "minutes since
base", no `Date`, no timezone, no `Intl` in `core/`. The current `TIDE_BASE_UTC`-relative
minute coordinate dies with the refactor; a pixel↔instant scale inside the chart is geometry,
not a domain unit. `station.timeZone` exists so `format.ts` can render station-local labels.
Countdowns ("slack in 1h 12m") are `format.ts` subtracting two `Instant`s, not engine output.

## 4. Tide height is not tidal current

Height change is `MetresPerHour`. Water velocity is `Knots`. `core/units.ts` deliberately
ships **no** conversion between them; adding one requires an ADR superseding this. Nothing in
`core/rules/tide/` returns `Knots`. Per ADR 002 there is no current-prediction station within
100 km of Newport, so a tidal-current reading originates from the angler's four terms and
lives with the current-direction code, not here. Copy follows the types: "rising/falling",
"0.42 m/h" — never "the current is running".

## 5. Estimate provenance

Anything derived rather than received is wrapped in `Sourced<T>`: `published` for a NOAA
turning point read back verbatim, `interpolated` for a height between samples, `estimated`
for slack windows and pace. The wrapper is not decorative — presentation may render a
`Sourced<T>` only through `components/sourced-value.tsx`, which always renders `basis`
(badge, caption or `aria-description` is ux-ui's call). Reading `.value` anywhere else under
`features/**` is an ESLint tripwire added with the refactor. This extends the existing
"Cached fixture — not a live reading" badge: that describes the *series*, `Sourced` describes
each *number*.

## 6. The event-overlay seam

Not built now. The seam is one type in `src/core/ontology/timeline.ts`:

```ts
export interface TimeAnchoredMarker {
  readonly id: string;
  readonly at: Instant;
  readonly anchor: "curve" | "axis";       // pinned to the curve height, or to the time axis
  readonly label: string;
  readonly a11yLabel: string;
  readonly tone: "primary" | "secondary" | "neutral";
}
```

`TideChart` takes `markers?: readonly TimeAnchoredMarker[]` and renders them without knowing
what a catch is. Later `features/catches` exports `toTimelineMarkers(...)` and the page
composes the two. The type lives in `core/` so neither feature imports the other's internals
(ADR 005 §3). Nothing else about overlays is decided today.

## 7. Purity and testability

`core/rules/**` is pure functions: no React, no DOM, no `fetch`, no `Intl`, no `Date.now()`.
The present moment is always the `at: Instant` parameter, supplied by `src/lib/time/use-now.ts`
— the single place the clock is read and the single reason the live marker re-renders. Tests
are plain Vitest in the configured `node` environment with no jsdom; the four vector files in
§1 are the cross-client contract ADR 003 §4 requires.

## What it costs us

- A refactor of a working, founder-approved chart before it gains a single feature.
- Branded units make some call sites noisier and need constructors at the edges.
- `Sourced<T>` must be unwrapped deliberately. That friction is the point.
- Vectors must be authored before the first behaviour change is safe.

## Rejected

- **Maths in `features/conditions/lib/`.** Cheaper today; means Swift reimplements slack,
  pace and the twelfths from a React file. ADR 003 §3 already called that a defect.
- **A `TideEngine` class holding the series.** Instance state invites a cached `now` and makes
  vector tests construct an object. Free functions over an explicit series read better.
- **Plain `number` with a naming convention (`rateMph`).** Conventions do not fail the build,
  and the defect this ADR most wants to prevent is a height rate shown as a current speed.
- **A three-band pace classifier cut on `ratio`.** Fewer bands and one less field, and it is
  what this ADR originally said. It bands a near-sinusoidal quantity around its peak rather
  than its distribution, so it reports "slow" for most of a normal day. See §2a before
  simplifying it back.
- **A timezone-aware engine.** Puts `Intl` in `core/`, which Swift cannot use, and makes every
  output locale-dependent.
- **Designing the score now.** `core/rules/conditions/` is reserved and empty. Its input will
  be an environment snapshot assembled by a feature from `TideReading`, `SunEvents`,
  `MoonPhase` and weather. That is the whole commitment.
