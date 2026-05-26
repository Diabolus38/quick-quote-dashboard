import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const FONT          = "'Plus Jakarta Sans', system-ui, sans-serif";
const LIME          = '#a3e635';
const LIME_BG       = '#f0fdf4';
const INACTIVE      = '#6b7280';
const SECTION_LABEL = '#9ca3af';
const PRIMARY       = '#166534';

const MENU_ITEMS = [
  { icon: '⊞', label: 'Overview', route: '/admin'         },
  { icon: '◎', label: 'Clients',  route: '/admin/clients' },
  { icon: '▤', label: 'Leads',    route: '/admin/leads'   },
  { icon: '$', label: 'Billing',  route: '/admin/billing' },
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
  const navigate             = useNavigate();
  const isSuperAdmin         = profile?.role === 'super_admin';
  const initials             = getInitials(profile?.full_name);
  const [showNotif,    setShowNotif]    = useState(false);
  const [activePeriod, setActivePeriod] = useState('30D');
  const [showCalendar, setShowCalendar] = useState(false);
  const [fromDate,     setFromDate]     = useState('');
  const [toDate,       setToDate]       = useState('');

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: FONT, backgroundColor: '#f0f2f5' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '240px', flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #ebebeb',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 20, overflowY: 'auto',
      }}>

        {/* 1. User Profile Block — TOP */}
        <div
          style={{ padding: '20px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, cursor: 'pointer' }}
          onClick={() => navigate('/admin/settings')}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || 'Admin'}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
              {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>▾</span>
        </div>

        {/* 2. Search Bar */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '8px 12px', backgroundColor: '#f9faf9' }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4.5" /><line x1="9.5" y1="9.5" x2="13" y2="13" /></svg>
            <input type="text" placeholder="Search..." style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13px', color: '#374151', width: '100%', fontFamily: FONT }} />
          </div>
        </div>

        {/* 3. MENU Section */}
        <div style={{ padding: '14px 16px 6px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', fontWeight: '600', color: SECTION_LABEL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Menu</span>
        </div>
        <nav style={{ flexShrink: 0 }}>
          {MENU_ITEMS.map(item => <NavItem key={item.label} item={item} isAdmin />)}
        </nav>

        {/* 4. OTHERS Section — super_admin only */}
        {isSuperAdmin && (
          <>
            <div style={{ padding: '14px 16px 6px', flexShrink: 0 }}>
              <span style={{ fontSize: '10px', fontWeight: '600', color: SECTION_LABEL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Others</span>
            </div>
            <nav style={{ flexShrink: 0 }}>
              <NavItem item={SUPER_ADMIN_ITEM} isAdmin />
            </nav>
          </>
        )}

        {/* 5. Spacer */}
        <div style={{ flex: 1 }} />

        {/* 6. Bottom Nav */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
          <BottomNavItem icon="💬" label="Get Help" onClick={() => window.open('mailto:support@quickquote360.com')} />
          <BottomNavItem icon="⚙" label="Settings"  onClick={() => navigate('/admin/settings')} />
          <BottomNavItem icon="↩" label="Logout"    onClick={() => signOut()} />
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{ height: '64px', flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', gap: '16px' }}>
          {/* Title */}
          <div style={{ minWidth: 0, flexShrink: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap' }}>{title || 'Dashboard'}</div>
            {subtitle && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{subtitle}</div>}
          </div>

          {/* Right: period pills + calendar + bell + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>

            {/* Period pills */}
            {['7D', '30D', '3M', '6M', '1Y', 'All Time'].map(p => (
              <button key={p} type="button"
                onClick={() => { setActivePeriod(p); setShowCalendar(false); }}
                style={{
                  border: `1px solid ${activePeriod === p ? PRIMARY : '#e5e7eb'}`,
                  borderRadius: '20px', padding: '6px 14px', fontSize: '12px',
                  fontWeight: '500', backgroundColor: activePeriod === p ? PRIMARY : '#ffffff',
                  color: activePeriod === p ? '#ffffff' : '#6b7280',
                  cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                }}>
                {p}
              </button>
            ))}

            {/* Calendar button + dropdown */}
            <div style={{ position: 'relative', marginLeft: '4px' }}>
              <button type="button"
                onClick={() => setShowCalendar(v => !v)}
                style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '6px 12px', fontSize: '12px', color: '#6b7280', cursor: 'pointer', backgroundColor: '#ffffff', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>📅</span><span>▾</span>
              </button>
              {showCalendar && (
                <div style={{ position: 'absolute', top: '52px', right: 0, backgroundColor: '#ffffff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '240px', fontFamily: FONT }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>From</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                      style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', color: '#111827', fontFamily: FONT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>To</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                      style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', color: '#111827', fontFamily: FONT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
                    <button type="button"
                      onClick={() => { setActivePeriod('custom'); setShowCalendar(false); }}
                      style={{ backgroundColor: PRIMARY, color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                      Apply
                    </button>
                    <button type="button"
                      onClick={() => { setActivePeriod('30D'); setFromDate(''); setToDate(''); setShowCalendar(false); }}
                      style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '12px', cursor: 'pointer', fontFamily: FONT, padding: '6px 4px' }}>
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 2px' }} />

            {/* Bell */}
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setShowNotif(v => !v)}
                style={{ width: '36px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '10px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer', fontFamily: FONT }}>
                🔔
              </button>
              {showNotif && (
                <div style={{ position: 'absolute', top: '52px', right: 0, backgroundColor: '#ffffff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', zIndex: 100, minWidth: '200px', fontFamily: FONT }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>No new notifications 🔔</p>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div onClick={() => navigate('/admin/settings')}
              style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              {initials}
            </div>
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

/* ── NavItem ── */
function NavItem({ item, isAdmin }) {
  const [hovered, setHovered] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const rootRoute = isAdmin ? '/admin' : '/client';
  const active = item.route != null && (
    item.route === rootRoute
      ? location.pathname === rootRoute
      : location.pathname.startsWith(item.route)
  );

  return (
    <div
      role="button" tabIndex={0}
      onClick={() => { if (item.action) { item.action(); } else if (item.route) { navigate(item.route); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: active ? '9px 16px 9px 13px' : '9px 16px',
        margin: '2px 10px', borderRadius: '10px',
        fontSize: '13.5px', fontWeight: active ? '600' : '500',
        color: active ? PRIMARY : hovered ? '#374151' : INACTIVE,
        backgroundColor: active ? LIME_BG : hovered ? '#f9faf9' : 'transparent',
        borderLeft: active ? `3px solid ${LIME}` : '3px solid transparent',
        cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '14px', lineHeight: 1, flexShrink: 0, width: '16px', textAlign: 'center' }}>{item.icon}</span>
      <span>{item.label}</span>
    </div>
  );
}

/* ── BottomNavItem ── */
function BottomNavItem({ icon, label, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 14px', margin: '1px 8px', borderRadius: '10px',
        fontSize: '13px', fontWeight: '500',
        color: hovered ? '#374151' : '#9ca3af',
        backgroundColor: hovered ? '#f9faf9' : 'transparent',
        cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '14px', lineHeight: 1, flexShrink: 0, width: '18px', textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
