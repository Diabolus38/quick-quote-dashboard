import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfigStatus } from '../../context/ConfigStatusContext';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';
import TrialExpiredOverlay from '../../components/TrialExpiredOverlay';
import useClientPlan from '../../hooks/useClientPlan';
import UpgradeLock from '../../components/UpgradeLock';

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
  const { profile } = useAuth();
  const [loading,          setLoading]          = useState(true);
  const [companyName,      setCompanyName]      = useState('Your Company');
  const [previewColor,     setPreviewColor]     = useState(PRIMARY);
  const [pdfLogoUrl,       setPdfLogoUrl]       = useState('');
  const [pdfPrimaryColor,  setPdfPrimaryColor]  = useState(PRIMARY);
  const [uploadingLogo,    setUploadingLogo]    = useState(false);
  const [logoUploadErr,    setLogoUploadErr]    = useState('');
  const [intro,            setIntro]            = useState('');
  const [systemDesc,       setSystemDesc]       = useState('');
  const [serviceAg,        setServiceAg]        = useState('');
  const [payTerms,         setPayTerms]         = useState('');
  const [legal,            setLegal]            = useState('');
  const [sigName,          setSigName]          = useState('');
  const [sigTitle,         setSigTitle]         = useState('');
  const [sigPhone,         setSigPhone]         = useState('');
  const [sigEmail,         setSigEmail]         = useState('');
  const [quoteValidityText, setQuoteValidityText] = useState('');
  const [questionsText,     setQuestionsText]     = useState('');
  const [fromText,          setFromText]          = useState('');
  const [showAuthorizedBy,  setShowAuthorizedBy]  = useState(false);
  const [authorizedByName,  setAuthorizedByName]  = useState('');
  const [authorizedByTitle, setAuthorizedByTitle] = useState('');
  const [authorizedSigUrl,  setAuthorizedSigUrl]  = useState('');
  const [uploadingSig,      setUploadingSig]      = useState(false);
  const [sigUploadErr,      setSigUploadErr]      = useState('');
  const [saveMsg, flash] = useSaveMsg();
  const [lastSavedPdf, setLastSavedPdf] = useState(() => localStorage.getItem(`qq360_last_saved_pdf_${profile?.id || 'anon'}`) || '');
  const [sectionVisible, setSectionVisible] = useState({ intro: true, systemDesc: true, serviceAg: true, payTerms: true, legal: true });
  const { plan } = useClientPlan();

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('pdf_content, branding').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => {
        const pc = data?.pdf_content || {};
        const b  = data?.branding   || {};
        setCompanyName(b.company_name   || 'Your Company');
        setPreviewColor(pc.pdf_primary_color || b.primary_color || PRIMARY);
        setPdfLogoUrl(pc.pdf_logo_url || b.logo_url || '');
        setPdfPrimaryColor(pc.pdf_primary_color || PRIMARY);
        setIntro(pc.introduction       || '');
        setSystemDesc(pc.system_description || '');
        setServiceAg(pc.service_agreement  || '');
        setPayTerms(pc.payment_terms      || '');
        setLegal(pc.legal_reservations || '');
        setSigName(pc.signature_name     || '');
        setSigTitle(pc.signature_title    || '');
        setSigPhone(pc.signature_phone    || '');
        setSigEmail(pc.signature_email    || '');
        setQuoteValidityText(pc.quote_validity_text || '');
        setQuestionsText(pc.questions_text || '');
        setFromText(pc.from_text || '');
        setShowAuthorizedBy(pc.show_authorized_by ?? false);
        setAuthorizedByName(pc.authorized_by_name   || '');
        setAuthorizedByTitle(pc.authorized_by_title || '');
        setAuthorizedSigUrl(pc.authorized_signature_url || '');
        setLoading(false);
      });
  }, [clientId]);

  if (loading) return (
    <>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ height: '16px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '80%', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </>
  );

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoUploadErr('Please select an image file.');
      setTimeout(() => setLogoUploadErr(''), 3000);
      return;
    }
    const _ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg','jpeg','png','gif','svg','webp','bmp','ico'].includes(_ext)) {
      setLogoUploadErr('Invalid file type. Please use JPG, PNG, GIF, SVG, or WEBP.');
      setTimeout(() => setLogoUploadErr(''), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadErr('Image must be smaller than 5MB.');
      setTimeout(() => setLogoUploadErr(''), 3000);
      return;
    }
    setUploadingLogo(true);
    const path = `${clientId}/pdf/logo/${file.name}`;
    const { error } = await supabase.storage.from('client-assets').upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('client-assets').getPublicUrl(path);
      setPdfLogoUrl(urlData.publicUrl);
    }
    setUploadingLogo(false);
  }

  async function handleSigUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setSigUploadErr('Please select an image file.'); setTimeout(() => setSigUploadErr(''), 3000); return; }
    if (file.size > 5 * 1024 * 1024) { setSigUploadErr('Image must be smaller than 5MB.'); setTimeout(() => setSigUploadErr(''), 3000); return; }
    setUploadingSig(true);
    const path = `${clientId}/signature/${file.name}`;
    const { error } = await supabase.storage.from('client-assets').upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('client-assets').getPublicUrl(path);
      setAuthorizedSigUrl(urlData.publicUrl);
    } else {
      setSigUploadErr('Upload failed. Please try again.');
      setTimeout(() => setSigUploadErr(''), 3000);
    }
    setUploadingSig(false);
  }

  async function handleSave() {
    await supabase.from('client_settings').update({
      pdf_content: {
        pdf_logo_url:       pdfLogoUrl,
        pdf_primary_color:  previewColor,
        introduction:       intro,
        system_description: systemDesc,
        service_agreement:  serviceAg,
        payment_terms:      payTerms,
        legal_reservations: legal,
        signature_name:     sigName,
        signature_title:    sigTitle,
        signature_phone:    sigPhone,
        signature_email:    sigEmail,
        quote_validity_text: quoteValidityText,
        questions_text:      questionsText,
        from_text:           fromText,
        show_authorized_by:       showAuthorizedBy,
        authorized_by_name:       authorizedByName,
        authorized_by_title:      authorizedByTitle,
        authorized_signature_url: authorizedSigUrl,
      },
    }).eq('client_id', clientId);
    flash();
    const ts = new Date().toISOString();
    localStorage.setItem(`qq360_last_saved_pdf_${profile?.id || 'anon'}`, ts);
    setLastSavedPdf(ts);
  }

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      {/* Left column: form */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <SectionHeader title="PDF Content" subtitle="Edit the text sections of your generated PDF." />
        <SettingsCard title="PDF Branding">
          <FieldRow label="PDF Logo">
            <div style={{ position: 'relative' }}>
              {pdfLogoUrl && <img src={pdfLogoUrl} alt="PDF Logo" style={{ maxHeight: '60px', maxWidth: '200px', marginBottom: '8px', display: 'block', borderRadius: '6px', border: '1px solid #e8ede8' }} />}
              <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo}
                style={{ fontSize: '13px', fontFamily: FONT, color: '#374151' }} />
              {uploadingLogo && <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginTop: '4px', fontFamily: FONT }}>Uploading...</span>}
              {logoUploadErr && <span style={{ display: 'block', fontSize: '12px', color: '#dc2626', marginTop: '4px', fontFamily: FONT }}>{logoUploadErr}</span>}
              {!['scale', 'enterprise', 'free_trial'].includes(plan) && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', fontFamily: FONT }}>🔒 Scale plan only</span>
                </div>
              )}
            </div>
          </FieldRow>
          <FieldRow label="PDF Primary Color">
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={previewColor} onChange={e => setPreviewColor(e.target.value)}
                  style={{ width: '40px', height: '36px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                <TextInput value={previewColor} onChange={v => { if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPreviewColor(v); }} placeholder="#166534" />
              </div>
              {!['scale', 'enterprise', 'free_trial'].includes(plan) && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', fontFamily: FONT }}>🔒 Scale plan only</span>
                </div>
              )}
            </div>
          </FieldRow>
        </SettingsCard>
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
        <SettingsCard title="Quote Validity Text">
          <Textarea value={quoteValidityText} onChange={setQuoteValidityText} placeholder="This quote is valid for 60 days from the date of issue. Delivery date: To be agreed upon order confirmation." />
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Shown in the Quote Validity section at the bottom of the PDF.</p>
        </SettingsCard>
        <SettingsCard title="Questions Text">
          <Textarea value={questionsText} onChange={setQuestionsText} placeholder="Do not hesitate to reach out with any questions." />
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Shown in the Questions section at the bottom of the PDF.</p>
        </SettingsCard>
        <SettingsCard title="From Text">
          {['scale', 'enterprise', 'free_trial'].includes(plan) ? (
            <>
              <TextInput value={fromText} onChange={setFromText} placeholder="From AI World Partners" />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Shown at the bottom of the PDF instead of Powered By QuickQuote360.</p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>The Powered by QuickQuote360 badge is shown on your PDF. Available on Scale plan to customize.</p>
          )}
        </SettingsCard>
        <SettingsCard title="Show Authorized By">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div onClick={() => setShowAuthorizedBy(p => !p)}
              style={{ width: '36px', height: '20px', borderRadius: '10px', backgroundColor: showAuthorizedBy ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: showAuthorizedBy ? '19px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </div>
            <span style={{ fontSize: '13px', color: '#374151', fontFamily: FONT }}>Show Authorized By section</span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>When enabled shows an Authorized By signature line on the PDF.</p>
          {showAuthorizedBy && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <FieldRow label="Authorized By Name">
                <TextInput value={authorizedByName} onChange={setAuthorizedByName} placeholder="e.g. Jane Smith" />
              </FieldRow>
              <FieldRow label="Authorized By Title">
                <TextInput value={authorizedByTitle} onChange={setAuthorizedByTitle} placeholder="e.g. Operations Manager" />
              </FieldRow>
              <FieldRow label="Signature Image (optional)">
                {authorizedSigUrl && (
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={authorizedSigUrl} alt="signature" style={{ maxHeight: '60px', maxWidth: '200px', borderRadius: '6px', border: '1px solid #e8ede8', objectFit: 'contain' }} />
                    <button type="button" onClick={() => setAuthorizedSigUrl('')}
                      style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: '600', padding: 0 }}>
                      Remove
                    </button>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleSigUpload} disabled={uploadingSig}
                  style={{ fontSize: '13px', fontFamily: FONT, color: '#374151', cursor: 'pointer' }} />
                {uploadingSig && <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginTop: '4px', fontFamily: FONT }}>Uploading...</span>}
                {sigUploadErr && <span style={{ display: 'block', fontSize: '12px', color: '#dc2626', marginTop: '4px', fontFamily: FONT }}>{sigUploadErr}</span>}
              </FieldRow>
            </div>
          )}
        </SettingsCard>
        <SaveButton onClick={handleSave} saveMsg={saveMsg} />
        {lastSavedPdf && <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT, textAlign: 'right' }}>Last saved: {(() => { const d = new Date(lastSavedPdf); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}</p>}
      </div>

      {/* Right column: preview */}
      <div style={{ width: '340px', flexShrink: 0, position: 'sticky', top: '80px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>PDF Preview</p>

        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', fontSize: '12px', fontFamily: FONT }}>
          {/* Header */}
          <div style={{ backgroundColor: previewColor, borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {pdfLogoUrl && <img src={pdfLogoUrl} alt="" style={{ height: '24px', objectFit: 'contain', marginRight: '8px' }} />}
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{companyName}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>QUOTE</span>
          </div>
          {/* Customer */}
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f4f6f4' }}>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prepared for</p>
            <p style={{ margin: '0 0 1px', fontSize: '13px', fontWeight: '700', color: '#0d1117' }}>Customer Name</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>customer@example.com</p>
          </div>
          {/* Introduction */}
          {sectionVisible.intro && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f4f6f4' }}>
              <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Introduction</p>
              <p style={{ margin: 0, fontSize: '11px', color: intro ? '#374151' : '#9ca3af', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {intro || 'Introduction text will appear here...'}
              </p>
            </div>
          )}
          {/* System Description */}
          {sectionVisible.systemDesc && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f4f6f4' }}>
              <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>System Description</p>
              <p style={{ margin: 0, fontSize: '11px', color: systemDesc ? '#374151' : '#9ca3af', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {systemDesc || 'System description will appear here...'}
              </p>
            </div>
          )}
          {/* Service Agreement */}
          {sectionVisible.serviceAg && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f4f6f4' }}>
              <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Service Agreement</p>
              <p style={{ margin: 0, fontSize: '11px', color: serviceAg ? '#374151' : '#9ca3af', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {serviceAg || 'Service agreement text will appear here...'}
              </p>
            </div>
          )}
          {/* Payment Terms */}
          {sectionVisible.payTerms && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f4f6f4' }}>
              <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payment Terms</p>
              <p style={{ margin: 0, fontSize: '11px', color: payTerms ? '#374151' : '#9ca3af', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {payTerms || 'Payment terms will appear here...'}
              </p>
            </div>
          )}
          {/* Legal */}
          {sectionVisible.legal && (
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f4f6f4' }}>
              <p style={{ margin: '0 0 6px', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legal</p>
              <p style={{ margin: 0, fontSize: '11px', color: legal ? '#374151' : '#9ca3af', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {legal || 'Legal text will appear here...'}
              </p>
            </div>
          )}
          {/* Footer */}
          <div style={{ paddingTop: '12px', borderTop: '1px solid #f4f6f4' }}>
            <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: '600', color: sigName ? '#0d1117' : '#9ca3af' }}>{sigName || 'Signature Name'}</p>
            <p style={{ margin: '0 0 1px', fontSize: '10px', color: '#9ca3af' }}>{sigTitle || 'Title'}</p>
            <p style={{ margin: '0 0 1px', fontSize: '10px', color: '#9ca3af' }}>{sigPhone || ''}</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af' }}>{sigEmail || 'email@company.com'}</p>
          </div>
          {/* Quote Validity */}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f4f6f4' }}>
            <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>QUOTE VALIDITY</p>
            <p style={{ margin: 0, fontSize: '10px', color: quoteValidityText ? '#374151' : '#9ca3af', lineHeight: '1.5' }}>
              {quoteValidityText || 'This quote is valid for 60 days...'}
            </p>
          </div>
          {/* Questions */}
          <div style={{ marginTop: '10px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>QUESTIONS?</p>
            <p style={{ margin: 0, fontSize: '10px', color: questionsText ? '#374151' : '#9ca3af', lineHeight: '1.5' }}>
              {questionsText || 'Do not hesitate to reach out...'}
            </p>
          </div>
          {/* From */}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f4f6f4' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontStyle: 'italic' }}>
              {fromText || 'Powered by QuickQuote360'}
            </p>
          </div>
          {/* Authorized By */}
          {showAuthorizedBy && (
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AUTHORIZED BY</p>
              <div style={{ height: '1px', backgroundColor: '#e8ede8', width: '80px', marginTop: '8px' }} />
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#9ca3af' }}>Signature</p>
            </div>
          )}
        </div>

        {/* Section Visibility Toggles */}
        <div style={{ marginTop: '16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Preview Options</p>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            {[
              { key: 'intro',      label: 'Introduction'      },
              { key: 'systemDesc', label: 'System Description' },
              { key: 'serviceAg',  label: 'Service Agreement'  },
              { key: 'payTerms',   label: 'Payment Terms'      },
              { key: 'legal',      label: 'Legal Reservations' },
            ].map(({ key, label }, i, arr) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                <span style={{ fontSize: '12px', color: '#374151', fontFamily: FONT }}>{label}</span>
                <div onClick={() => setSectionVisible(prev => ({ ...prev, [key]: !prev[key] }))}
                  style={{ width: '36px', height: '20px', borderRadius: '10px', backgroundColor: sectionVisible[key] ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: sectionVisible[key] ? '19px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigStatusCard() {
  const { dots } = useConfigStatus();
  const navigate = useNavigate();
  const labels = ['Brand', 'Pricing', 'PDF', 'Areas', 'Questions'];
  const destinations = ['/client/settings', '/client/pricing', '/client/pdf', '/client/municipalities', '/client/questions'];
  const count = dots.filter(Boolean).length;
  const firstUndone = dots.findIndex(d => !d);
  return (
    <div style={{ ...CARD, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        {labels.map((label, i) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dots[i] ? '#16a34a' : '#e5e7eb' }} />
            <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: FONT }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontFamily: FONT }}>{count} of 5 sections configured</span>
        {count < 5 ? (
          <button type="button" onClick={() => navigate(destinations[firstUndone])}
            style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
            Complete Setup →
          </button>
        ) : (
          <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '13px', fontFamily: FONT }}>✓ All set!</span>
        )}
      </div>
    </div>
  );
}

export default function PdfContent() {
  const { profile } = useAuth();
  const clientId    = profile?.client_id;
  const { plan, planLoading } = useClientPlan();
  const [trialExpired,      setTrialExpired]      = useState(false);
  const [planEmailSent,     setPlanEmailSent]     = useState(false);
  const [installPreference, setInstallPreference] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('clients').select('plan, created_at, install_preference').eq('id', clientId).maybeSingle()
      .then(({ data }) => { setInstallPreference(data?.install_preference || null); if (data?.plan === 'free_trial' && (Date.now() - new Date(data.created_at).getTime()) / 86400000 > 14) setTrialExpired(true); });
  }, [clientId]);

  async function sendPlanEmail(planName) {
    await fetch('https://estimator-widget-production.up.railway.app/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'team@quickquote360.com', subject: `Plan Upgrade Request: ${planName}`, body: `${profile?.full_name || 'A client'} (${profile?.email || ''}) requested the ${planName} plan. Client ID: ${clientId}.` }) }).catch(() => {});
    setPlanEmailSent(true);
  }

  if (planLoading) return (
    <ClientLayout title="PDF Content">
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px', marginBottom: '16px' }}>
          <div style={{ height: '16px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '80%', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '12px', borderRadius: '6px', backgroundColor: '#f0f0f0', marginBottom: '12px', width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </ClientLayout>
  );

  if (plan === 'starter') return (
    <ClientLayout title="PDF Content">
      <UpgradeLock feature="PDF Content Editor" requiredPlan="growth" />
    </ClientLayout>
  );

  return (
    <ClientLayout title="PDF Content">
      <TrialExpiredOverlay trialExpired={trialExpired} planEmailSent={planEmailSent} sendPlanEmail={sendPlanEmail} clientId={clientId} installPreference={installPreference} />
      <ConfigStatusCard />
      <PDFContent clientId={clientId} />
    </ClientLayout>
  );
}
