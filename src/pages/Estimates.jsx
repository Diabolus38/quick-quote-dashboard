import { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

const ACCENT = '#0d3d2a';

const statCards = [
  {
    iconBg: ACCENT, iconColor: '#fff', icon: '▤',
    label: 'Total Estimates', value: '143', sub: null,
  },
  {
    iconBg: '#dcfce7', iconColor: '#16a34a', icon: '▤',
    label: 'This Month', value: '38',
    sub: { text: 'vs 29 last month', color: '#16a34a' },
  },
  {
    iconBg: '#dbeafe', iconColor: '#1d4ed8', icon: '◎',
    label: 'Avg Estimate Value', value: '86,700 kr',
    sub: { text: 'across all clients', color: '#9ca3af' },
  },
  {
    iconBg: '#fef9c3', iconColor: '#ca8a04', icon: '⊞',
    label: 'Highest This Month', value: '143,000 kr',
    sub: { text: 'VattSystem', color: '#9ca3af' },
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

const statusStyle = {
  Completed: { backgroundColor: '#dcfce7', color: '#166534' },
  Sent:      { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  Pending:   { backgroundColor: '#fef9c3', color: '#854d0e' },
  Submitted: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
};

const columns = ['Invoice ID', 'Client', 'Customer Name', 'Customer Email', 'Price', 'Language', 'Date', 'Status', 'Actions'];

const filters = ['All', 'This Week', 'This Month'];

function getInitials(name) {
  const words = name.split(' ').filter(w => /[a-zA-ZäåöÄÅÖ]/.test(w));
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Estimates() {
  const [activeFilter, setActiveFilter]   = useState('All');
  const [hoveredRow,   setHoveredRow]     = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [estimates,    setEstimates]      = useState([]);
  const [clientsMap,   setClientsMap]     = useState({});
  const [loading,      setLoading]        = useState(true);
  const [error,        setError]          = useState(null);

  useEffect(() => {
    async function fetchData() {
      const [estResult, cliResult] = await Promise.all([
        supabase.from('estimates').select('*'),
        supabase.from('clients').select('*'),
      ]);

      if (estResult.error || cliResult.error) {
        setError((estResult.error || cliResult.error).message);
        setLoading(false);
        return;
      }

      const map = {};
      (cliResult.data || []).forEach((c, i) => {
        map[c.id] = { name: c.name, paletteIdx: i % avatarPalette.length };
      });

      setClientsMap(map);
      setEstimates(estResult.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return (
    <Layout title="Estimates">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#9ca3af', fontSize: '14px' }}>
        Loading...
      </div>
    </Layout>
  );

  if (error) return (
    <Layout title="Estimates">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#dc2626', fontSize: '14px' }}>
        Failed to load estimates.
      </div>
    </Layout>
  );

  return (
    <Layout title="Estimates">

      {/* ── Top row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.3px' }}>
            Estimates
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>
            All estimates generated across your clients.
          </p>
        </div>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          backgroundColor: ACCENT, color: '#fff',
          border: 'none', borderRadius: '10px',
          padding: '10px 18px', fontSize: '13.5px', fontWeight: '600',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <span style={{ fontSize: '15px', lineHeight: 1 }}>↓</span>
          Export Report
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

      {/* ── Search + filters ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '14px', lineHeight: 0, pointerEvents: 'none' }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by client or customer..."
            style={{
              width: '100%', height: '42px', boxSizing: 'border-box',
              border: '1px solid #e5e7eb', borderRadius: '10px',
              padding: '0 16px 0 40px', fontSize: '13px', color: '#0d1117',
              outline: 'none', fontFamily: 'inherit', backgroundColor: '#fff',
            }}
          />
        </div>

        {/* Period filters */}
        {filters.map((f) => {
          const active = activeFilter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              style={{
                border: active ? 'none' : '1px solid #e5e7eb',
                backgroundColor: active ? ACCENT : '#fff',
                color: active ? '#fff' : '#6b7280',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: active ? '500' : '400',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {f}
            </button>
          );
        })}

        {/* Filter icon button */}
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          border: '1px solid #e5e7eb', borderRadius: '10px',
          padding: '9px 16px', fontSize: '13px', fontWeight: '500',
          backgroundColor: '#fff', color: '#374151',
          cursor: 'pointer', fontFamily: 'inherit',
          height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap',
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
        {estimates.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '160px', color: '#9ca3af', fontSize: '14px' }}>
            No estimates yet.
          </div>
        ) : (
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
              {estimates.map((row, i) => {
                const clientEntry = row.client_id ? clientsMap[row.client_id] : null;
                const clientName  = clientEntry ? clientEntry.name : 'Unknown';
                const av          = clientEntry
                  ? avatarPalette[clientEntry.paletteIdx]
                  : { bg: '#f3f4f6', color: '#374151' };
                const initials    = getInitials(clientName);
                const estId       = (row.id || '').toString().slice(0, 8).toUpperCase();
                const date        = row.created_at ? row.created_at.slice(0, 10) : '—';
                const status      = row.status || 'Submitted';
                const style       = statusStyle[status] ?? { backgroundColor: '#f3f4f6', color: '#374151' };

                return (
                  <tr
                    key={row.id ?? i}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      backgroundColor: hoveredRow === i ? '#fafef9' : 'transparent',
                      borderBottom: i < estimates.length - 1 ? '1px solid #f7f7f7' : 'none',
                    }}
                  >
                    {/* Invoice ID */}
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: '#0d1117', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {estId}
                    </td>

                    {/* Client */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                          backgroundColor: av.bg, color: av.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '700',
                        }}>
                          {initials}
                        </div>
                        <span style={{ fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>{clientName}</span>
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td style={{ padding: '14px 20px', color: '#374151', whiteSpace: 'nowrap' }}>{row.contact_name}</td>

                    {/* Customer Email */}
                    <td style={{ padding: '14px 20px', color: '#6b7280' }}>{row.contact_email}</td>

                    {/* Price */}
                    <td style={{ padding: '14px 20px', color: '#0d1117', fontWeight: '600', whiteSpace: 'nowrap' }}>{row.price}</td>

                    {/* Language */}
                    <td style={{ padding: '14px 20px', color: '#374151' }}>{row.language}</td>

                    {/* Date */}
                    <td style={{ padding: '14px 20px', color: '#6b7280', whiteSpace: 'nowrap' }}>{date}</td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '600',
                        ...style,
                      }}>
                        {status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {[['👁', 'View'], ['✎', 'Edit'], ['↓', 'Download']].map(([symbol, label], ai) => {
                          const key = `${i}-${ai}`;
                          const isHov = hoveredAction === key;
                          return (
                            <button
                              key={label}
                              type="button"
                              title={label}
                              onMouseEnter={() => setHoveredAction(key)}
                              onMouseLeave={() => setHoveredAction(null)}
                              style={{
                                border: 'none', background: 'transparent',
                                cursor: 'pointer', fontSize: '13px',
                                color: isHov ? ACCENT : '#9ca3af',
                                padding: '2px', fontFamily: 'inherit',
                                transition: 'color 0.15s', lineHeight: 1,
                              }}
                            >
                              {symbol}
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
        )}
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
