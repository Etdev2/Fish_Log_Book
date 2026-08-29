# AWAITING_CODEX — test runner and the conditions module

**Status:** not started. Written by the Claude session on 2026-08-28 for the
ChatGPT/Codex session. This runtime cannot launch Codex, so this file is the handoff.
It has to be picked up on the Codex side; nothing here has been run.

**Why this lane:** the founder chose split workstreams. Claude is building the design
system and app shell (`design/production-design-system`, `head-dev/design-tokens`),
which is one tightly coupled front-end job. This lane touches zero front-end files, so
the two cannot collide. Per AI-OPERATING-SYSTEM.md, mixed mode is load balancing, not
duplicate review — do not re-derive anything below.

## The situation

Two facts make this lane urgent:

1. **This repository has no test framework at all.** Not misconfigured — absent. No
   jest, no vitest, no test script, no test files. `npm run lint` and `npm run build`
   are the only checks that exist.
2. **Branch `biostat/moon-and-tide-cache` holds 2,968 lines of finished test vectors**
   with nothing to run them and nothing to run them against:
   - `src/core/rules/vectors/moon-and-sun.json` (263 lines)
   - `src/core/rules/vectors/tide-rate-sinusoid.json` (1,616 lines)
   - `src/core/rules/vectors/tide-state.json` (1,089 lines)

   The biostatistician produced expected values, then the session was interrupted.
   Those vectors are the specification. Do not rewrite them, do not "correct" them,
   and do not generate new expected values — if a vector looks wrong, stop and say so
   rather than editing it to match your implementation.

Consequence worth stating plainly: every enforcement rule in ADR 003 §4 and ADR 005 is
currently unenforceable. They are wishes until a runner exists.

## Task 1 — stand up the test runner

```text
TASK: Add a test runner to the project and make the existing vector files executable as tests.
MODEL TIER: LOW to MEDIUM (start LOW; escalate if Next.js 16 / Tailwind v4 config fights you)
RUNTIME: CODEX
SOURCE / RELEVANT PATHS: package.json, tsconfig.json, next.config.*, src/core/rules/vectors/*.json,
  docs/architecture/decisions/003-web-prototype-boundary.md §4
ALLOWED WRITES: Test config, test files, package.json scripts, CI workflow. No product code.
CONSTRAINTS / DO NOT: Do not restructure src/. Do not touch docs/design/ or
  docs/architecture/decisions/005-*.md — Claude's lane owns those. Do not convert any
  *.module.css. Read node_modules/next/dist/docs/ before configuring anything.
EXPECTED OUTPUT: `npm test` runs and reports; a vector file is loaded and asserted against.
DONE WHEN: A deliberately wrong value in a vector makes the suite fail, and reverting it makes it pass.
```

Vitest is the likely fit for this stack, but that is a recommendation, not a decision —
the Codex head-dev owns it.

## Task 2 — implement the conditions module against those vectors

```text
TASK: Implement moon/sun computation and cached tide so the existing vectors pass.
MODEL TIER: MEDIUM (escalate to HIGH for the astronomy/tide math itself, per biostat ownership)
RUNTIME: CODEX
SOURCE / RELEVANT PATHS: src/core/rules/vectors/*.json, docs/product/SPEC.md D25,
  docs/analysis/data-sources.md, docs/architecture/decisions/004-offline-store-and-sync.md
ALLOWED WRITES: src/core/rules/ and its tests. Nothing in src/app/, src/components/, src/features/.
CONSTRAINTS / DO NOT:
  - D25 is binding: moon is computed on-device (astronomy-engine, no API, no key, works
    offline by construction). Tide is fetched from NOAA station 9410580 and CACHED AHEAD
    of a trip — never called live on a boat with no signal.
  - Weather, pressure and water temperature stay CUT. Do not add them.
  - No UI. This lane produces no screens; Claude's lane owns the view layer.
  - Do not edit the vectors to make tests pass.
EXPECTED OUTPUT: Passing vector tests, plus a short note on any vector that could not be satisfied and why.
DONE WHEN: All three vector files pass, and the tide path demonstrably works from cache with the network off.
```

## Boundaries between the two runtimes

| Owned by Codex (this file) | Owned by Claude |
|---|---|
| Test runner + CI wiring | Design tokens, fonts, Tailwind pipeline |
| `src/core/rules/` conditions math | `src/app/`, `src/components/`, `src/features/` |
| `biostat/moon-and-tide-cache` vectors | `docs/design/`, ADR 005 |

If this lane needs a front-end file, or Claude's lane needs `src/core/rules/`, stop and
raise it rather than reaching across. Both sessions share one working directory at
`/Users/et/dev/Fish_Log_Book`; Claude is working in separate worktrees to stay out of it.

## Two things that have bitten us today

- **Push when you stop, not when you finish.** Twice today work sat committed-but-unpushed
  or uncommitted entirely, once at ~2,650 lines. HOUSE-RULES §3 names this the most
  expensive mistake in this repo, and it happened twice in one day anyway.
- **Check the worklog directory before writing.** Both sessions log as real roles and
  nearly collided on `2026-08-28-18-ux-ui.md`. Run `ls docs/team/worklog/` and take the
  next free number.
