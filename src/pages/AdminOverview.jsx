import Layout from '../Layout';

const statCards = [
  { label: 'Total Clients', value: '8' },
  { label: 'Estimates This Month', value: '143' },
  { label: 'Revenue This Month', value: '12,400 kr' },
  { label: 'Pending Invoices', value: '3' },
];

const recentEstimates = [
  { client: 'Bergström AB',    customer: 'Erik Bergström',  price: '4,200 kr', date: '2026-04-17' },
  { client: 'Lindqvist & Co', customer: 'Sara Lindqvist',  price: '1,850 kr', date: '2026-04-15' },
  { client: 'Hansson Bygg',   customer: 'Mikael Hansson',  price: '9,100 kr', date: '2026-04-12' },
  { client: 'Norén Teknik',   customer: 'Anna Norén',      price: '3,300 kr', date: '2026-04-10' },
  { client: 'Åberg Konsult',  customer: 'Johan Åberg',     price: '2,750 kr', date: '2026-04-08' },
];

const topClients = [
  { name: 'Bergström AB',    estimates: 34 },
  { name: 'Hansson Bygg',    estimates: 28 },
  { name: 'Norén Teknik',    estimates: 21 },
  { name: 'Lindqvist & Co',  estimates: 17 },
  { name: 'Åberg Konsult',   estimates: 14 },
];

export default function AdminOverview() {
  return (
    <Layout title="Overview">

      {/* Row 1 — Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {statCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      {/* Row 2 — Table + list */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '20px',
        alignItems: 'start',
      }}>
        <RecentEstimates />
        <TopClients />
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

function RecentEstimates() {
  const columns = ['Client', 'Customer', 'Price', 'Date'];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <p style={cardTitle}>Recent Estimates</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: '#94a3b8',
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recentEstimates.map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
              <td style={cell}>{row.client}</td>
              <td style={cell}>{row.customer}</td>
              <td style={{ ...cell, color: '#0f172a', fontWeight: '500' }}>{row.price}</td>
              <td style={{ ...cell, color: '#94a3b8' }}>{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopClients() {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <p style={cardTitle}>Top Clients</p>

      <div>
        {topClients.map((client, i) => (
          <div key={client.name} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '11px 0',
            borderBottom: i < topClients.length - 1 ? '1px solid #f1f5f9' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                {client.name}
              </span>
            </div>
            <span style={{
              fontSize: '13px',
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              padding: '2px 10px',
              borderRadius: '20px',
            }}>
              {client.estimates} estimates
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const cardTitle = {
  margin: '0 0 18px',
  fontSize: '15px',
  fontWeight: '600',
  color: '#0f172a',
};

const cell = {
  padding: '10px 12px',
  color: '#334155',
  verticalAlign: 'middle',
};
