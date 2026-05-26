import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

const FONT          = "'Plus Jakarta Sans', system-ui, sans-serif";
const LIME          = '#a3e635';
const LIME_BG       = '#f0fdf4';
const INACTIVE      = '#6b7280';
const SECTION_LABEL = '#9ca3af';
const PRIMARY       = '#166534';

const PLAN_LIMITS = { starter: 30, growth: 75, scale: 999 };

const NAV_ITEMS = [
  { icon: '⊞', label: 'Overview',  route: '/client'           },
  { icon: '▤', label: 'Leads',     route: '/client/leads'     },
  { icon: '?', label: 'Questions', route: '/client/questions' },
];

function getInitials(name) {
  if (!name) return 'CL';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ClientLayout({ title, subtitle, children }) {
  const { profile, signOut } = useAuth();
  const navigate             = useNavigate();
  const initials             = getInitials(profile?.full_name);

  const [showNotif,      setShowNotif]      = useState(false);
  const [leadsThisMonth, setLeadsThisMonth] = useState(0);
  const [planLimit,      setPlanLimit]      = useState(30);

  useEffect(() => {
    if (!profile?.client_id) return;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    Promise.all([
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', profile.client_id)
        .gte('created_at', monthStart.toISOString()),
      supabase
        .from('clients')
        .select('plan')
        .eq('id', profile.client_id)
        .single(),
    ]).then(([leadsRes, clientRes]) => {
      setLeadsThisMonth(leadsRes.count || 0);
      const plan = clientRes.data?.plan || 'starter';
      setPlanLimit(PLAN_LIMITS[plan] || 30);
    });
  }, [profile?.client_id]);

  const pct       = planLimit > 0 ? Math.min(100, Math.round((leadsThisMonth / planLimit) * 100)) : 0;
  const remaining = Math.max(0, planLimit - leadsThisMonth);
  const barColor  = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#a3e635';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT, backgroundColor: '#f0f2f5' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '240px', flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #ebebeb',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 20, overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{ padding: '20px 20px 24px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#ffffff', flexShrink: 0 }}>Q</div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', lineHeight: 1.2 }}>QuickQuote</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: LIME, letterSpacing: '0.1em', marginTop: '1px' }}>360</div>
          </div>
        </div>

        {/* MENU section */}
        <div style={{ padding: '16px 20px 6px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', fontWeight: '600', color: SECTION_LABEL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Menu</span>
        </div>
        <nav style={{ flexShrink: 0 }}>
          {NAV_ITEMS.map(item => <NavItem key={item.label} item={item} />)}
        </nav>

        {/* Push bottom section down */}
        <div style={{ flex: 1 }} />

        {/* ── Card 1: Usage this month ── */}
        <div style={{ margin: '0 10px 8px', backgroundColor: '#f9faf9', borderRadius: '12px', padding: '14px', flexShrink: 0 }}>
          <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>Estimates this month</p>
          <p style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '800', color: '#111827', lineHeight: 1, fontFamily: FONT }}>
            {leadsThisMonth} / {planLimit}
          </p>
          <div style={{ height: '6px', borderRadius: '99px', backgroundColor: '#e5e7eb', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: '99px', transition: 'width 0.4s' }} />
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{remaining} estimates remaining</p>
          {pct >= 80 && (
            <p style={{ margin: '6px 0 0', fontSize: '11px', fontWeight: '600', color: '#d97706', fontFamily: FONT }}>⚠ Running low</p>
          )}
        </div>

        {/* ── Card 2: Install tool ── */}
        <div
          onClick={() => navigate('/client/settings')}
          style={{ margin: '0 10px 8px', backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '12px 14px', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#dcfce7', color: PRIMARY, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>⎘</div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: PRIMARY, fontFamily: FONT }}>Install on your website</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Get your embed code →</p>
          </div>
        </div>

        {/* ── Card 3: Upgrade prompt (only if pct >= 60) ── */}
        {pct >= 60 && (
          <div style={{ margin: '0 10px 8px', background: 'linear-gradient(135deg, #166534, #14532d)', borderRadius: '12px', padding: '14px', flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#ffffff', fontFamily: FONT }}>Upgrade your plan</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontFamily: FONT }}>Get more estimates and features</p>
            <button type="button" onClick={() => navigate('/client/settings')}
              style={{ marginTop: '10px', backgroundColor: '#a3e635', color: '#0d1f12', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: FONT }}>
              Upgrade Plan →
            </button>
          </div>
        )}

        {/* Bottom nav items */}
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '8px', paddingBottom: '4px', flexShrink: 0 }}>
          <BottomNavItem icon="?" label="Get Help" onClick={() => window.open('mailto:support@quickquote360.com')} />
          <BottomNavItem icon="✦" label="Settings" onClick={() => navigate('/client/settings')} />
          <BottomNavItem icon="←" label="Logout"   onClick={() => signOut()} />
        </div>

        {/* User block */}
        <div style={{ borderTop: '1px solid #ebebeb', padding: '14px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || 'Client'}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Client Account</div>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{ height: '64px', flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #ebebeb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ minWidth: 0, flexShrink: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{subtitle}</div>}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '9px 14px', width: '260px', backgroundColor: '#f9faf9' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5" /><line x1="9.5" y1="9.5" x2="13" y2="13" /></svg>
              <input type="text" placeholder="Search..." style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13px', color: '#111827', width: '100%', fontFamily: FONT }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShowNotif(v => !v)}
                style={{ width: '36px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#6b7280', cursor: 'pointer', backgroundColor: '#fff' }}>
                🔔
              </div>
              {showNotif && (
                <div style={{ position: 'absolute', right: 0, top: '44px', backgroundColor: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '12px 16px', width: '220px', zIndex: 100, fontFamily: FONT }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>No new notifications</p>
                </div>
              )}
            </div>
            <div onClick={() => navigate('/client/settings')}
              style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
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

/* ── NavItem ── */
function NavItem({ item }) {
  const [hovered, setHovered] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const active = item.route === '/client'
    ? location.pathname === '/client'
    : location.pathname.startsWith(item.route);

  return (
    <div
      role="button" tabIndex={0}
      onClick={() => navigate(item.route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: active ? '9px 20px 9px 17px' : '9px 20px',
        margin: '1px 10px', borderRadius: '10px',
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
        padding: '8px 20px', margin: '1px 10px', borderRadius: '10px',
        fontSize: '13px', fontWeight: '500',
        color: hovered ? '#374151' : '#6b7280',
        backgroundColor: hovered ? '#f9faf9' : 'transparent',
        cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '14px', lineHeight: 1, flexShrink: 0, width: '16px', textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
