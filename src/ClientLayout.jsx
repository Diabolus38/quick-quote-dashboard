import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const SIDEBAR_BG = '#0d1f12';
const LIME = '#a3e635';
const LIME_BG = 'rgba(163,230,53,0.08)';
const INACTIVE = '#6b9e6e';
const SECTION_LABEL = '#3d6b42';

const NAV_ITEMS = [
  { label: 'Overview',  route: '/client'           },
  { label: 'Leads',     route: '/client/leads'     },
  { label: 'Questions', route: '/client/questions' },
  { label: 'Settings',  route: '/client/settings'  },
];

function getInitials(name) {
  if (!name) return 'CL';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ClientLayout({ title, subtitle, children }) {
  const { profile, signOut } = useAuth();
  const initials = getInitials(profile?.full_name);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT, backgroundColor: '#f4f6f4' }}>

      {/* Sidebar */}
      <aside style={{
        width: '240px', flexShrink: 0,
        backgroundColor: SIDEBAR_BG,
        position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#0d1f12', flexShrink: 0 }}>Q</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: 1.2 }}>QuickQuote</div>
            <div style={{ fontSize: '10px', fontWeight: '600', color: LIME, letterSpacing: '0.1em', marginTop: '1px' }}>360</div>
          </div>
        </div>

        {/* Nav section label */}
        <div style={{ padding: '16px 20px 6px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', color: SECTION_LABEL, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Menu</span>
        </div>

        {/* Nav */}
        <nav style={{ padding: '0 12px', flex: 1 }}>
          {NAV_ITEMS.map(item => <NavItem key={item.label} item={item} />)}
        </nav>

        {/* Bottom user block */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: LIME, color: '#0d1f12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'Client'}
              </div>
              <div style={{ fontSize: '11px', color: INACTIVE }}>Client Account</div>
            </div>
            <button type="button" onClick={() => signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: INACTIVE, padding: 0, fontFamily: FONT, flexShrink: 0 }}
              onMouseEnter={e => e.target.style.color = '#ff6b6b'}
              onMouseLeave={e => e.target.style.color = INACTIVE}>
              Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{ height: '64px', flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{subtitle}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '13.5px', color: '#4b5563' }}>{profile?.full_name || 'Client'}</div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: LIME, color: '#0d1f12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: '32px', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ item }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const active = item.route === '/client'
    ? location.pathname === '/client'
    : location.pathname.startsWith(item.route);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(item.route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: active ? '11px 17px' : '11px 20px',
        margin: '2px 0',
        borderRadius: '10px',
        fontSize: '13.5px', fontWeight: active ? '600' : '500',
        color: active ? LIME : hovered ? '#9dd99e' : INACTIVE,
        backgroundColor: active ? LIME_BG : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        borderLeft: active ? `3px solid ${LIME}` : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
    >
      {item.label}
    </div>
  );
}
