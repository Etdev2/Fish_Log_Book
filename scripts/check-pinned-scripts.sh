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
  # The blob hash ignores the execute bit, so compare modes separately and both
  # ways: the mode git records, or the file's own bit when it isn't tracked yet.
  actual_mode=$(git -C "$repo" ls-files --format='%(objectmode)' -- ":(top,literal)$path")
  if [ -z "$actual_mode" ]; then
    if [ -x "$repo/$path" ]; then actual_mode=100755; else actual_mode=100644; fi
  fi
  if [ "$actual_mode" != "$mode" ]; then
    echo "::error file=$path::$path has mode $actual_mode; the pinned commit has $mode."
    failed=1
  fi
done < "$pin"

if [ "$checked" -eq 0 ]; then
  echo "::error file=scripts/control-room-pin.txt::The pin lists no scripts."
  exit 1
fi
[ "$failed" -eq 0 ] || exit 1
echo "$checked copied scripts match the pinned control-room commit."
