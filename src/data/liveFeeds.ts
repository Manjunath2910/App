// ─── Live marketing RSS feeds + categorisation (runs in the app) ──────────────
// The published native app fetches these directly — no server needed.
import type { Category } from './news';

export type Feed = {
  url: string;
  source: string;
  category: Exclude<Category, 'All'>;
  limit: number;
  trusted?: boolean; // dedicated marketing outlet — keep every story (skip filter)
};

// India-first marketing news, with a few global marketing outlets for breadth.
export const FEEDS: Feed[] = [
  { url: 'https://www.afaqs.com/rss', source: 'afaqs!', category: 'Advertising', limit: 25, trusted: true },
  { url: 'https://www.marketingdive.com/feeds/news/', source: 'Marketing Dive', category: 'Advertising', limit: 8, trusted: true },
  { url: 'https://digiday.com/feed/', source: 'Digiday', category: 'Digital', limit: 8, trusted: true },
  { url: 'https://www.fxstreet.com/rss/news', source: 'FXStreet', category: 'Markets', limit: 10, trusted: true },
  { url: 'https://searchengineland.com/feed', source: 'Search Engine Land', category: 'SEO', limit: 6, trusted: true },
  { url: 'https://www.socialmediatoday.com/feeds/news/', source: 'Social Media Today', category: 'Social Media', limit: 6, trusted: true },
  { url: 'https://blog.hubspot.com/marketing/rss.xml', source: 'HubSpot', category: 'Digital', limit: 5, trusted: true },
];

// Order matters: first match wins.
const KEYWORDS: [Exclude<Category, 'All'>, RegExp][] = [
  ['AI', /\b(a\.?i\.?|artificial intelligence|generative|chatgpt|\bgpt\b|llm|gemini|copilot|claude|perplexity)\b/i],
  ['E-commerce', /\b(e-?commerce|shopify|retail|shopping|checkout|dtc|online store|marketplace|amazon)\b/i],
  ['SEO', /\b(seo|search engine|serp|google search|rankings?|\bgeo\b|\baeo\b|organic search|backlink)\b/i],
  ['Social Media', /\b(tiktok|instagram|facebook|linkedin|twitter|snapchat|reels?|creator|influencer|social media|youtube|threads)\b/i],
  ['Advertising', /\b(ads?|advertis\w+|ppc|campaign|media buy\w*|programmatic|cpm|cpc)\b/i],
  ['Branding', /\b(brand\w*|rebrand|identity|logo|reputation)\b/i],
];

export function detectCategory(title: string, fallback: Exclude<Category, 'All'>): Exclude<Category, 'All'> {
  const t = title || '';
  for (const [cat, re] of KEYWORDS) if (re.test(t)) return cat;
  return fallback;
}

const MARKETING = new RegExp(
  [
    'marketing', 'market\\b', 'brand', 'advertis', '\\bads?\\b', 'campaign', 'creative',
    '\\bseo\\b', '\\bsem\\b', '\\bppc\\b', 'search engine', 'serp', 'keyword', 'backlink', '\\bgeo\\b',
    'social media', 'influencer', 'creator', 'tiktok', 'instagram', 'facebook', 'linkedin', 'youtube', 'reels?', 'threads',
    'content marketing', 'email marketing', 'newsletter', 'martech', 'adtech', 'programmatic', 'media buy',
    'e-?commerce', 'retail media', 'shopify', '\\bdtc\\b', '\\bcmo\\b', 'agency', 'analytics',
    'audience', 'engagement', 'impressions', '\\bctr\\b', '\\broi\\b', '\\bcpc\\b', '\\bcpm\\b', 'conversion',
    'google ads', 'meta ads', 'facebook ads', 'openai',
  ].join('|'),
  'i',
);

export function isMarketing(title: string, text: string): boolean {
  return MARKETING.test(`${title || ''} ${text || ''}`);
}

export const ACCENTS: Record<string, string> = {
  Digital: '#EC4899',
  'Social Media': '#E11D48',
  SEO: '#0EA5E9',
  Advertising: '#6366F1',
  Branding: '#10B981',
  AI: '#7C3AED',
  'E-commerce': '#F59E0B',
  Markets: '#16A34A',
  Blogs: '#A21563',
};

const FALLBACK: Record<string, string> = {
  Digital: 'photo-1460925895917-afdab827c52f',
  'Social Media': 'photo-1611162617213-7d7a39e9b1d7',
  SEO: 'photo-1522542550221-31fd19575a2d',
  Advertising: 'photo-1611926653458-09294b3142bf',
  Branding: 'photo-1524234107056-1c1f48f64ab8',
  AI: 'photo-1677442136019-21780ecad995',
  'E-commerce': 'photo-1441986300917-64674bd600d8',
  Markets: 'photo-1611974789855-9c2a0a7236a3',
  Blogs: 'photo-1526304640581-d334cdbbf45e',
};

export function fallbackImage(category: string): string {
  const id = FALLBACK[category] || FALLBACK.Digital;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;
}
