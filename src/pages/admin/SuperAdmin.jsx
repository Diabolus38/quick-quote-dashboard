import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { calculateMRR, getPlanCounts } from '../../utils/mrrUtils';
import { PLAN_FEES } from '../../utils/planConfig';
import { ensureClientData } from '../../utils/ensureClientData';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';
const DARK    = '#0d1f12';

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px' };

/* ── Helpers ─────────────────────────────────────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? '1d ago' : `${days}d ago`;
}

function daysAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function getDateLabel(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString())     return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return null;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

const AVATAR_PALETTE = ['#166534','#1d4ed8','#7c3aed','#dc2626','#d97706','#0e7490'];
function avatarBg(id) {
  if (!id) return AVATAR_PALETTE[0];
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

/* ── Usage Bar ───────────────────────────────────────────────── */

function UsageBar({ count, plan }) {
  if (plan === 'scale') {
    return <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>∞ unlimited</span>;
  }
  const limit = plan === 'growth' ? 75 : 30;
  const pct   = Math.min(Math.round((count / limit) * 100), 100);
  const fill  = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : LIME;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '100px', height: '6px', borderRadius: '99px', backgroundColor: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: fill, borderRadius: '99px' }} />
      </div>
      <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', fontFamily: FONT }}>{pct}%</span>
    </div>
  );
}

/* ── Small Action Button ─────────────────────────────────────── */

function SmallBtn({ label, bg, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '3px 9px', fontSize: '11px', fontWeight: '600', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', transition: 'all 0.12s',
        backgroundColor: hov ? color : bg, color: hov ? '#fff' : color }}>
      {label}
    </button>
  );
}

/* ── Add Client Modal ────────────────────────────────────────── */

function AddClientModal({ onClose, onSaved }) {
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [website, setWebsite] = useState('');
  const [plan,    setPlan]    = useState('starter');
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name: name.trim(), email: email.trim(), plan, active: true };
    if (website.trim()) payload.website_url = website.trim();
    const { data, error } = await supabase.from('clients').insert(payload).select('id').single();
    if (!error && data?.id) {
      await Promise.all([
        supabase.from('client_settings').insert({
          client_id: data.id,
          branding: {}, pdf_content: {}, email_settings: {}, language_settings: {},
        }),
        supabase.from('client_pricing').insert({
          client_id: data.id,
          base_prices: {
            bdt:    { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            wc:     { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
            wc_bdt: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
          },
          fixed_costs: { planning: 0, establishment_zone1: 0, establishment_zone2: 0, de_establishment: 0, admin: 0, inspection: 0 },
          per_meter_costs: { gravity_pipe: 0, pressure_pipe: 0, protection_pipe: 0, cable: 0, makadam: 0, labor: 0 },
          addons: { pump_well: 0, double_pump: 0, telescope_cover: 0, lawn_restoration_base: 0, mass_removal: 0, transport: 0 },
          rot_enabled: false, rot_percentage: 30, currency: 'SEK',
        }),
      ]);
      ensureClientData(supabase, data.id).catch(err => console.error('ensureClientData after SuperAdmin add:', err));
    }
    setSaving(false);
    if (!error) { onSaved(); onClose(); }
  }

  const inp = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px', fontSize: '13.5px', fontFamily: FONT, outline: 'none', color: '#0d1117', backgroundColor: '#fff' };
  const lbl = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '36px', width: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>Add New Client</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Company Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" style={inp} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@company.com" style={inp} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Website URL <span style={{ fontWeight: '400', color: '#9ca3af' }}>(optional)</span></label>
          <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" style={inp} />
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label style={lbl}>Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            <option value="starter">Starter — ${PLAN_FEES.starter}/mo</option>
            <option value="growth">Growth — ${PLAN_FEES.growth}/mo</option>
            <option value="scale">Scale — ${PLAN_FEES.scale}/mo</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose}
            style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '10px 22px', fontSize: '13.5px', cursor: 'pointer', fontFamily: FONT, fontWeight: '500' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !name.trim()}
            style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13.5px', fontWeight: '600', cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: FONT, opacity: !name.trim() ? 0.5 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export default function SuperAdmin() {
  const navigate   = useNavigate();
  const { profile } = useAuth();

  const [clients,    setClients]    = useState([]);
  const [leads,      setLeads]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [copiedId,     setCopiedId]     = useState(null);
  const [copiedGlobal, setCopiedGlobal] = useState(false);
  const [hoveredRow,   setHoveredRow]   = useState(null);
  const [healthStatus,    setHealthStatus]    = useState({ api: 'checking', frontend: 'checking', dashboard: 'checking' });
  const [lastChecked,     setLastChecked]     = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => { fetchAll(); }, []);

  function handleRefresh() { fetchAll(); }

  async function checkHealth() {
    setHealthStatus({ api: 'checking', frontend: 'checking', dashboard: 'checking' });
    const services = [
      { key: 'api',       url: 'https://estimator-widget-production.up.railway.app/health' },
      { key: 'frontend',  url: 'https://estimator.quickquote360.com'                       },
      { key: 'dashboard', url: 'https://dashboard.quickquote360.com'                       },
    ];
    await Promise.all(services.map(async ({ key, url }) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        await fetch(url, { signal: controller.signal, mode: 'no-cors' });
        setHealthStatus(prev => ({ ...prev, [key]: 'up' }));
      } catch {
        setHealthStatus(prev => ({ ...prev, [key]: 'down' }));
      } finally {
        clearTimeout(timer);
      }
    }));
    setLastChecked(new Date());
  }

  useEffect(() => { checkHealth(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [clientsRes, leadsRes, profilesRes] = await Promise.all([
      supabase.from('clients').select('id, name, email, plan, active, created_at').order('created_at', { ascending: false }),
      supabase.from('leads').select('id, client_id, name, created_at, status, estimated_price').order('created_at', { ascending: false }).limit(500),
      supabase.from('profiles').select('id, client_id, role'),
    ]);
    if (clientsRes.error)  console.error('Failed to fetch clients:', clientsRes.error);
    if (leadsRes.error)    console.error('Failed to fetch leads:', leadsRes.error);
    if (profilesRes.error) console.error('Failed to fetch profiles:', profilesRes.error);
    setClients(clientsRes.data || []);
    setLeads(leadsRes.data     || []);
    setLoading(false);
  }

  /* ── Derived data ── */
  const today = new Date().toDateString();
  const now   = new Date();

  const totalClients  = clients.length;
  const activeClients = clients.filter(c => c.active !== false).length;
  const newToday      = clients.filter(c => new Date(c.created_at).toDateString() === today).length;
  const totalLeads    = leads.length;
  const leadsToday    = leads.filter(l => new Date(l.created_at).toDateString() === today).length;
  const thisMonthNew  = clients.filter(c => { const d = new Date(c.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;

  const { starterCount, growthCount, scaleCount } = getPlanCounts(clients);
  const mrr = calculateMRR(clients);
  const maxPlan = Math.max(starterCount, growthCount, scaleCount, 1);

  const startOfThisMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevClients       = clients.filter(c => new Date(c.created_at) < startOfThisMonth);
  const lastMonthMrr      = prevClients.filter(c => c.plan === 'starter').length * PLAN_FEES.starter
                          + prevClients.filter(c => c.plan === 'growth').length  * PLAN_FEES.growth
                          + prevClients.filter(c => c.plan === 'scale').length   * PLAN_FEES.scale;
  const mrrDiff = mrr - lastMonthMrr;

  const leadCountPerClient  = {};
  const lastActivePerClient = {};
  leads.forEach(l => {
    leadCountPerClient[l.client_id] = (leadCountPerClient[l.client_id] || 0) + 1;
    const ex = lastActivePerClient[l.client_id];
    if (!ex || new Date(l.created_at) > new Date(ex)) lastActivePerClient[l.client_id] = l.created_at;
  });

  const leadsThisMonthPerClient = {};
  leads.forEach(l => {
    const d = new Date(l.created_at);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      leadsThisMonthPerClient[l.client_id] = (leadsThisMonthPerClient[l.client_id] || 0) + 1;
    }
  });

  const PLAN_LIMIT_SA = { starter: Infinity, growth: 30, scale: 75 };
  const systemAlerts = [];
  clients.forEach(c => {
    const planLimit = PLAN_LIMIT_SA[c.plan] || 30;
    const thisMonthCount = leadsThisMonthPerClient[c.id] || 0;
    if (planLimit !== Infinity && thisMonthCount / planLimit >= 0.9) {
      const pct = Math.round((thisMonthCount / planLimit) * 100);
      systemAlerts.push({ key: `${c.id}_warning`, msg: `⚠ ${c.name} is at ${pct}% of their ${c.plan} limit`, borderColor: '#d97706' });
    }
    if (c.active === false) {
      systemAlerts.push({ key: `${c.id}_info`, msg: `● ${c.name} account is inactive`, borderColor: '#1d4ed8' });
    }
    if ((leadCountPerClient[c.id] || 0) === 0) {
      systemAlerts.push({ key: `${c.id}_suggestion`, msg: `→ ${c.name} has no leads yet — they may need help with setup`, borderColor: '#9ca3af' });
    }
    if (lastActivePerClient[c.id]) {
      const daysSinceActive = Math.floor((Date.now() - new Date(lastActivePerClient[c.id]).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceActive > 30) {
        systemAlerts.push({ key: `${c.id}_quiet`, msg: `⏰ ${c.name} has not received a lead in ${daysSinceActive} days.`, borderColor: '#7c3aed' });
      }
    }
  });

  const clientMap = {};
  clients.forEach(c => { clientMap[c.id] = c.name; });

  /* ── Activity events ── */
  const events = [
    ...leads.map(l   => ({ type: 'lead',   date: new Date(l.created_at), name: l.name || 'Anonymous', clientName: clientMap[l.client_id] || '—' })),
    ...clients.map(c => ({ type: 'signup', date: new Date(c.created_at), name: c.name })),
  ].sort((a, b) => b.date - a.date).slice(0, 15);

  /* ── Actions ── */
  async function toggleActive(clientId, isCurrentlyActive) {
    await supabase.from('clients').update({ active: !isCurrentlyActive }).eq('id', clientId);
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, active: !isCurrentlyActive } : c));
  }

  function copyEmbed(clientId) {
    const code = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="${clientId}"></script>`;
    navigator.clipboard.writeText(code).then(() => { setCopiedId(clientId); setTimeout(() => setCopiedId(null), 2000); });
  }

  function copyGlobalEmbed() {
    const code = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="YOUR_CLIENT_ID"></script>`;
    navigator.clipboard.writeText(code).then(() => { setCopiedGlobal(true); setTimeout(() => setCopiedGlobal(false), 2000); });
  }

  function exportAllData() {
    const clientMap = {};
    clients.forEach(c => { clientMap[c.id] = c.name; });
    const clientHeaders = ['ID','Name','Email','Plan','Active','Created At'];
    const clientRows = clients.map(c => [c.id, c.name || '', c.email || '', c.plan || '', c.active !== false ? 'Yes' : 'No', c.created_at || '']);
    const leadHeaders = ['ID','Client ID','Client Name','Customer Name','Email','Phone','Municipality','Estimated Price','Status','Language','Created At'];
    const leadRows = leads.map(l => [l.id, l.client_id || '', clientMap[l.client_id] || '', l.name || '', l.email || '', l.phone || '', l.municipality || '', l.estimated_price ?? '', l.status || '', l.language || '', l.created_at || '']);
    const PLAN_FEE_EX = PLAN_FEES;
    const PLAN_LIMIT_EX = { starter: Infinity, growth: 30, scale: 75 };
    const OVERAGE_RATE_EX = { starter: 0, growth: 25, scale: 18 };
    const now2 = new Date();
    const monthLeads = {};
    leads.forEach(l => {
      const d = new Date(l.created_at);
      if (d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear()) {
        monthLeads[l.client_id] = (monthLeads[l.client_id] || 0) + 1;
      }
    });
    const billingHeaders = ['Client Name','Plan','Monthly Fee','Leads This Month','Overage Count','Overage Charge','Total Due'];
    const billingRows = clients.map(c => {
      const plan = c.plan || 'starter';
      const fee  = PLAN_FEE_EX[plan] || 300;
      const limit = PLAN_LIMIT_EX[plan] ?? 30;
      const rate  = OVERAGE_RATE_EX[plan] ?? 25;
      const used  = monthLeads[c.id] || 0;
      const overage = limit === Infinity ? 0 : Math.max(0, used - limit);
      const overageCharge = overage * rate;
      return [c.name || '', plan, fee, used, overage, overageCharge, fee + overageCharge];
    });
    const toCSV = rows => rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const csv = `${toCSV([clientHeaders, ...clientRows])}\n\n${toCSV([leadHeaders, ...leadRows])}\n\n${toCSV([billingHeaders, ...billingRows])}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `quickquote360-full-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
  });

  const planBadge = {
    starter: { bg: '#dbeafe', color: '#1d4ed8' },
    growth:  { bg: '#ede9fe', color: '#7c3aed' },
    scale:   { bg: '#ecfccb', color: '#3f6212' },
  };

  const TH = { textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8', whiteSpace: 'nowrap' };
  const TD = { padding: '12px 16px', verticalAlign: 'middle', borderBottom: '1px solid #f4f6f4' };

  return (
    <Layout title="Super Admin">
      <div style={{ fontFamily: FONT }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Super Admin</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Full system control — QuickQuote360</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={exportAllData}
              style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
              ↓ Export All Data
            </button>
            <button type="button" onClick={handleRefresh}
              style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '10px 16px', fontSize: '13.5px', cursor: 'pointer', fontFamily: FONT }}>
              Refresh
            </button>
            <button type="button" onClick={() => setShowModal(true)}
              style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              + New Client
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af', fontSize: '14px' }}>Loading…</div>
        ) : (
          <>
            {/* ── ROW 1: KPI CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>

              {/* MRR */}
              <div style={CARD}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '22px', fontWeight: '800', color: LIME }}>$</div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly Revenue</p>
                <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>${mrr.toLocaleString()}</p>
                {mrrDiff > 0 && <p style={{ margin: 0, fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>↑ +${mrrDiff.toLocaleString()} vs last month</p>}
                {mrrDiff < 0 && <p style={{ margin: 0, fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>↓ −${Math.abs(mrrDiff).toLocaleString()} vs last month</p>}
                {mrrDiff === 0 && <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>— Same as last month</p>}
              </div>

              {/* Total Clients */}
              <div style={CARD}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#ecfccb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '20px', color: '#3f6212' }}>◎</div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Clients</p>
                <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{totalClients}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{activeClients} active · {totalClients - activeClients} inactive</p>
              </div>

              {/* Leads Today */}
              <div style={CARD}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '20px', color: '#1d4ed8' }}>▤</div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leads Today</p>
                <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{leadsToday}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{totalLeads} all time</p>
              </div>

              {/* New Signups Today */}
              <div style={CARD}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '20px', color: '#854d0e' }}>⊞</div>
                <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New Signups Today</p>
                <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{newToday}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Total accounts: {totalClients}</p>
              </div>
            </div>

            {/* ── ROW 2: CLIENT CONTROL TABLE ── */}
            <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Client Control Center</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '0 14px', height: '38px', backgroundColor: '#fff', width: '240px' }}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg>
                  <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13px', color: '#0d1117', width: '100%', fontFamily: FONT }} />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fbf9' }}>
                      {['Client','Plan','Trial','Revenue','Estimates Used','Usage Bar','Last Active','Status','Embed','Actions'].map(h => (
                        <th key={h} style={TH}>
                          {h === 'Revenue' ? (
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onMouseEnter={e => e.currentTarget.querySelector('[data-tip]').style.display = 'block'}
                              onMouseLeave={e => e.currentTarget.querySelector('[data-tip]').style.display = 'none'}>
                              {h}
                              <span data-tip style={{ display: 'none', position: 'absolute', top: 'calc(100% + 6px)', left: 0, backgroundColor: '#0d1117', color: '#fff', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 50, fontWeight: '400', textTransform: 'none', letterSpacing: 0, pointerEvents: 'none' }}>
                                Monthly subscription fee. Does not include overages.
                              </span>
                            </div>
                          ) : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>No clients found</td></tr>
                    ) : filteredClients.map(client => {
                      const isActive   = client.active !== false;
                      const pb         = planBadge[client.plan] || planBadge.starter;
                      const useCount   = leadCountPerClient[client.id] || 0;
                      const lastActive = lastActivePerClient[client.id];
                      const bg         = avatarBg(client.id);
                      return (
                        <tr key={client.id}
                          onMouseEnter={() => setHoveredRow(client.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{ backgroundColor: hoveredRow === client.id ? '#f9fbf9' : '#fff' }}>

                          {/* Client */}
                          <td style={TD}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                                {initials(client.name)}
                              </div>
                              <div>
                                <div style={{ fontWeight: '700', color: '#0d1117' }}>{client.name || '—'}</div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{client.email || '—'}</div>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td style={TD}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: pb.bg, color: pb.color }}>
                              {client.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) : 'Free'}
                            </span>
                          </td>

                          {/* Trial */}
                          <td style={TD}>
                            {client.plan === 'scale' && (() => {
                              const days = (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24);
                              if (days > 14) return null;
                              const left = Math.max(0, Math.ceil(14 - days));
                              return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', backgroundColor: '#fef9c3', color: '#854d0e' }}>Trial {left}d left</span>;
                            })()}
                          </td>

                          {/* Revenue */}
                          <td style={{ ...TD, fontWeight: '700', color: '#0d1117' }}>
                            ${(PLAN_FEES[client.plan] || PLAN_FEES.starter).toLocaleString()}/mo
                          </td>

                          {/* Estimates Used */}
                          <td style={{ ...TD, fontWeight: '700', color: '#0d1117' }}>{useCount} used</td>

                          {/* Usage Bar */}
                          <td style={TD}><UsageBar count={useCount} plan={client.plan} /></td>

                          {/* Last Active */}
                          <td style={{ ...TD, color: '#9ca3af', fontSize: '12px' }}>{daysAgo(lastActive)}</td>

                          {/* Status */}
                          <td style={TD}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: isActive ? '#dcfce7' : '#f3f4f6', color: isActive ? '#166534' : '#6b7280' }}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Embed */}
                          <td style={TD}>
                            <button type="button" onClick={() => copyEmbed(client.id)}
                              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: '600', borderRadius: '6px', border: '1px solid #e8ede8', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', backgroundColor: copiedId === client.id ? '#ecfccb' : '#fff', color: copiedId === client.id ? '#3f6212' : '#374151', transition: 'all 0.15s' }}>
                              {copiedId === client.id ? 'Copied!' : 'Copy Code'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td style={TD}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <SmallBtn label="View"    bg="#ecfccb" color="#3f6212" onClick={() => navigate(`/admin/clients/${client.id}`)} />
                              <SmallBtn label="Leads"   bg="#dbeafe" color="#1d4ed8" onClick={() => navigate(`/admin/leads?client=${client.id}`)} />
                              {isActive
                                ? <SmallBtn label="Deactivate" bg="#fee2e2" color="#dc2626" onClick={() => toggleActive(client.id, true)}  />
                                : <SmallBtn label="Activate"   bg="#dcfce7" color="#166534" onClick={() => toggleActive(client.id, false)} />
                              }
                              <div style={{ position: 'relative', display: 'inline-block' }}
                                onMouseEnter={e => { const t = e.currentTarget.querySelector('[data-tip]'); if (t) t.style.display = 'block'; }}
                                onMouseLeave={e => { const t = e.currentTarget.querySelector('[data-tip]'); if (t) t.style.display = 'none'; }}>
                                <SmallBtn label="Open Tool" bg="#f3f4f6" color="#374151" onClick={() => window.open(`https://estimator.quickquote360.com?clientId=${client.id}`, '_blank')} />
                                <div data-tip style={{ display: 'none', position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0d1117', color: '#fff', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none' }}>
                                  Opens estimator in new tab
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── ROW 3: Activity Feed + Plan Distribution ── */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'flex-start' }}>

              {/* Activity Feed */}
              <div style={{ ...CARD, flex: 1, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Activity Feed</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#ecfccb', fontSize: '11px', fontWeight: '600', color: '#3f6212' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: LIME, display: 'inline-block' }} />
                    Live
                  </span>
                </div>
                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  {events.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '13.5px', margin: 0 }}>No recent activity</p>
                  ) : (() => {
                    let lastLabel = null;
                    return events.map((ev, i) => {
                      const label      = getDateLabel(ev.date);
                      const showDiv    = label && label !== lastLabel;
                      if (label) lastLabel = label;
                      return (
                        <Fragment key={i}>
                          {showDiv && (
                            <div style={{ padding: '6px 24px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', backgroundColor: '#f9fbf9', borderTop: i > 0 ? '1px solid #f4f6f4' : 'none', borderBottom: '1px solid #f4f6f4' }}>
                              {label}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 24px', borderBottom: '1px solid #f4f6f4' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: ev.type === 'lead' ? LIME : DARK }} />
                            <span style={{ flex: 1, fontSize: '13px', color: '#0d1117' }}>
                              {ev.type === 'lead'
                                ? <><span style={{ color: '#9ca3af' }}>◉</span> New lead from <strong>{ev.name}</strong> via {ev.clientName}</>
                                : <><span style={{ color: '#9ca3af' }}>★</span> New client signed up: <strong>{ev.name}</strong></>
                              }
                            </span>
                            <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{timeAgo(ev.date.toISOString())}</span>
                          </div>
                        </Fragment>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Revenue by Plan */}
              <div style={{ ...CARD, width: '320px', flexShrink: 0 }}>
                <p style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Plan Distribution</p>

                {[
                  { label: 'Starter', count: starterCount, fill: LIME,    sub: `$${PLAN_FEES.starter}/mo each`  },
                  { label: 'Growth',  count: growthCount,  fill: PRIMARY, sub: `$${PLAN_FEES.growth}/mo each`   },
                  { label: 'Scale',   count: scaleCount,   fill: DARK,    sub: `$${PLAN_FEES.scale}/mo each`    },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117' }}>{row.label}</span>
                        <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#374151' }}>{row.count}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>{row.sub}</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '99px', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((row.count / maxPlan) * 100)}%`, height: '100%', backgroundColor: row.fill, borderRadius: '99px', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #e8ede8' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total MRR</p>
                  <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px' }}>${mrr.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* ── ROW 4: System Status + Quick Actions ── */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

              {/* System Status */}
              <div style={{ ...CARD, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>System Health</p>
                  <button type="button" onClick={checkHealth}
                    style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
                    Refresh
                  </button>
                </div>
                {[
                  { label: 'API Endpoint', key: 'api',       url: 'estimator-widget-production.up.railway.app' },
                  { label: 'Frontend',     key: 'frontend',  url: 'estimator.quickquote360.com'                },
                  { label: 'Dashboard',    key: 'dashboard', url: 'dashboard.quickquote360.com'                },
                ].map(row => {
                  const status = healthStatus[row.key];
                  const badge = status === 'up'
                    ? { bg: '#dcfce7', color: '#166534', dot: '#16a34a', label: 'Operational' }
                    : status === 'down'
                      ? { bg: '#fee2e2', color: '#991b1b', dot: '#dc2626', label: 'Down' }
                      : { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', label: 'Checking...' };
                  return (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: '1px solid #f4f6f4' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117', flex: '0 0 130px' }}>{row.label}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', backgroundColor: badge.bg, fontSize: '11px', fontWeight: '600', color: badge.color, flexShrink: 0 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: badge.dot, display: 'inline-block' }} />
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.url}</span>
                    </div>
                  );
                })}
                <p style={{ margin: '14px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                  {lastChecked ? `Last checked: ${lastChecked.toTimeString().slice(0, 8)}` : 'Last checked: —'}
                </p>
              </div>

              {/* Quick Actions */}
              <div style={{ ...CARD, width: '320px', flexShrink: 0 }}>
                <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Quick Actions</p>
                {[
                  { label: copiedGlobal ? '✓ Copied!' : 'Copy Global Embed Code', icon: '⊞', action: copyGlobalEmbed },
                  { label: 'View All Leads →',       icon: '',   action: () => navigate('/admin/leads') },
                  { label: 'Manage Billing →',       icon: '',   action: () => navigate('/admin/billing')  },
                  { label: 'Go to Settings →',       icon: '',   action: () => navigate('/admin/settings') },
                ].map((btn, i) => (
                  <QuickActionBtn key={i} label={btn.label} icon={btn.icon} onClick={btn.action} />
                ))}
              </div>
            </div>

            {/* ── ROW 5: System Alerts ── */}
            <div style={{ ...CARD, marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>System Alerts</p>
                {systemAlerts.filter(a => !dismissedAlerts.has(a.key)).length > 0 && (
                  <button type="button" onClick={() => setDismissedAlerts(new Set(systemAlerts.map(a => a.key)))}
                    style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: '500' }}>
                    Dismiss All
                  </button>
                )}
              </div>
              {systemAlerts.filter(a => !dismissedAlerts.has(a.key)).length === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>✓ No alerts — all systems normal</p>
              ) : systemAlerts.filter(a => !dismissedAlerts.has(a.key)).map(alert => (
                <div key={alert.key} style={{ borderLeft: `4px solid ${alert.borderColor}`, backgroundColor: '#fff', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px', fontSize: '13px', color: '#0d1117', fontFamily: FONT, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span>{alert.msg}</span>
                  <button type="button" onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.key]))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          </>
        )}

        {showModal && <AddClientModal onClose={() => setShowModal(false)} onSaved={fetchAll} />}
      </div>
    </Layout>
  );
}

function QuickActionBtn({ label, icon, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: FONT, backgroundColor: hov ? '#f4f6f4' : '#fff', color: '#0d1117', border: '1px solid #e8ede8', marginBottom: '8px', textAlign: 'left', transition: 'background-color 0.12s' }}>
      <span>{label}</span>
      {icon && <span style={{ color: '#9ca3af', fontSize: '16px' }}>{icon}</span>}
    </button>
  );
}
