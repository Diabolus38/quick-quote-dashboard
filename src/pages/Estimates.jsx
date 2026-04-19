import { useState } from 'react';
import Layout from '../Layout';

const estimates = [
  { client: 'Bergström AB',     customer: 'Erik Bergström',   email: 'erik@bergstrom.se',       price: '4,200 kr', language: 'Swedish', date: '2026-04-17' },
  { client: 'Hansson Bygg',     customer: 'Mikael Hansson',   email: 'mikael@hanssonbygg.se',   price: '9,100 kr', language: 'Swedish', date: '2026-04-15' },
  { client: 'Lindqvist & Co',   customer: 'Sara Lindqvist',   email: 'sara@lindqvist.se',       price: '1,850 kr', language: 'English', date: '2026-04-14' },
  { client: 'Norén Teknik',     customer: 'Anna Norén',       email: 'anna@norenteknik.se',     price: '3,300 kr', language: 'Swedish', date: '2026-04-11' },
  { client: 'Åberg Konsult',    customer: 'Johan Åberg',      email: 'johan@abergkonsult.se',   price: '2,750 kr', language: 'English', date: '2026-04-09' },
  { client: 'Bergström AB',     customer: 'Erik Bergström',   email: 'erik@bergstrom.se',       price: '6,500 kr', language: 'Swedish', date: '2026-04-07' },
  { client: 'Dahl Förvaltning', customer: 'Lena Dahl',        email: 'lena@dahlforv.se',        price: '1,100 kr', language: 'Swedish', date: '2026-04-03' },
  { client: 'Hansson Bygg',     customer: 'Mikael Hansson',   email: 'mikael@hanssonbygg.se',   price: '5,400 kr', language: 'English', date: '2026-03-29' },
];

const filters = ['All', 'This Week', 'This Month'];
const columns  = ['Client', 'Customer Name', 'Customer Email', 'Price', 'Language', 'Date'];

export default function Estimates() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <Layout title="Estimates">
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
            All Estimates
          </span>

          {/* Filter buttons */}
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
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>
                  {row.client}
                </td>
                <td style={cell}>{row.customer}</td>
                <td style={{ ...cell, color: '#64748b' }}>{row.email}</td>
                <td style={{ ...cell, fontWeight: '500', color: '#0f172a' }}>{row.price}</td>
                <td style={cell}>{row.language}</td>
                <td style={{ ...cell, color: '#94a3b8' }}>{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

const cell = {
  padding: '14px 24px',
  color: '#334155',
  verticalAlign: 'middle',
};
