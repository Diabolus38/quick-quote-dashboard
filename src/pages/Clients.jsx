import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

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

const COLUMNS = ['Client', 'Contact Email', 'Plan', 'Leads', 'Status', 'Actions'];

function getInitials(name) {
  const words = name.split(' ').filter(w => /[a-zA-ZäåöÄÅÖ]/.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e8ede8', boxShadow: '0 2px 12px rgba(13,31,18,0.06)', padding: '24px' };

export default function Clients() {
  const navigate = useNavigate();

  const [clients,    setClients]    = useState([]);
  const [leadCounts, setLeadCounts] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [showModal,    setShowModal]    = useState(false);
  const [modalName,    setModalName]    = useState('');
  const [modalEmail,   setModalEmail]   = useState('');
  const [modalPlan,    setModalPlan]    = useState('starter');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError,   setModalError]   = useState('');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: clientData, error: clientErr }, { data: leadsData }] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('leads').select('client_id'),
    ]);
    if (clientErr) { setError(clientErr.message); setLoading(false); return; }
    setClients(clientData || []);
    const counts = {};
    (leadsData || []).forEach(l => { counts[l.client_id] = (counts[l.client_id] || 0) + 1; });
    setLeadCounts(counts);
    setLoading(false);
  }

  async function handleAddClient() {
    if (!modalName.trim() || !modalEmail.trim()) { setModalError('Name and email are required.'); return; }
    setModalLoading(true); setModalError('');
    const { error } = await supabase.from('clients').insert({ name: modalName.trim(), email: modalEmail.trim(), plan: modalPlan, active: true });
    if (error) { setModalError(error.message); setModalLoading(false); return; }
    setShowModal(false); setModalName(''); setModalEmail(''); setModalPlan('starter');
    fetchAll(); setModalLoading(false);
  }

  function closeModal() {
    setShowModal(false); setModalName(''); setModalEmail(''); setModalPlan('starter'); setModalError('');
  }

  const totalClients  = clients.length;
  const activeClients = clients.filter(c => c.active).length;
  const now = new Date();
  const newThisMonth  = clients.filter(c => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const avgLeads = totalClients > 0
    ? (Object.values(leadCounts).reduce((a, b) => a + b, 0) / totalClients).toFixed(1)
    : '—';

  const statCards = [
    { label: 'Total Clients',      value: loading ? '—' : String(totalClients),  color: '#ecfccb', textColor: '#3f6212'  },
    { label: 'Active Clients',     value: loading ? '—' : String(activeClients), color: '#dbeafe', textColor: '#1d4ed8'  },
    { label: 'New This Month',     value: loading ? '—' : String(newThisMonth),  color: '#fef9c3', textColor: '#854d0e'  },
    { label: 'Avg Leads / Client', value: loading ? '—' : avgLeads,              color: '#dcfce7', textColor: '#166534'  },
  ];

  if (loading) return <Layout title="Clients"><div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af', fontSize: '14px', fontFamily: FONT }}>Loading…</div></Layout>;
  if (error)   return <Layout title="Clients"><div style={{ textAlign: 'center', padding: '80px', color: '#dc2626', fontSize: '14px', fontFamily: FONT }}>Failed to load clients.</div></Layout>;

  return (
    <Layout title="Clients">
      <div style={{ fontFamily: FONT }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Clients</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Manage all your active clients.</p>
          </div>
          <button type="button" onClick={() => setShowModal(true)} style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            + Add Client
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(card => (
            <div key={card.label} style={CARD}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '18px', color: card.textColor }}>◎</span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '0 14px', height: '42px', backgroundColor: '#fff' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5" /><line x1="9.5" y1="9.5" x2="13" y2="13" /></svg>
            <input type="text" placeholder="Search clients…" style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13.5px', color: '#0d1117', width: '100%', fontFamily: FONT }} />
          </div>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '7px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', backgroundColor: '#fff', color: '#4b5563', cursor: 'pointer', fontFamily: FONT, height: '42px', boxSizing: 'border-box' }}>
            ≡ Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fbf9' }}>
                {COLUMNS.map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client, i) => {
                const av = avatarPalette[i % avatarPalette.length];
                const initials = getInitials(client.name || '');
                const planColor = { scale: { bg: '#dcfce7', color: '#166534' }, growth: { bg: '#ede9fe', color: '#7c3aed' }, starter: { bg: '#dbeafe', color: '#1d4ed8' } };
                const pc = planColor[client.plan] || planColor.starter;
                return (
                  <tr key={client.id ?? i} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                    style={{ backgroundColor: hoveredRow === i ? '#f9fbf9' : '#fff', borderBottom: i < clients.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, backgroundColor: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>{initials}</div>
                        <span style={{ fontWeight: '600', color: '#0d1117' }}>{client.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#4b5563' }}>{client.email}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: pc.bg, color: pc.color }}>
                        {client.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) : 'Starter'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#0d1117', fontWeight: '600' }}>{leadCounts[client.id] ?? 0}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: client.active ? '#dcfce7' : '#f3f4f6', color: client.active ? '#166534' : '#6b7280' }}>
                        {client.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" onClick={() => navigate(`/admin/clients/${client.id}`)} style={{ padding: '5px 12px', fontSize: '12px', fontWeight: '600', backgroundColor: '#ecfccb', color: '#3f6212', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT }}>View</button>
                        <button type="button" style={{ padding: '5px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: '#f4f6f4', color: '#4b5563', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT }}>Edit</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {clients.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>No clients yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Client Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '36px', width: '440px', boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: FONT }}>
              <p style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>Add New Client</p>
              {[
                { label: 'Company Name', type: 'text',  value: modalName,  onChange: setModalName,  placeholder: 'Acme AB' },
                { label: 'Email',        type: 'email', value: modalEmail, onChange: setModalEmail, placeholder: 'contact@acme.se' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{f.label}</label>
                  <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder}
                    style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', outline: 'none', fontFamily: FONT }} />
                </div>
              ))}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Plan</label>
                <select value={modalPlan} onChange={e => setModalPlan(e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', outline: 'none', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117' }}>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="scale">Scale</option>
                </select>
              </div>
              {modalError && <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '12px' }}>{modalError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={closeModal} style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
                <button type="button" onClick={handleAddClient} disabled={modalLoading} style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: modalLoading ? 'not-allowed' : 'pointer', opacity: modalLoading ? 0.7 : 1, fontFamily: FONT }}>
                  {modalLoading ? 'Saving…' : 'Save Client'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
