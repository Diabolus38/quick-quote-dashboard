import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e8ede8', boxShadow: '0 2px 12px rgba(13,31,18,0.06)', padding: '24px' };

const TH = { textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8' };
const TD = { padding: '13px 16px', fontSize: '13.5px', color: '#4b5563', borderBottom: '1px solid #f4f6f4', verticalAlign: 'middle' };

const STATUS_BADGE = {
  'New':         { bg: '#dbeafe', color: '#1d4ed8' },
  'Contacted':   { bg: '#fef9c3', color: '#854d0e' },
  'In Progress': { bg: '#ede9fe', color: '#7c3aed' },
  'Closed Won':  { bg: '#dcfce7', color: '#166534' },
  'Closed Lost': { bg: '#fee2e2', color: '#991b1b' },
};

const PLAN_STYLE = {
  scale:   { bg: '#dcfce7', color: '#166534' },
  growth:  { bg: '#ede9fe', color: '#7c3aed' },
  starter: { bg: '#dbeafe', color: '#1d4ed8' },
};

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

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
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '14px', fontFamily: FONT }}>Loading…</div>
    </Layout>
  );

  if (notFound) return (
    <Layout title="Client Detail">
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#dc2626', fontSize: '14px', fontFamily: FONT }}>Client not found.</div>
    </Layout>
  );

  const now = new Date();
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const wonLeads = leads.filter(l => l.status === 'Closed Won');
  const avgPrice = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0) / leads.length)
    : null;

  const planStyle   = PLAN_STYLE[client.plan] || PLAN_STYLE.starter;
  const isActive    = client.active !== false;
  const recentLeads = leads.slice(0, 5);

  return (
    <Layout title="Client Detail">
      <div style={{ fontFamily: FONT }}>

        {/* Back */}
        <button type="button" onClick={() => navigate('/admin/clients')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, marginBottom: '20px', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Clients
        </button>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>{client.name}</h1>
          <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: planStyle.bg, color: planStyle.color }}>
            {client.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) : 'Starter'}
          </span>
          <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#166534' : '#dc2626' }}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Two-column body */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* LEFT */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Client Info */}
            <div style={CARD}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Client Info</p>
              {[
                { label: 'Company Name', value: client.name  },
                { label: 'Email',        value: client.email },
                { label: 'Plan',         value: client.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) : 'Starter' },
                { label: 'Status',       value: isActive ? 'Active' : 'Inactive' },
                { label: 'Member Since', value: formatDate(client.created_at) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>
                  <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500' }}>{value || '—'}</span>
                </div>
              ))}
            </div>

            {/* Recent Leads */}
            <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginTop: '20px' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Recent Leads</span>
              </div>
              {recentLeads.length === 0 ? (
                <p style={{ margin: 0, padding: '48px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>No leads yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fbf9' }}>
                      {['Name','Price','Date','Status'].map(col => <th key={col} style={TH}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map(lead => {
                      const sb = STATUS_BADGE[lead.status] || { bg: '#f3f4f6', color: '#6b7280' };
                      return (
                        <tr key={lead.id}>
                          <td style={{ ...TD, fontWeight: '600', color: '#0d1117' }}>{lead.name || '—'}</td>
                          <td style={{ ...TD, fontWeight: '600', color: '#0d1117' }}>
                            {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                          </td>
                          <td style={{ ...TD, color: '#9ca3af' }}>{formatDate(lead.created_at)}</td>
                          <td style={TD}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: sb.bg, color: sb.color }}>
                              {lead.status || 'New'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ width: '280px', flexShrink: 0 }}>

            {/* Stats */}
            <div style={CARD}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Stats</p>
              {[
                { label: 'Total Leads',      value: String(leads.length),          color: '#ecfccb', textColor: '#3f6212' },
                { label: 'Leads This Month', value: String(thisMonthLeads.length),  color: '#dbeafe', textColor: '#1d4ed8' },
                { label: 'Closed Won',       value: String(wonLeads.length),        color: '#dcfce7', textColor: '#166534' },
                { label: 'Avg Estimate',     value: avgPrice != null ? `${avgPrice.toLocaleString()} kr` : '—', color: '#fef9c3', textColor: '#854d0e' },
              ].map(({ label, value, color, textColor }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f4f6f4' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#0d1117' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ ...CARD, marginTop: '16px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Actions</p>
              <button type="button" onClick={deactivate} disabled={!isActive}
                style={{ width: '100%', padding: '11px', fontSize: '13.5px', fontWeight: '600', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '10px', cursor: isActive ? 'pointer' : 'not-allowed', marginBottom: '8px', fontFamily: FONT, opacity: isActive ? 1 : 0.45 }}>
                Deactivate Client
              </button>
              <button type="button"
                style={{ width: '100%', padding: '11px', fontSize: '13.5px', fontWeight: '600', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: FONT }}>
                View as Client
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
