// Trivial no-dependency function to confirm Vercel is building /api functions.
// Visit /api/ping -> should return {"ok":true,"ping":"pong"}.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ ok: true, ping: 'pong' });
}
