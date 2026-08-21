import { useState, useEffect, useMemo } from 'react';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';
const CARD    = { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px' };
const SECTION_TITLE = { margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#0d1117', fontFamily: FONT };
const SECTION_SUB   = { margin: '0 0 20px', fontSize: '12px', color: '#9ca3af', fontFamily: FONT, lineHeight: '1.5' };

const RANGES = [
  { key: '7',   label: 'Last 7 days'  },
  { key: '30',  label: 'Last 30 days' },
  { key: '90',  label: 'Last 90 days' },
  { key: 'all', label: 'All time'     },
];

// Friendly labels for known step keys; anything unknown renders as its raw key.
const STEP_LABELS = {
  language: 'Language', municipality: 'Municipality', projectType: 'Project Type',
  wastewaterType: 'Wastewater System', propertyUsage: 'Property Usage', households: 'Households',
  existingSystem: 'Existing System', existingTankReusable: 'Tank Reusable', tankInspectionRequired: 'Tank Inspection',
  municipalityPlanning: 'Municipality Planning', installationType: 'Installation Type', groundConditions: 'Ground Conditions',
  pipeDepth: 'Pipe Depth', excavationRequired: 'Excavation', transportHelp: 'Transport Help', additionalWork: 'Additional Work',
  contact: 'Contact Form', result: 'Result / Price',
};
const isContactStep = s => /contact/i.test(s);
const isResultStep  = s => /result|complete|price|summary/i.test(s);

const DEVICE_LABELS = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' };

// Gaps longer than this are treated as "left the tab open", not real time spent on a step.
const MAX_STEP_GAP_MS = 30 * 60 * 1000;
// Same idea for total time-to-finish.
const MAX_COMPLETE_MS = 2 * 60 * 60 * 1000;

function median(nums) {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatDuration(ms) {
  if (ms == null) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m === 0 ? `${s}s` : `${m}m ${s}s`;
}

function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

export default function Analytics() {
  const [clients,        setClients]        = useState([]);
  const [selectedClient, setSelectedClient]  = useState('all');
  const [range,          setRange]           = useState('30');
  const [events,         setEvents]          = useState([]);
  const [loading,        setLoading]         = useState(true);
  const [loadError,      setLoadError]       = useState('');

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name')
      .then(({ data }) => setClients(data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    let q = supabase.from('widget_events')
      .select('client_id, session_id, event_type, event_data, created_at')
      .order('created_at', { ascending: false })
      .limit(50000);
    if (selectedClient !== 'all') q = q.eq('client_id', selectedClient);
    if (range !== 'all') {
      const start = new Date(Date.now() - Number(range) * 86400000).toISOString();
      q = q.gte('created_at', start);
    }
    q.then(({ data, error }) => {
      if (error) { setLoadError(error.message); setEvents([]); }
      else setEvents(data || []);
      setLoading(false);
    });
  }, [selectedClient, range]);

  const stats = useMemo(() => {
    const sessions = {};
    for (const e of events) {
      const s = sessions[e.session_id] || (sessions[e.session_id] = {
        opened: false, steps: {}, pdf: false, email: false, first: e.created_at, clientId: e.client_id,
        device: null, referrer: null, language: null, utmSource: null, utmMedium: null, utmCampaign: null,
      });
      if (e.created_at < s.first) s.first = e.created_at;
      if (e.event_type === 'bubble_opened')  s.opened = true;
      if (e.event_type === 'pdf_downloaded') s.pdf = true;
      if (e.event_type === 'email_sent')     s.email = true;
      if (e.event_type === 'step_reached') {
        const step = e.event_data?.step;
        if (step && (!s.steps[step] || e.created_at < s.steps[step])) s.steps[step] = e.created_at;
      }
      const d = e.event_data || {};
      if (!s.device      && d.device)       s.device      = d.device;
      if (!s.referrer    && d.referrer)     s.referrer    = d.referrer;
      if (!s.language    && d.language)     s.language    = d.language;
      if (!s.utmSource   && d.utm_source)   s.utmSource   = d.utm_source;
      if (!s.utmMedium   && d.utm_medium)   s.utmMedium   = d.utm_medium;
      if (!s.utmCampaign && d.utm_campaign) s.utmCampaign = d.utm_campaign;
    }
    const sessionList = Object.values(sessions);
    const totalSessions = sessionList.length;
    const openedCount = sessionList.filter(s => s.opened).length;
    const base = openedCount || totalSessions;

    // Discover steps dynamically; order by average time-offset from session start.
    const stepOffsets = {};
    for (const s of sessionList) {
      const t0 = new Date(s.first).getTime();
      for (const [step, at] of Object.entries(s.steps)) {
        (stepOffsets[step] = stepOffsets[step] || []).push(new Date(at).getTime() - t0);
      }
    }
    const stepOrder = Object.keys(stepOffsets).sort((a, b) => {
      const avg = arr => arr.reduce((x, y) => x + y, 0) / arr.length;
      return avg(stepOffsets[a]) - avg(stepOffsets[b]);
    });

    const funnel = stepOrder.map(step => ({
      step, label: STEP_LABELS[step] || step,
      sessions: sessionList.filter(s => step in s.steps).length,
      isContact: isContactStep(step), isResult: isResultStep(step),
    }));

    const contactStep = stepOrder.find(isContactStep);
    const resultStep  = stepOrder.find(isResultStep);
    const reachedContact  = contactStep ? sessionList.filter(s => contactStep in s.steps).length : null;
    const completed       = resultStep  ? sessionList.filter(s => resultStep in s.steps).length
                          : sessionList.filter(s => s.pdf || s.email).length;
    const abandonedContact = (contactStep && resultStep)
      ? sessionList.filter(s => contactStep in s.steps && !(resultStep in s.steps)).length
      : null;
    const hasCompleted = s => resultStep ? resultStep in s.steps : (s.pdf || s.email);

    const withSteps = sessionList.filter(s => Object.keys(s.steps).length > 0);
    const avgFurthest = withSteps.length
      ? withSteps.reduce((sum, s) => {
          let furthest = 0;
          stepOrder.forEach((step, i) => { if (step in s.steps) furthest = i + 1; });
          return sum + furthest;
        }, 0) / withSteps.length
      : 0;

    const pdfCount   = sessionList.filter(s => s.pdf).length;
    const emailCount = sessionList.filter(s => s.email).length;

    // Biggest single leak: the step->next-step transition with the highest drop percentage,
    // among transitions with enough visitors to trust the number.
    let biggestLeak = null;
    for (let i = 0; i < funnel.length - 1; i++) {
      const here = funnel[i].sessions;
      const next = funnel[i + 1].sessions;
      if (here < 5) continue;
      const dropPct = Math.round(((here - next) / here) * 100);
      if (dropPct <= 0) continue;
      if (!biggestLeak || dropPct > biggestLeak.dropPct) {
        biggestLeak = { label: funnel[i].label, nextLabel: funnel[i + 1].label, dropPct };
      }
    }

    // Median time spent on each step: gap between reaching it and reaching the next one, per session.
    const stepDurations = {};
    for (const s of sessionList) {
      const reached = stepOrder
        .filter(step => step in s.steps)
        .map(step => ({ step, t: new Date(s.steps[step]).getTime() }))
        .sort((a, b) => a.t - b.t);
      for (let i = 0; i < reached.length - 1; i++) {
        const gap = reached[i + 1].t - reached[i].t;
        if (gap > 0 && gap <= MAX_STEP_GAP_MS) {
          (stepDurations[reached[i].step] = stepDurations[reached[i].step] || []).push(gap);
        }
      }
    }
    const timePerStep = stepOrder
      .filter(step => (stepDurations[step]?.length || 0) >= 3)
      .map(step => ({ step, label: STEP_LABELS[step] || step, medianMs: median(stepDurations[step]) }));

    // Typical total time to finish, for sessions that reached the result step.
    let finishDurations = [];
    if (resultStep) {
      finishDurations = sessionList
        .filter(s => resultStep in s.steps)
        .map(s => new Date(s.steps[resultStep]).getTime() - new Date(s.first).getTime())
        .filter(ms => ms > 0 && ms <= MAX_COMPLETE_MS);
    }
    const typicalFinishMs = finishDurations.length ? median(finishDurations) : null;

    // Trend over time: bucket by day for short ranges, by week for long ones (keeps the chart readable).
    const bucketByWeek = range === '90' || range === 'all';
    const bucketKey = iso => {
      const d = new Date(iso);
      if (!bucketByWeek) return d.toISOString().slice(0, 10);
      const day = (d.getUTCDay() + 6) % 7; // Monday = 0
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() - day);
      return monday.toISOString().slice(0, 10);
    };
    const trendMap = {};
    for (const s of sessionList) {
      const key = bucketKey(s.first);
      const t = trendMap[key] || (trendMap[key] = { key, opened: 0, completed: 0 });
      if (s.opened || !openedCount) t.opened += 1;
      if (hasCompleted(s)) t.completed += 1;
    }
    let trend = Object.values(trendMap).sort((a, b) => a.key.localeCompare(b.key));
    const trendTruncated = trend.length > 26;
    if (trendTruncated) trend = trend.slice(trend.length - 26);

    // Device breakdown.
    const deviceMap = {};
    for (const s of sessionList) {
      const key = s.device && DEVICE_LABELS[s.device] ? s.device : 'unknown';
      const t = deviceMap[key] || (deviceMap[key] = { key, sessions: 0, completed: 0 });
      t.sessions += 1;
      if (hasCompleted(s)) t.completed += 1;
    }
    const devices = Object.values(deviceMap).sort((a, b) => b.sessions - a.sessions);

    // Traffic source: utm_source when present, else the referring domain, else "Direct".
    const sourceMap = {};
    for (const s of sessionList) {
      const key = s.utmSource || (s.referrer ? (hostnameOf(s.referrer) || s.referrer) : 'Direct / no link source');
      const t = sourceMap[key] || (sourceMap[key] = { key, sessions: 0, completed: 0 });
      t.sessions += 1;
      if (hasCompleted(s)) t.completed += 1;
    }
    const sources = Object.values(sourceMap).sort((a, b) => b.sessions - a.sessions).slice(0, 8);

    // Per-client breakdown (only meaningful when viewing all clients together).
    const clientMap = {};
    for (const s of sessionList) {
      if (!s.clientId) continue;
      const t = clientMap[s.clientId] || (clientMap[s.clientId] = { clientId: s.clientId, sessions: 0, completed: 0, leakCounts: {} });
      t.sessions += 1;
      if (hasCompleted(s)) t.completed += 1;
      const reached = stepOrder.filter(step => step in s.steps);
      const lastIdx = reached.length ? stepOrder.indexOf(reached[reached.length - 1]) : -1;
      if (lastIdx >= 0 && lastIdx < stepOrder.length - 1) {
        const stopStep = stepOrder[lastIdx];
        t.leakCounts[stopStep] = (t.leakCounts[stopStep] || 0) + 1;
      }
    }
    const perClient = Object.values(clientMap).map(c => {
      let topLeak = null, topLeakCount = 0;
      for (const [step, count] of Object.entries(c.leakCounts)) {
        if (count > topLeakCount) { topLeak = step; topLeakCount = count; }
      }
      return { ...c, topLeakLabel: c.sessions >= 5 && topLeak ? (STEP_LABELS[topLeak] || topLeak) : null };
    }).sort((a, b) => b.sessions - a.sessions);

    return {
      totalSessions, openedCount, base, funnel, reachedContact, completed, abandonedContact,
      avgFurthest, stepCount: stepOrder.length, pdfCount, emailCount,
      biggestLeak, timePerStep, typicalFinishMs, trend, trendTruncated, bucketByWeek,
      devices, sources, perClient,
    };
  }, [events, range]);

  const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

  const tiles = [
    { label: 'Sessions (bubble opened)', value: stats.openedCount || stats.totalSessions, sub: 'unique visits that opened the tool' },
    { label: 'Completed (saw price)', value: stats.completed, sub: `${pct(stats.completed, stats.base)}% of opened` },
    { label: 'How far people typically get', value: stats.stepCount ? `${stats.avgFurthest.toFixed(1)} / ${stats.stepCount} steps` : '—', sub: 'average, among sessions that answered anything' },
    { label: 'Abandoned at contact form', value: stats.abandonedContact ?? '—', sub: stats.abandonedContact === null ? 'no contact step seen yet' : 'reached contact, never finished' },
    { label: 'Typical time to finish', value: formatDuration(stats.typicalFinishMs), sub: stats.typicalFinishMs === null ? 'not enough completed sessions yet' : 'middle (median) session, start to price shown' },
    { label: 'PDF downloads', value: stats.pdfCount, sub: `${stats.emailCount} sent by email` },
  ];

  const maxTimePerStep = stats.timePerStep.length ? Math.max(...stats.timePerStep.map(r => r.medianMs)) || 1 : 1;
  const maxTrendOpened = stats.trend.length ? Math.max(...stats.trend.map(t => t.opened), 1) : 1;
  const trendLabelEvery = Math.max(1, Math.ceil(stats.trend.length / 8));
  const maxDeviceSessions = stats.devices.length ? Math.max(...stats.devices.map(d => d.sessions)) || 1 : 1;
  const maxSourceSessions = stats.sources.length ? Math.max(...stats.sources.map(s => s.sessions)) || 1 : 1;

  return (
    <Layout title="Analytics" subtitle="How visitors move through the widget: from bubble click to completed estimate.">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          style={{ border: '1px solid #e8ede8', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {RANGES.map(r => (
          <button key={r.key} type="button" onClick={() => setRange(r.key)}
            style={{ border: range === r.key ? 'none' : '1px solid #e8ede8', backgroundColor: range === r.key ? '#0d1f12' : '#fff', color: range === r.key ? '#fff' : '#6b7280', borderRadius: '10px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            {r.label}
          </button>
        ))}
      </div>

      {loadError && (
        <div style={{ ...CARD, marginBottom: '16px', border: '1px solid #fca5a5' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontFamily: FONT }}>Could not load events: {loadError}. Check that the widget_events read policy for super_admin exists in Supabase.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        {tiles.map(t => (
          <div key={t.label} style={CARD}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#9ca3af', fontFamily: FONT }}>{t.label}</p>
            <p style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '800', color: '#0d1117', fontFamily: FONT }}>{loading ? '…' : t.value}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{t.sub}</p>
          </div>
        ))}
      </div>

      {!loading && stats.biggestLeak && (
        <div style={{ ...CARD, marginBottom: '16px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '18px 24px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#9a3412', fontFamily: FONT, lineHeight: '1.6' }}>
            <strong>Biggest drop off:</strong> about {stats.biggestLeak.dropPct}% of visitors who reach &quot;{stats.biggestLeak.label}&quot; never make it to &quot;{stats.biggestLeak.nextLabel}&quot;. That's the step most worth looking at first if you want more people to finish.
          </p>
        </div>
      )}

      <div style={CARD}>
        <p style={SECTION_TITLE}>Funnel</p>
        <p style={SECTION_SUB}>Unique sessions reaching each step. Step order is derived from real visitor timing, not hardcoded.</p>
        {loading ? (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Loading…</p>
        ) : stats.funnel.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>No step events in this period yet. Data appears here as visitors use the tool.</p>
        ) : (
          <div>
            {[{ step: '_opened', label: 'Bubble opened', sessions: stats.base, isContact: false, isResult: false }, ...stats.funnel].map((row, i, arr) => {
              const max = arr[0].sessions || 1;
              const w = Math.max(2, Math.round((row.sessions / max) * 100));
              const prev = i > 0 ? arr[i - 1].sessions : null;
              const drop = prev !== null && prev > 0 ? Math.round(((prev - row.sessions) / prev) * 100) : null;
              return (
                <div key={row.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ width: '160px', flexShrink: 0, fontSize: '12.5px', fontWeight: row.isContact || row.isResult ? '700' : '500', color: '#374151', fontFamily: FONT, textAlign: 'right' }}>{row.label}</span>
                  <div style={{ flex: 1, height: '26px', backgroundColor: '#f3f4f6', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${w}%`, height: '100%', backgroundColor: row.isResult ? PRIMARY : row.isContact ? '#d97706' : LIME, borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: '700', color: row.isResult ? '#fff' : '#0d1f12', fontFamily: FONT, whiteSpace: 'nowrap' }}>{row.sessions}</span>
                    </div>
                  </div>
                  <span style={{ width: '70px', flexShrink: 0, fontSize: '11px', color: drop > 30 ? '#dc2626' : '#9ca3af', fontWeight: drop > 30 ? '700' : '500', fontFamily: FONT }}>{drop !== null && drop > 0 ? `−${drop}%` : ''}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ ...CARD, marginTop: '16px' }}>
        <p style={SECTION_TITLE}>Time spent on each step</p>
        <p style={SECTION_SUB}>How long visitors typically stay on each step before moving to the next one. Uses the middle (median) session so one person who left their tab open doesn't skew it, and leaves out any gap longer than 30 minutes for the same reason.</p>
        {stats.timePerStep.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Not enough sessions with two or more steps yet.</p>
        ) : (
          <div>
            {stats.timePerStep.map(row => {
              const w = Math.max(2, Math.round((row.medianMs / maxTimePerStep) * 100));
              return (
                <div key={row.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ width: '160px', flexShrink: 0, fontSize: '12.5px', fontWeight: '500', color: '#374151', fontFamily: FONT, textAlign: 'right' }}>{row.label}</span>
                  <div style={{ flex: 1, height: '22px', backgroundColor: '#f3f4f6', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${w}%`, height: '100%', backgroundColor: LIME, borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: '700', color: '#0d1f12', fontFamily: FONT, whiteSpace: 'nowrap' }}>{formatDuration(row.medianMs)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ ...CARD, marginTop: '16px' }}>
        <p style={SECTION_TITLE}>Sessions over time</p>
        <p style={SECTION_SUB}>
          {stats.bucketByWeek ? 'Grouped by week.' : 'Grouped by day.'} Opened vs. completed, so you can see if a change to the tool actually moved the needle.
          {stats.trendTruncated ? ' Showing the most recent 26 periods.' : ''}
        </p>
        {stats.trend.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>No data in this period yet.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '14px', marginBottom: '12px', fontSize: '11px', color: '#6b7280', fontFamily: FONT }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: LIME, display: 'inline-block' }} />Opened</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: PRIMARY, display: 'inline-block' }} />Completed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {stats.trend.map((t, i) => {
                const openedH = Math.max(2, Math.round((t.opened / maxTrendOpened) * 100));
                const completedH = t.completed ? Math.max(2, Math.round((t.completed / maxTrendOpened) * 100)) : 0;
                const showLabel = i % trendLabelEvery === 0 || i === stats.trend.length - 1;
                return (
                  <div key={t.key} title={`${t.key}: ${t.opened} opened, ${t.completed} completed`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100px' }}>
                      <div style={{ width: '7px', height: `${openedH}%`, backgroundColor: LIME, borderRadius: '2px 2px 0 0' }} />
                      <div style={{ width: '7px', height: `${completedH}%`, backgroundColor: PRIMARY, borderRadius: '2px 2px 0 0' }} />
                    </div>
                    <span style={{ fontSize: '9px', color: '#9ca3af', fontFamily: FONT, marginTop: '4px', whiteSpace: 'nowrap' }}>{showLabel ? t.key.slice(5) : ''}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ ...CARD, marginTop: '16px' }}>
        <p style={SECTION_TITLE}>Mobile vs. desktop</p>
        <p style={SECTION_SUB}>What device visitors are using, and whether one finishes more often than another.</p>
        {stats.devices.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>No data in this period yet.</p>
        ) : (
          <div>
            {stats.devices.map(d => {
              const w = Math.max(2, Math.round((d.sessions / maxDeviceSessions) * 100));
              const label = d.key === 'unknown' ? 'Unknown (older data)' : DEVICE_LABELS[d.key];
              return (
                <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ width: '130px', flexShrink: 0, fontSize: '12.5px', fontWeight: '500', color: '#374151', fontFamily: FONT, textAlign: 'right' }}>{label}</span>
                  <div style={{ flex: 1, height: '22px', backgroundColor: '#f3f4f6', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${w}%`, height: '100%', backgroundColor: LIME, borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: '700', color: '#0d1f12', fontFamily: FONT, whiteSpace: 'nowrap' }}>{d.sessions}</span>
                    </div>
                  </div>
                  <span style={{ width: '70px', flexShrink: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{pct(d.completed, d.sessions)}% finish</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ ...CARD, marginTop: '16px' }}>
        <p style={SECTION_TITLE}>Where visitors came from</p>
        <p style={SECTION_SUB}>Grouped by the campaign tag on the link (utm_source — for example a Facebook ad or newsletter link tagged with ?utm_source=facebook) when there is one, otherwise by the website that linked here. Top 8 shown.</p>
        {stats.sources.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>No data in this period yet.</p>
        ) : (
          <div>
            {stats.sources.map(src => {
              const w = Math.max(2, Math.round((src.sessions / maxSourceSessions) * 100));
              return (
                <div key={src.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ width: '160px', flexShrink: 0, fontSize: '12.5px', fontWeight: '500', color: '#374151', fontFamily: FONT, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.key}</span>
                  <div style={{ flex: 1, height: '22px', backgroundColor: '#f3f4f6', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${w}%`, height: '100%', backgroundColor: LIME, borderRadius: '6px 0 0 6px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: '700', color: '#0d1f12', fontFamily: FONT, whiteSpace: 'nowrap' }}>{src.sessions}</span>
                    </div>
                  </div>
                  <span style={{ width: '70px', flexShrink: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{pct(src.completed, src.sessions)}% finish</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedClient === 'all' && stats.perClient.length > 1 && (
        <div style={{ ...CARD, marginTop: '16px' }}>
          <p style={SECTION_TITLE}>How each client is doing</p>
          <p style={SECTION_SUB}>Same numbers as above, split out per client. &quot;Most common stopping point&quot; only shows once a client has at least 5 sessions, so one or two visitors don't look like a pattern.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
              <thead>
                <tr>
                  {['Client', 'Sessions', 'Completion', 'Most common stopping point'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', padding: '0 10px 8px', borderBottom: '1px solid #e8ede8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.perClient.map(c => {
                  const name = clients.find(cl => cl.id === c.clientId)?.name || c.clientId;
                  return (
                    <tr key={c.clientId}>
                      <td style={{ padding: '10px', fontSize: '13px', color: '#0d1117', borderBottom: '1px solid #f3f4f6' }}>{name}</td>
                      <td style={{ padding: '10px', fontSize: '13px', color: '#0d1117', borderBottom: '1px solid #f3f4f6' }}>{c.sessions}</td>
                      <td style={{ padding: '10px', fontSize: '13px', color: '#0d1117', borderBottom: '1px solid #f3f4f6' }}>{pct(c.completed, c.sessions)}%</td>
                      <td style={{ padding: '10px', fontSize: '13px', color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>{c.topLeakLabel || 'not enough data yet'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
