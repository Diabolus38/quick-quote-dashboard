import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

const FONT  = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';
const DARK    = '#0d1f12';

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

const activityItems = [
  { initials: 'EB', bg: '#ecfccb', color: '#3f6212', name: 'Erik Bergström',  action: 'Created a new estimate',   time: '2 hrs ago'  },
  { initials: 'SL', bg: '#dbeafe', color: '#1d4ed8', name: 'Sara Lindqvist',  action: 'Client added to account',  time: 'Just now'   },
  { initials: 'MH', bg: '#fce7f3', color: '#9d174d', name: 'Mikael Hansson',  action: 'Invoice sent to client',   time: '5 hrs ago'  },
  { initials: 'AD', bg: '#f3f4f6', color: '#374151', name: 'Admin',           action: 'Updated billing settings', time: '1 day ago'  },
];

const tableRows = [
  { initials: 'EB', avatarBg: '#dbeafe', avatarColor: '#1d4ed8', name: 'Erik Bergström',  date: 'Apr 17, 2026', type: 'Service', price: '148,000 kr', status: 'Completed' },
  { initials: 'SL', avatarBg: '#fce7f3', avatarColor: '#9d174d', name: 'Sara Lindqvist',  date: 'Apr 15, 2026', type: 'Product', price: '122,500 kr', status: 'Pending'   },
  { initials: 'MH', avatarBg: '#d1fae5', avatarColor: '#065f46', name: 'Mikael Hansson',  date: 'Apr 14, 2026', type: 'Service', price: '189,000 kr', status: 'Sent'      },
  { initials: 'AN', avatarBg: '#fef9c3', avatarColor: '#92400e', name: 'Anna Norén',      date: 'Apr 11, 2026', type: 'Product', price: '98,750 kr',  status: 'Pending'   },
  { initials: 'JÅ', avatarBg: '#ede9fe', avatarColor: '#6d28d9', name: 'Johan Åberg',     date: 'Apr 09, 2026', type: 'Service', price: '114,200 kr', status: 'Completed' },
];

const CARD = {
  backgroundColor: '#ffffff', borderRadius: '16px',
  border: '1px solid #e8ede8', boxShadow: '0 2px 12px rgba(13,31,18,0.06)', padding: '24px',
};

export default function AdminOverview() {
  const { profile } = useAuth();
  const [clientsTotal,  setClientsTotal]  = useState(null);
  const [clientsActive, setClientsActive] = useState(null);
  const [clientsNewMo,  setClientsNewMo]  = useState(null);
  const [leadsThisMo,   setLeadsThisMo]   = useState(null);

  useEffect(() => {
    async function fetchStats() {
      const [{ data: clients }, { data: leads }] = await Promise.all([
        supabase.from('clients').select('id, active, created_at'),
        supabase.from('leads').select('id, created_at').gte('created_at', startOfMonth()),
      ]);
      if (clients) {
        setClientsTotal(clients.length);
        setClientsActive(clients.filter(c => c.active).length);
        setClientsNewMo(clients.filter(c => new Date(c.created_at) >= new Date(startOfMonth())).length);
      }
      if (leads) setLeadsThisMo(leads.length);
    }
    fetchStats();
  }, []);

  const fmt = v => v != null ? String(v) : '—';
  const greeting = profile?.full_name ? `Good morning, ${profile.full_name.split(' ')[0]}.` : 'Good morning.';

  return (
    <Layout title="Dashboard">
      <div style={{ fontFamily: FONT }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Dashboard</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>{greeting} Here's what's happening today.</p>
          </div>
          <button type="button" style={{ padding: '8px 16px', border: '1px solid #e8ede8', borderRadius: '20px', backgroundColor: '#fff', fontSize: '13px', color: '#4b5563', cursor: 'pointer', fontFamily: FONT }}>
            January 2024 – May 2024 ▾
          </button>
        </div>

        {/* Row 1: Hero + 2 stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Hero card */}
          <div style={{ ...CARD, backgroundColor: DARK, padding: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(163,230,53,0.15)', borderRadius: '20px', padding: '4px 12px', marginBottom: '20px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: LIME, display: 'inline-block' }} />
              <span style={{ fontSize: '12px', fontWeight: '600', color: LIME }}>Live</span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>Monthly Revenue</p>
            <p style={{ margin: '0 0 8px', fontSize: '42px', fontWeight: '800', color: '#ffffff', letterSpacing: '-1px', lineHeight: 1 }}>12,400 kr</p>
            <p style={{ margin: '0 0 28px', fontSize: '13px', color: LIME, fontWeight: '500' }}>↑ +18.4% from last month</p>
            <div style={{ display: 'flex', gap: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>LEADS THIS MONTH</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>{fmt(leadsThisMo)}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>ACTIVE CLIENTS</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>{fmt(clientsActive)}</p>
              </div>
            </div>
          </div>

          {/* Stat card 1 */}
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Leads</span>
              <span style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer' }}>···</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '32px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{fmt(leadsThisMo)}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>↑ +12 from last month</p>
          </div>

          {/* Stat card 2 */}
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Estimate Value</span>
              <span style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer' }}>···</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '32px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>86,700 kr</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>↓ -5% vs last period</p>
          </div>
        </div>

        {/* Row 2: Recent Leads + Revenue chart + Right panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: '20px', marginBottom: '20px' }}>

          {/* Recent Leads card */}
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Recent Leads</span>
              <span style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer' }}>···</span>
            </div>
            {[
              { initials: 'EB', bg: '#ecfccb', color: '#3f6212', name: 'Erik Bergström',  sub: 'Acme AB',    status: 'Won',     date: 'Apr 17' },
              { initials: 'SL', bg: '#dbeafe', color: '#1d4ed8', name: 'Sara Lindqvist',  sub: 'NordBygg',   status: 'New',     date: 'Apr 15' },
              { initials: 'MH', bg: '#fce7f3', color: '#9d174d', name: 'Mikael Hansson',  sub: 'VattSystem', status: 'Quoted',  date: 'Apr 14' },
              { initials: 'AN', bg: '#fef9c3', color: '#92400e', name: 'Anna Norén',      sub: 'EkoTeknik',  status: 'New',     date: 'Apr 11' },
              { initials: 'JÅ', bg: '#ede9fe', color: '#6d28d9', name: 'Johan Åberg',     sub: 'MarkVatten', status: 'Won',     date: 'Apr 09' },
              { initials: 'KB', bg: '#ccfbf1', color: '#0d9488', name: 'Karin Berg',      sub: 'Bergström',  status: 'Quoted',  date: 'Apr 07' },
            ].map((item, i, arr) => {
              const sc = { 'Won': { bg: '#dcfce7', color: '#166534' }, 'New': { bg: '#dbeafe', color: '#1d4ed8' }, 'Quoted': { bg: '#fef9c3', color: '#854d0e' } };
              const s = sc[item.status] || { bg: '#f3f4f6', color: '#6b7280' };
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: i < arr.length - 1 ? '14px' : 0, marginBottom: i < arr.length - 1 ? '14px' : 0, borderBottom: i < arr.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, backgroundColor: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>{item.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{item.sub}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>{item.status}</span>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{item.date}</div>
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f4f6f4' }}>
              <a style={{ fontSize: '13px', color: PRIMARY, fontWeight: '600', textDecoration: 'none', cursor: 'pointer' }}>View all leads →</a>
            </div>
          </div>

          {/* Revenue / Estimates chart card */}
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Estimates Over Time</span>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: DARK, display: 'inline-block' }} />Generated</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: LIME, display: 'inline-block' }} />Won</span>
                </div>
              </div>
              <span style={{ fontSize: '18px', color: '#9ca3af', cursor: 'pointer' }}>···</span>
            </div>
            <div style={{ margin: '8px 0 4px' }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px' }}>143</span>
              <span style={{ fontSize: '12px', color: LIME === '#a3e635' ? '#16a34a' : LIME, fontWeight: '600', marginLeft: '8px' }}>+35% from last month</span>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#9ca3af' }}>estimates this period</p>

            {/* Bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px', marginBottom: '8px' }}>
              {[
                { g: 60, w: 40 }, { g: 45, w: 30 }, { g: 75, w: 55 }, { g: 55, w: 38 },
                { g: 80, w: 60 }, { g: 90, w: 70 }, { g: 70, w: 50 },
              ].map(({ g, w }, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, height: `${g}%`, backgroundColor: DARK, borderRadius: '4px 4px 0 0' }} />
                  <div style={{ flex: 1, height: `${w}%`, backgroundColor: LIME, borderRadius: '4px 4px 0 0' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map(m => (
                <div key={m} style={{ flex: 1, fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>{m}</div>
              ))}
            </div>
          </div>

          {/* Right performance panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Lead Conversion donut */}
            <div style={CARD}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Lead Conversion</p>
              {/* CSS donut via conic-gradient */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'conic-gradient(#a3e635 0% 68%, #166534 68% 84%, #e8ede8 84% 100%)', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: '14px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: '#0d1117' }}>68%</div>
                </div>
              </div>
              {[
                { label: 'Completed',   pct: '68%', color: LIME    },
                { label: 'In Progress', pct: '16%', color: PRIMARY  },
                { label: 'Pending',     pct: '16%', color: '#e8ede8' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: row.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '12px', color: '#4b5563' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#0d1117' }}>{row.pct}</span>
                </div>
              ))}
            </div>

            {/* Sales report card */}
            <div style={CARD}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>This Month's Stats</p>
              {[
                { label: 'Estimates Generated', val: 38, pct: 76, color: LIME    },
                { label: 'Leads Captured',       val: 24, pct: 63, color: PRIMARY },
                { label: 'Clients Active',        val: 6,  pct: 75, color: '#6b9e6e' },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#4b5563' }}>{row.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0d1117' }}>{row.val}</span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: '#f4f6f4', borderRadius: '99px' }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, backgroundColor: row.color, borderRadius: '99px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Upsell card */}
            <div style={{ ...CARD, background: 'linear-gradient(135deg, #0d1f12, #166534)', border: 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: LIME, opacity: 0.12 }} />
              <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>Upgrade to Growth</p>
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5' }}>
                Unlock custom pricing, PDF editor, and full branding control.
              </p>
              <button type="button" style={{ padding: '8px 16px', backgroundColor: LIME, color: DARK, border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT }}>
                View Plans →
              </button>
            </div>

          </div>
        </div>

        {/* Row 3: Full-width estimates table */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Estimates</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e8ede8', borderRadius: '10px', padding: '0 12px', height: '36px' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5" /><line x1="9.5" y1="9.5" x2="13" y2="13" /></svg>
                <input type="text" placeholder="Search estimate..." style={{ border: 'none', outline: 'none', background: 'none', fontSize: '13px', color: '#0d1117', width: '160px', fontFamily: FONT }} />
              </div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', fontFamily: FONT }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e8ede8' }}>
                {['', 'Name', 'Date', 'Type', 'Price', 'Status', ''].map((col, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '8px 14px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => {
                const sc = { Completed: { bg: '#dcfce7', color: '#166534' }, Pending: { bg: '#fef9c3', color: '#854d0e' }, Sent: { bg: '#dbeafe', color: '#1d4ed8' } };
                const s = sc[row.status] || {};
                return (
                  <tr key={i} style={{ borderBottom: i < tableRows.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                    <td style={{ padding: '13px 14px', width: '36px' }}><input type="checkbox" style={{ cursor: 'pointer', accentColor: PRIMARY }} /></td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, backgroundColor: row.avatarBg, color: row.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700' }}>{row.initials}</div>
                        <span style={{ fontWeight: '600', color: '#0d1117' }}>{row.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', color: '#9ca3af' }}>{row.date}</td>
                    <td style={{ padding: '13px 14px', color: '#4b5563' }}>{row.type}</td>
                    <td style={{ padding: '13px 14px', fontWeight: '600', color: '#0d1117' }}>{row.price}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '13px 14px', color: '#9ca3af', cursor: 'pointer', letterSpacing: '2px' }}>···</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </Layout>
  );
}
