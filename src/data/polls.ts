// ─── Polls (Inshorts-style) ───────────────────────────────────────────────────
export type Poll = {
  id: string;
  context: string; // short line above the question
  question: string;
  imageUrl: string;
  options: { id: string; label: string; votes: number }[];
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;

export const POLLS: Poll[] = [
  {
    id: 'p1',
    context: 'AI is reshaping ad creative',
    question: 'Would you trust an AI to write your brand’s ad copy?',
    imageUrl: img('photo-1677442136019-21780ecad995'),
    options: [
      { id: 'a', label: 'Yes, with review', votes: 612 },
      { id: 'b', label: 'No, human only', votes: 388 },
    ],
  },
  {
    id: 'p2',
    context: 'Where marketing budgets are moving',
    question: 'Which channel gives you the best ROI right now?',
    imageUrl: img('photo-1611162617213-7d7a39e9b1d7'),
    options: [
      { id: 'a', label: 'Short-form video', votes: 471 },
      { id: 'b', label: 'Email', votes: 262 },
      { id: 'c', label: 'Search / SEO', votes: 305 },
    ],
  },
  {
    id: 'p3',
    context: 'The cookie-less future',
    question: 'Is your team ready for third-party cookies going away?',
    imageUrl: img('photo-1460925895917-afdab827c52f'),
    options: [
      { id: 'a', label: 'Fully ready', votes: 214 },
      { id: 'b', label: 'Getting there', votes: 548 },
      { id: 'c', label: 'Not at all', votes: 233 },
    ],
  },
];
