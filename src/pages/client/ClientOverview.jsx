import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../ClientLayout';

const STATUS_COLORS = {
  'New':         '#1d4ed8',
  'Contacted':   '#d97706',
  'In Progress': '#7c3aed',
  'Closed Won':  '#16a34a',
  'Closed Lost': '#dc2626',
};

function formatDate(str) {
  const d = new Date(str);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const columns = ['Name', 'Municipality', 'Estimated Price', 'Status', 'Date'];

export default function ClientOverview() {
  const { profile } = useAuth();

  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.client_id) return;
    async function fetchLeads() {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false });
      setLeads(data || []);
      setLoading(false);
    }
    fetchLeads();
  }, [profile]);

  const now = new Date();
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const avg = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0) / leads.length)
    : null;

  const statCards = [
    { label: 'Estimates This Month', value: loading ? '—' : String(thisMonthLeads.length) },
    { label: 'Total Leads',          value: loading ? '—' : String(leads.length)           },
    { label: 'Avg Estimate Value',   value: loading ? '—' : avg != null ? `${avg.toLocaleString()} kr` : '—' },
  ];

  const recentLeads = leads.slice(0, 5);

  return (
    <ClientLayout title="Overview">

      {/* Row 1 — Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      {/* Row 2 — Recent leads */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>Recent Leads</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>Loading...</div>
        ) : recentLeads.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>No leads yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {columns.map((col) => (
                  <th key={col} style={{ textAlign: 'left', padding: '11px 24px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.6px', textTransform: 'uppercase', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead, i) => (
                <tr key={lead.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{lead.name || '—'}</td>
                  <td style={{ ...cell, color: '#64748b' }}>{lead.municipality || '—'}</td>
                  <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>
                    {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                  </td>
                  <td style={{ ...cell }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: STATUS_COLORS[lead.status] || '#374151' }}>
                      {lead.status || 'New'}
                    </span>
                  </td>
                  <td style={{ ...cell, color: '#94a3b8' }}>{formatDate(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ClientLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}>
      <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.7px', textTransform: 'uppercase', color: '#94a3b8' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

const cell = { padding: '14px 24px', color: '#334155', verticalAlign: 'middle' };
