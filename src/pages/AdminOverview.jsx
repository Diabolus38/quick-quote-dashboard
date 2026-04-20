import { useState } from 'react';
import Layout from '../Layout';

const DARK   = '#1a1f2e';
const GREEN  = '#16a34a';

/* ── Data ── */

const recentEstimatesData = [
  { name: 'Acme AB',    initials: 'AA', avatarBg: '#fef9c3', avatarColor: '#92400e', estimates: 34, total: '148,200 kr', pct: 46 },
  { name: 'NordBygg',   initials: 'NB', avatarBg: '#ede9fe', avatarColor: '#6d28d9', estimates: 28, total: '189,000 kr', pct: 61 },
  { name: 'VattSystem', initials: 'VS', avatarBg: '#fce7f3', avatarColor: '#9d174d', estimates: 17, total: '122,500 kr', pct: 57 },
  { name: 'EkoTeknik',  initials: 'ET', avatarBg: '#ccfbf1', avatarColor: '#0f766e', estimates: 21, total: '98,750 kr',  pct: 27 },
];

const tableRows = [
  { initials: 'EB', avatarBg: '#dbeafe', avatarColor: '#1d4ed8', name: 'Erik Bergström',  date: 'Apr 17, 2026', type: 'Service', price: '148,000 kr', status: 'Completed' },
  { initials: 'SL', avatarBg: '#fce7f3', avatarColor: '#9d174d', name: 'Sara Lindqvist',  date: 'Apr 15, 2026', type: 'Product', price: '122,500 kr', status: 'Pending'   },
  { initials: 'MH', avatarBg: '#d1fae5', avatarColor: '#065f46', name: 'Mikael Hansson',  date: 'Apr 14, 2026', type: 'Service', price: '189,000 kr', status: 'Sent'      },
  { initials: 'AN', avatarBg: '#fef9c3', avatarColor: '#92400e', name: 'Anna Norén',      date: 'Apr 11, 2026', type: 'Product', price: '98,750 kr',  status: 'Pending'   },
  { initials: 'JÅ', avatarBg: '#ede9fe', avatarColor: '#6d28d9', name: 'Johan Åberg',     date: 'Apr 09, 2026', type: 'Service', price: '114,200 kr', status: 'Completed' },
];

const calendarWeek = [
  { day: 'Sun', date: 19 },
  { day: 'Mon', date: 20, today: true },
  { day: 'Tue', date: 21 },
  { day: 'Wed', date: 22 },
  { day: 'Thu', date: 23 },
  { day: 'Fri', date: 24 },
  { day: 'Sat', date: 25 },
];

const activityItems = [
  { initials: 'EB', bg: '#fef9c3', color: '#92400e', name: 'Erik Bergström', action: 'Created a new estimate',   time: '2hrs ago'  },
  { initials: 'SL', bg: '#dbeafe', color: '#1d4ed8', name: 'Sara Lindqvist', action: 'Client added to account',  time: 'Just now'  },
  { initials: 'MH', bg: '#fce7f3', color: '#9d174d', name: 'Mikael Hansson', action: 'Invoice sent to client',   time: '5hrs ago'  },
  { initials: 'AD', bg: DARK,      color: '#fff',    name: 'Admin',          action: 'Updated billing settings', time: '1 day ago' },
];

const rightStatCards = [
  { iconBg: '#dbeafe', iconColor: '#1d4ed8', icon: '◎', label: 'Total Clients', value: '8',        barColor: '#1d4ed8', barWidth: '75%' },
  { iconBg: '#fef9c3', iconColor: '#ca8a04', icon: '⊞', label: 'Estimates',     value: '143',      barColor: '#ca8a04', barWidth: '60%' },
  { iconBg: '#ede9fe', iconColor: '#7c3aed', icon: '◈', label: 'Revenue',       value: '12.4K kr', barColor: '#7c3aed', barWidth: '45%' },
  { iconBg: '#ccfbf1', iconColor: '#0d9488', icon: '▤', label: 'Invoices',      value: '3',        barColor: '#0d9488', barWidth: '30%' },
];

/* ── Page ── */

export default function AdminOverview() {
  return (
    <Layout title="Homepage" rightPanel={<RightPanel />}>
      <LeftColumn />
    </Layout>
  );
}

/* ══════════════════ LEFT COLUMN ══════════════════ */

function LeftColumn() {
  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.5px' }}>
          Hello Admin, Good Morning
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
          Let's check your dashboard.
        </p>
      </div>

      {/* Inline stats */}
      <InlineStats />

      {/* Two cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <ClientOverviewCard />
        <RecentEstimatesCard />
      </div>

      {/* Table */}
      <EstimatesTable />
    </div>
  );
}

function InlineStats() {
  const stats = [
    { label: 'Total Revenue',   value: '12,400 kr', trend: '13.54% grow this month', trendColor: GREEN      },
    { label: 'Total Estimates', value: '143',        trend: '156 this month',         trendColor: '#2563eb'  },
    { label: 'Active Clients',  value: '8',          trend: '2 this week',            trendColor: '#d97706'  },
  ];
  return (
    <div style={{ display: 'flex', marginBottom: '28px' }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          flex: 1,
          padding: '0 32px',
          borderRight: i < stats.length - 1 ? '1px solid #e5e7eb' : 'none',
          paddingLeft: i === 0 ? '0' : '32px',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
            {s.label}
          </p>
          <p style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>
            {s.value}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: s.trendColor, fontWeight: '500' }}>
            {s.trend}
          </p>
        </div>
      ))}
    </div>
  );
}

function ClientOverviewCard() {
  const tiles = [
    { bg: '#fef9c3', icon: '⊞', iconColor: '#ca8a04', label: 'Active Clients',  value: '6'         },
    { bg: '#dbeafe', icon: '◎', iconColor: '#1d4ed8', label: 'New This Month',  value: '2'         },
    { bg: '#ede9fe', icon: '◈', iconColor: '#7c3aed', label: 'Estimates Sent',  value: '143'       },
    { bg: '#ccfbf1', icon: '▤', iconColor: '#0d9488', label: 'Avg Value',       value: '86,700 kr' },
  ];
  return (
    <div style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '16px', padding: '20px' }}>
      <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: '700', color: '#0d1117' }}>Client Overview</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.5px' }}>8</span>
        <span style={{ fontSize: '12px', color: GREEN, fontWeight: '500' }}>+2 this month</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {tiles.map((t) => (
          <div key={t.label} style={{ backgroundColor: t.bg, borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '16px', marginBottom: '8px', color: t.iconColor }}>{t.icon}</div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#6b7280' }}>{t.label}</p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0d1117' }}>{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentEstimatesCard() {
  return (
    <div style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0d1117' }}>Recent Estimates</span>
        <span style={{ fontSize: '12px', color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>View All</span>
      </div>
      <div>
        {recentEstimatesData.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            paddingBottom: i < recentEstimatesData.length - 1 ? '14px' : 0,
            marginBottom: i < recentEstimatesData.length - 1 ? '14px' : 0,
            borderBottom: i < recentEstimatesData.length - 1 ? '1px solid #f5f5f5' : 'none',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: item.avatarBg, color: item.avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700',
            }}>
              {item.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d1117' }}>{item.name}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.estimates} Estimates · {item.total} Total Amount
              </div>
            </div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0d1117', flexShrink: 0 }}>{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EstimatesTable() {
  const [hoveredRow, setHoveredRow] = useState(null);

  const statusStyle = {
    Completed: { color: GREEN,     fontWeight: '600' },
    Pending:   { color: '#d97706', fontWeight: '600' },
    Sent:      { color: '#2563eb', fontWeight: '600' },
  };

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '16px', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0d1117' }}>Estimates</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search estimate..."
            style={{
              border: '1px solid #e5e7eb', borderRadius: '8px',
              padding: '6px 12px', fontSize: '13px', color: '#0d1117',
              outline: 'none', fontFamily: 'inherit', width: '200px',
            }}
          />
          <button type="button" style={{
            border: '1px solid #e5e7eb', borderRadius: '8px',
            padding: '6px 10px', backgroundColor: '#fff',
            cursor: 'pointer', fontSize: '14px', color: '#6b7280',
            lineHeight: 1,
          }}>
            ▤
          </button>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            {['', 'Name', 'Date', 'Type', 'Price', 'Status', ''].map((col, i) => (
              <th key={i} style={{
                textAlign: i <= 1 ? 'left' : 'left',
                padding: '8px 12px',
                fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px',
                textTransform: 'uppercase', color: '#9ca3af',
                borderBottom: '1px solid #f0f0f0',
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, i) => (
            <tr
              key={i}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                backgroundColor: hoveredRow === i ? '#fafafa' : 'transparent',
                borderBottom: i < tableRows.length - 1 ? '1px solid #f5f5f5' : 'none',
              }}
            >
              <td style={{ padding: '12px 12px', width: '36px' }}>
                <input type="checkbox" style={{ cursor: 'pointer', accentColor: DARK }} />
              </td>
              <td style={{ padding: '12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: row.avatarBg, color: row.avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: '700',
                  }}>
                    {row.initials}
                  </div>
                  <span style={{ fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>{row.name}</span>
                </div>
              </td>
              <td style={{ padding: '12px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{row.date}</td>
              <td style={{ padding: '12px 12px', color: '#6b7280' }}>{row.type}</td>
              <td style={{ padding: '12px 12px', fontWeight: '600', color: '#0d1117', whiteSpace: 'nowrap' }}>{row.price}</td>
              <td style={{ padding: '12px 12px' }}>
                <span style={statusStyle[row.status]}>{row.status}</span>
              </td>
              <td style={{ padding: '12px 12px', color: '#9ca3af', cursor: 'pointer', letterSpacing: '2px', textAlign: 'center' }}>
                ···
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════ RIGHT PANEL ══════════════════ */

function RightPanel() {
  return (
    <div>
      <StatGrid />
      <CalendarWidget />
      <ActivityLog />
    </div>
  );
}

function StatGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
      {rightStatCards.map((card) => (
        <div key={card.label} style={{
          backgroundColor: '#fff', border: '1px solid #f0f0f0',
          borderRadius: '12px', padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: card.iconBg, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', color: card.iconColor,
            }}>
              {card.icon}
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', lineHeight: 1.2 }}>{card.label}</span>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: '26px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.5px', lineHeight: 1 }}>
            {card.value}
          </p>
          <div style={{ height: '4px', backgroundColor: '#f0f0f0', borderRadius: '99px' }}>
            <div style={{ height: '100%', width: card.barWidth, backgroundColor: card.barColor, borderRadius: '99px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarWidget() {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0d1117' }}>Apr 2026</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['‹', '›'].map((arrow) => (
            <button key={arrow} type="button" style={{
              width: '28px', height: '28px',
              border: '1px solid #e5e7eb', borderRadius: '6px',
              backgroundColor: '#fff', cursor: 'pointer',
              fontSize: '16px', color: '#6b7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit', lineHeight: 1,
            }}>
              {arrow}
            </button>
          ))}
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '6px' }}>
        {calendarWeek.map((d) => (
          <div key={d.day} style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', fontWeight: '500', padding: '2px 0' }}>
            {d.day.slice(0, 1)}
          </div>
        ))}
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {calendarWeek.map((d) => (
          <div key={d.date} style={{
            textAlign: 'center', padding: '6px 0',
            borderRadius: '8px',
            backgroundColor: d.today ? DARK : 'transparent',
            color: d.today ? '#fff' : '#6b7280',
            fontSize: '13px', fontWeight: d.today ? '700' : '500',
          }}>
            {d.date}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityLog() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0d1117' }}>Activity Log</span>
        <span style={{ fontSize: '12px', color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>View All</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activityItems.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: item.bg, color: item.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700',
            }}>
              {item.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117' }}>{item.name}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{item.action}</div>
            </div>
            <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', marginTop: '2px' }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
