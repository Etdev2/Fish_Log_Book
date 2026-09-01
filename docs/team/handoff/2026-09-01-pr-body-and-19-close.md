# Push-time handoff (2026-09-01)

Everything below is ready to paste. Sandbox git remotes/PATs die at session boundaries,
so pushing + PR creation + the #19 close-comment run from your side.

## 1. Push

```bash
cd Fish_Log_Book
git remote add origin https://github.com/Etdev2/Fish_Log_Book.git
git push -u origin feature/historical-catch-slices
# then create the PR (gh or web) with the body below, and comment on #19 with the text below
gh pr create --title "Historical catch slices + regulations docs-first pack" --body-file PR_BODY.md
gh pr comment 19 --body-file PR19_CLOSE_NOTE.md && gh pr close 19 --comment "Superseded — see comment above."
```

(Write the two blocks below into those files, or hand `gh` the heredocs.)

## 2. PR body

```markdown
## Track A — Historical Catch Enhancements (founder spec, in full)

- **§1 Backfill from the calendar.** Day pages (and empty days) lead with
  "+ Add catch for this day" → `/log?add=YYYY-MM-DD`. The sheet opens pre-set to midday
  on that day; the always-visible "When?" row costs nothing until touched, and a
  future timestamp refuses to save with an amber rail. `capture_mode` flips to
  `backfill` by the angler's own local day (`captureModeFor`, day-boundary tested).
- **§2 Conditions at the catch.** Optional water temp / air pressure / wind speed /
  wind-from inside Add details. Angler types display units (°F, inHg, **knots in both
  unit systems**), storage is SI, provenance names the angler. Editing seeds back from
  the snapshot: untouched block round-trips, cleared field clears.
- **§3 Catch Detail.** `/catch/[id]` = the whole record in honest sections (absence is
  information), Edit through the very same sheet + `updateCatchFromDraft` so it cannot
  drift from the log's edit; unknown ids say "No such catch", not 404. Day rows link
  "Open record →".
- **§4 Quick vs Detailed.** Quick Log is untouched in speed: species is still the only
  required pick; everything new lives behind one more tap or the date row you can ignore.
- **§6 Tide at log time**, honest edition: fill runs ONCE from the cached series when the
  catch moment is in window (height, signed rate, flood/ebb/slack, cycle %, twelfths
  hour, day range, ±3h 15-minute curve) and is then read-only; out of window = an
  explicit *pending* state in words. Never recomputed on view; never estimated from a
  neighbouring day (spec §19). Freshwater shows nothing at all.

Schema: ONE additive migration — `condition_snapshot.tide_curve jsonb` (bounded check);
the six scalar tide columns and all four env columns already existed.

Architecture kept: conditions → catches import direction stays one-way (the catch detail
route composes both features); ADR 006 §5 Sourced-unwrapping moved the tide fill into
`core/rules/tide/catch-fill.ts`; ADR 006 §7 — `useNow` is the only clock in the sheet.

## Track B — Regulations & Fish ID, docs-first (founder §18)

- `docs/specs/regulations-architecture.md` — citation-or-nothing rule, CDFW-verbatim
  geography, on-device polygon resolution, map approach decided (no interactive map v1;
  MPA layer linked out), staleness banners, "No verified data" as permanent copy, why
  PR #19 is superseded.
- `docs/specs/regulations-data-model.md` — reg_area / reg_group / reg_pack / reg_rule.
- Migration `20260901230000` — the small **verified** SoCal starter dataset: 38 rows,
  every one verbatim-quoted from wildlife.ca.gov with source stamps (Southern region
  page updated **2026-09-01**; groundfish summary 2026-06-23) and verified_at today.
  Includes the September 2026 ocean salmon window (20k harvest guideline, coho
  prohibited) and the split Southern groundfish seasons.

## Gates

- 364/364 tests (TIDE fill flood/ebb/slack/pending/clipped curve; conversions round-trip;
  compass labels; captureModeFor boundaries; draftFromRecord round-trips; ontology
  parity incl. the 3 new regulated species ids).
- eslint / tsc / next build green. Migration arity machine-checked; no local Postgres in
  sandbox — CI applies the chain.

## Known deferrals (explicit, not forgotten)

- Photos on the edit path (IDB `media` store) land with their own PR.
- `reg_area.boundary_geojson` is null until polygons are mapped; v1 resolution = the
  device-local home-region preference (ADR 007 mechanism), documented in the arch doc.
- Tide fill today covers the embedded fixture's window; everything older/newer honestly
  says pending until the live-tide decision (fixture expiry **2026-09-04**).

After merging: delete the PAT (per standing instruction).
```

## 3. PR #19 closing comment

```markdown
Closing as superseded by the docs-first regulations architecture, per today's founder
ruling.

What this PR got right: start with SoCal saltwater, and regulation content matters.
That species pick survives as the v1 dataset.

Why it can't merge as-is: the new architecture
(docs/specs/regulations-architecture.md §9) makes regulation a data pack with verbatim
agency text, provenance, staleness banners and agency geography — not static UI strings
— and founder §18 gates regulation UI until that architecture review. The connected
dataset ships as migration 20260901230000 in the historical-catch PR.

Thank you for the first pass; the trust model it needed is now written down.
```
