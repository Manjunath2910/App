// ─── Insights (explainer cards) + Timelines (developing stories) ──────────────

export type Insight = {
  id: string;
  term: string;
  category: string;
  accent: string;
  what: string;
  why: string;
};

export const INSIGHTS: Insight[] = [
  {
    id: 'i1', term: 'GEO', category: 'SEO', accent: '#0EA5E9',
    what: 'Generative Engine Optimization — structuring content so AI assistants (ChatGPT, Gemini, Perplexity) can retrieve and cite your brand.',
    why: 'As AI answers replace blue links, being quoted by the model matters as much as ranking on Google.',
  },
  {
    id: 'i2', term: 'Retail Media', category: 'Advertising', accent: '#6366F1',
    what: 'Ads sold by retailers (Amazon, Flipkart, Walmart) on their own sites and apps, using their first-party shopper data.',
    why: 'It is the fastest-growing ad channel because the buyer is already in a shopping mindset.',
  },
  {
    id: 'i3', term: 'CTR vs CVR', category: 'Advertising', accent: '#6366F1',
    what: 'CTR (click-through rate) measures how many people click an ad; CVR (conversion rate) measures how many then take action.',
    why: 'High CTR with low CVR usually means the creative promises more than the landing page delivers.',
  },
  {
    id: 'i4', term: 'First-party data', category: 'Digital', accent: '#EC4899',
    what: 'Data you collect directly from your audience — signups, purchases, app activity — with consent.',
    why: 'With third-party cookies fading, first-party data is the durable foundation for targeting and measurement.',
  },
  {
    id: 'i5', term: 'Dark social', category: 'Social Media', accent: '#E11D48',
    what: 'Sharing that happens in private channels — DMs, WhatsApp, email — where analytics cannot see the referrer.',
    why: 'A huge share of real word-of-mouth is invisible in dashboards, so attribution understates it.',
  },
  {
    id: 'i6', term: 'Brand vs Performance', category: 'Branding', accent: '#10B981',
    what: 'Brand marketing builds long-term memory and demand; performance marketing captures existing demand now.',
    why: 'The 60/40 split (brand/performance) is a common rule of thumb for sustainable growth.',
  },
  {
    id: 'i7', term: 'UGC', category: 'Social Media', accent: '#E11D48',
    what: 'User-generated content — reviews, photos, videos made by customers or creators rather than the brand.',
    why: 'It reads as authentic and converts better than polished brand ads, especially with Gen Z.',
  },
  {
    id: 'i8', term: 'AOV & LTV', category: 'E-commerce', accent: '#F59E0B',
    what: 'Average Order Value is what a customer spends per order; Lifetime Value is what they spend over the whole relationship.',
    why: 'Knowing LTV tells you how much you can afford to spend acquiring a customer.',
  },
];

export type TimelineEvent = { date: string; text: string };
export type Timeline = {
  id: string;
  title: string;
  category: string;
  accent: string;
  imageUrl: string;
  events: TimelineEvent[];
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;

export const TIMELINES: Timeline[] = [
  {
    id: 't1',
    title: 'The rise of AI search and what it means for marketers',
    category: 'AI',
    accent: '#7C3AED',
    imageUrl: img('photo-1677442136019-21780ecad995'),
    events: [
      { date: '2024', text: 'Google rolls out AI Overviews, pushing organic links further down the page.' },
      { date: 'Early 2025', text: 'Brands notice zero-click searches climbing; referral traffic dips.' },
      { date: 'Mid 2025', text: 'GEO emerges as a discipline; tools appear to track brand mentions inside AI answers.' },
      { date: '2026', text: 'Marketers budget for “being cited by AI” alongside classic SEO.' },
    ],
  },
  {
    id: 't2',
    title: 'TikTok becomes a search and shopping engine',
    category: 'Social Media',
    accent: '#E11D48',
    imageUrl: img('photo-1611162617213-7d7a39e9b1d7'),
    events: [
      { date: '2023', text: 'Younger users start using TikTok search instead of Google for discovery.' },
      { date: '2024', text: 'TikTok Shop expands; creators drive measurable in-app sales.' },
      { date: '2025', text: 'Brands shift budgets to always-on creator partnerships.' },
      { date: '2026', text: 'TikTok publishes trend forecasts marketers plan campaigns around.' },
    ],
  },
];
