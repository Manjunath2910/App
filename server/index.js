// ─── Market News API ──────────────────────────────────────────────────────────
// Pulls real marketing articles from RSS feeds, normalises them to the app's
// Article shape, and serves them at GET /api/news. Results are cached for 10 min.
// Summaries: uses the article's own snippet, or (if OPENAI_API_KEY is set) an
// AI 60-word summary. Run: npm install && npm start   →   http://localhost:4000
import cors from 'cors';
import express from 'express';
import Parser from 'rss-parser';

import { ACCENTS, detectCategory, fallbackImage, FEEDS, isMarketing } from './feeds.js';

const PORT = process.env.PORT || 4000;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const app = express();
app.use(cors());

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'MarketNews/1.0 (+https://getpanda.money)' },
  customFields: {
    item: [
      ['media:content', 'media', { keepArray: false }],
      ['media:thumbnail', 'thumb', { keepArray: false }],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

let cache = { at: 0, items: [] };

function words60(text) {
  const clean = String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const w = clean.split(' ').filter(Boolean);
  return w.length <= 60 ? clean : w.slice(0, 60).join(' ') + '…';
}

async function summarise(title, text) {
  const key = process.env.OPENAI_API_KEY;
  const base = words60(text || title);
  if (!key || !base) return base;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 140,
        messages: [
          { role: 'system', content: 'You summarise marketing news in about 60 words, neutral and factual. Return only the summary, no preamble.' },
          { role: 'user', content: `${title}\n\n${text}` },
        ],
      }),
    });
    const j = await r.json();
    return j?.choices?.[0]?.message?.content?.trim() || base;
  } catch {
    return base;
  }
}

function pickImage(item, category) {
  const fromMedia = item?.media?.$?.url || item?.thumb?.$?.url || item?.enclosure?.url;
  if (fromMedia) return fromMedia;
  const html = item?.contentEncoded || item?.content || '';
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  if (m) return m[1];
  return fallbackImage(category);
}

async function loadOneFeed(feed) {
  const parsed = await parser.parseURL(feed.url);
  const items = (parsed.items || []).slice(0, feed.limit || 8);
  const out = [];
  for (const item of items) {
    const title = (item.title || '').trim();
    if (!title || !item.link) continue;
    const raw = item.contentSnippet || item.content || item.contentEncoded || '';
    // Marketing-only: drop anything that isn't clearly about marketing.
    if (!isMarketing(title, raw)) continue;
    const category = detectCategory(title, feed.category);
    out.push({
      id: item.guid || item.link,
      category,
      title,
      summary: await summarise(title, raw),
      content: words60(raw) || title, // short body; the reader links to the full source
      imageUrl: pickImage(item, category),
      source: feed.source,
      author: item.creator || item['dc:creator'] || feed.source,
      url: item.link,
      publishedAt: item.isoDate || new Date().toISOString(),
      accent: ACCENTS[category] || ACCENTS.Digital,
    });
  }
  return out;
}

async function loadAll() {
  const results = await Promise.allSettled(FEEDS.map(loadOneFeed));
  const items = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') items.push(...r.value);
    else console.warn(`[feed failed] ${FEEDS[i].url}: ${r.reason?.message || r.reason}`);
  });
  // newest first, de-duplicate by url
  const seen = new Set();
  const unique = items.filter((a) => (seen.has(a.url) ? false : seen.add(a.url)));
  unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return unique;
}

app.get('/api/news', async (_req, res) => {
  try {
    if (Date.now() - cache.at > CACHE_TTL || cache.items.length === 0) {
      const items = await loadAll();
      if (items.length) cache = { at: Date.now(), items };
    }
    res.json({ count: cache.items.length, updatedAt: new Date(cache.at).toISOString(), articles: cache.items });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e), articles: [] });
  }
});

app.get('/', (_req, res) => res.send('Market News API — try /api/news'));

app.listen(PORT, () => {
  console.log(`\n📰  Market News API running:  http://localhost:${PORT}/api/news`);
  console.log(`    AI summaries: ${process.env.OPENAI_API_KEY ? 'ON (OpenAI)' : 'OFF (using article snippets)'}\n`);
});
