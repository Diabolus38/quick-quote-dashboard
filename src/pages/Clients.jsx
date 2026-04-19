import Layout from '../Layout';

const clients = [
  { name: 'Bergström AB',    email: 'erik@bergstrom.se',      plan: 'Pro',     estimates: 34, active: true  },
  { name: 'Lindqvist & Co', email: 'sara@lindqvist.se',      plan: 'Basic',   estimates: 17, active: true  },
  { name: 'Hansson Bygg',   email: 'mikael@hanssonbygg.se',  plan: 'Pro',     estimates: 28, active: true  },
  { name: 'Norén Teknik',   email: 'anna@norenteknik.se',    plan: 'Basic',   estimates: 21, active: false },
  { name: 'Åberg Konsult',  email: 'johan@abergkonsult.se',  plan: 'Pro',     estimates: 14, active: true  },
  { name: 'Dahl Förvaltning', email: 'lena@dahlforv.se',     plan: 'Starter', estimates:  2, active: false },
];

const columns = ['Client Name', 'Contact Email', 'Plan', 'Estimates This Month', 'Status', 'Actions'];

export default function Clients() {
  return (
    <Layout title="Clients">
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>

        {/* Card header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
            All Clients
          </span>
          <button type="button" style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '7px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            letterSpacing: '0.1px',
          }}>
            + Add Client
          </button>
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
            {clients.map((client, i) => (
              <tr key={client.name} style={{
                borderTop: '1px solid #f1f5f9',
              }}>
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>
                  {client.name}
                </td>
                <td style={{ ...cell, color: '#64748b' }}>
                  {client.email}
                </td>
                <td style={cell}>
                  {client.plan}
                </td>
                <td style={{ ...cell, color: '#0f172a', fontWeight: '500' }}>
                  {client.estimates}
                </td>
                <td style={cell}>
                  <StatusBadge active={client.active} />
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
                  }}>
                    View
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

function StatusBadge({ active }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: active ? '#dcfce7' : '#f1f5f9',
      color: active ? '#16a34a' : '#94a3b8',
    }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

const cell = {
  padding: '14px 24px',
  color: '#334155',
  verticalAlign: 'middle',
};
