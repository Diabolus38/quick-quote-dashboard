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
  { icon: '⊞', label: 'Overview',       route: '/client'                },
  { icon: '▤', label: 'Leads',          route: '/client/leads'          },
  { icon: '✎', label: 'Questions',      route: '/client/questions'      },
  { icon: '$', label: 'Pricing',        route: '/client/pricing'        },
  { icon: '▦', label: 'PDF',           route: '/client/pdf'            },
  { icon: '◎', label: 'Municipalities', route: '/client/municipalities' },
  { icon: '⚙', label: 'Settings',      route: '/client/settings'       },
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

        {/* ── Logo ── */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #166534, #14532d)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '20px', fontWeight: '900', color: '#b8f5c8', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 }}>Q</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#111827', lineHeight: 1 }}>Quick Quote</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#a3e635', letterSpacing: '0.15em' }}>360</span>
          </div>
        </div>

        {/* 1. User Profile Block — TOP */}
        <div
          style={{ padding: '20px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, cursor: 'pointer' }}
          onClick={() => navigate('/client/settings')}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name || 'Client'}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>Client Account</div>
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
          {NAV_ITEMS.map(item => <NavItem key={item.label} item={item} />)}
        </nav>

        {/* 4. Spacer */}
        <div style={{ flex: 1 }} />

        {/* 5. Bottom Cards */}
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>

          {/* Usage Card */}
          <div style={{ backgroundColor: '#f9faf9', borderRadius: '12px', padding: '14px', border: '1px solid #e8ede8' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>Estimates this month</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#111827', fontFamily: FONT }}>{leadsThisMonth}/{planLimit}</span>
            </div>
            <div style={{ height: '6px', borderRadius: '99px', backgroundColor: '#e5e7eb', overflow: 'hidden', margin: '8px 0 4px' }}>
              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: '99px', transition: 'width 0.4s' }} />
            </div>
            <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontFamily: FONT }}>{remaining} left this month</p>
            {pct >= 80 && (
              <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: '600', color: '#d97706', fontFamily: FONT }}>⚠ Running low</p>
            )}
          </div>

          {/* Install Card */}
          <div
            onClick={() => navigate('/client/settings')}
            style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '12px 14px', border: '1px solid #bbf7d0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: PRIMARY, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>⎘</div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: PRIMARY, fontFamily: FONT }}>Install on your website</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Get your embed code →</p>
            </div>
          </div>

          {/* Upgrade Card — only if pct >= 60 */}
          {pct >= 60 && (
            <div style={{ background: 'linear-gradient(135deg, #0d1f12 0%, #166534 100%)', borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
              {/* Decorative circle */}
              <div style={{ position: 'absolute', top: '-16px', right: '-16px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(163,230,53,0.15)' }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#ffffff', fontFamily: FONT }}>Upgrade your plan</p>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontFamily: FONT }}>Get more estimates & features</p>
              <p style={{ margin: '10px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontFamily: FONT }}>{leadsThisMonth}/{planLimit} used</p>
              <button type="button" onClick={() => navigate('/client/settings')}
                style={{ marginTop: '10px', width: '100%', backgroundColor: '#a3e635', color: '#0d1f12', border: 'none', borderRadius: '8px', padding: '7px 0', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT }}>
                Upgrade Plan →
              </button>
            </div>
          )}
        </div>

        {/* 6. Bottom Nav */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
          <BottomNavItem icon="💬" label="Get Help" onClick={() => window.open('mailto:support@quickquote360.com')} />
          <BottomNavItem icon="⚙" label="Settings"  onClick={() => navigate('/client/settings')} />
          <BottomNavItem icon="↩" label="Logout"    onClick={() => signOut()} />
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{ height: '64px', flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{subtitle}</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
