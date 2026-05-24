import { useState } from 'react';
import Layout from '../Layout';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e8ede8', boxShadow: '0 2px 12px rgba(13,31,18,0.06)', padding: '24px' };

const statCards = [
  { label: 'Total Revenue', value: '12,400 kr', sub: null,                            color: '#ecfccb', textColor: '#3f6212' },
  { label: 'Collected',     value: '9,800 kr',  sub: { text: 'Paid transactions',  color: '#16a34a' }, color: '#dcfce7', textColor: '#166534' },
  { label: 'Pending',       value: '1,800 kr',  sub: { text: 'Awaiting payment',   color: '#d97706' }, color: '#fef9c3', textColor: '#854d0e' },
  { label: 'Outstanding',   value: '800 kr',    sub: { text: 'Overdue payments',   color: '#dc2626' }, color: '#fee2e2', textColor: '#991b1b' },
];

const invoices = [
  { id: 'INV-2401', client: 'Acme AB',     service: 'New Installation',    amount: '125,000 kr', method: 'Bank Transfer', date: '2026-04-14', status: 'Paid'        },
  { id: 'INV-2402', client: 'NordBygg',    service: 'Renovation',          amount: '87,500 kr',  method: 'Invoice',       date: '2026-04-13', status: 'Paid'        },
  { id: 'INV-2403', client: 'VattSystem',  service: 'WC + BDT System',     amount: '143,000 kr', method: 'Bank Transfer', date: '2026-04-12', status: 'Pending'     },
  { id: 'INV-2404', client: 'EkoTeknik',   service: 'Underground Install', amount: '96,000 kr',  method: 'Invoice',       date: '2026-04-10', status: 'Paid'        },
  { id: 'INV-2405', client: 'MarkVatten',  service: 'Pump Installation',   amount: '78,000 kr',  method: 'Credit',        date: '2026-04-09', status: 'Outstanding' },
  { id: 'INV-2406', client: 'Bergström AB',service: 'Municipality Plan',   amount: '34,000 kr',  method: 'Invoice',       date: '2026-04-07', status: 'Paid'        },
];

const statusStyle = {
  Paid:        { backgroundColor: '#dcfce7', color: '#166534' },
  Pending:     { backgroundColor: '#fef9c3', color: '#854d0e' },
  Outstanding: { backgroundColor: '#fee2e2', color: '#991b1b' },
};

const COLUMNS = ['Invoice ID', 'Client', 'Service', 'Amount', 'Payment Method', 'Date', 'Status', 'Actions'];

export default function Billing() {
  const [hoveredRow,    setHoveredRow]    = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

  return (
    <Layout title="Billing">
      <div style={{ fontFamily: FONT }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Billing &amp; Invoices</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>6 transactions this month</p>
          </div>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            ↓ Export Report
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(card => (
            <div key={card.label} style={CARD}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '16px', fontWeight: '700', color: card.textColor }}>$</div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
              {card.sub && <p style={{ margin: '6px 0 0', fontSize: '12px', color: card.sub.color, fontWeight: '500' }}>{card.sub.text}</p>}
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '0 14px', height: '42px', backgroundColor: '#fff' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5" /><line x1="9.5" y1="9.5" x2="13" y2="13" /></svg>
            <input type="text" placeholder="Search by client name or invoice ID…" style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13.5px', color: '#0d1117', width: '100%', fontFamily: FONT }} />
          </div>
          <button type="button" style={{ border: '1px solid #e8ede8', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '500', backgroundColor: '#fff', color: '#4b5563', cursor: 'pointer', fontFamily: FONT, height: '42px' }}>
            ≡ Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fbf9' }}>
                {COLUMNS.map(col => (
                  <th key={col} style={{ textAlign: 'left', padding: '12px 20px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8', whiteSpace: 'nowrap' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((row, i) => (
                <tr key={row.id} onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                  style={{ backgroundColor: hoveredRow === i ? '#f9fbf9' : '#fff', borderBottom: i < invoices.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0d1117' }}>{row.id}</td>
                  <td style={{ padding: '14px 20px', color: '#4b5563', fontWeight: '500' }}>{row.client}</td>
                  <td style={{ padding: '14px 20px', color: '#4b5563' }}>{row.service}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '600', color: '#0d1117' }}>{row.amount}</td>
                  <td style={{ padding: '14px 20px', color: '#4b5563' }}>{row.method}</td>
                  <td style={{ padding: '14px 20px', color: '#9ca3af' }}>{row.date}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', ...statusStyle[row.status] }}>{row.status}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[{ sym: '👁', lbl: 'View' }, { sym: '⎙', lbl: 'Print' }, { sym: '↓', lbl: 'Save' }].map((action, ai) => {
                        const key = `${i}-${ai}`;
                        return (
                          <button key={ai} type="button" title={action.lbl}
                            onMouseEnter={() => setHoveredAction(key)} onMouseLeave={() => setHoveredAction(null)}
                            style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: hoveredAction === key ? '#f4f6f4' : 'transparent', cursor: 'pointer', fontSize: '13px', color: hoveredAction === key ? PRIMARY : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                            {action.sym}
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

      </div>
    </Layout>
  );
}
