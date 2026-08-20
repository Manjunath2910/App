// GET /api  -> quick health/status check.
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!R_URL || !R_TOKEN) {
    return res.json({ status: 'running', storage: 'not-configured' });
  }
  try {
    const count = await redis(['SCARD', 'tokens']);
    const last = await redis(['GET', 'lastPostId']);
    return res.json({
      status: 'running',
      storage: 'ok',
      tokens: count?.result ?? 0,
      lastPostId: last?.result ?? null,
    });
  } catch (err) {
    return res.json({ status: 'running', storage: 'error', error: String(err?.message || err) });
  }
}
