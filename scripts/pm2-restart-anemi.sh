#!/usr/bin/env bash
# Rebuild changed apps and reload PM2 — your deploy loop:
#   edit code → ./scripts/pm2-restart-anemi.sh → hard refresh browser
#
# Same muscle memory as VMS: ./scripts/pm2-restart-vms.sh also runs this.
#
# Optimizations vs a full restart every time:
#   • rebuild only backend OR frontend when the other side did not change
#   • build both in parallel when both changed
#   • skip prisma generate/migrate when schema is unchanged
#   • pm2 reload instead of delete + kill ports + start
#
# Optional env:
#   ANEMI_FORCE_REBUILD=1   rebuild both apps even if sources look unchanged
#   ANEMI_BUILD=backend     only rebuild backend (then reload PM2)
#   ANEMI_BUILD=frontend    only rebuild frontend (then reload PM2)
#   ANEMI_BUILD=all         rebuild both (default, still skips unchanged sides unless forced)
#   VMS_FORCE_REBUILD / VMS_BUILD are accepted as aliases.
#
# Run from repo root: ./scripts/pm2-restart-anemi.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export NPM_CONFIG_LOGLEVEL="${NPM_CONFIG_LOGLEVEL:-warn}"

# DO NOT source any .env here. PM2 inherits the shell env, and a leaked
# PORT from backend/.env would make Next.js bind to the API port.
unset PORT HOST

BACKEND_PORT=4100
FRONTEND_PORT=3100
ANEMI_BUILD="${ANEMI_BUILD:-${VMS_BUILD:-all}}"
ANEMI_FORCE_REBUILD="${ANEMI_FORCE_REBUILD:-${VMS_FORCE_REBUILD:-}}"

echo "[pm2-restart-anemi] repo: $ROOT"

ensure_node_path() {
  if command -v npm >/dev/null 2>&1 && command -v pm2 >/dev/null 2>&1; then
    return 0
  fi
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
  fi
  if command -v npm >/dev/null 2>&1 && command -v pm2 >/dev/null 2>&1; then
    return 0
  fi
  local latest
  latest="$(find "${NVM_DIR:-$HOME/.nvm}/versions/node" -maxdepth 1 -type d -name 'v*' 2>/dev/null \
    | sort -V | tail -1)"
  if [[ -n "$latest" && -x "${latest}/bin/npm" ]]; then
    PATH="${latest}/bin:$PATH"
    export PATH
  fi
  if ! command -v npm >/dev/null 2>&1; then
    echo "[pm2-restart-anemi] ERROR: npm not in PATH. Install Node or NVM for user $(whoami)." >&2
    exit 1
  fi
  if ! command -v pm2 >/dev/null 2>&1; then
    echo "[pm2-restart-anemi] ERROR: pm2 not in PATH. Run: npm install -g pm2 (as $(whoami))." >&2
    exit 1
  fi
}

pm2_app_online() {
  pm2 describe "$1" >/dev/null 2>&1
}

any_path_newer_than() {
  local marker="$1"
  shift
  [[ -e "$marker" ]] || return 0
  find "$@" -type f -newer "$marker" -print -quit 2>/dev/null | grep -q .
}

needs_backend_build() {
  if [[ "${ANEMI_FORCE_REBUILD}" == "1" ]]; then
    return 0
  fi
  if [[ "$ANEMI_BUILD" == "frontend" ]]; then
    return 1
  fi
  if [[ "$ANEMI_BUILD" == "backend" ]]; then
    return 0
  fi
  local marker="$ROOT/backend/dist/main.js"
  [[ -f "$marker" ]] || return 0
  any_path_newer_than "$marker" \
    "$ROOT/backend/src" \
    "$ROOT/backend/prisma/schema.prisma" \
    "$ROOT/backend/prisma/migrations" \
    "$ROOT/backend/tsconfig.build.json" \
    "$ROOT/backend/tsconfig.json" \
    "$ROOT/backend/nest-cli.json" \
    "$ROOT/backend/package.json" \
    "$ROOT/package.json" \
    "$ROOT/package-lock.json"
}

needs_frontend_build() {
  if [[ "${ANEMI_FORCE_REBUILD}" == "1" ]]; then
    return 0
  fi
  if [[ "$ANEMI_BUILD" == "backend" ]]; then
    return 1
  fi
  if [[ "$ANEMI_BUILD" == "frontend" ]]; then
    return 0
  fi
  local marker="$ROOT/frontend/.next/BUILD_ID"
  [[ -f "$marker" ]] || return 0
  any_path_newer_than "$marker" \
    "$ROOT/frontend/src" \
    "$ROOT/frontend/public" \
    "$ROOT/frontend/.env.local" \
    "$ROOT/frontend/next.config.ts" \
    "$ROOT/frontend/postcss.config.mjs" \
    "$ROOT/frontend/tsconfig.json" \
    "$ROOT/frontend/package.json" \
    "$ROOT/package.json" \
    "$ROOT/package-lock.json"
}

needs_prisma() {
  if [[ "${ANEMI_FORCE_REBUILD}" == "1" ]]; then
    return 0
  fi
  local marker="$ROOT/backend/dist/main.js"
  [[ -f "$marker" ]] || return 0
  any_path_newer_than "$marker" \
    "$ROOT/backend/prisma/schema.prisma" \
    "$ROOT/backend/prisma/migrations"
}

# Repair build dirs left root-owned by old root-PM2 builds. Only escalates when
# a file is genuinely not owned by the current user, and uses non-interactive
# `sudo -n` so a normal deploy NEVER blocks on a password prompt.
fix_ownership() {
  local me target
  me="$(id -un)"
  for target in "$@"; do
    [[ -e "$target" ]] || continue
    if find "$target" ! -user "$me" -print -quit 2>/dev/null | grep -q .; then
      if sudo -n true 2>/dev/null; then
        sudo chown -R "${me}:${me}" "$@" 2>/dev/null || true
      else
        echo "[pm2-restart-anemi] NOTE: some files under $(pwd) are not owned by ${me}." >&2
        echo "[pm2-restart-anemi]       Run once: sudo chown -R ${me}:${me} ${ROOT}" >&2
      fi
      return 0
    fi
  done
}

run_prisma() {
  echo "[pm2-restart-anemi] prisma generate + migrate..."
  cd "$ROOT/backend"
  npm run db:generate
  npm run db:migrate
}

build_backend() {
  echo "[pm2-restart-anemi] building backend..."
  cd "$ROOT/backend"
  fix_ownership dist node_modules
  npm run build
}

build_frontend() {
  echo "[pm2-restart-anemi] building frontend..."
  cd "$ROOT/frontend"
  fix_ownership .next .next-prod node_modules
  npm run build
}

free_port() {
  local p="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${p}/tcp" >/dev/null 2>&1 || true
  fi
}

port_busy() {
  local p="$1"
  ss -ltn "( sport = :${p} )" 2>/dev/null | grep -q ":${p}\\b"
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local i
  for i in $(seq 1 20); do
    if curl -sf -o /dev/null "$url" 2>/dev/null; then
      echo "[pm2-restart-anemi] ${label} ready (${url})"
      return 0
    fi
    sleep 0.5
  done
  echo "[pm2-restart-anemi] WARN: ${label} not responding yet at ${url}" >&2
  return 1
}

ensure_node_path

BUILD_BACKEND=false
BUILD_FRONTEND=false
if needs_backend_build; then BUILD_BACKEND=true; fi
if needs_frontend_build; then BUILD_FRONTEND=true; fi

if [[ "$BUILD_BACKEND" == false && "$BUILD_FRONTEND" == false ]]; then
  echo "[pm2-restart-anemi] no source changes detected — skipping build (use ANEMI_FORCE_REBUILD=1 to force)"
else
  echo "[pm2-restart-anemi] rebuild plan: backend=$BUILD_BACKEND frontend=$BUILD_FRONTEND"
  SECONDS=0
  if [[ "$BUILD_BACKEND" == true ]] && needs_prisma; then
    run_prisma
  fi
  if [[ "$BUILD_BACKEND" == true && "$BUILD_FRONTEND" == true ]]; then
    build_backend &
    be_pid=$!
    build_frontend &
    fe_pid=$!
    wait "$be_pid"
    wait "$fe_pid"
  elif [[ "$BUILD_BACKEND" == true ]]; then
    build_backend
  else
    build_frontend
  fi
  echo "[pm2-restart-anemi] build finished in ${SECONDS}s"
fi

cd "$ROOT"

ECOSYSTEM="$ROOT/deploy/ecosystem.config.cjs"
if [[ ! -f "$ECOSYSTEM" ]]; then
  echo "[pm2-restart-anemi] ERROR: missing $ECOSYSTEM" >&2
  exit 1
fi

PM2_ONLINE=false
if pm2_app_online anemi-backend && pm2_app_online anemi-frontend; then
  PM2_ONLINE=true
fi

if [[ "$PM2_ONLINE" == true ]]; then
  echo "[pm2-restart-anemi] reloading PM2 apps..."
  pm2 reload anemi-backend --update-env
  pm2 reload anemi-frontend --update-env
else
  echo "[pm2-restart-anemi] PM2 apps not running — freeing ports and starting fresh..."
  free_port "$BACKEND_PORT"
  free_port "$FRONTEND_PORT"
  sleep 0.5
  if port_busy "$BACKEND_PORT" || port_busy "$FRONTEND_PORT"; then
    echo "[pm2-restart-anemi] ports still busy on ${BACKEND_PORT}/${FRONTEND_PORT}." >&2
    exit 1
  fi
  pm2 start "$ECOSYSTEM" --update-env
fi

pm2 save

wait_for_http "http://127.0.0.1:${BACKEND_PORT}/health" "backend" || true
wait_for_http "http://127.0.0.1:${FRONTEND_PORT}/" "frontend" || true

echo "[pm2-restart-anemi] status:"
pm2 status

echo "[pm2-restart-anemi] done — hard refresh the browser (Ctrl+Shift+R) to see UI changes."
