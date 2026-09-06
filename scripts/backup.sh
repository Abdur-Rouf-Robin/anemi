#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f backend/.env ]]; then
  echo "backend/.env is missing."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source backend/.env
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set."
  exit 1
fi

stamp=$(date +%Y%m%d-%H%M%S)
dest="data/backups/${stamp}"
mkdir -p "$dest"

if command -v pg_dump >/dev/null; then
  pg_dump "$DATABASE_URL" --no-owner --format=custom --file="${dest}/anemi.dump"
else
  echo "pg_dump not found. Install postgresql-client and retry."
  exit 1
fi

media="${MEDIA_ROOT:-data/media}"
if [[ "${BACKUP_MEDIA:-0}" == "1" && -d "$media" ]]; then
  mkdir -p "${dest}/media"
  rsync -a "$media/" "${dest}/media/"
  echo "Media copied with rsync."
else
  echo "Skipped media (set BACKUP_MEDIA=1 or run npm run backup:media)."
fi

echo "Backup written to ${dest}"
echo "Restore:"
echo "  pg_restore --clean --if-exists --no-owner --dbname=\"\$DATABASE_URL\" ${dest}/anemi.dump"
echo "  rsync -a ${dest}/media/ ${media}/"
