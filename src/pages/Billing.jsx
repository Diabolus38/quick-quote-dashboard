import { useState } from 'react';
import Layout from '../Layout';

const ACCENT = '#0d3d2a';

const statCards = [
  {
    iconBg: ACCENT, iconColor: '#fff',
    label: 'Total Revenue', value: '12,400 kr',
    sub: null,
  },
  {
    iconBg: ACCENT, iconColor: '#fff',
    label: 'Collected', value: '9,800 kr',
    sub: { text: 'Paid transactions', color: '#16a34a' },
  },
  {
    iconBg: '#fef3c7', iconColor: '#d97706',
    label: 'Pending', value: '1,800 kr',
    sub: { text: 'Awaiting payment', color: '#d97706' },
  },
  {
    iconBg: '#fee2e2', iconColor: '#dc2626',
    label: 'Outstanding', value: '800 kr',
    sub: { text: 'Overdue payments', color: '#dc2626' },
  },
];

const invoices = [
  { id: 'INV-2401', client: 'Acme AB',       service: 'New Installation',      amount: '125,000 kr', method: 'Bank Transfer', date: '2026-04-14', status: 'Paid'        },
  { id: 'INV-2402', client: 'NordBygg',       service: 'Renovation',            amount: '87,500 kr',  method: 'Invoice',       date: '2026-04-13', status: 'Paid'        },
  { id: 'INV-2403', client: 'VattSystem',     service: 'WC + BDT System',       amount: '143,000 kr', method: 'Bank Transfer', date: '2026-04-12', status: 'Pending'     },
  { id: 'INV-2404', client: 'EkoTeknik',      service: 'Underground Install',   amount: '96,000 kr',  method: 'Invoice',       date: '2026-04-10', status: 'Paid'        },
  { id: 'INV-2405', client: 'MarkVatten',     service: 'Pump Installation',     amount: '78,000 kr',  method: 'Credit',        date: '2026-04-09', status: 'Outstanding' },
  { id: 'INV-2406', client: 'Bergström AB',   service: 'Municipality Planning', amount: '34,000 kr',  method: 'Invoice',       date: '2026-04-07', status: 'Paid'        },
];

const statusStyle = {
  Paid:        { backgroundColor: '#dcfce7', color: '#166534' },
  Pending:     { backgroundColor: '#fef9c3', color: '#854d0e' },
  Outstanding: { backgroundColor: '#fee2e2', color: '#991b1b' },
};

const columns = ['Invoice ID', 'Client', 'Service', 'Amount', 'Payment Method', 'Date', 'Status', 'Actions'];

export default function Billing() {
  const [hoveredRow, setHoveredRow]   = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null); // `${rowIdx}-${actionIdx}`

  return (
    <Layout title="Billing">

      {/* ── Top bar row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.3px' }}>
            Billing &amp; Invoices
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>
            6 transactions this month
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
              fontSize: '18px', color: card.iconColor, fontWeight: '700',
            }}>
              $
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

      {/* ── Search + filter row ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px', alignItems: 'center' }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
          border: '1px solid #e5e7eb', borderRadius: '10px',
          height: '42px', padding: '0 16px', backgroundColor: '#fff',
        }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by client name or invoice ID..."
            style={{
              border: 'none', outline: 'none', background: 'none',
              fontSize: '13px', color: '#0d1117', width: '100%', fontFamily: 'inherit',
            }}
          />
        </div>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          border: '1px solid #e5e7eb', borderRadius: '10px',
          padding: '9px 16px', fontSize: '13px', fontWeight: '500',
          backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap', height: '42px',
          boxSizing: 'border-box',
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
            {invoices.map((row, i) => (
              <tr
                key={row.id}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  backgroundColor: hoveredRow === i ? '#fafef9' : 'transparent',
                  borderBottom: i < invoices.length - 1 ? '1px solid #f7f7f7' : 'none',
                }}
              >
                <td style={{ padding: '14px 20px', fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>
                  {row.id}
                </td>
                <td style={{ padding: '14px 20px', color: '#374151' }}>{row.client}</td>
                <td style={{ padding: '14px 20px', color: '#374151' }}>{row.service}</td>
                <td style={{ padding: '14px 20px', color: '#374151', fontWeight: '500', whiteSpace: 'nowrap' }}>{row.amount}</td>
                <td style={{ padding: '14px 20px', color: '#374151' }}>{row.method}</td>
                <td style={{ padding: '14px 20px', color: '#374151', whiteSpace: 'nowrap' }}>{row.date}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: '600',
                    ...statusStyle[row.status],
                  }}>
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { symbol: '👁',  label: 'View'  },
                      { symbol: '⎙',  label: 'Print' },
                      { symbol: '↓',  label: 'Save'  },
                    ].map((action, ai) => {
                      const key = `${i}-${ai}`;
                      const isHov = hoveredAction === key;
                      return (
                        <button
                          key={ai}
                          type="button"
                          title={action.label}
                          onMouseEnter={() => setHoveredAction(key)}
                          onMouseLeave={() => setHoveredAction(null)}
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            border: 'none', background: 'transparent',
                            cursor: 'pointer', fontSize: '13px',
                            color: isHov ? ACCENT : '#9ca3af',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'color 0.15s',
                          }}
                        >
                          {action.symbol}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
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
