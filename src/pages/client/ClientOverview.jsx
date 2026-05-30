import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../ClientLayout';
import OnboardingBanner from '../../components/OnboardingBanner';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const STATUS_COLORS = {
  'New':         { bg: '#dbeafe', color: '#1d4ed8' },
  'Contacted':   { bg: '#fef9c3', color: '#854d0e' },
  'In Progress': { bg: '#ede9fe', color: '#7c3aed' },
  'Closed Won':  { bg: '#dcfce7', color: '#166534' },
  'Closed Lost': { bg: '#fee2e2', color: '#991b1b' },
};

function formatDate(str) {
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px' };
const COLUMNS = ['Name', 'Municipality', 'Estimated Price', 'Status', 'Date'];

export default function ClientOverview() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [leads,         setLeads]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [hoveredRow,    setHoveredRow]    = useState(null);
  const [showToast,     setShowToast]     = useState(false);
  const [hoveredAction,  setHoveredAction]  = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
    if (!profile?.client_id) return;
    supabase.from('leads').select('*').eq('client_id', profile.client_id).order('created_at', { ascending: false })
      .then(({ data }) => { setLeads(data || []); setLoading(false); });

    const channel = supabase
      .channel(`overview-leads-${profile.client_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `client_id=eq.${profile.client_id}` }, payload => {
        setLeads(prev => [payload.new, ...prev]);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const now = new Date();
  const thisMonthLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todayLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    return d.toDateString() === now.toDateString();
  });
  const wonLeads = leads.filter(l => l.status === 'Closed Won');
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const avg = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (Number(l.estimated_price) || 0), 0) / leads.length)
    : null;

  const statCards = [
    { label: 'Leads Today',        value: loading ? '—' : String(todayLeads.length),    color: '#ecfccb', textColor: '#3f6212', icon: '📥' },
    { label: 'Leads This Month',   value: loading ? '—' : String(thisMonthLeads.length), color: '#dbeafe', textColor: '#1d4ed8', icon: '📊' },
    { label: 'Conversion Rate',    value: loading ? '—' : `${conversionRate}%`,          color: '#dcfce7', textColor: '#166534', icon: '🎯' },
    { label: 'Avg Estimate Value', value: loading ? '—' : avg != null ? `${avg.toLocaleString()} kr` : '—', color: '#fef9c3', textColor: '#854d0e', icon: '💰' },
  ];

  const recentLeads = leads.slice(0, 8);

  return (
    <ClientLayout title="Overview">
      {showToast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, backgroundColor: '#0d1f12', color: '#fff', borderRadius: '12px', padding: '14px 20px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          New lead just came in!
        </div>
      )}
      <div style={{ fontFamily: FONT }}>

        <OnboardingBanner />

        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>Overview</h1>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>
            {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}.` : 'Welcome back.'} Here's your dashboard.
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(card => (
            <div key={card.label} style={CARD}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: card.color, color: card.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '14px' }}>{card.icon}</div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Recent submissions table */}
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Recent Submissions</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Last {recentLeads.length} leads</span>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>Loading…</div>
          ) : recentLeads.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>
              No leads yet. Your leads will appear here once customers use your estimator tool.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fbf9' }}>
                  {COLUMNS.map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '11px 24px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', borderBottom: '1px solid #e8ede8' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, i) => {
                  const sc = STATUS_COLORS[lead.status] || { bg: '#f3f4f6', color: '#6b7280' };
                  return (
                    <tr key={lead.id}
                      onClick={() => navigate('/client/leads/' + lead.id)}
                      onMouseEnter={() => setHoveredRow(lead.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid #f4f6f4' : 'none', cursor: 'pointer', backgroundColor: hoveredRow === lead.id ? '#f9faf9' : 'transparent' }}>
                      <td style={{ padding: '14px 24px', fontWeight: '600', color: '#0d1117' }}>{lead.name || '—'}</td>
                      <td style={{ padding: '14px 24px', color: '#4b5563' }}>{lead.municipality || '—'}</td>
                      <td style={{ padding: '14px 24px', fontWeight: '600', color: '#0d1117' }}>
                        {lead.estimated_price != null && !isNaN(Number(lead.estimated_price)) ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: sc.bg, color: sc.color }}>
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', color: '#9ca3af' }}>{formatDate(lead.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ ...CARD, marginTop: '24px' }}>
          <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { key: 'leads',     icon: '📋', label: 'View All Leads',    path: '/client/leads'     },
              { key: 'pricing',   icon: '💰', label: 'Configure Pricing',  path: '/client/pricing'   },
              { key: 'questions', icon: '✏️', label: 'Edit Questions',     path: '/client/questions' },
              { key: 'embed',     icon: '🔗', label: 'Get Embed Code',     path: '/client/settings'  },
            ].map(action => (
              <div key={action.key}
                onClick={() => navigate(action.path)}
                onMouseEnter={() => setHoveredAction(action.key)}
                onMouseLeave={() => setHoveredAction(null)}
                style={{ backgroundColor: hoveredAction === action.key ? '#f9faf9' : '#fff', border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'background-color 0.12s' }}>
                <span style={{ fontSize: '22px' }}>{action.icon}</span>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{action.label}</span>
              </div>
            ))}
            <div
              onClick={() => setShowStatsModal(true)}
              onMouseEnter={() => setHoveredAction('reports')}
              onMouseLeave={() => setHoveredAction(null)}
              style={{ backgroundColor: hoveredAction === 'reports' ? '#f9faf9' : '#fff', border: '1px solid #e8ede8', borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'background-color 0.12s' }}>
              <span style={{ fontSize: '22px' }}>📈</span>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>View Reports</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ ...CARD, marginTop: '24px' }}>
          <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Recent Activity</p>
          {leads.slice(0, 5).length === 0 ? (
            <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af', textAlign: 'center', padding: '16px 0', fontFamily: FONT }}>No leads yet.</p>
          ) : leads.slice(0, 5).map((lead, i, arr) => {
            const statusKey = (lead.status || '').toLowerCase().replace(/\s+/g, '_');
            const dotColor = statusKey === 'closed_won' ? '#16a34a' : statusKey === 'closed_lost' ? '#dc2626' : statusKey === 'in_progress' ? '#7c3aed' : statusKey === 'contacted' ? '#d97706' : '#a3e635';
            const diff = Date.now() - new Date(lead.created_at).getTime();
            const mins = Math.floor(diff / 60000);
            const timeAgoStr = mins < 1 ? 'just now' : mins < 60 ? `${mins} mins ago` : mins < 1440 ? `${Math.floor(mins/60)} hours ago` : `${Math.floor(mins/1440)} days ago`;
            return (
              <div key={lead.id}
                onClick={() => navigate('/client/leads/' + lead.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f4f6f4' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{lead.name || '—'}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{timeAgoStr}</p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0d1117', fontFamily: FONT, whiteSpace: 'nowrap' }}>
                  {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {showStatsModal && (() => {
        const weekStart = (() => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - d.getDay()); return d; })();
        const thisWeek  = leads.filter(l => new Date(l.created_at) >= weekStart).length;
        const statsRows = [
          { label: 'Total Leads Ever',       value: String(leads.length) },
          { label: 'Leads This Month',        value: String(thisMonthLeads.length) },
          { label: 'Leads This Week',         value: String(thisWeek) },
          { label: 'Total Won Leads',         value: String(wonLeads.length) },
          { label: 'Conversion Rate',         value: `${conversionRate}%` },
          { label: 'Average Estimate Value',  value: avg != null ? `${avg.toLocaleString()} kr` : '—' },
        ];
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) setShowStatsModal(false); }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '36px', width: '560px', maxWidth: '90vw', boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: FONT }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0d1117' }}>Your Stats Summary</h2>
                <button type="button" onClick={() => setShowStatsModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#9ca3af', lineHeight: 1, padding: '4px' }}>×</button>
              </div>
              {statsRows.map(({ label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                  <span style={{ fontSize: '13.5px', color: '#6b7280', fontFamily: FONT }}>{label}</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </ClientLayout>
  );
}
