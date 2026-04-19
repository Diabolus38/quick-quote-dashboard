import Layout from '../Layout';

const statCards = [
  { label: 'Monthly Revenue',  value: '12,400 kr' },
  { label: 'Pending Invoices', value: '3' },
  { label: 'Overdue Invoices', value: '1' },
];

const invoices = [
  { client: 'Bergström AB',     month: 'April 2026',  used: 34, fixed: '500 kr',  usage: '680 kr',  total: '1,180 kr', status: 'Paid'    },
  { client: 'Hansson Bygg',     month: 'April 2026',  used: 28, fixed: '500 kr',  usage: '560 kr',  total: '1,060 kr', status: 'Pending' },
  { client: 'Lindqvist & Co',   month: 'April 2026',  used: 17, fixed: '300 kr',  usage: '340 kr',  total: '640 kr',   status: 'Paid'    },
  { client: 'Norén Teknik',     month: 'April 2026',  used: 21, fixed: '300 kr',  usage: '420 kr',  total: '720 kr',   status: 'Overdue' },
  { client: 'Åberg Konsult',    month: 'March 2026',  used: 14, fixed: '300 kr',  usage: '280 kr',  total: '580 kr',   status: 'Paid'    },
  { client: 'Dahl Förvaltning', month: 'March 2026',  used:  2, fixed: '150 kr',  usage: '40 kr',   total: '190 kr',   status: 'Pending' },
];

const columns = ['Client Name', 'Month', 'Estimates Used', 'Fixed Fee', 'Usage Fee', 'Total', 'Status', 'Actions'];

const statusStyles = {
  Paid:    { backgroundColor: '#dcfce7', color: '#16a34a' },
  Pending: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  Overdue: { backgroundColor: '#fee2e2', color: '#dc2626' },
};

export default function Billing() {
  return (
    <Layout title="Billing">

      {/* Row 1 — Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      {/* Row 2 — Invoice table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
            Invoice Overview
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              {columns.map((col) => (
                <th key={col} style={{
                  textAlign: 'left',
                  padding: '11px 24px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.client}</td>
                <td style={{ ...cell, color: '#64748b' }}>{row.month}</td>
                <td style={cell}>{row.used}</td>
                <td style={cell}>{row.fixed}</td>
                <td style={cell}>{row.usage}</td>
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.total}</td>
                <td style={cell}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    ...statusStyles[row.status],
                  }}>
                    {row.status}
                  </span>
                </td>
                <td style={cell}>
                  <button type="button" style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}>
                    Send Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <p style={{
        margin: '0 0 12px',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.7px',
        textTransform: 'uppercase',
        color: '#94a3b8',
      }}>
        {label}
      </p>
      <p style={{
        margin: 0,
        fontSize: '28px',
        fontWeight: '700',
        color: '#0f172a',
        letterSpacing: '-0.5px',
        lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  );
}

const cell = {
  padding: '14px 24px',
  color: '#334155',
  verticalAlign: 'middle',
};
