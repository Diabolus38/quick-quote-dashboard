import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

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

const avatarPalette = [
  { bg: '#ecfccb', color: '#3f6212' },
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#fef9c3', color: '#854d0e' },
  { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#ccfbf1', color: '#0d9488' },
  { bg: '#fee2e2', color: '#991b1b' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#f3f4f6', color: '#374151' },
];

const PLAN_BADGE = {
  starter: { bg: '#dbeafe', color: '#1d4ed8' },
  growth:  { bg: '#ede9fe', color: '#7c3aed' },
  scale:   { bg: '#ecfccb', color: '#3f6212' },
};

function getInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(w => /[a-zA-ZäåöÄÅÖ]/.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function UsageBar({ count, plan }) {
  if (plan === 'scale') {
    return <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>∞ unlimited</span>;
  }
  const limit = plan === 'growth' ? 75 : 30;
  const pct   = Math.min(Math.round((count / limit) * 100), 100);
  const fill  = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : LIME;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '80px', height: '6px', borderRadius: '99px', backgroundColor: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: fill, borderRadius: '99px' }} />
      </div>
      <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', fontFamily: FONT }}>{count}/{limit}</span>
    </div>
  );
}

const INP = { width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px', fontSize: '13.5px', fontFamily: FONT, outline: 'none', color: '#0d1117', backgroundColor: '#fff' };
const LBL = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT };

function ClientModal({ title, initial, onClose, onSave }) {
  const [name,    setName]    = useState(initial?.name    || '');
  const [email,   setEmail]   = useState(initial?.email   || '');
  const [website, setWebsite] = useState(initial?.website_url || '');
  const [plan,    setPlan]    = useState(initial?.plan    || 'starter');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  async function handleSave() {
    if (!name.trim() || !email.trim()) { setErr('Company name and email are required.'); return; }
    setSaving(true); setErr('');
    const payload = { name: name.trim(), email: email.trim(), plan, website_url: website.trim() || null };
    const result = await onSave(payload);
    setSaving(false);
    if (result?.error) { setErr(result.error.message); }
    else { onClose(); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '36px', width: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: FONT, boxSizing: 'border-box' }}>
        <h2 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>{title}</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={LBL}>Company Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" style={INP} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={LBL}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@company.com" style={INP} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={LBL}>Website URL <span style={{ fontWeight: '400', color: '#9ca3af' }}>(optional)</span></label>
          <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" style={INP} />
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label style={LBL}>Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)} style={{ ...INP, cursor: 'pointer' }}>
            <option value="starter">Starter — $300/mo</option>
            <option value="growth">Growth — $600/mo</option>
            <option value="scale">Scale — $1,149/mo</option>
          </select>
        </div>

        {err && <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '12px', fontFamily: FONT }}>{err}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose}
            style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#0d1117', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', cursor: 'pointer', fontFamily: FONT, fontWeight: '500' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Client'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const navigate = useNavigate();

  const [clients,       setClients]       = useState([]);
  const [leadCounts,    setLeadCounts]    = useState({});
  const [lastLeadDates, setLastLeadDates] = useState({});
  const [loading,       setLoading]       = useState(true);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [showAdd,    setShowAdd]    = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [copiedId,   setCopiedId]   = useState(null);

  const [search,       setSearch]       = useState('');
  const [planFilter,   setPlanFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy,       setSortBy]       = useState('newest');
  const [currentPage,  setCurrentPage]  = useState(1);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [clientsRes, leadsRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('client_id, created_at'),
    ]);
    if (clientsRes.error) console.error('Failed to fetch clients:', clientsRes.error);
    if (leadsRes.error)   console.error('Failed to fetch leads:', leadsRes.error);
    const clientData = clientsRes.data;
    const leadsData  = leadsRes.data;
    setClients(clientData || []);
    const counts = {};
    const lastDates = {};
    (leadsData || []).forEach(l => {
      counts[l.client_id] = (counts[l.client_id] || 0) + 1;
      if (!lastDates[l.client_id] || l.created_at > lastDates[l.client_id]) lastDates[l.client_id] = l.created_at;
    });
    setLeadCounts(counts);
    setLastLeadDates(lastDates);
    setLoading(false);
  }

  async function handleAdd(payload) {
    const { data, error } = await supabase.from('clients').insert({ ...payload, active: true }).select('id').single();
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
      fetchAll();
    }
    return { error };
  }

  async function handleEdit(payload) {
    const result = await supabase.from('clients').update(payload).eq('id', editClient.id);
    if (!result.error) fetchAll();
    return result;
  }

  async function toggleActive(client) {
    await supabase.from('clients').update({ active: !client.active }).eq('id', client.id);
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, active: !c.active } : c));
  }

  function copyEmbed(clientId) {
    const code = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="${clientId}"></script>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const now          = new Date();
  const totalClients  = clients.length;
  const activeClients = clients.filter(c => c.active !== false).length;
  const newThisMonth  = clients.filter(c => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    const matchPlan   = planFilter === 'All' || (c.plan || 'starter').toLowerCase() === planFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || (statusFilter === 'Active' ? c.active !== false : c.active === false);
    return matchSearch && matchPlan && matchStatus;
  });

  useEffect(() => { setCurrentPage(1); }, [search, planFilter, statusFilter, sortBy]);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'oldest')    return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'name_az')   return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'most_leads') return (leadCounts[b.id] || 0) - (leadCounts[a.id] || 0);
    return new Date(b.created_at) - new Date(a.created_at); // newest
  });

  /* ── Pagination ── */
  const PAGE_SIZE        = 20;
  const totalPages       = Math.ceil(sorted.length / PAGE_SIZE);
  const paginatedClients = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const statCards = [
    { label: 'Total Clients',  value: totalClients,              bg: '#ecfccb', color: '#3f6212' },
    { label: 'Active',         value: activeClients,             bg: '#dcfce7', color: '#166534' },
    { label: 'Inactive',       value: totalClients - activeClients, bg: '#fee2e2', color: '#991b1b' },
    { label: 'New This Month', value: newThisMonth,              bg: '#fef9c3', color: '#854d0e' },
  ];

  if (loading) return (
    <Layout title="Clients">
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ borderRadius: '16px', background: '#f0f0f0', height: '120px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e8ede8', overflow: 'hidden', padding: '8px' }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ height: '60px', margin: '6px 0', borderRadius: '8px', background: '#f0f0f0', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout title="Clients">
      <div style={{ fontFamily: FONT }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Clients</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Manage all client accounts</p>
          </div>
          <button type="button" onClick={() => setShowAdd(true)}
            style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            + Add Client
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {statCards.map(card => (
            <div key={card.label} style={CARD}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '18px', color: card.color }}>◎</div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search + Filters ── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '0 14px', height: '42px', backgroundColor: '#fff' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
              style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13.5px', color: '#0d1117', width: '100%', fontFamily: FONT }} />
          </div>

          {/* Plan filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['All','Starter','Growth','Scale'].map(p => (
              <button key={p} type="button" onClick={() => setPlanFilter(p)}
                style={{ border: planFilter === p ? 'none' : '1px solid #e8ede8', backgroundColor: planFilter === p ? PRIMARY : '#fff', color: planFilter === p ? '#fff' : '#4b5563', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: planFilter === p ? '600' : '500', cursor: 'pointer', fontFamily: FONT }}>
                {p}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['All','Active','Inactive'].map(s => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                style={{ border: statusFilter === s ? 'none' : '1px solid #e8ede8', backgroundColor: statusFilter === s ? '#374151' : '#fff', color: statusFilter === s ? '#fff' : '#4b5563', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: statusFilter === s ? '600' : '500', cursor: 'pointer', fontFamily: FONT }}>
                {s}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ border: '1px solid #e8ede8', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', backgroundColor: '#fff', color: '#4b5563', cursor: 'pointer', height: '42px', outline: 'none', fontFamily: FONT }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_az">Name A–Z</option>
            <option value="most_leads">Most Leads</option>
          </select>
        </div>

        {/* ── Table ── */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                {['Client','Website','Plan','Usage','Last Lead','Status','Actions'].map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>No clients found.</td></tr>
              ) : paginatedClients.map((client, i) => {
                const av       = avatarPalette[i % avatarPalette.length];
                const pb       = PLAN_BADGE[client.plan] || PLAN_BADGE.starter;
                const isActive = client.active !== false;
                const count    = leadCounts[client.id] || 0;
                const isCopied = copiedId === client.id;
                const lastLeadRaw = lastLeadDates[client.id];
                const lastLeadStr = lastLeadRaw ? (() => { const d = new Date(lastLeadRaw); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })() : 'Never';

                return (
                  <tr key={client.id}
                    onMouseEnter={() => setHoveredRow(client.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ backgroundColor: hoveredRow === client.id ? '#f9faf9' : '#fff', borderBottom: '1px solid #f4f6f4' }}>

                    {/* Client */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, backgroundColor: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>
                          {getInitials(client.name || '')}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#0d1117' }}>{client.name}</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{client.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Website */}
                    <td style={{ padding: '14px 20px' }}>
                      {client.website_url ? (
                        <a href={client.website_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '13px', color: PRIMARY, fontWeight: '500', textDecoration: 'none', maxWidth: '180px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {client.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>

                    {/* Plan */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: pb.bg, color: pb.color }}>
                        {client.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) : 'Starter'}
                      </span>
                    </td>

                    {/* Usage */}
                    <td style={{ padding: '14px 20px' }}>
                      {client.plan === 'scale' ? (
                        <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>∞ unlimited</span>
                      ) : (() => {
                        const limit = client.plan === 'growth' ? 75 : 30;
                        const pct   = Math.min(Math.round((count / limit) * 100), 100);
                        const fill  = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : LIME;
                        return (
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#0d1117', fontFamily: FONT, display: 'block', marginBottom: '5px' }}>{count}/{limit}</span>
                            <div style={{ width: '80px', height: '6px', borderRadius: '99px', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: fill, borderRadius: '99px' }} />
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Last Lead */}
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: lastLeadRaw ? '#0d1117' : '#9ca3af', whiteSpace: 'nowrap' }}>{lastLeadStr}</td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: isActive ? '#dcfce7' : '#f3f4f6', color: isActive ? '#166534' : '#6b7280' }}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'nowrap' }}>
                        <button type="button" onClick={() => navigate(`/admin/clients/${client.id}`)}
                          style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '600', backgroundColor: '#ecfccb', color: '#3f6212', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT }}>
                          View
                        </button>
                        <button type="button" onClick={() => setEditClient(client)}
                          style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '500', backgroundColor: '#f4f6f4', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => copyEmbed(client.id)}
                          style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '500', backgroundColor: isCopied ? '#ecfccb' : '#f4f6f4', color: isCopied ? '#3f6212' : '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s' }}>
                          {isCopied ? 'Copied!' : 'Copy Embed'}
                        </button>
                        <button type="button" onClick={() => toggleActive(client)}
                          style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '500', backgroundColor: isActive ? '#fee2e2' : '#dcfce7', color: isActive ? '#dc2626' : '#166534', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT }}>
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {sorted.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT }}>
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} clients
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: currentPage === 1 ? 0.4 : 1 }}>
                Previous
              </button>
              <button type="button" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0}
                style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', borderRadius: '8px', padding: '7px 16px', fontSize: '13px', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1 }}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* ── Add Client Modal ── */}
        {showAdd && (
          <ClientModal
            title="Add New Client"
            initial={null}
            onClose={() => setShowAdd(false)}
            onSave={handleAdd}
          />
        )}

        {/* ── Edit Client Modal ── */}
        {editClient && (
          <ClientModal
            title="Edit Client"
            initial={editClient}
            onClose={() => setEditClient(null)}
            onSave={handleEdit}
          />
        )}

      </div>
    </Layout>
  );
}
