#!/usr/bin/env bash
# Create a dedicated PostgreSQL 18 cluster for Anemi on port 5434.
# Does not touch cluster 18/main (VMS on 5432 / vms_db).
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run: sudo $0"
  exit 1
fi

if pg_lsclusters | awk '$1=="18" && $2=="anemi" { found=1 } END { exit !found }'; then
  echo "[anemi] cluster 18/anemi already exists"
  pg_ctlcluster 18 anemi start || true
else
  echo "[anemi] creating cluster 18/anemi on port 5434"
  pg_createcluster 18 anemi --port=5434 --start
fi

sudo -u postgres psql -p 5434 -d postgres -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anemi') THEN
    CREATE ROLE anemi LOGIN PASSWORD 'anemi';
  END IF;
END$$;
SQL

if ! sudo -u postgres psql -p 5434 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='anemi'" | grep -q 1; then
  sudo -u postgres psql -p 5434 -d postgres -c "CREATE DATABASE anemi OWNER anemi;"
fi

# Only on this cluster. Lets Prisma create a shadow DB later if needed.
sudo -u postgres psql -p 5434 -d postgres -c "ALTER ROLE anemi CREATEDB;"

echo "[anemi] ready: 127.0.0.1:5434 / database anemi  (VMS stays on 5432)"
pg_lsclusters
