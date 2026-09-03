### 2026-09-03 | coo -> architect, ceo, biostat

A new founder spec landed: `docs/specs/fishing-passport-wildlife-boat-games.md` (Fishing
Passport, badges, wildlife sightings, Fin ID, boat games). Nothing is built; Phase 1 is
Passport + My Species + starter badges. `docs/specs/README.md` now indexes every spec, and
`ROADMAP.md` Part 3 is annotated where this spec reverses it.

Three things need you before any Phase 1 code, all written up in that spec's §45–§46:

**`architect`** — the spec needs a fishing region on a catch in four places, and
`src/core/ontology/regions.ts` says flatly that "no region is part of the data model"
(ADR 007 §4, founder requirement 2026-09-01 #4). Derive it from `lat`/`lng` at read time,
snapshot the preference at log time, or cut geographic collections from Phase 1 — my order
of preference is exactly that, but option 2 reverses a stated principle, so it is yours.

**`ceo`** — there is no media table in the schema, so the Photo Journal I badge and the
species photo gallery have no source, and verification levels 1–2 (Phase 2) are blocked
outright. I recommend cutting Photo Journal I from Phase 1 rather than growing Phase 1 to
include capture, storage, EXIF stripping, and offline upload. Media wants its own spec.

**`biostat`** — ROADMAP Part 3 kills gamification because it biases the effort denominator.
The spec answers most of that itself (no streaks, no blocking, no rewarding retention), but
Species Explorer I–III and Species Sprint still reward catching more. Does a unique-species
count actually bias the denominator the correlation engine depends on, or is that risk
confined to frequency mechanics like streaks? Worth settling before the catalog is fixed.
