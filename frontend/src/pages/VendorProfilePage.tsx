import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  BadgeCheck,
  Mail,
  Calendar,
  Package,
  MessageSquare,
  Info,
  LayoutGrid,
  ShoppingBag,
  Phone,
  Globe,
  FileText,
  Store,
  ShieldCheck,
  MapPinned,
  CreditCard,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import { marketplaceApi, vendorApi, VendorProfile, VendorMaterialItem, VendorListingItem } from '../services/index';
import { useCurrencyStore, formatPrice } from '../store/currencyStore';
import { Avatar, Button, EmptyState, PageHeader } from '../components/ui';
import { Skeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type Tab = 'materials' | 'listings' | 'reviews' | 'details' | 'about';
type DetailsSubTab = 'platform' | 'gmb';

// Relative time helper — keeps us off date-fns
function relativeTime(iso?: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return `on ${new Date(iso).toLocaleDateString()}`;
}

interface ReviewItem {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const RatingStars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <span className="vendor-rating-stars">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={size}
        fill={rating >= i + 1 ? 'currentColor' : 'none'}
        strokeWidth={rating >= i + 1 ? 0 : 1.5}
        className={rating >= i + 1 ? 'star-filled' : 'star-empty'}
      />
    ))}
    <span className="vendor-rating-value">{(rating || 0).toFixed(1)}</span>
  </span>
);

export const VendorProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currency } = useCurrencyStore();
  const fp = (usd: number) => formatPrice(usd, currency);

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [materials, setMaterials] = useState<VendorMaterialItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [listings, setListings] = useState<VendorListingItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('materials');
  const [detailsSubTab, setDetailsSubTab] = useState<DetailsSubTab>('platform');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle(vendor ? `${vendor.shop_name} — LaserHub` : 'Vendor — LaserHub');

  useEffect(() => {
    if (slug) loadVendor(slug);
  }, [slug]);

  const loadVendor = async (vendorSlug: string) => {
    setLoading(true);
    try {
      const profile = await vendorApi.getVendor(vendorSlug);
      setVendor(profile);

      // Load all tabs in parallel; each failure degrades gracefully
      const [mats, revs, lists] = await Promise.allSettled([
        vendorApi.getVendorMaterials(profile.id),
        marketplaceApi.getVendorReviews(profile.id),
        vendorApi.getVendorListings(profile.id),
      ]);

      setMaterials(mats.status === 'fulfilled' ? mats.value : []);
      setReviews(revs.status === 'fulfilled' ? (revs.value as ReviewItem[]) : []);
      setListings(lists.status === 'fulfilled' ? lists.value : []);
    } catch {
      setError('Vendor not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="public-page" aria-busy="true" aria-label="Loading vendor profile">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Skeleton width="96px" height="96px" borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton height="1.5rem" width="40%" />
            <Skeleton height="1rem" width="70%" />
            <Skeleton height="0.9rem" width="50%" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100px" height="2rem" borderRadius="6px" />
          ))}
        </div>
        <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <Skeleton height="120px" borderRadius="6px" />
              <Skeleton height="1rem" width="80%" />
              <Skeleton height="0.8rem" width="60%" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error || !vendor) {
    return (
      <div className="public-page">
        <ErrorState
          message={error || "Couldn't load vendor profile"}
          onRetry={slug ? () => loadVendor(slug) : undefined}
        />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/vendors">
            <Button variant="secondary">Browse all vendors</Button>
          </Link>
        </div>
      </div>
    );
  }

  const memberSince = vendor.created_at
    ? new Date(vendor.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      })
    : null;

  const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'materials', label: 'Materials', icon: <Package size={16} />, count: materials.length },
    { id: 'listings', label: 'Listings', icon: <LayoutGrid size={16} />, count: listings.length },
    { id: 'reviews', label: 'Reviews', icon: <MessageSquare size={16} />, count: reviews.length },
    { id: 'details', label: 'Details', icon: <CreditCard size={16} /> },
    { id: 'about', label: 'About', icon: <Info size={16} /> },
  ];

  const hasPlatformInfo = !!(
    vendor.phone_number ||
    vendor.business_email ||
    vendor.website ||
    vendor.business_address ||
    vendor.gst_number ||
    vendor.logo_url ||
    vendor.storefront_image_url
  );

  const hasGmbInfo = !!(
    vendor.gmb_place_id ||
    vendor.gmb_name ||
    vendor.gmb_phone ||
    vendor.gmb_address ||
    vendor.gmb_website ||
    vendor.gmb_rating != null ||
    vendor.gmb_maps_url
  );

  const gmbMapsHref =
    vendor.gmb_maps_url ||
    (vendor.gmb_place_id
      ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(vendor.gmb_place_id)}`
      : null);

  return (
    <div className="vendor-profile-page public-page bv-vendor-profile">
      <PageHeader
        title={vendor.shop_name}
        breadcrumbs={[
          { label: 'Marketplace', to: '/' },
          { label: 'Vendors', to: '/vendors' },
          { label: vendor.shop_name },
        ]}
      />

      {/* Hero */}
      <section className="bv-vendor-hero">
        <Avatar src={vendor.logo_url} name={vendor.shop_name} size={96} />
        <div className="bv-vendor-hero-info">
          {vendor.is_verified && (
            <div className="vendor-name-row">
              <span className="vendor-verified-badge large" title="Verified vendor">
                <BadgeCheck size={18} />
              </span>
            </div>
          )}
          <div className="bv-vendor-hero-meta">
            <RatingStars rating={vendor.rating || 0} />
            <span>({vendor.total_reviews || 0} review{vendor.total_reviews === 1 ? '' : 's'})</span>
            <span>&middot;</span>
            <span><ShoppingBag size={14} /> {vendor.total_orders || 0} orders</span>
            {vendor.location && (
              <>
                <span>&middot;</span>
                <span><MapPin size={14} /> {vendor.location}</span>
              </>
            )}
            {memberSince && (
              <>
                <span>&middot;</span>
                <span><Calendar size={14} /> Member since {memberSince}</span>
              </>
            )}
            {vendor.avg_turnaround_days ? (
              <>
                <span>&middot;</span>
                <span><Clock size={14} /> {vendor.avg_turnaround_days} day turnaround</span>
              </>
            ) : null}
          </div>
          {vendor.description && <p className="bv-vendor-tagline">{vendor.description}</p>}
          {vendor.specialties && vendor.specialties.length > 0 && (
            <div className="bv-vendor-tags">
              {vendor.specialties.map((s) => (
                <span key={s} className="bv-vendor-tag">{s}</span>
              ))}
            </div>
          )}
        </div>
        <div className="bv-vendor-hero-actions">
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">Visit Website</Button>
            </a>
          )}
          <Link to={`/upload?vendor=${encodeURIComponent(vendor.slug)}`}>
            <Button variant="primary" icon={<Mail size={14} />}>Get Quote</Button>
          </Link>
        </div>
      </section>

      {/* Tabs */}
      <div className="bv-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            className={`bv-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
            {typeof t.count === 'number' && <span className="bv-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="bv-tab-panel">
        {activeTab === 'materials' && (
          materials.length === 0 ? (
            <EmptyState
              icon={<Package size={48} />}
              title="No materials listed"
              description="This vendor hasn't added any materials yet."
            />
          ) : (
            <div className="bv-materials-table-wrap">
              <table className="sa-table bv-materials-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Thickness</th>
                    <th>Lead Time</th>
                    <th>Stock</th>
                    <th>Custom Price</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id}>
                      <td>{m.material_name || `Material #${m.material_id}`}</td>
                      <td>{m.thickness_mm} mm</td>
                      <td>
                        {m.lead_time_days > 0 ? (
                          <span><Clock size={12} /> {m.lead_time_days} day{m.lead_time_days === 1 ? '' : 's'}</span>
                        ) : (
                          <span className="bv-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={m.is_in_stock ? 'bv-in-stock' : 'bv-out-stock'}>
                          {m.is_in_stock ? 'In stock' : 'Out of stock'}
                        </span>
                      </td>
                      <td>
                        {m.custom_price_per_cm2_mm != null
                          ? <>{fp(m.custom_price_per_cm2_mm)} / cm² · mm</>
                          : <span className="bv-muted">Default</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'listings' && (
          listings.length === 0 ? (
            <EmptyState
              icon={<LayoutGrid size={48} />}
              title="No listings yet"
              description="This vendor hasn't published any designs for sale yet."
            />
          ) : (
            <div className="mp-design-grid">
              {listings.map((d) => (
                <Link key={d.id} to={`/design/${d.id}`} className="mp-design-card">
                  <div className={`mp-design-thumb cat-${d.category}`}>
                    {d.thumbnail_url ? (
                      <img src={d.thumbnail_url} alt={d.title} />
                    ) : (
                      <div className="mp-design-placeholder">
                        <LayoutGrid size={40} />
                      </div>
                    )}
                  </div>
                  <div className="mp-design-info">
                    <h4>{d.title}</h4>
                    <div className="bv-muted" style={{ fontSize: '0.8rem' }}>
                      {d.material_name} · {d.thickness_mm}mm
                    </div>
                    <div className="mp-design-meta">
                      <span><Star size={12} /> {d.likes_count}</span>
                      <span className="mp-price">{fp(d.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {activeTab === 'reviews' && (
          reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={48} />}
              title="No reviews yet"
              description="This vendor hasn't received any customer reviews yet."
            />
          ) : (
            <div className="bv-reviews">
              <div className="bv-reviews-summary">
                <div className="bv-reviews-big">
                  <div className="bv-reviews-score">{(vendor.rating || 0).toFixed(1)}</div>
                  <RatingStars rating={vendor.rating || 0} size={18} />
                  <div className="bv-reviews-count">
                    Based on {vendor.total_reviews || reviews.length} review
                    {(vendor.total_reviews || reviews.length) === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div className="bv-reviews-list">
                {reviews.map((r) => (
                  <div key={r.id} className="bv-review-card">
                    <div className="bv-review-header">
                      <Avatar name={r.user_name} size={36} />
                      <div>
                        <strong>{r.user_name}</strong>
                        <div className="bv-review-date">
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bv-review-rating">
                        <RatingStars rating={r.rating} size={12} />
                      </div>
                    </div>
                    {r.comment && <p>{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {activeTab === 'details' && (
          <div className="vd-details">
            <div className="vd-subtabs" role="tablist" aria-label="Vendor details">
              <button
                role="tab"
                aria-selected={detailsSubTab === 'platform'}
                className="vd-subtab"
                onClick={() => setDetailsSubTab('platform')}
              >
                <ShieldCheck size={14} /> Platform Profile
              </button>
              <button
                role="tab"
                aria-selected={detailsSubTab === 'gmb'}
                className="vd-subtab"
                onClick={() => setDetailsSubTab('gmb')}
              >
                <MapPinned size={14} /> GMB Profile
              </button>
            </div>

            {detailsSubTab === 'platform' && (
              <div className="vd-detail-panel">
                <div className={`vd-detail-header-badge ${vendor.is_verified ? 'is-verified' : ''}`}>
                  <ShieldCheck size={14} />
                  <span>
                    {vendor.is_verified ? 'Verified by LaserHub' : 'Platform-entered info'}
                  </span>
                </div>

                {!hasPlatformInfo ? (
                  <EmptyState
                    icon={<Store size={40} />}
                    title="No contact details yet"
                    description="This vendor hasn't added contact details yet."
                  />
                ) : (
                  <>
                    <div className="vd-detail-grid">
                      {(vendor.phone_number || vendor.phone_country_code) && (
                        <div className="vd-detail-row">
                          <Phone size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">Phone</div>
                            <a
                              className="vd-detail-value"
                              href={`tel:${(vendor.phone_country_code || '').trim()}${(vendor.phone_number || '').trim()}`}
                            >
                              {[vendor.phone_country_code, vendor.phone_number].filter(Boolean).join(' ')}
                            </a>
                          </div>
                        </div>
                      )}
                      {vendor.business_email && (
                        <div className="vd-detail-row">
                          <Mail size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">Email</div>
                            <a className="vd-detail-value" href={`mailto:${vendor.business_email}`}>
                              {vendor.business_email}
                            </a>
                          </div>
                        </div>
                      )}
                      {vendor.website && (
                        <div className="vd-detail-row">
                          <Globe size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">Website</div>
                            <a
                              className="vd-detail-value"
                              href={vendor.website}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {vendor.website.replace(/^https?:\/\//, '')}
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      )}
                      {vendor.business_address && (
                        <div className="vd-detail-row vd-detail-row-wide">
                          <MapPin size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">Address</div>
                            <div className="vd-detail-value vd-pre-line">
                              {vendor.business_address}
                            </div>
                          </div>
                        </div>
                      )}
                      {vendor.gst_number && (
                        <div className="vd-detail-row vd-detail-row-wide">
                          <FileText size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">GST</div>
                            <div className="vd-detail-value">
                              <span>{vendor.gst_number}</span>
                              {vendor.gst_certificate_url && (
                                <a
                                  className="vd-detail-link"
                                  href={vendor.gst_certificate_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View certificate <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="vd-image-tiles">
                      <div className="vd-image-tile vd-image-tile-logo">
                        <div className="vd-image-tile-label">Logo</div>
                        <div className="vd-image-tile-box vd-aspect-1x1">
                          {vendor.logo_url ? (
                            <img src={vendor.logo_url} alt={`${vendor.shop_name} logo`} />
                          ) : (
                            <div className="vd-image-placeholder">
                              <Store size={32} />
                              <span>No logo</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="vd-image-tile vd-image-tile-storefront">
                        <div className="vd-image-tile-label">Storefront</div>
                        <div className="vd-image-tile-box vd-aspect-16x9">
                          {vendor.storefront_image_url ? (
                            <img
                              src={vendor.storefront_image_url}
                              alt={`${vendor.shop_name} storefront`}
                            />
                          ) : (
                            <div className="vd-image-placeholder">
                              <ImageIcon size={32} />
                              <span>No storefront photo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {detailsSubTab === 'gmb' && (
              <div className="vd-detail-panel">
                <div className="vd-detail-header-badge">
                  <MapPinned size={14} />
                  <span>Google My Business</span>
                </div>

                {!hasGmbInfo ? (
                  <EmptyState
                    icon={<MapPinned size={40} />}
                    title="No Google profile linked"
                    description="This vendor hasn't linked their Google My Business profile."
                  />
                ) : (
                  <>
                    <div className="vd-detail-grid">
                      {vendor.gmb_name && (
                        <div className="vd-detail-row">
                          <Store size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">Business name</div>
                            <div className="vd-detail-value">{vendor.gmb_name}</div>
                          </div>
                        </div>
                      )}
                      {vendor.gmb_phone && (
                        <div className="vd-detail-row">
                          <Phone size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">Phone</div>
                            <a className="vd-detail-value" href={`tel:${vendor.gmb_phone}`}>
                              {vendor.gmb_phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {vendor.gmb_address && (
                        <div className="vd-detail-row vd-detail-row-wide">
                          <MapPin size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">Address</div>
                            <div className="vd-detail-value vd-pre-line">{vendor.gmb_address}</div>
                          </div>
                        </div>
                      )}
                      {vendor.gmb_website && (
                        <div className="vd-detail-row">
                          <Globe size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">Website</div>
                            <a
                              className="vd-detail-value"
                              href={vendor.gmb_website}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {vendor.gmb_website.replace(/^https?:\/\//, '')}
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      )}
                      {vendor.gmb_rating != null && vendor.gmb_review_count != null && (
                        <div className="vd-detail-row">
                          <Star size={14} className="vd-detail-icon" />
                          <div className="vd-detail-body">
                            <div className="vd-detail-label">Rating</div>
                            <div className="vd-detail-value">
                              {vendor.gmb_rating.toFixed(1)} ★ ({vendor.gmb_review_count} review
                              {vendor.gmb_review_count === 1 ? '' : 's'})
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {gmbMapsHref && (
                      <div className="vd-detail-actions">
                        <a href={gmbMapsHref} target="_blank" rel="noreferrer">
                          <Button variant="secondary" icon={<MapPinned size={14} />}>
                            View on Google Maps
                          </Button>
                        </a>
                      </div>
                    )}

                    {vendor.gmb_last_synced && (
                      <div className="vd-detail-footer">
                        Last synced {relativeTime(vendor.gmb_last_synced)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bv-about">
            <div className="bv-about-main">
              <h3>About {vendor.shop_name}</h3>
              {vendor.description ? (
                <p>{vendor.description}</p>
              ) : (
                <p className="bv-muted">No description provided.</p>
              )}
            </div>
            <div className="bv-about-side">
              <div className="bv-fact">
                <span className="bv-fact-label">Turnaround</span>
                <span className="bv-fact-value">
                  {vendor.avg_turnaround_days ? `${vendor.avg_turnaround_days} days` : '—'}
                </span>
              </div>
              <div className="bv-fact">
                <span className="bv-fact-label">Min. order</span>
                <span className="bv-fact-value">
                  {vendor.min_order_amount ? fp(vendor.min_order_amount) : 'None'}
                </span>
              </div>
              <div className="bv-fact">
                <span className="bv-fact-label">Location</span>
                <span className="bv-fact-value">{vendor.location || '—'}</span>
              </div>
              <div className="bv-fact">
                <span className="bv-fact-label">Total orders</span>
                <span className="bv-fact-value">{vendor.total_orders || 0}</span>
              </div>
              {memberSince && (
                <div className="bv-fact">
                  <span className="bv-fact-label">Member since</span>
                  <span className="bv-fact-value">{memberSince}</span>
                </div>
              )}
              {vendor.website && (
                <div className="bv-fact">
                  <span className="bv-fact-label">Website</span>
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer">
                    {vendor.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
