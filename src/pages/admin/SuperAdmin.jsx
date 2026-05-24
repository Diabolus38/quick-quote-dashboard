import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #f0f0f0',
  padding: '24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const TH = {
  textAlign: 'left',
  padding: '8px 14px',
  fontSize: '11px',
  fontWeight: '700',
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  borderBottom: '1px solid #f0f0f0',
};

const TD = {
  padding: '12px 14px',
  fontSize: '14px',
  color: '#374151',
  borderBottom: '1px solid #f9fafb',
  verticalAlign: 'middle',
};

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [clients, setClients]         = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [totalLeads, setTotalLeads]   = useState(0);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [clientsRes, leadsRes] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
    ]);

    const clientList = clientsRes.data || [];
    const allLeads   = leadsRes.data   || [];

    // Build quick lookup: client_id → name
    const clientMap = {};
    clientList.forEach(c => { clientMap[c.id] = c.name; });

    // Lead counts per client
    const leadCounts = {};
    allLeads.forEach(l => {
      leadCounts[l.client_id] = (leadCounts[l.client_id] || 0) + 1;
    });

    const enrichedClients = clientList.map(c => ({
      ...c,
      computedLeadCount: leadCounts[c.id] || 0,
    }));

    const enrichedLeads = allLeads.slice(0, 10).map(l => ({
      ...l,
      clientName: clientMap[l.client_id] || '—',
    }));

    setClients(enrichedClients);
    setRecentLeads(enrichedLeads);
    setTotalLeads(allLeads.length);
    setLoading(false);
  }

  async function handleDeactivate(clientId) {
    if (!window.confirm('Deactivate this client? They will lose access.')) return;
    const { error } = await supabase
      .from('clients')
      .update({ active: false })
      .eq('id', clientId);
    if (!error) {
      setClients(prev =>
        prev.map(c => c.id === clientId ? { ...c, active: false } : c)
      );
    }
  }

  async function handleActivate(clientId) {
    const { error } = await supabase
      .from('clients')
      .update({ active: true })
      .eq('id', clientId);
    if (!error) {
      setClients(prev =>
        prev.map(c => c.id === clientId ? { ...c, active: true } : c)
      );
    }
  }

  const activeClients = clients.filter(c => c.active !== false).length;
  const starterCount  = clients.filter(c => c.plan === 'starter').length;
  const growthCount   = clients.filter(c => c.plan === 'growth').length;
  const scaleCount    = clients.filter(c => c.plan === 'scale').length;
  const mrr = starterCount * 300 + growthCount * 600 + scaleCount * 1149;

  const statCards = [
    { label: 'Total Clients',      value: clients.length,          sub: 'all time'         },
    { label: 'Total Leads',        value: totalLeads,              sub: 'across all clients' },
    { label: 'Active Clients',     value: activeClients,           sub: 'currently active' },
    { label: 'MRR Estimate',       value: `$ ${mrr.toLocaleString()}`, sub: 'est. monthly revenue' },
  ];

  return (
    <Layout title="Super Admin">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '15px' }}>
          Loading…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* ── Stat cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {statCards.map(card => (
              <div key={card.label} style={CARD}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '30px', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '12px', color: '#d1d5db', marginTop: '6px' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── All Clients Table ── */}
          <div style={CARD}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
              All Clients
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    {['Client Name', 'Plan', 'Status', 'Leads', 'Created', 'Actions'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    clients.map(client => (
                      <ClientRow
                        key={client.id}
                        client={client}
                        onView={() => navigate(`/admin/clients/${client.id}`)}
                        onDeactivate={() => handleDeactivate(client.id)}
                        onActivate={() => handleActivate(client.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Recent Leads ── */}
          <div style={CARD}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
              Recent Leads — All Clients
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr>
                    {['Client', 'Customer', 'Municipality', 'Status', 'Price (kr)', 'Date'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                        No leads yet
                      </td>
                    </tr>
                  ) : (
                    recentLeads.map(lead => (
                      <LeadRow key={lead.id} lead={lead} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </Layout>
  );
}

/* ── Client table row ── */
function ClientRow({ client, onView, onDeactivate, onActivate }) {
  const [hovered, setHovered] = useState(false);
  const isActive = client.active !== false;

  const planColors = {
    starter: { bg: '#f3f4f6', color: '#6b7280' },
    growth:  { bg: '#dbeafe', color: '#1d4ed8' },
    scale:   { bg: '#ede9fe', color: '#6d28d9' },
  };
  const pc = planColors[client.plan] || { bg: '#f3f4f6', color: '#6b7280' };

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? '#f9fafb' : '#fff', transition: 'background-color 0.1s' }}
    >
      <td style={{ ...TD, fontWeight: '600', color: '#111827' }}>{client.name || '—'}</td>
      <td style={TD}>
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
          fontSize: '12px', fontWeight: '600',
          backgroundColor: pc.bg, color: pc.color,
        }}>
          {client.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) : 'Free'}
        </span>
      </td>
      <td style={TD}>
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
          fontSize: '12px', fontWeight: '600',
          backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
          color: isActive ? '#16a34a' : '#dc2626',
        }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td style={{ ...TD, fontWeight: '600' }}>{client.computedLeadCount}</td>
      <td style={{ ...TD, color: '#9ca3af' }}>
        {client.created_at ? new Date(client.created_at).toLocaleDateString('en-GB') : '—'}
      </td>
      <td style={TD}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <ActionBtn label="View"       onClick={onView}       variant="blue"  />
          {isActive
            ? <ActionBtn label="Deactivate" onClick={onDeactivate} variant="red"   />
            : <ActionBtn label="Activate"   onClick={onActivate}   variant="green" />
          }
        </div>
      </td>
    </tr>
  );
}

/* ── Lead table row ── */
function LeadRow({ lead }) {
  const [hovered, setHovered] = useState(false);

  const statusColors = {
    'New':         { bg: '#dbeafe', color: '#1d4ed8' },
    'Contacted':   { bg: '#ede9fe', color: '#6d28d9' },
    'Quoted':      { bg: '#fef3c7', color: '#92400e' },
    'Won':         { bg: '#dcfce7', color: '#16a34a' },
    'Closed Lost': { bg: '#fee2e2', color: '#dc2626' },
  };
  const sc = statusColors[lead.status] || { bg: '#f3f4f6', color: '#6b7280' };

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? '#f9fafb' : '#fff', transition: 'background-color 0.1s' }}
    >
      <td style={{ ...TD, fontWeight: '600', color: '#111827' }}>{lead.clientName}</td>
      <td style={TD}>{lead.customer_name || lead.name || '—'}</td>
      <td style={{ ...TD, color: '#6b7280' }}>{lead.municipality || '—'}</td>
      <td style={TD}>
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
          fontSize: '12px', fontWeight: '600',
          backgroundColor: sc.bg, color: sc.color,
        }}>
          {lead.status || '—'}
        </span>
      </td>
      <td style={{ ...TD, fontWeight: '600' }}>
        {lead.estimated_price ? Number(lead.estimated_price).toLocaleString() : '—'}
      </td>
      <td style={{ ...TD, color: '#9ca3af' }}>
        {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-GB') : '—'}
      </td>
    </tr>
  );
}

/* ── Small action button ── */
function ActionBtn({ label, onClick, variant }) {
  const [hovered, setHovered] = useState(false);
  const schemes = {
    blue:  { base: '#dbeafe', text: '#1d4ed8', hover: '#1d4ed8'  },
    red:   { base: '#fee2e2', text: '#dc2626', hover: '#dc2626'  },
    green: { base: '#dcfce7', text: '#16a34a', hover: '#16a34a'  },
  };
  const s = schemes[variant] || schemes.blue;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '4px 12px', borderRadius: '6px',
        fontSize: '12px', fontWeight: '600',
        backgroundColor: hovered ? s.hover : s.base,
        color: hovered ? '#fff' : s.text,
        border: 'none', cursor: 'pointer',
        transition: 'all 0.15s', fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}
