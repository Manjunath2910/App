// ─── Live currency rates → Indian Rupee (₹) ───────────────────────────────────
// Free, no API key. Base USD; we convert each currency to INR.
export type Rate = { code: string; symbol: string; name: string; inr: number };

const WANTS: [string, string, string][] = [
  ['USD', '$', 'US Dollar'],
  ['EUR', '€', 'Euro'],
  ['GBP', '£', 'British Pound'],
  ['AED', 'د.إ', 'UAE Dirham'],
  ['AUD', 'A$', 'Australian Dollar'],
  ['CAD', 'C$', 'Canadian Dollar'],
  ['SGD', 'S$', 'Singapore Dollar'],
  ['SAR', '﷼', 'Saudi Riyal'],
];

export async function fetchRates(): Promise<Rate[]> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const j = await res.json();
    if (j?.result !== 'success' || !j?.rates?.INR) return [];
    const r = j.rates as Record<string, number>;
    const inr = r.INR;
    return WANTS.filter(([c]) => r[c]).map(([code, symbol, name]) => ({ code, symbol, name, inr: inr / r[code] }));
  } catch {
    return [];
  }
}

export function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
