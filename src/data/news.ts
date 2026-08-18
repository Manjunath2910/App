// ─── News data model + real marketing news ───────────────────────────────────
// These are real, published articles from Marketing Dive, Search Engine Land and
// Social Media Today. Titles, sources and links are real (the link opens the
// original article). Summaries are our own short write-ups, not copied text.
// Your own stories from myArticles.ts appear ahead of these.

import { MY_ARTICLES } from './myArticles';

export type Category =
  | 'All'
  | 'Digital'
  | 'Social Media'
  | 'SEO'
  | 'Advertising'
  | 'Branding'
  | 'AI'
  | 'E-commerce'
  | 'Markets';

export const CATEGORIES: Category[] = [
  'All',
  'Markets',
  'Digital',
  'Social Media',
  'SEO',
  'Advertising',
  'Branding',
  'AI',
  'E-commerce',
];

export type Article = {
  id: string;
  category: Exclude<Category, 'All'>;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  source: string;
  author: string;
  url: string;
  publishedAt: string;
  accent: string;
  videoUrl?: string; // set when the story is a video (shows a play button)
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;

const SAMPLE_ARTICLES: Article[] = [
  {
    id: 'r1',
    category: 'Branding',
    title: 'The best brand campaigns of H1 2026 sold honesty. Are consumers buying?',
    summary:
      'In the first half of 2026, big brands leaned hard into honesty — owning past mistakes, acknowledging how they are really perceived, and pushing back on AI hype. Marketing Dive looks at whether this candour genuinely builds trust and drives sales, or whether “authenticity” has quietly become just another campaign tactic that consumers are starting to see through.',
    content:
      'Marketing Dive reviews the standout brand work of early 2026 and finds a common thread: honesty as a positioning strategy. Brands copped to missteps, leaned into self-aware humour, and in some cases openly resisted the rush to automate everything with AI. The piece weighs whether audiences reward that transparency with loyalty and spend, or whether the tactic risks feeling performative once every brand claims to be the authentic one. Read the full analysis at the source.',
    imageUrl: img('photo-1524234107056-1c1f48f64ab8'),
    source: 'Marketing Dive',
    author: 'Marketing Dive',
    url: 'https://www.marketingdive.com/news/best-brand-campaigns-h1-2026-sold-honesty-consumers-buying/819960/',
    publishedAt: '2026-08-12T09:00:00Z',
    accent: '#10B981',
  },
  {
    id: 'r2',
    category: 'AI',
    title: '9 marketing predictions for 2026 as AI fuels polarity',
    summary:
      'Industry leaders share nine predictions for how marketing shifts in 2026, with generative AI accelerating both personalization and public backlash. Expect more AI-made creative, tighter scrutiny of authenticity, and a growing split between brands that automate aggressively and those that lean into human craft. Marketing Dive maps where budgets, talent and consumer trust are most likely to move.',
    content:
      'This Marketing Dive round-up gathers predictions from senior marketers on the year ahead. The recurring theme is polarity: AI makes hyper-personalised, high-volume creative cheap and fast, while also fuelling consumer suspicion and a counter-movement toward visibly human work. The predictions touch on measurement, talent, brand safety and how teams restructure around AI tooling. Read the full list at the source.',
    imageUrl: img('photo-1677442136019-21780ecad995'),
    source: 'Marketing Dive',
    author: 'Marketing Dive',
    url: 'https://www.marketingdive.com/news/marketing-predictions-for-2026/809124/',
    publishedAt: '2026-08-05T10:00:00Z',
    accent: '#7C3AED',
  },
  {
    id: 'r3',
    category: 'Advertising',
    title: 'How 5 brands won World Cup gold through marketing investments',
    summary:
      'Advertisers spent a combined $1.42 billion during the 2026 FIFA World Cup in the US. Marketing Dive breaks down five brands — including Coca-Cola and Adidas — that turned that spend into real results, from Coke posting its strongest volume growth in 17 years to Adidas notching record quarterly sales, and what made their tournament activations actually pay off.',
    content:
      'The 2026 World Cup, held across the US, shattered soccer viewership records and drew enormous ad spend. Marketing Dive highlights five brands whose investments delivered measurable returns. Coca-Cola credited its activation with 5% trademark volume growth in Q2 — its best in 17 years outside COVID recovery — while Adidas grew currency-neutral revenue 14% to record net sales, even after raising marketing spend. Read the full breakdown at the source.',
    imageUrl: img('photo-1522778119026-d647f0596c20'),
    source: 'Marketing Dive',
    author: 'Marketing Dive',
    url: 'https://www.marketingdive.com/news/how-5-brands-won-world-cup-gold-through-marketing-investments/826954/',
    publishedAt: '2026-08-11T14:00:00Z',
    accent: '#6366F1',
  },
  {
    id: 'r4',
    category: 'E-commerce',
    title: 'American Eagle rebalances marketing toward performance as sales slide',
    summary:
      'With sales sliding, American Eagle is shifting its marketing mix toward performance and lower-funnel tactics after a buzzy brand campaign. Marketing Dive examines how the retailer is balancing attention-grabbing creative with measurable sales impact, and what the pivot signals about the pressure brand marketing faces when the results do not immediately follow the cultural moment.',
    content:
      'American Eagle leaned on a high-profile brand campaign, but with sales under pressure the retailer is rebalancing toward performance marketing that ties spend more directly to revenue. Marketing Dive looks at the tension between building brand attention and proving short-term sales lift, a challenge many retailers face as boards demand efficiency. Read the full story at the source.',
    imageUrl: img('photo-1441986300917-64674bd600d8'),
    source: 'Marketing Dive',
    author: 'Marketing Dive',
    url: 'https://www.marketingdive.com/news/american-eagle-rebalances-marketing-toward-performance-as-sales-slide/821470/',
    publishedAt: '2026-08-10T11:00:00Z',
    accent: '#F59E0B',
  },
  {
    id: 'r5',
    category: 'Digital',
    title: 'Unpacking the marketing industry trends forecast for 2026',
    summary:
      'Marketing Dive unpacks the biggest forces shaping the industry in 2026 — from AI’s expanding role and shifting media budgets to changing consumer expectations. The outlook covers where marketers plan to invest, which channels are gaining or losing ground, and how teams are restructuring to keep pace with a faster, increasingly automated landscape.',
    content:
      'This forecast piece from Marketing Dive synthesises analyst views and marketer surveys into a picture of 2026. Key threads include AI moving from experiment to everyday tool, budget shifts toward retail media and creators, and rising expectations around privacy and relevance. It also considers how marketing teams are reorganising roles and workflows around automation. Read the full outlook at the source.',
    imageUrl: img('photo-1460925895917-afdab827c52f'),
    source: 'Marketing Dive',
    author: 'Marketing Dive',
    url: 'https://www.marketingdive.com/news/marketing-trends-outlook-2026/810740/',
    publishedAt: '2026-07-28T09:00:00Z',
    accent: '#EC4899',
  },
  {
    id: 'r6',
    category: 'SEO',
    title: 'The future of AI search: What 6 SEO leaders predict for 2026',
    summary:
      'Six SEO leaders share how AI search reshapes the discipline in 2026. As AI overviews and assistants handle more discovery — and even transactions — visibility increasingly means being cited by AI, not just ranking on Google. Search Engine Land covers zero-click traffic, brand mentions inside AI answers, and how to stay findable when users never visit your site.',
    content:
      'Search Engine Land asked six SEO leaders to predict where AI search heads in 2026. The consensus: discovery is fragmenting across Google AI Overviews, ChatGPT, Perplexity and others, so brands must optimise to be retrieved and cited by AI systems, not only to rank. They discuss defending against zero-click losses, earning brand mentions in AI answers, and building audiences that do not depend on search referrals. Read the full predictions at the source.',
    imageUrl: img('photo-1451187580459-43490279c0fa'),
    source: 'Search Engine Land',
    author: 'Search Engine Land',
    url: 'https://searchengineland.com/ai-search-visibility-seo-predictions-2026-468042',
    publishedAt: '2026-08-09T08:00:00Z',
    accent: '#0EA5E9',
  },
  {
    id: 'r7',
    category: 'SEO',
    title: 'SEO in 2026: Higher standards, AI influence, and a web still catching up',
    summary:
      'SEO in 2026 demands higher standards as AI reshapes search results faster than most sites can adapt. Search Engine Land argues the fundamentals — quality, clarity and credibility — matter more than ever, even as generative answers change how content gets found. The takeaway: publishers that raise their bar will weather the AI disruption best.',
    content:
      'Search Engine Land makes the case that AI has raised the bar for SEO. As generative answers absorb informational queries, thin or derivative content loses value, while original research, expertise and clear structure stand out and get cited. The article argues much of the web is still catching up to these expectations, creating an opening for publishers willing to invest in genuinely higher-quality, credible content. Read the full piece at the source.',
    imageUrl: img('photo-1522542550221-31fd19575a2d'),
    source: 'Search Engine Land',
    author: 'Search Engine Land',
    url: 'https://searchengineland.com/seo-2026-higher-standards-ai-influence-web-catching-up-473540',
    publishedAt: '2026-08-13T07:30:00Z',
    accent: '#0EA5E9',
  },
  {
    id: 'r8',
    category: 'Advertising',
    title: '2026 PPC trends to get ahead of now',
    summary:
      'Paid search is changing fast, and Search Engine Land outlines the 2026 PPC trends advertisers should prepare for now — from deeper automation and AI-driven bidding to new creative formats and measurement challenges. The guide helps marketers stay ahead as platforms hand more control to algorithms and first-party data becomes the decisive advantage.',
    content:
      'This Search Engine Land guide highlights the PPC shifts defining 2026. Automation and AI bidding continue to expand, pushing advertisers toward feeding better signals and first-party data rather than manual tweaks. It also flags evolving ad formats, privacy-driven measurement gaps, and the growing importance of creative as a lever the algorithms cannot optimise on their own. Read the full guide at the source.',
    imageUrl: img('photo-1611926653458-09294b3142bf'),
    source: 'Search Engine Land',
    author: 'Search Engine Land',
    url: 'https://searchengineland.com/2026-ppc-trends-466067',
    publishedAt: '2026-08-06T12:00:00Z',
    accent: '#6366F1',
  },
  {
    id: 'r9',
    category: 'AI',
    title: 'Mastering generative engine optimization in 2026: Full guide',
    summary:
      'Generative engine optimization (GEO) is the new discipline of structuring content so AI platforms like ChatGPT, Perplexity and Google’s AI Overviews can retrieve, trust and cite your brand. This Search Engine Land guide explains how GEO differs from classic SEO and the practical steps to get recommended inside AI-generated answers.',
    content:
      'As AI assistants answer more queries directly, Search Engine Land argues brands need GEO alongside SEO. The guide explains that AI platforms evaluate topical depth, credibility and clear structure rather than the link graph, so being cited requires authoritative, well-organised content. It walks through practical tactics for making your brand retrievable and quotable by ChatGPT, Perplexity, Google AI Overviews, Claude and Copilot. Read the full guide at the source.',
    imageUrl: img('photo-1620712943543-bcc4688e7485'),
    source: 'Search Engine Land',
    author: 'Search Engine Land',
    url: 'https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142',
    publishedAt: '2026-08-08T10:00:00Z',
    accent: '#7C3AED',
  },
  {
    id: 'r10',
    category: 'Social Media',
    title: 'Brands see biggest growth on TikTok but organic reach is slowing on Instagram',
    summary:
      'New data shows brands grew fastest on TikTok — median follower counts jumped more than 200% year-over-year — while organic reach keeps drying up across Instagram post types. Social Media Today breaks down where brands are actually gaining traction, why TikTok’s engagement outpaces rivals, and what the shift means for where marketers should focus effort.',
    content:
      'Social Media Today reports that TikTok drove the strongest brand growth, with median follower counts up over 200% year-over-year and high engagement per post. Meanwhile, organic reach continues to decline across Instagram formats, pressuring brands to pay for distribution or lean into short video. The piece considers how marketers should rebalance effort across platforms given these divergent trends. Read the full report at the source.',
    imageUrl: img('photo-1611162617213-7d7a39e9b1d7'),
    source: 'Social Media Today',
    author: 'Social Media Today',
    url: 'https://www.socialmediatoday.com/news/brands-see-biggest-growth-on-tiktok-but-organic-reach-is-slowing-on-instagr/812789/',
    publishedAt: '2026-08-12T16:00:00Z',
    accent: '#E11D48',
  },
  {
    id: 'r11',
    category: 'Social Media',
    title: 'TikTok shares 2026 trend predictions for marketers',
    summary:
      'TikTok has published its 2026 trend predictions for marketers, spotlighting how creator communities, short-form storytelling and in-app commerce will drive brand growth. Social Media Today summarizes the key themes and what they mean for campaign planning, as more consumers turn to TikTok for search, reviews and discovery over traditional platforms.',
    content:
      'TikTok’s annual trend forecast, covered by Social Media Today, points to creator partnerships, narrative short-form video and shoppable in-app commerce as the forces shaping 2026 marketing. With a growing share of users treating TikTok as a search and discovery engine, the predictions urge brands to build always-on creator relationships and native, entertainment-first content. Read the full summary at the source.',
    imageUrl: img('photo-1567443024551-f3e3cc2be870'),
    source: 'Social Media Today',
    author: 'Social Media Today',
    url: 'https://www.socialmediatoday.com/news/tiktok-shares-2026-trend-predictions-for-marketers/809651/',
    publishedAt: '2026-08-04T09:00:00Z',
    accent: '#E11D48',
  },
  {
    id: 'r12',
    category: 'Advertising',
    title: 'TikTok adds new ad placement options offering higher exposure',
    summary:
      'TikTok has rolled out new premium ad placements — including a Logo Takeover format that co-brands the app-open moment — giving marketers higher-visibility options. Social Media Today details the new formats and how brands can use them to reach audiences at key moments, as TikTok keeps expanding its advertising toolkit for 2026.',
    content:
      'Social Media Today reports TikTok is expanding its ad offering with new high-exposure placements. A Logo Takeover format lets a brand co-brand the moment users open the app, while Pulse Tastemakers aligns ads with a curated selection of creators to tap into their communities. The additions give advertisers more premium, attention-grabbing options as competition for TikTok reach intensifies. Read the full details at the source.',
    imageUrl: img('photo-1563986768609-322da13575f3'),
    source: 'Social Media Today',
    author: 'Social Media Today',
    url: 'https://www.socialmediatoday.com/news/tiktok-adds-new-ad-placement-options-offering-higher-exposure/815622/',
    publishedAt: '2026-08-13T06:00:00Z',
    accent: '#6366F1',
  },
];

// Your own articles (from myArticles.ts) appear first in the feed, then these.
export const ARTICLES: Article[] = [...MY_ARTICLES, ...SAMPLE_ARTICLES];

export function articlesByCategory(cat: Category): Article[] {
  if (cat === 'All') return ARTICLES;
  return ARTICLES.filter((a) => a.category === cat);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
