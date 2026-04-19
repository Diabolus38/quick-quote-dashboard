import { useState } from 'react';
import ClientLayout from '../../ClientLayout';

const estimates = [
  { customer: 'Erik Bergström',   email: 'erik.b@mail.se',        phone: '070-123 45 67', price: '148,000 kr', language: 'Swedish', date: '2026-04-17' },
  { customer: 'Sara Lindqvist',   email: 'sara.l@lindqvist.se',   phone: '073-234 56 78', price: '122,500 kr', language: 'English', date: '2026-04-15' },
  { customer: 'Mikael Hansson',   email: 'mikael@hanssonbygg.se', phone: '076-345 67 89', price: '189,000 kr', language: 'Swedish', date: '2026-04-14' },
  { customer: 'Anna Norén',       email: 'anna.noren@teknik.se',  phone: '070-456 78 90', price: '98,750 kr',  language: 'Swedish', date: '2026-04-11' },
  { customer: 'Johan Åberg',      email: 'j.aberg@konsult.se',    phone: '072-567 89 01', price: '114,200 kr', language: 'English', date: '2026-04-09' },
  { customer: 'Lena Dahl',        email: 'lena@dahlforv.se',      phone: '073-678 90 12', price: '76,500 kr',  language: 'Swedish', date: '2026-04-07' },
  { customer: 'Patrik Söderberg', email: 'patrik@soderberg.se',   phone: '076-789 01 23', price: '203,000 kr', language: 'Swedish', date: '2026-04-03' },
  { customer: 'Maria Eklund',     email: 'maria.e@eklundab.se',   phone: '070-890 12 34', price: '91,000 kr',  language: 'English', date: '2026-03-29' },
];

const filters = ['All', 'This Week', 'This Month'];
const columns  = ['Customer Name', 'Customer Email', 'Customer Phone', 'Price', 'Language', 'Date'];

export default function ClientEstimates() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <ClientLayout title="Estimates">
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
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
            My Estimates
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            {filters.map((f) => {
              const isActive = activeFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  style={{
                    padding: '7px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    border: isActive ? 'none' : '1px solid #e2e8f0',
                    backgroundColor: isActive ? '#0f172a' : '#ffffff',
                    color: isActive ? '#ffffff' : '#64748b',
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
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
            {estimates.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.customer}</td>
                <td style={{ ...cell, color: '#64748b' }}>{row.email}</td>
                <td style={{ ...cell, color: '#64748b' }}>{row.phone}</td>
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

const cell = {
  padding: '14px 24px',
  color: '#334155',
  verticalAlign: 'middle',
};
