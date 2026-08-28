# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

**This repo does not use the default `CONTEXT.md` + `docs/adr/` layout.** It had a working
architecture doc set before these skills were installed, and the paths below are the real
ones. Do not create `CONTEXT.md` or `docs/adr/` — writing to them forks the trail.

## Before exploring, read these

- **`docs/architecture/ontology.md`** — the domain model and glossary. This file plays the
  role `CONTEXT.md` plays in other repos: it defines the entities, the two controlled
  vocabularies (saltwater and bass), and which fields are auto-captured versus typed.
- **`docs/architecture/decisions/`** — the ADRs. Read the ones that touch the area you are
  about to work in. Numbered `001-`, `002-`, … (three digits, no leading zero-pad to four).
- **`docs/product/SPEC.md`** — the settled-decision register. Decisions are tagged
  **SETTLED** (build on it), **PROPOSED** (recommended, not approved — do not build) and
  **OPEN** (unanswered). Referenced everywhere as `D1`…`D24`, `O1`…, `P1`…, `R1`….
  **Never silently promote a PROPOSED decision into a settled one.**

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't
suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs`
and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually
get resolved — but in this repo it appends to the files above rather than creating new ones.

## File structure

Single-context repo.

```
/
├── docs/
│   ├── architecture/
│   │   ├── ontology.md              ← glossary + domain model
│   │   └── decisions/               ← ADRs
│   │       ├── 001-canonical-ontology-shape.md
│   │       └── 002-current-direction-storage.md
│   ├── product/
│   │   └── SPEC.md                  ← settled/proposed/open decision register
│   └── agents/                      ← this file, plus tracker and label config
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a
hypothesis, a test name), use the term as defined in `docs/architecture/ontology.md`. Don't
drift to synonyms the glossary explicitly avoids.

Three that matter more than most, because getting them wrong corrupts data rather than just
reading badly:

- **"tide movement", never "current"** — tide movement is the derivative of the tide curve,
  a rate of water-level change. It is not current speed and there is no nearby current
  station to calibrate against.
- **uphill / downhill** are along-shore (up-coast NW / down-coast SE), anchored to the
  coastline and *not* to the tide. **inshore / offshore** is the perpendicular axis. Store
  and correlate on `current_bearing_deg`, never on the label. See ADR 002 and SPEC D20.
- **A blank trip is data, not a missing record.** A trip with zero catches and
  `zero_catch_confirmed_at` set is the denominator every rate claim depends on.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing
language the project doesn't use (reconsider) or there's a real gap (note it for
`/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR or a SETTLED decision in `SPEC.md`, surface it
explicitly rather than silently overriding:

> _Contradicts ADR-002 (current direction stored as a bearing) — but worth reopening because…_
