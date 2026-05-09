import React, { useMemo, useState } from 'react';
import { Star, BadgeCheck, Bookmark, Filter as FilterIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrencyStore, formatPrice } from '../store/currencyStore';
import { savedQuotesStore } from '../services';

export interface VendorQuoteDTO {
  vendor_id: number;
  vendor_name: string;
  vendor_slug?: string;
  vendor_rating: number;
  price: number;
  lead_time_days: number;
  is_in_stock: boolean;
  is_verified?: boolean;
  cut_speed_mm_min?: number;
}

interface Props {
  quotes: VendorQuoteDTO[];
  material: string;
  materialId?: number;
  thickness: number;
  quantity: number;
  fileId?: string | null;
  designId?: number | null;
  onSelect: (quote: VendorQuoteDTO) => void;
}

type SortKey = 'price_asc' | 'price_desc' | 'rating' | 'turnaround';

export const QuoteComparison: React.FC<Props> = ({
  quotes,
  material,
  materialId,
  thickness,
  quantity,
  fileId,
  designId,
  onSelect,
}) => {
  const { currency } = useCurrencyStore();
  const fp = (usd: number) => formatPrice(usd, currency);

  const [sortBy, setSortBy] = useState<SortKey>('price_asc');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [maxTurnaround, setMaxTurnaround] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...quotes];
    if (maxPrice) list = list.filter((q) => q.price <= Number(maxPrice));
    if (minRating) list = list.filter((q) => q.vendor_rating >= Number(minRating));
    if (maxTurnaround) list = list.filter((q) => q.lead_time_days <= Number(maxTurnaround));
    if (verifiedOnly) list = list.filter((q) => q.is_verified);

    list.sort((a, b) => {
      switch (sortBy) {
        case 'price_desc': return b.price - a.price;
        case 'rating': return b.vendor_rating - a.vendor_rating;
        case 'turnaround': return a.lead_time_days - b.lead_time_days;
        case 'price_asc':
        default:
          return a.price - b.price;
      }
    });
    return list;
  }, [quotes, sortBy, maxPrice, minRating, maxTurnaround, verifiedOnly]);

  const handleSaveQuote = (q: VendorQuoteDTO) => {
    savedQuotesStore.save({
      design_id: designId ?? null,
      file_id: fileId ?? null,
      vendor_slug: q.vendor_slug,
      vendor_name: q.vendor_name,
      material,
      material_id: materialId,
      thickness,
      qty: quantity,
      price: q.price,
    });
    toast.success(`Quote from ${q.vendor_name} saved`);
  };

  if (!quotes.length) {
    return (
      <div className="quote-comparison">
        <h3>Compare Vendor Quotes</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          No vendor quotes available for this material/thickness yet.
        </p>
      </div>
    );
  }

  return (
    <div className="quote-comparison">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Compare Vendor Quotes ({filtered.length})</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            aria-label="Sort quotes"
            style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }}
          >
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="rating">Highest Rated</option>
            <option value="turnaround">Fastest Turnaround</option>
          </select>
          <button
            type="button"
            className="sa-btn sa-btn--ghost-sm"
            onClick={() => setShowFilters((s) => !s)}
          >
            <FilterIcon size={14} /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0.75rem', background: 'var(--bg-secondary, #f8fafc)', borderRadius: 8, marginBottom: '0.75rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
            Max price ($)
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="any" style={{ width: 100 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
            Min rating
            <input type="number" min={0} max={5} step={0.1} value={minRating} onChange={(e) => setMinRating(e.target.value)} placeholder="any" style={{ width: 100 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
            Max turnaround (days)
            <input type="number" value={maxTurnaround} onChange={(e) => setMaxTurnaround(e.target.value)} placeholder="any" style={{ width: 100 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', marginTop: 'auto' }}>
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            Verified only
          </label>
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          No vendors match your filters. Try relaxing the constraints.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {filtered.map((q, i) => (
            <div
              key={q.vendor_id}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: '0.85rem',
                background: 'var(--bg-primary, #fff)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--primary-color, #0066ff)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                }}>
                  {q.vendor_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.vendor_name}</span>
                    {q.is_verified && <BadgeCheck size={14} style={{ color: 'var(--primary-color)' }} />}
                    {i === 0 && sortBy === 'price_asc' && <span className="mp-badge">Best</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={11} /> {q.vendor_rating.toFixed(1)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-color, var(--primary-color))' }}>
                {fp(q.price)}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>{q.lead_time_days}d turnaround</span>
                <span style={{
                  color: q.is_in_stock ? 'var(--success-color, #16a34a)' : 'var(--error-color, #dc2626)',
                  fontWeight: 600,
                }}>
                  {q.is_in_stock ? 'In stock' : 'Out of stock'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button
                  className="mp-buy-btn"
                  onClick={() => onSelect(q)}
                  disabled={!q.is_in_stock}
                  style={{ flex: 1 }}
                >
                  Select
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn--ghost-sm"
                  onClick={() => handleSaveQuote(q)}
                  aria-label="Save quote"
                  title="Save this quote for later"
                >
                  <Bookmark size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
