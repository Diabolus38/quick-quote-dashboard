import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';
import { useAuth } from '../../context/AuthContext';
import generateQuotePDF from '../../utils/generateQuotePDF';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';
const LIME    = '#a3e635';

const STATUS_COLORS = {
  'New':         '#1d4ed8',
  'Contacted':   '#d97706',
  'In Progress': '#7c3aed',
  'Closed Won':  '#16a34a',
  'Closed Lost': '#dc2626',
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

function calcLeadScore(lead) {
  const a = lead.answers || {};
  let score = 0;
  if (a.projectType === 'new_installation') score += 2;
  if (a.wastewaterType === 'wc_bdt' || a.wastewaterType === 'wc') score += 2;
  if (Number(a.households) >= 2) score += 1;
  if (lead.company) score += 1;
  if (lead.phone) score += 1;
  const price = Number(lead.estimated_price) || 0;
  if (price > 100000) score += 2;
  else if (price > 50000) score += 1;
  return score;
}

function getLeadQuality(lead) {
  const score = calcLeadScore(lead);
  if (score >= 7) return { label: 'Hot',  bg: '#fee2e2', color: '#991b1b' };
  if (score >= 4) return { label: 'Warm', bg: '#fef9c3', color: '#854d0e' };
  return                  { label: 'Cold', bg: '#f3f4f6', color: '#6b7280' };
}

function formatDate(str) {
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '22px', marginBottom: '16px' };

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>
      <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500' }}>{value || '—'}</span>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [lead,           setLead]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [notFound,       setNotFound]       = useState(false);
  const [notes,          setNotes]          = useState('');
  const [saveMsg,        setSaveMsg]        = useState('');
  const [printing,       setPrinting]       = useState(false);
  const [sendingEmail,   setSendingEmail]   = useState(false);
  const [emailMsg,       setEmailMsg]       = useState('');
  const [sendingToMe,    setSendingToMe]    = useState(false);
  const [sentToMe,       setSentToMe]       = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [copiedContact,  setCopiedContact]  = useState(false);
  const [prevLead, setPrevLead] = useState(null);
  const [nextLead, setNextLead] = useState(null);

  useEffect(() => { fetchLead(); }, [id]);

  async function fetchLead() {
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
    if (error || !data) { setNotFound(true); } else {
      setLead(data); setNotes(data.notes || '');
      const [{ data: prev }, { data: next }] = await Promise.all([
        supabase.from('leads').select('id').eq('client_id', data.client_id).lt('created_at', data.created_at).order('created_at', { ascending: false }).limit(1),
        supabase.from('leads').select('id').eq('client_id', data.client_id).gt('created_at', data.created_at).order('created_at', { ascending: true }).limit(1),
      ]);
      setPrevLead(prev?.[0] || null);
      setNextLead(next?.[0] || null);
    }
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

  async function handleSendToMe() {
    if (!profile?.email) return;
    setSendingToMe(true);
    setSentToMe('');
    try {
      const { data: emailSettingsData } = await supabase.from('client_settings').select('email_settings').eq('client_id', profile.client_id).maybeSingle();
      const answersText = Object.entries(lead.answers || {})
        .map(([k, v]) => `${KEY_LABELS[k] || k}: ${VALUE_LABELS[String(v)] || String(v)}`)
        .join('\n');
      const emailBody = `Lead: ${lead.name || '—'}\nEmail: ${lead.email || '—'}\nPhone: ${lead.phone || '—'}\nCompany: ${lead.company || '—'}\nMunicipality: ${lead.municipality || '—'}\nEstimated Price: ${lead.estimated_price || '—'} kr\nStatus: ${lead.status || '—'}\nSubmitted: ${formatDate(lead.created_at)}\n\nAnswers:\n${answersText}`;
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: profile.full_name || '',
          subject: `Lead Details: ${lead.name || '—'}`,
          body: emailBody,
          clientId: profile.client_id,
          fromName: emailSettingsData?.email_settings?.from_name || '',
          replyTo: emailSettingsData?.email_settings?.reply_to || '',
          emailSubject: emailSettingsData?.email_settings?.subject || 'Your Quote',
          footerText: emailSettingsData?.email_settings?.footer_text || '',
        }),
      });
      setSentToMe(res.ok ? 'sent' : 'failed');
    } catch {
      setSentToMe('failed');
    }
    setSendingToMe(false);
    setTimeout(() => setSentToMe(''), 3000);
  }

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 300);
  }

  async function handleDownloadPDF() {
    setDownloadingPDF(true);
    try {
      const [{ data: settingsData }, { data: pricingData }, { data: clientData }] = await Promise.all([
        supabase.from('client_settings').select('*').eq('client_id', profile.client_id).maybeSingle(),
        supabase.from('client_pricing').select('*').eq('client_id', profile.client_id).maybeSingle(),
        supabase.from('clients').select('*').eq('id', profile.client_id).maybeSingle(),
      ]);
      await generateQuotePDF({
        lead,
        client: clientData || {},
        settings: {
          pdf_content: settingsData?.pdf_content || {},
          pricing: pricingData || {},
          branding: settingsData?.branding || {},
          plan: clientData?.plan || 'growth',
        },
      });
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate PDF');
    }
    setDownloadingPDF(false);
  }

  async function handleSendEmail() {
    if (!lead?.email) return;
    if (!window.confirm(`Send the quote PDF to ${lead.email}?`)) return;
    setSendingEmail(true);
    try {
      const { data: emailSettingsData } = await supabase.from('client_settings').select('email_settings').eq('client_id', profile.client_id).maybeSingle();
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lead.email,
          name: lead.name || '',
          pdfBase64: '',
          clientId: profile.client_id,
          fromName: emailSettingsData?.email_settings?.from_name || '',
          replyTo: emailSettingsData?.email_settings?.reply_to || '',
          emailSubject: emailSettingsData?.email_settings?.subject || 'Your Quote',
          footerText: emailSettingsData?.email_settings?.footer_text || '',
        }),
      });
      if (res.ok) {
        setEmailMsg('Email sent!');
      } else {
        let msg = 'Failed to send email.';
        try {
          const json = await res.json();
          if (json?.error || json?.message) msg = json.error || json.message;
        } catch {}
        setEmailMsg(msg);
      }
    } catch {
      setEmailMsg('Failed to send email.');
    }
    setSendingEmail(false);
    setTimeout(() => setEmailMsg(''), 3000);
  }

  if (loading) return <ClientLayout title="Lead Detail"><div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af', fontSize: '14px', fontFamily: FONT }}>Loading…</div></ClientLayout>;
  if (notFound) return <ClientLayout title="Lead Detail"><div style={{ textAlign: 'center', padding: '80px', color: '#dc2626', fontSize: '14px', fontFamily: FONT }}>Lead not found.</div></ClientLayout>;

  const answers  = lead.answers || {};
  const stageIdx = STATUS_STAGES.indexOf(lead.status?.trim());
  const isLost   = lead.status === 'Closed Lost';

  return (
    <ClientLayout title="Lead Detail">
      <style>{`@media print { body * { visibility: hidden; } #lead-print-area, #lead-print-area * { visibility: visible; } #lead-print-area { position: absolute; left: 0; top: 0; } }`}</style>
      <div id="lead-print-area" style={{ fontFamily: FONT }}>

        {/* Back */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button type="button" onClick={() => navigate('/client/leads')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← Back to Leads
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            {prevLead && <button type="button" onClick={() => navigate(`/client/leads/${prevLead.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, fontFamily: FONT }}>← Previous Lead</button>}
            {nextLead && <button type="button" onClick={() => navigate(`/client/leads/${nextLead.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, fontFamily: FONT }}>Next Lead →</button>}
          </div>
        </div>

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
                {['New', 'Contacted', 'In Progress', 'Closed Won', 'Closed Lost'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Lead Summary */}
            {(() => {
              const q = getLeadQuality(lead);
              return (
                <div style={{ ...CARD, padding: '16px 22px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Estimated Price</p>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: PRIMARY, fontFamily: FONT, lineHeight: 1 }}>
                      {lead.estimated_price != null ? `${Number(lead.estimated_price).toLocaleString('sv-SE')} kr` : '—'}
                    </p>
                  </div>
                  <div style={{ width: '1px', height: '32px', backgroundColor: '#e8ede8', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Lead Quality</p>
                    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: q.bg, color: q.color }}>{q.label}</span>
                  </div>
                  <div style={{ width: '1px', height: '32px', backgroundColor: '#e8ede8', flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Submitted</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{formatDate(lead.created_at)}</p>
                  </div>
                </div>
              );
            })()}

            {/* Contact Details */}
            <div style={CARD}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Contact Details</p>
                <button type="button" onClick={() => {
                  const text = [`Name: ${lead.name || '—'}`, `Email: ${lead.email || '—'}`, `Phone: ${lead.phone || '—'}`, `Company: ${lead.company || '—'}`, `Municipality: ${lead.municipality || '—'}`].join('\n');
                  navigator.clipboard.writeText(text).then(() => { setCopiedContact(true); setTimeout(() => setCopiedContact(false), 2000); });
                }} style={{ background: 'none', border: 'none', color: copiedContact ? '#16a34a' : PRIMARY, fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, padding: 0 }}>
                  {copiedContact ? 'Copied!' : 'Copy All'}
                </button>
              </div>
              <DetailRow label="Name"    value={lead.name}    />
              <DetailRow label="Email"   value={lead.email}   />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>Phone</span>
                <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {lead.phone || '—'}
                  {lead.phone && !lead.phone.startsWith('+') && <span style={{ color: '#d97706' }}>⚠</span>}
                </span>
              </div>
              <DetailRow label="Company" value={lead.company} />
              {lead.customer_address && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>📍 Property address</span>
                  <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500' }}>{lead.customer_address}</span>
                </div>
              )}
              {lead.org_number && <DetailRow label="Organisation number" value={lead.org_number} />}
              {lead.notes && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>Notes</span>
                  <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500', maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>{lead.notes}</span>
                </div>
              )}
              {lead.marketing_consent != null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>Marketing consent</span>
                  {lead.marketing_consent
                    ? <span style={{ fontSize: '13.5px', color: '#16a34a', fontWeight: '600' }}>✓ Agreed to be contacted</span>
                    : <span style={{ fontSize: '13.5px', color: '#9ca3af', fontWeight: '500' }}>No consent recorded</span>
                  }
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f4f6f4' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>Customer type</span>
                <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500' }}>
                  {lead.customer_type === 'business' ? 'Business' : 'Private individual'}
                </span>
              </div>
              {lead.customer_type !== 'business' && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#166534', fontFamily: FONT }}>ROT deduction may apply for this customer</p>
              )}
            </div>

            {/* Answers */}
            <div style={CARD}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Answers</p>
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
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{KEY_LABELS[key] || key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())}</span>
                      <span style={{ fontSize: '13.5px', color: '#0d1117', fontWeight: '500' }}>{VALUE_LABELS[String(val)] || String(val)}</span>
                    </div>
                  ))
              )}
            </div>

            {/* Notes */}
            <div style={CARD}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about this lead…"
                style={{ width: '100%', minHeight: '120px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '12px 14px', fontSize: '13.5px', fontFamily: FONT, resize: 'vertical', outline: 'none', color: '#374151' }} />
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', textAlign: 'right', fontFamily: FONT }}>
                {notes.trim() ? notes.trim().split(/\s+/).filter(Boolean).length : 0} words
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={saveNotes} style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                  Save Notes
                </button>
                {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>{saveMsg}</span>}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ width: '300px', flexShrink: 0 }}>

            {/* Estimate price */}
            <div style={{ ...CARD, backgroundColor: '#0d1f12', border: 'none' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimated Price</p>
              <p style={{ margin: '0 0 8px', fontSize: '34px', fontWeight: '800', color: LIME, lineHeight: 1, letterSpacing: '-0.5px' }}>
                {lead.estimated_price != null && !isNaN(Number(lead.estimated_price)) ? `${Number(lead.estimated_price).toLocaleString('sv-SE')} kr` : '—'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                Submitted on {formatDate(lead.created_at)}
              </p>
            </div>

            {/* Lead Score */}
            {(() => {
              const answers = lead.answers || {};
              let score = 0;
              let breakdown = [];
              if (answers.projectType === 'new_installation') { score += 2; breakdown.push({ label: 'New installation project', points: 2, earned: true }); }
              else { breakdown.push({ label: 'New installation project', points: 2, earned: false }); }
              if (['wc_bdt', 'wc'].includes(answers.wastewaterType)) { score += 2; breakdown.push({ label: 'Full wastewater system', points: 2, earned: true }); }
              else { breakdown.push({ label: 'Full wastewater system', points: 2, earned: false }); }
              if (Number(answers.households) >= 2) { score += 1; breakdown.push({ label: '2+ households', points: 1, earned: true }); }
              else { breakdown.push({ label: '2+ households', points: 1, earned: false }); }
              if (answers.existingSystem === 'no' || answers.existingSystem === 'none') { score += 1; breakdown.push({ label: 'No existing system', points: 1, earned: true }); }
              else { breakdown.push({ label: 'No existing system', points: 1, earned: false }); }
              if (lead.company) { score += 1; breakdown.push({ label: 'Has company name', points: 1, earned: true }); }
              else { breakdown.push({ label: 'Has company name', points: 1, earned: false }); }
              if (lead.phone) { score += 1; breakdown.push({ label: 'Phone number provided', points: 1, earned: true }); }
              else { breakdown.push({ label: 'Phone number provided', points: 1, earned: false }); }
              if (Number(lead.estimated_price) > 100000) { score += 2; breakdown.push({ label: 'Estimate over 100,000 kr', points: 2, earned: true }); }
              else if (Number(lead.estimated_price) > 50000) { score += 1; breakdown.push({ label: 'Estimate over 50,000 kr', points: 1, earned: true }); }
              else { breakdown.push({ label: 'High estimate value', points: 2, earned: false }); }
              const maxScore = 10;
              const qualification = score >= 7 ? 'Hot' : score >= 4 ? 'Warm' : 'Cold';
              const qualColor = score >= 7 ? '#dc2626' : score >= 4 ? '#d97706' : '#6b7280';
              const qualBg = score >= 7 ? '#fee2e2' : score >= 4 ? '#fef9c3' : '#f3f4f6';
              return (
                <div style={CARD}>
                  <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lead Score</p>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: qualBg, color: qualColor, marginBottom: '8px' }}>{qualification}</span>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {Array.from({ length: maxScore }, (_, i) => (
                      <span key={i} style={{ fontSize: '14px', color: i < score ? qualColor : '#e5e7eb' }}>{i < score ? '●' : '○'}</span>
                    ))}
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: qualColor }}>{score}/{maxScore}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                    {breakdown.map(c => (
                      <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', backgroundColor: c.earned ? '#dcfce7' : '#f3f4f6', color: c.earned ? '#166534' : '#9ca3af' }}>
                        {c.earned ? `+${c.points} ${c.label}` : `${c.label} (missing)`}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div style={CARD}>
              <button type="button" onClick={handleDownloadPDF} disabled={downloadingPDF}
                style={{ width: '100%', padding: '11px', fontSize: '13.5px', fontWeight: '600', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', cursor: downloadingPDF ? 'not-allowed' : 'pointer', marginBottom: '8px', fontFamily: FONT, opacity: downloadingPDF ? 0.7 : 1 }}>
                {downloadingPDF ? 'Generating...' : 'Download PDF'}
              </button>
              <button type="button" onClick={handleSendEmail} disabled={sendingEmail}
                style={{ width: '100%', padding: '11px', fontSize: '13.5px', fontWeight: '500', backgroundColor: '#fff', color: '#0d1117', border: '1px solid #e8ede8', borderRadius: '10px', cursor: sendingEmail ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: sendingEmail ? 0.7 : 1, marginBottom: '8px' }}>
                {sendingEmail ? 'Sending…' : 'Send Email'}
              </button>
              {emailMsg && <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: emailMsg.includes('Failed') ? '#dc2626' : '#16a34a', fontFamily: FONT, textAlign: 'center' }}>{emailMsg}</p>}
              <button type="button" onClick={handleSendToMe} disabled={sendingToMe}
                style={{ backgroundColor: '#fff', border: '1px solid #e8ede8', borderRadius: '10px', padding: '11px', fontSize: '13.5px', fontWeight: 500, width: '100%', cursor: sendingToMe ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: sendingToMe ? 0.7 : 1 }}>
                {sendingToMe ? 'Sending...' : 'Send to My Email'}
              </button>
              {sentToMe === 'sent' && <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: '600', color: '#16a34a', fontFamily: FONT, textAlign: 'center' }}>Sent to your email!</p>}
              {sentToMe === 'failed' && <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: '600', color: '#dc2626', fontFamily: FONT, textAlign: 'center' }}>Failed</p>}
            </div>

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
                    {isCurrent && <span style={{ fontSize: '11px', color: PRIMARY, fontWeight: '600', backgroundColor: '#ecfccb', padding: '2px 8px', borderRadius: '20px' }}>Current</span>}
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
    </ClientLayout>
  );
}
