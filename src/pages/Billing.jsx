import { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';
import { calculateMRR } from '../utils/mrrUtils';
import { PLAN_FEES, PLAN_LIMITS, OVERAGE_RATES } from '../utils/planConfig';

const FONT    = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  padding: '24px',
};

const PLAN_FEE     = PLAN_FEES;
const PLAN_LIMIT   = PLAN_LIMITS;
const OVERAGE_RATE = OVERAGE_RATES;

const PLAN_BADGE = {
  starter: { bg: '#f3f4f6', color: '#374151' },
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
  const [allLeads,      setAllLeads]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [hovRow,        setHovRow]        = useState(null);
  const [chartLeads,    setChartLeads]    = useState([]);
  const [invoiceStatus, setInvoiceStatus] = useState({});
  const [upgradeStatus, setUpgradeStatus] = useState({});
  const [expandedRow,   setExpandedRow]   = useState(null);
  const [paidStatus,    setPaidStatus]    = useState(() => { try { return JSON.parse(localStorage.getItem('qq360_paid_status') || '{}'); } catch { return {}; } });
  const [ytdLeads,      setYtdLeads]      = useState([]);

  useEffect(() => {
    async function fetchData() {
      const [year, month] = billingMonth.split('-').map(Number);
      const monthStart  = new Date(year, month - 1, 1).toISOString();
      const monthEnd    = new Date(year, month, 1).toISOString();
      const ytdStart    = new Date(year, 0, 1).toISOString();
      const windowStart = new Date(year, month - 6, 1).toISOString();

      const [clientsRes, leadsRes, ytdRes, chartRes, allLeadsRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('id, client_id, created_at, status').gte('created_at', monthStart).lt('created_at', monthEnd),
        supabase.from('leads').select('id, client_id, created_at').gte('created_at', ytdStart).lt('created_at', monthEnd),
        supabase.from('leads').select('id, client_id, created_at').gte('created_at', windowStart).lt('created_at', monthEnd),
        supabase.from('leads').select('id, client_id, created_at').order('created_at', { ascending: true }),
      ]);
      setClients(clientsRes.data   || []);
      setLeads(leadsRes.data       || []);
      setYtdLeads(ytdRes.data      || []);
      setChartLeads(chartRes.data  || []);
      setAllLeads(allLeadsRes.data || []);
      setLoading(false);
    }
    fetchData();
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

  async function sendUpgradeEmail(row) {
    if (!window.confirm(`Suggest a plan upgrade to ${row.name}?`)) return;
    setUpgradeStatus(prev => ({ ...prev, [row.id]: 'sending' }));
    try {
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: row.email,
          name:  row.name,
          subject: 'Time to upgrade your QuickQuote360 plan',
          body: `Hi ${row.name}, you have been getting great results with QuickQuote360! Based on your usage you might benefit from upgrading to a higher plan. Visit dashboard.quickquote360.com to see your options or reply to this email and we will help you find the right plan.`,
        }),
      });
      setUpgradeStatus(prev => ({ ...prev, [row.id]: res.ok ? 'sent' : 'failed' }));
    } catch {
      setUpgradeStatus(prev => ({ ...prev, [row.id]: 'failed' }));
    }
    setTimeout(() => setUpgradeStatus(prev => ({ ...prev, [row.id]: 'idle' })), 3000);
  }

  /* ── Build billing rows ── */
  const leadsThisMonth = {};
  leads.forEach(l => {
    leadsThisMonth[l.client_id] = (leadsThisMonth[l.client_id] || 0) + 1;
  });

  const billingRows = clients.map(c => {
    const plan    = c.plan || 'starter';
    const fee     = PLAN_FEE[plan]     ?? 300;
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
      const fee     = PLAN_FEE[plan]     ?? 300;
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
  const totalMRR      = calculateMRR(clients);
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

  /* ── Upsell intelligence ── */
  const isCurrentBillingMonth = billingMonth === `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}`;
  const daysInSelMonth  = new Date(selYear, selMonthNum, 0).getDate();
  const daysElapsed     = isCurrentBillingMonth ? Math.max(_now.getDate(), 1) : daysInSelMonth;
  const daysInNextMonth = new Date(selYear, selMonthNum + 1, 0).getDate();

  const allLeadsPerClientMonth = {};
  allLeads.forEach(l => {
    const d   = new Date(l.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!allLeadsPerClientMonth[l.client_id]) allLeadsPerClientMonth[l.client_id] = {};
    allLeadsPerClientMonth[l.client_id][key] = (allLeadsPerClientMonth[l.client_id][key] || 0) + 1;
  });

  const upsellRows = billingRows.map(row => {
    const clientMonths = allLeadsPerClientMonth[row.id] || {};
    let monthsOverLimit = 0;
    if (row.limit !== Infinity) {
      Object.values(clientMonths).forEach(count => { if (count > row.limit) monthsOverLimit++; });
    }
    const hitLimitThisMonth   = row.limit !== Infinity && row.used >= row.limit && row.limit > 0;
    const dailyRate           = daysElapsed > 0 ? row.used / daysElapsed : 0;
    const projectedNextMonth  = Math.ceil(dailyRate * daysInNextMonth);
    const daysLeftThisMonth   = isCurrentBillingMonth ? Math.max(daysInSelMonth - _now.getDate(), 0) : 0;
    const estimatesPerDay     = daysElapsed > 0 ? (row.used / daysElapsed).toFixed(1) : '0.0';
    return { ...row, monthsOverLimit, hitLimitThisMonth, projectedNextMonth, daysLeftThisMonth, estimatesPerDay };
  });

  const atRiskCount = upsellRows.filter(r => r.hitLimitThisMonth || r.monthsOverLimit > 0).length;
  const projectedOverageRevenue = upsellRows.reduce((sum, r) => {
    if (r.limit === Infinity) return sum;
    const overageNext = Math.max(0, r.projectedNextMonth - r.limit);
    return sum + overageNext * r.rate;
  }, 0);
  const unlimitedCount = upsellRows.filter(r => r.limit === Infinity).length;

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
                if (billingMonth === defaultMonth) return 'Revenue tracking and upsell intelligence';
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
              const fee     = PLAN_FEE[plan]     ?? 300;
              const limit   = PLAN_LIMIT[plan]   ?? 30;
              const rate    = OVERAGE_RATE[plan] ?? 25;
              const used    = monthCounts[c.id] || 0;
              const overage = limit === Infinity ? 0 : Math.max(0, used - limit);
              ytdTotal += fee + overage * rate;
            });
          }
          const bestMonthEntry = chartData.reduce((best, d) => d.total > best.total ? d : best, { total: 0, label: '' });
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
                <div style={{ width: '1px', height: '60px', backgroundColor: '#e8ede8', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Best Month</p>
                  {bestMonthEntry.total > 0 ? (
                    <>
                      <p style={{ margin: '0 0 2px', fontSize: '32px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1, fontFamily: FONT }}>${bestMonthEntry.total.toLocaleString()}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>{bestMonthEntry.label}</p>
                    </>
                  ) : (
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#9ca3af', letterSpacing: '-0.5px', lineHeight: 1, fontFamily: FONT }}>—</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Billing Overview ── */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Billing Overview</span>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>{upsellRows.length} clients</span>
          </div>

          {/* ── Summary bar ── */}
          {upsellRows.length > 0 && (
            <div style={{ padding: '14px 24px', borderBottom: '1px solid #f4f6f4', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>Upsell signals:</span>
              <span style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid #dc2626', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>
                {atRiskCount} client{atRiskCount !== 1 ? 's' : ''} at risk
              </span>
              <span style={{ backgroundColor: 'rgba(22,101,52,0.08)', border: '1px solid #166534', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                ${projectedOverageRevenue.toLocaleString()} projected overage next month
              </span>
              <span style={{ backgroundColor: 'rgba(29,78,216,0.08)', border: '1px solid #1d4ed8', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', fontWeight: '600', color: '#1d4ed8' }}>
                {unlimitedCount} on unlimited
              </span>
            </div>
          )}

          {upsellRows.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>No clients yet.</div>
          ) : (
            <div>
              {upsellRows.map(row => {
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

                const pct      = row.limit !== Infinity && row.limit > 0 ? Math.min(Math.round((row.used / row.limit) * 100), 100) : 0;
                const barColor = pct >= 90 ? '#dc2626' : pct >= 60 ? '#d97706' : '#16a34a';

                const showUpgrade = row.monthsOverLimit > 0 || row.hitLimitThisMonth || (row.limit !== Infinity && row.projectedNextMonth > row.limit);
                const upgSt = upgradeStatus[row.id] || 'idle';
                const invSt = invoiceStatus[row.id] || 'idle';

                return (
                  <div key={row.id}>
                    {/* Main row */}
                    <div
                      onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                      onMouseEnter={() => setHovRow(row.id)}
                      onMouseLeave={() => setHovRow(null)}
                      style={{ padding: '16px 24px', borderBottom: isExpanded ? 'none' : '1px solid #f4f6f4', backgroundColor: hovRow === row.id || isExpanded ? '#f9faf9' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>

                      {/* Expand arrow + client info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px', flex: '0 0 200px' }}>
                        <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0 }}>{isExpanded ? '▼' : '▶'}</span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#0d1117', fontSize: '13.5px' }}>{row.name}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{row.email}</div>
                          <span style={{ display: 'inline-block', marginTop: '5px', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', backgroundColor: pb.bg, color: pb.color }}>
                            {capitalize(row.plan)}
                          </span>
                        </div>
                      </div>

                      {/* 4 stat boxes */}
                      <div style={{ flex: 1, display: 'flex', gap: '10px', minWidth: '480px' }}>

                        {/* This Month */}
                        <div style={{ flex: 1, backgroundColor: '#f9fbf9', borderRadius: '10px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>This Month</div>
                          {row.limit === Infinity
                            ? <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117' }}>{row.used} / ∞</div>
                            : <>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117' }}>{row.used} / {row.limit}</div>
                                <div style={{ height: '4px', borderRadius: '99px', backgroundColor: '#e5e7eb', overflow: 'hidden', marginTop: '6px' }}>
                                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: '99px', transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px' }}>{pct}% used</div>
                              </>
                          }
                        </div>

                        {/* Hit Limit */}
                        <div style={{ flex: 1, backgroundColor: '#f9fbf9', borderRadius: '10px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Hit Limit</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: row.hitLimitThisMonth ? '#dc2626' : '#16a34a' }}>
                            {row.hitLimitThisMonth ? 'Yes 🔴' : 'No 🟢'}
                          </div>
                          {row.overage > 0 && (
                            <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px', fontWeight: '600' }}>+{row.overage} over</div>
                          )}
                        </div>

                        {/* Historical Overages */}
                        <div style={{ flex: 1, backgroundColor: '#f9fbf9', borderRadius: '10px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Historical</div>
                          {row.monthsOverLimit > 0
                            ? <>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626' }}>{row.monthsOverLimit} mo over</div>
                                <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '2px' }}>upsell signal 🔥</div>
                              </>
                            : <div style={{ fontSize: '14px', fontWeight: '700', color: '#9ca3af' }}>Never</div>
                          }
                        </div>

                        {/* Next Month Projection */}
                        <div style={{ flex: 1, backgroundColor: '#f9fbf9', borderRadius: '10px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>Projected</div>
                          {row.limit === Infinity
                            ? <div style={{ fontSize: '14px', fontWeight: '700', color: '#9ca3af' }}>∞</div>
                            : row.projectedNextMonth > row.limit
                              ? <>
                                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626' }}>⚠ {row.projectedNextMonth}</div>
                                  <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '2px' }}>Over limit</div>
                                </>
                              : <div style={{ fontSize: '14px', fontWeight: '700', color: '#16a34a' }}>{row.projectedNextMonth}</div>
                          }
                        </div>
                      </div>

                      {/* Right: charge + actions */}
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '180px' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px' }}>${row.total.toLocaleString()}</div>
                        <span
                          onClick={() => {
                            const next = { ...paidStatus, [row.id]: !paidStatus[row.id] };
                            setPaidStatus(next);
                            localStorage.setItem('qq360_paid_status', JSON.stringify(next));
                          }}
                          style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', backgroundColor: paidStatus[row.id] ? '#dcfce7' : '#fef9c3', color: paidStatus[row.id] ? '#166534' : '#854d0e' }}>
                          {paidStatus[row.id] ? 'Paid' : 'Pending'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button type="button" onClick={() => sendInvoice(row)} disabled={invSt === 'sending'}
                            style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '500', backgroundColor: invSt === 'sent' ? '#dcfce7' : invSt === 'failed' ? '#fee2e2' : '#f4f6f4', color: invSt === 'sent' ? '#166534' : invSt === 'failed' ? '#dc2626' : '#374151', border: 'none', borderRadius: '8px', cursor: invSt === 'sending' ? 'not-allowed' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                            {invSt === 'sending' ? 'Sending…' : invSt === 'sent' ? 'Sent!' : invSt === 'failed' ? 'Failed' : 'Send Invoice'}
                          </button>
                          {showUpgrade && (
                            <button type="button" onClick={() => sendUpgradeEmail(row)} disabled={upgSt === 'sending'}
                              style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '700', backgroundColor: upgSt === 'sent' ? '#dcfce7' : upgSt === 'failed' ? '#fee2e2' : LIME, color: upgSt === 'sent' ? '#166534' : upgSt === 'failed' ? '#dc2626' : '#0d1f12', border: 'none', borderRadius: '8px', cursor: upgSt === 'sending' ? 'not-allowed' : 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                              {upgSt === 'sending' ? 'Sending…' : upgSt === 'sent' ? 'Sent!' : upgSt === 'failed' ? 'Failed' : '↑ Upgrade'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded section */}
                    {isExpanded && (
                      <div style={{ backgroundColor: '#f9fbf9', borderBottom: '1px solid #f4f6f4', padding: '16px 24px' }}>
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
                            <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Usage Pace</p>
                            <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#0d1117', fontFamily: FONT }}>{row.estimatesPerDay}/day avg</p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#0d1117', fontFamily: FONT }}>{row.daysLeftThisMonth} days left</p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Daily Volume</p>
                            {rowLeads.length === 0 ? (
                              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>No activity this period.</p>
                            ) : (() => {
                              const daysInMonth = new Date(selYear, selMonthNum, 0).getDate();
                              const dailyCounts = Array.from({ length: daysInMonth }, (_, d) => {
                                const day = d + 1;
                                return rowLeads.filter(l => { const ld = new Date(l.created_at); return ld.getDate() === day; }).length;
                              });
                              const maxDay = Math.max(...dailyCounts, 1);
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '40px' }}>
                                    {dailyCounts.map((count, d) => (
                                      <div key={d} style={{ width: '8px', height: count > 0 ? `${Math.max(Math.round((count / maxDay) * 36), 2)}px` : '2px', backgroundColor: count > 0 ? 'rgba(22,101,52,0.6)' : '#f3f4f6', borderRadius: '2px 2px 0 0', flexShrink: 0 }} />
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals row */}
          {upsellRows.length > 0 && (
            <div style={{ padding: '16px 24px', borderTop: '2px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '24px', backgroundColor: '#fafafa', flexWrap: 'wrap' }}>
              {(() => {
                const paidRows    = billingRows.filter(r => paidStatus[r.id]);
                const pendingRows = billingRows.filter(r => !paidStatus[r.id]);
                const outstanding = pendingRows.reduce((s, r) => s + r.total, 0);
                return (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                      Paid: {paidRows.length} client{paidRows.length !== 1 ? 's' : ''} · ${collectedRevenue.toLocaleString()} collected
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#d97706' }}>
                      Pending: {pendingRows.length} client{pendingRows.length !== 1 ? 's' : ''} · ${outstanding.toLocaleString()} outstanding
                    </span>
                    <div style={{ width: '1px', height: '24px', backgroundColor: '#e8ede8', flexShrink: 0 }} />
                  </>
                );
              })()}
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
