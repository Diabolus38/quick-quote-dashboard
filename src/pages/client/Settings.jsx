import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';

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

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT }}>{label}</label>
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

function BrandingSection({ clientId }) {
  const [companyName,    setCompanyName]    = useState('');
  const [primaryColor,   setPrimaryColor]   = useState('#166534');
  const [colorHex,       setColorHex]       = useState('#166534');
  const [logoUrl,        setLogoUrl]        = useState('');
  const [companyPhone,   setCompanyPhone]   = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [saveMsg, flash] = useSaveMsg();
  const [previewTab, setPreviewTab] = useState('header');
  const [loading, setLoading] = useState(true);
  const [lastSavedBranding, setLastSavedBranding] = useState(() => localStorage.getItem('qq360_last_saved_branding') || '');

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('branding').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => {
        const b = data?.branding || {};
        setCompanyName(b.company_name    || '');
        setPrimaryColor(b.primary_color  || '#166534');
        setColorHex(b.primary_color      || '#166534');
        setLogoUrl(b.logo_url            || '');
        setCompanyPhone(b.company_phone  || '');
        setCompanyAddress(b.company_address || '');
        setLoading(false);
      });
  }, [clientId]);

  if (loading) return <SettingsSkeleton />;

  async function handleSave() {
    await supabase.from('client_settings').upsert(
      { client_id: clientId, branding: { company_name: companyName, primary_color: primaryColor, logo_url: logoUrl, company_phone: companyPhone, company_address: companyAddress } },
      { onConflict: 'client_id' }
    );
    flash();
    const ts = new Date().toISOString();
    localStorage.setItem('qq360_last_saved_branding', ts);
    setLastSavedBranding(ts);
  }

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Branding</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Customize how your estimator tool looks.</p>
      </div>

      <div style={CARD}>
        <FieldRow label="Company Name">
          <TextInput value={companyName} onChange={setCompanyName} placeholder="Your company name" />
        </FieldRow>

        <FieldRow label="Primary Color">
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

        <FieldRow label="Logo URL">
          <TextInput value={logoUrl} onChange={setLogoUrl} placeholder="https://example.com/logo.png" />
          {logoUrl && isValidUrl(logoUrl) && (
            <img src={logoUrl} alt="Logo preview"
              style={{ marginTop: '10px', maxHeight: '60px', maxWidth: '200px', borderRadius: '8px', border: '1px solid #e8ede8', objectFit: 'contain', display: 'block' }}
              onError={e => { e.target.style.display = 'none'; }} />
          )}
        </FieldRow>

        <FieldRow label="Company Phone">
          <TextInput value={companyPhone} onChange={setCompanyPhone} placeholder="+46 8 123 456 78" />
        </FieldRow>

        <FieldRow label="Company Address">
          <TextInput value={companyAddress} onChange={setCompanyAddress} placeholder="123 Main St, Stockholm" />
        </FieldRow>
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

function EmailSection({ clientId }) {
  const [fromName,     setFromName]     = useState('');
  const [replyTo,      setReplyTo]      = useState('');
  const [subject,      setSubject]      = useState('');
  const [footerText,   setFooterText]   = useState('');
  const [saveMsg, flash] = useSaveMsg();
  const [testMsg,      setTestMsg]      = useState('');
  const [testSending,  setTestSending]  = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [lastSavedEmail, setLastSavedEmail] = useState(() => localStorage.getItem('qq360_last_saved_email') || '');

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('email_settings').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => {
        const es = data?.email_settings || {};
        setFromName(es.from_name    || '');
        setReplyTo(es.reply_to      || '');
        setSubject(es.subject       || '');
        setFooterText(es.footer_text || '');
        setLoading(false);
      });
  }, [clientId]);

  if (loading) return <SettingsSkeleton />;

  async function handleSave() {
    await supabase.from('client_settings').upsert(
      { client_id: clientId, email_settings: { from_name: fromName, reply_to: replyTo, subject, footer_text: footerText } },
      { onConflict: 'client_id' }
    );
    flash();
    const ts = new Date().toISOString();
    localStorage.setItem('qq360_last_saved_email', ts);
    setLastSavedEmail(ts);
  }

  async function handleTestEmail() {
    if (!replyTo) return;
    setTestSending(true);
    try {
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: replyTo,
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
        <FieldRow label="Email Footer Text">
          <Textarea value={footerText} onChange={setFooterText} placeholder="Your company address, legal disclaimer, etc." rows={4} />
        </FieldRow>
      </div>

      <SaveRow onClick={handleSave} msg={saveMsg} />
      <LastSaved ts={lastSavedEmail} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
        <button type="button" onClick={handleTestEmail} disabled={testSending || !replyTo}
          style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: (testSending || !replyTo) ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: !replyTo ? 0.5 : 1 }}>
          {testSending ? 'Sending…' : 'Send Test Email'}
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

function LanguagesSection({ clientId }) {
  const [enabled,         setEnabled]         = useState({ EN: true, SV: false, DE: false, FR: false });
  const [defaultLanguage, setDefaultLanguage] = useState('EN');
  const [saveMsg, flash] = useSaveMsg();
  const [loading, setLoading] = useState(true);
  const [lastSavedLangs, setLastSavedLangs] = useState(() => localStorage.getItem('qq360_last_saved_languages') || '');

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('language_settings').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => {
        const ls = data?.language_settings || {};
        setEnabled(ls.enabled || { EN: true, SV: false, DE: false, FR: false });
        setDefaultLanguage(ls.default_language || 'EN');
        setLoading(false);
      });
  }, [clientId]);

  if (loading) return <SettingsSkeleton />;

  function handleToggle(code) {
    setEnabled(prev => {
      const next = { ...prev, [code]: !prev[code] };
      const anyOn = Object.values(next).some(Boolean);
      if (!anyOn) return prev;
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
    const ts = new Date().toISOString();
    localStorage.setItem('qq360_last_saved_languages', ts);
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
          {LANG_OPTIONS.map(({ code, label }, i) => (
            <div key={code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < LANG_OPTIONS.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{code}</span>
                <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px', fontFamily: FONT }}>{label}</span>
              </div>
              <Toggle value={!!enabled[code]} onChange={() => handleToggle(code)} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f4f6f4' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT }}>Default Language</label>
          <select value={defaultLanguage} onChange={e => setDefaultLanguage(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13.5px', color: '#0d1117', outline: 'none', fontFamily: FONT, backgroundColor: '#fff', cursor: 'pointer' }}>
            {enabledCodes.map(({ code, label }) => (
              <option key={code} value={code}>{code} — {label}</option>
            ))}
          </select>
        </div>
      </div>

      <SaveRow onClick={handleSave} msg={saveMsg} />
      <LastSaved ts={lastSavedLangs} />
    </>
  );
}

/* ── 4. Embed Code ───────────────────────────────────────────── */

function EmbedCodeSection({ clientId }) {
  const [copied,        setCopied]        = useState(false);
  const [copiedIframe,  setCopiedIframe]  = useState(false);
  const [copiedWP,      setCopiedWP]      = useState(false);
  const [copiedLink,    setCopiedLink]    = useState(false);
  const scriptTag    = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="${clientId || 'CLIENT_ID_HERE'}"></script>`;
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
          style={{ backgroundColor: copied ? '#ecfccb' : PRIMARY, color: copied ? '#3f6212' : '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', marginBottom: '24px' }}>
          {copied ? 'Copied!' : 'Copy Code'}
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
      </div>
    </>
  );
}

/* ── 5. Account ──────────────────────────────────────────────── */

function AccountSection() {
  const { profile } = useAuth();
  const [fullName,    setFullName]    = useState('');
  const [avatarUrl,   setAvatarUrl]   = useState('');
  const [saveMsg,     flash]          = useSaveMsg();
  const [pwMsg,       setPwMsg]       = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [dataReady,   setDataReady]   = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from('profiles').select('full_name, avatar_url').eq('id', profile.id).single()
      .then(({ data }) => {
        if (data) { setFullName(data.full_name || ''); setAvatarUrl(data.avatar_url || ''); }
        setDataReady(true);
      });
  }, [profile?.id]);

  async function handleSave() {
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
    flash();
  }

  async function handleResetPassword() {
    await supabase.auth.resetPasswordForEmail(profile.email);
    setPwMsg('Reset email sent!');
    setTimeout(() => setPwMsg(''), 3000);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setUploading(true);
    const ext  = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = urlData.publicUrl;
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
      setAvatarUrl(url);
    }
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
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>JPG, PNG or GIF. Max 5 MB.</p>
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

/* ── Root ────────────────────────────────────────────────────── */

const NAV_ITEMS = ['Branding', 'Email Settings', 'Languages', 'Embed Code', 'Account', 'Danger Zone'];

export default function ClientSettingsPage() {
  const { profile } = useAuth();
  const clientId = profile?.client_id;

  const [activeSection, setActiveSection] = useState('Branding');

  return (
    <ClientLayout title="Settings">
      <div style={{ fontFamily: FONT, display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Side nav */}
        <div style={{ width: '190px', flexShrink: 0, backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '10px', position: 'sticky', top: '80px' }}>
          <p style={{ margin: '0 0 8px', padding: '0 8px', fontSize: '10px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: FONT }}>Settings</p>
          {NAV_ITEMS.map(item => {
            const active = activeSection === item;
            return (
              <button key={item} type="button" onClick={() => setActiveSection(item)}
                style={{ width: '100%', textAlign: 'left', padding: active ? '9px 11px' : '9px 14px', marginBottom: '2px', fontSize: '13.5px', fontWeight: active ? '600' : '400', color: active ? PRIMARY : '#6b7280', backgroundColor: active ? '#f0fdf4' : 'transparent', border: 'none', borderLeft: active ? `3px solid ${PRIMARY}` : '3px solid transparent', borderRadius: active ? '0 8px 8px 0' : '8px', cursor: 'pointer', fontFamily: FONT, transition: 'all 0.12s' }}>
                {item}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeSection === 'Branding'       && <BrandingSection  key={clientId} clientId={clientId} />}
          {activeSection === 'Email Settings' && <EmailSection     key={clientId} clientId={clientId} />}
          {activeSection === 'Languages'      && <LanguagesSection key={clientId} clientId={clientId} />}
          {activeSection === 'Embed Code'     && <EmbedCodeSection clientId={clientId} />}
          {activeSection === 'Account'        && <AccountSection />}
          {activeSection === 'Danger Zone'    && <DangerZoneSection />}
        </div>
      </div>
    </ClientLayout>
  );
}
