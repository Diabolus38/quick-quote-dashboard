import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';

const FONT    = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e8ede8',
  boxShadow: '0 2px 12px rgba(13,31,18,0.06)',
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

const STATUS_COLORS = {
  new:          { bg: '#dbeafe', color: '#1d4ed8', label: 'New'          },
  contacted:    { bg: '#fef9c3', color: '#854d0e', label: 'Contacted'    },
  in_progress:  { bg: '#ede9fe', color: '#7c3aed', label: 'In Progress'  },
  closed_won:   { bg: '#dcfce7', color: '#166534', label: 'Closed Won'   },
  closed_lost:  { bg: '#fee2e2', color: '#991b1b', label: 'Closed Lost'  },
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function exportCSV(leads, clientMap) {
  const headers = ['Date','Client','Customer Name','Email','Phone','Municipality','System Type','Price','Status'];
  const rows = leads.map(l => [
    formatDate(l.created_at),
    clientMap[l.client_id]?.name || '—',
    l.name || '—',
    l.email || '—',
    l.phone || '—',
    l.municipality || '—',
    l.answers?.wastewaterType || '—',
    l.estimated_price != null ? l.estimated_price : '—',
    l.status || 'new',
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `quickquote360-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function AllLeads() {
  const navigate = useNavigate();
  const location = useLocation();

  const [leads,    setLeads]    = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [hovRow,   setHovRow]   = useState(null);

  const [search,        setSearch]        = useState('');
  const [clientFilter,  setClientFilter]  = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('client') || 'all';
  });
  const [statusFilter,  setStatusFilter]  = useState('All');
  const [dateFilter,    setDateFilter]    = useState('All Time');

  useEffect(() => {
    async function fetchData() {
      const [leadsRes, clientsRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, name, plan').order('name'),
      ]);
      setLeads(leadsRes.data   || []);
      setClients(clientsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  async function updateStatus(leadId, newStatus) {
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  }

  /* ── Client map ── */
  const clientMap = {};
  clients.forEach((c, i) => { clientMap[c.id] = { name: c.name, paletteIdx: i % avatarPalette.length }; });

  /* ── Filtered leads ── */
  const weekStart  = startOfWeek();
  const monthStart = startOfMonth();

  const filtered = leads.filter(l => {
    const q            = search.toLowerCase();
    const matchSearch  = !q || (l.name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q);
    const matchClient  = clientFilter === 'all' || l.client_id === clientFilter;
    const rawStatus    = (l.status || 'new').toLowerCase().replace(/\s+/g, '_');
    const matchStatus  = statusFilter === 'All' || rawStatus === statusFilter.toLowerCase().replace(/\s+/g, '_');
    const created      = new Date(l.created_at);
    const matchDate    = dateFilter === 'All Time' || (dateFilter === 'This Week' && created >= weekStart) || (dateFilter === 'This Month' && created >= monthStart);
    return matchSearch && matchClient && matchStatus && matchDate;
  });

  /* ── Stats ── */
  const now        = new Date();
  const todayStr   = now.toDateString();
  const totalLeads = leads.length;
  const today      = leads.filter(l => new Date(l.created_at).toDateString() === todayStr).length;
  const thisMonth  = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const avgValue = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0) / leads.filter(l => l.estimated_price).length || 0)
    : 0;

  const statCards = [
    { label: 'Total Leads',  value: totalLeads, bg: '#ecfccb', color: '#3f6212' },
    { label: 'Today',        value: today,       bg: '#dbeafe', color: '#1d4ed8' },
    { label: 'This Month',   value: thisMonth,   bg: '#ede9fe', color: '#7c3aed' },
    { label: 'Avg Value',    value: avgValue > 0 ? `$${avgValue.toLocaleString()}` : '—', bg: '#fef9c3', color: '#854d0e' },
  ];

  if (loading) return (
    <Layout title="All Leads">
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
    <Layout title="All Leads">
      <div style={{ fontFamily: FONT }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>All Leads</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Every lead generated across all client accounts</p>
          </div>
          <button type="button" onClick={() => exportCSV(filtered, clientMap)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            ↓ Export CSV
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {statCards.map(card => (
            <div key={card.label} style={CARD}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '18px', color: card.color }}>▤</div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── Search + Filters ── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '0 14px', height: '42px', backgroundColor: '#fff' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
              style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13.5px', color: '#0d1117', width: '100%', fontFamily: FONT }} />
          </div>

          {/* Client dropdown */}
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            style={{ border: '1px solid #e8ede8', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', backgroundColor: '#fff', color: '#4b5563', cursor: 'pointer', fontFamily: FONT, height: '42px', outline: 'none' }}>
            <option value="all">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['All','New','Contacted','In Progress','Closed Won','Closed Lost'].map(s => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                style={{ border: statusFilter === s ? 'none' : '1px solid #e8ede8', backgroundColor: statusFilter === s ? PRIMARY : '#fff', color: statusFilter === s ? '#fff' : '#4b5563', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px', fontWeight: statusFilter === s ? '600' : '500', cursor: 'pointer', fontFamily: FONT }}>
                {s}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['This Week','This Month','All Time'].map(d => (
              <button key={d} type="button" onClick={() => setDateFilter(d)}
                style={{ border: dateFilter === d ? 'none' : '1px solid #e8ede8', backgroundColor: dateFilter === d ? '#374151' : '#fff', color: dateFilter === d ? '#fff' : '#4b5563', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px', fontWeight: dateFilter === d ? '600' : '500', cursor: 'pointer', fontFamily: FONT }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>
              No leads yet across any client accounts
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    {['Date','Client','Customer Name','Email','Phone','Municipality','System Type','Price','Status','Actions'].map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead, i) => {
                    const clientEntry = clientMap[lead.client_id];
                    const clientName  = clientEntry?.name || '—';
                    const av          = clientEntry ? avatarPalette[clientEntry.paletteIdx] : { bg: '#f3f4f6', color: '#374151' };
                    const rawStatus   = (lead.status || 'new').toLowerCase().replace(/\s+/g, '_');
                    const sc          = STATUS_COLORS[rawStatus] || { bg: '#f3f4f6', color: '#6b7280', label: lead.status || 'New' };

                    return (
                      <tr key={lead.id || i}
                        onMouseEnter={() => setHovRow(lead.id)}
                        onMouseLeave={() => setHovRow(null)}
                        style={{ backgroundColor: hovRow === lead.id ? '#f9faf9' : '#fff', borderBottom: '1px solid #f4f6f4' }}>

                        <td style={{ padding: '12px 16px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{formatDate(lead.created_at)}</td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>
                              {getInitials(clientName)}
                            </div>
                            <span style={{ fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>{clientName}</span>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>{lead.name || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#4b5563' }}>{lead.email || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>{lead.phone || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>{lead.municipality || '—'}</td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>{lead.answers?.wastewaterType || '—'}</td>

                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>
                          {lead.estimated_price != null ? `$${Number(lead.estimated_price).toLocaleString()}` : '—'}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <select value={rawStatus} onChange={e => updateStatus(lead.id, e.target.value)}
                            style={{ border: '1px solid #e8ede8', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', backgroundColor: sc.bg, color: sc.color, fontWeight: '600', cursor: 'pointer', fontFamily: FONT, outline: 'none' }}>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="in_progress">In Progress</option>
                            <option value="closed_won">Closed Won</option>
                            <option value="closed_lost">Closed Lost</option>
                          </select>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <button type="button" onClick={() => navigate(`/admin/leads/${lead.id}`)}
                            style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '600', backgroundColor: '#ecfccb', color: '#3f6212', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT }}>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
