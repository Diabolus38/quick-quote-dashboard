import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px', marginBottom: '16px' };

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{title}</h1>
      {subtitle && <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>{subtitle}</p>}
    </div>
  );
}

function SettingsCard({ title, children }) {
  return (
    <div style={CARD}>
      {title && <p style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{title}</p>}
      {children}
    </div>
  );
}

function SaveButton({ onClick, saveMsg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
      {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{saveMsg}</span>}
      <button type="button" onClick={onClick}
        style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
        Save
      </button>
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder = '' }) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', color: '#0d1117', outline: 'none', fontFamily: FONT, backgroundColor: '#fff' }} />
  );
}

function Textarea({ value, onChange, placeholder = '' }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={5}
      style={{ width: '100%', boxSizing: 'border-box', minHeight: '100px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '12px 14px', fontSize: '13.5px', color: '#0d1117', fontFamily: FONT, resize: 'vertical', outline: 'none', backgroundColor: '#fff' }} />
  );
}

function useSaveMsg() {
  const [saveMsg, setSaveMsg] = useState('');
  function flash() { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000); }
  return [saveMsg, flash];
}

function PDFContent({ clientId }) {
  const [loading,    setLoading]    = useState(true);
  const [companyName, setCompanyName] = useState('Your Company');
  const [intro,      setIntro]      = useState('');
  const [systemDesc, setSystemDesc] = useState('');
  const [serviceAg,  setServiceAg]  = useState('');
  const [payTerms,   setPayTerms]   = useState('');
  const [legal,      setLegal]      = useState('');
  const [sigName,    setSigName]    = useState('');
  const [sigTitle,   setSigTitle]   = useState('');
  const [sigPhone,   setSigPhone]   = useState('');
  const [sigEmail,   setSigEmail]   = useState('');
  const [saveMsg, flash] = useSaveMsg();

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('pdf_content, branding').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => {
        const pc = data?.pdf_content || {};
        setCompanyName(data?.branding?.company_name || 'Your Company');
        setIntro(pc.introduction       || '');
        setSystemDesc(pc.system_description || '');
        setServiceAg(pc.service_agreement  || '');
        setPayTerms(pc.payment_terms      || '');
        setLegal(pc.legal_reservations || '');
        setSigName(pc.signature_name     || '');
        setSigTitle(pc.signature_title    || '');
        setSigPhone(pc.signature_phone    || '');
        setSigEmail(pc.signature_email    || '');
        setLoading(false);
      });
  }, [clientId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px', fontFamily: FONT }}>Loading…</div>;

  async function handleSave() {
    await supabase.from('client_settings').update({
      pdf_content: {
        introduction:       intro,
        system_description: systemDesc,
        service_agreement:  serviceAg,
        payment_terms:      payTerms,
        legal_reservations: legal,
        signature_name:     sigName,
        signature_title:    sigTitle,
        signature_phone:    sigPhone,
        signature_email:    sigEmail,
      },
    }).eq('client_id', clientId);
    flash();
  }

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      {/* Left column: form */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <SectionHeader title="PDF Content" subtitle="Edit the text sections of your generated PDF." />
        {[
          { label: 'Introduction Text',  value: intro,      onChange: setIntro      },
          { label: 'System Description', value: systemDesc, onChange: setSystemDesc },
          { label: 'Service Agreement',  value: serviceAg,  onChange: setServiceAg  },
          { label: 'Payment Terms',      value: payTerms,   onChange: setPayTerms   },
          { label: 'Legal Reservations', value: legal,      onChange: setLegal      },
        ].map(s => (
          <SettingsCard key={s.label} title={s.label}><Textarea value={s.value} onChange={s.onChange} /></SettingsCard>
        ))}
        <SettingsCard title="Signature Block">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FieldRow label="Name"> <TextInput value={sigName}  onChange={setSigName}  /></FieldRow>
            <FieldRow label="Title"><TextInput value={sigTitle} onChange={setSigTitle} /></FieldRow>
            <FieldRow label="Phone"><TextInput value={sigPhone} onChange={setSigPhone} /></FieldRow>
            <FieldRow label="Email"><TextInput value={sigEmail} onChange={setSigEmail} /></FieldRow>
          </div>
        </SettingsCard>
        <SaveButton onClick={handleSave} saveMsg={saveMsg} />
      </div>

      {/* Right column: preview */}
      <div style={{ width: '340px', flexShrink: 0, position: 'sticky', top: '80px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>PDF Preview</p>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', fontSize: '12px', fontFamily: FONT }}>
          {/* Header */}
          <div style={{ backgroundColor: PRIMARY, borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{companyName}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>QUOTE</span>
          </div>
          {/* Customer */}
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f4f6f4' }}>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prepared for</p>
            <p style={{ margin: '0 0 1px', fontSize: '13px', fontWeight: '700', color: '#0d1117' }}>Customer Name</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>customer@example.com</p>
          </div>
          {/* Introduction */}
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f4f6f4' }}>
            <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Introduction</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {intro || 'Your introduction text will appear here…'}
            </p>
          </div>
          {/* Footer */}
          <div style={{ paddingTop: '12px', borderTop: '1px solid #f4f6f4' }}>
            <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: '600', color: '#0d1117' }}>{sigName || 'Signature Name'}</p>
            <p style={{ margin: '0 0 1px', fontSize: '10px', color: '#9ca3af' }}>{sigTitle || 'Title'}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af' }}>{sigEmail || 'email@company.com'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PdfContent() {
  const { profile } = useAuth();
  const clientId    = profile?.client_id;

  return (
    <ClientLayout title="PDF Content">
      <PDFContent clientId={clientId} />
    </ClientLayout>
  );
}
