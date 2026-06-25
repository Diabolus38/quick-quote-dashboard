import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { PLAN_LIMITS } from './utils/planConfig';
import BugReportModal from './components/BugReportModal';

const FONT          = "'Plus Jakarta Sans', system-ui, sans-serif";
const LIME          = '#a3e635';
const LIME_BG       = '#f0fdf4';
const INACTIVE      = '#6b7280';
const SECTION_LABEL = '#9ca3af';
const PRIMARY       = '#166534';


const OVERVIEW_ITEMS = [
  { icon: '⊞', label: 'Overview', route: '/client' },
];

const LEADS_ITEMS = [
  { icon: '▤', label: 'Leads', route: '/client/leads' },
];

const CONFIG_ITEMS = [
  { icon: '✎', label: 'Questions',      route: '/client/questions'      },
  { icon: '$', label: 'Pricing',        route: '/client/pricing'        },
  { icon: '▦', label: 'PDF',           route: '/client/pdf'            },
  { icon: '◎', label: 'Municipalities', route: '/client/municipalities' },
];


function timeAgo(dateStr) {
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

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

  const [showNotif,       setShowNotif]       = useState(false);
  const [notifications,   setNotifications]   = useState([]);
  const [showBugReport,   setShowBugReport]   = useState(false);
  const [leadsThisMonth,  setLeadsThisMonth]  = useState(0);
  const [planLimit,       setPlanLimit]       = useState(30);
  const [sidebarSearch,   setSidebarSearch]   = useState('');
  const [clientPlan,      setClientPlan]      = useState('starter');
  const [clientCreatedAt, setClientCreatedAt] = useState(null);

  const leadsThisMonthRef = useRef(0);
  const planLimitRef      = useRef(30);
  useEffect(() => { leadsThisMonthRef.current = leadsThisMonth; }, [leadsThisMonth]);
  useEffect(() => { planLimitRef.current = planLimit; }, [planLimit]);

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
        .select('plan, created_at')
        .eq('id', profile.client_id)
        .single(),
    ]).then(([leadsRes, clientRes]) => {
      setLeadsThisMonth(leadsRes.count || 0);
      const plan = clientRes.data?.plan || 'starter';
      setPlanLimit(PLAN_LIMITS[plan] || 30);
      setClientPlan(plan);
      setClientCreatedAt(clientRes.data?.created_at || null);
    });
  }, [profile?.client_id]);

  useEffect(() => {
    if (!profile?.client_id) return;
    supabase.from('notifications')
      .select('*')
      .eq('client_id', profile.client_id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifications(data || []));
  }, [profile?.client_id]);

  useEffect(() => {
    if (!profile?.client_id) return;
    const clientId = profile.client_id;
    const channel = supabase
      .channel('new-leads-notify-' + clientId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: 'client_id=eq.' + clientId }, async (payload) => {
        const { data: inserted } = await supabase.from('notifications').insert({
          client_id: clientId,
          type: 'new_lead',
          title: 'New lead received',
          message: (payload.new.name || 'A visitor') + ' requested a quote' + (payload.new.municipality ? ' in ' + payload.new.municipality : '') + '.',
          read: false,
        }).select('*').single();
        if (inserted) setNotifications(prev => [inserted, ...prev]);

        const newCount    = leadsThisMonthRef.current + 1;
        setLeadsThisMonth(newCount);
        const remaining   = Math.max(0, planLimitRef.current - newCount);
        for (const threshold of [10, 5, 3, 0]) {
          const key = 'qq360_notif_' + clientId + '_' + threshold;
          if (remaining === threshold && !localStorage.getItem(key)) {
            localStorage.setItem(key, '1');
            const title = threshold === 0 ? 'Estimate limit reached' : 'Running low on estimates';
            const msg   = threshold === 0
              ? 'You have reached your monthly estimate limit.'
              : 'You have ' + threshold + ' estimate' + (threshold === 1 ? '' : 's') + ' remaining this month.';
            const { data: tw } = await supabase.from('notifications').insert({
              client_id: clientId, type: 'usage_warning', title, message: msg, read: false,
            }).select('*').single();
            if (tw) setNotifications(prev => [tw, ...prev]);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.client_id]);

  async function markNotifRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    if (!profile?.client_id) return;
    await supabase.from('notifications').update({ read: true }).eq('client_id', profile.client_id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const pct           = planLimit > 0 ? Math.min(100, Math.round((leadsThisMonth / planLimit) * 100)) : 0;
  const remaining     = Math.max(0, planLimit - leadsThisMonth);
  const barColor      = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#a3e635';
  const trialDaysLeft = clientPlan === 'free_trial' && clientCreatedAt
    ? Math.max(0, 14 - Math.floor((Date.now() - new Date(clientCreatedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

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
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="https://quickquote360.com/wp-content/uploads/2023/09/Quick-Quote-360-logos-5-300x300.png"
            alt="QuickQuote360"
            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#111827', lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Quick Quote</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#a3e635', letterSpacing: '0.15em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>360</span>
          </div>
        </div>

        {/* OVERVIEW Section */}
        <div style={{ padding: '14px 16px 6px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', fontWeight: '600', color: SECTION_LABEL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Overview</span>
        </div>
        <nav style={{ flexShrink: 0 }}>
          {OVERVIEW_ITEMS.filter(item => !sidebarSearch || item.label.toLowerCase().includes(sidebarSearch.toLowerCase())).map(item => <NavItem key={item.label} item={item} />)}
        </nav>

        {/* LEADS Section */}
        <div style={{ padding: '14px 16px 6px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', fontWeight: '600', color: SECTION_LABEL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Leads</span>
        </div>
        <nav style={{ flexShrink: 0 }}>
          {LEADS_ITEMS.filter(item => !sidebarSearch || item.label.toLowerCase().includes(sidebarSearch.toLowerCase())).map(item => <NavItem key={item.label} item={item} />)}
        </nav>

        {/* CONFIGURATION Section */}
        <div style={{ padding: '14px 16px 6px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', fontWeight: '600', color: SECTION_LABEL, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configuration</span>
        </div>
        <nav style={{ flexShrink: 0 }}>
          {CONFIG_ITEMS.filter(item => !sidebarSearch || item.label.toLowerCase().includes(sidebarSearch.toLowerCase())).map(item => <NavItem key={item.label} item={item} />)}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom Nav */}
        <div style={{ padding: '8px 10px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
          <BottomNavItem icon="💬" label="Get Help" onClick={() => window.open('https://quickquote360.com/faq/', '_blank', 'noopener,noreferrer')} />
          <BottomNavItem icon="🐛" label="Report a Bug" onClick={() => setShowBugReport(true)} />
          <BottomNavItem icon="⚙" label="Settings"  onClick={() => navigate('/client/settings')} />
          <BottomNavItem icon="↩" label="Logout"    onClick={() => signOut()} />
        </div>

        {/* Bottom Cards */}
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>

          {/* Usage Card */}
          <div style={{ backgroundColor: '#f9faf9', borderRadius: '12px', padding: '14px', border: '1px solid #e8ede8' }}>
            {trialDaysLeft !== null && (
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#854d0e', fontFamily: FONT }}>Trial: {trialDaysLeft} days left</p>
            )}
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
            onClick={() => navigate('/client/settings?tab=embed')}
            style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '12px 14px', border: '1px solid #bbf7d0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#dcfce7', color: PRIMARY, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>⎘</div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: PRIMARY, fontFamily: FONT }}>Install on your website</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Get your embed code →</p>
            </div>
          </div>

          {/* Upgrade Card — only if pct >= 75 */}
          {pct >= 75 && (
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
      </aside>

      <BugReportModal isOpen={showBugReport} onClose={() => setShowBugReport(false)} />

      {/* ── Main area ── */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{ height: '64px', flexShrink: 0, backgroundColor: '#ffffff', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{subtitle}</div>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Bell */}
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setShowNotif(v => !v)}
                style={{ position: 'relative', background: 'transparent', border: 'none', padding: '6px', borderRadius: '8px', fontSize: '18px', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', minWidth: '16px', height: '16px', borderRadius: '99px', backgroundColor: '#dc2626', color: '#fff', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', fontFamily: FONT, lineHeight: 1 }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotif && (
                <div style={{ position: 'absolute', top: '100%', right: 0, width: '320px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', zIndex: 100, maxHeight: '400px', overflowY: 'auto', fontFamily: FONT, border: '1px solid #ebebeb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button type="button" onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: '12px', color: PRIMARY, cursor: 'pointer', fontWeight: '600', fontFamily: FONT, padding: 0 }}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '24px 16px' }}>No notifications yet</p>
                  ) : notifications.map(n => (
                    <div key={n.id} onClick={() => markNotifRead(n.id)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #f9fafb', cursor: 'pointer', backgroundColor: n.read ? '#fff' : '#f0fdf4', transition: 'background 0.15s' }}>
                      <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{n.type === 'new_lead' ? '👤' : n.type === 'usage_warning' ? '⚠️' : '🔔'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: n.read ? '500' : '700', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                          <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* User Profile */}
            <div onClick={() => navigate('/client/settings')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>{initials}</div>
              }
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#111827' }}>{profile?.full_name || 'Account'}</span>
              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '2px' }}>▾</span>
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

/* ── LockedNavItem ── */
function LockedNavItem({ item, onLockedClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="button" tabIndex={0}
      onClick={onLockedClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 16px',
        margin: '2px 10px', borderRadius: '10px',
        fontSize: '13.5px', fontWeight: '500',
        color: hovered ? '#6b7280' : '#9ca3af',
        backgroundColor: hovered ? '#f9faf9' : 'transparent',
        borderLeft: '3px solid transparent',
        cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '14px', lineHeight: 1, flexShrink: 0, width: '16px', textAlign: 'center' }}>{item.icon}</span>
      <span>{item.label} 🔒</span>
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
