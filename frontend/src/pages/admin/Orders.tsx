import { useEffect, useState } from 'react';
import {
  Search,
  Download,
  AlertCircle,
} from 'lucide-react';
import { superAdminApi, Order } from '../../services';
import { useCurrencyStore, formatPrice } from '../../store/currencyStore';

export function OrdersTab() {
  const { currency } = useCurrencyStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await superAdminApi.listOrders();
        setOrders(data);
      } catch {
        setError('Unable to load orders. The platform-wide orders endpoint may require admin auth.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !o.order_number.toLowerCase().includes(s) &&
        !o.customer_name?.toLowerCase().includes(s) &&
        !o.customer_email?.toLowerCase().includes(s) &&
        !(o.vendor_name || '').toLowerCase().includes(s)
      ) return false;
    }
    return true;
  });

  const exportCsv = () => {
    const headers = ['Order #', 'Customer', 'Email', 'Vendor', 'Material', 'Qty', 'Total', 'Status', 'Created'];
    const rows = filtered.map((o) => [
      o.order_number,
      o.customer_name,
      o.customer_email,
      o.vendor_name || '',
      o.material_name,
      o.quantity,
      o.total_amount,
      o.status,
      o.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((x) => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="sa-loading">Loading orders...</div>;

  if (error) {
    return (
      <div className="sa-empty-state">
        <AlertCircle size={32} />
        <h3>Orders unavailable</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="sa-filters">
        <div className="sa-search-wrapper">
          <Search size={16} />
          <input
            className="sa-search"
            type="text"
            placeholder="Search orders, customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="role-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="sa-btn sa-btn--ghost-sm" onClick={exportCsv}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="sa-bulk-bar">
        <span className="sa-count">
          Showing {filtered.length} of {orders.length} orders
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="sa-empty">No orders match these filters.</div>
      ) : (
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Vendor</th>
                <th>Material</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.order_number}</strong></td>
                  <td>
                    <div>{o.customer_name}</div>
                    <div className="sa-email-cell">{o.customer_email}</div>
                  </td>
                  <td>{o.vendor_name || <span className="sa-muted">--</span>}</td>
                  <td>{o.material_name} ({o.thickness_mm}mm)</td>
                  <td>{formatPrice(o.total_amount, currency)}</td>
                  <td>
                    <span className={`sa-badge sa-badge--${
                      o.status === 'delivered' ? 'success' :
                      o.status === 'cancelled' ? 'danger' :
                      o.status === 'shipped' ? 'info' : 'warning'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
