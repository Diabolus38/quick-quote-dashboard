import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

const ACCENT = '#0d3d2a';

const avatarPalette = [
  { bg: '#dcfce7', color: '#166534' },
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#fef9c3', color: '#854d0e' },
  { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#ccfbf1', color: '#0d9488' },
  { bg: '#fee2e2', color: '#991b1b' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#f3f4f6', color: '#374151' },
];

const columns = ['Client', 'Contact Email', 'Plan', 'Leads', 'Status', 'Actions'];

function getInitials(name) {
  const words = name.split(' ').filter(w => /[a-zA-ZäåöÄÅÖ]/.test(w));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Clients() {
  const navigate = useNavigate();

  const [clients,       setClients]       = useState([]);
  const [leadCounts,    setLeadCounts]    = useState({});
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [hoveredRow,    setHoveredRow]    = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

  // Modal state
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
    setModalLoading(true);
    setModalError('');
    const { error } = await supabase.from('clients').insert({ name: modalName.trim(), email: modalEmail.trim(), plan: modalPlan, active: true });
    if (error) { setModalError(error.message); setModalLoading(false); return; }
    setShowModal(false);
    setModalName(''); setModalEmail(''); setModalPlan('starter');
    fetchAll();
    setModalLoading(false);
  }

  function closeModal() {
    setShowModal(false);
    setModalName(''); setModalEmail(''); setModalPlan('starter'); setModalError('');
  }

  // Derived stat cards
  const totalClients  = clients.length;
  const activeClients = clients.filter(c => c.active).length;
  const now = new Date();
  const newThisMonth  = clients.filter(c => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const statCards = [
    { iconBg: ACCENT,    iconColor: '#fff',     icon: '◎', label: 'Total Clients',       value: loading ? '—' : String(totalClients)  },
    { iconBg: '#dbeafe', iconColor: '#1d4ed8',  icon: '◎', label: 'Active Clients',      value: loading ? '—' : String(activeClients), sub: loading ? null : { text: `${totalClients - activeClients} inactive`, color: '#9ca3af' } },
    { iconBg: '#fef9c3', iconColor: '#ca8a04',  icon: '⊞', label: 'New This Month',      value: loading ? '—' : String(newThisMonth),  sub: { text: 'vs prev month', color: '#16a34a' } },
    { iconBg: '#dcfce7', iconColor: '#16a34a',  icon: '▤', label: 'Avg Leads / Client',  value: loading || totalClients === 0 ? '—' : (Object.values(leadCounts).reduce((a, b) => a + b, 0) / totalClients).toFixed(1), sub: { text: 'per client', color: '#9ca3af' } },
  ];

  if (loading) return (
    <Layout title="Clients">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
    </Layout>
  );

  if (error) return (
    <Layout title="Clients">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#dc2626', fontSize: '14px' }}>Failed to load clients.</div>
    </Layout>
  );

  return (
    <Layout title="Clients">

      {/* ── Top row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.3px' }}>Clients</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>Manage all your active clients.</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: ACCENT, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add Client
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
        {statCards.map((card) => (
          <div key={card.label} style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '14px', padding: '20px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: card.iconColor }}>{card.icon}</div>
            <p style={{ margin: '16px 0 4px', fontSize: '12px', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</p>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
            {card.sub && <p style={{ margin: '6px 0 0', fontSize: '12px', color: card.sub.color, fontWeight: '500' }}>{card.sub.text}</p>}
          </div>
        ))}
      </div>

      {/* ── Search + filter ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '14px', lineHeight: 0, pointerEvents: 'none' }}><SearchIcon /></span>
          <input type="text" placeholder="Search clients..." style={{ width: '100%', height: '42px', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0 16px 0 40px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'inherit', backgroundColor: '#fff' }} />
        </div>
        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '7px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', backgroundColor: '#fff', color: '#374151', cursor: 'pointer', fontFamily: 'inherit', height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '15px', lineHeight: 1 }}>≡</span> Filter
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ marginTop: '16px', backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#fafafa' }}>
              {columns.map((col) => (
                <th key={col} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client, i) => {
              const av       = avatarPalette[i % avatarPalette.length];
              const initials = getInitials(client.name || '');
              return (
                <tr key={client.id ?? i} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)} style={{ backgroundColor: hoveredRow === i ? '#fafef9' : 'transparent', borderBottom: i < clients.length - 1 ? '1px solid #f7f7f7' : 'none' }}>

                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, backgroundColor: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>{initials}</div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#0d1117' }}>{client.name}</div>
                    </div>
                  </td>

                  <td style={{ padding: '14px 20px', color: '#6b7280' }}>{client.email}</td>

                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: client.plan === 'scale' ? '#dcfce7' : client.plan === 'growth' ? '#ede9fe' : '#dbeafe', color: client.plan === 'scale' ? '#166534' : client.plan === 'growth' ? '#7c3aed' : '#1d4ed8' }}>
                      {client.plan || 'starter'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px', color: '#374151', fontWeight: '500' }}>
                    {leadCounts[client.id] ?? 0}
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: client.active ? '#dcfce7' : '#f3f4f6', color: client.active ? '#166534' : '#6b7280' }}>
                      {client.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { label: 'View',   onClick: () => navigate(`/admin/clients/${client.id}`) },
                        { label: 'Edit',   onClick: () => {} },
                        { label: 'Remove', onClick: () => {} },
                      ].map(({ label, onClick }, ai) => {
                        const key = `${i}-${ai}`;
                        return (
                          <button key={label} type="button" onClick={onClick} onMouseEnter={() => setHoveredAction(key)} onMouseLeave={() => setHoveredAction(null)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '11px', fontWeight: '500', color: hoveredAction === key ? ACCENT : '#9ca3af', padding: '4px 6px', fontFamily: 'inherit', transition: 'color 0.15s' }}>
                            {label}
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
        {clients.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>No clients yet.</div>
        )}
      </div>

      {/* ── Add Client Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '440px', boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: '700', color: '#0d1117' }}>Add New Client</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>Company Name</label>
              <input type="text" value={modalName} onChange={e => setModalName(e.target.value)} placeholder="Acme AB" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>Email</label>
              <input type="email" value={modalEmail} onChange={e => setModalEmail(e.target.value)} placeholder="contact@acme.se" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>Plan</label>
              <select value={modalPlan} onChange={e => setModalPlan(e.target.value)} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', backgroundColor: '#fff', color: '#0d1117' }}>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="scale">Scale</option>
              </select>
            </div>

            {modalError && <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '12px' }}>{modalError}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={closeModal} style={{ border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#374151', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button type="button" onClick={handleAddClient} disabled={modalLoading} style={{ backgroundColor: ACCENT, color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: modalLoading ? 'not-allowed' : 'pointer', opacity: modalLoading ? 0.7 : 1, fontFamily: 'inherit' }}>
                {modalLoading ? 'Saving...' : 'Save Client'}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="6" r="4.5" />
      <line x1="9.5" y1="9.5" x2="13" y2="13" />
    </svg>
  );
}
