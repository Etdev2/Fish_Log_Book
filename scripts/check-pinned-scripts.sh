#!/usr/bin/env bash
set -euo pipefail

# Fails when a script copied from the control room differs from the reviewed
# commit recorded in scripts/control-room-pin.txt. The control room is private,
# so this compares git blob hashes offline instead of fetching it.
repo="${1:-.}"
pin="$repo/scripts/control-room-pin.txt"
failed=0
checked=0

while read -r mode type hash path; do
  case "$mode" in '#'* | '') continue ;; esac
  checked=$((checked + 1))
  if [ "$type" != blob ] || [ ! -f "$repo/$path" ] || [ -L "$repo/$path" ]; then
    echo "::error file=$path::$path is missing or not a regular file. Copy it from the commit in scripts/control-room-pin.txt."
    failed=1
    continue
  fi
  actual=$(git -C "$repo" hash-object -- "$path")
  if [ "$actual" != "$hash" ]; then
    echo "::error file=$path::$path differs from the reviewed copy pinned in scripts/control-room-pin.txt. Change it in the control room, then update the copy and the pin."
    failed=1
  fi
  if [ "$mode" = 100755 ] && [ ! -x "$repo/$path" ]; then
    echo "::error file=$path::$path must be executable, as it is at the pinned commit."
    failed=1
  fi
done < "$pin"

if [ "$checked" -eq 0 ]; then
  echo "::error file=scripts/control-room-pin.txt::The pin lists no scripts."
  exit 1
fi
[ "$failed" -eq 0 ] || exit 1
echo "$checked copied scripts match the pinned control-room commit."
