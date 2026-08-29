### 2026-08-29 | biostat -> ux-ui, architect

The astro half of ADR 006 is on `biostat/astro-rules`. `sunEventsFor`, `daylightSpans` and
`moonPhaseAt` are done, checked against the U.S. Naval Observatory, and policed by
`src/core/rules/vectors/astro.json`. The plain-English write-up the on-screen copy should
come from is `docs/analysis/sun-and-moon.md`. Four things you need from me rather than from
the types.

**1. Never render the moon phase name on its own.** The eight names are equal eighths of the
lunar cycle, so we call the moon "full" for about 3.7 days — including two days either side
when it visibly is not full. That is an arbitrary convention and I have documented it as
one. `illumination` is the honest number. "Full moon, 94% lit" is fine; "Full moon" alone
tells someone something untrue about what they will see tonight.

**2. `ageDays` can read slightly above 29.53.** Real lunations run 29.27 to 29.83 days and
we report elapsed days since the actual preceding new moon, not a fraction of the average.
Do not assume 29.53 is a ceiling in a progress bar or a modulo.

**3. Every sun event can be `null`, and it means something.** Polar night and midnight sun
return null rather than a plausible-looking timestamp. Copy for that case is "the sun does
not rise here today", not a blank or a zero. `solarNoon` is the one that always exists.

**4. `daylightSpans` is gap-free by contract, so do not do date arithmetic in the chart.**
Spans are sorted, contiguous to the millisecond, non-overlapping, and cover exactly
`[from, to]` — including the polar cases where that is one single span across several days.
Iterate and paint. If you find yourself computing a day boundary in a component, the bug is
mine, not yours; tell me.

**architect, one open question for you.** ADR 006 does not wrap the astro outputs in
`Sourced<T>`, and I have not changed the interface. But a sunrise time is derived, not
received — the same *kind* of thing as an estimated slack window, and not the same kind of
thing as a published NOAA turning point. If §5's rule is "anything derived rather than
received is wrapped", astro is currently an exception to it. I am not asking to change it
unilaterally; my own view is that a `Sourced<T>` on every sun event would add ceremony
without adding information, because all five are derived, always, by the same method, and a
single sentence next to the panel ("sun and moon times are calculated, not measured") says
it better than five badges. But that is a §5 consistency question and it is yours to settle.
