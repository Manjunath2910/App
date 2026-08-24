// ─── Live news fetch ──────────────────────────────────────────────────────────
// Primary: fetch marketing RSS feeds directly in the app (works on real devices,
// no server or extra packages needed). Fallback: an optional backend at API_URL.
import { Platform } from 'react-native';

import { API_URL } from '@/config';
import { ACCENTS, detectCategory, fallbackImage, FEEDS, isMarketing, type Feed } from './liveFeeds';
import type { Article } from './news';

// On the web preview the browser blocks cross-site RSS (CORS); route through a
// read-only proxy there (try a few for reliability). On a real phone we fetch
// the feed directly — no proxy, so images and text are always the originals.
const WEB_PROXIES = [
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
];

function feedCandidates(url: string): string[] {
  return Platform.OS === 'web' ? WEB_PROXIES.map((p) => p(url)) : [url];
}

async function fetchWithTimeout(url: string, ms = 12000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

// ── Tiny dependency-free RSS/Atom helpers ──
function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;|&apos;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function tagText(block: string, name: string): string {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(block);
  return m ? decodeEntities(stripCdata(m[1])).trim() : '';
}

function tagAttr(block: string, name: string, attr: string): string {
  const m = new RegExp(`<${name}\\b[^>]*\\b${attr}=["']([^"']+)["']`, 'i').exec(block);
  return m ? m[1] : '';
}

function blocks(xml: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[0]);
  return out;
}

function words60(text: string): string {
  const clean = String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const w = clean.split(' ').filter(Boolean);
  return w.length <= 110 ? clean : w.slice(0, 110).join(' ') + '…';
}

// Detect an embedded video (YouTube / Vimeo) inside the article HTML.
function detectVideo(block: string): { videoUrl: string; thumb?: string } | null {
  const html = tagText(block, 'content:encoded') || tagText(block, 'description') || tagText(block, 'content') || block;
  const yt = /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{11})/i.exec(html);
  if (yt) return { videoUrl: `https://www.youtube.com/watch?v=${yt[1]}`, thumb: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` };
  const vim = /player\.vimeo\.com\/video\/(\d+)|vimeo\.com\/(\d+)/i.exec(html);
  if (vim) return { videoUrl: `https://vimeo.com/${vim[1] || vim[2]}` };
  return null;
}

function pickImage(block: string, category: string): string {
  // Prefer the publisher's own image: media:content / media:thumbnail / enclosure,
  // then the first <img> inside the article HTML, then a category fallback.
  const media =
    tagAttr(block, 'media:content', 'url') ||
    tagAttr(block, 'media:thumbnail', 'url') ||
    tagAttr(block, 'enclosure', 'url');
  if (media) return decodeEntities(media);
  // Some feeds (e.g. Digiday) use a plain <image>URL</image> element per item.
  const imageTag = tagText(block, 'image').trim();
  if (/^https?:\/\/\S+\.(jpg|jpeg|png|webp|gif)/i.test(imageTag)) return decodeEntities(imageTag);
  const html = tagText(block, 'content:encoded') || tagText(block, 'description') || tagText(block, 'content');
  const m = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  if (m) return decodeEntities(m[1]);
  return fallbackImage(category);
}

function parseFeed(xml: string, feed: Feed): Article[] {
  const isAtom = /<entry[\s>]/i.test(xml) && !/<item[\s>]/i.test(xml);
  const itemBlocks = blocks(xml, isAtom ? 'entry' : 'item').slice(0, feed.limit);
  const out: Article[] = [];
  for (const block of itemBlocks) {
    const title = tagText(block, 'title');
    const link = isAtom ? tagAttr(block, 'link', 'href') : tagText(block, 'link') || tagText(block, 'guid');
    if (!title || !link) continue;
    const raw = tagText(block, 'content:encoded') || tagText(block, 'description') || tagText(block, 'summary') || tagText(block, 'content');
    if (!feed.trusted && !isMarketing(title, raw)) continue;
    const category = detectCategory(title, feed.category);
    const summary = words60(raw) || title;
    const video = detectVideo(block);
    out.push({
      id: tagText(block, 'guid') || link,
      category,
      title,
      summary,
      content: summary,
      imageUrl: video?.thumb || pickImage(block, category),
      source: feed.source,
      author: tagText(block, 'dc:creator') || tagText(block, 'author') || feed.source,
      url: link,
      publishedAt: tagText(block, 'pubDate') || tagText(block, 'published') || tagText(block, 'updated') || new Date().toISOString(),
      accent: ACCENTS[category] || ACCENTS.Digital,
      ...(video ? { videoUrl: video.videoUrl } : {}),
    });
  }
  return out;
}

async function loadFeed(feed: Feed): Promise<Article[]> {
  for (const url of feedCandidates(feed.url)) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) continue;
      const xml = await res.text();
      const arts = parseFeed(xml, feed);
      if (arts.length) return arts;
    } catch {
      // try the next proxy / fall through
    }
  }
  return [];
}

function ts(a: Article): number {
  const t = new Date(a.publishedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

async function fetchDirectRss(): Promise<Article[]> {
  const results = await Promise.allSettled(FEEDS.map(loadFeed));
  const items: Article[] = [];
  for (const r of results) if (r.status === 'fulfilled') items.push(...r.value);
  const seen = new Set<string>();
  const unique = items.filter((a) => (seen.has(a.url) ? false : seen.add(a.url)));
  unique.sort((a, b) => ts(b) - ts(a));
  return unique;
}

async function fetchFromBackend(): Promise<Article[]> {
  const res = await fetch(`${API_URL}/api/news`, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const json = await res.json();
  const arr: any[] = Array.isArray(json?.articles) ? json.articles : [];
  return arr.filter(
    (a) => a && typeof a.id === 'string' && a.title && a.category && a.imageUrl && a.url,
  ) as Article[];
}

export async function fetchNews(): Promise<Article[]> {
  // 1) Direct RSS — the always-on source for the published app.
  try {
    const direct = await fetchDirectRss();
    if (direct.length) return direct;
  } catch {
    // fall through to backend
  }
  // 2) Optional local/deployed backend.
  try {
    return await fetchFromBackend();
  } catch {
    return [];
  }
}
