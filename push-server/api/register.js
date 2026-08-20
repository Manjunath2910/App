// POST /api/register  { token: "ExponentPushToken[...]" }
// Stores the device's Expo push token in Upstash Redis (a set, so no dupes).
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

function isExpoPushToken(token) {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!R_URL || !R_TOKEN) {
    return res.status(500).json({ ok: false, error: 'Storage not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const token = body?.token;
  if (!isExpoPushToken(token)) {
    return res.status(400).json({ ok: false, error: 'Invalid Expo push token' });
  }

  try {
    await redis(['SADD', 'tokens', token]);
    const count = await redis(['SCARD', 'tokens']);
    return res.json({ ok: true, count: count?.result ?? null });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
