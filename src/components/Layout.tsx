import React, { useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  ClipboardList,
  PlusCircle,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  Home,
  MessageSquare,
  Star,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const NAVBAR_HEIGHT = 60;
const SIDEBAR_WIDTH = 240;

// Styles
const navbarStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: NAVBAR_HEIGHT,
  background: 'var(--surface)',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px',
  zIndex: 100,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

const logoStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: 'var(--primary)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textDecoration: 'none',
  cursor: 'pointer',
};

const navLinksStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const navLinkStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  color: active ? 'var(--primary)' : 'var(--text-muted)',
  background: active ? 'var(--primary-light)' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.15s ease',
  cursor: 'pointer',
});

const iconBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '38px',
  height: '38px',
  border: 'none',
  background: 'transparent',
  borderRadius: '8px',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  position: 'relative',
  transition: 'background 0.15s ease',
};

const rightSectionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const userMenuBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 12px',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  color: 'var(--text)',
  fontFamily: 'inherit',
};

const avatarStyle: CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'var(--primary)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 600,
};

const dropdownMenuStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '8px',
  background: 'var(--surface)',
  borderRadius: '12px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
  border: '1px solid var(--border)',
  minWidth: '220px',
  padding: '8px',
  zIndex: 200,
};

const dropdownItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: '8px',
  fontSize: '14px',
  color: 'var(--text)',
  cursor: 'pointer',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left' as const,
  fontFamily: 'inherit',
  transition: 'background 0.1s ease',
};

const sidebarStyle: CSSProperties = {
  position: 'fixed',
  top: NAVBAR_HEIGHT,
  left: 0,
  bottom: 0,
  width: SIDEBAR_WIDTH,
  background: 'var(--surface)',
  borderRight: '1px solid var(--border)',
  padding: '16px 12px',
  overflowY: 'auto',
  zIndex: 50,
};

const sidebarLinkStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: active ? 600 : 400,
  color: active ? 'var(--primary)' : 'var(--text)',
  background: active ? 'var(--primary-light)' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.15s ease',
  cursor: 'pointer',
  marginBottom: '4px',
});

const mainContentStyle: CSSProperties = {
  marginTop: NAVBAR_HEIGHT,
  marginLeft: SIDEBAR_WIDTH,
  padding: '24px',
  minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
};

const roleBadgeStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: '9999px',
  color: '#fff',
  textTransform: 'uppercase' as const,
};

const mobileBackdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 99,
  display: 'none',
};

export default function Layout({ children }: LayoutProps) {
  const { userId, profile, roles, isMaster, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const firstName = profile?.profile?.first_name ?? 'Пользователь';
  const initial = firstName.charAt(0).toUpperCase();
  const roleLabel = roles.includes('admin')
    ? 'Админ'
    : roles.includes('moderator')
      ? 'Модер'
      : isMaster
        ? 'Мастер'
        : 'Клиент';

  const roleBadgeBg =
    roles.includes('admin')
      ? '#7c3aed'
      : roles.includes('moderator')
        ? '#f59e0b'
        : isMaster
          ? '#22c55e'
          : 'var(--primary)';

  const sidebarItems = [
    { to: '/', label: 'Главная', icon: <Home size={20} /> },
    { to: '/orders', label: 'Заказы', icon: <ClipboardList size={20} /> },
    { to: '/orders/create', label: 'Создать заказ', icon: <PlusCircle size={20} /> },
    { to: '/chats', label: 'Чаты', icon: <MessageSquare size={20} /> },
  ];

  if (isMaster) {
    sidebarItems.push({ to: '/reviews', label: 'Отзывы', icon: <Star size={20} /> });
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={navbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Mobile hamburger */}
          <button
            style={{ ...iconBtnStyle, display: 'block' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" style={logoStyle}>
            Quicky
          </Link>
        </div>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ul style={navLinksStyle} className="desktop-nav">
            <li>
              <Link to="/orders" style={navLinkStyle(isActive('/orders'))}>
                <ClipboardList size={18} />
                <span>Заказы</span>
              </Link>
            </li>
            <li>
              <Link to="/orders/create" style={navLinkStyle(isActive('/orders/create'))}>
                <PlusCircle size={18} />
                <span>Создать заказ</span>
              </Link>
            </li>
          </ul>

          <style>{`
            @media (max-width: 768px) {
              .desktop-nav { display: none !important; }
            }
          `}</style>
        </div>

        <div style={rightSectionStyle}>
          {/* Notification Bell */}
          <button
            style={iconBtnStyle}
            onClick={() => navigate('/notifications')}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
            aria-label="Уведомления"
          >
            <Bell size={20} />
          </button>

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <button
              style={userMenuBtnStyle}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div style={avatarStyle}>{initial}</div>
              <span style={{ fontWeight: 500 }}>{firstName}</span>
              <span style={{ ...roleBadgeStyle, background: roleBadgeBg }}>{roleLabel}</span>
            </button>

            {userMenuOpen && (
              <>
                <div
                  style={mobileBackdropStyle}
                  onClick={() => setUserMenuOpen(false)}
                />
                <div style={dropdownMenuStyle}>
                  <button
                    style={dropdownItemStyle}
                    onClick={() => { setUserMenuOpen(false); navigate(`/profile/${userId}`); }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'none';
                    }}
                  >
                    <User size={16} />
                    Профиль
                  </button>
                  <div
                    style={{
                      ...dropdownItemStyle,
                      cursor: 'default',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      padding: '6px 12px',
                    }}
                  >
                    <span style={{ ...roleBadgeStyle, background: roleBadgeBg, marginRight: '4px' }}>
                      {roleLabel}
                    </span>
                    {firstName}
                  </div>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                  <button
                    style={{ ...dropdownItemStyle, color: 'var(--danger)' }}
                    onClick={handleLogout}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'none';
                    }}
                  >
                    <LogOut size={16} />
                    Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        style={{
          ...sidebarStyle,
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
        className="sidebar"
      >
        <div style={{ padding: '8px 0' }}>
          {sidebarItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={sidebarLinkStyle(isActive(item.to))}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
        }
      `}</style>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          style={{ ...mobileBackdropStyle, display: 'block' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main style={mainContentStyle} className="main-content">
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
