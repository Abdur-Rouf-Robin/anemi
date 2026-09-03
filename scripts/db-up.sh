#!/usr/bin/env bash
# Start Anemi data services. Prefer Docker. If the socket is locked,
# tell the user how to create a separate host Postgres cluster (not VMS).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if docker info >/dev/null 2>&1; then
  exec docker compose up -d postgres redis minio
fi

if ss -lnt 2>/dev/null | grep -q ':5434'; then
  echo "[anemi] Postgres already listening on 5434. Skip docker."
  exit 0
fi

echo "[anemi] Docker is not usable from this user (docker.sock permission)."
echo "[anemi] VMS Postgres on 5432 is left alone."
echo
echo "Create Anemi's own cluster (one-time, needs sudo):"
echo "  sudo $ROOT/scripts/setup-host-db.sh"
echo
echo "Then:"
echo "  npm run db:migrate"
echo "  npm run db:seed"
exit 1
