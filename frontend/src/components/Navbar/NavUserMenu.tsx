import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  Package, 
  Users, 
  Store, 
  Image as ImageIcon, 
  BarChart2, 
  Shield,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { isSuperAdmin, isVendor } from '../../utils/roles';
import { useEscapeKey } from '../../hooks/useEscapeKey';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const NavUserMenu: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEscapeKey(() => setIsOpen(false), isOpen);

  if (!user) {
    return (
      <div className="nav-auth-btns">
        <Link to="/login" className="nav-btn-login">Login</Link>
        <Link to="/register" className="nav-btn-register">Get Started</Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const userIsVendor = isVendor(user) || !!user?.is_admin;
  const userIsSuperAdmin = isSuperAdmin(user);

  return (
    <div className="nav-user-menu" ref={menuRef}>
      <button
        className={`nav-avatar-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <span className="nav-avatar-initials">{getInitials(user.name)}</span>
      </button>

      {isOpen && (
        <div className="nav-dropdown">
          <div className="nav-dropdown-info">
            <span className="nav-dropdown-name">{user.name}</span>
            <span className="nav-dropdown-email">{user.email}</span>
          </div>
          
          <div className="nav-dropdown-list">
            <Link to="/admin/profile" className="nav-dropdown-item" onClick={() => setIsOpen(false)}>
              <User size={16} />
              <span>Profile</span>
            </Link>
            <Link to="/admin/my-orders" className="nav-dropdown-item" onClick={() => setIsOpen(false)}>
              <Package size={16} />
              <span>My Orders</span>
            </Link>
            <Link to="/admin/settings" className="nav-dropdown-item" onClick={() => setIsOpen(false)}>
              <Settings size={16} />
              <span>Settings</span>
            </Link>

            {userIsVendor && (
              <>
                <div className="nav-dropdown-divider" />
                <div className="nav-dropdown-section">Vendor Hub</div>
                <Link to="/admin/dashboard" className="nav-dropdown-item" onClick={() => setIsOpen(false)}>
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/admin/materials" className="nav-dropdown-item" onClick={() => setIsOpen(false)}>
                  <Store size={16} />
                  <span>Materials</span>
                </Link>
              </>
            )}

            {userIsSuperAdmin && (
              <>
                <div className="nav-dropdown-divider" />
                <div className="nav-dropdown-section">
                  <Shield size={12} style={{ marginRight: 6 }} />
                  Platform Admin
                </div>
                <Link to="/admin/sa-users" className="nav-dropdown-item" onClick={() => setIsOpen(false)}>
                  <Users size={16} />
                  <span>User Management</span>
                </Link>
                <Link to="/admin/sa-vendors" className="nav-dropdown-item" onClick={() => setIsOpen(false)}>
                  <Store size={16} />
                  <span>Vendor Management</span>
                </Link>
                <Link to="/admin/sa-designs" className="nav-dropdown-item" onClick={() => setIsOpen(false)}>
                  <ImageIcon size={16} />
                  <span>Designs</span>
                </Link>
                <Link to="/admin/sa-stats" className="nav-dropdown-item" onClick={() => setIsOpen(false)}>
                  <BarChart2 size={16} />
                  <span>Analytics</span>
                </Link>
              </>
            )}

            <div className="nav-dropdown-divider" />
            <button className="nav-dropdown-item nav-dropdown-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
