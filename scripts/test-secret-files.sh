#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
git -C "$work" init -q

# Empty files exercise filenames only; no real secrets enter the fixture.
check_name() {
  local path="$1" expected="$2" status=0
  mkdir -p "$(dirname "$work/$path")"
  : > "$work/$path"
  git -C "$work" add -f -- "$path"
  bash "$root/scripts/check-secret-files.sh" "$work" > "$work/output" 2>&1 || status=$?
  git -C "$work" rm -q -f -- "$path"
  if { [ "$expected" = reject ] && [ "$status" -eq 1 ]; } \
    || { [ "$expected" = allow ] && [ "$status" -eq 0 ]; }; then
    printf 'ok filename %q: %s\n' "$path" "$expected"
  else
    printf 'FAIL filename %q: expected %s, exit %s\n' "$path" "$expected" "$status" >&2
    cat "$work/output" >&2
    exit 1
  fi
}

for path in .env .env.local config/.env.production .aws/credentials \
  aws-credentials.json nested/AWS-CREDENTIALS.JSON credentials.json credentials.yaml \
  service-account.json service_account.json firebase-service-account.json \
  client_secret client_secret.json client_secrets.json CLIENT_SECRET.JSON \
  nested/client_secret_123.apps.googleusercontent.com.json oauth-client-secret.yaml \
  secret secrets secrets.json secrets.yaml .secrets.json nested/secrets.production.toml \
  passwords.json api-keys.json access_tokens.json nested/refresh-token.txt \
  .netrc .npmrc .pypirc .git-credentials .pgpass .docker/config.json \
  .aws/config .ssh/custom-key .config/gcloud/application_default_credentials.json \
  playwright/.auth/user.json \
  id_rsa id_dsa id_ecdsa id_ed25519 id_ecdsa_sk nested/ID_ECDSA \
  signing.pem signing.KEY signing.p8 signing.p12 signing.pfx \
  $'nested/line\nbreak/service-account.json'; do
  check_name "$path" reject
done

for path in .env.example .env.local.example nested/.env.production.example \
  README.md scripts/check-secret-files.sh src/credentials.ts \
  src/client-secret.ts src/client_secret_utils.ts docs/client-secret-setup.md \
  src/core/design/tokens.json docs/secrets-guide.md src/tokens.ts \
  docs/service-account-setup.md; do
  check_name "$path" allow
done

if bash "$root/scripts/check-secret-files.sh" "$work/missing-repo" >/dev/null 2>&1; then
  echo 'FAIL a repository enumeration error must fail the gate' >&2
  exit 1
fi
echo 'All secret filename cases pass.'
