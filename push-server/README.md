# Mini Shorts push notifications — Vercel setup

This sends a push ("New on Mini Shorts: …") to every app user whenever a new
ZoltMoney blog post is published.

On Vercel it runs as **serverless functions** (in `api/`) with **Upstash Redis**
for storage (both free). A free external cron pings the check endpoint every
5 minutes.

## Endpoints
- `POST /api/register` — the app calls this on startup to save its push token.
- `GET  /api/check?key=SECRET` — polls the blog; notifies on a new post. Trigger every ~5 min.
- `GET  /api` — health/status.

---

## 1. Deploy on Vercel
- New Project → import your repo → **Root Directory: `push-server`**.
- **Framework Preset: Other** (not Express).
- Build Command: none · Output Directory: none · Install Command: `npm install`.
- Deploy. You'll get a URL like `https://push-server-xxxx.vercel.app`.

## 2. Add free storage (Upstash Redis)
- In your Vercel project → **Storage** tab → **Marketplace → Upstash → Redis** → create a free database and connect it to this project.
- This auto-adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars.
- (Manual alt: create a DB at upstash.com and paste those two values into Vercel → Settings → Environment Variables.)

## 3. Add a secret (protects the check endpoint)
- Vercel → project → **Settings → Environment Variables** → add
  `CRON_SECRET` = any long random string (e.g. `ms_9f3k2p...`).
- **Redeploy** after adding env vars so they take effect.

## 4. Run the 5-minute check (free external cron)
Vercel Hobby crons only run once/day, so use a free pinger for 5-min checks:
- Go to **https://cron-job.org** → create a free account → **Create cronjob**.
- URL: `https://YOUR-URL.vercel.app/api/check?key=YOUR_CRON_SECRET`
- Schedule: every 5 minutes. Save + enable.

(A once-daily Vercel cron is already configured in `vercel.json` as a backup.)

## 5. Point the app at this server
- In `src/utils/push.ts`, set:
  `export const PUSH_SERVER: string = 'https://YOUR-URL.vercel.app';`
- Rebuild the dev build:
  `npx eas build --profile development --platform android`
- Install it. Devices now register automatically on launch.

## Test it
- Open `https://YOUR-URL.vercel.app/api` → should show `tokens` count rising after you open the app on a device.
- Publish a test post on ZoltMoney → within ~5 min every device gets the alert.
- First check just sets a baseline (no alert); alerts start from the next new post.

---

`index.js` is the original always-on version (for hosts like Render/Railway).
Vercel uses the `api/` functions and ignores it.
