import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';

const FONT    = "'Plus Jakarta Sans', sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';
const DARK    = '#0d1f12';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  padding: '24px',
};

const avatarPalette = [
  { bg: '#ecfccb', color: '#3f6212' },
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#fef9c3', color: '#854d0e' },
  { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#ccfbf1', color: '#0d9488' },
  { bg: '#fee2e2', color: '#991b1b' },
  { bg: '#fce7f3', color: '#9d174d' },
  { bg: '#f3f4f6', color: '#374151' },
];

const STATUS_COLORS = {
  new:          { bg: '#dbeafe', color: '#1d4ed8' },
  contacted:    { bg: '#fef9c3', color: '#854d0e' },
  in_progress:  { bg: '#ede9fe', color: '#7c3aed' },
  closed_won:   { bg: '#dcfce7', color: '#166534' },
  closed_lost:  { bg: '#fee2e2', color: '#991b1b' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return `${days} days ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDateStr() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]}`;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function AdminOverview() {
  const { profile } = useAuth();
  const navigate    = useNavigate();

  const [clients,   setClients]   = useState([]);
  const [leads,     setLeads]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [rankMode,  setRankMode]  = useState('leads');

  useEffect(() => {
    async function fetchData() {
      const [clientsRes, leadsRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('id, client_id, created_at, status, estimated_price, name, email').order('created_at', { ascending: false }),
      ]);
      if (clientsRes.error) console.error('Failed to fetch clients:', clientsRes.error);
      if (leadsRes.error)   console.error('Failed to fetch leads:', leadsRes.error);
      setClients(clientsRes.data || []);
      setLeads(leadsRes.data   || []);
      setLoading(false);
    }
    fetchData();

    const channel = supabase.channel('admin-overview-leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, payload => {
        const newLead = payload.new;
        setLeads(prev => [newLead, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── Computed ── */
  const now        = new Date();
  const todayStr   = now.toDateString();
  const thisMonth  = now.getMonth();
  const thisYear   = now.getFullYear();

  const starterCount = clients.filter(c => c.plan === 'starter').length;
  const growthCount  = clients.filter(c => c.plan === 'growth').length;
  const scaleCount   = clients.filter(c => c.plan === 'scale').length;
  const mrr          = starterCount * 300 + growthCount * 600 + scaleCount * 1149;

  const mrrGrowth = clients.filter(c => {
    const d = new Date(c.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const totalClients  = clients.length;
  const activeClients = clients.filter(c => c.active !== false).length;

  const leadsToday = leads.filter(l => new Date(l.created_at).toDateString() === todayStr).length;
  const leadsThisMonth = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;
  const totalLeads = leads.length;

  const leadCountPerClient = {};
  leads.forEach(l => {
    leadCountPerClient[l.client_id] = (leadCountPerClient[l.client_id] || 0) + 1;
  });

  const clientsNearLimit = clients.filter(c => {
    const count = leadCountPerClient[c.id] || 0;
    if (c.plan === 'starter') return count >= 24;
    if (c.plan === 'growth')  return count >= 60;
    return false;
  });

  const clientMap = {};
  clients.forEach((c, i) => { clientMap[c.id] = { name: c.name, paletteIdx: i % avatarPalette.length }; });

  const recentLeads = leads.slice(0, 8);
  const maxPlan     = Math.max(starterCount, growthCount, scaleCount, 1);

  const PLAN_FEE_OV = { starter: 300, growth: 600, scale: 1149 };
  const top5Clients = [...clients]
    .sort((a, b) => rankMode === 'revenue'
      ? (PLAN_FEE_OV[b.plan] || 0) - (PLAN_FEE_OV[a.plan] || 0)
      : (leadCountPerClient[b.id] || 0) - (leadCountPerClient[a.id] || 0))
    .slice(0, 5);
  const top5MaxCount = top5Clients.length > 0
    ? (rankMode === 'revenue'
        ? PLAN_FEE_OV[top5Clients[0].plan] || 1
        : (leadCountPerClient[top5Clients[0].id] || 1))
    : 1;

  const events = [
    ...leads.map(l   => ({ type: 'lead',   id: l.id, date: new Date(l.created_at), name: l.name || 'Anonymous', clientName: clientMap[l.client_id]?.name || '—', plan: null })),
    ...clients.map(c => ({ type: 'signup', id: c.id, date: new Date(c.created_at), name: c.name, clientName: null, plan: c.plan })),
  ].sort((a, b) => b.date - a.date).slice(0, 20);

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Admin';
  const greeting  = `${getGreeting()}, ${firstName}`;

  if (loading) return (
    <Layout title="Dashboard">
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      <div style={{ fontFamily: FONT }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ borderRadius: '16px', background: '#f0f0f0', height: '120px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1, borderRadius: '16px', background: '#f0f0f0', height: '320px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: '320px', flexShrink: 0, borderRadius: '16px', background: '#f0f0f0', height: '320px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '240px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </Layout>
  );

  return (
    <Layout title="Dashboard">
      <div style={{ fontFamily: FONT }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px' }}>{greeting}</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>Here's your QuickQuote360 overview for today.</p>
            <span style={{ display: 'inline-flex', backgroundColor: '#ecfccb', color: '#3f6212', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: '600', marginTop: '8px' }}>
              {leadsToday > 0 ? `You have received ${leadsToday} lead${leadsToday === 1 ? '' : 's'} today` : 'No leads yet today — check back soon'}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', marginTop: '4px' }}>{formatDateStr()}</div>
        </div>

        {/* ── Row 1: KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '20px' }}>

          <div style={CARD}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '22px', fontWeight: '800', color: LIME }}>$</div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly Revenue</p>
            <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{'$' + mrr.toLocaleString()}</p>
            <p style={{ margin: 0, fontSize: '12px', color: LIME, fontWeight: '600' }}>+{mrrGrowth} new this month</p>
          </div>

          <div style={CARD}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#ecfccb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '20px', color: '#3f6212' }}>◎</div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Clients</p>
            <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{totalClients}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{activeClients} active</p>
          </div>

          <div style={CARD}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '20px', color: '#1d4ed8' }}>▤</div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leads Today</p>
            <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{leadsToday}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{leadsThisMonth} this month</p>
          </div>

          <div style={CARD}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '20px', color: '#854d0e' }}>⊞</div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>All Time Leads</p>
            <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{totalLeads}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>across all clients</p>
          </div>

          <div style={CARD}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', fontSize: '20px', color: '#7c3aed' }}>▤</div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leads This Month</p>
            <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#7c3aed', letterSpacing: '-0.5px', lineHeight: 1 }}>{leadsThisMonth}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>current calendar month</p>
          </div>
        </div>

        {/* ── Alert Row ── */}
        {clientsNearLimit.length > 0 && (
          <div style={{ backgroundColor: '#fef9c3', border: '1px solid #fbbf24', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px' }}>⚠</span>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#854d0e' }}>
                  {clientsNearLimit.length} client(s) approaching their monthly estimate limit
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {clientsNearLimit.map(c => {
                  const limit = c.plan === 'growth' ? 75 : 30;
                  const count = leadCountPerClient[c.id] || 0;
                  return (
                    <span key={c.id} style={{ fontSize: '12px', color: '#92400e', backgroundColor: 'rgba(251,191,36,0.25)', borderRadius: '6px', padding: '2px 10px', fontWeight: '500' }}>
                      {c.name} · {c.plan} · {count}/{limit}
                    </span>
                  );
                })}
              </div>
            </div>
            <button type="button" onClick={() => navigate('/admin/clients')}
              style={{ backgroundColor: '#fff', border: '1px solid #fbbf24', color: '#854d0e', borderRadius: '8px', padding: '8px 16px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0 }}>
              View Clients →
            </button>
          </div>
        )}

        {/* ── Row 2: Recent Leads + Client Snapshot ── */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>

          {/* Recent Leads */}
          <div style={{ ...CARD, flex: 1, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Recent Leads</span>
              <button type="button" onClick={() => navigate('/admin/leads')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: PRIMARY, fontWeight: '600', fontFamily: FONT, padding: 0 }}>
                View all →
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  {['Client', 'Customer', 'Price', 'Date', 'Status'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '10px 20px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLeads.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>No leads yet</td></tr>
                ) : recentLeads.map((lead, i) => {
                  const clientEntry = clientMap[lead.client_id];
                  const clientName  = clientEntry?.name || '—';
                  const av          = clientEntry ? avatarPalette[clientEntry.paletteIdx] : { bg: '#f3f4f6', color: '#374151' };
                  const rawStatus   = (lead.status || 'new').toLowerCase().replace(/\s+/g, '_');
                  const sc          = STATUS_COLORS[rawStatus] || { bg: '#f3f4f6', color: '#6b7280' };
                  return (
                    <tr key={lead.id || i}
                      style={{ borderTop: '1px solid #f4f6f4' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9faf9'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>
                            {getInitials(clientName)}
                          </div>
                          <span style={{ fontWeight: '500', color: '#0d1117' }}>{clientName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', color: '#4b5563' }}>{lead.name || '—'}</td>
                      <td style={{ padding: '12px 20px', fontWeight: '600', color: '#0d1117' }}>
                        {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#9ca3af' }}>{formatShortDate(lead.created_at)}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: sc.bg, color: sc.color }}>
                          {lead.status || 'New'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Client Snapshot */}
          <div style={{ ...CARD, width: '320px', flexShrink: 0 }}>
            <p style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Clients by Plan</p>

            {[
              { label: 'Starter', count: starterCount, sub: '× $300/mo',   fill: '#1d4ed8', bg: '#dbeafe' },
              { label: 'Growth',  count: growthCount,  sub: '× $600/mo',   fill: '#7c3aed', bg: '#ede9fe' },
              { label: 'Scale',   count: scaleCount,   sub: '× $1,149/mo', fill: LIME,      bg: '#ecfccb' },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117' }}>{row.label}</span>
                    <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: row.bg, color: row.fill }}>{row.count}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{row.sub}</span>
                </div>
                <div style={{ height: '7px', borderRadius: '99px', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((row.count / maxPlan) * 100)}%`, height: '100%', backgroundColor: row.fill, borderRadius: '99px', transition: 'width 0.4s' }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e8ede8' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimated MRR</p>
              <p style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: '800', color: '#0d1117' }}>{'$' + mrr.toLocaleString()}</p>

              {[
                { label: 'Active clients',   value: activeClients },
                { label: 'Inactive clients', value: totalClients - activeClients },
                { label: 'New this month',   value: mrrGrowth },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f4f6f4' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{row.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Activity Feed ── */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Activity Feed</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', backgroundColor: '#ecfccb', fontSize: '11px', fontWeight: '600', color: '#3f6212' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: LIME, display: 'inline-block' }} />
              Live
            </span>
          </div>
          {events.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '13.5px', margin: 0 }}>No recent activity yet</p>
          ) : (
            <div>
              {events.map((ev, i) => (
                <div key={i}
                  onClick={() => ev.type === 'lead' ? navigate(`/admin/leads/${ev.id}`) : navigate(`/admin/clients/${ev.id}`)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9faf9'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', borderBottom: i < events.length - 1 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: ev.type === 'lead' ? LIME : DARK }} />
                  <span style={{ flex: 1, fontSize: '13px', color: '#0d1117' }}>
                    {ev.type === 'lead'
                      ? <span>New lead from <strong>{ev.name}</strong> via {ev.clientName}</span>
                      : <span>New client: <strong>{ev.name}</strong> ({ev.plan} plan)</span>
                    }
                  </span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>{timeAgo(ev.date.toISOString())}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Row 4: Top Clients by Leads/Revenue ── */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Top Clients</p>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[{ key: 'leads', label: 'By Leads' }, { key: 'revenue', label: 'By Revenue' }].map(m => (
                <button key={m.key} type="button" onClick={() => setRankMode(m.key)}
                  style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', backgroundColor: rankMode === m.key ? PRIMARY : '#f3f4f6', color: rankMode === m.key ? '#fff' : '#6b7280', fontFamily: FONT, transition: 'all 0.12s' }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {top5Clients.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No client data yet.</p>
          ) : top5Clients.map((client, idx) => {
            const count    = rankMode === 'revenue' ? (PLAN_FEE_OV[client.plan] || 0) : (leadCountPerClient[client.id] || 0);
            const display  = rankMode === 'revenue' ? `$${count.toLocaleString()}/mo` : String(count);
            const pct      = top5MaxCount > 0 ? Math.round((count / top5MaxCount) * 100) : 0;
            const rankColors = [
              { bg: '#d97706', color: '#fff' },
              { bg: '#9ca3af', color: '#fff' },
              { bg: '#b45309', color: '#fff' },
              { bg: '#e5e7eb', color: '#374151' },
              { bg: '#e5e7eb', color: '#374151' },
            ];
            const rc = rankColors[idx];
            return (
              <div key={client.id}
                onClick={() => navigate(`/admin/clients/${client.id}`)}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9faf9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                style={{ padding: '10px 0', borderBottom: idx < top5Clients.length - 1 ? '1px solid #f4f6f4' : 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: rc.bg, color: rc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <span style={{ flex: 1, fontSize: '13.5px', fontWeight: '600', color: '#0d1117' }}>{client.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117' }}>{display}</span>
                </div>
                <div style={{ marginLeft: '36px', height: '4px', borderRadius: '99px', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: LIME, borderRadius: '99px' }} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </Layout>
  );
}
