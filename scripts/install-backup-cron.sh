#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

line='15 3 * * * cd /var/www/anemi && /usr/bin/npm run backup >> /var/www/anemi/data/backups/cron.log 2>&1'
mkdir -p data/backups
existing=$(crontab -l 2>/dev/null || true)
if echo "$existing" | grep -Fq "anemi && /usr/bin/npm run backup"; then
  echo "Daily Anemi DB backup cron is already installed."
  exit 0
fi
{
  echo "$existing"
  echo "$line"
} | grep -v '^$' | crontab -
echo "Installed daily DB backup at 03:15 (media not included)."
echo "For media too, edit the cron line to: npm run backup:media"
