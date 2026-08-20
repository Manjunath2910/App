// GET /api/check?key=YOUR_SECRET
// Polls the ZoltMoney blog for the newest post; if it's new since last time,
// sends an Expo push to every registered token. Trigger this every ~5 min with
// a free external cron (cron-job.org) or Vercel Cron. Safe to call repeatedly.
import { redis, redisConfigured } from './_redis.js';

const BLOG_URL =
  'https://blogs.getpanda.money/wp-json/wp/v2/posts?per_page=1&_fields=id,title,link';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

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
    .replace(/<[^>]*>/g, '')
    .trim();
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function sendPush(tokens, title, link) {
  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title: 'New on Mini Shorts',
    body: title,
    data: { url: link },
  }));
  const dead = [];
  for (const batch of chunk(messages, EXPO_BATCH_SIZE)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      const json = await res.json().catch(() => null);
      const tickets = json && Array.isArray(json.data) ? json.data : [];
      tickets.forEach((ticket, i) => {
        if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
          const t = batch[i]?.to;
          if (t) dead.push(t);
        }
      });
    } catch {
      // ignore batch failure
    }
  }
  return dead;
}

export default async function handler(req, res) {
  // Optional protection: if CRON_SECRET is set, require it via ?key= or Bearer.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const key = req.query?.key;
    const auth = req.headers?.authorization;
    if (key !== secret && auth !== `Bearer ${secret}`) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
  }
  if (!redisConfigured()) {
    return res.status(500).json({ ok: false, error: 'Storage not configured' });
  }

  try {
    const r = await fetch(BLOG_URL, { headers: { Accept: 'application/json' } });
    if (!r.ok) return res.status(502).json({ ok: false, error: `Blog HTTP ${r.status}` });
    const posts = await r.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      return res.json({ ok: true, note: 'no posts' });
    }

    const newest = posts[0];
    const newestId = Number(newest.id);

    const lastRes = await redis(['GET', 'lastPostId']);
    const lastPostId = lastRes?.result != null ? Number(lastRes.result) : null;

    // First ever run: baseline, don't notify.
    if (lastPostId === null || Number.isNaN(lastPostId)) {
      await redis(['SET', 'lastPostId', String(newestId)]);
      return res.json({ ok: true, baseline: newestId });
    }

    if (newestId > lastPostId) {
      const title = cleanTitle(newest.title?.rendered ?? newest.title);
      const membersRes = await redis(['SMEMBERS', 'tokens']);
      const tokens = Array.isArray(membersRes?.result) ? membersRes.result : [];
      const dead = tokens.length ? await sendPush(tokens, title, newest.link) : [];
      for (const t of dead) await redis(['SREM', 'tokens', t]);
      await redis(['SET', 'lastPostId', String(newestId)]);
      return res.json({ ok: true, notified: tokens.length - dead.length, post: newestId });
    }

    return res.json({ ok: true, upToDate: lastPostId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
