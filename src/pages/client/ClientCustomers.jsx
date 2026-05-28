import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

const columns = ['Name', 'Email', 'Phone', 'Company', 'Last Estimate', 'Total Estimates'];

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

export default function ClientCustomers() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!profile?.client_id) return;
    supabase
      .from('leads')
      .select('name, email, phone, company, created_at')
      .eq('client_id', profile.client_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const grouped = {};
        (data || []).forEach(lead => {
          const key = (lead.email || '').toLowerCase() || lead.name || Math.random().toString();
          if (!grouped[key]) {
            grouped[key] = {
              name:         lead.name    || '—',
              email:        lead.email   || '—',
              phone:        lead.phone   || '—',
              company:      lead.company || '—',
              lastEstimate: lead.created_at,
              total:        1,
            };
          } else {
            grouped[key].total += 1;
            if (new Date(lead.created_at) > new Date(grouped[key].lastEstimate)) {
              grouped[key].lastEstimate = lead.created_at;
            }
          }
        });
        setCustomers(Object.values(grouped));
        setLoading(false);
      });
  }, [profile?.client_id]);

  return (
    <ClientLayout title="Customers">
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden', fontFamily: FONT }}>

        {/* Card header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', fontFamily: FONT }}>My Customers</span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px', fontFamily: FONT }}>Loading customers…</div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px', fontFamily: FONT }}>No customers yet.</div>
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
              {customers.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.name}</td>
                  <td style={{ ...cell, color: '#64748b' }}>{row.email}</td>
                  <td style={{ ...cell, color: '#64748b' }}>{row.phone}</td>
                  <td style={cell}>{row.company}</td>
                  <td style={{ ...cell, color: '#94a3b8' }}>{formatDate(row.lastEstimate)}</td>
                  <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ClientLayout>
  );
}
