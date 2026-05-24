import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e8ede8', boxShadow: '0 2px 12px rgba(13,31,18,0.06)', padding: '24px' };

const TH = { textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8' };
const TD = { padding: '14px 16px', fontSize: '13.5px', color: '#4b5563', borderBottom: '1px solid #f4f6f4', verticalAlign: 'middle' };

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [clients,     setClients]     = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [totalLeads,  setTotalLeads]  = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [clientsRes, leadsRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
    ]);
    const clientList = clientsRes.data || [];
    const allLeads   = leadsRes.data   || [];
    const clientMap  = {};
    clientList.forEach(c => { clientMap[c.id] = c.name; });
    const leadCounts = {};
    allLeads.forEach(l => { leadCounts[l.client_id] = (leadCounts[l.client_id] || 0) + 1; });
    setClients(clientList.map(c => ({ ...c, computedLeadCount: leadCounts[c.id] || 0 })));
    setRecentLeads(allLeads.slice(0, 10).map(l => ({ ...l, clientName: clientMap[l.client_id] || '—' })));
    setTotalLeads(allLeads.length);
    setLoading(false);
  }

  async function handleDeactivate(clientId) {
    if (!window.confirm('Deactivate this client? They will lose access.')) return;
    const { error } = await supabase.from('clients').update({ active: false }).eq('id', clientId);
    if (!error) setClients(prev => prev.map(c => c.id === clientId ? { ...c, active: false } : c));
  }

  async function handleActivate(clientId) {
    const { error } = await supabase.from('clients').update({ active: true }).eq('id', clientId);
    if (!error) setClients(prev => prev.map(c => c.id === clientId ? { ...c, active: true } : c));
  }

  const activeClients = clients.filter(c => c.active !== false).length;
  const mrr = clients.filter(c=>c.plan==='starter').length*300 + clients.filter(c=>c.plan==='growth').length*600 + clients.filter(c=>c.plan==='scale').length*1149;

  const statCards = [
    { label: 'Total Clients',  value: clients.length, color: '#ecfccb', textColor: '#3f6212' },
    { label: 'Total Leads',    value: totalLeads,      color: '#dbeafe', textColor: '#1d4ed8' },
    { label: 'Active Clients', value: activeClients,   color: '#dcfce7', textColor: '#166534' },
    { label: 'MRR Estimate',   value: `$ ${mrr.toLocaleString()}`, color: '#fef9c3', textColor: '#854d0e' },
  ];

  return (
    <Layout title="Super Admin">
      <div style={{ fontFamily: FONT }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Super Admin</h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Platform-wide overview and client management.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af', fontSize: '14px' }}>Loading…</div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {statCards.map(card => (
                <div key={card.label} style={CARD}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '18px', color: card.textColor }}>◎</div>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* All Clients Table */}
            <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>All Clients</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ backgroundColor: '#f9fbf9' }}>
                  {['Client Name','Plan','Status','Leads','Created','Actions'].map(h=><th key={h} style={TH}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', padding: '48px', color: '#9ca3af' }}>No clients found</td></tr>
                  ) : clients.map(client => {
                    const isActive = client.active !== false;
                    const planColor = { starter: { bg: '#dbeafe', color: '#1d4ed8' }, growth: { bg: '#ede9fe', color: '#7c3aed' }, scale: { bg: '#dcfce7', color: '#166534' } };
                    const pc = planColor[client.plan] || planColor.starter;
                    return (
                      <tr key={client.id} style={{ backgroundColor: '#fff' }}>
                        <td style={{ ...TD, fontWeight: '700', color: '#0d1117' }}>{client.name || '—'}</td>
                        <td style={TD}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: pc.bg, color: pc.color }}>
                            {client.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) : 'Free'}
                          </span>
                        </td>
                        <td style={TD}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#166534' : '#dc2626' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ ...TD, fontWeight: '700', color: '#0d1117' }}>{client.computedLeadCount}</td>
                        <td style={{ ...TD, color: '#9ca3af' }}>{client.created_at ? new Date(client.created_at).toLocaleDateString('en-GB') : '—'}</td>
                        <td style={TD}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <ActionBtn label="View" variant="lime" onClick={() => navigate(`/admin/clients/${client.id}`)} />
                            {isActive
                              ? <ActionBtn label="Deactivate" variant="red"   onClick={() => handleDeactivate(client.id)} />
                              : <ActionBtn label="Activate"   variant="green" onClick={() => handleActivate(client.id)}   />
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Recent Leads */}
            <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Recent Leads — All Clients</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ backgroundColor: '#f9fbf9' }}>
                  {['Client','Customer','Municipality','Status','Price (kr)','Date'].map(h=><th key={h} style={TH}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {recentLeads.length === 0 ? (
                    <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', padding: '48px', color: '#9ca3af' }}>No leads yet</td></tr>
                  ) : recentLeads.map(lead => {
                    const sc = { 'New': { bg: '#dbeafe', color: '#1d4ed8' }, 'Contacted': { bg: '#fef9c3', color: '#854d0e' }, 'In Progress': { bg: '#ede9fe', color: '#7c3aed' }, 'Closed Won': { bg: '#dcfce7', color: '#166534' }, 'Closed Lost': { bg: '#fee2e2', color: '#991b1b' } };
                    const s = sc[lead.status] || { bg: '#f3f4f6', color: '#6b7280' };
                    return (
                      <tr key={lead.id}>
                        <td style={{ ...TD, fontWeight: '700', color: '#0d1117' }}>{lead.clientName}</td>
                        <td style={TD}>{lead.customer_name || lead.name || '—'}</td>
                        <td style={TD}>{lead.municipality || '—'}</td>
                        <td style={TD}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>
                            {lead.status || '—'}
                          </span>
                        </td>
                        <td style={{ ...TD, fontWeight: '600', color: '#0d1117' }}>{lead.estimated_price ? Number(lead.estimated_price).toLocaleString() : '—'}</td>
                        <td style={{ ...TD, color: '#9ca3af' }}>{lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-GB') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function ActionBtn({ label, onClick, variant }) {
  const [hovered, setHovered] = useState(false);
  const schemes = {
    lime:  { base: '#ecfccb', text: '#3f6212', hover: '#a3e635' },
    red:   { base: '#fee2e2', text: '#dc2626', hover: '#dc2626' },
    green: { base: '#dcfce7', text: '#166534', hover: '#166534' },
  };
  const s = schemes[variant] || schemes.lime;
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', backgroundColor: hovered ? s.hover : s.base, color: hovered ? '#fff' : s.text, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontFamily: FONT }}>
      {label}
    </button>
  );
}
