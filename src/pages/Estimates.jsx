import { useState } from 'react';
import Layout from '../Layout';

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

const avatarColors = {
  'Acme AB':        { bg: '#dcfce7', color: '#166534' },
  'NordBygg':       { bg: '#dbeafe', color: '#1d4ed8' },
  'VattSystem':     { bg: '#fef9c3', color: '#854d0e' },
  'EkoTeknik':      { bg: '#ede9fe', color: '#7c3aed' },
  'MarkVatten':     { bg: '#ccfbf1', color: '#0d9488' },
  'Bergström AB':   { bg: '#fee2e2', color: '#991b1b' },
  'Lindqvist & Co': { bg: '#fce7f3', color: '#9d174d' },
  'Hansson Bygg':   { bg: '#f3f4f6', color: '#374151' },
};

const estimates = [
  { id: 'EST-001', client: 'Acme AB',        customer: 'Erik Bergström',   email: 'erik@bergstrom.se',   price: '125,000 kr', lang: 'Swedish', date: '2026-04-14', status: 'Completed' },
  { id: 'EST-002', client: 'NordBygg',        customer: 'Anna Lindqvist',   email: 'anna@lindqvist.se',   price: '87,500 kr',  lang: 'Swedish', date: '2026-04-13', status: 'Sent'      },
  { id: 'EST-003', client: 'VattSystem',      customer: 'Johan Karlsson',   email: 'johan@karlsson.se',   price: '143,000 kr', lang: 'English', date: '2026-04-12', status: 'Pending'   },
  { id: 'EST-004', client: 'EkoTeknik',       customer: 'Maria Svensson',   email: 'maria@svensson.se',   price: '96,000 kr',  lang: 'German',  date: '2026-04-11', status: 'Completed' },
  { id: 'EST-005', client: 'MarkVatten',      customer: 'Lars Nilsson',     email: 'lars@nilsson.se',     price: '78,000 kr',  lang: 'Swedish', date: '2026-04-10', status: 'Completed' },
  { id: 'EST-006', client: 'Bergström AB',    customer: 'Karin Johansson',  email: 'karin@johansson.se',  price: '112,000 kr', lang: 'English', date: '2026-04-09', status: 'Sent'      },
  { id: 'EST-007', client: 'Lindqvist & Co',  customer: 'Per Andersson',    email: 'per@andersson.se',    price: '67,500 kr',  lang: 'Swedish', date: '2026-04-08', status: 'Pending'   },
  { id: 'EST-008', client: 'Hansson Bygg',    customer: 'Sofia Eriksson',   email: 'sofia@eriksson.se',   price: '134,000 kr', lang: 'German',  date: '2026-04-07', status: 'Completed' },
  { id: 'EST-009', client: 'Acme AB',         customer: 'Magnus Holm',      email: 'magnus@holm.se',      price: '89,000 kr',  lang: 'Swedish', date: '2026-04-06', status: 'Sent'      },
  { id: 'EST-010', client: 'VattSystem',      customer: 'Ingrid Berg',      email: 'ingrid@berg.se',      price: '156,000 kr', lang: 'English', date: '2026-04-05', status: 'Completed' },
];

const statusStyle = {
  Completed: { backgroundColor: '#dcfce7', color: '#166534' },
  Sent:      { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  Pending:   { backgroundColor: '#fef9c3', color: '#854d0e' },
};

const columns = ['Invoice ID', 'Client', 'Customer Name', 'Customer Email', 'Price', 'Language', 'Date', 'Status', 'Actions'];

const filters = ['All', 'This Week', 'This Month'];

export default function Estimates() {
  const [activeFilter, setActiveFilter]   = useState('All');
  const [hoveredRow,   setHoveredRow]     = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

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
              const av       = avatarColors[row.client] ?? { bg: '#f3f4f6', color: '#374151' };
              const initials = row.client.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    backgroundColor: hoveredRow === i ? '#fafef9' : 'transparent',
                    borderBottom: i < estimates.length - 1 ? '1px solid #f7f7f7' : 'none',
                  }}
                >
                  {/* Invoice ID */}
                  <td style={{ padding: '14px 20px', fontWeight: '600', color: '#0d1117', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {row.id}
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
                      <span style={{ fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>{row.client}</span>
                    </div>
                  </td>

                  {/* Customer Name */}
                  <td style={{ padding: '14px 20px', color: '#374151', whiteSpace: 'nowrap' }}>{row.customer}</td>

                  {/* Customer Email */}
                  <td style={{ padding: '14px 20px', color: '#6b7280' }}>{row.email}</td>

                  {/* Price */}
                  <td style={{ padding: '14px 20px', color: '#0d1117', fontWeight: '600', whiteSpace: 'nowrap' }}>{row.price}</td>

                  {/* Language */}
                  <td style={{ padding: '14px 20px', color: '#374151' }}>{row.lang}</td>

                  {/* Date */}
                  <td style={{ padding: '14px 20px', color: '#6b7280', whiteSpace: 'nowrap' }}>{row.date}</td>

                  {/* Status */}
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '600',
                      ...statusStyle[row.status],
                    }}>
                      {row.status}
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
