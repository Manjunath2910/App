// ─── ZoltMoney blogs (WordPress REST API) ─────────────────────────────────────
// Light list fetch (title + excerpt + image) so every post loads fast and
// reliably; the full article body is fetched on demand when a blog is opened.
// New posts appear automatically (fetched newest-first on every load / refresh).
import { Platform } from 'react-native';

import { fallbackImage } from './liveFeeds';
import type { Article } from './news';

const WP = 'https://blogs.getpanda.money/wp-json/wp/v2/posts';
const LIST_FIELDS = 'id,link,date,title,excerpt,jetpack_featured_media_url';

// On web the browser blocks cross-site requests; try a couple of proxies.
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

async function getPage(page: number, perPage: number): Promise<any[]> {
  const json = await getJson(`${WP}?per_page=${perPage}&page=${page}&_fields=${LIST_FIELDS}`);
  return Array.isArray(json) ? json : [];
}

// Fetch every page (all languages) and keep them all.
export async function fetchBlogs(pages = 6, perPage = 100): Promise<Article[]> {
  const results = await Promise.all(Array.from({ length: pages }, (_, i) => getPage(i + 1, perPage)));
  const all = results.flat().filter((p: any) => p && p.id);
  const seen = new Set<number>();
  const uniq = all.filter((p: any) => (seen.has(p.id) ? false : seen.add(p.id)));
  return uniq
    .map((p: any) => {
      const summary = stripHtml(p?.excerpt?.rendered || '') || stripHtml(p?.title?.rendered || '');
      return {
        id: `blog-${p.id}`,
        category: 'Blogs' as const,
        title: stripHtml(p?.title?.rendered || ''),
        summary,
        content: summary, // replaced with the full body when opened
        imageUrl: p?.jetpack_featured_media_url || fallbackImage('Digital'),
        source: 'ZoltMoney',
        author: 'ZoltMoney',
        url: typeof p?.link === 'string' ? p.link : 'https://zoltmoney.com/en/blogs/',
        publishedAt: p?.date || new Date().toISOString(),
        accent: '#A21563',
      } as Article;
    })
    .filter((a) => a.title);
}

// Full article body for one blog (fetched when the reader opens it).
export async function fetchBlogContent(blogId: string): Promise<string> {
  const numeric = blogId.replace('blog-', '');
  const json = await getJson(`${WP}/${numeric}?_fields=content`);
  return stripHtml(json?.content?.rendered || '');
}
