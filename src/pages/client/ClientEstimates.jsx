import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const filters = ['All', 'This Week', 'This Month'];
const columns = ['Customer Name', 'Customer Email', 'Customer Phone', 'Price', 'Language', 'Date'];

const cell = {
  padding: '14px 24px',
  color: '#334155',
  verticalAlign: 'middle',
  fontFamily: FONT,
};

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
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

export default function ClientEstimates() {
  const { profile } = useAuth();
  const [leads,        setLeads]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if (!profile?.client_id) return;
    supabase
      .from('leads')
      .select('id, name, email, phone, estimated_price, language, created_at')
      .eq('client_id', profile.client_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false); });
  }, [profile?.client_id]);

  const weekStart  = startOfWeek();
  const monthStart = startOfMonth();

  const filtered = leads.filter(l => {
    if (activeFilter === 'This Week')  return new Date(l.created_at) >= weekStart;
    if (activeFilter === 'This Month') return new Date(l.created_at) >= monthStart;
    return true;
  });

  return (
    <ClientLayout title="Estimates">
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden', fontFamily: FONT }}>

        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', fontFamily: FONT }}>
            My Estimates
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {filters.map(f => {
              const isActive = activeFilter === f;
              return (
                <button key={f} type="button" onClick={() => setActiveFilter(f)}
                  style={{ padding: '7px 16px', fontSize: '13px', fontWeight: '500', borderRadius: '7px', cursor: 'pointer', border: isActive ? 'none' : '1px solid #e2e8f0', backgroundColor: isActive ? '#0f172a' : '#ffffff', color: isActive ? '#ffffff' : '#64748b', fontFamily: FONT, transition: 'background-color 0.15s, color 0.15s' }}>
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px', fontFamily: FONT }}>Loading estimates…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px', fontFamily: FONT }}>
            {leads.length === 0 ? 'No estimates yet.' : 'No estimates match this filter.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {columns.map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '11px 24px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#94a3b8', whiteSpace: 'nowrap', fontFamily: FONT }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row.id || i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.name || '—'}</td>
                  <td style={{ ...cell, color: '#64748b' }}>{row.email || '—'}</td>
                  <td style={{ ...cell, color: '#64748b' }}>{row.phone || '—'}</td>
                  <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>
                    {row.estimated_price != null && !isNaN(Number(row.estimated_price))
                      ? `${Number(row.estimated_price).toLocaleString()} kr`
                      : '—'}
                  </td>
                  <td style={cell}>{row.language || '—'}</td>
                  <td style={{ ...cell, color: '#94a3b8' }}>{formatDate(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ClientLayout>
  );
}
