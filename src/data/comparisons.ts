// ─── App comparisons — money transfer & currency converter apps ───────────────

export type AppRow = { name: string; bestFor: string; fee: string; speed: string; rating: number };
export type Comparison = {
  id: string;
  title: string;
  note: string;
  accent: string;
  imageUrl: string;
  apps: AppRow[];
  verdict: string;
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;

export const COMPARISONS: Comparison[] = [
  {
    id: 'c1',
    title: 'Best apps to send money to India',
    note: 'Fees, speed and exchange rate compared',
    accent: '#16A34A',
    imageUrl: img('photo-1580519542036-c47de6196ba5'),
    apps: [
      { name: 'Wise', bestFor: 'Real exchange rate', fee: 'Low, transparent', speed: '1–2 days', rating: 4.6 },
      { name: 'Remitly', bestFor: 'Fast delivery', fee: 'Low (Express costs more)', speed: 'Minutes–hours', rating: 4.5 },
      { name: 'Xoom (PayPal)', bestFor: 'Convenience', fee: 'Higher', speed: 'Minutes', rating: 4.2 },
      { name: 'Western Union', bestFor: 'Cash pickup', fee: 'Higher', speed: 'Minutes–1 day', rating: 4.0 },
    ],
    verdict: 'Wise wins on the mid-market rate and low fees; pick Remitly when speed matters most.',
  },
  {
    id: 'c2',
    title: 'Best currency converter apps',
    note: 'For checking and converting dollar ↔ rupee',
    accent: '#0EA5E9',
    imageUrl: img('photo-1611974789855-9c2a0a7236a3'),
    apps: [
      { name: 'XE Currency', bestFor: 'Rate tracking + alerts', fee: 'Free to check', speed: 'Live', rating: 4.7 },
      { name: 'Wise', bestFor: 'Convert & hold 40+ currencies', fee: 'Low conversion', speed: 'Live', rating: 4.6 },
      { name: 'Google Finance', bestFor: 'Quick lookups', fee: 'Free', speed: 'Live', rating: 4.4 },
    ],
    verdict: 'Use XE to watch and get rate alerts; use Wise when you actually need to convert money.',
  },
  {
    id: 'c3',
    title: 'UPI & wallet apps in India',
    note: 'Everyday payments compared',
    accent: '#7C3AED',
    imageUrl: img('photo-1563986768609-322da13575f3'),
    apps: [
      { name: 'Google Pay', bestFor: 'Clean UPI experience', fee: 'Free UPI', speed: 'Instant', rating: 4.5 },
      { name: 'PhonePe', bestFor: 'Widest acceptance', fee: 'Free UPI', speed: 'Instant', rating: 4.4 },
      { name: 'Paytm', bestFor: 'Wallet + bills + recharge', fee: 'Free UPI', speed: 'Instant', rating: 4.2 },
    ],
    verdict: 'For pure UPI, Google Pay and PhonePe lead; Paytm adds the most extras beyond payments.',
  },
];
