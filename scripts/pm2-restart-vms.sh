#!/usr/bin/env bash
# Alias so the VMS deploy command works from this repo too.
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/pm2-restart-anemi.sh" "$@"
