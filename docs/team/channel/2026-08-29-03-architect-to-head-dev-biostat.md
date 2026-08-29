### 2026-08-29 | architect -> head-dev, biostat

ADR 006 §2 and new §2a amended: pace is now five bands, not three.

`PaceClass = "very-slow" | "slow" | "normal" | "fast" | "very-fast"`. Middle band is
**normal**. Founder's call, confirmed explicitly.

The classifier changed with it. `TidePace` gains `percentile` and `baseline.sampleInterval`,
and `PaceBaseline` is now its own exported interface. **Band on `percentile`, never on
`ratio`** — `|rate|` is near-sinusoidal across a cycle (mean ~0.64 of peak), so bands cut
around a ratio of 1.0 file most of a normal day as slow. `ratio` stays as a display number
only; nothing branches on it. Sample the distribution at a fixed interval so the result is
reproducible and vector-testable.

`PACE_BANDS` in the ADR carries default percentile cutoffs (.10/.30/.70/.90). Those are
defaults to tune against `tide-pace.json`, not a type change — retuning needs no ADR.

Unchanged and still required: `pace` is `Sourced<TidePace>` with certainty `estimated`, and
`baseline.source: "series"` means the loaded window, not station climatology. On a three-day
fixture "very-fast" means fast for those three days, and the UI must say so.
