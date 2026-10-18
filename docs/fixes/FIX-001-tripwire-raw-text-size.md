# FIX-001: CI fails on a raw text size in the tide overview

- Status: open
- Found by: CI `verify` on `c2fc171`, confirmed by the coordinator (https://github.com/Etdev2/Fish_Log_Book/pull/137#issuecomment-6225223200)
- Owner: #137 builder (Elliott may reassign)
- PR / branch: #137, `fl1/tides-2yr`

## What's wrong
The month/year tide view uses a hard-coded 11 px text size. The project's design rules
(ADR 005 §2) require sizes to come from design tokens, so the check fails and the PR
cannot merge.

## Proof
`src/features/conditions/components/tide-overview.tsx:162` —
`className="fill-text-primary font-mono text-[11px] font-semibold tracking-chart-pill"`.
`npm run verify` exits 1 at the tripwires step.

## Done when
`npm run verify` exits 0 on the PR head and the CI `verify` check is green.
