#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f backend/.env ]]; then
  echo "Copy .env.example to backend/.env and set JWT_SECRET, DATABASE_URL, and CORS_ORIGINS."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source backend/.env
set +a

if [[ -z "${JWT_SECRET:-}" || "$JWT_SECRET" == "change-me-to-a-long-random-string" || ${#JWT_SECRET} -lt 32 ]]; then
  echo "Set JWT_SECRET in backend/.env to a random string of at least 32 characters."
  exit 1
fi

export NODE_ENV=production
npm run db:generate
npm run db:migrate
npm run build

echo "Built. Start API then UI:"
echo "  NODE_ENV=production npm run start:backend"
echo "  NODE_ENV=production npm run start:frontend"
echo "Put Caddy or nginx in front (see deploy/). Then:"
echo "  1. Change the admin password and confirm MFA is on at /account"
echo "  2. Replace demo titles in /admin with files you own or license"
echo "  3. npm run backup"
if ! command -v ffmpeg >/dev/null && [[ -z "${FFMPEG_PATH:-}" ]]; then
  echo "ffmpeg is not installed. Uploads will be served as the original file until you install it."
fi
if [[ -z "${SMTP_HOST:-}" && -z "${SMTP_URL:-}" ]]; then
  echo "SMTP is unset. Newsletter send and weekly schedule mail will wait until you set SMTP_HOST or SMTP_URL."
fi
