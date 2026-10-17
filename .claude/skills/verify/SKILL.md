---
name: verify
description: Prove a change to Fish Log Book works and write the Sweet Potato proof bundle. Use before claiming any ticket is done.
---

# Verify Fish Log Book

Fish Log Book follows the Sweet Potato control room's proof rule ([ADR 0005](https://github.com/Etdev2/sweet-potato/blob/main/docs/adr/0005-commit-a-proof-bundle-with-every-pull-request.md)): every pull request commits a passing bundle in `proof/`.

## Steps

1. Stage the files your change needs, by name. Never use `git add -A` or `git add .`.
2. Run `scripts/prove.sh <owner/repo#issue>`. It refuses if anything outside `proof/` is unstaged or untracked, then runs the pin check, the proof-tool self-test, `npm run verify` and `npm run build` through the pinned `scripts/write-proof.sh`.
3. Read `proof/verification.txt`. If `proof/manifest.json` does not say `PASS`, fix the cause and go back to step 1. Never edit `proof/` by hand.
4. Commit `proof/` with your change. Merging `main` into the branch makes the proof stale; re-run step 2.

CI's `proof` job runs `scripts/check-proof.sh` at the pull request's head commit. The database and browser layout checks run in the `verify` job (`scripts/check-migrations-apply.sh`, `npm run layout`); they need Postgres and Chromium, so they are not part of the local bundle yet.

## Feature map

| Area | Checked by |
| --- | --- |
| Design tokens, tripwires, migration versions, lint, types, unit tests | `npm run verify` |
| Production build | `npm run build` |
| Migrations apply to real Postgres | CI `verify` job: `scripts/check-migrations-apply.sh` |
| Layout rules in a browser | CI `verify` job: `npm run layout` |
