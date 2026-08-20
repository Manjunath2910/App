// GET /api  -> quick health/status check.
import { redis, redisConfigured } from './_redis.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!redisConfigured()) {
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
