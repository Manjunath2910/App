# Market News — live news backend

Pulls real marketing articles from RSS feeds (Marketing Dive, Search Engine Land,
Social Media Today, Content Marketing Institute, HubSpot), normalises them into the
app's format, and serves them at `GET /api/news`. Cached for 10 minutes.

## Run it

```bash
cd server
npm install
npm start
```

You should see: `📰  Market News API running: http://localhost:4000/api/news`

Open http://localhost:4000/api/news in a browser to see the live JSON.

## Connect the app

The app auto-detects the backend at port 4000 on the same machine that runs Expo,
so just start the app as usual (`npx expo start`) with this server running. The Feed
will switch from the bundled stories to the live feed automatically, and the header
subtitle changes to **"Live · marketing news"**.

- On a **phone (Expo Go)**: make sure the phone and computer are on the same Wi-Fi.
  Windows may pop up a firewall prompt the first time — click **Allow access**.
- On **web**: it uses `localhost:4000`.

## Optional: AI 60-word summaries

By default, summaries come from each article's own snippet. To generate clean
60-word AI summaries instead, set an OpenAI key before starting:

```bash
# Windows PowerShell
$env:OPENAI_API_KEY="sk-...yourkey..."
npm start
```

## Add / change sources

Edit `feeds.js` — add any marketing RSS feed URL with a default category. Titles are
auto-categorised (AI, SEO, Social Media, Advertising, Branding, E-commerce, Digital).

## Deploy (later)

For the published app, host this on a free service (Render, Railway, Fly.io) and
point `API_PORT`/host in `src/config.ts` at the deployed URL.
