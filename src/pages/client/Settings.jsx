import { useState, useEffect, useRef } from 'react';
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
const LIME    = '#a3e635';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  padding: '24px',
  marginBottom: '16px',
};

/* ── Helpers ─────────────────────────────────────────────────── */

function useSaveMsg() {
  const [msg, setMsg] = useState('');
  function flash() { setMsg('Saved!'); setTimeout(() => setMsg(''), 2000); }
  return [msg, flash];
}

function FieldRow({ label, onReset, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: onReset ? 'space-between' : undefined, alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>{label}</label>
        {onReset && (
          <button type="button" onClick={onReset}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af', fontSize: '11px', cursor: 'pointer', padding: '2px 6px' }}>
            ↺ Reset
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder = '', type = 'text' }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', color: '#0d1117', outline: 'none', fontFamily: FONT, backgroundColor: '#fff' }} />
  );
}

function Textarea({ value, onChange, placeholder = '', rows = 4 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '12px 14px', fontSize: '13.5px', color: '#0d1117', fontFamily: FONT, resize: 'vertical', outline: 'none', backgroundColor: '#fff' }} />
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: value ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s' }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: value ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
    </div>
  );
}

function SaveRow({ onClick, msg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
      {msg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{msg}</span>}
      <button type="button" onClick={onClick}
        style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
        Save
      </button>
    </div>
  );
}

function isValidUrl(str) {
  try { return Boolean(new URL(str)); } catch { return false; }
}

function fmtTs(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function LastSaved({ ts }) {
  if (!ts) return null;
  return <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT, textAlign: 'right' }}>Last saved: {fmtTs(ts)}</p>;
}

function SettingsSkeleton() {
  return (
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
}

/* ── 1. Branding ─────────────────────────────────────────────── */

function BrandingSection({ clientId, setHasUnsaved, setSaveRef }) {
  const { profile } = useAuth();
  const { plan, planLoading } = useClientPlan();
  const [companyName,         setCompanyName]         = useState('');
  const [widgetCompanyName,   setWidgetCompanyName]   = useState('');
  const [widgetSubtitle,      setWidgetSubtitle]      = useState('');
  const [primaryColor,        setPrimaryColor]        = useState('#166534');
  const [colorHex,            setColorHex]            = useState('#166534');
  const [logoUrl,             setLogoUrl]             = useState('');
  const [companyPhone,        setCompanyPhone]        = useState('');
  const [companyAddress,      setCompanyAddress]      = useState('');
  const [privacyUrl,          setPrivacyUrl]          = useState('');
  const [companyLocation,     setCompanyLocation]     = useState('');
  const [companyLat,          setCompanyLat]          = useState(null);
  const [companyLng,          setCompanyLng]          = useState(null);
  const locationInputRef = useRef(null);
  const [widgetHeadline,      setWidgetHeadline]      = useState('');
  const [widgetSubtext,       setWidgetSubtext]       = useState('');
  const [bubbleText,          setBubbleText]          = useState('');
  const [bubbleBgColor,       setBubbleBgColor]       = useState('#ffffff');
  const [bubbleBgHex,         setBubbleBgHex]         = useState('#ffffff');
  const [bubbleTextColor,     setBubbleTextColor]     = useState('#000000');
  const [bubbleTextHex,       setBubbleTextHex]       = useState('#000000');
  const [bubbleIconUrl,       setBubbleIconUrl]       = useState('');
  const [bubbleIconUploading, setBubbleIconUploading] = useState(false);
  const [bubbleIconUploadErr, setBubbleIconUploadErr] = useState('');
  const [answerSelectedColor, setAnswerSelectedColor] = useState('#dcfce7');
  const [answerSelectedHex,   setAnswerSelectedHex]   = useState('#dcfce7');
  const [showPoweredBy,       setShowPoweredBy]       = useState(true);
  const [saveMsg, flash] = useSaveMsg();
  const [previewTab, setPreviewTab] = useState('header');
  const [loading, setLoading] = useState(true);
  const [lastSavedBranding, setLastSavedBranding] = useState(() => localStorage.getItem(`qq360_last_saved_branding_${profile?.id || 'anon'}`) || '');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadErr, setLogoUploadErr] = useState('');
  const _ll = useRef(false);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('branding').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => {
        const b = data?.branding || {};
        setCompanyName(b.company_name             || '');
        setWidgetCompanyName(b.widget_company_name || '');
        setWidgetSubtitle(b.widget_subtitle       || '');
        setPrimaryColor(b.primary_color     || '#166534');
        setColorHex(b.primary_color         || '#166534');
        setLogoUrl(b.logo_url               || '');
        setCompanyPhone(b.company_phone     || '');
        setCompanyAddress(b.company_address || '');
        setPrivacyUrl(b.privacy_url         || '');
        setWidgetHeadline(b.widget_headline || '');
        setWidgetSubtext(b.widget_subtext   || '');
        setBubbleText(b.bubble_text         || '');
        setBubbleBgColor(b.bubble_bg_color     || '#ffffff');
        setBubbleBgHex(b.bubble_bg_color       || '#ffffff');
        setBubbleTextColor(b.bubble_text_color || '#000000');
        setBubbleTextHex(b.bubble_text_color   || '#000000');
        setBubbleIconUrl(b.bubble_icon_url              || '');
        setAnswerSelectedColor(b.answer_selected_color || '#dcfce7');
        setAnswerSelectedHex(b.answer_selected_color   || '#dcfce7');
        setShowPoweredBy(b.show_powered_by !== false);
        setLoading(false);
        setTimeout(() => { _ll.current = true; }, 50);
      });
    supabase.from('clients').select('company_location, company_lat, company_lng').eq('id', clientId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCompanyLocation(data.company_location || '');
          setCompanyLat(data.company_lat ?? null);
          setCompanyLng(data.company_lng ?? null);
        }
      });
  }, [clientId]);

  useEffect(() => {
    if (window.google || document.querySelector('#google-maps-script')) return;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    let ac = null;
    const init = () => {
      if (!window.google?.maps?.places) return;
      if (ac) return; // already initialized
      const inputEl = locationInputRef.current || document.querySelector('input[placeholder*="address"], input[placeholder*="Address"], input[placeholder*="location"], input[placeholder*="Location"]');
      if (!inputEl) return;
      ac = new window.google.maps.places.Autocomplete(inputEl, {
        types: ['geocode'],
        componentRestrictions: { country: 'se' },
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry) return;
        setCompanyLocation(place.formatted_address);
        setCompanyLat(place.geometry.location.lat());
        setCompanyLng(place.geometry.location.lng());
      });
    };
    const handleFocus = () => {
      if (window.google) {
        init();
      } else {
        const interval = setInterval(() => {
          if (window.google) { clearInterval(interval); init(); }
        }, 200);
      }
    };
    if (window.google) { init(); }
    const input = locationInputRef.current || document.querySelector('input[placeholder*="address"], input[placeholder*="Address"]');
    if (input) input.addEventListener('focus', handleFocus);
    return () => {
      if (input) input.removeEventListener('focus', handleFocus);
    };
  }, [loading]);

  useEffect(() => {
    if (!loading && locationInputRef.current) {
      locationInputRef.current.value = companyLocation;
    }
  }, [companyLocation, loading]);

  useEffect(() => {
    if (_ll.current) setHasUnsaved?.(true);
  }, [companyName, widgetCompanyName, widgetSubtitle, primaryColor, colorHex, logoUrl, companyPhone, companyAddress, privacyUrl, companyLocation, widgetHeadline, widgetSubtext, answerSelectedColor, bubbleText, bubbleBgColor, bubbleTextColor, bubbleIconUrl, showPoweredBy]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSaveRef?.(handleSave); });

  if (loading || planLoading) return <SettingsSkeleton />;

  if (plan === 'starter') return <UpgradeLock feature="Branding" requiredPlan="scale" />;

  function currentBranding() {
    return { company_name: companyName, widget_company_name: widgetCompanyName, widget_subtitle: widgetSubtitle, primary_color: primaryColor, logo_url: logoUrl, company_phone: companyPhone, company_address: companyAddress, privacy_url: privacyUrl, widget_headline: widgetHeadline, widget_subtext: widgetSubtext, answer_selected_color: answerSelectedColor, bubble_text: bubbleText, bubble_bg_color: bubbleBgColor, bubble_text_color: bubbleTextColor, bubble_icon_url: bubbleIconUrl, show_powered_by: showPoweredBy };
  }

  async function handleSave() {
    await supabase.from('client_settings').upsert(
      { client_id: clientId, branding: currentBranding() },
      { onConflict: 'client_id' }
    );
    /* Requires Supabase columns: ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_location TEXT DEFAULT NULL; ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_lat FLOAT8 DEFAULT NULL; ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_lng FLOAT8 DEFAULT NULL; */
    await supabase.from('clients').update({ company_location: companyLocation, company_lat: companyLat, company_lng: companyLng }).eq('id', clientId);
    flash();
    setHasUnsaved?.(false);
    const ts = new Date().toISOString();
    localStorage.setItem(`qq360_last_saved_branding_${profile?.id || 'anon'}`, ts);
    setLastSavedBranding(ts);
  }

  async function resetField(overrides) {
    const merged = { ...currentBranding(), ...overrides };
    await supabase.from('client_settings').upsert({ client_id: clientId, branding: merged }, { onConflict: 'client_id' });
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !clientId) return;
    const ALLOWED_MIME = ['image/jpeg','image/png','image/gif','image/webp','image/bmp','image/x-icon','image/vnd.microsoft.icon'];
    if (!ALLOWED_MIME.includes(file.type)) {
      setLogoUploadErr('Please select an image file.');
      setTimeout(() => setLogoUploadErr(''), 3000);
      return;
    }
    const _ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg','jpeg','png','gif','webp','bmp','ico'].includes(_ext)) {
      setLogoUploadErr('Invalid file type. Please use JPG, PNG, GIF, or WEBP.');
      setTimeout(() => setLogoUploadErr(''), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadErr('Image must be smaller than 5MB.');
      setTimeout(() => setLogoUploadErr(''), 3000);
      return;
    }
    setLogoUploading(true);
    const path = `${clientId}/logo/${file.name}`;
    const { error: uploadError } = await supabase.storage.from('client-assets').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (uploadError) {
      setLogoUploadErr('Upload failed: ' + uploadError.message);
      setTimeout(() => setLogoUploadErr(''), 5000);
      setLogoUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('client-assets').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    setLogoUrl(publicUrl);
    setLogoUploading(false);
    await supabase.from('client_settings').upsert(
      { client_id: clientId, branding: { ...currentBranding(), logo_url: publicUrl } },
      { onConflict: 'client_id' }
    );
  }

  async function handleBubbleIconUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !clientId) return;
    const ALLOWED_MIME = ['image/jpeg','image/png','image/gif','image/webp','image/bmp','image/x-icon','image/vnd.microsoft.icon'];
    if (!ALLOWED_MIME.includes(file.type)) {
      setBubbleIconUploadErr('Please select an image file.');
      setTimeout(() => setBubbleIconUploadErr(''), 3000);
      return;
    }
    const _ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg','jpeg','png','gif','webp','bmp','ico'].includes(_ext)) {
      setBubbleIconUploadErr('Invalid file type. Please use JPG, PNG, GIF, or WEBP.');
      setTimeout(() => setBubbleIconUploadErr(''), 3000);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setBubbleIconUploadErr('Image must be smaller than 2MB.');
      setTimeout(() => setBubbleIconUploadErr(''), 3000);
      return;
    }
    setBubbleIconUploading(true);
    const path = `${clientId}/bubble/${file.name}`;
    const { error: uploadError } = await supabase.storage.from('client-assets').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (uploadError) {
      setBubbleIconUploadErr('Upload failed: ' + uploadError.message);
      setTimeout(() => setBubbleIconUploadErr(''), 5000);
      setBubbleIconUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('client-assets').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    setBubbleIconUrl(publicUrl);
    setBubbleIconUploading(false);
    await supabase.from('client_settings').upsert(
      { client_id: clientId, branding: { ...currentBranding(), bubble_icon_url: publicUrl } },
      { onConflict: 'client_id' }
    );
  }

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Branding</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Customize how your estimator tool looks.</p>
      </div>

      <div style={CARD}>
        <FieldRow label="Company Name" onReset={() => { setCompanyName(''); resetField({ company_name: '' }); }}>
          <TextInput value={companyName} onChange={setCompanyName} placeholder="Your company name" />
        </FieldRow>

        <FieldRow label="Widget Company Name" onReset={() => { setWidgetCompanyName(''); resetField({ widget_company_name: '' }); }}>
          <TextInput value={widgetCompanyName} onChange={setWidgetCompanyName} placeholder="Your company name" />
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>The company name shown in the CENTER of the welcome screen in your estimator tool. Leave blank to use your Company Name above.</p>
        </FieldRow>

        <FieldRow label="Widget Subtitle" onReset={() => { setWidgetSubtitle('Quick project estimate'); resetField({ widget_subtitle: 'Quick project estimate' }); }}>
          <TextInput value={widgetSubtitle} onChange={setWidgetSubtitle} placeholder="Quick project estimate" />
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>The small text shown under your company name in the tool header.</p>
        </FieldRow>

        {plan === 'scale' && (
          <FieldRow label="Primary Color" onReset={() => { setPrimaryColor('#166534'); setColorHex('#166534'); resetField({ primary_color: '#166534' }); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={primaryColor}
                onChange={e => { setPrimaryColor(e.target.value); setColorHex(e.target.value); }}
                style={{ width: '42px', height: '36px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px', backgroundColor: '#fff' }} />
              <input type="text" value={colorHex}
                onChange={e => { setColorHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setPrimaryColor(e.target.value); }}
                style={{ width: '120px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'monospace', backgroundColor: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {['#166534', '#1d4ed8', '#7c3aed', '#dc2626', '#d97706', '#0e7490'].map(color => (
                <div key={color} onClick={() => { setPrimaryColor(color); setColorHex(color); }}
                  style={{ width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', backgroundColor: color, border: `2px solid ${primaryColor === color ? '#0d1117' : 'transparent'}` }} />
              ))}
            </div>
          </FieldRow>
        )}

        <FieldRow label="Logo" onReset={() => { setLogoUrl(''); resetField({ logo_url: '' }); }}>
          <label style={{ display: 'inline-block', cursor: logoUploading ? 'not-allowed' : 'pointer', opacity: logoUploading ? 0.7 : 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', backgroundColor: '#fff', color: '#374151', fontFamily: FONT }}>
              <span>📁</span>
              <span>{logoUploading ? 'Uploading…' : 'Upload logo image'}</span>
            </div>
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={logoUploading} />
          </label>
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>For best results, upload a square PNG with transparent background, minimum 400×400px. A transparent background ensures your logo displays correctly on any color.</p>
          {logoUploadErr && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: '600', fontFamily: FONT }}>{logoUploadErr}</p>}
          {logoUrl && isValidUrl(logoUrl) && (
            <img src={logoUrl} alt="Logo preview"
              style={{ marginTop: '10px', maxHeight: '60px', maxWidth: '200px', borderRadius: '8px', border: '1px solid #e8ede8', objectFit: 'contain', display: 'block' }}
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </FieldRow>

        <FieldRow label="Company Phone" onReset={() => { setCompanyPhone(''); resetField({ company_phone: '' }); }}>
          <TextInput value={companyPhone} onChange={setCompanyPhone} placeholder="+46 8 123 456 78" />
        </FieldRow>

        <FieldRow label="Company Address" onReset={() => { setCompanyAddress(''); resetField({ company_address: '' }); }}>
          <TextInput value={companyAddress} onChange={setCompanyAddress} placeholder="123 Main St, Stockholm" />
        </FieldRow>

        <FieldRow label="Your Privacy Policy URL" onReset={() => { setPrivacyUrl(''); resetField({ privacy_url: '' }); }}>
          <TextInput type="url" value={privacyUrl} onChange={setPrivacyUrl} placeholder="https://yourwebsite.com/privacy" />
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Shown to customers in the estimator tool before they submit their details.</p>
        </FieldRow>

        <FieldRow label="Company location / Depot address" onReset={() => { setCompanyLocation(''); setCompanyLat(null); setCompanyLng(null); if (locationInputRef.current) locationInputRef.current.value = ''; }}>
          <input
            ref={locationInputRef}
            type="text"
            defaultValue={companyLocation}
            placeholder="Start typing your address..."
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', color: '#0d1117', outline: 'none', fontFamily: FONT, backgroundColor: '#fff' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
            {companyLat !== null
              ? <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>📍 Location verified</span>
              : <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Enter your address above to verify location.</span>
            }
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Used to calculate travel distance to customer locations.</p>
        </FieldRow>

        <FieldRow label="Widget Headline" onReset={() => { setWidgetHeadline('Get an instant project estimate'); resetField({ widget_headline: 'Get an instant project estimate' }); }}>
          <TextInput value={widgetHeadline} onChange={setWidgetHeadline} placeholder="Get an instant project estimate" />
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>The main title shown at the top of your estimator tool.</p>
        </FieldRow>

        <FieldRow label="Widget Subtext" onReset={() => { setWidgetSubtext('Answer a few questions about your project and we will give you a preliminary cost estimate right away.'); resetField({ widget_subtext: 'Answer a few questions about your project and we will give you a preliminary cost estimate right away.' }); }}>
          <Textarea value={widgetSubtext} onChange={setWidgetSubtext} placeholder="Answer a few questions about your project and we'll give you a preliminary cost estimate right away." rows={3} />
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>The description shown below the headline.</p>
        </FieldRow>

        <FieldRow label="Answer Selected Color" onReset={() => { setAnswerSelectedColor('#dcfce7'); setAnswerSelectedHex('#dcfce7'); resetField({ answer_selected_color: '#dcfce7' }); }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="color" value={answerSelectedColor}
              onChange={e => { setAnswerSelectedColor(e.target.value); setAnswerSelectedHex(e.target.value); }}
              style={{ width: '42px', height: '36px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px', backgroundColor: '#fff' }} />
            <input type="text" value={answerSelectedHex}
              onChange={e => { setAnswerSelectedHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setAnswerSelectedColor(e.target.value); }}
              style={{ width: '120px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'monospace', backgroundColor: '#fff' }} />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>The background color shown on a selected answer option in your estimator tool.</p>
        </FieldRow>

        {/* Chat Bubble section */}
        <div style={{ borderTop: '1px solid #f4f6f4', marginTop: '20px', paddingTop: '20px' }}>
          <p style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Chat Bubble</p>

          <FieldRow label="Chat Bubble Text" onReset={() => { setBubbleText("Let's get you an estimate!"); resetField({ bubble_text: "Let's get you an estimate!" }); }}>
            <TextInput value={bubbleText} onChange={setBubbleText} placeholder="Let's get you an estimate!" />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>The text shown in the floating chat bubble on your website.</p>
          </FieldRow>

          <FieldRow label="Bubble Background Color" onReset={() => { setBubbleBgColor('#ffffff'); setBubbleBgHex('#ffffff'); resetField({ bubble_bg_color: '#ffffff' }); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={bubbleBgColor}
                onChange={e => { setBubbleBgColor(e.target.value); setBubbleBgHex(e.target.value); }}
                style={{ width: '42px', height: '36px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px', backgroundColor: '#fff' }} />
              <input type="text" value={bubbleBgHex}
                onChange={e => { setBubbleBgHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setBubbleBgColor(e.target.value); }}
                style={{ width: '120px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'monospace', backgroundColor: '#fff' }} />
            </div>
          </FieldRow>

          <FieldRow label="Bubble Text Color" onReset={() => { setBubbleTextColor('#000000'); setBubbleTextHex('#000000'); resetField({ bubble_text_color: '#000000' }); }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="color" value={bubbleTextColor}
                onChange={e => { setBubbleTextColor(e.target.value); setBubbleTextHex(e.target.value); }}
                style={{ width: '42px', height: '36px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px', backgroundColor: '#fff' }} />
              <input type="text" value={bubbleTextHex}
                onChange={e => { setBubbleTextHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setBubbleTextColor(e.target.value); }}
                style={{ width: '120px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'monospace', backgroundColor: '#fff' }} />
            </div>
          </FieldRow>

          <FieldRow label="Bubble Icon" onReset={() => { setBubbleIconUrl(''); resetField({ bubble_icon_url: '' }); }}>
            <label style={{ display: 'inline-block', cursor: bubbleIconUploading ? 'not-allowed' : 'pointer', opacity: bubbleIconUploading ? 0.7 : 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', backgroundColor: '#fff', color: '#374151', fontFamily: FONT }}>
                <span>📁</span>
                <span>{bubbleIconUploading ? 'Uploading…' : 'Upload icon image'}</span>
              </div>
              <input type="file" accept="image/*" onChange={handleBubbleIconUpload} style={{ display: 'none' }} disabled={bubbleIconUploading} />
            </label>
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Recommended: PNG or SVG, 32x32px, transparent background, max 2MB.</p>
            {bubbleIconUploadErr && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: '600', fontFamily: FONT }}>{bubbleIconUploadErr}</p>}
            {bubbleIconUrl && isValidUrl(bubbleIconUrl) && (
              <img src={bubbleIconUrl} alt="Bubble icon preview"
                style={{ marginTop: '10px', height: '32px', width: '32px', borderRadius: '6px', border: '1px solid #e8ede8', objectFit: 'contain', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; }} />
            )}
          </FieldRow>

          <div style={{ marginTop: '12px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Bubble Preview</p>
            <div style={{ display: 'inline-flex', borderRadius: '50px', padding: '12px 20px', alignItems: 'center', gap: '10px', backgroundColor: bubbleBgColor, color: bubbleTextColor }}>
              {bubbleIconUrl && isValidUrl(bubbleIconUrl) && (
                <img src={bubbleIconUrl} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
              )}
              <span style={{ fontSize: '13.5px', fontWeight: '600', fontFamily: FONT }}>{bubbleText || "Let's get you an estimate!"}</span>
            </div>
          </div>
        </div>

        {/* Powered By Badge */}
        <div style={{ borderTop: '1px solid #f4f6f4', marginTop: '20px', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Show Powered by QuickQuote360</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>
                {plan !== 'enterprise' ? 'Available on Enterprise plan only' : 'Toggle the powered-by badge on your estimator tool.'}
              </p>
            </div>
            <Toggle value={showPoweredBy} onChange={v => { if (plan === 'enterprise') { setShowPoweredBy(v); resetField({ show_powered_by: v }); } }} />
          </div>
        </div>
      </div>

      <SaveRow onClick={handleSave} msg={saveMsg} />
      <LastSaved ts={lastSavedBranding} />

      <div style={{ marginTop: '24px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Live Preview</p>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {[{ key: 'header', label: 'Widget Header' }, { key: 'lead', label: 'Lead Card' }].map(tab => (
            <button key={tab.key} type="button" onClick={() => setPreviewTab(tab.key)}
              style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, border: previewTab === tab.key ? 'none' : '1px solid #d1d5db', backgroundColor: previewTab === tab.key ? primaryColor : '#fff', color: previewTab === tab.key ? '#fff' : '#6b7280', transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>
        {previewTab === 'header' && (
          <div style={{ backgroundColor: primaryColor, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {logoUrl && isValidUrl(logoUrl) ? (
              <img src={logoUrl} alt="logo" style={{ height: '36px', width: '36px', borderRadius: '8px', objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.15)', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none'; }} />
            ) : (
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', flex: 1, fontFamily: FONT }}>
              {companyName || 'Your Company Name'}
            </span>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: primaryColor, cursor: 'default', whiteSpace: 'nowrap', fontFamily: FONT }}>
              Get a Quote
            </div>
          </div>
        )}
        {previewTab === 'lead' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ height: '6px', backgroundColor: primaryColor, borderRadius: '6px 6px 0 0' }} />
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Erik Bergström</p>
              <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: '#9ca3af', fontFamily: FONT }}>erik.b@example.com</p>
              <p style={{ margin: '0 0 12px', fontSize: '26px', fontWeight: '800', color: primaryColor, letterSpacing: '-0.5px', fontFamily: FONT }}>148,000 kr</p>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: '#dbeafe', color: '#1d4ed8', fontFamily: FONT }}>New</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── 2. Email Settings ───────────────────────────────────────── */

function EmailSection({ clientId, setHasUnsaved, setSaveRef }) {
  const { profile } = useAuth();
  const { plan, planLoading } = useClientPlan();
  const [fromName,     setFromName]     = useState('');
  const [replyTo,      setReplyTo]      = useState('');
  const [subject,      setSubject]      = useState('');
  const [emailBody,    setEmailBody]    = useState('');
  const [footerText,   setFooterText]   = useState('');
  const [saveMsg, flash] = useSaveMsg();
  const [testMsg,      setTestMsg]      = useState('');
  const [testSending,  setTestSending]  = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [lastSavedEmail, setLastSavedEmail] = useState(() => localStorage.getItem(`qq360_last_saved_email_${profile?.id || 'anon'}`) || '');
  const _ll = useRef(false);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('email_settings').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => {
        const es = data?.email_settings || {};
        setFromName(es.from_name    || '');
        setReplyTo(es.reply_to      || '');
        setSubject(es.subject       || '');
        setEmailBody(es.email_body  || '');
        setFooterText(es.footer_text || '');
        setLoading(false);
        setTimeout(() => { _ll.current = true; }, 50);
      });
  }, [clientId]);

  useEffect(() => {
    if (_ll.current) setHasUnsaved?.(true);
  }, [fromName, replyTo, subject, emailBody, footerText]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSaveRef?.(handleSave); });

  if (planLoading) return <SettingsSkeleton />;
  if (!['scale', 'enterprise', 'free_trial'].includes(plan)) return <UpgradeLock feature="Email Settings" requiredPlan="scale" />;
  if (loading) return <SettingsSkeleton />;

  async function handleSave() {
    await supabase.from('client_settings').upsert(
      { client_id: clientId, email_settings: { from_name: fromName, reply_to: replyTo, subject, email_body: emailBody, footer_text: footerText } },
      { onConflict: 'client_id' }
    );
    flash();
    setHasUnsaved?.(false);
    const ts = new Date().toISOString();
    localStorage.setItem(`qq360_last_saved_email_${profile?.id || 'anon'}`, ts);
    setLastSavedEmail(ts);
  }

  async function handleTestEmail() {
    if (!profile?.email) return;
    setTestSending(true);
    try {
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: fromName,
          subject: 'Test Email from QuickQuote360',
          body: `This is a test email to confirm your email settings are working correctly. From Name: ${fromName}. Reply-To: ${replyTo}. If you received this email your settings are configured correctly.`,
        }),
      });
      setTestMsg(res.ok ? 'Test email sent!' : 'Failed to send');
    } catch {
      setTestMsg('Failed to send');
    }
    setTestSending(false);
    setTimeout(() => setTestMsg(''), 3000);
  }

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Email Settings</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Control how emails are sent to your customers.</p>
      </div>

      <div style={CARD}>
        <FieldRow label="From Name">
          <TextInput value={fromName} onChange={setFromName} placeholder="e.g. Acme Estimator" />
        </FieldRow>
        <FieldRow label="Reply-To Email">
          <TextInput type="email" value={replyTo} onChange={setReplyTo} placeholder="reply@yourcompany.com" />
        </FieldRow>
        <FieldRow label="Custom Email Subject">
          <TextInput value={subject} onChange={setSubject} placeholder="Your estimate from {company}" />
        </FieldRow>
        <FieldRow label="Email Body">
          <Textarea value={emailBody} onChange={setEmailBody}
            placeholder={'Hi {{name}},\n\nPlease find your estimation PDF attached.\n\nBest regards,\n{{company_name}}'}
            rows={6} />
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT, lineHeight: '1.5' }}>
            {'Use {{name}} to include the customer\'s name and {{company_name}} for your company name. These are replaced automatically when the email is sent.'}
          </p>
        </FieldRow>
        <FieldRow label="Email Footer Text">
          <Textarea value={footerText} onChange={setFooterText} placeholder="Your company address, legal disclaimer, etc." rows={4} />
        </FieldRow>
      </div>

      <SaveRow onClick={handleSave} msg={saveMsg} />
      <LastSaved ts={lastSavedEmail} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
        <button type="button" onClick={handleTestEmail} disabled={testSending || !profile?.email}
          style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: (testSending || !profile?.email) ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: !profile?.email ? 0.5 : 1 }}>
          {testSending ? 'Sending…' : 'Send Test to My Email'}
        </button>
        {testMsg && <span style={{ fontSize: '13px', fontWeight: '600', color: testMsg.includes('sent') ? '#16a34a' : '#dc2626', fontFamily: FONT }}>{testMsg}</span>}
      </div>

      <div style={{ marginTop: '24px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FONT }}>Email Preview</p>
        <div style={{ border: '1px solid #e8ede8', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
          <div style={{ backgroundColor: '#f9fbf9', borderBottom: '1px solid #e8ede8', padding: '12px 16px', fontSize: '12.5px', color: '#374151', fontFamily: FONT }}>
            <strong>From:</strong> {fromName || 'Your Name'} &nbsp;·&nbsp; <strong>Subject:</strong> {subject || 'Your Quote from QuickQuote360'}
          </div>
          <div style={{ padding: '20px', fontFamily: FONT }}>
            <p style={{ margin: '0 0 12px', fontSize: '13.5px', color: '#0d1117' }}>Hi <em>Customer Name</em>,</p>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>Your quote has been prepared and attached to this email. Please review it at your convenience.</p>
            {footerText ? (
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', borderTop: '1px solid #f4f6f4', paddingTop: '12px', lineHeight: '1.6' }}>{footerText}</p>
            ) : (
              <p style={{ margin: 0, fontSize: '12px', color: '#d1d5db', borderTop: '1px solid #f4f6f4', paddingTop: '12px', fontStyle: 'italic' }}>Email footer text will appear here…</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 3. Languages ────────────────────────────────────────────── */

const LANG_OPTIONS = [
  { code: 'EN', label: 'English' },
  { code: 'SV', label: 'Svenska' },
  { code: 'DE', label: 'Deutsch' },
  { code: 'FR', label: 'Français' },
];

function LanguagesSection({ clientId, setHasUnsaved, setSaveRef }) {
  const { profile } = useAuth();
  const [enabled,         setEnabled]         = useState({ EN: true, SV: false, DE: false, FR: false });
  const [defaultLanguage, setDefaultLanguage] = useState('EN');
  const [saveMsg, flash] = useSaveMsg();
  const [loading, setLoading] = useState(true);
  const [lastSavedLangs, setLastSavedLangs] = useState(() => localStorage.getItem(`qq360_last_saved_languages_${profile?.id || 'anon'}`) || '');
  const [questionCounts,  setQuestionCounts]  = useState({ EN: null, SV: null, DE: null, FR: null });
  const [copyEnMsg, setCopyEnMsg] = useState('');
  const [copyEnWorking, setCopyEnWorking] = useState(false);
  const [langToggleErr, setLangToggleErr] = useState('');
  const _ll = useRef(false);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('language_settings').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => {
        const ls = data?.language_settings || {};
        setEnabled(ls.enabled || { EN: true, SV: false, DE: false, FR: false });
        setDefaultLanguage(ls.default_language || 'EN');
        setLoading(false);
        setTimeout(() => { _ll.current = true; }, 50);
      });
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_questions').select('label_en, label_sv, label_de, label_fr').eq('client_id', clientId)
      .then(({ data }) => {
        if (!data) return;
        setQuestionCounts({
          EN: data.filter(r => r.label_en?.trim()).length,
          SV: data.filter(r => r.label_sv?.trim()).length,
          DE: data.filter(r => r.label_de?.trim()).length,
          FR: data.filter(r => r.label_fr?.trim()).length,
        });
      });
  }, [clientId]);

  useEffect(() => {
    if (_ll.current) setHasUnsaved?.(true);
  }, [enabled, defaultLanguage]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSaveRef?.(handleSave); });

  if (loading) return <SettingsSkeleton />;

  function handleToggle(code) {
    setEnabled(prev => {
      const next = { ...prev, [code]: !prev[code] };
      const anyOn = Object.values(next).some(Boolean);
      if (!anyOn) {
        setLangToggleErr('At least one language must be enabled.');
        setTimeout(() => setLangToggleErr(''), 2000);
        return prev;
      }
      if (!next[defaultLanguage]) {
        const firstEnabled = Object.keys(next).find(k => next[k]);
        if (firstEnabled) setDefaultLanguage(firstEnabled);
      }
      return next;
    });
  }

  async function handleSave() {
    await supabase.from('client_settings').upsert(
      { client_id: clientId, language_settings: { enabled, default_language: defaultLanguage } },
      { onConflict: 'client_id' }
    );
    flash();
    setHasUnsaved?.(false);
    const ts = new Date().toISOString();
    localStorage.setItem(`qq360_last_saved_languages_${profile?.id || 'anon'}`, ts);
    setLastSavedLangs(ts);
  }

  const enabledCodes = LANG_OPTIONS.filter(({ code }) => enabled[code]);

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Languages</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Choose which languages your estimator tool supports.</p>
      </div>

      <div style={CARD}>
        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>At least one language must always be enabled.</p>
        <div style={{ marginTop: '12px' }}>
          {LANG_OPTIONS.map(({ code, label }, i) => {
            const cnt = questionCounts[code];
            const badgeBg    = cnt === null ? 'transparent' : cnt === 0 ? '#f3f4f6' : cnt >= 14 ? '#dcfce7' : '#fef9c3';
            const badgeColor = cnt === null ? 'transparent' : cnt === 0 ? '#9ca3af' : cnt >= 14 ? '#166534' : '#d97706';
            return (
              <div key={code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < LANG_OPTIONS.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{code}</span>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>{label}</span>
                  {cnt !== null && (
                    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', fontFamily: FONT, backgroundColor: badgeBg, color: badgeColor }}>
                      {cnt}/14
                    </span>
                  )}
                </div>
                <Toggle value={!!enabled[code]} onChange={() => handleToggle(code)} />
              </div>
            );
          })}
          {langToggleErr && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: '600', fontFamily: FONT }}>{langToggleErr}</p>}
        </div>
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f4f6f4' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT }}>Default Language</label>
          <select value={defaultLanguage} onChange={e => setDefaultLanguage(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', color: '#0d1117', outline: 'none', fontFamily: FONT, backgroundColor: '#fff', cursor: 'pointer' }}>
            {enabledCodes.map(({ code, label }) => (
              <option key={code} value={code}>{code}, {label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <button type="button" disabled={copyEnWorking} onClick={async () => {
          if (!window.confirm('Copy all English labels and helper text to Swedish, German, and French? This will overwrite any existing translations.')) return;
          setCopyEnWorking(true);
          setCopyEnMsg('Copying...');
          const { data: rows } = await supabase.from('client_questions').select('id, question_key, label_en, helper_en').eq('client_id', clientId);
          if (rows && rows.length > 0) {
            await supabase.from('client_questions').upsert(
              rows.map(r => ({ id: r.id, client_id: clientId, question_key: r.question_key, label_sv: r.label_en, label_de: r.label_en, label_fr: r.label_en, helper_sv: r.helper_en, helper_de: r.helper_en, helper_fr: r.helper_en })),
              { onConflict: 'client_id,question_key' }
            );
          }
          setCopyEnWorking(false);
          setCopyEnMsg('All done! English labels copied to all languages.');
          setTimeout(() => setCopyEnMsg(''), 3000);
        }} style={{ backgroundColor: PRIMARY, color: '#fff', borderRadius: '10px', padding: '9px 20px', fontSize: '13.5px', fontWeight: '600', cursor: copyEnWorking ? 'not-allowed' : 'pointer', fontFamily: FONT, border: 'none', opacity: copyEnWorking ? 0.7 : 1 }}>
          Copy EN to all languages
        </button>
        {copyEnMsg && <p style={{ margin: '8px 0 0', fontSize: '13px', color: copyEnMsg.includes('done') ? '#16a34a' : '#374151', fontWeight: '600', fontFamily: FONT }}>{copyEnMsg}</p>}
      </div>

      <SaveRow onClick={handleSave} msg={saveMsg} />
      <LastSaved ts={lastSavedLangs} />
    </>
  );
}

/* ── 4. Embed Code ───────────────────────────────────────────── */

function EmbedCodeSection({ clientId }) {
  const { plan, planLoading } = useClientPlan();
  const [copied,        setCopied]        = useState(false);
  const [copiedAlt,     setCopiedAlt]     = useState(false);
  const [copiedIframe,  setCopiedIframe]  = useState(false);
  const [copiedWP,      setCopiedWP]      = useState(false);
  const [copiedLink,    setCopiedLink]    = useState(false);
  const [qrSize,        setQrSize]        = useState(200);
  const scriptTag    = `<script src="https://estimator.quickquote360.com/embed.js?clientId=${clientId || 'CLIENT_ID_HERE'}"></script>`;
  const scriptTagAlt = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="${clientId || 'CLIENT_ID_HERE'}"></script>`;
  const iframeTag    = `<iframe src="https://estimator.quickquote360.com?clientId=${clientId || 'CLIENT_ID_HERE'}" width="100%" height="700" frameborder="0"></iframe>`;
  const shortcodeTag = `[quickquote360 client_id="${clientId || 'CLIENT_ID_HERE'}"]`;
  const directLink   = `https://estimator.quickquote360.com?clientId=${clientId || 'CLIENT_ID_HERE'}`;

  function handleCopy() {
    navigator.clipboard.writeText(scriptTag).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCopyIframe() {
    navigator.clipboard.writeText(iframeTag).then(() => {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    });
  }

  function handleCopyWP() {
    navigator.clipboard.writeText(shortcodeTag).then(() => {
      setCopiedWP(true);
      setTimeout(() => setCopiedWP(false), 2000);
    });
  }

  if (planLoading) return (
    <div style={{ height: '200px', borderRadius: '16px', backgroundColor: '#f0f0f0', animation: 'pulse 1.5s ease-in-out infinite' }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
    </div>
  );

  if (plan === 'starter') return <UpgradeLock feature="Embed Code" requiredPlan="scale" />;

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Embed Code</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Add the estimator tool to your website.</p>
      </div>

      <div style={CARD}>
        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>Script Tag (recommended)</p>
        <div style={{ backgroundColor: '#0d1117', borderRadius: '12px', padding: '20px', marginBottom: '14px', overflowX: 'auto' }}>
          <code style={{ fontSize: '13px', color: LIME, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.6' }}>
            {scriptTag}
          </code>
        </div>
        <button type="button" onClick={handleCopy}
          style={{ backgroundColor: copied ? '#ecfccb' : PRIMARY, color: copied ? '#3f6212' : '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', marginBottom: '16px' }}>
          {copied ? 'Copied!' : 'Copy Code'}
        </button>

        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>Alternative format (data attribute)</p>
        <div style={{ backgroundColor: '#0d1117', borderRadius: '12px', padding: '20px', marginBottom: '14px', overflowX: 'auto' }}>
          <code style={{ fontSize: '13px', color: LIME, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.6' }}>
            {scriptTagAlt}
          </code>
        </div>
        <button type="button" onClick={() => navigator.clipboard.writeText(scriptTagAlt).then(() => { setCopiedAlt(true); setTimeout(() => setCopiedAlt(false), 2000); })}
          style={{ backgroundColor: copiedAlt ? '#ecfccb' : PRIMARY, color: copiedAlt ? '#3f6212' : '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', marginBottom: '24px' }}>
          {copiedAlt ? 'Copied!' : 'Copy Code'}
        </button>

        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>iFrame Alternative</p>
        <div style={{ backgroundColor: '#0d1117', borderRadius: '12px', padding: '20px', marginBottom: '14px', overflowX: 'auto' }}>
          <code style={{ fontSize: '13px', color: LIME, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.6' }}>
            {iframeTag}
          </code>
        </div>
        <button type="button" onClick={handleCopyIframe}
          style={{ backgroundColor: copiedIframe ? '#ecfccb' : PRIMARY, color: copiedIframe ? '#3f6212' : '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', marginBottom: '12px' }}>
          {copiedIframe ? 'Copied!' : 'Copy iFrame'}
        </button>
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontFamily: FONT }}>
          Paste this before the closing <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>&lt;/body&gt;</code> tag on your website.
        </p>

        <p style={{ margin: '24px 0 8px', fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>WordPress Shortcode</p>
        <div style={{ backgroundColor: '#0d1117', borderRadius: '12px', padding: '20px', marginBottom: '14px', overflowX: 'auto' }}>
          <code style={{ fontSize: '13px', color: LIME, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.6' }}>
            {shortcodeTag}
          </code>
        </div>
        <button type="button" onClick={handleCopyWP}
          style={{ backgroundColor: copiedWP ? '#ecfccb' : PRIMARY, color: copiedWP ? '#3f6212' : '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', marginBottom: '10px' }}>
          {copiedWP ? 'Copied!' : 'Copy Shortcode'}
        </button>
        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>
          Requires the QuickQuote360 WordPress plugin. Contact support to get the plugin.
        </p>

        <p style={{ margin: '24px 0 8px', fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>Direct Link</p>
        <div style={{ backgroundColor: '#0d1117', borderRadius: '12px', padding: '20px', marginBottom: '14px', overflowX: 'auto' }}>
          <code style={{ fontSize: '13px', color: LIME, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.6' }}>
            {directLink}
          </code>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="button" onClick={() => navigator.clipboard.writeText(directLink).then(() => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); })}
            style={{ backgroundColor: copiedLink ? '#ecfccb' : PRIMARY, color: copiedLink ? '#3f6212' : '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s' }}>
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </button>
          <a href={directLink} target="_blank" rel="noopener noreferrer"
            style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: PRIMARY, borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, textDecoration: 'none', display: 'inline-block' }}>
            Open in new tab →
          </a>
        </div>

        <p style={{ margin: '24px 0 8px', fontSize: '12px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>QR Code</p>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(directLink)}`}
          alt="QR Code for estimator link"
          style={{ width: '160px', height: '160px', borderRadius: '8px', border: '1px solid #e8ede8', display: 'block', marginBottom: '12px' }}
        />
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {[{ label: 'Small', size: 150 }, { label: 'Medium', size: 200 }, { label: 'Large', size: 300 }].map(opt => (
            <button key={opt.size} type="button" onClick={() => setQrSize(opt.size)}
              style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, border: qrSize === opt.size ? 'none' : '1px solid #e8ede8', backgroundColor: qrSize === opt.size ? '#0d1117' : '#fff', color: qrSize === opt.size ? '#fff' : '#4b5563' }}>
              {opt.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(directLink)}`, '_blank')}
          style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
          Download QR Code
        </button>

        <div style={{ borderTop: '1px solid #f4f6f4', marginTop: '28px', paddingTop: '20px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#374151', fontFamily: FONT }}>Powered By Badge</p>
          <span style={{ display: 'inline-block', backgroundColor: '#0d1f12', color: '#ffffff', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600', fontFamily: FONT }}>
            ⚡ Powered by QuickQuote360
          </span>
          <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT, lineHeight: '1.6' }}>
            {plan !== 'enterprise'
              ? 'The Powered by QuickQuote360 badge appears on your estimator tool and PDF. It can only be removed on the Enterprise plan.'
              : 'You can hide the Powered by QuickQuote360 badge in the Branding section.'}
          </p>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e8ede8' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Need help installing?</p>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Detailed step-by-step installation guides for every platform.</p>
          <a href="/install-guide" target="_blank"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0d1f12', color: '#a3e635', borderRadius: '10px', padding: '10px 20px', fontSize: '13.5px', fontWeight: '600', textDecoration: 'none', fontFamily: FONT }}>
            📖 View Installation Guide →
          </a>
        </div>
      </div>
    </>
  );
}

/* ── 5. Account ──────────────────────────────────────────────── */

function AccountSection({ setHasUnsaved, setSaveRef }) {
  const { profile } = useAuth();
  const [fullName,    setFullName]    = useState('');
  const [avatarUrl,   setAvatarUrl]   = useState('');
  const [saveMsg,     flash]          = useSaveMsg();
  const [pwMsg,       setPwMsg]       = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [uploadErr,   setUploadErr]   = useState('');
  const [dataReady,   setDataReady]   = useState(false);
  const _ll = useRef(false);

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from('profiles').select('full_name, avatar_url').eq('id', profile.id).maybeSingle()
      .then(({ data }) => {
        if (data) { setFullName(data.full_name || ''); setAvatarUrl(data.avatar_url || ''); }
        setDataReady(true);
        setTimeout(() => { _ll.current = true; }, 50);
      });
  }, [profile?.id]);

  useEffect(() => {
    if (_ll.current) setHasUnsaved?.(true);
  }, [fullName]);

  async function handleSave() {
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
    flash();
    setHasUnsaved?.(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSaveRef?.(handleSave); });

  async function handleResetPassword() {
    await supabase.auth.resetPasswordForEmail(profile.email);
    setPwMsg('Reset email sent!');
    setTimeout(() => setPwMsg(''), 3000);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    const ALLOWED_MIME = ['image/jpeg','image/png','image/gif','image/webp','image/bmp','image/x-icon','image/vnd.microsoft.icon'];
    if (!ALLOWED_MIME.includes(file.type)) {
      setUploadErr('Please select an image file.');
      setTimeout(() => setUploadErr(''), 3000);
      return;
    }
    const _ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg','jpeg','png','gif','webp','bmp','ico'].includes(_ext)) {
      setUploadErr('Invalid file type. Please use JPG, PNG, GIF, or WEBP.');
      setTimeout(() => setUploadErr(''), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('Image must be smaller than 5MB');
      setTimeout(() => setUploadErr(''), 3000);
      return;
    }
    setUploading(true);
    const ext  = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (uploadError) {
      setUploadErr('Upload failed: ' + uploadError.message);
      setTimeout(() => setUploadErr(''), 5000);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = urlData.publicUrl;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
    setAvatarUrl(url);
    setUploading(false);
  }

  if (!dataReady) return <SettingsSkeleton />;

  const initials = (fullName || profile?.email || '?').slice(0, 2).toUpperCase();

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Account</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Manage your personal profile and security settings.</p>
      </div>

      {/* Profile Photo */}
      <div style={CARD}>
        <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Profile Photo</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar"
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e8ede8', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#0d1f12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '22px', fontWeight: '700', color: LIME, fontFamily: FONT }}>{initials}</span>
            </div>
          )}
          <div>
            <label style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13.5px', fontWeight: '600', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: uploading ? 0.7 : 1, display: 'inline-block' }}>
              {uploading ? 'Uploading…' : 'Upload Photo'}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Recommended: JPG or PNG, 200x200px, square crop works best, max 5MB.</p>
            {uploadErr && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#dc2626', fontWeight: '600', fontFamily: FONT }}>{uploadErr}</p>}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div style={CARD}>
        <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Profile Info</p>
        <FieldRow label="Full Name">
          <TextInput value={fullName} onChange={setFullName} placeholder="Your full name" />
        </FieldRow>
        <FieldRow label="Email">
          <input type="email" value={profile?.email || ''} readOnly
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', color: '#6b7280', outline: 'none', fontFamily: FONT, backgroundColor: '#f9fafb', cursor: 'not-allowed' }} />
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Contact support to change your email.</p>
        </FieldRow>
      </div>
      <SaveRow onClick={handleSave} msg={saveMsg} />

      {/* Password */}
      <div style={{ ...CARD, marginTop: '16px' }}>
        <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Password</p>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>We'll send a password reset link to your email address.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" onClick={handleResetPassword}
            style={{ backgroundColor: '#fff', color: '#0d1117', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 20px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            Change Password
          </button>
          {pwMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{pwMsg}</span>}
        </div>
      </div>
    </>
  );
}

/* ── 6. Danger Zone ──────────────────────────────────────────── */

function DangerZoneSection() {
  const { profile } = useAuth();
  const [msg, setMsg] = useState('');

  async function handleDeleteLeads() {
    if (!window.confirm('Permanently delete all your leads? This cannot be undone.')) return;
    await supabase.from('leads').delete().eq('client_id', profile.client_id);
    setMsg('All leads deleted.');
    setTimeout(() => setMsg(''), 3000);
  }

  async function handleRequestDeletion() {
    if (!window.confirm('Request account deletion? Our team will contact you to confirm.')) return;
    await fetch('https://estimator-widget-production.up.railway.app/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:   'support@quickquote360.com',
        subject: 'Account Deletion Request',
        body:    `Client ${profile.full_name || ''} (${profile.email}) has requested account deletion. Client ID: ${profile.client_id}.`,
      }),
    });
    setMsg('Request sent. We will contact you shortly.');
    setTimeout(() => setMsg(''), 4000);
  }

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#dc2626', fontFamily: FONT }}>Danger Zone</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Irreversible actions. Proceed with caution.</p>
      </div>
      <div style={{ ...CARD, border: '1.5px solid #fca5a5', backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #fef2f2' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Delete All My Leads</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Permanently removes all leads from your account.</p>
          </div>
          <button type="button" onClick={handleDeleteLeads}
            style={{ backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '16px' }}>
            Delete All Leads
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Request Account Deletion</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Our team will contact you to confirm.</p>
          </div>
          <button type="button" onClick={handleRequestDeletion}
            style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '16px' }}>
            Request Deletion
          </button>
        </div>
      </div>
      {msg && <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT, marginTop: '8px' }}>{msg}</p>}
    </>
  );
}

/* ── Configuration Status ───────────────────────────────────── */

function ConfigStatusCard() {
  const navigate = useNavigate();
  const { dots } = useConfigStatus();

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

/* ── 7. Subscription ─────────────────────────────────────────── */

const PLAN_FEATURES = {
  starter: ['Unlimited estimates', 'Automatic PDF generation', 'Lead email notifications', 'Powered by QuickQuote360 badge'],
  growth:  ['Everything in Starter', '30 estimates/month', 'Question editor', 'Municipality editor', 'Leads dashboard + CSV export', 'Logo upload'],
  scale:   ['Everything in Growth', '75 estimates/month', 'Full pricing editor', 'PDF content editor', 'Brand colors', 'Email settings', 'Lead status tracking', 'ROT deduction'],
};

const PLAN_PRICES = { starter: '1,400 kr/month', growth: '3,000 kr/month', scale: '6,000 kr/month', free_trial: 'Free (14-day trial)', enterprise: 'Custom' };

const PLAN_BADGE = {
  starter: { bg: '#f3f4f6', color: '#374151' },
  growth:  { bg: '#dbeafe', color: '#1d4ed8' },
  scale:   { bg: '#dcfce7', color: '#166534' },
};

function SubscriptionSection() {
  const { profile } = useAuth();
  const { plan, planLoading } = useClientPlan();
  const [createdAt, setCreatedAt] = useState(null);
  const [cancelMsg, setCancelMsg] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showUpgradeCards, setShowUpgradeCards] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState('growth');
  const [selectedInterval, setSelectedInterval] = useState('month');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalMsg, setPortalMsg] = useState('');

  useEffect(() => {
    if (!profile?.client_id) return;
    supabase.from('clients').select('plan, created_at').eq('id', profile.client_id).maybeSingle()
      .then(({ data }) => { if (data?.created_at) setCreatedAt(data.created_at); });
  }, [profile?.client_id]);

  if (planLoading) return <SettingsSkeleton />;

  const badge = PLAN_BADGE[plan] || PLAN_BADGE.starter;
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.starter;
  const price = PLAN_PRICES[plan] || PLAN_PRICES.starter;
  const memberSince = createdAt ? (() => { const d = new Date(createdAt); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; })() : '';
  const daysLeft = plan === 'free_trial' && createdAt
    ? Math.max(0, 14 - Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://estimator-widget-production.up.railway.app/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ clientId: profile.client_id }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setPortalMsg('Billing portal not available yet');
      setTimeout(() => setPortalMsg(''), 3000);
    } catch {
      setPortalMsg('Billing portal not available yet');
      setTimeout(() => setPortalMsg(''), 3000);
    }
    setPortalLoading(false);
  }

  async function handleCancel() {
    if (!window.confirm('Are you sure you want to cancel your subscription? Your account will remain active until the end of your billing period.')) return;
    setCancelling(true);
    try {
      await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'team@quickquote360.com',
          subject: 'Cancellation Request from ' + profile?.full_name,
          body: 'Client ' + profile?.full_name + ' (' + profile?.email + ') has requested to cancel their subscription. Plan: ' + plan + '. Client ID: ' + profile?.client_id,
        }),
      });
      setCancelMsg('Cancellation request sent. We will contact you shortly.');
      setTimeout(() => setCancelMsg(''), 4000);
    } finally {
      setCancelling(false);
    }
  }

  const PLAN_ORDER = ['starter', 'growth', 'scale'];
  const UPGRADE_PLAN_OPTIONS = [
    { key: 'starter', label: 'Starter', monthly: '1,400kr', yearly: '14,000kr' },
    { key: 'growth',  label: 'Growth',  monthly: '3,000kr', yearly: '30,000kr' },
    { key: 'scale',   label: 'Scale',   monthly: '6,000kr', yearly: '60,000kr' },
  ];
  const planIdx = PLAN_ORDER.indexOf(plan);
  const upgradeOptions = UPGRADE_PLAN_OPTIONS.filter(p => planIdx < 0 || PLAN_ORDER.indexOf(p.key) > planIdx);

  async function handleProceedToPayment() {
    setUpgradeLoading(true);
    try {
      console.log('Checkout payload:', { clientId: profile.client_id, email: profile.email, planKey: selectedUpgradePlan, billingInterval: selectedInterval, installType: 'none' });
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://estimator-widget-production.up.railway.app/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          clientId: profile.client_id,
          email: profile.email,
          planKey: selectedUpgradePlan,
          billingInterval: selectedInterval,
          installType: 'none',
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { console.error('No checkout URL:', data); setUpgradeLoading(false); }
    } catch (err) {
      console.error('Checkout error:', err);
      setUpgradeLoading(false);
    }
  }

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>My Subscription</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Your current plan and billing details.</p>
      </div>

      <div style={CARD}>
        <span style={{ display: 'inline-block', padding: '6px 20px', borderRadius: '20px', fontSize: '15px', fontWeight: '700', marginBottom: '16px', backgroundColor: badge.bg, color: badge.color, fontFamily: FONT }}>
          {(plan || 'starter').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </span>
        {plan === 'free_trial' && daysLeft !== null && (
          <div style={{ backgroundColor: daysLeft <= 3 ? '#fee2e2' : '#fef9c3', borderRadius: '12px', padding: '14px 20px', border: `1px solid ${daysLeft <= 3 ? '#fca5a5' : '#fde68a'}`, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: daysLeft <= 3 ? '#dc2626' : '#854d0e', lineHeight: 1, fontFamily: FONT }}>{daysLeft}</span>
            <span style={{ fontSize: '14px', color: daysLeft <= 3 ? '#dc2626' : '#854d0e', fontFamily: FONT }}>days left on your free trial</span>
          </div>
        )}
        {plan === 'free_trial' ? (
          <>
            <p style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: '800', color: '#0d1117', fontFamily: FONT }}>Free</p>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>14-day trial with Scale features</p>
          </>
        ) : (
          <p style={{ margin: '0 0 16px', fontSize: '28px', fontWeight: '800', color: '#0d1117', fontFamily: FONT }}>{price}</p>
        )}
        <div style={{ marginBottom: '16px' }}>
          {features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '13px', color: '#374151', fontFamily: FONT }}>{f}</span>
            </div>
          ))}
        </div>
        {memberSince && (
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Member since {memberSince}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {upgradeOptions.length > 0 && (
          <button type="button" onClick={() => { setSelectedUpgradePlan(upgradeOptions[0]?.key || 'growth'); setShowUpgradeCards(true); }}
            style={{ backgroundColor: PRIMARY, color: '#fff', borderRadius: '10px', padding: '10px 24px', fontSize: '13.5px', fontWeight: '600', border: 'none', cursor: 'pointer', fontFamily: FONT }}>
            Upgrade Plan →
          </button>
        )}
        <button type="button" onClick={handleManageBilling} disabled={portalLoading}
          style={{ backgroundColor: '#fff', border: '1px solid #e8ede8', color: '#374151', borderRadius: '10px', padding: '9px 20px', fontSize: '13.5px', fontWeight: '600', cursor: portalLoading ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: portalLoading ? 0.7 : 1 }}>
          {portalLoading ? 'Redirecting...' : 'Manage Billing'}
        </button>
        <button type="button" onClick={handleCancel} disabled={cancelling}
          style={{ backgroundColor: '#fff', border: '1px solid #dc2626', color: '#dc2626', borderRadius: '10px', padding: '10px 24px', fontSize: '13.5px', fontWeight: '600', cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: cancelling ? 0.7 : 1 }}>
          Cancel Subscription
        </button>
      </div>
      {portalMsg && <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>{portalMsg}</p>}
      {showUpgradeCards && (
        <div style={{ marginTop: '16px', border: '1px solid #e8ede8', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            {['month', 'year'].map(interval => (
              <button key={interval} type="button" onClick={() => setSelectedInterval(interval)}
                style={{ padding: '6px 18px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: 'none', backgroundColor: selectedInterval === interval ? PRIMARY : '#f3f4f6', color: selectedInterval === interval ? '#fff' : '#6b7280', fontFamily: FONT }}>
                {interval === 'month' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {upgradeOptions.map(p => (
              <div key={p.key} onClick={() => setSelectedUpgradePlan(p.key)}
                style={{ border: `2px solid ${selectedUpgradePlan === p.key ? PRIMARY : '#e8ede8'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', minWidth: '140px', flex: 1, position: 'relative' }}>
                {selectedUpgradePlan === p.key && (
                  <span style={{ position: 'absolute', top: '10px', right: '12px', color: PRIMARY, fontWeight: '700', fontSize: '13px' }}>✓</span>
                )}
                <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '13px', color: '#0d1117', fontFamily: FONT, textTransform: 'capitalize' }}>{p.label}</p>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0d1117', fontFamily: FONT }}>
                  {selectedInterval === 'month' ? p.monthly : p.yearly}
                  <span style={{ fontSize: '12px', fontWeight: '400', color: '#9ca3af', fontFamily: FONT }}>/{selectedInterval === 'month' ? 'mo' : 'yr'}</span>
                </p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" disabled={upgradeLoading} onClick={handleProceedToPayment}
              style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13.5px', fontWeight: '600', cursor: upgradeLoading ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: upgradeLoading ? 0.7 : 1 }}>
              {upgradeLoading ? 'Redirecting...' : 'Proceed to Payment'}
            </button>
            <button type="button" onClick={() => setShowUpgradeCards(false)}
              style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13.5px', cursor: 'pointer', fontFamily: FONT, padding: '10px 0' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {cancelMsg && <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{cancelMsg}</p>}
    </>
  );
}

/* ── Get Help ────────────────────────────────────────────────── */

function GetHelpSection() {
  const { profile } = useAuth();
  const { plan } = useClientPlan();
  const [subject,  setSubject]  = useState('');
  const [category, setCategory] = useState('General Question');
  const [message,  setMessage]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [sendErr,  setSendErr]  = useState('');

  async function handleSend() {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setSendErr('');
    const body = [
      'Category: ' + category,
      'Subject: ' + subject,
      '',
      'Message:',
      message,
      '',
      'From: ' + (profile?.full_name || 'Unknown') + ' (' + (profile?.email || '') + ')',
      'Plan: ' + (plan || 'unknown'),
    ].join('\n');
    try {
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'team@quickquote360.com', subject: 'Help Request: ' + subject, body }),
      });
      if (res.ok) {
        setSent(true);
        setSubject(''); setCategory('General Question'); setMessage('');
      } else { setSendErr('Failed to send. Please try again.'); }
    } catch { setSendErr('Failed to send. Please try again.'); }
    setSending(false);
  }

  const planLabel = (plan || 'starter').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Get Help</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Send us a message and we will get back to you.</p>
      </div>
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Current plan</span>
            <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{planLabel}</p>
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Response time: typically within 24 hours.</span>
        </div>
        {sent ? (
          <p style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#166534', padding: '20px 0', fontFamily: FONT }}>Message sent! We will get back to you shortly.</p>
        ) : (
          <>
            <FieldRow label="Category">
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', color: '#0d1117', outline: 'none', fontFamily: FONT, backgroundColor: '#fff', cursor: 'pointer' }}>
                <option>General Question</option>
                <option>Technical Issue</option>
                <option>Billing Question</option>
                <option>Feature Request</option>
              </select>
            </FieldRow>
            <FieldRow label="Subject">
              <TextInput value={subject} onChange={setSubject} placeholder="Brief description of your question" />
            </FieldRow>
            <FieldRow label="Message">
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your question or issue in detail..."
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '12px 14px', fontSize: '13.5px', color: '#0d1117', fontFamily: FONT, resize: 'vertical', outline: 'none', backgroundColor: '#fff', minHeight: '120px' }} />
            </FieldRow>
            {sendErr && <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#dc2626', fontWeight: '600', fontFamily: FONT }}>{sendErr}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()}
                style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 24px', fontSize: '13.5px', fontWeight: '600', cursor: (sending || !subject.trim() || !message.trim()) ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: (sending || !subject.trim() || !message.trim()) ? 0.7 : 1 }}>
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ── Root ────────────────────────────────────────────────────── */

const NAV_ITEMS = ['Branding', 'Email Settings', 'Languages', 'Embed Code', 'Account', 'Subscription', 'Get Help', 'Danger Zone'];

export default function ClientSettingsPage() {
  const { profile } = useAuth();
  const clientId = profile?.client_id;

  const [activeSection, setActiveSection] = useState('Branding');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const saveRef = useRef(null);
  const [navDone, setNavDone] = useState({});
  const [cmdSToast, setCmdSToast] = useState(false);
  const [trialExpired,      setTrialExpired]      = useState(false);
  const [planEmailSent,     setPlanEmailSent]     = useState(false);
  const [installPreference, setInstallPreference] = useState(null);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('clients').select('plan, created_at, install_preference').eq('id', clientId).maybeSingle()
      .then(({ data }) => { setInstallPreference(data?.install_preference || null); if (data?.plan === 'free_trial' && (Date.now() - new Date(data.created_at).getTime()) / 86400000 > 14) setTrialExpired(true); });
  }, [clientId]);

  async function sendPlanEmail(planName) {
    await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'team@quickquote360.com', subject: `Plan Upgrade Request: ${planName}`, body: `${profile?.full_name || 'A client'} (${profile?.email || ''}) requested the ${planName} plan. Client ID: ${clientId}.` }) }).catch(() => {});
    setPlanEmailSent(true);
  }

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'embed') {
      setActiveSection('Embed Code');
    }
  }, []);

  useEffect(() => { setHasUnsaved(false); saveRef.current = null; }, [activeSection]);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('branding, email_settings, language_settings').eq('client_id', clientId).maybeSingle()
      .then(({ data: s }) => {
        setNavDone({
          'Branding':       !!(s?.branding?.company_name),
          'Email Settings': !!(s?.email_settings?.from_name),
          'Languages':      !!(s?.language_settings?.enabled && Object.values(s.language_settings.enabled).some(Boolean)),
          'Embed Code':     true,
          'Account':        !!(profile?.full_name),
          'Danger Zone':    false,
        });
      }).catch(() => {});
  }, [clientId, profile?.full_name]);

  useEffect(() => {
    const handler = e => { if (hasUnsaved) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveRef.current?.();
        setCmdSToast(true);
        setTimeout(() => setCmdSToast(false), 2000);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <ClientLayout title="Settings">
      <TrialExpiredOverlay trialExpired={trialExpired} planEmailSent={planEmailSent} sendPlanEmail={sendPlanEmail} clientId={clientId} installPreference={installPreference} />
      {cmdSToast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999, backgroundColor: '#0d1f12', color: '#fff', borderRadius: '10px', padding: '10px 18px', fontSize: '12px', fontWeight: '600', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontFamily: FONT }}>
          Saved with ⌘S
        </div>
      )}
      <ConfigStatusCard />
      <div style={{ fontFamily: FONT, display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Side nav */}
        <div style={{ width: '190px', flexShrink: 0, backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '10px', position: 'sticky', top: '80px' }}>
          <p style={{ margin: '0 0 8px', padding: '0 8px', fontSize: '10px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: FONT }}>Settings</p>
          {NAV_ITEMS.map(item => {
            const active = activeSection === item;
            return (
              <button key={item} type="button" onClick={() => setActiveSection(item)}
                style={{ width: '100%', textAlign: 'left', padding: active ? '9px 11px' : '9px 14px', marginBottom: '2px', fontSize: '13.5px', fontWeight: active ? '600' : '400', color: active ? PRIMARY : '#6b7280', backgroundColor: active ? '#f0fdf4' : 'transparent', border: 'none', borderLeft: active ? `3px solid ${PRIMARY}` : '3px solid transparent', borderRadius: active ? '0 8px 8px 0' : '8px', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{item}</span>
                {navDone[item] && <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: '700', marginLeft: '6px', flexShrink: 0 }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeSection === 'Branding'       && <BrandingSection  key={clientId} clientId={clientId} setHasUnsaved={setHasUnsaved} setSaveRef={fn => { saveRef.current = fn; }} />}
          {activeSection === 'Email Settings' && <EmailSection     key={clientId} clientId={clientId} setHasUnsaved={setHasUnsaved} setSaveRef={fn => { saveRef.current = fn; }} />}
          {activeSection === 'Languages'      && <LanguagesSection key={clientId} clientId={clientId} setHasUnsaved={setHasUnsaved} setSaveRef={fn => { saveRef.current = fn; }} />}
          {activeSection === 'Embed Code'     && <EmbedCodeSection clientId={clientId} />}
          {activeSection === 'Account'        && <AccountSection setHasUnsaved={setHasUnsaved} setSaveRef={fn => { saveRef.current = fn; }} />}
          {activeSection === 'Subscription'   && <SubscriptionSection />}
          {activeSection === 'Get Help'       && <GetHelpSection />}
          {activeSection === 'Danger Zone'    && <DangerZoneSection />}
        </div>
      </div>
    </ClientLayout>
  );
}
