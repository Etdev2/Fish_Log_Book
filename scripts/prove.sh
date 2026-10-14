#!/usr/bin/env bash
set -euo pipefail

# Runs the project gate and the production build through the control room's
# proof writer (scripts/write-proof.sh, ADR 0005 in Etdev2/sweet-potato), which
# writes proof/. Stage your change by name first; then commit proof/ with it.
#
# usage: scripts/prove.sh <owner/repo#issue>
ticket="${1:?usage: scripts/prove.sh <owner/repo#issue>}"
cd "$(dirname "$0")/.."

# write-proof.sh stages everything outside proof/ with `git add -A`. Refusing
# here first keeps the rule: only files staged by name reach a commit.
if ! git diff --quiet -- . ':!proof' || [ -n "$(git ls-files --others --exclude-standard -- . ':!proof')" ]; then
  echo "Unstaged or untracked files exist outside proof/. Stage the files your change needs by name, and delete scratch files, so the proof matches the code it ran against." >&2
  exit 2
fi

exec scripts/write-proof.sh \
  --ticket "$ticket" \
  --verification "npm run verify" \
  --fixture "the feature map in .claude/skills/verify/SKILL.md" \
  --shows "The control-room pin check, the proof-tool self-test, npm run verify and npm run build, each with its output and exit code." \
  -- \
  "scripts/check-pinned-scripts.sh" \
  "scripts/check-secret-files.sh" \
  "scripts/test-proof-tools.sh" \
  "npm run verify" \
  "npm run build"
