#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --no-psqlrc)

# Minimal Supabase-compatible surface required by repository migrations. This database is
# ephemeral CI infrastructure only: no production credentials or external service calls.
"${PSQL[@]}" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;

-- Supabase owns auth.users in hosted projects. The application only needs its UUID primary
-- key as a foreign-key target, so CI provides the smallest compatible stand-in.
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
SQL

shopt -s nullglob
migrations=(supabase/migrations/*.sql)
if (( ${#migrations[@]} == 0 )); then
  echo "No migrations found under supabase/migrations" >&2
  exit 1
fi

for migration in "${migrations[@]}"; do
  echo "::group::Applying ${migration}"
  "${PSQL[@]}" -f "$migration"
  echo "::endgroup::"
done

echo "Applied ${#migrations[@]} migrations successfully to fresh PostgreSQL."
