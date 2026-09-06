#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

ok=0
warn=0

pass() { echo "OK    $1"; }
fail() { echo "FAIL  $1"; ok=1; }
note() { echo "WARN  $1"; warn=1; }

if [[ -f backend/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source backend/.env
  set +a
  pass "backend/.env present"
else
  fail "backend/.env missing"
fi

jwt="${JWT_SECRET:-}"
if [[ -n "$jwt" && "$jwt" != "change-me-to-a-long-random-string" && ${#jwt} -ge 32 ]]; then
  pass "JWT_SECRET length"
else
  fail "JWT_SECRET must be 32+ random characters"
fi

if [[ "${NODE_ENV:-}" == "production" ]] || pm2 describe anemi-backend >/dev/null 2>&1; then
  pass "Anemi process manager visible"
else
  note "pm2 anemi-backend not found (ok if you are not on this host)"
fi

if curl -fsS -m 5 http://127.0.0.1:4100/health >/dev/null; then
  pass "API /health"
else
  fail "API /health on :4100"
fi

if curl -fsS -m 5 -o /dev/null http://127.0.0.1:3100/; then
  pass "UI :3100"
else
  fail "UI :3100"
fi

if curl -fsS -m 8 -o /dev/null https://anime.arrobin.com/; then
  pass "https://anime.arrobin.com"
else
  note "public origin not reachable from this host"
fi

if grep -q "internal-anemi-media" /etc/nginx/sites-available/anime 2>/dev/null; then
  pass "nginx X-Accel-Redirect location"
else
  note "nginx still has the old anime site. Run:"
  echo "      sudo cp /var/www/anemi/scripts/nginx-anime.conf /etc/nginx/sites-available/anime && sudo nginx -t && sudo systemctl reload nginx"
fi

if [[ -d "${MEDIA_ROOT:-data/media}" && -w "${MEDIA_ROOT:-data/media}" ]]; then
  pass "MEDIA_ROOT writable"
else
  fail "MEDIA_ROOT missing or not writable"
fi

if [[ -d "${MEDIA_INBOX:-data/inbox}" && -w "${MEDIA_INBOX:-data/inbox}" ]]; then
  pass "MEDIA_INBOX writable"
else
  fail "MEDIA_INBOX missing or not writable"
fi

if [[ -n "${SMTP_HOST:-}" || -n "${SMTP_URL:-}" ]]; then
  pass "SMTP configured"
else
  note "SMTP unset — invites, reset, and follower mail will not send"
fi

if command -v ffmpeg >/dev/null || [[ -n "${FFMPEG_PATH:-}" ]]; then
  pass "ffmpeg available"
else
  note "ffmpeg missing — uploads stay as the original file"
fi

latest=$(ls -1 data/backups 2>/dev/null | tail -1 || true)
if [[ -n "$latest" && -f "data/backups/${latest}/anemi.dump" ]]; then
  pass "latest DB backup ${latest}"
else
  note "no DB backup — run npm run backup"
fi

if [[ -n "${DATABASE_URL:-}" ]] && command -v psql >/dev/null; then
  playable=$(psql "$DATABASE_URL" -At -c "SELECT COUNT(*) FROM \"Episode\" WHERE \"videoUrl\" IS NOT NULL AND \"videoUrl\" <> '';" 2>/dev/null || echo "?")
  if [[ "$playable" == "0" ]]; then
    note "0 playable episodes — rsync licensed files into ${MEDIA_INBOX:-data/inbox}"
  elif [[ "$playable" != "?" ]]; then
    pass "${playable} playable episode(s)"
  fi
fi

echo
if [[ "$ok" -ne 0 ]]; then
  echo "Production check failed."
  exit 1
fi
if [[ "$warn" -ne 0 ]]; then
  echo "Stack is up. Remaining items are ops (nginx sudo, licensed files, or SMTP)."
  exit 0
fi
echo "Production check passed."
