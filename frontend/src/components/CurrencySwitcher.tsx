import { useEffect, useRef, useState } from 'react';
import { useCurrencyStore, CURRENCY_LIST } from '../store/currencyStore';
import { useEscapeKey } from '../hooks/useEscapeKey';

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click (same pattern as NavAvatar)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEscapeKey(() => setOpen(false), open);

  const handleSelect = (code: string) => {
    setCurrency(code);
    setOpen(false);
  };

  return (
    <div className="currency-switcher" ref={ref}>
      <button
        type="button"
        className="currency-btn"
        onClick={() => setOpen((p) => !p)}
        aria-label="Change currency"
        aria-expanded={open}
        title={`Currency: ${currency.code} — ${currency.country}`}
      >
        <span className="currency-btn-symbol">{currency.symbol}</span>
        <span className="currency-btn-code">{currency.code}</span>
      </button>
      {open && (
        <div className="currency-dropdown" role="menu">
          {CURRENCY_LIST.map((c) => (
            <button
              key={c.code}
              type="button"
              role="menuitem"
              className={`currency-option ${c.code === currency.code ? 'active' : ''}`}
              onClick={() => handleSelect(c.code)}
            >
              <span className="currency-option-symbol">{c.symbol}</span>
              <span>{c.code}</span>
              <span className="currency-option-country">{c.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CurrencySwitcher;
