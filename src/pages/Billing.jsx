import { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

const FONT    = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = '#166534';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e8ede8',
  boxShadow: '0 2px 12px rgba(13,31,18,0.06)',
  padding: '24px',
};

const PLAN_FEE     = { starter: 300,  growth: 600,  scale: 1149 };
const PLAN_LIMIT   = { starter: 30,   growth: 75,   scale: Infinity };
const OVERAGE_RATE = { starter: 25,   growth: 18,   scale: 0 };

const PLAN_BADGE = {
  starter: { bg: '#dbeafe', color: '#1d4ed8' },
  growth:  { bg: '#ede9fe', color: '#7c3aed' },
  scale:   { bg: '#ecfccb', color: '#3f6212' },
};

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function exportBillingCSV(rows) {
  const headers = ['Client','Plan','Monthly Fee','Leads Used','Limit','Overage','Overage Charge','Total This Month','Status'];
  const data = rows.map(r => [
    r.name,
    r.plan,
    r.fee,
    r.used,
    r.limit === Infinity ? 'Unlimited' : r.limit,
    r.overage,
    r.overageCharge,
    r.total,
    r.status,
  ]);
  const csv = [headers, ...data]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `quickquote360-billing-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Billing() {
  const [clients,  setClients]  = useState([]);
  const [leads,    setLeads]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [hovRow,   setHovRow]   = useState(null);

  useEffect(() => {
    async function fetchData() {
      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [clientsRes, leadsRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('id, client_id, created_at').gte('created_at', monthStart),
      ]);
      setClients(clientsRes.data || []);
      setLeads(leadsRes.data   || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  /* ── Build billing rows ── */
  const leadsThisMonth = {};
  leads.forEach(l => {
    leadsThisMonth[l.client_id] = (leadsThisMonth[l.client_id] || 0) + 1;
  });

  const billingRows = clients.map(c => {
    const plan    = c.plan || 'starter';
    const fee     = PLAN_FEE[plan]     || 300;
    const limit   = PLAN_LIMIT[plan]   ?? 30;
    const rate    = OVERAGE_RATE[plan] ?? 25;
    const used    = leadsThisMonth[c.id] || 0;
    const overage = limit === Infinity ? 0 : Math.max(0, used - limit);
    const overageCharge = overage * rate;
    const total   = fee + overageCharge;
    return {
      id:            c.id,
      name:          c.name,
      email:         c.email,
      active:        c.active !== false,
      plan,
      fee,
      limit,
      used,
      overage,
      rate,
      overageCharge,
      total,
      status:        'Paid',
    };
  });

  /* ── Computed totals ── */
  const totalMRR      = billingRows.reduce((s, r) => s + r.fee, 0);
  const totalOverages = billingRows.reduce((s, r) => s + r.overageCharge, 0);
  const totalRevenue  = totalMRR + totalOverages;
  const activeCount   = clients.filter(c => c.active !== false).length;

  const statCards = [
    { label: 'Monthly Revenue',      value: `$${totalRevenue.toLocaleString()}`,  bg: '#ecfccb', color: '#3f6212' },
    { label: 'Collected',            value: `$${totalRevenue.toLocaleString()}`,  bg: '#dcfce7', color: '#166534' },
    { label: 'Pending Overages',     value: `$${totalOverages.toLocaleString()}`, bg: '#fef9c3', color: '#854d0e' },
    { label: 'Active Subscriptions', value: activeCount,                           bg: '#dbeafe', color: '#1d4ed8' },
  ];

  if (loading) return (
    <Layout title="Billing">
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ borderRadius: '16px', background: '#f0f0f0', height: '120px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e8ede8', overflow: 'hidden', padding: '8px' }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ height: '60px', margin: '6px 0', borderRadius: '8px', background: '#f0f0f0', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout title="Billing">
      <div style={{ fontFamily: FONT }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Billing</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Revenue tracking and invoice management</p>
          </div>
          <button type="button" onClick={() => exportBillingCSV(billingRows)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            ↓ Export Report
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(card => (
            <div key={card.label} style={CARD}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '16px', fontWeight: '700', color: card.color }}>$</div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── Billing Table ── */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Billing Overview</span>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>{billingRows.length} clients</span>
          </div>
          {billingRows.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>No clients yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    {['Client','Plan','Monthly Fee','Leads Used','Limit','Overage','Overage Charge','Total This Month','Status','Actions'].map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #e8ede8', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {billingRows.map((row, i) => {
                    const pb = PLAN_BADGE[row.plan] || PLAN_BADGE.starter;
                    return (
                      <tr key={row.id}
                        onMouseEnter={() => setHovRow(row.id)}
                        onMouseLeave={() => setHovRow(null)}
                        style={{ backgroundColor: hovRow === row.id ? '#f9faf9' : '#fff', borderBottom: '1px solid #f4f6f4' }}>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '600', color: '#0d1117' }}>{row.name}</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{row.email}</div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: pb.bg, color: pb.color }}>
                            {capitalize(row.plan)}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0d1117' }}>${row.fee.toLocaleString()}</td>

                        <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0d1117' }}>{row.used}</td>

                        <td style={{ padding: '14px 16px', color: '#4b5563' }}>
                          {row.limit === Infinity ? '∞' : row.limit}
                        </td>

                        <td style={{ padding: '14px 16px', color: row.overage > 0 ? '#dc2626' : '#9ca3af', fontWeight: row.overage > 0 ? '700' : '400' }}>
                          {row.overage > 0 ? `+${row.overage}` : '0'}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: '600', color: row.overageCharge > 0 ? '#dc2626' : '#9ca3af' }}>
                          ${row.overageCharge.toLocaleString()}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0d1117' }}>
                          ${row.total.toLocaleString()}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: row.status === 'Paid' ? '#dcfce7' : '#fef9c3', color: row.status === 'Paid' ? '#166534' : '#854d0e' }}>
                            {row.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <button type="button" onClick={() => alert('Invoice feature coming with Stripe integration')}
                            style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '500', backgroundColor: '#f4f6f4', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                            Send Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals row */}
          {billingRows.length > 0 && (
            <div style={{ padding: '16px 24px', borderTop: '2px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '32px', backgroundColor: '#fafafa' }}>
              <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '600' }}>
                MRR: <span style={{ color: '#0d1117' }}>${totalMRR.toLocaleString()}</span>
              </span>
              <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '600' }}>
                Overages: <span style={{ color: totalOverages > 0 ? '#dc2626' : '#0d1117' }}>${totalOverages.toLocaleString()}</span>
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117' }}>
                Total: ${totalRevenue.toLocaleString()}
              </span>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
