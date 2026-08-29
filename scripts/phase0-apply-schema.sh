#!/usr/bin/env bash
# Phase 0 gate 1: apply the committed V1 migrations to the live Supabase project.
# Run this yourself — `supabase link` prompts for the database password, which
# this repo does not store and an agent should not handle.
#
#   ./scripts/phase0-apply-schema.sh          # link + push + verify
#   ./scripts/phase0-apply-schema.sh verify   # verify only, no writes
set -euo pipefail

PROJECT_REF="ojoucnjkmwiiamxgzqkn"   # Fish_Log
cd "$(dirname "$0")/.."

[ -f .env.local ] || { echo "FAIL: .env.local not found"; exit 1; }
URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2-)
KEY=$(grep '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' .env.local | cut -d= -f2-)

verify() {
  echo
  echo "Verifying V1 tables over PostgREST..."
  local fail=0
  for t in angler spot trip catch journal_entry trip_rig condition_snapshot sync_conflict; do
    code=$(curl -s -o /dev/null -w '%{http_code}' \
      "$URL/rest/v1/$t?select=*&limit=1" \
      -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
    # 200 = readable. 401/403 = exists but RLS denies anon, which is correct for
    # a table with RLS on and no session — both mean the migration landed.
    case "$code" in
      200|401|403) printf '  ok    %-22s HTTP %s\n' "$t" "$code" ;;
      404)         printf '  MISS  %-22s HTTP 404 (table not in schema cache)\n' "$t"; fail=1 ;;
      *)           printf '  ?     %-22s HTTP %s\n' "$t" "$code"; fail=1 ;;
    esac
  done
  echo
  if [ "$fail" -eq 0 ]; then
    echo "PASS - Phase 0 gate 1 met: V1 schema is live."
  else
    echo "FAIL - schema not fully applied. Do not start Phase 1 against this project."
    return 1
  fi
}

if [ "${1:-}" = "verify" ]; then verify; exit $?; fi

command -v supabase >/dev/null || { echo "FAIL: supabase CLI not on PATH"; exit 1; }

echo "Linking to project $PROJECT_REF (prompts for the database password)..."
supabase link --project-ref "$PROJECT_REF"

echo
echo "Migrations about to be applied:"
ls -1 supabase/migrations/
echo
read -r -p "Apply these to the LIVE project $PROJECT_REF? [y/N] " ok
[ "$ok" = "y" ] || { echo "Aborted."; exit 1; }

supabase db push
verify
