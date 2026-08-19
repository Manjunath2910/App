// ─── ZoltMoney blogs (WordPress REST API) ─────────────────────────────────────
// Primary: fetch with the body in small batches → fuller summaries + full text.
// Fallback: a light fetch (title + excerpt + image) so blogs always load even
// when a web proxy can't handle the bigger responses. New posts appear
// automatically (fetched newest-first on every load / refresh).
import { Platform } from 'react-native';

import { fallbackImage } from './liveFeeds';
import type { Article } from './news';

const WP = 'https://blogs.getpanda.money/wp-json/wp/v2/posts';

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
  const summary = firstWords(full || excerpt, 60) || excerpt || stripHtml(p?.title?.rendered || '');
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
    publishedAt: p?.date || new Date().toISOString(),
    accent: '#A21563',
  };
}

export async function fetchBlogs(): Promise<Article[]> {
  // Light fetch (title + excerpt + image) — small, fast, reliable. Loads every
  // post; the reader shows this short summary. New posts appear automatically.
  const posts = await fetchList('id,link,date,title,excerpt,jetpack_featured_media_url', 6, 100);
  return posts.map((p) => toArticle(p, '')).filter((a) => a.title);
}

// Full article body for one blog (used by the reader if the list came light).
export async function fetchBlogContent(blogId: string): Promise<string> {
  const numeric = blogId.replace('blog-', '');
  const json = await getJson(`${WP}/${numeric}?_fields=content`);
  return stripHtml(json?.content?.rendered || '');
}
