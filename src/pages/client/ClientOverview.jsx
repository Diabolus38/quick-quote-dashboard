import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../ClientLayout';
import OnboardingBanner from '../../components/OnboardingBanner';
import TrialExpiredOverlay from '../../components/TrialExpiredOverlay';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const STATUS_COLORS = {
  'New':         { bg: '#dbeafe', color: '#1d4ed8' },
  'Contacted':   { bg: '#fef9c3', color: '#854d0e' },
  'In Progress': { bg: '#ede9fe', color: '#7c3aed' },
  'Closed Won':  { bg: '#dcfce7', color: '#166534' },
  'Closed Lost': { bg: '#fee2e2', color: '#991b1b' },
};

function formatDate(str) {
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px' };
const COLUMNS = ['Name', 'Municipality', 'Estimated Price', 'Status', 'Date'];

const INSTALL_CARDS = [
  { key: 'self',     name: 'Self-Install',     price: '2,490 kr one-time', subtext: 'You install the embed code yourself using our step-by-step guide.' },
  { key: 'assisted', name: 'Assisted Install', price: '9,990 kr one-time', subtext: 'Our team installs it for you within 48 hours.' },
];

export default function ClientOverview() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [leads,         setLeads]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [hoveredRow,    setHoveredRow]    = useState(null);
  const [showToast,      setShowToast]      = useState(false);
  const [hoveredAction,  setHoveredAction]  = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState('All');
  const [soundEnabled,   setSoundEnabled]   = useState(true);
  const [dnd, setDnd] = useState(() => { try { return JSON.parse(localStorage.getItem('qq360_dnd') || 'false'); } catch { return false; } });
  const [shareStatsMsg,  setShareStatsMsg]  = useState('');
  const [trialExpired,      setTrialExpired]      = useState(false);
  const [planEmailSent,     setPlanEmailSent]     = useState(false);
  const [installPreference, setInstallPreference] = useState(null);
  const [showInstallChoice, setShowInstallChoice] = useState(false);
  const [installChoice,     setInstallChoice]     = useState('self');
  const [installSaving,     setInstallSaving]     = useState(false);
  const [installDone,       setInstallDone]       = useState(false);
  const [checkoutLoading,   setCheckoutLoading]   = useState(false);
  const [clientPlan,        setClientPlan]        = useState('free_trial');
  const [checkoutBanner,    setCheckoutBanner]    = useState(null);
  const soundEnabledRef = useRef(soundEnabled);
  const dndRef = useRef(dnd);

  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  useEffect(() => {
    if (!profile?.client_id) return;
    supabase.from('clients').select('plan, created_at, install_preference').eq('id', profile.client_id).maybeSingle()
      .then(({ data }) => {
        setInstallPreference(data?.install_preference || null);
        setClientPlan(data?.plan || 'free_trial');
        if (data?.plan === 'free_trial' && !data?.install_preference) setShowInstallChoice(true);
        if (data?.plan === 'free_trial' && (Date.now() - new Date(data.created_at).getTime()) / 86400000 > 14) setTrialExpired(true);
      });
  }, [profile?.client_id]);

  async function sendPlanEmail(planName) {
    await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'team@aiworldpartners.com', subject: `Plan Upgrade Request: ${planName}`, body: `${profile?.full_name || 'A client'} (${profile?.email || ''}) requested the ${planName} plan. Client ID: ${profile?.client_id}.` }) }).catch(() => {});
    setPlanEmailSent(true);
  }

  async function handleInstallContinue() {
    setInstallSaving(true);
    const { error: updateError } = await supabase.from('clients').update({ install_preference: installChoice }).eq('id', profile.client_id);
    if (updateError) console.error('Failed to save install preference:', updateError);

    if (installChoice === 'assisted') {
      const emailPayload = {
        email:   'team@aiworldpartners.com',
        subject: 'Assisted Install Requested - Free Trial Signup',
        body:    `Free trial client has selected assisted install.\n\nName: ${profile?.full_name || ''}\nEmail: ${profile?.email || ''}\nClient ID: ${profile?.client_id || ''}\n\nPlease contact this client to schedule their assisted install within 48 hours.`,
      };
      console.log('Sending assisted install notification:', emailPayload);
      try {
        const response = await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(emailPayload),
        });
        if (!response.ok) {
          console.error('Failed to send assisted install notification:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('Failed to send assisted install notification:', err);
      }
    }

    setInstallPreference(installChoice);
    setInstallSaving(false);
    if (clientPlan !== 'free_trial') {
      setCheckoutLoading(true);
      try {
        const res = await fetch('https://estimator-widget-production.up.railway.app/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: profile.client_id,
            email: profile.email,
            planKey: clientPlan,
            billingInterval: 'month',
            installType: installChoice
          })
        });
        const checkoutData = await res.json();
        if (checkoutData.url) window.location.href = checkoutData.url;
        else { console.error('No checkout URL returned:', checkoutData); setCheckoutLoading(false); }
      } catch (err) {
        console.error('Checkout session error:', err);
        setCheckoutLoading(false);
      }
    } else if (installChoice === 'assisted') {
      setInstallDone(true); // show confirmation screen inside the modal
    } else {
      setShowInstallChoice(false); // self-install: close immediately, no action needed from team
    }
  }
  useEffect(() => { dndRef.current = dnd; }, [dnd]);

  useEffect(() => {
    const checkout = new URLSearchParams(window.location.search).get('checkout');
    if (checkout === 'success' || checkout === 'cancelled') {
      setCheckoutBanner(checkout);
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setCheckoutBanner(null), 5000);
    }
  }, []);

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const play = (freq, startTime) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        osc.start(startTime); osc.stop(startTime + 0.1);
      };
      play(520, ctx.currentTime);
      play(660, ctx.currentTime + 0.15);
    } catch {}
  }

  useEffect(() => {
    if (!profile?.client_id) return;
    supabase.from('leads').select('id, client_id, created_at, name, email, municipality, estimated_price, status').eq('client_id', profile.client_id).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false); });

    const channel = supabase
      .channel(`overview-leads-${profile.client_id}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `client_id=eq.${profile.client_id}` }, payload => {
        setLeads(prev => [payload.new, ...prev]);
        if (!dndRef.current) { setShowToast(true); setTimeout(() => setShowToast(false), 4000); }
        if (soundEnabledRef.current && !dndRef.current) playChime();
      })
      .subscribe((status) => { if (status === 'CHANNEL_ERROR') { console.warn('ClientOverview realtime channel error - will retry'); } });

    return () => { supabase.removeChannel(channel); };
  }, [profile?.client_id]);

  const now = new Date();
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todayLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.toDateString() === now.toDateString();
  });
  const wonLeads = leads.filter(l => l.status === 'Closed Won');
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const avg = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0) / leads.length)
    : null;

  const statCards = [
    { label: 'Leads Today',        value: loading ? '—' : String(todayLeads.length),    color: '#ecfccb', textColor: '#3f6212', icon: '📥' },
    { label: 'Leads This Month',   value: loading ? '—' : String(thisMonthLeads.length), color: '#dbeafe', textColor: '#1d4ed8', icon: '📊' },
    { label: 'Conversion Rate',    value: loading ? '—' : `${conversionRate}%`,          color: '#dcfce7', textColor: '#166534', icon: '🎯' },
    { label: 'Avg Estimate Value', value: loading ? '—' : avg != null ? `${avg.toLocaleString()} kr` : '—', color: '#fef9c3', textColor: '#854d0e', icon: '💰' },
  ];

  const recentLeads = leads.slice(0, 8);

  return (
    <ClientLayout title="Overview">
      {checkoutBanner === 'success' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: '#166534', color: '#fff', padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', zIndex: 9999 }}>
          Payment successful. Your plan is now active.
        </div>
      )}
      {checkoutBanner === 'cancelled' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: '#fef9c3', color: '#854d0e', padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', zIndex: 9999 }}>
          Payment was cancelled. You can upgrade anytime from Settings.
        </div>
      )}
      <TrialExpiredOverlay trialExpired={trialExpired} planEmailSent={planEmailSent} sendPlanEmail={sendPlanEmail} clientId={profile?.client_id} installPreference={installPreference} />

      {showInstallChoice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(240,242,245,0.98)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, padding: '40px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '460px', boxSizing: 'border-box', boxShadow: '0 4px 32px rgba(0,0,0,0.10)' }}>
            {installDone ? (
              /* ── Assisted-install confirmation ── */
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 20px' }}>✓</div>
                <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: '700', color: '#0d1117' }}>Request received!</h2>
                <p style={{ margin: '0 auto', fontSize: '13.5px', color: '#6b7280', lineHeight: '1.6', textAlign: 'center', maxWidth: '360px' }}>
                  We've received your request. Our team will contact you to schedule the installation. Please check your email within 24 hours.
                </p>
                <button type="button" onClick={() => { setShowInstallChoice(false); setInstallDone(false); }}
                  style={{ marginTop: '20px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', color: '#fff', backgroundColor: PRIMARY, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: FONT }}>
                  Continue to Dashboard
                </button>
              </div>
            ) : (
              /* ── Install choice form ── */
              <>
                <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '700', color: '#0d1117' }}>One last step</h1>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>How would you like to install QuickQuote360 on your website?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                  {INSTALL_CARDS.map(ic => (
                    <div key={ic.key} onClick={() => setInstallChoice(ic.key)}
                      style={{ border: `2px solid ${installChoice === ic.key ? PRIMARY : '#e8ede8'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', position: 'relative', backgroundColor: '#fff' }}>
                      {installChoice === ic.key && (
                        <span style={{ position: 'absolute', top: '12px', right: '14px', color: PRIMARY, fontWeight: '700', fontSize: '14px' }}>✓</span>
                      )}
                      <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#0d1117', fontSize: '13px' }}>
                        {ic.name} <span style={{ color: '#6b7280', fontWeight: '500' }}>, {ic.price}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>{ic.subtext}</p>
                    </div>
                  ))}
                </div>
                <button type="button" disabled={installSaving || checkoutLoading} onClick={handleInstallContinue}
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600', color: '#fff', backgroundColor: PRIMARY, border: 'none', borderRadius: '10px', cursor: (installSaving || checkoutLoading) ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: (installSaving || checkoutLoading) ? 0.8 : 1 }}>
                  {checkoutLoading ? 'Redirecting to payment...' : installSaving ? 'Saving…' : 'Continue'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showToast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, backgroundColor: '#0d1f12', color: '#fff', borderRadius: '12px', padding: '14px 20px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          New lead just came in!
        </div>
      )}
      <div style={{ fontFamily: FONT }}>

        <OnboardingBanner />

        {/* Page header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Overview</h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>
            {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}.` : 'Welcome back.'} Here's your dashboard.
          </p>
          {!loading && (
            <span style={{ display: 'inline-flex', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: '600', marginTop: '8px', backgroundColor: todayLeads.length > 0 ? '#ecfccb' : '#f3f4f6', color: todayLeads.length > 0 ? '#3f6212' : '#9ca3af' }}>
              {todayLeads.length > 0 ? `You have received ${todayLeads.length} new lead${todayLeads.length === 1 ? '' : 's'} today` : 'No leads yet today'}
            </span>
          )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={() => setSoundEnabled(p => !p)}
              title={soundEnabled ? 'Sound notifications on' : 'Sound notifications off'}
              style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', borderRadius: '8px', padding: '7px 10px', fontSize: '16px', cursor: 'pointer' }}>
              {soundEnabled ? '🔔' : '🔕'}
            </button>
            <button type="button" onClick={() => { const next = !dnd; setDnd(next); localStorage.setItem('qq360_dnd', JSON.stringify(next)); }}
              title={dnd ? 'Do Not Disturb on' : 'Do Not Disturb off'}
              style={{ border: '1px solid #e8ede8', borderRadius: '8px', padding: '7px 10px', fontSize: '14px', cursor: 'pointer', backgroundColor: dnd ? '#fef9c3' : '#fff', color: dnd ? '#854d0e' : '#9ca3af', fontWeight: '600', fontFamily: FONT }}>
              🌙 DND
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(card => (
            <div key={card.label} style={CARD}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.color, color: card.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '14px' }}>{card.icon}</div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Recent submissions table */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Recent Submissions</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Last {recentLeads.length} leads</span>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>Loading…</div>
          ) : recentLeads.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>
              No leads yet. Your leads will appear here once customers use your estimator tool.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fbf9' }}>
                  {COLUMNS.map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '11px 24px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', borderBottom: '1px solid #e8ede8' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, i) => {
                  const sc = STATUS_COLORS[lead.status] || { bg: '#f3f4f6', color: '#6b7280' };
                  return (
                    <tr key={lead.id}
                      onClick={() => navigate('/client/leads/' + lead.id)}
                      onMouseEnter={() => setHoveredRow(lead.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid #f4f6f4' : 'none', cursor: 'pointer', backgroundColor: hoveredRow === lead.id ? '#f9faf9' : 'transparent' }}>
                      <td style={{ padding: '14px 24px', fontWeight: '600', color: '#0d1117' }}>{lead.name || '—'}</td>
                      <td style={{ padding: '14px 24px', color: '#4b5563' }}>{lead.municipality || '—'}</td>
                      <td style={{ padding: '14px 24px', fontWeight: '600', color: '#0d1117' }}>
                        {lead.estimated_price != null && !isNaN(Number(lead.estimated_price)) ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: sc.bg, color: sc.color }}>
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', color: '#9ca3af' }}>{formatDate(lead.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ ...CARD, marginTop: '24px' }}>
          <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { key: 'leads',     icon: '📋', label: 'View All Leads',    path: '/client/leads'     },
              { key: 'pricing',   icon: '💰', label: 'Configure Pricing',  path: '/client/pricing'   },
              { key: 'questions', icon: '✏️', label: 'Edit Questions',     path: '/client/questions' },
              { key: 'embed',     icon: '🔗', label: 'Get Embed Code',     path: '/client/settings'  },
            ].map(action => (
              <div key={action.key}
                onClick={() => navigate(action.path)}
                onMouseEnter={() => setHoveredAction(action.key)}
                onMouseLeave={() => setHoveredAction(null)}
                style={{ backgroundColor: hoveredAction === action.key ? '#f9faf9' : '#fff', border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'background-color 0.12s' }}>
                <span style={{ fontSize: '22px' }}>{action.icon}</span>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{action.label}</span>
              </div>
            ))}
            <div
              onClick={() => setShowStatsModal(true)}
              onMouseEnter={() => setHoveredAction('reports')}
              onMouseLeave={() => setHoveredAction(null)}
              style={{ backgroundColor: hoveredAction === 'reports' ? '#f9faf9' : '#fff', border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'background-color 0.12s' }}>
              <span style={{ fontSize: '22px' }}>📈</span>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>View Reports</span>
            </div>
            <div
              onClick={() => {
                if (!leads.length) return;
                const fmt = d => { const x = new Date(d); return `${String(x.getDate()).padStart(2,'0')}/${String(x.getMonth()+1).padStart(2,'0')}/${x.getFullYear()}`; };
                const headers = ['Date','Name','Email','Phone','Municipality','Price','Status'];
                const rows = leads.map(l => [fmt(l.created_at), l.name||'', l.email||'', l.phone||'', l.municipality||'', l.estimated_price??'', l.status||'']);
                const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
                a.download = `quickquote360-leads-${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }}
              onMouseEnter={() => setHoveredAction('csv')}
              onMouseLeave={() => setHoveredAction(null)}
              style={{ backgroundColor: hoveredAction === 'csv' ? '#f9faf9' : '#fff', border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'background-color 0.12s', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '22px' }}>📥</span>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Download CSV</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <style>{`@keyframes pulseRing { 0%, 100% { box-shadow: none; } 50% { box-shadow: 0 0 0 4px rgba(163,230,53,0.3); } }`}</style>
        <div style={{ ...CARD, marginTop: '24px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Recent Activity</p>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {['All', 'Won', 'Active', 'Today'].map(f => (
              <button key={f} type="button" onClick={() => setActivityFilter(f)}
                style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: activityFilter === f ? 'none' : '1px solid #e8ede8', backgroundColor: activityFilter === f ? PRIMARY : '#fff', color: activityFilter === f ? '#fff' : '#4b5563', fontFamily: FONT, transition: 'all 0.12s' }}>
                {f}
              </button>
            ))}
          </div>
          {(() => {
            const todayStr = new Date().toDateString();
            const filtered = activityFilter === 'Won'
              ? leads.filter(l => l.status === 'Closed Won')
              : activityFilter === 'Active'
              ? leads.filter(l => ['New','Contacted','In Progress'].includes(l.status))
              : activityFilter === 'Today'
              ? leads.filter(l => new Date(l.created_at).toDateString() === todayStr)
              : leads;
            return filtered.slice(0, 5);
          })().length === 0 ? (
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af', textAlign: 'center', padding: '16px 0', fontFamily: FONT }}>No leads yet.</p>
          ) : (() => {
            const todayStr2 = new Date().toDateString();
            const filtered = activityFilter === 'Won' ? leads.filter(l => l.status === 'Closed Won') : activityFilter === 'Active' ? leads.filter(l => ['New','Contacted','In Progress'].includes(l.status)) : activityFilter === 'Today' ? leads.filter(l => new Date(l.created_at).toDateString() === todayStr2) : leads;
            return filtered.slice(0, 5);
          })().map((lead, i, arr) => {
            const statusKey = (lead.status || '').toLowerCase().replace(/\s+/g, '_');
            const dotColor = statusKey === 'closed_won' ? '#16a34a' : statusKey === 'closed_lost' ? '#dc2626' : statusKey === 'in_progress' ? '#7c3aed' : statusKey === 'contacted' ? '#d97706' : '#a3e635';
            const diff = Date.now() - new Date(lead.created_at).getTime();
            const mins = Math.floor(diff / 60000);
            const timeAgoStr = mins < 1 ? 'just now' : mins < 60 ? `${mins} mins ago` : mins < 1440 ? `${Math.floor(mins/60)} hours ago` : `${Math.floor(mins/1440)} days ago`;
            return (
              <div key={lead.id}
                onClick={() => navigate('/client/leads/' + lead.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f4f6f4' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0, animation: i === 0 ? 'pulseRing 2s ease-in-out infinite' : 'none' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{lead.name || '—'}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{timeAgoStr}</p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0d1117', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                  {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {showStatsModal && (() => {
        const weekStart = (() => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d; })();
        const thisWeek  = leads.filter(l => new Date(l.created_at) >= weekStart).length;
        const statsRows = [
          { label: 'Total Leads Ever',       value: String(leads.length) },
          { label: 'Leads This Month',        value: String(thisMonthLeads.length) },
          { label: 'Leads This Week',         value: String(thisWeek) },
          { label: 'Total Won Leads',         value: String(wonLeads.length) },
          { label: 'Conversion Rate',         value: `${conversionRate}%` },
          { label: 'Average Estimate Value',  value: avg != null ? `${avg.toLocaleString()} kr` : '—' },
        ];
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) setShowStatsModal(false); }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '36px', width: '560px', maxWidth: '90vw', boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: FONT }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>Your Stats Summary</h2>
                <button type="button" onClick={() => setShowStatsModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#9ca3af', lineHeight: 1, padding: '4px' }}>×</button>
              </div>
              {statsRows.map(({ label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                  <span style={{ fontSize: '13.5px', color: '#6b7280', fontFamily: FONT }}>{label}</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => {
                    const date = new Date().toLocaleDateString('en-GB');
                    const text = [`QuickQuote360 Stats Summary`, date, '', ...statsRows.map(r => `${r.label}: ${r.value}`)].join('\n');
                    navigator.clipboard.writeText(text).then(() => { setShareStatsMsg('Copied to clipboard!'); setTimeout(() => setShareStatsMsg(''), 2000); });
                  }} style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                    Share Stats
                  </button>
                  <button type="button" onClick={() => {
                    const csv = ['Stat Name,Value', ...statsRows.map(r => `"${r.label}","${r.value}"`)].join('\n');
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                    a.download = `quickquote360-stats-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                  }} style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                    Download Stats
                  </button>
                </div>
                {shareStatsMsg && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#16a34a', fontWeight: '600', textAlign: 'right', fontFamily: FONT }}>{shareStatsMsg}</p>}
              </div>
            </div>
          </div>
        );
      })()}
    </ClientLayout>
  );
}
