// ═══════════════════════════════════════════════════════════════════════════
//  YOUR OWN ARTICLES  ·  Mini Shorts
// ═══════════════════════════════════════════════════════════════════════════
//
//  HOW TO ADD A STORY (copy-paste):
//  1. Copy the whole TEMPLATE block below (from the opening { to the closing },).
//  2. Paste it inside the MY_ARTICLES = [ ... ] list at the bottom.
//  3. Fill in your text between the quotes. Keep the quotes and commas.
//  4. Give every story a different "id" (e.g. 'my2', 'my3', ...).
//  5. Save the file — your story appears at the TOP of the feed.
//
//  FIELD GUIDE:
//    id          any unique text, e.g. 'my2'
//    category    one of: 'Markets' | 'Digital' | 'Social Media' | 'SEO'
//                        | 'Advertising' | 'Branding' | 'AI' | 'E-commerce'
//    title       the headline
//    summary     the short card text — aim for about 60 words
//    content     the full story shown when the card is tapped (can be long)
//    imageUrl    a public image link ending in .jpg / .png (e.g. from Unsplash)
//    source      where it's from, e.g. 'Market News'
//    author      writer's name
//    url         link to the original full article (opens from the reader)
//    publishedAt date/time in ISO form: 'YYYY-MM-DDTHH:MM:SSZ'
//    accent      a colour for the card bar, e.g. '#E11D48' (red) '#7C3AED' (purple)
//
//  ───────── TEMPLATE (copy this block) ─────────
//  {
//    id: 'my2',
//    category: 'AI',
//    title: 'Your headline here',
//    summary: 'Your ~60-word summary here.',
//    content: 'The full article text here. This is shown when the reader opens the story.',
//    imageUrl: 'https://images.unsplash.com/photo-XXXX?auto=format&fit=crop&w=1000&q=70',
//    source: 'Market News',
//    author: 'Your Name',
//    url: 'https://your-original-article-link.com',
//    publishedAt: '2026-08-13T10:00:00Z',
//    accent: '#E11D48',
//  },
//  ──────────────────────────────────────────────
//
// ═══════════════════════════════════════════════════════════════════════════

import type { Article } from './news';

export const MY_ARTICLES: Article[] = [
  // 👇 EXAMPLE (a marketing story) — replace this with your own, or delete it.
  {
    id: 'my1',
    category: 'Advertising',
    title: 'Meta rolls out full AI ad creation for small-business advertisers',
    summary:
      'Meta has opened its AI ad tools to all advertisers, letting brands generate images, headlines and full ad variations from a single product photo and a short prompt. Small businesses without design teams can now spin up campaign-ready creative in minutes. Meta says the tools aim to lift ad performance while cutting production time and cost across Facebook and Instagram.',
    content:
      'The rollout extends Meta’s generative-AI advertising suite from a limited test to general availability. Advertisers upload a product image and describe the campaign; the system proposes backgrounds, copy and multiple ad variants tuned for Facebook and Instagram placements. Meta says early users saw faster turnaround and comparable or better performance versus manually built creative. Marketers welcome the speed but want clearer controls over brand consistency and a way to review AI output before it goes live.',
    imageUrl: 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?auto=format&fit=crop&w=1000&q=70',
    source: 'Market News',
    author: 'Editorial Desk',
    url: 'https://getpanda.money',
    publishedAt: '2026-08-13T10:30:00Z',
    accent: '#6366F1',
  },
];
