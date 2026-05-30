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
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => { fetchLead(); }, [id]);

  async function fetchLead() {
    setLoading(true);
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error || !data) { setNotFound(true); } else { setLead(data); setNotes(data.notes || ''); }
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

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 300);
  }

  async function handleDownloadPDF() {
    setDownloadingPDF(true);
    try {
      const [{ data: settingsData }, { data: pricingData }, { data: clientData }] = await Promise.all([
        supabase.from('client_settings').select('*').eq('client_id', profile.client_id).single(),
        supabase.from('client_pricing').select('*').eq('client_id', profile.client_id).single(),
        supabase.from('clients').select('*').eq('id', profile.client_id).single(),
      ]);
      generateQuotePDF({
        lead,
        client: clientData || {},
        settings: {
          pdf_content: settingsData?.pdf_content || {},
          pricing: pricingData || {},
          branding: settingsData?.branding || {},
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
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lead.email, name: lead.name || '', pdfBase64: '' }),
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
        <button type="button" onClick={() => navigate('/client/leads')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: '600', padding: 0, marginBottom: '20px', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Back to Leads
        </button>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* LEFT COLUMN */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Title + status */}
            <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: '700', color: '#0d1117' }}>{lead.name || '—'}</h1>
            <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#9ca3af' }}>
              {[lead.email, lead.phone, lead.municipality].filter(Boolean).join(' · ')}
            </p>
            <div style={{ marginBottom: '20px' }}>
              <select value={lead.status || 'New'} onChange={e => updateStatus(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: '10px', padding: '8px 14px', fontSize: '13.5px', color: STATUS_COLORS[lead.status] || '#374151', fontWeight: '600', backgroundColor: '#fff', cursor: 'pointer', outline: 'none', fontFamily: FONT }}>
                {['New', 'Contacted', 'In Progress', 'Closed Won', 'Closed Lost'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Contact Details */}
            <div style={CARD}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Contact Details</p>
              <DetailRow label="Name"    value={lead.name}    />
              <DetailRow label="Email"   value={lead.email}   />
              <DetailRow label="Phone"   value={lead.phone}   />
              <DetailRow label="Company" value={lead.company} />
            </div>

            {/* Answers */}
            <div style={CARD}>
              <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '600', color: '#0d1117' }}>Answers</p>
              {Object.keys(answers).length === 0 ? (
                <p style={{ margin: 0, fontSize: '13.5px', color: '#9ca3af' }}>No answers recorded.</p>
              ) : (
                Object.entries(answers).map(([key, val]) => (
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
                {lead.estimated_price != null && !isNaN(Number(lead.estimated_price)) ? `${Number(lead.estimated_price).toLocaleString()} kr` : '—'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                Submitted on {formatDate(lead.created_at)}
              </p>
            </div>

            {/* Actions */}
            <div style={CARD}>
              <button type="button" onClick={handleDownloadPDF} disabled={downloadingPDF}
                style={{ width: '100%', padding: '11px', fontSize: '13.5px', fontWeight: '600', backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', cursor: downloadingPDF ? 'not-allowed' : 'pointer', marginBottom: '8px', fontFamily: FONT, opacity: downloadingPDF ? 0.7 : 1 }}>
                {downloadingPDF ? 'Generating...' : 'Download PDF'}
              </button>
              <button type="button" onClick={handleSendEmail} disabled={sendingEmail}
                style={{ width: '100%', padding: '11px', fontSize: '13.5px', fontWeight: '500', backgroundColor: '#fff', color: '#0d1117', border: '1px solid #e8ede8', borderRadius: '10px', cursor: sendingEmail ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: sendingEmail ? 0.7 : 1 }}>
                {sendingEmail ? 'Sending…' : 'Send Email'}
              </button>
              {emailMsg && <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: '600', color: emailMsg.includes('Failed') ? '#dc2626' : '#16a34a', fontFamily: FONT, textAlign: 'center' }}>{emailMsg}</p>}
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
