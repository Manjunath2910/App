/**
 * Mini Shorts / ZoltMoney push-notification server
 * ------------------------------------------------
 * A tiny, dependency-light Express service that:
 *
 *   1. Lets mobile devices register their Expo push token via `POST /register`.
 *   2. Polls the ZoltMoney WordPress blog every few minutes for the newest post.
 *   3. When a brand-new post appears, sends an Expo push notification to every
 *      registered device.
 *
 * State (registered tokens + last-seen post id) is persisted to `data.json`
 * in this same folder so it survives restarts. The file is read on startup and
 * rewritten whenever something changes. Missing/corrupt files are handled
 * gracefully (we just start from an empty state).
 *
 * Requires Node 18+ (uses the built-in global `fetch`). The only npm
 * dependency is `express`.
 *
 * PORT is read from the environment (`process.env.PORT`) so it works out of the
 * box on hosts like Render and Railway, which inject PORT automatically. It
 * falls back to 4000 for local development.
 */

import express from 'express';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, 'data.json');

// Newest post from the ZoltMoney WordPress blog (only the fields we need).
const BLOG_URL =
  'https://blogs.getpanda.money/wp-json/wp/v2/posts?per_page=1&_fields=id,title,link';

// Expo push endpoint + limits.
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100; // Expo accepts at most 100 messages per request.

const POLL_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
const STARTUP_DELAY_MS = 10 * 1000; // first check ~10s after startup

// ---------------------------------------------------------------------------
// Persistent state
// ---------------------------------------------------------------------------

/** @type {{ tokens: string[], lastPostId: number | null }} */
let state = { tokens: [], lastPostId: null };

function loadState() {
  try {
    const raw = readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    state = {
      tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [],
      lastPostId:
        typeof parsed.lastPostId === 'number' ? parsed.lastPostId : null,
    };
    console.log(
      `[state] Loaded ${state.tokens.length} token(s), lastPostId=${state.lastPostId}`
    );
  } catch (err) {
    // Missing or corrupt file -> start fresh. Not fatal.
    console.log('[state] No valid data.json found, starting with empty state.');
    state = { tokens: [], lastPostId: null };
  }
}

function saveState() {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[state] Failed to write data.json:', err);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Does this string look like a valid Expo push token? */
function isExpoPushToken(token) {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') ||
      token.startsWith('ExpoPushToken['))
  );
}

/** Turn a WordPress "rendered" title into clean, plain text for a notification. */
function cleanTitle(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '') // strip any HTML tags
    .trim();
}

/** Split an array into fixed-size chunks. */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/** Remove a token from storage (e.g. when Expo reports it's no longer valid). */
function removeToken(token) {
  const before = state.tokens.length;
  state.tokens = state.tokens.filter((t) => t !== token);
  if (state.tokens.length !== before) {
    console.log(`[tokens] Removed dead token ${token}`);
    saveState();
  }
}

// ---------------------------------------------------------------------------
// Expo push sending
// ---------------------------------------------------------------------------

async function sendPush(title, link) {
  if (state.tokens.length === 0) {
    console.log('[push] No registered tokens, nothing to send.');
    return;
  }

  const messages = state.tokens.map((token) => ({
    to: token,
    sound: 'default',
    title: 'New on Mini Shorts',
    body: title,
    data: { url: link },
  }));

  const batches = chunk(messages, EXPO_BATCH_SIZE);

  for (const batch of batches) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });

      const json = await res.json().catch(() => null);
      const tickets = json && Array.isArray(json.data) ? json.data : [];

      // Each ticket lines up with the message at the same index.
      tickets.forEach((ticket, i) => {
        if (
          ticket &&
          ticket.status === 'error' &&
          ticket.details &&
          ticket.details.error === 'DeviceNotRegistered'
        ) {
          const deadToken = batch[i]?.to;
          if (deadToken) removeToken(deadToken);
        }
      });

      console.log(`[push] Sent batch of ${batch.length} message(s).`);
    } catch (err) {
      console.error('[push] Failed to send batch:', err);
    }
  }
}

// ---------------------------------------------------------------------------
// Blog polling
// ---------------------------------------------------------------------------

async function checkForNewPosts() {
  try {
    const res = await fetch(BLOG_URL, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error(`[poll] Blog responded with HTTP ${res.status}`);
      return;
    }

    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      console.log('[poll] No posts returned.');
      return;
    }

    const newest = posts[0];
    const newestId = newest.id;

    // First successful check ever: remember where we are, don't notify.
    if (state.lastPostId === null) {
      state.lastPostId = newestId;
      saveState();
      console.log(`[poll] First run, baseline lastPostId=${newestId}.`);
      return;
    }

    if (newestId > state.lastPostId) {
      const title = cleanTitle(newest.title?.rendered ?? newest.title);
      console.log(`[poll] New post detected (#${newestId}): "${title}"`);
      await sendPush(title, newest.link);
      state.lastPostId = newestId;
      saveState();
    } else {
      console.log(`[poll] No new posts (latest is #${newestId}).`);
    }
  } catch (err) {
    console.error('[poll] Error checking for new posts:', err);
  }
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json());

// Simple status/health endpoint.
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    tokens: state.tokens.length,
    lastPostId: state.lastPostId,
  });
});

// Register (or re-register) an Expo push token.
app.post('/register', (req, res) => {
  const { token } = req.body ?? {};

  if (!isExpoPushToken(token)) {
    return res.status(400).json({ ok: false, error: 'Invalid Expo push token' });
  }

  if (!state.tokens.includes(token)) {
    state.tokens.push(token);
    saveState();
    console.log(`[register] Added token ${token} (total ${state.tokens.length}).`);
  }

  res.json({ ok: true, count: state.tokens.length });
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

loadState();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Push server listening on http://localhost:${PORT}`);
  console.log(`Watching blog: ${BLOG_URL}`);

  // First check shortly after startup, then on a fixed interval.
  setTimeout(checkForNewPosts, STARTUP_DELAY_MS);
  setInterval(checkForNewPosts, POLL_INTERVAL_MS);
});
