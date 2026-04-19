import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const ACCENT = '#0d3d2a';

const navGroups = [
  {
    label: 'MENU',
    items: [
      { label: 'Overview',  route: '/admin',            icon: '⊞' },
      { label: 'Clients',   route: '/admin/clients',    icon: '◎' },
      { label: 'Estimates', route: '/admin/estimates',  icon: '▤' },
    ],
  },
  {
    label: 'GENERAL',
    items: [
      { label: 'Billing',   route: '/admin/billing',   icon: '◈' },
      { label: 'Settings',  route: '/admin/settings',  icon: '✦' },
    ],
  },
];

export default function Layout({ title, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #eaeaea',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: ACCENT, letterSpacing: '-0.3px' }}>
            QQ360
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', letterSpacing: '0.2px' }}>
            Admin Dashboard
          </div>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, padding: '4px 0', overflowY: 'auto' }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: '8px' }}>
              <div style={{
                padding: '10px 20px 6px',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '1px',
                color: '#c4c9d4',
                textTransform: 'uppercase',
              }}>
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavItem key={item.label} label={item.label} route={item.route} icon={item.icon} />
              ))}
            </div>
          ))}
        </nav>

        {/* User row */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #eaeaea',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            color: '#ffffff',
            flexShrink: 0,
          }}>
            AD
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117', lineHeight: 1.3 }}>Admin</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Super Admin</div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div style={{
        marginLeft: '220px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#F0F2F5',
      }}>

        {/* Top bar */}
        <header style={{
          height: '60px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #eaeaea',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          {/* Search — centered */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '999px',
              padding: '0 14px',
              width: '100%',
              maxWidth: '400px',
              height: '38px',
            }}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Search clients, estimates..."
                style={{
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  color: '#0d1117',
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Date filters — far right */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Today', 'This Week', 'This Month'].map((f) => {
              const active = f === 'This Month';
              return (
                <button key={f} type="button" style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '500',
                  borderRadius: '999px',
                  border: active ? 'none' : '1px solid #eaeaea',
                  backgroundColor: active ? ACCENT : '#ffffff',
                  color: active ? '#ffffff' : '#9ca3af',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  {f}
                </button>
              );
            })}
          </div>
        </header>

        {/* Content area */}
        <main style={{ padding: '32px', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ label, route, icon }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === route;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        margin: '1px 0',
        fontSize: '13px',
        fontWeight: active ? '600' : '500',
        color: active ? ACCENT : hovered ? '#0d1117' : '#6b7280',
        backgroundColor: 'transparent',
        borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
        userSelect: 'none',
      }}
    >
      <span style={{
        fontSize: '14px',
        marginRight: '10px',
        opacity: active ? 1 : 0.5,
      }}>
        {icon}
      </span>
      {label}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="6" r="4.5" />
      <line x1="9.5" y1="9.5" x2="13" y2="13" />
    </svg>
  );
}
