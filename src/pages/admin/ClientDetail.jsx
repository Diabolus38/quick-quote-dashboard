import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';

const FONT    = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  padding: '24px',
};

const STATUS_BADGE = {
  new:          { bg: '#dbeafe', color: '#1d4ed8' },
  contacted:    { bg: '#fef9c3', color: '#854d0e' },
  in_progress:  { bg: '#ede9fe', color: '#7c3aed' },
  closed_won:   { bg: '#dcfce7', color: '#166534' },
  closed_lost:  { bg: '#fee2e2', color: '#991b1b' },
};

const PLAN_STYLE = {
  scale:   { bg: '#ecfccb', color: '#3f6212'  },
  growth:  { bg: '#ede9fe', color: '#7c3aed'  },
  starter: { bg: '#dbeafe', color: '#1d4ed8'  },
};

const PLAN_LIMIT = { starter: 30, growth: 75, scale: Infinity };

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function formatDateTime(str) {
  if (!str) return '—';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function InfoRow({ label, children, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: last ? 'none' : '1px solid #f4f6f4' }}>
      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500', flexShrink: 0, marginRight: '16px' }}>{label}</span>
      <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500', textAlign: 'right' }}>{children}</span>
    </div>
  );
}

function UsageBarDetail({ count, plan }) {
  if (plan === 'scale') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Usage</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#0d1117' }}>∞ Unlimited</span>
        </div>
        <div style={{ height: '6px', backgroundColor: '#f3f4f6', borderRadius: '99px' }}>
          <div style={{ width: `${count > 0 ? 30 : 0}%`, height: '100%', backgroundColor: LIME, borderRadius: '99px' }} />
        </div>
      </div>
    );
  }
  const limit = PLAN_LIMIT[plan] || 30;
  const pct   = Math.min(Math.round((count / limit) * 100), 100);
  const fill  = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : LIME;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Usage</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#0d1117' }}>{count} / {limit}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: fill, borderRadius: '99px' }} />
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [client,   setClient]   = useState(null);
  const [leads,    setLeads]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [notes,        setNotes]        = useState('');
  const [notesSaved,   setNotesSaved]   = useState(false);
  const [notesHistory, setNotesHistory] = useState([]);

  const [copiedEmbed,    setCopiedEmbed]    = useState(false);
  const [copiedId,       setCopiedId]       = useState(false);
  const [resetMsg,       setResetMsg]       = useState('');
  const [welcomeMsg,     setWelcomeMsg]     = useState('');
  const [sendingWelcome, setSendingWelcome] = useState(false);
  const [changePlan,     setChangePlan]     = useState('');
  const [planSaved,      setPlanSaved]      = useState(false);
  const [lastActivity,   setLastActivity]   = useState(null);
  const [setupChecklist, setSetupChecklist] = useState(null);
  const [selectedMonth,  setSelectedMonth]  = useState(null);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    setLoading(true);
    const [{ data: clientData, error: clientErr }, { data: leadsData }, { data: profileData }, { data: settingsData }, { data: pricingData }, { data: questionsData }, { data: munisData }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('leads').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('updated_at').eq('client_id', id).single(),
      supabase.from('client_settings').select('branding, email_settings, pdf_content').eq('client_id', id).maybeSingle(),
      supabase.from('client_pricing').select('base_prices').eq('client_id', id).maybeSingle(),
      supabase.from('client_questions').select('id').eq('client_id', id).limit(1),
      supabase.from('client_municipalities').select('id').eq('client_id', id).limit(1),
    ]);
    if (clientErr || !clientData) { setNotFound(true); setLoading(false); return; }
    setClient(clientData);
    setNotes(clientData.notes || '');
    setChangePlan(clientData.plan || 'starter');
    setLeads(leadsData || []);
    setLastActivity(profileData?.updated_at || null);
    const bp = pricingData?.base_prices || {};
    const anyPriceSet = Object.values(bp).some(row => typeof row === 'object' && Object.values(row).some(v => Number(v) > 0));
    setSetupChecklist({
      branding:      !!(settingsData?.branding?.company_name),
      pricing:       anyPriceSet,
      questions:     (questionsData || []).length > 0,
      municipalities:(munisData || []).length > 0,
      emailSettings: !!(settingsData?.email_settings?.from_name),
      pdfContent:    !!(settingsData?.pdf_content?.introduction),
    });
    try {
      const stored = localStorage.getItem('qq360_notes_history_' + id);
      setNotesHistory(stored ? JSON.parse(stored) : []);
    } catch { setNotesHistory([]); }
    setLoading(false);
  }

  async function handleDeactivate() {
    const newActive = !client.active;
    await supabase.from('clients').update({ active: newActive }).eq('id', id);
    setClient(prev => ({ ...prev, active: newActive }));
  }

  async function handleSaveNotes() {
    await supabase.from('clients').update({ notes }).eq('id', id);
    const entry = { text: notes, savedAt: new Date().toISOString() };
    const updated = [entry, ...notesHistory].slice(0, 5);
    setNotesHistory(updated);
    localStorage.setItem('qq360_notes_history_' + id, JSON.stringify(updated));
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  async function handleSendReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(client.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetMsg(error ? 'Failed to send reset email.' : `Reset email sent to ${client.email}`);
    setTimeout(() => setResetMsg(''), 3000);
  }

  async function handleSendWelcome() {
    setSendingWelcome(true);
    try {
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: client.email,
          name: client.name,
          subject: 'Welcome to QuickQuote360',
          body: `Hi ${client.name}, welcome to QuickQuote360! Your account has been set up and you can now log in at https://dashboard.quickquote360.com. Your embed code is ready — log in to find it under Settings. If you need help getting started contact support@quickquote360.com. Welcome aboard!`,
        }),
      });
      setWelcomeMsg(res.ok ? 'Sent!' : 'Failed');
    } catch {
      setWelcomeMsg('Failed');
    }
    setSendingWelcome(false);
    setTimeout(() => setWelcomeMsg(''), 3000);
  }

  async function handleSavePlan() {
    await supabase.from('clients').update({ plan: changePlan }).eq('id', id);
    setClient(prev => ({ ...prev, plan: changePlan }));
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2000);
  }

  async function handleDeleteClient() {
    if (!window.confirm('Permanently delete this client and all their data? This cannot be undone.')) return;
    await supabase.from('clients').delete().eq('id', id);
    navigate('/admin/clients');
  }

  function copyEmbed() {
    const code = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="${id}"></script>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    });
  }

  function copyClientId() {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  }

  if (loading) return (
    <Layout title="Client Detail">
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      <div style={{ fontFamily: FONT }}>
        <div style={{ borderRadius: '8px', background: '#f0f0f0', height: '20px', width: '130px', marginBottom: '20px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '56px', marginBottom: '28px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '300px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '160px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '220px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div style={{ width: '300px', flexShrink: 0 }}>
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '220px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '180px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '200px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </Layout>
  );

  if (notFound) return (
    <Layout title="Client Detail">
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626', fontSize: '14px', fontFamily: FONT }}>Client not found.</div>
    </Layout>
  );

  const now            = new Date();
  const isActive       = client.active !== false;
  const planStyle      = PLAN_STYLE[client.plan] || PLAN_STYLE.starter;
  const recentLeads    = selectedMonth
    ? leads.filter(l => { const d = new Date(l.created_at); return d.getFullYear() === selectedMonth.year && d.getMonth() === selectedMonth.month; }).slice(0, 10)
    : leads.slice(0, 5);
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const avgPrice = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0) / leads.length)
    : null;
  const limit = client.plan === 'scale' ? '∞ Unlimited' : (PLAN_LIMIT[client.plan] || 30);
  const embedCode = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="${id}"></script>`;

  const wonLeadsCount     = leads.filter(l => (l.status || '').toLowerCase().replace(/\s+/g,'_') === 'closed_won').length;
  const conversionRate    = leads.length > 0 ? (wonLeadsCount / leads.length) * 100 : 0;
  const planLimitNum      = PLAN_LIMIT[client.plan] ?? 30;
  const usagePct          = planLimitNum === Infinity ? 0 : (leads.length / planLimitNum);
  let healthScore = 0;
  if (thisMonthLeads.length > 0) healthScore += 30;
  if (conversionRate > 10)       healthScore += 20;
  if (usagePct < 0.8)            healthScore += 20;
  if (client.website_url)        healthScore += 15;
  if (isActive)                  healthScore += 15;
  const healthColor = healthScore >= 80 ? '#16a34a' : healthScore >= 50 ? '#d97706' : '#dc2626';
  const healthBg    = healthScore >= 80 ? '#dcfce7'  : healthScore >= 50 ? '#fef9c3'  : '#fee2e2';

  const BTN_PRIMARY   = { backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, width: '100%', marginBottom: '8px' };
  const BTN_SECONDARY = { backgroundColor: '#fff', border: '1px solid #e8ede8', color: '#0d1117', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT, width: '100%', marginBottom: '8px' };
  const BTN_DANGER    = { backgroundColor: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, width: '100%', marginBottom: '8px' };

  return (
    <Layout title="Client Detail">
      <div style={{ fontFamily: FONT }}>

        {/* ── Back ── */}
        <button type="button" onClick={() => navigate('/admin/clients')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, marginBottom: '20px', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Clients
        </button>

        {/* ── Title Row ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>{client.name}</h1>
            <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: planStyle.bg, color: planStyle.color }}>
              {capitalize(client.plan)}
            </span>
            <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#166534' : '#dc2626' }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={copyEmbed}
              style={{ backgroundColor: copiedEmbed ? '#ecfccb' : '#fff', border: '1px solid #e8ede8', color: copiedEmbed ? '#3f6212' : '#0d1117', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s' }}>
              {copiedEmbed ? '✓ Copied!' : 'Copy Embed Code'}
            </button>
            <button type="button" onClick={async () => {
              const { error } = await supabase.auth.resetPasswordForEmail(client.email, { redirectTo: window.location.origin + '/login' });
              setResetMsg(error ? 'Failed to send reset email.' : `Reset email sent to ${client.email}`);
              setTimeout(() => setResetMsg(''), 3000);
            }}
              style={{ backgroundColor: '#fff', border: '1px solid #e8ede8', color: '#0d1117', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
              Reset Password
            </button>
            {resetMsg && <span style={{ fontSize: '12px', color: resetMsg.includes('Failed') ? '#dc2626' : '#16a34a', fontWeight: '600', fontFamily: FONT, alignSelf: 'center' }}>{resetMsg}</span>}
            <a href={`https://estimator.quickquote360.com?clientId=${id}`} target="_blank" rel="noopener noreferrer"
              style={{ backgroundColor: '#fff', border: '1px solid #e8ede8', color: '#0d1117', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              View Live Tool →
            </a>
            <button type="button" onClick={handleDeactivate}
              style={{ backgroundColor: isActive ? '#fff' : PRIMARY, border: isActive ? '1px solid #dc2626' : 'none', color: isActive ? '#dc2626' : '#fff', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* ── LEFT ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Account Details */}
            <div style={CARD}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Account Details</p>
              <InfoRow label="Company Name">{client.name || '—'}</InfoRow>
              <InfoRow label="Email">{client.email || '—'}</InfoRow>
              <InfoRow label="Website URL">
                {client.website_url
                  ? <a href={client.website_url} target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY, textDecoration: 'none', fontWeight: '500' }}>{client.website_url}</a>
                  : '—'}
              </InfoRow>
              <InfoRow label="Plan">{capitalize(client.plan)}</InfoRow>
              <InfoRow label="Status">{isActive ? 'Active' : 'Inactive'}</InfoRow>
              <InfoRow label="Signed Up">{formatDate(client.created_at)}</InfoRow>
              <InfoRow label="Last Activity">{formatDateTime(lastActivity)}</InfoRow>
              <InfoRow label="Client ID" last>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '11px', backgroundColor: '#f4f6f4', padding: '3px 8px', borderRadius: '6px', color: '#374151', fontFamily: 'monospace' }}>{id}</code>
                  <button type="button" onClick={copyClientId}
                    style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: copiedId ? '#166534' : '#374151', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}>
                    {copiedId ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </InfoRow>
            </div>

            {/* Internal Notes */}
            <div style={{ ...CARD, marginTop: '16px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Internal Notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add internal notes about this client…"
                style={{ width: '100%', boxSizing: 'border-box', height: '100px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: FONT, outline: 'none', color: '#0d1117', resize: 'vertical' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={handleSaveNotes}
                  style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                  Save Notes
                </button>
                {notesSaved && <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>✓ Saved!</span>}
              </div>
              {notesHistory.length > 0 && (
                <div style={{ marginTop: '18px', borderTop: '1px solid #f4f6f4', paddingTop: '14px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Notes History</p>
                  {notesHistory.map((item, i) => {
                    const d = new Date(item.savedAt);
                    const ts = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                    return (
                      <div key={i} style={{ padding: '10px 0', borderBottom: i < notesHistory.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 3px', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{ts}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#374151', fontFamily: FONT, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.text || '(empty)'}</p>
                          </div>
                          <button type="button" onClick={() => setNotes(item.text)}
                            style={{ flexShrink: 0, border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontFamily: FONT }}>
                            Restore
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Leads */}
            <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Recent Leads</span>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#374151' }}>{leads.length}</span>
                  {selectedMonth && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: '#ecfccb', color: '#166534' }}>
                      Showing {new Date(selectedMonth.year, selectedMonth.month).toLocaleString('default', { month: 'long' })} {selectedMonth.year}
                      <span onClick={() => setSelectedMonth(null)} style={{ cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</span>
                    </span>
                  )}
                </div>
              </div>
              {recentLeads.length === 0 ? (
                <p style={{ margin: 0, padding: '40px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>No leads yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa' }}>
                      {['Customer Name','Email','Price','Date','Status'].map(col => (
                        <th key={col} style={{ textAlign: 'left', padding: '10px 20px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead, i) => {
                      const rawStatus = (lead.status || 'new').toLowerCase().replace(/\s+/g, '_');
                      const sb        = STATUS_BADGE[rawStatus] || { bg: '#f3f4f6', color: '#6b7280' };
                      return (
                        <tr key={lead.id}
                          onClick={() => navigate(`/admin/leads/${lead.id}`)}
                          style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid #f4f6f4' : 'none', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9faf9'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                          <td style={{ padding: '12px 20px', fontWeight: '600', color: '#0d1117', fontSize: '13px' }}>{lead.name || '—'}</td>
                          <td style={{ padding: '12px 20px', color: '#9ca3af', fontSize: '13px' }}>{lead.email || '—'}</td>
                          <td style={{ padding: '12px 20px', fontWeight: '600', color: '#0d1117', fontSize: '13px' }}>
                            {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                          </td>
                          <td style={{ padding: '12px 20px', color: '#9ca3af', fontSize: '13px' }}>{formatDate(lead.created_at)}</td>
                          <td style={{ padding: '12px 20px', fontSize: '13px' }}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: sb.bg, color: sb.color }}>
                              {lead.status || 'New'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ width: '300px', flexShrink: 0 }}>

            {/* Quick Stats */}
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Quick Stats</p>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', backgroundColor: healthBg, color: healthColor, fontSize: '13px', fontWeight: '700' }}>
                  {healthScore}/100
                </span>
              </div>
              {[
                { label: 'Total Leads',       value: leads.length },
                { label: 'Leads This Month',  value: thisMonthLeads.length },
                { label: 'Avg Estimate Value', value: avgPrice != null ? `${avgPrice.toLocaleString()} kr` : '—' },
                { label: 'Plan Limit',         value: typeof limit === 'number' ? limit : limit },
              ].map(({ label, value }, idx, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: idx < arr.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117' }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: '16px' }}>
                <UsageBarDetail count={leads.length} plan={client.plan} />
              </div>
            </div>

            {/* Usage History */}
            <div style={{ ...CARD, marginTop: '16px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Usage History</p>
              {(() => {
                const months = Array.from({ length: 6 }, (_, i) => {
                  const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
                  return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('default', { month: 'short' }) };
                });
                const counts = months.map(({ year, month }) =>
                  leads.filter(l => { const d = new Date(l.created_at); return d.getFullYear() === year && d.getMonth() === month; }).length
                );
                const maxCount = Math.max(...counts, 1);
                const allZero = counts.every(c => c === 0);
                if (allZero) return (
                  <div style={{ textAlign: 'center', padding: '28px 0' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af', fontFamily: FONT }}>No usage data yet</p>
                  </div>
                );
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '6px' }}>
                      {counts.map((count, i) => {
                        const heightPct = count > 0 ? Math.max(Math.round((count / maxCount) * 100), 4) : 0;
                        const m = months[i];
                        const isSelected = selectedMonth && selectedMonth.year === m.year && selectedMonth.month === m.month;
                        return (
                          <div key={i} onClick={() => setSelectedMonth(isSelected ? null : m)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', cursor: 'pointer' }}>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>{count > 0 ? count : ''}</span>
                            <div style={{ width: '100%', height: `${heightPct}%`, backgroundColor: isSelected ? PRIMARY : LIME, borderRadius: '4px 4px 2px 2px', minHeight: count > 0 ? '4px' : '0', outline: isSelected ? `2px solid ${PRIMARY}` : 'none', outlineOffset: '2px' }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      {months.map(({ label }, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>{label}</div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Embed Code */}
            <div style={{ ...CARD, marginTop: '16px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Embed Code</p>
              <div style={{ backgroundColor: '#0d1117', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px', overflowX: 'auto' }}>
                <code style={{ fontSize: '11px', color: '#a3e635', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.6' }}>
                  {embedCode}
                </code>
              </div>
              <button type="button" onClick={copyEmbed}
                style={{ width: '100%', backgroundColor: copiedEmbed ? '#ecfccb' : '#fff', border: '1px solid #e8ede8', color: copiedEmbed ? '#3f6212' : '#0d1117', borderRadius: '10px', padding: '9px 0', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', marginBottom: '10px' }}>
                {copiedEmbed ? '✓ Copied!' : 'Copy Code'}
              </button>
              <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Paste this before &lt;/body&gt; on their website</p>
            </div>

            {/* Actions */}
            <div style={{ ...CARD, marginTop: '16px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Actions</p>

              <button type="button" onClick={handleSendWelcome} disabled={sendingWelcome} style={{ ...BTN_SECONDARY, opacity: sendingWelcome ? 0.6 : 1 }}>
                {sendingWelcome ? 'Sending…' : 'Send Welcome Email'}
              </button>
              {welcomeMsg && <p style={{ fontSize: '12px', color: welcomeMsg === 'Sent!' ? '#16a34a' : '#dc2626', marginBottom: '8px', fontFamily: FONT }}>{welcomeMsg}</p>}

              <button type="button" onClick={handleSendReset} style={BTN_SECONDARY}>
                Send Password Reset Email
              </button>

              {resetMsg && <p style={{ fontSize: '12px', color: resetMsg.includes('Failed') ? '#dc2626' : '#166534', marginBottom: '8px', fontFamily: FONT }}>{resetMsg}</p>}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT }}>Change Plan</label>
                <select value={changePlan} onChange={e => setChangePlan(e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: FONT, outline: 'none', backgroundColor: '#fff', color: '#0d1117', marginBottom: '8px' }}>
                  <option value="starter">Starter — $300/mo</option>
                  <option value="growth">Growth — $600/mo</option>
                  <option value="scale">Scale — $1,149/mo</option>
                </select>
                <button type="button" onClick={handleSavePlan}
                  style={{ width: '100%', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 0', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                  {planSaved ? '✓ Plan Saved!' : 'Save Plan'}
                </button>
              </div>

              <button type="button" onClick={() => window.open('/client', '_blank')} style={BTN_PRIMARY}>
                Open Client Dashboard →
              </button>

              <button type="button" onClick={handleDeactivate} style={BTN_DANGER}>
                {isActive ? 'Deactivate Account' : 'Reactivate Account'}
              </button>

              <button type="button" onClick={handleDeleteClient}
                style={{ backgroundColor: '#fff', border: '2px solid #dc2626', color: '#dc2626', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, width: '100%', marginBottom: '8px' }}>
                Delete Client
              </button>
            </div>

            {/* Setup Checklist */}
            {setupChecklist && (
              <div style={{ ...CARD, marginTop: '16px' }}>
                <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Setup Checklist</p>
                {[
                  { label: 'Branding set',              ok: setupChecklist.branding       },
                  { label: 'Pricing configured',       ok: setupChecklist.pricing        },
                  { label: 'Questions customized',     ok: setupChecklist.questions      },
                  { label: 'Municipalities added',     ok: setupChecklist.municipalities },
                  { label: 'Email settings configured', ok: setupChecklist.emailSettings  },
                  { label: 'PDF content configured',   ok: setupChecklist.pdfContent     },
                ].map(({ label, ok }, i, arr) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: ok ? '#16a34a' : '#9ca3af' }}>{ok ? '✓' : '—'}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
