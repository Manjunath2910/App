# Mini Shorts Push Server

A tiny Node.js (Express) service that watches the ZoltMoney WordPress blog and
sends **Expo push notifications** to registered devices whenever a new blog post
is published.

## What it does

- Stores registered Expo push tokens and the last-seen post id in a local
  `data.json` file (created automatically, survives restarts).
- Polls `https://blogs.getpanda.money/wp-json/wp/v2/posts` every 5 minutes for
  the newest post (plus once ~10 seconds after startup).
- On the first successful check it just records the current newest post (so it
  doesn't blast everyone on boot). After that, any newer post triggers a push to
  every registered device.
- Removes tokens that Expo reports as `DeviceNotRegistered`.

Only dependency: `express`. Requires **Node 18+** (uses the built-in global
`fetch`).

## Run locally

```bash
npm install
npm start
```

The server listens on `http://localhost:4000` (or `PORT` if set) and logs when
it detects new posts and sends notifications.

## Endpoints

| Method | Path        | Description |
| ------ | ----------- | ----------- |
| `POST` | `/register` | Body `{ "token": "ExponentPushToken[...]" }`. Registers a device. Responds `{ ok: true, count }`. |
| `GET`  | `/`         | Status JSON: `{ status: "running", tokens, lastPostId }`. |

## Deploy free on Render

1. Push this project to a Git repo (or use Render's manual upload).
2. In Render, choose **New → Web Service** and connect the repo (or upload it).
3. Set the **Root Directory** to `push-server`.
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. Deploy. Render automatically injects the `PORT` environment variable, which
   this server already reads, so no extra configuration is needed.

**Railway** works the same way: create a new service from the repo, set the root
directory to `push-server`, and use the same build/start commands. Railway also
sets `PORT` for you.

## After deploying

1. Copy your service's public URL (e.g. `https://your-service.onrender.com`).
2. Open the app's `src/utils/push.ts` and set the `PUSH_SERVER` constant to that
   URL.

That's it. In a real build, devices call `POST /register` with their Expo push
token automatically when the app starts, so the server always has an up-to-date
list of who to notify.
