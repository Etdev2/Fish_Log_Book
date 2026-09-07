#!/usr/bin/env bash
#
# Applies every migration, in order, to a real Postgres.
#
# This exists because reading SQL does not tell you whether it runs. When this script was
# written the tournament migration set had never been applied anywhere, and the first run
# found four separate reasons it could not be:
#
#   1. `tournament_division.target_species_id` was typed `uuid` against `species.id`, which
#      is `text` — a foreign key Postgres refuses to create at all.
#   2. `public_tournament_catch` selected three columns that do not exist on
#      `tournament_catch` (`tournament_entry_id`, `captured_at_device`, `state`).
#   3. `create or replace view` cannot insert a column into the middle of a view's select
#      list; it can only append. Two migrations did exactly that.
#   4. Replacing the view needs `get_public_tournament` dropped and restored first, because
#      the function returns the view's row type.
#
# None of those are visible to TypeScript, to the linter, or to any test that reads the
# files as text. All four would have surfaced as a failed production deploy.
#
# Usage: scripts/check-migrations-apply.sh [--keep]
#   --keep  leave the database running afterwards, for poking at with psql.
set -euo pipefail

PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PGDATA_DIR="${PGDATA_DIR:-/tmp/flb-migration-check/data}"
PGRUN_DIR="${PGRUN_DIR:-/tmp/flb-migration-check/run}"
PGPORT="${PGPORT:-5433}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEEP=false
[[ "${1:-}" == "--keep" ]] && KEEP=true

if [[ ! -x "$PGBIN/initdb" ]]; then
  echo "No Postgres server binaries at $PGBIN." >&2
  echo "Install postgresql-16, or set PGBIN. Skipping is NOT the same as passing." >&2
  exit 2
fi

# Postgres refuses to run as root, so a throwaway unprivileged user owns the cluster.
RUN_AS=""
if [[ "$(id -u)" -eq 0 ]]; then
  id -u flbpg >/dev/null 2>&1 || useradd -m flbpg
  RUN_AS="flbpg"
fi
as_pg() { if [[ -n "$RUN_AS" ]]; then su "$RUN_AS" -c "$1"; else bash -c "$1"; fi; }

cleanup() {
  if [[ "$KEEP" == false ]]; then
    as_pg "$PGBIN/pg_ctl -D $PGDATA_DIR stop -m immediate" >/dev/null 2>&1 || true
    rm -rf "$(dirname "$PGDATA_DIR")"
  fi
}
trap cleanup EXIT

rm -rf "$(dirname "$PGDATA_DIR")"
mkdir -p "$PGDATA_DIR" "$PGRUN_DIR"
[[ -n "$RUN_AS" ]] && chown -R "$RUN_AS" "$(dirname "$PGDATA_DIR")"

as_pg "$PGBIN/initdb -D $PGDATA_DIR -U postgres -A trust" >/dev/null
as_pg "$PGBIN/pg_ctl -D $PGDATA_DIR -o '-k $PGRUN_DIR -p $PGPORT -c listen_addresses=' -w start" >/dev/null

PSQL=(psql -q -h "$PGRUN_DIR" -p "$PGPORT" -U postgres -d postgres -v ON_ERROR_STOP=1)

# Stand-ins for the parts of Supabase the migrations reference. Deliberately the smallest
# thing that lets the SQL run: a real Supabase has far more, and none of the rest is what
# these migrations are testing.
"${PSQL[@]}" -f "$REPO_ROOT/supabase/test/supabase-shim.sql" >/dev/null

failed=0
count=0
for file in "$REPO_ROOT"/supabase/migrations/*.sql; do
  count=$((count + 1))
  if ! output=$("${PSQL[@]}" -f "$file" 2>&1); then
    echo "FAILED: $(basename "$file")" >&2
    echo "$output" | grep -v '^psql.*NOTICE' | head -20 >&2
    failed=1
    break
  fi
done

if [[ "$failed" -eq 1 ]]; then
  echo "" >&2
  echo "A migration did not apply. A deploy would fail here." >&2
  exit 1
fi

echo "migrations: all $count applied cleanly to Postgres $("${PSQL[@]}" -tAc 'show server_version' | tr -d ' ')."

if [[ -f "$REPO_ROOT/supabase/test/rpc-behaviour.sql" ]]; then
  if ! output=$("${PSQL[@]}" -f "$REPO_ROOT/supabase/test/rpc-behaviour.sql" 2>&1); then
    echo "FAILED: rpc-behaviour.sql" >&2
    echo "$output" | grep -v '^psql.*NOTICE' | tail -30 >&2
    exit 1
  fi
  echo "$output" | grep -E '^(ok|not ok|##)' || true
  echo "database behaviour checks passed."
fi

if [[ "$KEEP" == true ]]; then
  echo "Database left running: psql -h $PGRUN_DIR -p $PGPORT -U postgres"
fi
