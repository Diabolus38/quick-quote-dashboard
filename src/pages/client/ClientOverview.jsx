import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../ClientLayout';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const STATUS_COLORS = {
  'New':         { bg: '#dbeafe', color: '#1d4ed8' },
  'Contacted':   { bg: '#fef9c3', color: '#854d0e' },
  'In Progress': { bg: '#ede9fe', color: '#7c3aed' },
  'Closed Won':  { bg: '#dcfce7', color: '#166534' },
  'Closed Lost': { bg: '#fee2e2', color: '#991b1b' },
};

function formatDate(str) {
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px' };
const COLUMNS = ['Name', 'Municipality', 'Estimated Price', 'Status', 'Date'];

export default function ClientOverview() {
  const { profile } = useAuth();
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.client_id) return;
    supabase.from('leads').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false); });
  }, [profile]);

  const now = new Date();
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todayLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.toDateString() === now.toDateString();
  });
  const wonLeads = leads.filter(l => l.status === 'Closed Won');
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const avg = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0) / leads.length)
    : null;

  const statCards = [
    { label: 'Leads Today',        value: loading ? '—' : String(todayLeads.length),    color: '#ecfccb', textColor: '#3f6212', icon: '◎' },
    { label: 'Leads This Month',   value: loading ? '—' : String(thisMonthLeads.length), color: '#dbeafe', textColor: '#1d4ed8', icon: '▤' },
    { label: 'Conversion Rate',    value: loading ? '—' : `${conversionRate}%`,          color: '#dcfce7', textColor: '#166534', icon: '⊞' },
    { label: 'Avg Estimate Value', value: loading ? '—' : avg != null ? `${avg.toLocaleString()} kr` : '—', color: '#fef9c3', textColor: '#854d0e', icon: '◈' },
  ];

  const recentLeads = leads.slice(0, 8);

  return (
    <ClientLayout title="Overview">
      <div style={{ fontFamily: FONT }}>

        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Overview</h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>
            {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}.` : 'Welcome back.'} Here's your dashboard.
          </p>
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

        {/* Recent submissions table */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Recent Submissions</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Last {recentLeads.length} leads</span>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>Loading…</div>
          ) : recentLeads.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>
              No leads yet. Your leads will appear here once customers use your estimator tool.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fbf9' }}>
                  {COLUMNS.map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '11px 24px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', borderBottom: '1px solid #e8ede8' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, i) => {
                  const sc = STATUS_COLORS[lead.status] || { bg: '#f3f4f6', color: '#6b7280' };
                  return (
                    <tr key={lead.id} style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                      <td style={{ padding: '14px 24px', fontWeight: '600', color: '#0d1117' }}>{lead.name || '—'}</td>
                      <td style={{ padding: '14px 24px', color: '#4b5563' }}>{lead.municipality || '—'}</td>
                      <td style={{ padding: '14px 24px', fontWeight: '600', color: '#0d1117' }}>
                        {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: sc.bg, color: sc.color }}>
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', color: '#9ca3af' }}>{formatDate(lead.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </ClientLayout>
  );
}
