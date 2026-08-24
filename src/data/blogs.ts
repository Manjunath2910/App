// ─── ZoltMoney blogs (WordPress REST API) ─────────────────────────────────────
// Primary: fetch with the body in small batches → fuller summaries + full text.
// Fallback: a light fetch (title + excerpt + image) so blogs always load even
// when a web proxy can't handle the bigger responses. New posts appear
// automatically (fetched newest-first on every load / refresh).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { fallbackImage } from './liveFeeds';
import type { Article } from './news';

const WP = 'https://blogs.getpanda.money/wp-json/wp/v2/posts';
const CACHE_KEY = 'mb:blogsCache';

const WEB_PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
];

async function getJson(url: string): Promise<any> {
  const candidates = Platform.OS === 'web' ? WEB_PROXIES.map((p) => p(url)) : [url];
  for (const u of candidates) {
    try {
      const res = await fetch(u, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const json = await res.json();
      if (json) return json;
    } catch {
      // try next
    }
  }
  return null;
}

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#8217;|&#8216;|&#039;|&apos;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// WordPress date_gmt has no timezone marker; append 'Z' so it parses as UTC.
function normDate(gmt: any): string {
  if (typeof gmt !== 'string' || !gmt) return '';
  return /[zZ]|[+-]\d\d:?\d\d$/.test(gmt) ? gmt : `${gmt}Z`;
}

function firstWords(text: string, n: number): string {
  const w = text.split(' ').filter(Boolean);
  return w.length <= n ? text : w.slice(0, n).join(' ') + '…';
}

async function fetchList(fields: string, pages: number, perPage: number): Promise<any[]> {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) => getJson(`${WP}?per_page=${perPage}&page=${i + 1}&_fields=${fields}`)),
  );
  const all = results.flatMap((r) => (Array.isArray(r) ? r : [])).filter((p: any) => p && p.id);
  const seen = new Set<number>();
  return all.filter((p: any) => (seen.has(p.id) ? false : seen.add(p.id)));
}

function toArticle(p: any, full: string): Article {
  const excerpt = stripHtml(p?.excerpt?.rendered || '');
  // A fuller summary (~110 words) — more than the tiny excerpt, but still a
  // summary, not the whole article.
  const summary = firstWords(full || excerpt, 110) || excerpt || stripHtml(p?.title?.rendered || '');
  return {
    id: `blog-${p.id}`,
    category: 'Blogs',
    title: stripHtml(p?.title?.rendered || ''),
    summary,
    content: summary, // reader shows just the short summary (not the full body)
    imageUrl: p?.jetpack_featured_media_url || fallbackImage('Digital'),
    source: 'ZoltMoney',
    author: 'ZoltMoney',
    url: typeof p?.link === 'string' ? p.link : 'https://zoltmoney.com/en/blogs/',
    // Use the UTC date (date_gmt) so "x ago" is accurate on any device. WordPress
    // returns it without a 'Z', so add one; fall back to local date/now.
    publishedAt: normDate(p?.date_gmt) || p?.date || new Date().toISOString(),
    accent: '#A21563',
  };
}

function cache(list: Article[]) {
  if (list.length) AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list.slice(0, 120))).catch(() => {});
}

// Instantly available: the last blogs we saved. Shown the moment the app opens
// (no network wait), then refreshed by the fetches below.
export async function loadCachedBlogs(): Promise<Article[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// FAST: light fetch (title + excerpt + image only) — small + quick, so blogs
// appear almost immediately on open.
export async function fetchBlogsFast(): Promise<Article[]> {
  const posts = await fetchList('id,link,date,date_gmt,title,excerpt,jetpack_featured_media_url', 3, 40);
  const list = posts.map((p) => toArticle(p, '')).filter((a) => a.title);
  cache(list);
  return list;
}

// FULLER: includes the body for ~110-word summaries. Runs in the background to
// enrich what fetchBlogsFast already showed.
export async function fetchBlogs(): Promise<Article[]> {
  let posts = await fetchList('id,link,date,date_gmt,title,excerpt,content,jetpack_featured_media_url', 4, 30);
  if (!posts.length) {
    posts = await fetchList('id,link,date,date_gmt,title,excerpt,jetpack_featured_media_url', 6, 100);
  }
  const list = posts.map((p) => toArticle(p, stripHtml(p?.content?.rendered || ''))).filter((a) => a.title);
  cache(list);
  return list;
}

// Full article body for one blog (used by the reader if the list came light).
export async function fetchBlogContent(blogId: string): Promise<string> {
  const numeric = blogId.replace('blog-', '');
  const json = await getJson(`${WP}/${numeric}?_fields=content`);
  return stripHtml(json?.content?.rendered || '');
}
