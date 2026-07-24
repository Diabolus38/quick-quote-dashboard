import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../ClientLayout';
import TrialExpiredOverlay from '../../components/TrialExpiredOverlay';
import useClientPlan from '../../hooks/useClientPlan';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const STATUS_COLORS = {
  'New':          '#1d4ed8',
  'Contacted':    '#d97706',
  'In Progress':  '#7c3aed',
  'Closed Won':   '#16a34a',
  'Closed Lost':  '#dc2626',
};

const STATUS_BADGE = {
  'New':          { bg: '#dbeafe', color: '#1d4ed8' },
  'Contacted':    { bg: '#fef9c3', color: '#854d0e' },
  'In Progress':  { bg: '#ede9fe', color: '#7c3aed' },
  'Closed Won':   { bg: '#dcfce7', color: '#166534' },
  'Closed Lost':  { bg: '#fee2e2', color: '#991b1b' },
};

const FILTER_OPTIONS = ['All', 'New', 'Contacted', 'In Progress', 'Closed Won', 'Closed Lost'];
const COLUMNS = ['Date', 'Name', 'Email', 'Phone', 'Municipality', 'System Type', 'Estimated Price', 'Status', 'Lead Quality', 'Actions'];

function getLeadScore(lead) {
  const a = lead.answers || {};
  let s = 0;
  if (a.projectType === 'new_installation') s += 2;
  if (['wc_bdt', 'wc'].includes(a.wastewaterType)) s += 2;
  if (Number(a.households) >= 2) s += 1;
  if (a.existingSystem === 'no' || a.existingSystem === 'none') s += 1;
  if (lead.company) s += 1;
  if (lead.phone) s += 1;
  if (Number(lead.estimated_price) > 100000) s += 2;
  else if (Number(lead.estimated_price) > 50000) s += 1;
  return s;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px' };

export default function Leads() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { plan } = useClientPlan();

  const [leads,        setLeads]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [custTypeFilter, setCustTypeFilter] = useState('All');
  const [hoveredRow,   setHoveredRow]   = useState(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [showToast,    setShowToast]    = useState(false);
  const [csvLockMsg,   setCsvLockMsg]   = useState(false);
  const [trialExpired,      setTrialExpired]      = useState(false);
  const [planEmailSent,     setPlanEmailSent]     = useState(false);
  const [installPreference, setInstallPreference] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dnd, setDnd] = useState(() => { try { return JSON.parse(localStorage.getItem(`qq360_dnd_${profile?.id || 'anon'}`) || 'false'); } catch { return false; } });
  const [showColPicker, setShowColPicker] = useState(false);
  const [focusedLeadId, setFocusedLeadId] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [hoveredDay, setHoveredDay] = useState(null);
  const [heatmapRange, setHeatmapRange] = useState('7days');

  useEffect(() => {
    if (!profile?.client_id) return;
    supabase.from('clients').select('plan, created_at, install_preference').eq('id', profile.client_id).maybeSingle()
      .then(({ data }) => { setInstallPreference(data?.install_preference || null); if (data?.plan === 'free_trial' && (Date.now() - new Date(data.created_at).getTime()) / 86400000 > 14) setTrialExpired(true); });
  }, [profile?.client_id]);

  async function sendPlanEmail(planName) {
    await fetch('https://estimator-widget-production.up.railway.app/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'team@quickquote360.com', subject: `Plan Upgrade Request: ${planName}`, body: `${profile?.full_name || 'A client'} (${profile?.email || ''}) requested the ${planName} plan. Client ID: ${profile?.client_id}.` }) }).catch(() => {});
    setPlanEmailSent(true);
  }

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const play = (freq, startTime) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        osc.start(startTime); osc.stop(startTime + 0.1);
      };
      play(520, ctx.currentTime); play(660, ctx.currentTime + 0.15);
    } catch {}
  }
  const DEFAULT_VIS_ARR = ['Date','Name','Email','Municipality','Estimated Price','Status','Lead Quality','Actions'];
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem(`qq360_client_leads_columns_${profile?.id || 'anon'}`);
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(DEFAULT_VIS_ARR);
  });

  useEffect(() => {
    function onClick(e) { if (!e.target.closest('[data-leads-col-picker]')) setShowColPicker(false); }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!profile?.client_id) return;
    fetchLeads();

    const channel = supabase
      .channel(`leads-page-${profile.client_id}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `client_id=eq.${profile.client_id}` }, payload => {
        setLeads(prev => [payload.new, ...prev]);
        if (!dnd) { setShowToast(true); setTimeout(() => setShowToast(false), 4000); }
        if (soundEnabled && !dnd) playChime();
      })
      .subscribe((status) => { if (status === 'CHANNEL_ERROR') { console.warn('Leads realtime channel error - will retry'); } });

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  useEffect(() => { setCurrentPage(1); }, [search, activeFilter, sortBy, custTypeFilter]);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads').select('id, client_id, created_at, name, email, phone, company, municipality, answers, estimated_price, status, pdf_url, language, notes, org_number, marketing_consent, customer_address, customer_type').eq('client_id', profile.client_id).order('created_at', { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  }

  async function updateStatus(leadId, newStatus) {
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  }

  async function handleDeleteLead(leadId) {
    if (!window.confirm('Delete this lead? This cannot be undone.')) return;
    await supabase.from('leads').delete().eq('id', leadId);
    setLeads(prev => prev.filter(l => l.id !== leadId));
  }

  function handleExportCSV() {
    if (plan === 'starter') {
      setCsvLockMsg(true);
      setTimeout(() => setCsvLockMsg(false), 3000);
      return;
    }
    if (leads.length === 0) return;
    const headers = ['Date','Name','Email','Phone','Municipality','System Type','Estimated Price','Status'];
    const rows = leads.map(l => [formatDate(l.created_at), l.name||'', l.email||'', l.phone||'', l.municipality||'', l.answers?.wastewaterType||'', l.estimated_price??'', l.status||'']);
    const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'leads.csv'; a.click();
  }

  const now = new Date();
  const thisMonthCount = leads.filter(l => { const d = new Date(l.created_at); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).length;
  const avgPrice = leads.length > 0 ? Math.round(leads.reduce((s,l)=>s+(Number(l.estimated_price)||0),0)/leads.length) : null;

  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q||(l.name||'').toLowerCase().includes(q)||(l.email||'').toLowerCase().includes(q)||(l.phone||'').toLowerCase().includes(q)||(l.municipality||'').toLowerCase().includes(q)||(l.company||'').toLowerCase().includes(q)||(l.answers?.wastewaterType||'').toLowerCase().includes(q);
    const matchFilter = activeFilter==='All'||l.status===activeFilter;
    const matchCustType = custTypeFilter==='All' || (custTypeFilter==='Business' ? l.customer_type==='business' : (l.customer_type==='private'||!l.customer_type));
    return matchSearch && matchFilter && matchCustType;
  });

  const sortedLeads = sortBy === 'highest_price'
    ? [...filteredLeads].sort((a, b) => (Number(b.estimated_price) || 0) - (Number(a.estimated_price) || 0))
    : sortBy === 'lowest_price'
    ? [...filteredLeads].sort((a, b) => (Number(a.estimated_price) || 0) - (Number(b.estimated_price) || 0))
    : sortBy === 'hottest'
    ? [...filteredLeads].sort((a, b) => getLeadScore(b) - getLeadScore(a))
    : sortBy === 'coldest'
    ? [...filteredLeads].sort((a, b) => getLeadScore(a) - getLeadScore(b))
    : filteredLeads;

  const [pageSize, setPageSize] = useState(() => { const s = localStorage.getItem(`qq360_leads_page_size_${profile?.id || 'anon'}`); return s ? Number(s) : 25; });
  const PAGE_SIZE = pageSize;
  const totalPages = Math.ceil(sortedLeads.length / PAGE_SIZE);
  const paginatedLeads = sortedLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const wonLeads = leads.filter(l => l.status === 'Closed Won').length;
  const conversionRate = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;
  const totalValue = leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0);
  const weekStart = (() => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d; })();
  const leadsThisWeek = leads.filter(l => new Date(l.created_at) >= weekStart).length;
  const nonNewLeads = leads.filter(l => (l.status || 'New') !== 'New');
  const avgResponseTime = nonNewLeads.length > 0
    ? Math.round(nonNewLeads.reduce((s, l) => s + (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24), 0) / nonNewLeads.length)
    : null;

  const statCards = [
    { label: 'Total Leads',        value: loading ? '—' : String(leads.length),    color: '#ecfccb', textColor: '#3f6212',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { label: 'This Month',         value: loading ? '—' : String(thisMonthCount),  color: '#dbeafe', textColor: '#1d4ed8',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { label: 'Conversion Rate',    value: `${conversionRate}%`,                     color: '#dcfce7', textColor: '#166534',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
    { label: 'Avg Estimate Value', value: loading ? '—' : avgPrice ? `${avgPrice.toLocaleString('sv-SE')} kr` : '—', color: '#fef9c3', textColor: '#854d0e',
      svg: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  ];

  return (
    <ClientLayout title="Leads">
      <TrialExpiredOverlay trialExpired={trialExpired} planEmailSent={planEmailSent} sendPlanEmail={sendPlanEmail} clientId={profile?.client_id} installPreference={installPreference} />
      {showToast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, backgroundColor: '#0d1f12', color: '#fff', borderRadius: '12px', padding: '14px 20px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          New lead just came in!
        </div>
      )}
      <div style={{ fontFamily: FONT, overflow: 'hidden' }}>

        {/* DND Banner */}
        {dnd && (
          <div style={{ backgroundColor: '#fef9c3', color: '#854d0e', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: FONT }}>
            <span>🌙</span>
            <span style={{ flex: 1 }}>Do Not Disturb is on. Lead notifications are muted.</span>
            <button type="button" onClick={() => { setDnd(false); localStorage.setItem(`qq360_dnd_${profile?.id || 'anon'}`, 'false'); }}
              style={{ background: 'none', border: '1px solid #d97706', color: '#854d0e', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              Turn off
            </button>
          </div>
        )}

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Leads</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>All leads generated by your estimator tool.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }} data-leads-col-picker>
            <button type="button" onClick={e => { e.stopPropagation(); setShowColPicker(p => !p); }}
              style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '10px 16px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
              ⊞ Columns
            </button>
            {showColPicker && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, backgroundColor: '#fff', border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minWidth: '200px' }}>
                {COLUMNS.map(col => (
                  <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: '#374151', fontFamily: FONT }}>
                    <input type="checkbox" checked={visibleCols.has(col)} onChange={() => setVisibleCols(prev => { const next = new Set(prev); next.has(col) ? next.delete(col) : next.add(col); localStorage.setItem(`qq360_client_leads_columns_${profile?.id || 'anon'}`, JSON.stringify([...next])); return next; })} style={{ cursor: 'pointer' }} />
                    {col}
                  </label>
                ))}
                <button type="button" onClick={() => { const d = new Set(DEFAULT_VIS_ARR); setVisibleCols(d); localStorage.setItem(`qq360_client_leads_columns_${profile?.id || 'anon'}`, JSON.stringify([...d])); }}
                  style={{ background: 'none', border: 'none', borderTop: '1px solid #f4f6f4', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', padding: '8px 16px', width: '100%', textAlign: 'left', marginTop: '4px', fontFamily: FONT }}>
                  Reset to defaults
                </button>
              </div>
            )}
          </div>
          <button type="button" onClick={handleExportCSV} style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: plan === 'starter' ? '#9ca3af' : '#0d1117', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
            {plan === 'starter' ? '🔒 Export CSV' : 'Export CSV'}
          </button>
          {csvLockMsg && <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px', alignSelf: 'center' }}>Upgrade to Scale to export CSV.</span>}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(card => (
            <div key={card.label} style={CARD}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.color, color: card.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                {card.svg}
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div style={{ ...CARD, marginBottom: '16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>
            {heatmapRange === '7days' ? 'Last 7 Days' : heatmapRange === '30days' ? 'Last 30 Days' : (() => { const [hy, hm] = heatmapRange.split('-').map(Number); return new Date(hy, hm - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' }); })()}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {[{ key: '7days', label: '7 Days' }, { key: '30days', label: '30 Days' }, ...Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (i + 1)); return { key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: d.toLocaleString('default', { month: 'short', year: 'numeric' }) }; })].map(pill => (
              <button key={pill.key} type="button" onClick={() => setHeatmapRange(pill.key)}
                style={{ border: heatmapRange === pill.key ? 'none' : '1px solid #e8ede8', backgroundColor: heatmapRange === pill.key ? PRIMARY : '#fff', color: heatmapRange === pill.key ? '#fff' : '#4b5563', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                {pill.label}
              </button>
            ))}
          </div>
          {(() => {
            const getDayData = (d) => {
              const count = leads.filter(l => { const ld = new Date(l.created_at); ld.setHours(0,0,0,0); return ld.getTime() === d.getTime(); }).length;
              const bg = count === 0 ? '#f3f4f6' : count <= 2 ? '#bbf7d0' : count <= 5 ? '#4ade80' : '#166534';
              const color = count >= 3 ? '#fff' : '#374151';
              return { count, bg, color };
            };
            const tooltip = (dKey, count, label) => hoveredDay === dKey ? (
              <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0d1117', color: '#fff', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', whiteSpace: 'nowrap', zIndex: 10, marginBottom: '4px', pointerEvents: 'none', textAlign: 'center' }}>
                <div style={{ fontWeight: '600' }}>{label}</div>
                <div style={{ opacity: 0.75 }}>{count === 0 ? 'No leads' : `${count} lead${count !== 1 ? 's' : ''}`}</div>
              </div>
            ) : null;
            if (heatmapRange === '7days') {
              return (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - (6 - i)); return d; }).map(d => {
                    const dKey = d.toDateString(); const { count, bg, color } = getDayData(d);
                    return (
                      <div key={dKey} style={{ flex: 1, height: '64px', borderRadius: '10px', backgroundColor: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', position: 'relative', cursor: 'default' }}
                        onMouseEnter={() => setHoveredDay(dKey)} onMouseLeave={() => setHoveredDay(null)}>
                        <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color }}>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                        <span style={{ fontSize: '18px', fontWeight: '800', color }}>{count}</span>
                        {tooltip(dKey, count, d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }))}
                      </div>
                    );
                  })}
                </div>
              );
            }
            let days = [];
            let chunkSize = 6;
            if (heatmapRange === '30days') {
              days = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - (29 - i)); return d; });
            } else {
              const [hy, hm] = heatmapRange.split('-').map(Number);
              days = Array.from({ length: new Date(hy, hm, 0).getDate() }, (_, i) => new Date(hy, hm - 1, i + 1));
              chunkSize = 7;
            }
            const rows = [];
            for (let i = 0; i < days.length; i += chunkSize) rows.push(days.slice(i, i + chunkSize));
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {rows.map((row, ri) => (
                  <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#9ca3af', width: '36px', textAlign: 'right', flexShrink: 0, fontFamily: FONT }}>{row[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <div style={{ display: 'flex', flex: 1, gap: '4px' }}>
                      {row.map(d => { const dKey = d.toDateString(); const { count, bg, color } = getDayData(d); return (
                        <div key={dKey} style={{ flex: 1, height: '48px', borderRadius: '8px', backgroundColor: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', position: 'relative', cursor: 'default', minWidth: '24px' }}
                          onMouseEnter={() => setHoveredDay(dKey)} onMouseLeave={() => setHoveredDay(null)}>
                          <span style={{ fontSize: '9px', fontWeight: '600', color }}>{d.getDate()}</span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color }}>{count}</span>
                          {tooltip(dKey, count, d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))}
                        </div>
                      ); })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '0 14px', height: '42px', backgroundColor: '#fff' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg>
            <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13.5px', color: '#0d1117', width: '100%', fontFamily: FONT }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FILTER_OPTIONS.map(opt => (
              <button key={opt} type="button" onClick={() => setActiveFilter(opt)} style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '8px', border: activeFilter===opt ? 'none' : '1px solid #e8ede8', backgroundColor: activeFilter===opt ? PRIMARY : '#fff', color: activeFilter===opt ? '#fff' : '#4b5563', cursor: 'pointer', fontFamily: FONT, fontWeight: activeFilter===opt ? '600' : '400' }}>
                {opt}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['All', 'Private', 'Business'].map(opt => (
              <button key={opt} type="button" onClick={() => setCustTypeFilter(opt)}
                style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '20px', border: custTypeFilter===opt ? 'none' : '1px solid #e8ede8', backgroundColor: custTypeFilter===opt ? PRIMARY : '#fff', color: custTypeFilter===opt ? '#fff' : '#4b5563', cursor: 'pointer', fontFamily: FONT, fontWeight: custTypeFilter===opt ? '600' : '400' }}>
                {opt}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ border: '1px solid #e8ede8', borderRadius: '8px', padding: '7px 12px', fontSize: '12.5px', backgroundColor: '#fff', color: '#4b5563', cursor: 'pointer', fontFamily: FONT, outline: 'none', height: '36px' }}>
            <option value="newest">Newest First</option>
            <option value="highest_price">Highest Price</option>
            <option value="lowest_price">Lowest Price</option>
            <option value="hottest">Hottest First</option>
            <option value="coldest">Coldest First</option>
          </select>
        </div>

        {/* Summary Bar */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap', fontFamily: FONT }}>
          {[
            { label: 'Total Estimated Value', value: loading ? '—' : `${totalValue.toLocaleString('sv-SE')} kr` },
            { label: 'Number of Leads',       value: loading ? '—' : String(leads.length) },
            { label: 'Average Estimate',      value: loading ? '—' : avgPrice ? `${avgPrice.toLocaleString('sv-SE')} kr` : '—' },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>{stat.label}</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{stat.value}</p>
              </div>
              {i < arr.length - 1 && <div style={{ width: '1px', height: '32px', backgroundColor: '#e8ede8', flexShrink: 0 }} />}
            </div>
          ))}
        </div>

        {/* Table */}
        {(() => {
          const COL_WIDTHS = { 'Date': '100px', 'Name': '130px', 'Email': '180px', 'Phone': '120px', 'Municipality': '130px', 'System Type': '130px', 'Estimated Price': '140px', 'Status': '150px', 'Lead Quality': '110px', 'Actions': '80px' };
          const visCols = COLUMNS.filter(c => visibleCols.has(c));
          const gridTpl = visCols.map(c => COL_WIDTHS[c] || '120px').join(' ');
          return (
            <div style={{ ...CARD, padding: 0, overflowX: 'auto' }}
              onKeyDown={e => {
                if (!['ArrowDown','ArrowUp','Enter'].includes(e.key)) return;
                e.preventDefault();
                const idx = paginatedLeads.findIndex(l => l.id === focusedLeadId);
                if (e.key === 'ArrowDown') setFocusedLeadId(paginatedLeads[Math.min(idx + 1, paginatedLeads.length - 1)]?.id ?? paginatedLeads[0]?.id);
                else if (e.key === 'ArrowUp') setFocusedLeadId(paginatedLeads[Math.max(idx - 1, 0)]?.id);
                else if (e.key === 'Enter' && focusedLeadId) navigate(`/client/leads/${focusedLeadId}`);
              }}>
              <div style={{ display: 'grid', gridTemplateColumns: gridTpl, backgroundColor: '#f9fbf9', borderBottom: '1px solid #e8ede8', padding: '12px 20px' }}>
                {visCols.map(col => <span key={col} style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</span>)}
              </div>
              {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>Loading leads…</div>
              ) : filteredLeads.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>
                  {leads.length === 0 ? 'No leads yet. Your leads will appear here once customers use your estimator tool.' : 'No leads match your filter.'}
                </div>
              ) : (
                paginatedLeads.map(lead => {
                  const sb = STATUS_BADGE[lead.status] || { bg: '#f3f4f6', color: '#6b7280' };
                  return (
                    <div key={lead.id}
                      tabIndex={0}
                      onFocus={() => setFocusedLeadId(lead.id)}
                      onMouseEnter={() => setHoveredRow(lead.id)} onMouseLeave={() => setHoveredRow(null)}
                      style={{ display: 'grid', gridTemplateColumns: gridTpl, padding: '12px 20px', fontSize: '13.5px', color: '#4b5563', borderBottom: '1px solid #f4f6f4', backgroundColor: hoveredRow===lead.id ? '#f9fbf9' : '#fff', alignItems: 'center', outline: focusedLeadId === lead.id ? '2px solid #166534' : 'none', outlineOffset: '-2px' }}>
                      {visibleCols.has('Date') && <span style={{ color: '#9ca3af', fontSize: '12px' }}>{formatDate(lead.created_at)}</span>}
                      {visibleCols.has('Name') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '600', color: '#0d1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name||'—'}</span>
                          <span style={{ backgroundColor: lead.customer_type==='business' ? '#f3f4f6' : '#f0fdf4', color: lead.customer_type==='business' ? '#374151' : '#166534', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {lead.customer_type==='business' ? '🏢 Business' : '🏠 Private'}
                          </span>
                        </div>
                      )}
                      {visibleCols.has('Email') && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#4b5563' }}>{lead.email||'—'}</span>}
                      {visibleCols.has('Phone') && <span>{lead.phone||'—'}</span>}
                      {visibleCols.has('Municipality') && <span>{lead.municipality||'—'}</span>}
                      {visibleCols.has('System Type') && <span>{lead.answers?.wastewaterType||'—'}</span>}
                      {visibleCols.has('Estimated Price') && (Number(lead.estimated_price) > 0
                        ? <span style={{ backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '700', display: 'inline-block', whiteSpace: 'nowrap' }}>{Number(lead.estimated_price).toLocaleString('sv-SE')} kr</span>
                        : <span style={{ color: '#9ca3af', fontSize: '12px' }}>No estimate</span>
                      )}
                      {visibleCols.has('Status') && <span><select value={lead.status||'New'} onChange={e=>updateStatus(lead.id,e.target.value)} style={{ border: '1px solid #e8ede8', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontWeight: '600', color: STATUS_COLORS[lead.status]||'#374151', backgroundColor: '#fff', cursor: 'pointer', outline: 'none', fontFamily: FONT }}>{['New','Contacted','In Progress','Closed Won','Closed Lost'].map(s=><option key={s} value={s}>{s}</option>)}</select></span>}
                      {visibleCols.has('Lead Quality') && (() => { const sc = getLeadScore(lead); const q = sc >= 7 ? { label: 'Hot', bg: '#fee2e2', color: '#dc2626' } : sc >= 4 ? { label: 'Warm', bg: '#fef9c3', color: '#d97706' } : { label: 'Cold', bg: '#f3f4f6', color: '#6b7280' }; return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: q.bg, color: q.color }}>{q.label}</span>; })()}
                      {visibleCols.has('Actions') && <span style={{ display: 'flex', gap: '6px' }}><button type="button" onClick={()=>navigate(`/client/leads/${lead.id}`)} style={{ fontSize: '12px', color: PRIMARY, backgroundColor: '#ecfccb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', padding: '4px 10px', fontFamily: FONT }}>View</button><button type="button" onClick={()=>handleDeleteLead(lead.id)} style={{ fontSize: '12px', color: '#dc2626', backgroundColor: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', padding: '4px 10px', fontFamily: FONT }}>Delete</button></span>}
                    </div>
                  );
                })
              )}
            </div>
          );
        })()}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select value={pageSize} onChange={e => { const n = Number(e.target.value); setPageSize(n); localStorage.setItem(`qq360_leads_page_size_${profile?.id || 'anon'}`, n); setCurrentPage(1); }}
                style={{ border: '1px solid #e8ede8', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontFamily: FONT, outline: 'none', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}>
                {[10,25,50,100].map(n => <option key={n} value={n}>{n} per page</option>)}
              </select>
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length} leads
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, fontFamily: FONT }}>
                Previous
              </button>
              <button type="button" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, fontFamily: FONT }}>
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </ClientLayout>
  );
}
