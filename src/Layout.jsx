import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const SIDEBAR_BG = '#ffffff';
const LIME = '#a3e635';
const LIME_BG = '#f0fdf4';
const INACTIVE = '#6b7280';
const SECTION_LABEL = '#9ca3af';
const PRIMARY = '#166534';

const MENU_ITEMS = [
  { icon: '⊞', label: 'Overview',   route: '/admin'           },
  { icon: '◎', label: 'Clients',    route: '/admin/clients'   },
  { icon: '▤', label: 'Leads',      route: '/admin/leads'     },
  { icon: '$', label: 'Billing',    route: '/admin/billing'   },
];

const GENERAL_ITEMS = [
  { icon: '✦', label: 'Settings',   route: '/admin/settings'  },
  { icon: '?', label: 'Help',       route: null, action: () => window.open('mailto:support@quickquote360.com') },
];

const SUPER_ADMIN_ITEM = { icon: '◈', label: 'Super Admin', route: '/admin/super' };

function getInitials(name) {
  if (!name) return 'AD';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Layout({ title, subtitle, children }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = profile?.role === 'super_admin';
  const menuItems = isSuperAdmin ? [...MENU_ITEMS, SUPER_ADMIN_ITEM] : MENU_ITEMS;
  const initials = getInitials(profile?.full_name);
  const [search,     setSearch]     = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showNotif,  setShowNotif]  = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: FONT, backgroundColor: '#f0f2f5' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '240px', flexShrink: 0,
        backgroundColor: SIDEBAR_BG,
        borderRight: '1px solid #ebebeb',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#ffffff', flexShrink: 0 }}>Q</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', lineHeight: 1.2 }}>QuickQuote</div>
            <div style={{ fontSize: '10px', fontWeight: '600', color: LIME, letterSpacing: '0.1em', marginTop: '1px' }}>360</div>
          </div>
        </div>

        {/* Menu section */}
        <div style={{ padding: '16px 20px 6px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', color: SECTION_LABEL, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Menu</span>
        </div>
        <nav style={{ padding: '0 12px' }}>
          {menuItems.map(item => <NavItem key={item.label} item={item} />)}
        </nav>

        {/* General section */}
        <div style={{ padding: '16px 20px 6px', marginTop: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', color: SECTION_LABEL, textTransform: 'uppercase', letterSpacing: '0.12em' }}>General</span>
        </div>
        <nav style={{ padding: '0 12px' }}>
          {GENERAL_ITEMS.map(item => <NavItem key={item.label} item={item} />)}
        </nav>

        {/* Bottom user block */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #ebebeb', padding: '16px 20px', backgroundColor: '#f9faf9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'Admin'}
              </div>
              <div style={{ fontSize: '11px', color: INACTIVE }}>
                {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </div>
            </div>
            <button type="button" onClick={() => signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#9ca3af', padding: 0, fontFamily: FONT, flexShrink: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#ef4444'}
              onMouseLeave={e => e.target.style.color = '#9ca3af'}>
              Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{ height: '64px', flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #ebebeb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', padding: '0 32px', gap: '20px' }}>
          {/* Title */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0d1117', whiteSpace: 'nowrap' }}>{title || 'Dashboard'}</div>
            {subtitle && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{subtitle}</div>}
          </div>

          {/* Search */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ebebeb', borderRadius: '10px', padding: '0 14px', width: '280px', height: '38px', backgroundColor: '#ffffff' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5" /><line x1="9.5" y1="9.5" x2="13" y2="13" /></svg>
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13px', color: '#0d1117', width: '100%', fontFamily: FONT }} />
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {['Today', 'This Week', 'This Month'].map(label => (
              <button key={label} type="button" onClick={() => setDateFilter(dateFilter === label ? '' : label)}
                style={{ padding: '5px 12px', fontSize: '12px', border: '1px solid #ebebeb', borderRadius: '20px', backgroundColor: dateFilter === label ? '#0d1117' : '#fff', color: dateFilter === label ? '#fff' : '#4b5563', cursor: 'pointer', fontFamily: FONT, fontWeight: '500' }}>{label}</button>
            ))}
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShowNotif(v => !v)} style={{ width: '36px', height: '36px', border: '1px solid #ebebeb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#4b5563', cursor: 'pointer' }}>◉</div>
              {showNotif && (
                <div style={{ position: 'absolute', right: 0, top: '44px', backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '16px 20px', width: '220px', zIndex: 100, fontFamily: FONT }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>No new notifications</p>
                </div>
              )}
            </div>
            <div onClick={() => navigate('/admin/settings')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>{initials}</div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
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
  const active = item.route != null && (
    item.route === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(item.route)
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { if (item.action) { item.action(); } else if (item.route) { navigate(item.route); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: active ? '11px 17px' : '11px 20px',
        margin: '2px 0',
        borderRadius: '10px',
        fontSize: '13.5px', fontWeight: active ? '600' : '500',
        color: active ? PRIMARY : hovered ? '#374151' : INACTIVE,
        backgroundColor: active ? LIME_BG : hovered ? '#f9faf9' : 'transparent',
        borderLeft: active ? `3px solid ${LIME}` : '3px solid transparent',
        cursor: item.route ? 'pointer' : 'default',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
      <span>{item.label}</span>
    </div>
  );
}
