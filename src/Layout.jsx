import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const navRoutes = {
  Overview:  '/admin',
  Clients:   '/admin/clients',
  Estimates: '/admin/estimates',
};

export default function Layout({ title, children }) {
  const navItems = ['Overview', 'Clients', 'Estimates', 'Billing', 'Settings'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif" }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        backgroundColor: '#0f172a',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* App name */}
        <div style={{
          padding: '28px 24px 24px',
          fontSize: '18px',
          fontWeight: '700',
          color: '#ffffff',
          letterSpacing: '-0.3px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          QQ360
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 0', flex: 1 }}>
          {navItems.map((item) => (
            <NavItem key={item} label={item} route={navRoutes[item] ?? null} />
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div style={{
        marginLeft: '220px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
      }}>

        {/* Top bar */}
        <header style={{
          height: '60px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#0f172a',
          }}>
            {title}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Admin</span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: '600',
              color: '#ffffff',
              flexShrink: 0,
            }}>
              A
            </div>
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

function NavItem({ label, route }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => route && navigate(route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 24px',
        fontSize: '14px',
        color: hovered ? '#ffffff' : '#94a3b8',
        backgroundColor: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        cursor: route ? 'pointer' : 'default',
        transition: 'color 0.15s, background-color 0.15s',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
}
