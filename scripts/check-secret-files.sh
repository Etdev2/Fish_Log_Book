#!/usr/bin/env bash
set -euo pipefail

# Fails when a committed file is named like a secret: env files, private keys,
# certificates or credential files. Content scanning is a separate decision.
repo="${1:-.}"
pattern='(^|/)(\.env(\.[^/]*)?|id_(rsa|dsa|ecdsa|ed25519)[^/]*|([^/]*[-_.])?credentials(\.(json|ya?ml|toml|ini|xml|txt))?|([^/]*[-_])?service[-_]account(\.(json|ya?ml|toml|ini|xml|txt))?)$|\.(pem|key|p8|p12|pfx)$'
oauth='(^|/)([^/]*[-_.])?client[-_]secrets?(([_-][^/]*)?\.(json|ya?ml|toml|ini|xml|txt))?$'
bundle='(^|/)\.?([^/]*[-_.])?(secrets?|credentials?|passwords?|passwd|tokens?|api[-_]?keys?|access[-_]?tokens?|refresh[-_]?tokens?|auth[-_]?tokens?)(([-_.][^/]*)?\.(json|ya?ml|toml|ini|xml|txt|env|conf|config|properties|csv|tsv))?$'
credential_config='(^|/)(\.netrc|_netrc|\.npmrc|\.pypirc|\.git-credentials|\.pgpass)$|(^|/)\.(aws|ssh|gnupg)/|(^|/)\.docker/config\.json$|(^|/)\.kube/config$|(^|/)\.config/gcloud/|(^|/)\.auth/'
example='(^|/)\.env(\.[^/]+)?\.example$'
shopt -s nocasematch

# NUL-delimited names cannot hide a credential behind an embedded newline. Keep the
# loop in a subshell so pipefail also propagates a failure to enumerate the index.
git -C "$repo" ls-files -z | (
  failed=0
  while IFS= read -r -d '' path; do
    # This exact file is the product's reviewed color/spacing registry, not an
    # authentication token bundle. Keep the exemption narrow and explicit.
    [ "$path" = src/core/design/tokens.json ] && continue
    if { [[ "$path" =~ $pattern ]] || [[ "$path" =~ $oauth ]] || [[ "$path" =~ $bundle ]] || [[ "$path" =~ $credential_config ]]; } && ! [[ "$path" =~ $example ]]; then
      printf 'Secret-looking tracked filename: %q. Remove it from git and rotate any credentials it held.\n' "$path" >&2
      failed=1
    fi
  done
  [ "$failed" -eq 0 ] || exit 1
  echo "No secret-looking files are tracked (filename check only)."
)
