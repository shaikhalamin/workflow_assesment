#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
ASSUME_YES=0

usage() {
  printf 'Usage: %s [--yes]\n' "$0"
  printf '\n'
  printf 'Clears all public tables except users, roles, permissions,\n'
  printf 'user_roles, role_permissions, departments, and typeorm_migrations.\n'
  printf '\n'
  printf 'Set DATABASE_URL in the environment or in %s.\n' "$ENV_FILE"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -y | --yes)
      ASSUME_YES=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "${DATABASE_URL:-}" && -f "$ENV_FILE" ]]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  printf 'DATABASE_URL is required. Export it or add it to %s.\n' "$ENV_FILE" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  printf 'psql is required but was not found in PATH.\n' >&2
  exit 1
fi

mapfile -t TABLES_TO_CLEAR < <(
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At <<'SQL'
SELECT quote_ident(schemaname) || '.' || quote_ident(tablename)
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    'users',
    'roles',
    'permissions',
    'user_roles',
    'role_permissions',
    'departments',
    'typeorm_migrations'
  )
ORDER BY tablename;
SQL
)

if [[ ${#TABLES_TO_CLEAR[@]} -eq 0 ]]; then
  printf 'No tables found to clear.\n'
  exit 0
fi

printf 'Tables to clear:\n'
printf '  %s\n' "${TABLES_TO_CLEAR[@]}"
printf '\nPreserved tables:\n'
printf '  %s\n' users roles permissions user_roles role_permissions departments typeorm_migrations

if [[ "$ASSUME_YES" -ne 1 ]]; then
  printf '\nType YES to truncate these tables: '
  read -r CONFIRMATION
  if [[ "$CONFIRMATION" != "YES" ]]; then
    printf 'Aborted.\n'
    exit 0
  fi
fi

TABLE_LIST="$(IFS=,; printf '%s' "${TABLES_TO_CLEAR[*]}")"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v table_list="$TABLE_LIST" <<'SQL'
TRUNCATE TABLE :table_list RESTART IDENTITY;
SQL

printf 'Data cleared successfully.\n'
