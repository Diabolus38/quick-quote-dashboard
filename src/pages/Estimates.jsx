import { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e8ede8', boxShadow: '0 2px 12px rgba(13,31,18,0.06)', padding: '24px' };

const avatarPalette = [
  { bg: '#ecfccb', color: '#3f6212' }, { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#fef9c3', color: '#854d0e' }, { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#ccfbf1', color: '#0d9488' }, { bg: '#fee2e2', color: '#991b1b' },
  { bg: '#fce7f3', color: '#9d174d' }, { bg: '#f3f4f6', color: '#374151' },
];

const statusStyle = {
  Completed: { backgroundColor: '#dcfce7', color: '#166534' },
  Sent:      { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  Pending:   { backgroundColor: '#fef9c3', color: '#854d0e' },
  Submitted: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
};

const COLUMNS = ['Invoice ID', 'Client', 'Customer Name', 'Customer Email', 'Price', 'Language', 'Date', 'Status', 'Actions'];
const FILTERS = ['All', 'This Week', 'This Month'];

const statCards = [
  { label: 'Total Estimates',    value: '143',        sub: null,                               color: '#ecfccb', textColor: '#3f6212' },
  { label: 'This Month',         value: '38',         sub: { text: 'vs 29 last month', color: '#16a34a' }, color: '#dcfce7', textColor: '#166534' },
  { label: 'Avg Estimate Value', value: '86,700 kr',  sub: { text: 'across all clients', color: '#9ca3af' }, color: '#dbeafe', textColor: '#1d4ed8' },
  { label: 'Highest This Month', value: '143,000 kr', sub: { text: 'VattSystem', color: '#9ca3af' },        color: '#fef9c3', textColor: '#854d0e' },
];

function getInitials(name) {
  const words = name.split(' ').filter(w => /[a-zA-ZäåöÄÅÖ]/.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Estimates() {
  const [activeFilter,  setActiveFilter]  = useState('All');
  const [hoveredRow,    setHoveredRow]    = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [estimates,     setEstimates]     = useState([]);
  const [clientsMap,    setClientsMap]    = useState({});
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    async function fetchData() {
      const [estResult, cliResult] = await Promise.all([
        supabase.from('estimates').select('*'),
        supabase.from('clients').select('*'),
      ]);
      if (estResult.error || cliResult.error) {
        setError((estResult.error || cliResult.error).message);
        setLoading(false); return;
      }
      const map = {};
      (cliResult.data || []).forEach((c, i) => { map[c.id] = { name: c.name, paletteIdx: i % avatarPalette.length }; });
      setClientsMap(map);
      setEstimates(estResult.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <Layout title="Estimates"><div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af', fontSize: '14px', fontFamily: FONT }}>Loading…</div></Layout>;
  if (error)   return <Layout title="Estimates"><div style={{ textAlign: 'center', padding: '80px', color: '#dc2626', fontSize: '14px', fontFamily: FONT }}>Failed to load estimates.</div></Layout>;

  return (
    <Layout title="Estimates">
      <div style={{ fontFamily: FONT }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Estimates</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>All estimates generated across your clients.</p>
          </div>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            ↓ Export Report
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(card => (
            <div key={card.label} style={CARD}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '16px', color: card.textColor }}>▤</div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
              {card.sub && <p style={{ margin: '6px 0 0', fontSize: '12px', color: card.sub.color, fontWeight: '500' }}>{card.sub.text}</p>}
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '0 14px', height: '42px', backgroundColor: '#fff' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5" /><line x1="9.5" y1="9.5" x2="13" y2="13" /></svg>
            <input type="text" placeholder="Search by client or customer…" style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13.5px', color: '#0d1117', width: '100%', fontFamily: FONT }} />
          </div>
          {FILTERS.map(f => {
            const active = activeFilter === f;
            return (
              <button key={f} type="button" onClick={() => setActiveFilter(f)} style={{ border: active ? 'none' : '1px solid #e8ede8', backgroundColor: active ? PRIMARY : '#fff', color: active ? '#fff' : '#4b5563', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: active ? '600' : '400', cursor: 'pointer', fontFamily: FONT }}>
                {f}
              </button>
            );
          })}
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '7px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', backgroundColor: '#fff', color: '#4b5563', cursor: 'pointer', fontFamily: FONT, height: '42px', boxSizing: 'border-box' }}>
            ≡ Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          {estimates.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>No estimates yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fbf9' }}>
                  {COLUMNS.map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8', whiteSpace: 'nowrap' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estimates.map((row, i) => {
                  const clientEntry = row.client_id ? clientsMap[row.client_id] : null;
                  const clientName  = clientEntry ? clientEntry.name : 'Unknown';
                  const av          = clientEntry ? avatarPalette[clientEntry.paletteIdx] : { bg: '#f3f4f6', color: '#374151' };
                  const initials    = getInitials(clientName);
                  const estId       = (row.id || '').toString().slice(0, 8).toUpperCase();
                  const date        = row.created_at ? row.created_at.slice(0, 10) : '—';
                  const status      = row.status || 'Submitted';
                  const sStyle      = statusStyle[status] ?? { backgroundColor: '#f3f4f6', color: '#374151' };
                  return (
                    <tr key={row.id ?? i} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                      style={{ backgroundColor: hoveredRow === i ? '#f9fbf9' : '#fff', borderBottom: i < estimates.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                      <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0d1117', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{estId}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, backgroundColor: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>{initials}</div>
                          <span style={{ fontWeight: '600', color: '#0d1117' }}>{clientName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#4b5563' }}>{row.contact_name}</td>
                      <td style={{ padding: '14px 20px', color: '#9ca3af' }}>{row.contact_email}</td>
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: '#0d1117' }}>{row.price}</td>
                      <td style={{ padding: '14px 20px', color: '#4b5563' }}>{row.language}</td>
                      <td style={{ padding: '14px 20px', color: '#9ca3af' }}>{date}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', ...sStyle }}>{status}</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[['👁', 'View'], ['✎', 'Edit'], ['↓', 'Download']].map(([sym, lbl], ai) => {
                            const key = `${i}-${ai}`;
                            return (
                              <button key={lbl} type="button" title={lbl}
                                onMouseEnter={() => setHoveredAction(key)} onMouseLeave={() => setHoveredAction(null)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: hoveredAction === key ? PRIMARY : '#9ca3af', padding: '2px', fontFamily: FONT, transition: 'color 0.15s' }}>
                                {sym}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}
