// GET /api/check?key=YOUR_SECRET
// Polls the ZoltMoney blog; if the newest post is new since last time, sends an
// Expo push to every registered token. Trigger every ~5 min with a free cron.
const R_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  const res = await fetch(R_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${R_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  return res.json();
}

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
  const results = [];
  const ids = [];
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
        results.push({ status: ticket?.status, error: ticket?.details?.error || ticket?.message });
        if (ticket?.id) ids.push(ticket.id);
        if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
          const t = batch[i]?.to;
          if (t) dead.push(t);
        }
      });
    } catch {
      // ignore batch failure
    }
  }
  return { dead, results, ids };
}

// Ask Expo whether each notification was actually delivered (receipts reveal
// FCM-level errors like MismatchSenderId / InvalidCredentials that tickets hide).
async function getReceipts(ids) {
  if (!ids?.length) return [];
  try {
    await new Promise((r) => setTimeout(r, 2500));
    const res = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const json = await res.json().catch(() => null);
    const data = json?.data || {};
    return Object.entries(data).map(([id, r]) => ({ id, status: r?.status, error: r?.details?.error || r?.message }));
  } catch (e) {
    return [{ error: String(e?.message || e) }];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const key = req.query?.key;
    const auth = req.headers?.authorization;
    if (key !== secret && auth !== `Bearer ${secret}`) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
  }
  if (!R_URL || !R_TOKEN) {
    return res.status(500).json({ ok: false, error: 'Storage not configured' });
  }

  // Wipe all registered device tokens (for a clean re-test). ?reset=1
  if (req.query?.reset === '1') {
    await redis(['DEL', 'tokens']);
    return res.json({ ok: true, reset: true, devices: 0 });
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
    const force = req.query?.force === '1' || req.query?.test === '1';

    const membersRes = await redis(['SMEMBERS', 'tokens']);
    const tokens = Array.isArray(membersRes?.result) ? membersRes.result : [];

    const lastRes = await redis(['GET', 'lastPostId']);
    const lastPostId = lastRes?.result != null ? Number(lastRes.result) : null;

    if (!force && (lastPostId === null || Number.isNaN(lastPostId))) {
      await redis(['SET', 'lastPostId', String(newestId)]);
      return res.json({ ok: true, baseline: newestId, devices: tokens.length });
    }

    // Send when there's a new post — or when ?force=1 is passed (manual test).
    if (force || newestId > lastPostId) {
      const title = cleanTitle(newest.title?.rendered ?? newest.title);
      const out = tokens.length ? await sendPush(tokens, title, newest.link) : { dead: [], results: [], ids: [] };
      for (const t of out.dead) await redis(['SREM', 'tokens', t]);
      await redis(['SET', 'lastPostId', String(newestId)]);
      // On a manual test, also fetch delivery receipts so we can see the real error.
      const receipts = force ? await getReceipts(out.ids) : undefined;
      return res.json({ ok: true, sent: tokens.length - out.dead.length, devices: tokens.length, post: newestId, forced: force, tickets: out.results, receipts });
    }

    return res.json({ ok: true, upToDate: lastPostId, devices: tokens.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
