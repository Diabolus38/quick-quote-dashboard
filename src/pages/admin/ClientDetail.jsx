import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';

const ACCENT = '#0d3d2a';

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function card(extra = {}) {
  return { backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '14px', padding: '20px', ...extra };
}

const STATUS_COLORS = {
  'New':         '#1d4ed8',
  'Contacted':   '#d97706',
  'In Progress': '#7c3aed',
  'Closed Won':  '#16a34a',
  'Closed Lost': '#dc2626',
};

const PLAN_STYLE = {
  scale:   { bg: '#dcfce7', color: '#166534' },
  growth:  { bg: '#ede9fe', color: '#7c3aed' },
  starter: { bg: '#dbeafe', color: '#1d4ed8' },
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client,   setClient]   = useState(null);
  const [leads,    setLeads]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    setLoading(true);
    const [{ data: clientData, error: clientErr }, { data: leadsData }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('leads').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ]);
    if (clientErr || !clientData) { setNotFound(true); setLoading(false); return; }
    setClient(clientData);
    setLeads(leadsData || []);
    setLoading(false);
  }

  async function deactivate() {
    await supabase.from('clients').update({ active: false }).eq('id', id);
    setClient(prev => ({ ...prev, active: false }));
  }

  if (loading) return (
    <Layout title="Client Detail">
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
    </Layout>
  );

  if (notFound) return (
    <Layout title="Client Detail">
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626', fontSize: '14px' }}>Client not found.</div>
    </Layout>
  );

  const now = new Date();
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const avgPrice = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0) / leads.length)
    : null;

  const planStyle  = PLAN_STYLE[client.plan] || PLAN_STYLE.starter;
  const recentLeads = leads.slice(0, 5);

  return (
    <Layout title="Client Detail">

      {/* Back */}
      <button type="button" onClick={() => navigate('/admin/clients')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: ACCENT, fontSize: '13px', fontWeight: '500', padding: 0, marginBottom: '16px' }}>
        ← Back to Clients
      </button>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0d1117' }}>{client.name}</h1>
        <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: planStyle.bg, color: planStyle.color }}>
          {client.plan || 'starter'}
        </span>
        <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: client.active ? '#dcfce7' : '#f3f4f6', color: client.active ? '#166534' : '#6b7280' }}>
          {client.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Two-column body */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* LEFT */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Client Info */}
          <div style={card()}>
            <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>Client Info</p>
            {[
              { label: 'Company Name', value: client.name },
              { label: 'Email',        value: client.email },
              { label: 'Plan',         value: client.plan || 'starter' },
              { label: 'Status',       value: client.active ? 'Active' : 'Inactive' },
              { label: 'Member Since', value: formatDate(client.created_at) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f7f7f7' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>
                <span style={{ fontSize: '13px', color: '#0d1117' }}>{value || '—'}</span>
              </div>
            ))}
          </div>

          {/* Recent Leads */}
          <div style={card({ marginTop: '20px' })}>
            <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>Recent Leads</p>
            {recentLeads.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>No leads yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    {['Name', 'Price', 'Date', 'Status'].map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '6px 0', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f0f0f0' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map(lead => (
                    <tr key={lead.id}>
                      <td style={{ padding: '10px 0', fontSize: '13px', color: '#0d1117', fontWeight: '500', borderBottom: '1px solid #f7f7f7' }}>{lead.name || '—'}</td>
                      <td style={{ padding: '10px 0', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f7f7f7' }}>
                        {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                      </td>
                      <td style={{ padding: '10px 0', fontSize: '13px', color: '#9ca3af', borderBottom: '1px solid #f7f7f7' }}>{formatDate(lead.created_at)}</td>
                      <td style={{ padding: '10px 0', borderBottom: '1px solid #f7f7f7' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: STATUS_COLORS[lead.status] || '#374151' }}>{lead.status || 'New'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ width: '280px', flexShrink: 0 }}>

          {/* Stats */}
          <div style={card()}>
            <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>Stats</p>
            {[
              { label: 'Total Leads',      value: String(leads.length) },
              { label: 'Leads This Month', value: String(thisMonthLeads.length) },
              { label: 'Avg Estimate',     value: avgPrice != null ? `${avgPrice.toLocaleString()} kr` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f7f7f7' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#0d1117' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={card({ marginTop: '16px' })}>
            <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>Actions</p>
            <button
              type="button"
              onClick={deactivate}
              disabled={!client.active}
              style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '600', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '8px', cursor: client.active ? 'pointer' : 'not-allowed', marginBottom: '8px', fontFamily: 'inherit', opacity: client.active ? 1 : 0.5 }}
            >
              Deactivate Client
            </button>
            <button
              type="button"
              style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: '600', backgroundColor: ACCENT, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              View as Client
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
