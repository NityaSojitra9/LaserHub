import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  LayoutGrid,
  List as ListIcon,
  ExternalLink,
} from 'lucide-react';
import { superAdminApi, SAVendor } from '../../services';
import { useCurrencyStore, formatPrice } from '../../store/currencyStore';

export function VendorsTab() {
  const { currency } = useCurrencyStore();
  const [vendors, setVendors] = useState<SAVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await superAdminApi.getVendors();
        setVendors(data);
      } catch {
        toast.error('Failed to load vendors');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleApproval = async (vendorId: number, current: boolean) => {
    try {
      const updated = await superAdminApi.approveVendor(vendorId, !current);
      setVendors((prev) => prev.map((v) => (v.id === vendorId ? updated : v)));
      toast.success(updated.is_verified ? 'Vendor approved' : 'Vendor approval revoked');
    } catch {
      toast.error('Failed to update vendor');
    }
  };

  const filtered = vendors.filter((v) => {
    if (filter === 'verified') return v.is_verified;
    if (filter === 'unverified') return !v.is_verified;
    return true;
  });

  if (loading) return <div className="sa-loading">Loading vendors...</div>;

  return (
    <div>
      <div className="sa-filters">
        <select
          className="role-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="all">All vendors</option>
          <option value="verified">Verified only</option>
          <option value="unverified">Unverified only</option>
        </select>
        <div className="sa-view-toggle">
          <button
            className={`sa-view-btn ${view === 'table' ? 'sa-view-btn--active' : ''}`}
            onClick={() => setView('table')}
            title="Table view"
          >
            <ListIcon size={16} />
          </button>
          <button
            className={`sa-view-btn ${view === 'grid' ? 'sa-view-btn--active' : ''}`}
            onClick={() => setView('grid')}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="sa-empty">No vendors match this filter.</div>
      ) : view === 'table' ? (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Verified</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td>
                    <a
                      href={`/vendor/${v.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="sa-link"
                    >
                      {v.shop_name} <ExternalLink size={12} />
                    </a>
                  </td>
                  <td>{v.owner_name}</td>
                  <td className="sa-email-cell">{v.owner_email}</td>
                  <td>{v.rating.toFixed(1)}</td>
                  <td>{v.total_orders}</td>
                  <td>{formatPrice(v.total_orders * 50, currency)}</td>
                  <td>
                    <span className={`sa-badge ${v.is_verified ? 'sa-badge--success' : 'sa-badge--warning'}`}>
                      {v.is_verified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`sa-badge ${v.is_active ? 'sa-badge--success' : 'sa-badge--danger'}`}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`sa-btn ${v.is_verified ? 'sa-btn--ghost-sm' : 'sa-btn--primary-sm'}`}
                      onClick={() => {
                        if (v.is_verified && !window.confirm(`Revoke verification for vendor "${v.shop_name}"? This cannot be undone.`)) return;
                        handleApproval(v.id, v.is_verified);
                      }}
                    >
                      {v.is_verified ? 'Revoke' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sa-vendor-grid">
          {filtered.map((v) => (
            <div className="sa-vendor-card" key={v.id}>
              <div className="sa-vendor-card__head">
                <div className="sa-avatar-md">
                  {v.shop_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="sa-vendor-card__name">{v.shop_name}</div>
                  <div className="sa-vendor-card__owner">{v.owner_name}</div>
                </div>
              </div>
              <div className="sa-vendor-card__stats">
                <div>
                  <strong>{v.rating.toFixed(1)}</strong>
                  <span>Rating</span>
                </div>
                <div>
                  <strong>{v.total_orders}</strong>
                  <span>Orders</span>
                </div>
                <div>
                  <strong>{formatPrice(v.total_orders * 50, currency)}</strong>
                  <span>Revenue</span>
                </div>
              </div>
              <div className="sa-vendor-card__footer">
                <span className={`sa-badge ${v.is_verified ? 'sa-badge--success' : 'sa-badge--warning'}`}>
                  {v.is_verified ? 'Verified' : 'Pending'}
                </span>
                <div className="sa-vendor-card__actions">
                  <a
                    href={`/vendor/${v.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="sa-btn sa-btn--ghost-sm"
                  >
                    <ExternalLink size={14} /> Profile
                  </a>
                  <button
                    className={`sa-btn ${v.is_verified ? 'sa-btn--ghost-sm' : 'sa-btn--primary-sm'}`}
                    onClick={() => {
                      if (v.is_verified && !window.confirm(`Revoke verification for vendor "${v.shop_name}"? This cannot be undone.`)) return;
                      handleApproval(v.id, v.is_verified);
                    }}
                  >
                    {v.is_verified ? 'Revoke' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
