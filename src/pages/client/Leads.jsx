import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../ClientLayout';

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
const COLUMNS = ['Date', 'Name', 'Email', 'Phone', 'Municipality', 'System Type', 'Estimated Price', 'Status', 'Actions'];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px' };

export default function Leads() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [leads,        setLeads]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [hoveredRow,   setHoveredRow]   = useState(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [showToast,    setShowToast]    = useState(false);

  useEffect(() => {
    if (!profile?.client_id) return;
    fetchLeads();

    const channel = supabase
      .channel(`leads-page-${profile.client_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `client_id=eq.${profile.client_id}` }, payload => {
        setLeads(prev => [payload.new, ...prev]);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  useEffect(() => { setCurrentPage(1); }, [search, activeFilter]);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false });
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
    const matchSearch = !q||(l.name||'').toLowerCase().includes(q)||(l.email||'').toLowerCase().includes(q);
    const matchFilter = activeFilter==='All'||l.status===activeFilter;
    return matchSearch && matchFilter;
  });

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const wonLeads = leads.filter(l => l.status === 'Closed Won').length;
  const conversionRate = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;

  const statCards = [
    { label: 'Total Leads',        value: loading ? '—' : String(leads.length),    color: '#ecfccb', textColor: '#3f6212', icon: '▤' },
    { label: 'This Month',         value: loading ? '—' : String(thisMonthCount),  color: '#dbeafe', textColor: '#1d4ed8', icon: '◎' },
    { label: 'Conversion Rate',    value: `${conversionRate}%`,                     color: '#dcfce7', textColor: '#166534', icon: '▤' },
    { label: 'Avg Estimate Value', value: loading ? '—' : avgPrice ? `${avgPrice.toLocaleString()} kr` : '—', color: '#fef9c3', textColor: '#854d0e', icon: '⊞' },
  ];

  return (
    <ClientLayout title="Leads">
      {showToast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, backgroundColor: '#0d1f12', color: '#fff', borderRadius: '12px', padding: '14px 20px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          New lead just came in!
        </div>
      )}
      <div style={{ fontFamily: FONT }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Leads</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>All leads generated by your estimator tool.</p>
          </div>
          <button type="button" onClick={handleExportCSV} style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#0d1117', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
            Export CSV
          </button>
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
        </div>

        {/* Table */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 130px 180px 120px 130px 130px 140px 150px 80px', backgroundColor: '#f9fbf9', borderBottom: '1px solid #e8ede8', padding: '12px 20px' }}>
            {COLUMNS.map(col => (
              <span key={col} style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</span>
            ))}
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
                  onMouseEnter={() => setHoveredRow(lead.id)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ display: 'grid', gridTemplateColumns: '100px 130px 180px 120px 130px 130px 140px 150px 80px', padding: '12px 20px', fontSize: '13.5px', color: '#4b5563', borderBottom: '1px solid #f4f6f4', backgroundColor: hoveredRow===lead.id ? '#f9fbf9' : '#fff', alignItems: 'center' }}>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>{formatDate(lead.created_at)}</span>
                  <span style={{ fontWeight: '600', color: '#0d1117', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name||'—'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#4b5563' }}>{lead.email||'—'}</span>
                  <span>{lead.phone||'—'}</span>
                  <span>{lead.municipality||'—'}</span>
                  <span>{lead.answers?.wastewaterType||'—'}</span>
                  <span style={{ fontWeight: '600', color: '#0d1117' }}>{lead.estimated_price!=null&&!isNaN(Number(lead.estimated_price))?`${Number(lead.estimated_price).toLocaleString()} kr`:'—'}</span>
                  <span>
                    <select value={lead.status||'New'} onChange={e=>updateStatus(lead.id,e.target.value)}
                      style={{ border: '1px solid #e8ede8', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontWeight: '600', color: STATUS_COLORS[lead.status]||'#374151', backgroundColor: '#fff', cursor: 'pointer', outline: 'none', fontFamily: FONT }}>
                      {['New','Contacted','In Progress','Closed Won','Closed Lost'].map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </span>
                  <span style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={()=>navigate(`/client/leads/${lead.id}`)}
                      style={{ fontSize: '12px', color: PRIMARY, backgroundColor: '#ecfccb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', padding: '4px 10px', fontFamily: FONT }}>
                      View
                    </button>
                    <button type="button" onClick={()=>handleDeleteLead(lead.id)}
                      style={{ fontSize: '12px', color: '#dc2626', backgroundColor: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', padding: '4px 10px', fontFamily: FONT }}>
                      Delete
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length} leads
            </span>
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
