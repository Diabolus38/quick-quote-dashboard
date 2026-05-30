import { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

const FONT    = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = '#166534';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
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
  const _now = new Date();
  const [billingMonth,  setBillingMonth]  = useState(`${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}`);
  const [clients,       setClients]       = useState([]);
  const [leads,         setLeads]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [hovRow,        setHovRow]        = useState(null);
  const [chartLeads,    setChartLeads]    = useState([]);
  const [invoiceStatus, setInvoiceStatus] = useState({});
  const [expandedRow,   setExpandedRow]   = useState(null);
  const [paidStatus,    setPaidStatus]    = useState(() => { try { return JSON.parse(localStorage.getItem('qq360_paid_status') || '{}'); } catch { return {}; } });
  const [ytdLeads,      setYtdLeads]      = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [year, month] = billingMonth.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1).toISOString();
      const monthEnd   = new Date(year, month, 1).toISOString();

      const [clientsRes, leadsRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('id, client_id, created_at, status').gte('created_at', monthStart).lt('created_at', monthEnd),
      ]);
      setClients(clientsRes.data || []);
      setLeads(leadsRes.data   || []);
      setLoading(false);
    }
    fetchData();
  }, [billingMonth]);

  useEffect(() => {
    const [year, month] = billingMonth.split('-').map(Number);
    const ytdStart = new Date(year, 0, 1).toISOString();
    const ytdEnd   = new Date(year, month, 1).toISOString();
    supabase.from('leads').select('id, client_id, created_at')
      .gte('created_at', ytdStart)
      .lt('created_at', ytdEnd)
      .then(({ data }) => setYtdLeads(data || []));
  }, [billingMonth]);

  useEffect(() => {
    const [selYear, selMonthNum] = billingMonth.split('-').map(Number);
    const windowStart = new Date(selYear, selMonthNum - 6, 1);
    const windowEnd   = new Date(selYear, selMonthNum, 1);
    supabase.from('leads').select('id, client_id, created_at')
      .gte('created_at', windowStart.toISOString())
      .lt('created_at', windowEnd.toISOString())
      .then(({ data }) => setChartLeads(data || []));
  }, [billingMonth]);

  function exportDetailedBillingCSV(rows) {
    const headers = ['Client','Client ID','Website URL','Created At','Plan','Monthly Fee','Leads Used','Limit','Overage','Overage Charge','Total This Month','Status','New','Contacted','In Progress','Won','Lost'];
    const statusOf = (l) => (l.status || '').toLowerCase().replace(/\s+/g, '_');
    const data = rows.map(r => {
      const client = clients.find(c => c.id === r.id) || {};
      const clientLeads = leads.filter(l => l.client_id === r.id);
      return [
        r.name,
        r.id,
        client.website_url || '',
        client.created_at ? new Date(client.created_at).toLocaleDateString('en-GB') : '',
        r.plan,
        r.fee,
        r.used,
        r.limit === Infinity ? 'Unlimited' : r.limit,
        r.overage,
        r.overageCharge,
        r.total,
        r.status,
        clientLeads.filter(l => statusOf(l) === 'new').length,
        clientLeads.filter(l => statusOf(l) === 'contacted').length,
        clientLeads.filter(l => statusOf(l) === 'in_progress').length,
        clientLeads.filter(l => statusOf(l) === 'closed_won').length,
        clientLeads.filter(l => statusOf(l) === 'closed_lost').length,
      ];
    });
    const csv = [headers, ...data]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `quickquote360-detailed-billing-${billingMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function sendInvoice(row) {
    setInvoiceStatus(prev => ({ ...prev, [row.id]: 'sending' }));
    const limitDisplay = row.limit === Infinity ? 'Unlimited' : row.limit;
    const emailBody = `Hi ${row.name}, here is your invoice summary for this billing period. Plan: ${capitalize(row.plan)}. Monthly fee: $${row.fee}. Estimates used: ${row.used}/${limitDisplay}. Overage charge: $${row.overageCharge}. Total due: $${row.total}. Thank you for using QuickQuote360. Questions? Contact support@quickquote360.com`;
    try {
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: row.email, name: row.name, subject: 'Your QuickQuote360 Invoice', body: emailBody }),
      });
      setInvoiceStatus(prev => ({ ...prev, [row.id]: res.ok ? 'sent' : 'failed' }));
    } catch {
      setInvoiceStatus(prev => ({ ...prev, [row.id]: 'failed' }));
    }
    setTimeout(() => setInvoiceStatus(prev => ({ ...prev, [row.id]: 'idle' })), 3000);
  }

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

  /* ── Revenue chart data (6 months ending at selected billing month) ── */
  const [selYear, selMonthNum] = billingMonth.split('-').map(Number);
  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(selYear, selMonthNum - 1 - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('default', { month: 'short' }), isSelected: i === 5 };
  });

  const chartData = chartMonths.map(({ year, month, label, isSelected }) => {
    const leadsInMonth = {};
    chartLeads.forEach(l => {
      const d = new Date(l.created_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        leadsInMonth[l.client_id] = (leadsInMonth[l.client_id] || 0) + 1;
      }
    });
    const total = clients.reduce((sum, c) => {
      const plan    = c.plan || 'starter';
      const fee     = PLAN_FEE[plan]     || 300;
      const limit   = PLAN_LIMIT[plan]   ?? 30;
      const rate    = OVERAGE_RATE[plan] ?? 25;
      const used    = leadsInMonth[c.id] || 0;
      const overage = limit === Infinity ? 0 : Math.max(0, used - limit);
      return sum + fee + overage * rate;
    }, 0);
    return { label, total, isSelected };
  });

  const maxChartTotal = Math.max(...chartData.map(d => d.total), 1);

  /* ── Computed totals ── */
  const totalMRR      = billingRows.reduce((s, r) => s + r.fee, 0);
  const totalOverages = billingRows.reduce((s, r) => s + r.overageCharge, 0);
  const totalRevenue  = totalMRR + totalOverages;
  const activeCount   = clients.filter(c => c.active !== false).length;

  const collectedRevenue = billingRows.filter(r => paidStatus[r.id]).reduce((s, r) => s + r.total, 0);

  const statCards = [
    { label: 'Monthly Revenue',      value: `$${totalRevenue.toLocaleString()}`,     bg: '#ecfccb', color: '#3f6212' },
    { label: 'Collected Revenue',    value: `$${collectedRevenue.toLocaleString()}`, bg: '#dcfce7', color: '#166534' },
    { label: 'Pending Overages',     value: `$${totalOverages.toLocaleString()}`,    bg: '#fef9c3', color: '#854d0e' },
    { label: 'Active Subscriptions', value: activeCount,                              bg: '#dbeafe', color: '#1d4ed8' },
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Billing</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>
              {(() => {
                const defaultMonth = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}`;
                if (billingMonth === defaultMonth) return 'Revenue tracking and invoice management';
                const [y, m] = billingMonth.split('-').map(Number);
                const monthName = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' });
                return `Showing billing data for ${monthName} ${y}`;
              })()}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', fontFamily: FONT, whiteSpace: 'nowrap' }}>Billing Period</label>
              <input type="month" value={billingMonth} onChange={e => setBillingMonth(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', fontFamily: FONT, outline: 'none', color: '#0d1117', backgroundColor: '#fff', cursor: 'pointer' }} />
            </div>
            <button type="button" onClick={() => exportDetailedBillingCSV(billingRows)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: '#fff', color: '#374151', border: '1px solid #e8ede8', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
              ↓ Download Detailed Report
            </button>
            <button type="button" onClick={() => exportBillingCSV(billingRows)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              ↓ Export Report
            </button>
          </div>
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

        {/* ── Revenue Chart ── */}
        <div style={{ ...CARD, marginBottom: '28px' }}>
          <p style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Revenue Last 6 Months</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '8px' }}>
            {chartData.map(({ label, total, isSelected }) => {
              const heightPct = total > 0 ? Math.max(Math.round((total / maxChartTotal) * 100), 4) : 0;
              const barHeight = isSelected ? Math.min(heightPct * 1.1, 100) : heightPct;
              return (
                <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: isSelected ? '#3f6212' : '#374151', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    {total > 0 ? `$${total.toLocaleString()}` : ''}
                  </span>
                  <div style={{ width: '100%', height: `${barHeight}%`, backgroundColor: isSelected ? '#a3e635' : PRIMARY, borderRadius: '6px 6px 2px 2px', minHeight: barHeight > 0 ? '4px' : '0' }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {chartData.map(({ label }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>{label}</div>
            ))}
          </div>
        </div>

        {/* ── Projected Revenue ── */}
        {(() => {
          const projectedAnnual = totalRevenue * 12;
          const [yearStr] = billingMonth.split('-');
          const year = Number(yearStr);
          let ytdTotal = 0;
          for (let m = 1; m <= selMonthNum; m++) {
            const monthCounts = {};
            ytdLeads.forEach(l => {
              const d = new Date(l.created_at);
              if (d.getFullYear() === year && d.getMonth() + 1 === m) {
                monthCounts[l.client_id] = (monthCounts[l.client_id] || 0) + 1;
              }
            });
            clients.forEach(c => {
              const plan    = c.plan || 'starter';
              const fee     = PLAN_FEE[plan]     || 300;
              const limit   = PLAN_LIMIT[plan]   ?? 30;
              const rate    = OVERAGE_RATE[plan] ?? 25;
              const used    = monthCounts[c.id] || 0;
              const overage = limit === Infinity ? 0 : Math.max(0, used - limit);
              ytdTotal += fee + overage * rate;
            });
          }
          return (
            <div style={{ ...CARD, marginBottom: '28px' }}>
              <p style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Revenue Projections</p>
              <div style={{ display: 'flex', gap: '48px', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Projected Annual</p>
                  <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1, fontFamily: FONT }}>${projectedAnnual.toLocaleString()}</p>
                </div>
                <div style={{ width: '1px', height: '60px', backgroundColor: '#e8ede8', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Year to Date</p>
                  <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1, fontFamily: FONT }}>${ytdTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          );
        })()}

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
                    const pb         = PLAN_BADGE[row.plan] || PLAN_BADGE.starter;
                    const isExpanded = expandedRow === row.id;
                    const rowLeads   = leads.filter(l => l.client_id === row.id);
                    const sOf        = l => (l.status || '').toLowerCase().replace(/\s+/g, '_');
                    const statusCount = {
                      new:          rowLeads.filter(l => sOf(l) === 'new').length,
                      contacted:    rowLeads.filter(l => sOf(l) === 'contacted').length,
                      in_progress:  rowLeads.filter(l => sOf(l) === 'in_progress').length,
                      closed_won:   rowLeads.filter(l => sOf(l) === 'closed_won').length,
                      closed_lost:  rowLeads.filter(l => sOf(l) === 'closed_lost').length,
                    };
                    const sortedDates = rowLeads.map(l => l.created_at).sort();
                    const firstLead   = sortedDates[0] ? new Date(sortedDates[0]).toLocaleDateString('en-GB') : '—';
                    const lastLead    = sortedDates[sortedDates.length - 1] ? new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString('en-GB') : '—';
                    return (
                      <>
                      <tr key={row.id}
                        onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                        onMouseEnter={() => setHovRow(row.id)}
                        onMouseLeave={() => setHovRow(null)}
                        style={{ backgroundColor: hovRow === row.id || isExpanded ? '#f9faf9' : '#fff', borderBottom: isExpanded ? 'none' : '1px solid #f4f6f4', cursor: 'pointer' }}>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#9ca3af' }}>{isExpanded ? '▼' : '▶'}</span>
                            <div>
                              <div style={{ fontWeight: '600', color: '#0d1117' }}>{row.name}</div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{row.email}</div>
                            </div>
                          </div>
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
                          <span onClick={() => {
                            const next = { ...paidStatus, [row.id]: !paidStatus[row.id] };
                            setPaidStatus(next);
                            localStorage.setItem('qq360_paid_status', JSON.stringify(next));
                          }} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', backgroundColor: paidStatus[row.id] ? '#dcfce7' : '#fef9c3', color: paidStatus[row.id] ? '#166534' : '#854d0e' }}>
                            {paidStatus[row.id] ? 'Paid' : 'Pending'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {(() => {
                            const st = invoiceStatus[row.id] || 'idle';
                            return (
                              <button type="button" onClick={() => sendInvoice(row)} disabled={st === 'sending'}
                                style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '500', backgroundColor: st === 'sent' ? '#dcfce7' : st === 'failed' ? '#fee2e2' : '#f4f6f4', color: st === 'sent' ? '#166534' : st === 'failed' ? '#dc2626' : '#374151', border: 'none', borderRadius: '8px', cursor: st === 'sending' ? 'not-allowed' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                                {st === 'sending' ? 'Sending…' : st === 'sent' ? 'Sent!' : st === 'failed' ? 'Failed' : 'Send Invoice'}
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${row.id}-expanded`} style={{ backgroundColor: '#f9fbf9', borderBottom: '1px solid #f4f6f4' }}>
                          <td colSpan={10} style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Lead Status Breakdown</p>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                  {[['New', statusCount.new, '#1d4ed8'], ['Contacted', statusCount.contacted, '#d97706'], ['In Progress', statusCount.in_progress, '#7c3aed'], ['Won', statusCount.closed_won, '#16a34a'], ['Lost', statusCount.closed_lost, '#dc2626']].map(([label, count, color]) => (
                                    <div key={label} style={{ textAlign: 'center' }}>
                                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color, fontFamily: FONT }}>{count}</p>
                                      <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{label}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Lead Dates This Period</p>
                                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#0d1117', fontFamily: FONT }}>First: <strong>{firstLead}</strong></p>
                                <p style={{ margin: 0, fontSize: '13px', color: '#0d1117', fontFamily: FONT }}>Last: <strong>{lastLead}</strong></p>
                              </div>
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Daily Volume</p>
                                {rowLeads.length === 0 ? (
                                  <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>No activity this period.</p>
                                ) : (() => {
                                  const [selYear, selMonthNum] = billingMonth.split('-').map(Number);
                                  const daysInMonth = new Date(selYear, selMonthNum, 0).getDate();
                                  const dailyCounts = Array.from({ length: daysInMonth }, (_, d) => {
                                    const day = d + 1;
                                    return rowLeads.filter(l => { const ld = new Date(l.created_at); return ld.getDate() === day; }).length;
                                  });
                                  const maxDay = Math.max(...dailyCounts, 1);
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '40px' }}>
                                      {dailyCounts.map((count, d) => (
                                        <div key={d} style={{ width: '8px', height: count > 0 ? `${Math.max(Math.round((count / maxDay) * 36), 2)}px` : '2px', backgroundColor: count > 0 ? 'rgba(22,101,52,0.6)' : '#f3f4f6', borderRadius: '2px 2px 0 0', flexShrink: 0 }} />
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </>
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
