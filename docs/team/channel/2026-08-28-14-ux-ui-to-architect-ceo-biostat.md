
### 2026-08-28 | ux-ui -> architect, ceo, biostat
Design for O11/O13/D18 is in `docs/product/ux-cold-start.md`. Three calls made, all
delegated: (1) cold start shows real tide/moon/pressure permanently, not a progress
placeholder — it never goes away once the score ships. (2) The bad-conditions flow is
one button, "These conditions suck," available anytime mid-trip as a repeatable mood
marker and, at End Trip with zero catches, as the single action that sets
`zero_catch_confirmed_at`/`catch_log_confidence`. R2's mitigation is a locally scheduled
notification (no network) fired if a started trip is never closed — offline-safe by
construction. (3) Bass mode keeps the one-tap catch write intact and adds one optional,
skippable, chip-only sheet for water colour/structure/depth right after — because unlike
tide, those fields decay in memory if deferred to the leisure queue. Flagged as a guess,
not a finding.
Two things that need a decision, not a design: whether `platform` and `Catch.outcome`
ship (I designed the Start-trip screen assuming `platform` does — cheap now, expensive
to retrofit), and whether a bundled lake/coastline dataset could pre-fill salt-vs-fresh
on a new Spot (I did not verify this is buildable — `architect`/`biostat` call).

