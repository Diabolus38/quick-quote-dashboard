import Layout from '../Layout';

const ACCENT = '#0d3d2a';

/* ── data ── */
// heights as % of 160px chart area; W(100%) and F(88%) are dark
const barData = [
  { day: 'S', pct: 55 },
  { day: 'M', pct: 70 },
  { day: 'T', pct: 45, label: '74%' },
  { day: 'W', pct: 100, dark: true },
  { day: 'T', pct: 65 },
  { day: 'F', pct: 88, dark: true },
  { day: 'S', pct: 40 },
];

const recentEstimates = [
  { client: 'Bergström AB',    date: 'Apr 17, 2026', color: '#fbbf24' },
  { client: 'Hansson Bygg',   date: 'Apr 15, 2026', color: '#60a5fa' },
  { client: 'Lindqvist & Co', date: 'Apr 14, 2026', color: '#f472b6' },
  { client: 'Norén Teknik',   date: 'Apr 11, 2026', color: '#34d399' },
  { client: 'Åberg Konsult',  date: 'Apr 09, 2026', color: '#a78bfa' },
];

const submissions = [
  { name: 'Erik Bergström',   company: 'Bergström AB',    initials: 'EB', color: '#fef9c3', text: '#92400e', status: 'Completed',   sBg: '#dcfce7', sTx: '#16a34a' },
  { name: 'Sara Lindqvist',   company: 'Lindqvist & Co',  initials: 'SL', color: '#dbeafe', text: '#1e40af', status: 'In Progress',  sBg: '#fef9c3', sTx: '#854d0e' },
  { name: 'Mikael Hansson',   company: 'Hansson Bygg',    initials: 'MH', color: '#fce7f3', text: '#9d174d', status: 'Pending',      sBg: '#ffedd5', sTx: '#9a3412' },
  { name: 'Anna Norén',       company: 'Norén Teknik',    initials: 'AN', color: '#d1fae5', text: '#065f46', status: 'Completed',   sBg: '#dcfce7', sTx: '#16a34a' },
];

export default function AdminOverview() {
  return (
    <Layout title="Overview">
      {/* Outer white container */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '32px',
      }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.4px' }}>
              Dashboard
            </h1>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>
              Plan, prioritize and accomplish your tasks with ease.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" style={{
              backgroundColor: ACCENT, color: '#fff',
              border: 'none', borderRadius: '99px',
              padding: '9px 20px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              + Add Client
            </button>
            <button type="button" style={{
              backgroundColor: '#fff', color: '#0d1117',
              border: '1px solid #d1d5db', borderRadius: '99px',
              padding: '9px 20px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Import Data
            </button>
          </div>
        </div>

        {/* ── Row 1: 4 stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          {/* Hero card */}
          <div style={{
            backgroundColor: ACCENT, borderRadius: '16px', padding: '18px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Total Clients
              </span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ArrowIcon color="#fff" />
              </div>
            </div>
            <div>
              <p style={{ margin: '8px 0 14px', fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>
                8
              </p>
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
                backgroundColor: 'rgba(255,255,255,0.15)', color: '#a7f3d0',
                fontSize: '11px', fontWeight: '500',
              }}>
                + 2 new this month
              </span>
            </div>
          </div>

          {/* White stat cards */}
          {[
            { label: 'Estimates This Month', value: '143',        sub: 'Increased from last month', arrow: true },
            { label: 'Revenue This Month',   value: '12,400 kr',  sub: 'Increased from last month', arrow: true },
            { label: 'Pending Invoices',     value: '2',          sub: 'On review',                 arrow: false },
          ].map((c) => (
            <div key={c.label} style={{
              backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0',
              padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {c.label}
                </span>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: '1.5px solid #e5e7eb',
                  backgroundColor: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <ArrowIcon color="#9ca3af" />
                </div>
              </div>
              <div>
                <p style={{ margin: '8px 0 10px', fontSize: '36px', fontWeight: '700', color: '#0d1117', letterSpacing: '-1px', lineHeight: 1 }}>
                  {c.value}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {c.arrow && <span style={{ fontSize: '11px', color: '#16a34a' }}>↑</span>}
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{c.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 2: 3 columns ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '55% 22% 23%', gap: '16px', marginBottom: '16px' }}>

          {/* Bar chart */}
          <div style={{ backgroundColor: '#fafafa', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '22px' }}>
            <p style={sectionTitle}>Estimate Analytics</p>
            {/* chart area: 160px tall, bars anchored to bottom */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '160px', marginTop: '20px' }}>
              {barData.map((b, i) => {
                const barH = Math.round((b.pct / 100) * 160);
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {b.label && (
                        <span style={{
                          position: 'absolute', top: `-${18}px`,
                          fontSize: '10px', fontWeight: '600', color: ACCENT, whiteSpace: 'nowrap',
                        }}>
                          {b.label}
                        </span>
                      )}
                      <div style={{
                        width: '100%',
                        height: `${barH}px`,
                        borderRadius: '99px 99px 0 0',
                        backgroundColor: b.dark ? ACCENT : '#e8e8e8',
                      }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>{b.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming */}
          <div style={{ backgroundColor: '#fafafa', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '22px', display: 'flex', flexDirection: 'column' }}>
            <p style={sectionTitle}>Upcoming</p>
            <div style={{
              marginTop: '12px', flex: 1,
              backgroundColor: ACCENT, borderRadius: '14px', padding: '20px',
              minHeight: '160px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '700', color: '#fff', lineHeight: 1.3 }}>
                  New Client Onboarding
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                  Time: 02:00 pm – 04:00 pm
                </p>
              </div>
              <button type="button" style={{
                marginTop: '20px', width: '100%',
                backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: '99px',
                padding: '8px 0', fontSize: '12px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                View Details
              </button>
            </div>
          </div>

          {/* Recent estimates list */}
          <div style={{ backgroundColor: '#fafafa', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={sectionTitle}>Recent Estimates</span>
              <button type="button" style={{
                backgroundColor: 'transparent', color: '#0d1117',
                border: '1px solid #d1d5db', borderRadius: '99px',
                padding: '4px 12px', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                + New
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentEstimates.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: e.color, flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117' }}>{e.client}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{e.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: 2 columns ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px' }}>

          {/* Recent submissions */}
          <div style={{ backgroundColor: '#fafafa', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={sectionTitle}>Recent Submissions</span>
              <button type="button" style={{
                backgroundColor: ACCENT, color: '#fff',
                border: 'none', borderRadius: '99px',
                padding: '5px 14px', fontSize: '11px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                + Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {submissions.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    backgroundColor: s.color, color: s.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '700',
                  }}>
                    {s.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0d1117' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: ACCENT, fontWeight: '500' }}>{s.company}</div>
                  </div>
                  <span style={{
                    padding: '3px 11px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
                    backgroundColor: s.sBg, color: s.sTx, whiteSpace: 'nowrap',
                  }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly progress */}
          <div style={{ backgroundColor: '#fafafa', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ ...sectionTitle, alignSelf: 'flex-start', marginBottom: '16px' }}>Monthly Progress</p>

            {/* Donut */}
            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '8px 0 20px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '130px', height: '130px', transform: 'rotate(-90deg)' }}>
                {/* track */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0f0f0" strokeWidth="3" />
                {/* completed: 78% */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={ACCENT} strokeWidth="3"
                  strokeDasharray="78 22" strokeLinecap="round" />
                {/* in progress: 12% */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#86efac" strokeWidth="3"
                  strokeDasharray="12 88" strokeDashoffset="-78" strokeLinecap="round" />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '24px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.5px' }}>78%</span>
              </div>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#9ca3af' }}>Estimates Completed</p>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '180px' }}>
              {[
                { label: 'Completed',   dot: ACCENT,   solid: true  },
                { label: 'In Progress', dot: '#86efac', solid: false },
                { label: 'Pending',     dot: null,      solid: false },
              ].map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {l.dot ? (
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                      backgroundColor: l.solid ? l.dot : 'transparent',
                      border: l.solid ? 'none' : `2px solid ${l.dot}`,
                    }} />
                  ) : (
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                      background: 'repeating-linear-gradient(45deg, #d1d5db 0px, #d1d5db 2px, transparent 2px, transparent 5px)',
                      border: '1px solid #d1d5db',
                    }} />
                  )}
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

function ArrowIcon({ color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="10" x2="10" y2="2" />
      <polyline points="4,2 10,2 10,8" />
    </svg>
  );
}

const sectionTitle = {
  margin: 0,
  fontSize: '14px',
  fontWeight: '700',
  color: '#0d1117',
};
