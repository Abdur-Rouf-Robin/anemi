# Anemi

Watch app for **your own or licensed** video. YouTube-simple UX: search, tap, play. Not a HiAnime clone and not a scraper.

## Layout

```
frontend/   Next.js 16 · Tailwind 4
backend/    NestJS 11 · Prisma 7 · PostgreSQL
```

Ports stay off VMS: UI `3100`, API `4100`, Postgres `5434`. Media files live in `data/media`. Do not point Anemi at VMS Redis (`6379`).

## Run

```bash
cd /var/www/anemi
cp .env.example backend/.env
cp .env.example frontend/.env.local
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:backend
npm run dev:frontend
```

Open http://127.0.0.1:3100

First seed creates `admin@anemi.local`. Change that password and turn on MFA before anyone else uses the box. Seed does not reset an existing admin password.

## What it does

- Home rails, search, browse chips (type / status / genre)
- Title seasons, watch player (MP4 or HLS), skip intro, next episode
- Library: continue, watch later, follow, history
- Comments on watch
- Account: profile, password, MFA (required for staff before CMS)
- Admin: titles, seasons, episode upload/encode jobs, posters/backdrops, newsletter, contact inbox, users
- Guest settings (player + theme + English/日本語) stored on the device; signed-in users sync to the account
- Sentry only if `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` is set

Without `ffmpeg`, uploads are served as the original file. Encode jobs are stored and resumed if the API restarts. Install ffmpeg for HLS.

To send the footer newsletter, set `SMTP_HOST` (or `SMTP_URL`) in `backend/.env`, then use **Admin → Newsletter**. Turn on weekly schedule mail under **Admin → Site**.

`GET /health` reports database, media folder, ffmpeg, and SMTP.

## Player

Custom watch chrome (not the browser bar): play/pause, seek, volume, ±10s, prev/next, Sub/Dub (keeps place), captions, speed, HLS quality, skip intro, next-episode countdown, theater, picture-in-picture, fullscreen, and keyboard shortcuts (`?` in the player).

Upload a `.vtt` on an episode in admin to turn captions on. Sub and Dub are separate episode files of the same number.

## Go live

1. Put a long random `JWT_SECRET` (32+ chars). Generate one with `bash scripts/gen-secret.sh`. Set your public origin in `CORS_ORIGINS`.
2. Set `NEXT_PUBLIC_WS_URL` to the public origin so Watch Together sockets work (defaults to `http://127.0.0.1:4100` only when the UI is on port 3100).
3. Install ffmpeg. Put Caddy or nginx in front (`deploy/Caddyfile` or `deploy/nginx.conf.example`) so the site is HTTPS.
4. `bash scripts/prod.sh` then start API + UI with `NODE_ENV=production`. Production builds do not fall back to the demo catalog if the API is down.
5. Sign in, open `/account`, change the admin password (10+ characters with a letter and a number). Staff must keep MFA on to use `/admin`.
6. Upload files you own or license in `/admin/titles`. Seed no longer attaches W3C demo trailers; episodes without a file show “No file yet.”
7. `npm run backup` (Postgres dump + `data/media`). Run it on a schedule.

Do not ship with the first-seed admin password.
