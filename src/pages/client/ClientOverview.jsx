import ClientLayout from '../../ClientLayout';

const statCards = [
  { label: 'Estimates This Month', value: '24'          },
  { label: 'Customers This Month', value: '18'          },
  { label: 'Avg Estimate Value',   value: '134,500 kr'  },
];

const recentEstimates = [
  { customer: 'Erik Bergström',  email: 'erik.b@mail.se',       price: '148,000 kr', language: 'Swedish', date: '2026-04-17' },
  { customer: 'Sara Lindqvist',  email: 'sara.l@lindqvist.se',  price: '122,500 kr', language: 'English', date: '2026-04-15' },
  { customer: 'Mikael Hansson',  email: 'mikael@hanssonbygg.se',price: '189,000 kr', language: 'Swedish', date: '2026-04-12' },
  { customer: 'Anna Norén',      email: 'anna.noren@teknik.se', price: '98,750 kr',  language: 'Swedish', date: '2026-04-10' },
  { customer: 'Johan Åberg',     email: 'j.aberg@konsult.se',   price: '114,200 kr', language: 'English', date: '2026-04-08' },
];

const columns = ['Customer Name', 'Customer Email', 'Price', 'Language', 'Date'];

export default function ClientOverview() {
  return (
    <ClientLayout title="Overview">

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

      {/* Row 2 — Recent estimates */}
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
            Recent Estimates
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
            {recentEstimates.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.customer}</td>
                <td style={{ ...cell, color: '#64748b' }}>{row.email}</td>
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.price}</td>
                <td style={cell}>{row.language}</td>
                <td style={{ ...cell, color: '#94a3b8' }}>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ClientLayout>
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
