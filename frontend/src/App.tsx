import { useEffect, useState, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorFallback } from './components/ErrorFallback';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { BrowseDesignsPage } from './pages/BrowseDesignsPage';
import { VendorsPage } from './pages/VendorsPage';
import { VendorProfilePage } from './pages/VendorProfilePage';
import { DesignDetailPage } from './pages/DesignDetailPage';
import { VendorRegisterPage } from './pages/VendorRegisterPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { RefundPolicyPage } from './pages/RefundPolicyPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { PublicQuotePage } from './pages/PublicQuotePage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { MaterialWizardPage } from './pages/MaterialWizardPage';
import { MaterialComparePage } from './pages/MaterialComparePage';
import { SamplePackPage } from './pages/SamplePackPage';
import { useAuthStore } from './store/authStore';
import { isSuperAdmin, isVendor } from './utils/roles';
import { useCurrencyStore } from './store/currencyStore';
import { CurrencySwitcher } from './components/CurrencySwitcher';
import { NotificationPrompt } from './components/NotificationPrompt';
import { useEscapeKey } from './hooks/useEscapeKey';
import { Toaster } from 'sonner';
import { Sun, Moon, Upload, Search, Store, Menu, X, LogIn, User, LogOut, Github, LayoutDashboard, Package, Users, Image as ImageIcon, BarChart2, Shield } from 'lucide-react';
import './App.css';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function NavAvatar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  const handleLogout = () => {
    logout();
    setOpen(false);
    onNavigate?.();
    navigate('/');
  };

  if (!user) {
    return (
      <Link to="/login" className="nav-link nav-login-btn" onClick={onNavigate}>
        <LogIn size={16} />
        Login
      </Link>
    );
  }

  const isVendorOrAdmin = isVendor(user) || !!user?.is_admin;
  const userIsSuperAdmin = isSuperAdmin(user);

  const closeMenu = () => { setOpen(false); onNavigate?.(); };

  return (
    <div className="nav-avatar-wrapper" ref={ref}>
      <button
        className="nav-avatar-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="User menu"
        aria-expanded={open}
      >
        <span className="nav-avatar-initials">{getInitials(user.name)}</span>
      </button>
      {open && (
        <div className="nav-dropdown">
          <div className="nav-dropdown-header">
            <span className="nav-dropdown-name">{user.name}</span>
            <span className="nav-dropdown-email">{user.email}</span>
          </div>
          <div className="nav-dropdown-divider" />
          <Link to="/admin/profile" className="nav-dropdown-item" onClick={closeMenu}>
            <User size={15} />
            Profile
          </Link>
          <Link to="/admin/my-orders" className="nav-dropdown-item" onClick={closeMenu}>
            <User size={15} />
            My Orders
          </Link>
          {isVendorOrAdmin && (
            <>
              <div className="nav-dropdown-divider" />
              <div className="nav-dropdown-heading">Vendor</div>
              <Link to="/admin/dashboard" className="nav-dropdown-item" onClick={closeMenu}>
                <LayoutDashboard size={15} />
                Vendor Dashboard
              </Link>
              <Link to="/admin/materials" className="nav-dropdown-item" onClick={closeMenu}>
                <Package size={15} />
                Materials
              </Link>
            </>
          )}
          {userIsSuperAdmin && (
            <>
              <div className="nav-dropdown-divider" />
              <div className="nav-dropdown-heading">
                <Shield size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Super Admin
              </div>
              <Link to="/admin/sa-users" className="nav-dropdown-item" onClick={closeMenu}>
                <Users size={15} />
                Users
              </Link>
              <Link to="/admin/sa-vendors" className="nav-dropdown-item" onClick={closeMenu}>
                <Store size={15} />
                Vendors
              </Link>
              <Link to="/admin/sa-designs" className="nav-dropdown-item" onClick={closeMenu}>
                <ImageIcon size={15} />
                Designs
              </Link>
              <Link to="/admin/sa-stats" className="nav-dropdown-item" onClick={closeMenu}>
                <BarChart2 size={15} />
                Platform Stats
              </Link>
            </>
          )}
          <div className="nav-dropdown-divider" />
          <button className="nav-dropdown-item nav-dropdown-logout" onClick={handleLogout}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function NavLinks({ isDarkMode, toggleDarkMode, onNavigate }: {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link to="/browse" className="nav-link" onClick={onNavigate}>
        <Search size={16} />
        Browse
      </Link>
      <Link to="/upload" className="nav-link" onClick={onNavigate}>
        <Upload size={16} />
        Upload
      </Link>
      <Link to="/vendors" className="nav-link" onClick={onNavigate}>
        <Store size={16} />
        Vendors
      </Link>
      <CurrencySwitcher />
      <NavAvatar onNavigate={onNavigate} />
      <button
        onClick={toggleDarkMode}
        className="theme-toggle"
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </>
  );
}

function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const { checkAuth } = useAuthStore();
  const { detect: detectCurrency } = useCurrencyStore();

  // Restore auth state and detect currency on mount
  useEffect(() => {
    checkAuth();
    detectCurrency();
  }, [checkAuth, detectCurrency]);

  // Close nav on route change
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to main content</a>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <span className="logo">⚡</span>
            LaserHub
          </Link>
          <button
            className="nav-toggle"
            onClick={() => setNavOpen(!navOpen)}
            aria-label="Toggle navigation"
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={`nav-links${navOpen ? ' nav-open' : ''}`}>
            <NavLinks isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} onNavigate={closeNav} />
          </div>
        </div>
      </nav>

      <NotificationPrompt />

      <main className="main" id="main" tabIndex={-1}>
        <ErrorBoundary
          FallbackComponent={ErrorFallback as unknown as React.ComponentType<FallbackProps>}
          onReset={() => window.location.assign('/')}
        >
          <Routes>
            <Route path="/" element={<MarketplacePage />} />
            <Route path="/upload" element={<HomePage />} />
            <Route path="/browse" element={<BrowseDesignsPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/vendor/register" element={<VendorRegisterPage />} />
            <Route path="/vendor/:slug" element={<VendorProfilePage />} />
            <Route path="/design/:id" element={<DesignDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/*" element={<AdminPage />} />
            <Route path="/super-admin/*" element={<Navigate to="/admin/sa-users" replace />} />
            <Route path="/vendor/dashboard/*" element={<VendorDashboardPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/track/:token" element={<TrackOrderPage />} />
            <Route path="/tracking/:identifier" element={<OrderTrackingPage />} />
            <Route path="/q/:quote_number" element={<PublicQuotePage />} />
            <Route path="/material-wizard" element={<MaterialWizardPage />} />
            <Route path="/materials/compare" element={<MaterialComparePage />} />
            <Route path="/samples" element={<SamplePackPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span>LaserHub</span> by <a href="https://hjlabs.in" target="_blank" rel="noopener noreferrer">hjLabs.in</a>
          </div>
          <div className="footer-links">
            <a href="https://github.com/hemangjoshi37a/LaserHub" target="_blank" rel="noopener noreferrer" className="footer-github-link">
              <Github size={16} />
              GitHub
            </a>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/refund-policy">Refund Policy</Link>
          </div>
          <details className="footer-more-tools">
            <summary>More tools from hjLabs.in</summary>
            <div className="footer-tool-links footer-ecosystem">
              <a href="https://og.hjlabs.in" target="_blank" rel="noopener noreferrer">OG Generator</a>
              <a href="https://fmt.hjlabs.in" target="_blank" rel="noopener noreferrer">Dev Tools</a>
              <a href="https://enhance.hjlabs.in" target="_blank" rel="noopener noreferrer">AI Image Enhancer</a>
              <a href="https://compliance.hjlabs.in" target="_blank" rel="noopener noreferrer">DPDPA Compliance</a>
              <a href="https://pixel.hjlabs.in" target="_blank" rel="noopener noreferrer">Arduino Image2CPP</a>
              <a href="https://hjlabs.in/AIML/" target="_blank" rel="noopener noreferrer">AI/ML Services</a>
            </div>
          </details>
          <p className="footer-copy">&copy; {new Date().getFullYear()} hjLabs.in. All rights reserved.</p>
        </div>
      </footer>

      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={2000}
        toastOptions={{
          style: { pointerEvents: 'auto' },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
