// Tiny Upstash Redis REST helper (no dependencies).
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel env vars.
// The Vercel "Upstash" integration adds both automatically.

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function redisConfigured() {
  return !!URL && !!TOKEN;
}

// Run one Redis command, e.g. redis(['SADD', 'tokens', 'x']) -> { result }.
export async function redis(command) {
  if (!URL || !TOKEN) throw new Error('Upstash env vars missing');
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  const json = await res.json().catch(() => ({}));
  return json; // { result: ... }
}
