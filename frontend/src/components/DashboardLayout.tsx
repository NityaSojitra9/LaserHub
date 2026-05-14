import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Image as ImageIcon, 
  Receipt, 
  MapPin, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  Store,
  ShoppingCart,
  BarChart2,
  Layers,
  Bell,
  Search,
  CheckCircle2,
  Users,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { formatRole, isVendor, isSuperAdmin } from '../utils/roles';
import '../styles/dashboard-new.css';

interface NavItem {
  key: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const CUSTOMER_NAV: NavItem[] = [
  { key: 'overview', label: 'My Projects', icon: LayoutDashboard, path: '/dashboard/profile' },
  { key: 'orders', label: 'Orders', icon: Package, path: '/dashboard/my-orders' },
  { key: 'designs', label: 'Design Library', icon: ImageIcon, path: '/dashboard/my-designs' },
  { key: 'invoices', label: 'Billing', icon: Receipt, path: '/dashboard/my-invoices' },
  { key: 'addresses', label: 'Shipping', icon: MapPin, path: '/dashboard/billing-addresses' },
  { key: 'settings', label: 'Account', icon: Settings, path: '/dashboard/my-settings' },
];

const VENDOR_NAV: NavItem[] = [
  { key: 'overview', label: 'Mission Control', icon: BarChart2, path: '/vendor/dashboard/dashboard' },
  { key: 'orders', label: 'Fulfillment', icon: Package, path: '/vendor/dashboard/orders' },
  { key: 'catalog', label: 'Shop Catalog', icon: Layers, path: '/vendor/dashboard/materials-inventory' },
  { key: 'storefront', label: 'My Storefront', icon: Store, path: '/vendor/dashboard/storefront' },
  { key: 'team', label: 'Team', icon: Users, path: '/vendor/dashboard/team' },
  { key: 'settings', label: 'Shop Settings', icon: Settings, path: '/vendor/dashboard/my-settings' },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!user) return null;

  const userIsVendor = isVendor(user);
  const userIsSuperAdmin = isSuperAdmin(user);
  
  // Choose navigation based on role
  const navItems = userIsVendor ? VENDOR_NAV : CUSTOMER_NAV;
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard/overview' && location.pathname === '/dashboard') return true;
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`dash-container ${userIsSuperAdmin ? 'theme-admin' : userIsVendor ? 'theme-vendor' : 'theme-customer'}`}>
      {/* Sidebar */}
      <aside className={`dash-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="dash-sidebar-header">
          <Link to="/" className="dash-logo">
            <div className="dash-logo-icon">L</div>
            <span className="dash-logo-text">LaserHub</span>
          </Link>
          <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="dash-user-section">
          <div className="dash-avatar">
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            {userIsSuperAdmin ? (
              <div className="admin-badge"><Shield size={10} /></div>
            ) : userIsVendor ? (
              <div className="vendor-badge"><Store size={10} /></div>
            ) : null}
          </div>
          <div className="dash-user-info">
            <span className="dash-user-name">{user.name}</span>
            <span className="dash-user-role">
              {userIsSuperAdmin ? 'System Admin' : userIsVendor ? 'Shop Manager' : 'Project Owner'}
            </span>
          </div>
        </div>

        <nav className="dash-nav">
          <div className="dash-nav-group">
            <span className="dash-nav-label">Menu</span>
            {navItems.map(item => (
              <Link
                key={item.key}
                to={item.path}
                className={`dash-nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {isActive(item.path) && <div className="active-indicator" />}
              </Link>
            ))}
          </div>
        </nav>

        <div className="dash-sidebar-footer">
          {userIsVendor && !userIsSuperAdmin && (
            <Link to={`/shop/${user.id}`} className="dash-view-shop">
              <Store size={16} />
              <span>View Public Shop</span>
            </Link>
          )}
          <button className="dash-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dash-main">
        {/* Top Header */}
        <header className={`dash-header ${scrolled ? 'scrolled' : ''}`}>
          <div className="dash-header-left">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="dash-breadcrumb">
              <span className="dash-breadcrumb-item">Dashboard</span>
              <span className="dash-breadcrumb-sep">/</span>
              <span className="dash-breadcrumb-item active">
                {navItems.find(n => isActive(n.path))?.label || 'Overview'}
              </span>
            </div>
          </div>

          <div className="dash-header-right">
            <div className="dash-search-box">
              <Search size={16} />
              <input type="text" placeholder="Search orders, designs..." />
            </div>
            <button className="dash-icon-btn">
              <Bell size={20} />
              <div className="notification-dot" />
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar-xs">
                {user.name[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="dash-content">
          {children}
        </main>
      </div>
    </div>
  );
};
