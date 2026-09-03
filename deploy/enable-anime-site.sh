#!/usr/bin/env bash
set -euo pipefail
sudo cp /var/www/anemi/deploy/nginx-anime.site.conf /etc/nginx/sites-available/anime
sudo ln -sfn /etc/nginx/sites-available/anime /etc/nginx/sites-enabled/anime
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d anime.arrobin.com --non-interactive --agree-tos --redirect --register-unsafely-without-email
echo "https://anime.arrobin.com is live."
