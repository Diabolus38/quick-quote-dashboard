import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SIDEBAR_BG = '#1a1f2e';

const topNavItems = [
  { icon: '▤', route: '/admin'           },
  { icon: '◎', route: '/admin/clients'   },
  { icon: '⊞', route: '/admin/estimates' },
  { icon: '◈', route: '/admin/billing'   },
];

const bottomNavItems = [
  { icon: '✦', route: '/admin/settings' },
  { icon: '✉', route: null              },
];

export default function Layout({ title, children, rightPanel }) {
  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '64px', flexShrink: 0,
        backgroundColor: SIDEBAR_BG,
        position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: 20,
      }}>
        {/* Q logo */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '8px',
          backgroundColor: '#2d3548',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: '700', color: '#fff',
          margin: '16px auto 16px', flexShrink: 0,
        }}>
          Q
        </div>

        {/* Top nav icons */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, alignItems: 'center', paddingTop: '4px' }}>
          {topNavItems.map((item) => (
            <NavIcon key={item.route} icon={item.icon} route={item.route} />
          ))}
        </nav>

        {/* Bottom nav icons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', paddingBottom: '20px' }}>
          {bottomNavItems.map((item, i) => (
            <NavIcon key={i} icon={item.icon} route={item.route} />
          ))}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{
        marginLeft: '64px', flex: 1,
        display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden',
        backgroundColor: '#F0F2F5',
      }}>

        {/* Top bar */}
        <header style={{
          height: '56px', flexShrink: 0,
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: '16px',
        }}>
          {/* Title */}
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#0d1117', whiteSpace: 'nowrap' }}>
            {title || 'Homepage'}
          </span>

          {/* Search — centered */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              border: '1px solid #e5e7eb', borderRadius: '8px',
              padding: '0 12px', width: '260px', height: '36px',
              backgroundColor: '#fff', flexShrink: 0,
            }}>
              <MagnifyIcon />
              <input
                type="text"
                placeholder="Quick Search..."
                style={{
                  border: 'none', outline: 'none', background: 'none',
                  fontSize: '13px', color: '#0d1117', width: '100%', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Mail */}
            <span style={{ fontSize: '16px', color: '#6b7280', cursor: 'pointer', lineHeight: 1 }}>✉</span>
            {/* Share */}
            <ShareIcon />

            {/* Avatar group */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[
                { initials: 'AB', bg: '#dbeafe', color: '#1d4ed8' },
                { initials: 'SC', bg: '#fce7f3', color: '#9d174d' },
                { initials: 'MH', bg: '#d1fae5', color: '#065f46' },
              ].map((a, i) => (
                <div key={i} style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  backgroundColor: a.bg, color: a.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: '700',
                  marginLeft: i > 0 ? '-7px' : '0',
                  border: '2px solid #fff',
                  position: 'relative', zIndex: 3 - i,
                }}>
                  {a.initials}
                </div>
              ))}
              <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '6px', fontWeight: '500' }}>+10</span>
            </div>

            {/* Invite button */}
            <button type="button" style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              border: '1px solid #e5e7eb', borderRadius: '8px',
              padding: '6px 14px', fontSize: '13px', fontWeight: '500',
              backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              <PersonIcon /> Invite
            </button>

            {/* Bell */}
            <BellIcon />

            {/* User avatar + name + chevron */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                backgroundColor: SIDEBAR_BG,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0,
              }}>
                AD
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117' }}>Admin</span>
              <ChevronIcon />
            </div>
          </div>
        </header>

        {/* Content: left col + optional right col */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
            {children}
          </main>
          {rightPanel && (
            <aside style={{
              width: '300px', flexShrink: 0,
              borderLeft: '1px solid #f0f0f0',
              padding: '24px', overflowY: 'auto',
              backgroundColor: '#fff',
            }}>
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function NavIcon({ icon, route }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const active = route != null && location.pathname === route;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => route && navigate(route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '40px', height: '40px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px',
        backgroundColor: active ? '#2d3548' : hovered ? '#252b3b' : 'transparent',
        color: active || hovered ? '#fff' : '#6b7280',
        cursor: route ? 'pointer' : 'default',
        transition: 'background-color 0.15s, color 0.15s',
      }}
    >
      {icon}
    </div>
  );
}

/* ── SVG icons ── */
function MagnifyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="6" r="4.5" />
      <line x1="9.5" y1="9.5" x2="13" y2="13" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="3" r="1.5" />
      <circle cx="13" cy="13" r="1.5" />
      <circle cx="3"  cy="8" r="1.5" />
      <line x1="4.3" y1="7.3"  x2="11.7" y2="3.7"  />
      <line x1="4.3" y1="8.7"  x2="11.7" y2="12.3" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6.5" cy="4" r="2.5" />
      <path d="M1.5 12c0-2.76 2.24-5 5-5s5 2.24 5 5" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2a5 5 0 00-5 5v3l-1.5 2h13L14 10V7a5 5 0 00-5-5z" />
      <path d="M7.5 15.5a1.5 1.5 0 003 0" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="2,4 6,8 10,4" />
    </svg>
  );
}
