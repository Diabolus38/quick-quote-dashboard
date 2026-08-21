import { useState, useEffect, useMemo } from 'react';
import Layout from '../../Layout';
import { supabase } from '../../lib/supabase';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';
const CARD    = { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px' };

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

export default function Analytics() {
  const [clients,       setClients]       = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [range,         setRange]         = useState('30');
  const [events,        setEvents]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState('');

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
      const s = sessions[e.session_id] || (sessions[e.session_id] = { opened: false, steps: {}, pdf: false, email: false, first: e.created_at });
      if (e.created_at < s.first) s.first = e.created_at;
      if (e.event_type === 'bubble_opened')  s.opened = true;
      if (e.event_type === 'pdf_downloaded') s.pdf = true;
      if (e.event_type === 'email_sent')     s.email = true;
      if (e.event_type === 'step_reached') {
        const step = e.event_data?.step;
        if (step && (!s.steps[step] || e.created_at < s.steps[step])) s.steps[step] = e.created_at;
      }
    }
    const sessionList = Object.values(sessions);
    const totalSessions = sessionList.length;
    const openedCount = sessionList.filter(s => s.opened).length;

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
      step,
      label: STEP_LABELS[step] || step,
      sessions: sessionList.filter(s => step in s.steps).length,
      isContact: isContactStep(step),
      isResult: isResultStep(step),
    }));

    const contactStep = stepOrder.find(isContactStep);
    const resultStep  = stepOrder.find(isResultStep);
    const reachedContact  = contactStep ? sessionList.filter(s => contactStep in s.steps).length : null;
    const completed       = resultStep  ? sessionList.filter(s => resultStep in s.steps).length
                          : sessionList.filter(s => s.pdf || s.email).length;
    const abandonedContact = (contactStep && resultStep)
      ? sessionList.filter(s => contactStep in s.steps && !(resultStep in s.steps)).length
      : null;

    // Average furthest step index (1-based) among sessions that reached at least one step.
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
    const base = openedCount || totalSessions;

    return { totalSessions, openedCount, funnel, reachedContact, completed, abandonedContact,
             avgFurthest, stepCount: stepOrder.length, pdfCount, emailCount, base };
  }, [events]);

  const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

  const tiles = [
    { label: 'Sessions (bubble opened)', value: stats.openedCount || stats.totalSessions, sub: 'unique visits that opened the tool' },
    { label: 'Completed (saw price)', value: stats.completed, sub: `${pct(stats.completed, stats.base)}% of opened` },
    { label: 'Avg. furthest step', value: stats.stepCount ? `${stats.avgFurthest.toFixed(1)} / ${stats.stepCount}` : '—', sub: 'among sessions that answered anything' },
    { label: 'Abandoned at contact form', value: stats.abandonedContact ?? '—', sub: stats.abandonedContact === null ? 'no contact step seen yet' : 'reached contact, never finished' },
    { label: 'PDF downloads', value: stats.pdfCount, sub: `${stats.emailCount} sent by email` },
  ];

  return (
    <Layout title="Analytics" subtitle="Widget funnel: from bubble click to completed estimate.">
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {tiles.map(t => (
          <div key={t.label} style={CARD}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#9ca3af', fontFamily: FONT }}>{t.label}</p>
            <p style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '800', color: '#0d1117', fontFamily: FONT }}>{loading ? '…' : t.value}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>{t.sub}</p>
          </div>
        ))}
      </div>

      <div style={CARD}>
        <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Funnel</p>
        <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Unique sessions reaching each step. Step order is derived from real visitor timing.</p>
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
    </Layout>
  );
}
