import ClientLayout from '../../ClientLayout';

const customers = [
  { name: 'Erik Bergström',   email: 'erik.b@mail.se',        phone: '070-123 45 67', company: 'Bergström Fastighet', lastEstimate: '2026-04-17', total: 12 },
  { name: 'Sara Lindqvist',   email: 'sara.l@lindqvist.se',   phone: '073-234 56 78', company: 'Lindqvist & Co',      lastEstimate: '2026-04-15', total:  7 },
  { name: 'Mikael Hansson',   email: 'mikael@hanssonbygg.se', phone: '076-345 67 89', company: 'Hansson Bygg AB',     lastEstimate: '2026-04-14', total: 19 },
  { name: 'Anna Norén',       email: 'anna.noren@teknik.se',  phone: '070-456 78 90', company: 'Norén Teknik',        lastEstimate: '2026-04-11', total:  5 },
  { name: 'Johan Åberg',      email: 'j.aberg@konsult.se',    phone: '072-567 89 01', company: 'Åberg Konsult',       lastEstimate: '2026-04-09', total:  9 },
  { name: 'Lena Dahl',        email: 'lena@dahlforv.se',      phone: '073-678 90 12', company: 'Dahl Förvaltning',    lastEstimate: '2026-04-07', total:  3 },
  { name: 'Patrik Söderberg', email: 'patrik@soderberg.se',   phone: '076-789 01 23', company: 'Söderberg Gruppen',   lastEstimate: '2026-04-03', total: 14 },
  { name: 'Maria Eklund',     email: 'maria.e@eklundab.se',   phone: '070-890 12 34', company: 'Eklund AB',           lastEstimate: '2026-03-29', total:  6 },
];

const columns = ['Name', 'Email', 'Phone', 'Company', 'Last Estimate', 'Total Estimates'];

export default function ClientCustomers() {
  return (
    <ClientLayout title="Customers">
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>

        {/* Card header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
            My Customers
          </span>
        </div>

        {/* Table */}
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
            {customers.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.name}</td>
                <td style={{ ...cell, color: '#64748b' }}>{row.email}</td>
                <td style={{ ...cell, color: '#64748b' }}>{row.phone}</td>
                <td style={cell}>{row.company}</td>
                <td style={{ ...cell, color: '#94a3b8' }}>{row.lastEstimate}</td>
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ClientLayout>
  );
}

const cell = {
  padding: '14px 24px',
  color: '#334155',
  verticalAlign: 'middle',
};
