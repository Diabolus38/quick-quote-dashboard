import { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

const ACCENT = '#0d3d2a';

const statCards = [
  {
    iconBg: ACCENT, iconColor: '#fff', icon: '◎',
    label: 'Total Clients', value: '8',
    sub: null,
  },
  {
    iconBg: '#dbeafe', iconColor: '#1d4ed8', icon: '◎',
    label: 'Active Clients', value: '6',
    sub: { text: '2 inactive', color: '#9ca3af' },
  },
  {
    iconBg: '#fef9c3', iconColor: '#ca8a04', icon: '⊞',
    label: 'New This Month', value: '2',
    sub: { text: 'vs 1 last month', color: '#16a34a' },
  },
  {
    iconBg: '#dcfce7', iconColor: '#16a34a', icon: '▤',
    label: 'Avg Estimates / Client', value: '17.9',
    sub: { text: 'per client this month', color: '#9ca3af' },
  },
];

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

const columns = ['Client', 'Contact Email', 'Plan', 'Estimates This Month', 'Status', 'Actions'];

function getInitials(name) {
  const words = name.split(' ').filter(w => /[a-zA-ZäåöÄÅÖ]/.test(w));
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Clients() {
  const [clients,       setClients]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [hoveredRow,    setHoveredRow]    = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

  useEffect(() => {
    async function fetchClients() {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) {
        setError(error.message);
      } else {
        setClients(data);
      }
      setLoading(false);
    }
    fetchClients();
  }, []);

  if (loading) return (
    <Layout title="Clients">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#9ca3af', fontSize: '14px' }}>
        Loading...
      </div>
    </Layout>
  );

  if (error) return (
    <Layout title="Clients">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#dc2626', fontSize: '14px' }}>
        Failed to load clients.
      </div>
    </Layout>
  );

  return (
    <Layout title="Clients">

      {/* ── Top row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.3px' }}>
            Clients
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>
            Manage all your active clients.
          </p>
        </div>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: ACCENT, color: '#fff',
          border: 'none', borderRadius: '10px',
          padding: '10px 18px', fontSize: '13.5px', fontWeight: '600',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          + Add Client
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
        {statCards.map((card) => (
          <div key={card.label} style={{
            backgroundColor: '#fff', border: '1px solid #f0f0f0',
            borderRadius: '14px', padding: '20px',
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              backgroundColor: card.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', color: card.iconColor,
            }}>
              {card.icon}
            </div>
            <p style={{ margin: '16px 0 4px', fontSize: '12px', color: '#9ca3af', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {card.label}
            </p>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {card.value}
            </p>
            {card.sub && (
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: card.sub.color, fontWeight: '500' }}>
                {card.sub.text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Search + filter ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px', alignItems: 'center' }}>
        <div style={{
          flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
        }}>
          <span style={{ position: 'absolute', left: '14px', lineHeight: 0, pointerEvents: 'none' }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search clients..."
            style={{
              width: '100%', height: '42px', boxSizing: 'border-box',
              border: '1px solid #e5e7eb', borderRadius: '10px',
              padding: '0 16px 0 40px', fontSize: '13px', color: '#0d1117',
              outline: 'none', fontFamily: 'inherit', backgroundColor: '#fff',
            }}
          />
        </div>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          border: '1px solid #e5e7eb', borderRadius: '10px',
          padding: '9px 16px', fontSize: '13px', fontWeight: '500',
          backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
          fontFamily: 'inherit', height: '42px', boxSizing: 'border-box',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '15px', lineHeight: 1 }}>≡</span>
          Filter
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{
        marginTop: '16px', backgroundColor: '#fff',
        border: '1px solid #f0f0f0', borderRadius: '14px', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#fafafa' }}>
              {columns.map((col) => (
                <th key={col} style={{
                  textAlign: 'left', padding: '12px 20px',
                  fontSize: '11px', fontWeight: '600', color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((client, i) => {
              const av       = avatarPalette[i % avatarPalette.length];
              const initials = getInitials(client.name || '');
              return (
                <tr
                  key={client.id ?? i}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    backgroundColor: hoveredRow === i ? '#fafef9' : 'transparent',
                    borderBottom: i < clients.length - 1 ? '1px solid #f7f7f7' : 'none',
                  }}
                >
                  {/* Client */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        backgroundColor: av.bg, color: av.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '700',
                      }}>
                        {initials}
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#0d1117' }}>{client.name}</div>
                    </div>
                  </td>

                  {/* Contact Email */}
                  <td style={{ padding: '14px 20px', color: '#6b7280' }}>{client.email}</td>

                  {/* Plan */}
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '600',
                      backgroundColor: client.plan === 'Pro' ? '#dcfce7' : '#dbeafe',
                      color: client.plan === 'Pro' ? '#166534' : '#1d4ed8',
                    }}>
                      {client.plan}
                    </span>
                  </td>

                  {/* Estimates */}
                  <td style={{ padding: '14px 20px', color: '#374151', fontWeight: '500' }}>
                    {client.estimates}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '600',
                      backgroundColor: client.active ? '#dcfce7' : '#f3f4f6',
                      color: client.active ? '#166534' : '#6b7280',
                    }}>
                      {client.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['View', 'Edit', 'Remove'].map((action, ai) => {
                        const key = `${i}-${ai}`;
                        const isHov = hoveredAction === key;
                        return (
                          <button
                            key={action}
                            type="button"
                            onMouseEnter={() => setHoveredAction(key)}
                            onMouseLeave={() => setHoveredAction(null)}
                            style={{
                              border: 'none', background: 'transparent',
                              cursor: 'pointer', fontSize: '11px', fontWeight: '500',
                              color: isHov ? ACCENT : '#9ca3af',
                              padding: '4px 6px', fontFamily: 'inherit',
                              transition: 'color 0.15s',
                            }}
                          >
                            {action}
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
      </div>
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
