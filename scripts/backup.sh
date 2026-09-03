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

if [[ -d data/media ]]; then
  tar -C data -czf "${dest}/media.tgz" media
else
  echo "No data/media directory; skipped media archive."
fi

echo "Backup written to ${dest}"
echo "Restore:"
echo "  pg_restore --clean --if-exists --no-owner --dbname=\"\$DATABASE_URL\" ${dest}/anemi.dump"
echo "  tar -C data -xzf ${dest}/media.tgz"
