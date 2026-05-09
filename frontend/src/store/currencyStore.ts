import { create } from 'zustand';

export interface CurrencyInfo {
  code: string;       // e.g. "INR"
  symbol: string;     // e.g. "₹"
  rate: number;       // rate relative to USD
  country: string;    // e.g. "India"
}

// Static exchange rate table (updated periodically — no live API dependency)
const CURRENCIES: Record<string, CurrencyInfo> = {
  US: { code: 'USD', symbol: '$',  rate: 1,       country: 'United States' },
  IN: { code: 'INR', symbol: '₹',  rate: 83.5,    country: 'India' },
  GB: { code: 'GBP', symbol: '£',  rate: 0.79,    country: 'United Kingdom' },
  EU: { code: 'EUR', symbol: '€',  rate: 0.92,    country: 'Europe' },
  DE: { code: 'EUR', symbol: '€',  rate: 0.92,    country: 'Germany' },
  FR: { code: 'EUR', symbol: '€',  rate: 0.92,    country: 'France' },
  CA: { code: 'CAD', symbol: 'C$', rate: 1.36,    country: 'Canada' },
  AU: { code: 'AUD', symbol: 'A$', rate: 1.53,    country: 'Australia' },
  JP: { code: 'JPY', symbol: '¥',  rate: 149.5,   country: 'Japan' },
  CN: { code: 'CNY', symbol: '¥',  rate: 7.24,    country: 'China' },
  BR: { code: 'BRL', symbol: 'R$', rate: 5.05,    country: 'Brazil' },
  SG: { code: 'SGD', symbol: 'S$', rate: 1.34,    country: 'Singapore' },
  AE: { code: 'AED', symbol: 'د.إ', rate: 3.67,   country: 'UAE' },
};

const DEFAULT_CURRENCY: CurrencyInfo = CURRENCIES['US'];

/** Deduplicated list of all available currencies (for the switcher UI) */
export const CURRENCY_LIST: CurrencyInfo[] = Object.values(
  Object.values(CURRENCIES).reduce<Record<string, CurrencyInfo>>((acc, c) => {
    if (!acc[c.code]) acc[c.code] = c;
    return acc;
  }, {})
).sort((a, b) => a.code.localeCompare(b.code));

interface CurrencyState {
  currency: CurrencyInfo;
  detected: boolean;
  detect: () => Promise<void>;
  setCurrency: (code: string) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: DEFAULT_CURRENCY,
  detected: false,

  detect: async () => {
    // Check localStorage first
    const saved = localStorage.getItem('laserhub_currency');
    if (saved) {
      try {
        const c = JSON.parse(saved) as CurrencyInfo;
        set({ currency: c, detected: true });
        return;
      } catch { /* fall through */ }
    }

    // Try IP geolocation (free, no key needed)
    try {
      const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const countryCode = (data.country_code as string)?.toUpperCase();
        const currency = CURRENCIES[countryCode] || DEFAULT_CURRENCY;
        set({ currency, detected: true });
        localStorage.setItem('laserhub_currency', JSON.stringify(currency));
        return;
      }
    } catch { /* fall through */ }

    set({ detected: true }); // use default USD
  },

  setCurrency: (code: string) => {
    const entry = Object.values(CURRENCIES).find(c => c.code === code);
    if (entry) {
      set({ currency: entry });
      localStorage.setItem('laserhub_currency', JSON.stringify(entry));
    }
  },
}));

/** Format a USD amount in the user's local currency */
export function formatPrice(usdAmount: number, currency: CurrencyInfo): string {
  const local = usdAmount * currency.rate;
  // Round to 2 decimal places for most; 0 for JPY/KRW
  const decimals = ['JPY', 'KRW'].includes(currency.code) ? 0 : 2;
  return `${currency.symbol}${local.toFixed(decimals)}`;
}
