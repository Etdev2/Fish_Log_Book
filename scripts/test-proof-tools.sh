#!/usr/bin/env bash
set -euo pipefail

# Proves the copied proof tools reject the bundles that the pilot's earlier
# check-proof.sh accepted (review of rust-pilot PR #1), and that the drift check
# catches a changed copy. Each case runs in a throwaway copy of this checkout.
root="$(cd "$(dirname "$0")/.." && pwd)"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
failures=0

new_repo() {
  local repo="$work/$1"
  mkdir -p "$repo"
  git -C "$root" ls-files -co --exclude-standard -z \
    | grep -zv '^proof/' \
    | tar -C "$root" --null -T - -cf - \
    | tar -C "$repo" -xf -
  git -C "$repo" init -q
  commit "$repo" base
  echo "$repo"
}

commit() {
  git -C "$1" add -A
  git -C "$1" -c user.name=test -c user.email=test@example.com commit -qm "$2"
}

# A valid committed bundle, written by the copied writer.
prove() {
  bash "$1/scripts/write-proof.sh" --repo "$1" --ticket "Etdev2/sweet-potato#24" \
    --fixture "a throwaway copy" --shows "The output of true." -- true > /dev/null
  commit "$1" "Add proof"
}

edit_manifest() {
  jq "$2" "$1/proof/manifest.json" > "$1/m.tmp" && mv "$1/m.tmp" "$1/proof/manifest.json"
}

# expect <name> pass|fail <repo> [text the output must contain]
expect() {
  local name="$1" want="$2" repo="$3" pattern="${4:-}" out code=0
  out=$(bash "$repo/scripts/check-proof.sh" "$repo" 2>&1) || code=$?
  if { [ "$want" = pass ] && [ "$code" -eq 0 ]; } \
    || { [ "$want" = fail ] && [ "$code" -ne 0 ]; }; then
    if [ -z "$pattern" ] || grep -qF -- "$pattern" <<< "$out"; then
      echo "ok   $name"
      return
    fi
  fi
  echo "FAIL $name (exit $code)"
  sed 's/^/     /' <<< "$out"
  failures=$((failures + 1))
}

repo=$(new_repo valid)
prove "$repo"
expect "a bundle from the copied writer passes" pass "$repo"

repo=$(new_repo pattern)
prove "$repo"
edit_manifest "$repo" '.evidence[0].path = "proof/v*.txt"'
commit "$repo" "Name evidence by pattern"
expect "evidence named by a pattern fails" fail "$repo" "is not committed"

repo=$(new_repo directory)
prove "$repo"
edit_manifest "$repo" '.evidence[0].path = "proof/"'
commit "$repo" "Name a directory as evidence"
expect "evidence naming a directory fails" fail "$repo" "is not committed"

# The review's case: an unstaged ticket edit must not change what is checked.
repo=$(new_repo unstaged-ticket)
prove "$repo"
edit_manifest "$repo" '.ticket = "Etdev2/sweet-potato#999"'
out=$(bash "$repo/scripts/check-proof.sh" "$repo" 2>&1) && code=0 || code=$?
if [ "$code" -eq 0 ] && grep -qF "PASS for Etdev2/sweet-potato#24." <<< "$out" \
  && ! grep -qF "#999" <<< "$out"; then
  echo "ok   an unstaged manifest edit is ignored; the committed ticket is checked"
else
  echo "FAIL an unstaged manifest edit is ignored; the committed ticket is checked (exit $code)"
  sed 's/^/     /' <<< "$out"
  failures=$((failures + 1))
fi

# The same gap where it matters: a committed FAIL can't pass by an uncommitted edit.
repo=$(new_repo uncommitted-pass)
prove "$repo"
edit_manifest "$repo" '.result = "FAIL"'
commit "$repo" "Commit a FAIL manifest"
edit_manifest "$repo" '.result = "PASS"'
expect "an uncommitted edit can't turn a committed FAIL into PASS" fail "$repo" "Verification reported FAIL"

repo=$(new_repo drift)
printf '\n' >> "$repo/scripts/check-proof.sh"
out=$(bash "$repo/scripts/check-pinned-scripts.sh" "$repo" 2>&1) && code=0 || code=$?
if [ "$code" -ne 0 ] && grep -qF "scripts/check-proof.sh differs from the reviewed copy" <<< "$out"; then
  echo "ok   the drift check catches a one-byte change to a copied script"
else
  echo "FAIL the drift check catches a one-byte change to a copied script (exit $code)"
  sed 's/^/     /' <<< "$out"
  failures=$((failures + 1))
fi

if [ "$failures" -gt 0 ]; then
  echo "$failures proof-tool case(s) failed."
  exit 1
fi
echo "All proof-tool cases behave as specified."
