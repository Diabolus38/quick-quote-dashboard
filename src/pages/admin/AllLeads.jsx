import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  const [leads,        setLeads]        = useState([]);
  const [clients,      setClients]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [hovRow,       setHovRow]       = useState(null);
  const [newLeadToast, setNewLeadToast] = useState(null);
  const [soundEnabled,  setSoundEnabled]  = useState(true);
  const [dnd, setDnd] = useState(() => { try { return JSON.parse(localStorage.getItem('qq360_dnd') || 'false'); } catch { return false; } });
  const [flaggedLeads, setFlaggedLeads] = useState(() => { try { return JSON.parse(localStorage.getItem('qq360_flagged_leads') || '[]'); } catch { return []; } });
  const [flaggedFilter, setFlaggedFilter] = useState(false);
  const clientsRef = useRef([]);

  const [search,        setSearch]        = useState('');
  const [clientFilter,  setClientFilter]  = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('client') || 'all';
  });
  const [statusFilter,  setStatusFilter]  = useState('All');
  const [dateFilter,    setDateFilter]    = useState('All Time');
  const [currentPage,   setCurrentPage]   = useState(1);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [bulkStatus,    setBulkStatus]    = useState('new');
  const [previewLead,    setPreviewLead]    = useState(null);
  const [panelVisible,   setPanelVisible]   = useState(false);
  const [quickNote,      setQuickNote]      = useState('');
  const [noteSaved,      setNoteSaved]      = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [focusedLeadId, setFocusedLeadId] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [heatmapRange, setHeatmapRange] = useState('7days');
  const ALL_COLS = ['Date','Client','Customer Name','Email','Phone','Municipality','System Type','Language','Price','Status','Actions'];
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('qq360_leads_columns');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(ALL_COLS);
  });

  useEffect(() => {
    function handleClick(e) {
      if (!e.target.closest('[data-col-picker]')) setShowColumnPicker(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (previewLead) {
      setQuickNote(previewLead.notes || '');
      setPanelVisible(true);
    } else {
      setPanelVisible(false);
    }
  }, [previewLead]);

  async function saveNote() {
    await supabase.from('leads').update({ notes: quickNote }).eq('id', previewLead.id);
    setLeads(prev => prev.map(l => l.id === previewLead.id ? { ...l, notes: quickNote } : l));
    setPreviewLead(prev => ({ ...prev, notes: quickNote }));
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  function closePanel() {
    setPanelVisible(false);
    setTimeout(() => setPreviewLead(null), 250);
  }

  function toggleFlag(leadId) {
    setFlaggedLeads(prev => {
      const next = prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId];
      localStorage.setItem('qq360_flagged_leads', JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    async function fetchData() {
      const [leadsRes, clientsRes] = await Promise.all([
        supabase.from('leads').select('id, client_id, created_at, name, email, phone, municipality, answers, estimated_price, status, language, notes').order('created_at', { ascending: false }).limit(500),
        supabase.from('clients').select('id, name, plan').order('name'),
      ]);
      if (leadsRes.error)   console.error('Failed to fetch leads:', leadsRes.error);
      if (clientsRes.error) console.error('Failed to fetch clients:', clientsRes.error);
      setLeads(leadsRes.data   || []);
      setClients(clientsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => { clientsRef.current = clients; }, [clients]);

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

  useEffect(() => {
    const channel = supabase.channel(`admin-all-leads-rt-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, payload => {
        const lead = payload.new;
        setLeads(prev => [lead, ...prev]);
        if (!dnd) { setNewLeadToast(`New lead from ${lead.name || 'Unknown'}`); setTimeout(() => setNewLeadToast(null), 4000); }
        if (soundEnabled && !dnd) playChime();
      })
      .subscribe((status) => { if (status === 'CHANNEL_ERROR') { console.warn('AllLeads realtime channel error - will retry'); } });
    return () => { supabase.removeChannel(channel); };
  }, [soundEnabled, dnd]);

  async function updateStatus(leadId, newStatus) {
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    setPreviewLead(prev => prev?.id === leadId ? { ...prev, status: newStatus } : prev);
  }

  function toggleSelect(leadId) {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId); else next.add(leadId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (paginatedLeads.every(l => selectedLeads.has(l.id))) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(paginatedLeads.map(l => l.id)));
    }
  }

  async function handleBulkUpdateStatus() {
    const ids = [...selectedLeads];
    await Promise.all(ids.map(id => supabase.from('leads').update({ status: bulkStatus }).eq('id', id)));
    setLeads(prev => prev.map(l => selectedLeads.has(l.id) ? { ...l, status: bulkStatus } : l));
    setSelectedLeads(new Set());
  }

  function handleExportSelected() {
    exportCSV(leads.filter(l => selectedLeads.has(l.id)), clientMap);
  }

  useEffect(() => { setCurrentPage(1); setSelectedLeads(new Set()); }, [search, clientFilter, statusFilter, dateFilter]);

  /* ── Client map ── */
  const clientMap = {};
  clients.forEach((c, i) => { clientMap[c.id] = { name: c.name, paletteIdx: i % avatarPalette.length }; });

  /* ── Filtered leads ── */
  const weekStart  = startOfWeek();
  const monthStart = startOfMonth();

  const filtered = leads.filter(l => {
    const q            = search.toLowerCase();
    const matchSearch  = !q || (l.name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q) || (l.phone || '').toLowerCase().includes(q) || (l.municipality || '').toLowerCase().includes(q) || (l.company || '').toLowerCase().includes(q) || (l.answers?.wastewaterType || '').toLowerCase().includes(q) || (l.id || '').toLowerCase().includes(q);
    const matchClient  = clientFilter === 'all' || l.client_id === clientFilter;
    const rawStatus    = (l.status || 'new').toLowerCase().replace(/\s+/g, '_');
    const matchStatus  = statusFilter === 'All' || rawStatus === statusFilter.toLowerCase().replace(/\s+/g, '_');
    const created      = new Date(l.created_at);
    const matchDate    = dateFilter === 'All Time' || (dateFilter === 'This Week' && created >= weekStart) || (dateFilter === 'This Month' && created >= monthStart);
    const matchFlagged = !flaggedFilter || flaggedLeads.includes(l.id);
    return matchSearch && matchClient && matchStatus && matchDate && matchFlagged;
  });

  /* ── Pagination ── */
  const [pageSize, setPageSize] = useState(() => { const s = localStorage.getItem('qq360_admin_leads_page_size'); return s ? Number(s) : 25; });
  const PAGE_SIZE    = pageSize;
  const totalPages   = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedLeads = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
    { label: 'Avg Value',    value: avgValue > 0 ? `${avgValue.toLocaleString()} kr` : '—', bg: '#fef9c3', color: '#854d0e' },
  ];
  const summaryTotalValue = leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0);
  const summaryWon        = leads.filter(l => (l.status || '').toLowerCase().replace(/\s+/g,'_') === 'closed_won').length;

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
      {newLeadToast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, backgroundColor: '#0d1117', color: '#fff', borderRadius: '12px', padding: '14px 20px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {newLeadToast}
        </div>
      )}
      <div style={{ fontFamily: FONT }}>

        {/* DND Banner */}
        {dnd && (
          <div style={{ backgroundColor: '#fef9c3', color: '#854d0e', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: FONT }}>
            <span>🌙</span>
            <span style={{ flex: 1 }}>Do Not Disturb is on — lead notifications are muted.</span>
            <button type="button" onClick={() => { setDnd(false); localStorage.setItem('qq360_dnd', 'false'); }}
              style={{ background: 'none', border: '1px solid #d97706', color: '#854d0e', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              Turn off
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>All Leads</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Every lead generated across all client accounts</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => {
              const now = new Date();
              const thisMonth = filtered.filter(l => {
                const d = new Date(l.created_at);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              });
              exportCSV(thisMonth, clientMap);
            }}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: '#fff', color: '#374151', border: '1px solid #e8ede8', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
              ↓ Export This Month
            </button>
            <button type="button" onClick={() => exportCSV(filtered, clientMap)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              ↓ Export CSV
            </button>
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
            <div style={{ position: 'relative' }} data-col-picker>
              <button type="button" onClick={e => { e.stopPropagation(); setShowColumnPicker(p => !p); }}
                style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '10px 16px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
                ⊞ Columns
              </button>
              {showColumnPicker && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, backgroundColor: '#fff', border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minWidth: '200px' }}>
                  {ALL_COLS.map(col => (
                    <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: '#374151', fontFamily: FONT }}>
                      <input type="checkbox" checked={visibleColumns.has(col)} onChange={() => setVisibleColumns(prev => { const next = new Set(prev); next.has(col) ? next.delete(col) : next.add(col); localStorage.setItem('qq360_leads_columns', JSON.stringify([...next])); return next; })} style={{ cursor: 'pointer' }} />
                      {col}
                    </label>
                  ))}
                  <button type="button" onClick={() => { const d = new Set(ALL_COLS); setVisibleColumns(d); localStorage.setItem('qq360_leads_columns', JSON.stringify([...d])); }}
                    style={{ background: 'none', border: 'none', borderTop: '1px solid #f4f6f4', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', padding: '8px 16px', width: '100%', textAlign: 'left', marginTop: '4px', fontFamily: FONT }}>
                    Reset to defaults
                  </button>
                </div>
              )}
            </div>
          </div>
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

        {/* ── Heatmap ── */}
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

          {/* Flagged filter */}
          <button type="button" onClick={() => setFlaggedFilter(p => !p)}
            style={{ border: flaggedFilter ? 'none' : '1px solid #e8ede8', backgroundColor: flaggedFilter ? '#dc2626' : '#fff', color: flaggedFilter ? '#fff' : '#4b5563', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px', fontWeight: flaggedFilter ? '600' : '500', cursor: 'pointer', fontFamily: FONT }}>
            🚩 Flagged Only
          </button>
        </div>

        {/* ── Bulk Action Bar ── */}
        {selectedLeads.size > 0 && (
          <div style={{ backgroundColor: '#0d1117', borderRadius: '12px', padding: '12px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}>{selectedLeads.size} selected</span>
            <div style={{ flex: 1 }} />
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              style={{ border: '1px solid #374151', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', backgroundColor: '#1f2937', color: '#fff', fontFamily: FONT, outline: 'none', cursor: 'pointer' }}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="in_progress">In Progress</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option>
            </select>
            <button type="button" onClick={handleBulkUpdateStatus}
              style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              Update Status
            </button>
            <button type="button" onClick={handleExportSelected}
              style={{ backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              Export Selected
            </button>
            <button type="button" onClick={() => setSelectedLeads(new Set())}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '12px', fontFamily: FONT, padding: 0 }}>
              Clear
            </button>
          </div>
        )}

        {/* ── Summary Bar ── */}
        <div style={{ ...CARD, padding: '16px 24px', marginBottom: '16px', display: 'flex', gap: '32px', alignItems: 'center' }}>
          {[
            { label: 'Total Value',  value: `${summaryTotalValue.toLocaleString()} kr` },
            { label: 'Won Leads',    value: String(summaryWon) },
            { label: 'Leads Today',  value: String(today) },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>{stat.label}</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{stat.value}</p>
              </div>
              {i < arr.length - 1 && <div style={{ width: '1px', height: '32px', backgroundColor: '#e8ede8', flexShrink: 0 }} />}
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>
              No leads yet across any client accounts
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}
            onKeyDown={e => {
              if (!['ArrowDown','ArrowUp','Enter'].includes(e.key)) return;
              e.preventDefault();
              const idx = paginatedLeads.findIndex(l => l.id === focusedLeadId);
              if (e.key === 'ArrowDown') setFocusedLeadId(paginatedLeads[Math.min(idx + 1, paginatedLeads.length - 1)]?.id ?? paginatedLeads[0]?.id);
              else if (e.key === 'ArrowUp') setFocusedLeadId(paginatedLeads[Math.max(idx - 1, 0)]?.id);
              else if (e.key === 'Enter' && focusedLeadId) navigate(`/admin/leads/${focusedLeadId}`);
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid #e8ede8', width: '40px' }}>
                      <input type="checkbox"
                        checked={paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeads.has(l.id))}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }} />
                    </th>
                    {ALL_COLS.filter(col => visibleColumns.has(col)).map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeads.map((lead, i) => {
                    const clientEntry = clientMap[lead.client_id];
                    const clientName  = clientEntry?.name || '—';
                    const av          = clientEntry ? avatarPalette[clientEntry.paletteIdx] : { bg: '#f3f4f6', color: '#374151' };
                    const rawStatus   = (lead.status || 'new').toLowerCase().replace(/\s+/g, '_');
                    const sc          = STATUS_COLORS[rawStatus] || { bg: '#f3f4f6', color: '#6b7280', label: lead.status || 'New' };

                    return (
                      <tr key={lead.id || i}
                        tabIndex={0}
                        onFocus={() => setFocusedLeadId(lead.id)}
                        onMouseEnter={() => setHovRow(lead.id)}
                        onMouseLeave={() => setHovRow(null)}
                        style={{ backgroundColor: hovRow === lead.id ? '#f9faf9' : '#fff', borderBottom: '1px solid #f4f6f4', outline: focusedLeadId === lead.id ? '2px solid #166534' : 'none', outlineOffset: '-2px' }}>

                        <td style={{ padding: '12px 16px' }}>
                          <input type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleSelect(lead.id)}
                            style={{ cursor: 'pointer', width: '15px', height: '15px' }} />
                        </td>
                        {visibleColumns.has('Date') && <td style={{ padding: '12px 16px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{formatDate(lead.created_at)}</td>}

                        {visibleColumns.has('Client') && (
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>
                                {getInitials(clientName)}
                              </div>
                              <span style={{ fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>{clientName}</span>
                            </div>
                          </td>
                        )}

                        {visibleColumns.has('Customer Name') && <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>{lead.name || '—'}</td>}
                        {visibleColumns.has('Email') && <td style={{ padding: '12px 16px', color: '#4b5563' }}>{lead.email || '—'}</td>}
                        {visibleColumns.has('Phone') && <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>{lead.phone || '—'}</td>}
                        {visibleColumns.has('Municipality') && <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>{lead.municipality || '—'}</td>}
                        {visibleColumns.has('System Type') && <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>{lead.answers?.wastewaterType || '—'}</td>}
                        {visibleColumns.has('Language') && <td style={{ padding: '12px 16px', color: '#4b5563', whiteSpace: 'nowrap' }}>{lead.language || '—'}</td>}

                        {visibleColumns.has('Price') && (
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>
                            {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                          </td>
                        )}

                        {visibleColumns.has('Status') && (
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
                        )}

                        {visibleColumns.has('Actions') && (
                          <td style={{ padding: '12px 16px' }}>
                            <button type="button" onClick={() => setPreviewLead(lead)}
                              style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '600', backgroundColor: '#ecfccb', color: '#3f6212', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT }}>
                              View
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select value={pageSize} onChange={e => { const n = Number(e.target.value); setPageSize(n); localStorage.setItem('qq360_admin_leads_page_size', n); setCurrentPage(1); }}
                style={{ border: '1px solid #e8ede8', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontFamily: FONT, outline: 'none', backgroundColor: '#fff', color: '#374151', cursor: 'pointer' }}>
                {[10,25,50,100].map(n => <option key={n} value={n}>{n} per page</option>)}
              </select>
              <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT }}>
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} leads
              </span>
            </div>
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

      </div>

      {/* ── Lead Preview Panel ── */}
      <>
        {panelVisible && (
          <div onClick={closePanel}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 199 }} />
        )}
        <div style={{ position: 'fixed', top: 0, right: 0, width: '480px', height: '100vh', backgroundColor: '#fff', zIndex: 200, boxShadow: '-4px 0 32px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', fontFamily: FONT, overflowY: 'auto', transform: panelVisible ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {previewLead && (<>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: '700', color: '#0d1117' }}>{previewLead.name || '—'}</p>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#9ca3af' }}>Lead Preview</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button type="button" onClick={() => toggleFlag(previewLead.id)}
                  title={flaggedLeads.includes(previewLead.id) ? 'Unflag lead' : 'Flag lead'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px', lineHeight: 1, opacity: flaggedLeads.includes(previewLead.id) ? 1 : 0.35 }}>
                  {flaggedLeads.includes(previewLead.id) ? '🚩' : '🏳'}
                </button>
                <button type="button" onClick={closePanel}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#9ca3af', padding: '4px', lineHeight: 1, fontFamily: FONT }}>×</button>
              </div>
            </div>
            <div style={{ padding: '24px 28px', flex: 1 }}>
              {(() => {
                const rawStatus = (previewLead.status || 'new').toLowerCase().replace(/\s+/g, '_');
                const sc = STATUS_COLORS[rawStatus] || { bg: '#f3f4f6', color: '#6b7280', label: previewLead.status || 'New' };
                return (
                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                );
              })()}
              {[
                { label: 'Email',        value: previewLead.email || '—' },
                { label: 'Phone',        value: previewLead.phone || '—' },
                { label: 'Date',         value: formatDate(previewLead.created_at) },
                { label: 'Client',       value: clientMap[previewLead.client_id]?.name || '—' },
                { label: 'Municipality', value: previewLead.municipality || '—' },
                { label: 'System Type',  value: previewLead.answers?.wastewaterType || '—' },
                { label: 'Language',     value: previewLead.language || '—' },
                { label: 'Est. Price',   value: previewLead.estimated_price != null ? `${Number(previewLead.estimated_price).toLocaleString()} kr` : '—' },
              ].map(({ label, value }, idx, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx < arr.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>
                  <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #e8ede8', flexShrink: 0 }}>
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>Quick Note</p>
              <textarea value={quickNote} onChange={e => setQuickNote(e.target.value)}
                placeholder="Add a quick note…"
                style={{ height: '80px', width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontFamily: FONT, resize: 'none', outline: 'none', color: '#0d1117', backgroundColor: '#fff' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={saveNote}
                  style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                  Save Note
                </button>
                {noteSaved && <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>Saved!</span>}
              </div>
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid #e8ede8', flexShrink: 0 }}>
              <button type="button" onClick={() => navigate(`/admin/leads/${previewLead.id}`)}
                style={{ width: '100%', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                View Full Details →
              </button>
            </div>
          </>
        )}
      </div>
    </>
    </Layout>
  );
}
