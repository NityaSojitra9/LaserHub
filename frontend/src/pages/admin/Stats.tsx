import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  Store,
  BarChart3,
  Package,
  UserPlus,
} from 'lucide-react';
import { superAdminApi, SAStats, SAVendor, SADesign } from '../../services';
import { useCurrencyStore, formatPrice } from '../../store/currencyStore';

export function StatsTab() {
  const { currency } = useCurrencyStore();
  const [stats, setStats] = useState<SAStats | null>(null);
  const [vendors, setVendors] = useState<SAVendor[]>([]);
  const [designs, setDesigns] = useState<SADesign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, v, d] = await Promise.all([
          superAdminApi.getStats(),
          superAdminApi.getVendors(),
          superAdminApi.getDesigns(),
        ]);
        setStats(s);
        setVendors(v);
        setDesigns(d);
      } catch {
        toast.error('Failed to load stats');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="sa-loading">Loading stats...</div>;
  if (!stats) return <div className="sa-empty">Unable to load statistics.</div>;

  const topVendors = [...vendors]
    .sort((a, b) => b.total_orders - a.total_orders)
    .slice(0, 5)
    .map((v) => ({ name: v.shop_name, orders: v.total_orders }));

  const categoryCounts: Record<string, number> = {};
  designs.forEach((d) => {
    categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name: name.replace('_', ' '), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const cards = [
    { label: 'Total Users', value: stats.total_users, icon: <Users size={22} /> },
    { label: 'Total Vendors', value: stats.total_vendors, icon: <Store size={22} /> },
    { label: 'Total Orders', value: stats.total_orders, icon: <Package size={22} /> },
    {
      label: 'Total Revenue',
      value: formatPrice(stats.total_revenue, currency),
      icon: <BarChart3 size={22} />,
    },
    { label: 'Users This Month', value: stats.users_this_month, icon: <UserPlus size={22} /> },
  ];

  return (
    <div>
      <div className="sa-stats-grid">
        {cards.map((c) => (
          <div className="sa-stat-card" key={c.label}>
            <div className="sa-stat-card__icon">{c.icon}</div>
            <div className="sa-stat-card__body">
              <span className="sa-stat-card__value">{c.value}</span>
              <span className="sa-stat-card__label">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="sa-charts-grid">
        <div className="sa-panel">
          <div className="sa-panel__header">
            <h3>Top Vendors by Orders</h3>
          </div>
          {topVendors.length === 0 ? (
            <div className="sa-panel__empty">No vendor data yet.</div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={topVendors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="sa-panel">
          <div className="sa-panel__header">
            <h3>Top Design Categories</h3>
          </div>
          {topCategories.length === 0 ? (
            <div className="sa-panel__empty">No design data yet.</div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={topCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
