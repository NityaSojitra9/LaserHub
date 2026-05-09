import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isSuperAdmin } from '../utils/roles';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  Shield,
  Users,
  Store,
  BarChart3,
  Palette,
  LayoutDashboard,
  Package,
  ArrowLeft,
} from 'lucide-react';
import { OverviewTab } from './admin/Overview';
import { UsersTab } from './admin/Users';
import { VendorsTab } from './admin/Vendors';
import { DesignsTab } from './admin/Designs';
import { OrdersTab } from './admin/Orders';
import { StatsTab } from './admin/Stats';
import type { SuperAdminTab } from './admin/_shared';

// ---------------------------------------------------------------------------
// Main page with sidebar
// ---------------------------------------------------------------------------
export function SuperAdminPage() {
  useDocumentTitle('Super Admin — LaserHub');
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<SuperAdminTab>('overview');

  if (!isSuperAdmin(user)) {
    return (
      <div className="super-admin-page">
        <div className="sa-access-denied">
          <Shield size={48} />
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const navItems: { key: SuperAdminTab; label: string; icon: JSX.Element }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { key: 'users', label: 'Users', icon: <Users size={18} /> },
    { key: 'vendors', label: 'Vendors', icon: <Store size={18} /> },
    { key: 'designs', label: 'Designs', icon: <Palette size={18} /> },
    { key: 'orders', label: 'Orders', icon: <Package size={18} /> },
    { key: 'stats', label: 'Stats', icon: <BarChart3 size={18} /> },
  ];

  const currentLabel = navItems.find((n) => n.key === tab)?.label ?? 'Overview';

  return (
    <div className="super-admin-layout">
      <aside className="sa-sidebar">
        <div className="sa-sidebar__brand">
          <Shield size={22} />
          <span>Super Admin</span>
        </div>
        <nav className="sa-sidebar__nav">
          {navItems.map((n) => (
            <button
              key={n.key}
              className={`sa-sidebar__link ${tab === n.key ? 'sa-sidebar__link--active' : ''}`}
              onClick={() => setTab(n.key)}
            >
              {n.icon}
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sa-sidebar__footer">
          <button className="sa-sidebar__link" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
            <span>Back to Site</span>
          </button>
        </div>
      </aside>

      <main className="sa-main">
        <header className="sa-main__header">
          <h1>{currentLabel}</h1>
        </header>
        <div className="sa-content">
          {tab === 'overview' && <OverviewTab goTo={setTab} />}
          {tab === 'users' && <UsersTab />}
          {tab === 'vendors' && <VendorsTab />}
          {tab === 'designs' && <DesignsTab />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'stats' && <StatsTab />}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Embeddable content component for the unified admin dashboard
// Renders the appropriate sub-tab without its own sidebar/layout
// ---------------------------------------------------------------------------
export function SuperAdminTabContent({ activeTab }: { activeTab: string }) {
  const [internalTab, setInternalTab] = useState(activeTab);

  useEffect(() => {
    setInternalTab(activeTab);
  }, [activeTab]);

  const TAB_LABELS: Record<string, string> = {
    overview: 'Platform Overview',
    users: 'User Management',
    vendors: 'Vendor Management',
    designs: 'Design Management',
    orders: 'All Platform Orders',
    stats: 'Platform Statistics',
  };

  return (
    <div className="adm-page animate-in">
      <header className="adm-page-header">
        <div>
          <h1 className="adm-page-title">{TAB_LABELS[internalTab] || 'Super Admin'}</h1>
          <p className="adm-page-sub">Platform-wide administration</p>
        </div>
      </header>
      <div className="sa-content">
        {internalTab === 'overview' && <OverviewTab goTo={(t) => setInternalTab(t)} />}
        {internalTab === 'users' && <UsersTab />}
        {internalTab === 'vendors' && <VendorsTab />}
        {internalTab === 'designs' && <DesignsTab />}
        {internalTab === 'orders' && <OrdersTab />}
        {internalTab === 'stats' && <StatsTab />}
      </div>
    </div>
  );
}
