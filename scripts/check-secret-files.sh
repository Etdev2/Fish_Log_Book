#!/usr/bin/env bash
set -euo pipefail

# Fails when a committed file is named like a secret: env files, private keys,
# certificates or credential files. Content scanning is a separate decision.
repo="${1:-.}"
pattern='(^|/)(\.env(\..+)?|id_(rsa|ed25519)[^/]*|credentials\.json)$|\.(pem|key|p12|pfx)$'

found=$(git -C "$repo" ls-files | grep -E "$pattern" | grep -vE '(^|/)\.env(\.[^/]+)?\.example$' || true)
if [ -n "$found" ]; then
  while IFS= read -r path; do
    echo "::error file=$path::$path looks like a secret. Remove it from git, rotate whatever it held, and keep it in GitHub secrets instead."
  done <<< "$found"
  exit 1
fi
echo "No secret-looking files are committed."
