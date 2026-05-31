import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Layout from '../../Layout';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  padding: '22px',
  marginBottom: '16px',
};

const STATUS_COLORS = {
  'New':          '#1d4ed8',
  'Contacted':    '#d97706',
  'In Progress':  '#7c3aed',
  'Closed Won':   '#16a34a',
  'Closed Lost':  '#dc2626',
};

const STATUS_STAGES = ['New', 'Contacted', 'In Progress', 'Closed Won'];

const KEYS_ORDER = ['projectType','wastewaterType','propertyUsage','households','existingSystem','existingTankReusable','tankInspectionRequired','municipalityPlanning','installationType','groundConditions','pipeDepth','excavationRequired','transportHelp','additionalWork'];

const KEY_LABELS = {
  projectType:              'Project Type',
  wastewaterType:           'Wastewater System',
  propertyUsage:            'Property Usage',
  households:               'Number of Households',
  existingSystem:           'Existing System',
  existingTankReusable:     'Existing Tank Reusable',
  tankInspectionRequired:   'Tank Inspection Required',
  municipalityPlanning:     'Municipality Planning Required',
  installationType:         'Installation Type',
  groundConditions:         'Ground Conditions',
  pipeDepth:                'Pipe Depth',
  excavationRequired:       'Excavation Required',
  transportHelp:            'Transport Help Needed',
  additionalWork:           'Additional Work',
};

const VALUE_LABELS = {
  bdt:              'BDT (Biological Treatment)',
  wc:               'WC Only',
  wc_bdt:           'WC + BDT',
  new_installation: 'New Installation',
  replacement:      'Replacement',
  connected:        'Connected to municipal water',
  not_connected:    'Not connected',
  zone1:            'Zone 1',
  zone2:            'Zone 2',
  zone3:            'Zone 3',
  yes:              'Yes',
  no:               'No',
  maybe:            'Maybe',
  shallow:          'Shallow (0-1m)',
  medium:           'Medium (1-2m)',
  deep:             'Deep (2m+)',
};

const PLAN_STYLE = {
  scale:   { bg: '#ecfccb', color: '#3f6212' },
  growth:  { bg: '#ede9fe', color: '#7c3aed' },
  starter: { bg: '#dbeafe', color: '#1d4ed8' },
};

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>
      <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500' }}>{value || '—'}</span>
    </div>
  );
}

export default function AdminLeadDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [lead,     setLead]     = useState(null);
  const [client,   setClient]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notes,    setNotes]    = useState('');
  const [saveMsg,  setSaveMsg]  = useState('');
  const [prevLead, setPrevLead] = useState(null);
  const [nextLead, setNextLead] = useState(null);

  useEffect(() => { fetchData(); }, [id]);

  async function fetchData() {
    setLoading(true);
    const { data: leadData, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error || !leadData) { setNotFound(true); setLoading(false); return; }
    setLead(leadData);
    setNotes(leadData.notes || '');
    if (leadData.client_id) {
      const { data: clientData } = await supabase.from('clients').select('*').eq('id', leadData.client_id).single();
      setClient(clientData || null);
    }
    const [{ data: prev }, { data: next }] = await Promise.all([
      supabase.from('leads').select('id').eq('client_id', leadData.client_id).lt('created_at', leadData.created_at).order('created_at', { ascending: false }).limit(1),
      supabase.from('leads').select('id').eq('client_id', leadData.client_id).gt('created_at', leadData.created_at).order('created_at', { ascending: true }).limit(1),
    ]);
    setPrevLead(prev?.[0] || null);
    setNextLead(next?.[0] || null);
    setLoading(false);
  }

  async function updateStatus(newStatus) {
    await supabase.from('leads').update({ status: newStatus }).eq('id', id);
    setLead(prev => ({ ...prev, status: newStatus }));
  }

  async function saveNotes() {
    await supabase.from('leads').update({ notes }).eq('id', id);
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  if (loading) return (
    <Layout title="Lead Detail">
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      <div style={{ fontFamily: FONT }}>
        <div style={{ borderRadius: '8px', background: '#f0f0f0', height: '18px', width: '120px', marginBottom: '20px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '280px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '200px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '160px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div style={{ width: '300px', flexShrink: 0 }}>
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '180px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ borderRadius: '16px', background: '#f0f0f0', height: '220px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </Layout>
  );

  if (notFound) return (
    <Layout title="Lead Detail">
      <div style={{ textAlign: 'center', padding: '80px', color: '#dc2626', fontSize: '14px', fontFamily: FONT }}>Lead not found.</div>
    </Layout>
  );

  const answers  = typeof lead.answers === 'string' ? JSON.parse(lead.answers || '{}') : (lead.answers || {});
  const stageIdx = STATUS_STAGES.indexOf(lead.status?.trim());
  const isLost   = lead.status === 'Closed Lost';
  const planStyle = PLAN_STYLE[client?.plan] || PLAN_STYLE.starter;

  return (
    <Layout title="Lead Detail">
      <div style={{ fontFamily: FONT }}>

        {/* Back */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button type="button" onClick={() => navigate('/admin/leads')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Leads
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            {prevLead && <button type="button" onClick={() => navigate(`/admin/leads/${prevLead.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, fontFamily: FONT }}>← Previous Lead</button>}
            {nextLead && <button type="button" onClick={() => navigate(`/admin/leads/${nextLead.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, fontFamily: FONT }}>Next Lead →</button>}
          </div>
        </div>

        {/* Client badge */}
        {client && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <button type="button" onClick={() => navigate(`/admin/clients/${client.id}`)}
              style={{ background: 'none', border: '1px solid #e8ede8', borderRadius: '8px', padding: '4px 12px', fontSize: '12.5px', fontWeight: '600', color: PRIMARY, cursor: 'pointer', fontFamily: FONT }}>
              {client.name}
            </button>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: planStyle.bg, color: planStyle.color }}>
              {client.plan ? client.plan.charAt(0).toUpperCase() + client.plan.slice(1) : '—'}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* LEFT COLUMN */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Title + status */}
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>{lead.name || '—'}</h1>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#9ca3af' }}>
              {[lead.email, lead.phone, lead.municipality].filter(Boolean).join(' · ')}
            </p>
            <div style={{ marginBottom: '20px' }}>
              <select value={lead.status || 'New'} onChange={e => {
                const newStatus = e.target.value;
                if (newStatus === 'Closed Lost') {
                  if (!window.confirm('Mark this lead as Closed Lost? This will move it out of your active pipeline.')) {
                    e.target.value = lead.status || 'New';
                    return;
                  }
                }
                updateStatus(newStatus);
              }}
                style={{ border: '1px solid #d1d5db', borderRadius: '10px', padding: '8px 14px', fontSize: '13.5px', color: STATUS_COLORS[lead.status] || '#374151', fontWeight: '600', backgroundColor: '#fff', cursor: 'pointer', outline: 'none', fontFamily: FONT }}>
                {['New', 'Contacted', 'In Progress', 'Closed Won', 'Closed Lost'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Contact Details */}
            <div style={CARD}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Contact Details</p>
              <DetailRow label="Name"         value={lead.name}         />
              <DetailRow label="Email"        value={lead.email}        />
              <DetailRow label="Phone"        value={lead.phone}        />
              <DetailRow label="Company"      value={lead.company}      />
              <DetailRow label="Municipality" value={lead.municipality} />
              <DetailRow label="Language"     value={lead.language}     />
              <DetailRow label="Submitted"    value={formatDate(lead.created_at)} />
            </div>

            {/* Estimator Answers */}
            <div style={CARD}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Estimator Answers</p>
              {Object.keys(answers).length === 0 ? (
                <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>No answers recorded.</p>
              ) : (
                Object.entries(answers)
                  .sort(([a], [b]) => {
                    const ai = KEYS_ORDER.indexOf(a);
                    const bi = KEYS_ORDER.indexOf(b);
                    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
                  })
                  .map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>
                        {KEY_LABELS[key] || key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}
                      </span>
                      <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500' }}>{VALUE_LABELS[String(val)] || String(val)}</span>
                    </div>
                  ))
              )}
            </div>

            {/* Internal Notes */}
            <div style={CARD}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Internal Notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add internal notes about this lead…"
                style={{ width: '100%', minHeight: '120px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '12px 14px', fontSize: '13.5px', fontFamily: FONT, resize: 'vertical', outline: 'none', color: '#374151' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={saveNotes}
                  style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                  Save Notes
                </button>
                {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>{saveMsg}</span>}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ width: '300px', flexShrink: 0 }}>

            {/* Estimated price */}
            <div style={{ ...CARD, backgroundColor: '#0d1f12', border: 'none' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimated Price</p>
              <p style={{ margin: '0 0 8px', fontSize: '34px', fontWeight: '800', color: LIME, lineHeight: 1, letterSpacing: '-0.5px' }}>
                {lead.estimated_price != null && !isNaN(Number(lead.estimated_price))
                  ? `${Number(lead.estimated_price).toLocaleString()} kr`
                  : '—'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                Submitted on {formatDate(lead.created_at)}
              </p>
            </div>

            {/* Lead Score */}
            {(() => {
              const price = Number(lead.estimated_price) || 0;
              let score = 0;
              if (price > 100000) score += 2; else if (price > 50000) score += 1;
              if (lead.company)      score += 2;
              if (lead.phone)        score += 1;
              const st = (lead.status || '').replace(/\s+/g,'').toLowerCase();
              if (st === 'closedwon' || st === 'inprogress') score += 2;
              else if (st === 'contacted') score += 1;
              if (lead.municipality) score += 2;
              const dotColor = score <= 3 ? '#dc2626' : score <= 6 ? '#d97706' : '#16a34a';
              return (
                <div style={CARD}>
                  <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lead Score</p>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {Array.from({ length: 10 }, (_, i) => (
                      <span key={i} style={{ fontSize: '14px', color: i < score ? dotColor : '#e5e7eb' }}>{i < score ? '●' : '○'}</span>
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: dotColor }}>{score}/10</p>
                </div>
              );
            })()}

            {/* Status timeline */}
            <div style={CARD}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Status History</p>
              {STATUS_STAGES.map((stage, i) => {
                const isPast    = i < stageIdx && !isLost;
                const isCurrent = i === stageIdx && !isLost;
                const dotColor  = isCurrent ? LIME : isPast ? '#9ca3af' : '#e8ede8';
                const txtColor  = isCurrent ? '#0d1117' : isPast ? '#6b7280' : '#d1d5db';
                return (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < STATUS_STAGES.length - 1 ? '12px' : 0 }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, backgroundColor: dotColor }} />
                    <span style={{ fontSize: '13.5px', color: txtColor, fontWeight: isCurrent ? '700' : '400', flex: 1 }}>{stage}</span>
                    {isCurrent && (
                      <span style={{ fontSize: '11px', color: PRIMARY, fontWeight: '600', backgroundColor: '#ecfccb', padding: '2px 8px', borderRadius: '20px' }}>Current</span>
                    )}
                  </div>
                );
              })}
              {isLost && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, backgroundColor: '#dc2626' }} />
                  <span style={{ fontSize: '13.5px', color: '#dc2626', fontWeight: '700', flex: 1 }}>Closed Lost</span>
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '20px' }}>Current</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
