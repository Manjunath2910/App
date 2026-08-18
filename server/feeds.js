// ─── Marketing RSS feeds + category logic ─────────────────────────────────────
// Free, no API key. Add/remove feeds here anytime. Each item is auto-categorised
// from its title, falling back to the feed's default category.

export const FEEDS = [
  { url: 'https://searchengineland.com/feed', source: 'Search Engine Land', category: 'SEO', limit: 8 },
  { url: 'https://www.socialmediatoday.com/feeds/news/', source: 'Social Media Today', category: 'Social Media', limit: 8 },
  { url: 'https://www.marketingdive.com/feeds/news/', source: 'Marketing Dive', category: 'Advertising', limit: 10 },
  { url: 'https://contentmarketinginstitute.com/feed', source: 'Content Marketing Institute', category: 'Branding', limit: 6 },
  { url: 'https://blog.hubspot.com/marketing/rss.xml', source: 'HubSpot', category: 'Digital', limit: 6 },
];

// Order matters: first match wins.
const KEYWORDS = [
  ['AI', /\b(a\.?i\.?|artificial intelligence|generative|chatgpt|\bgpt\b|llm|gemini|copilot|claude|perplexity)\b/i],
  ['E-commerce', /\b(e-?commerce|shopify|retail|shopping|checkout|dtc|online store|marketplace|amazon)\b/i],
  ['SEO', /\b(seo|search engine|serp|google search|rankings?|\bgeo\b|\baeo\b|organic search|backlink)\b/i],
  ['Social Media', /\b(tiktok|instagram|facebook|linkedin|twitter|\bx\b|snapchat|reels?|creator|influencer|social media|youtube|threads)\b/i],
  ['Advertising', /\b(ads?|advertis\w+|ppc|campaign|media buy\w*|programmatic|cpm|cpc)\b/i],
  ['Branding', /\b(brand\w*|rebrand|identity|logo|reputation)\b/i],
];

export function detectCategory(title, fallback) {
  const t = title || '';
  for (const [cat, re] of KEYWORDS) if (re.test(t)) return cat;
  return fallback;
}

// Only keep stories that are clearly about marketing. All feeds are marketing
// publications, so this mainly guards against the odd off-topic item.
const MARKETING = new RegExp(
  [
    'marketing', 'market\\b', 'brand', 'advertis', '\\bads?\\b', 'campaign', 'creative',
    '\\bseo\\b', '\\bsem\\b', '\\bppc\\b', 'search engine', 'serp', 'keyword', 'backlink', '\\bgeo\\b',
    'social media', 'influencer', 'creator', 'tiktok', 'instagram', 'facebook', 'linkedin', 'youtube', 'reels?', 'threads',
    'content marketing', 'email marketing', 'newsletter', 'martech', 'adtech', 'programmatic', 'media buy',
    'e-?commerce', 'retail media', 'shopify', '\\bdtc\\b', '\\bcmo\\b', 'agency', 'analytics',
    'audience', 'engagement', 'impressions', '\\bctr\\b', '\\broi\\b', '\\bcpc\\b', '\\bcpm\\b', 'conversion',
    'google ads', 'meta ads', 'facebook ads', 'chatgpt ads', 'openai',
  ].join('|'),
  'i',
);

export function isMarketing(title, text) {
  return MARKETING.test(`${title || ''} ${text || ''}`);
}

export const ACCENTS = {
  Digital: '#EC4899',
  'Social Media': '#E11D48',
  SEO: '#0EA5E9',
  Advertising: '#6366F1',
  Branding: '#10B981',
  AI: '#7C3AED',
  'E-commerce': '#F59E0B',
};

const FALLBACK = {
  Digital: 'photo-1460925895917-afdab827c52f',
  'Social Media': 'photo-1611162617213-7d7a39e9b1d7',
  SEO: 'photo-1522542550221-31fd19575a2d',
  Advertising: 'photo-1611926653458-09294b3142bf',
  Branding: 'photo-1524234107056-1c1f48f64ab8',
  AI: 'photo-1677442136019-21780ecad995',
  'E-commerce': 'photo-1441986300917-64674bd600d8',
};

export function fallbackImage(category) {
  const id = FALLBACK[category] || FALLBACK.Digital;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;
}
