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

/* ── 1. Branding ─────────────────────────────────────────────── */

function BrandingSection({ clientId, initialSettings }) {
  const b = initialSettings?.branding || {};
  const [companyName,    setCompanyName]    = useState(b.company_name    || '');
  const [primaryColor,   setPrimaryColor]   = useState(b.primary_color   || '#166534');
  const [colorHex,       setColorHex]       = useState(b.primary_color   || '#166534');
  const [logoUrl,        setLogoUrl]        = useState(b.logo_url        || '');
  const [companyPhone,   setCompanyPhone]   = useState(b.company_phone   || '');
  const [companyAddress, setCompanyAddress] = useState(b.company_address || '');
  const [saveMsg, flash] = useSaveMsg();

  async function handleSave() {
    await supabase.from('client_settings').upsert(
      { client_id: clientId, branding: { company_name: companyName, primary_color: primaryColor, logo_url: logoUrl, company_phone: companyPhone, company_address: companyAddress } },
      { onConflict: 'client_id' }
    );
    flash();
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
    </>
  );
}

/* ── 2. Email Settings ───────────────────────────────────────── */

function EmailSection({ clientId, initialSettings }) {
  const es = initialSettings?.email_settings || {};
  const [fromName,     setFromName]     = useState(es.from_name     || '');
  const [replyTo,      setReplyTo]      = useState(es.reply_to      || '');
  const [subject,      setSubject]      = useState(es.subject        || '');
  const [footerText,   setFooterText]   = useState(es.footer_text   || '');
  const [saveMsg, flash] = useSaveMsg();

  async function handleSave() {
    await supabase.from('client_settings').upsert(
      { client_id: clientId, email_settings: { from_name: fromName, reply_to: replyTo, subject, footer_text: footerText } },
      { onConflict: 'client_id' }
    );
    flash();
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

function LanguagesSection({ clientId, initialSettings }) {
  const ls = initialSettings?.language_settings || {};
  const [enabled, setEnabled] = useState(ls.enabled || { EN: true, SV: false, DE: false, FR: false });
  const [saveMsg, flash] = useSaveMsg();

  function handleToggle(code) {
    setEnabled(prev => {
      const next = { ...prev, [code]: !prev[code] };
      const anyOn = Object.values(next).some(Boolean);
      if (!anyOn) return prev;
      return next;
    });
  }

  async function handleSave() {
    await supabase.from('client_settings').upsert(
      { client_id: clientId, language_settings: { enabled } },
      { onConflict: 'client_id' }
    );
    flash();
  }

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
      </div>

      <SaveRow onClick={handleSave} msg={saveMsg} />
    </>
  );
}

/* ── 4. Embed Code ───────────────────────────────────────────── */

function EmbedCodeSection({ clientId }) {
  const [copied,       setCopied]       = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const scriptTag  = `<script src="https://estimator.quickquote360.com/embed.js" data-client-id="${clientId || 'CLIENT_ID_HERE'}"></script>`;
  const iframeTag  = `<iframe src="https://estimator.quickquote360.com?clientId=${clientId || 'CLIENT_ID_HERE'}" width="100%" height="700" frameborder="0"></iframe>`;

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

  if (!dataReady) return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px', fontFamily: FONT }}>Loading…</div>;

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

/* ── Root ────────────────────────────────────────────────────── */

const NAV_ITEMS = ['Branding', 'Email Settings', 'Languages', 'Embed Code', 'Account'];

export default function ClientSettingsPage() {
  const { profile } = useAuth();
  const clientId = profile?.client_id;

  const [activeSection, setActiveSection] = useState('Branding');
  const [settingsRow,   setSettingsRow]   = useState(null);
  const [dataReady,     setDataReady]     = useState(false);

  useEffect(() => {
    if (!clientId) return;
    supabase.from('client_settings').select('*').eq('client_id', clientId).maybeSingle()
      .then(({ data }) => { setSettingsRow(data); setDataReady(true); });
  }, [clientId]);

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
          {!dataReady ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px', fontFamily: FONT }}>Loading settings…</div>
          ) : (
            <>
              {activeSection === 'Branding'       && <BrandingSection  key={clientId} clientId={clientId} initialSettings={settingsRow} />}
              {activeSection === 'Email Settings' && <EmailSection     key={clientId} clientId={clientId} initialSettings={settingsRow} />}
              {activeSection === 'Languages'      && <LanguagesSection key={clientId} clientId={clientId} initialSettings={settingsRow} />}
              {activeSection === 'Embed Code'     && <EmbedCodeSection clientId={clientId} />}
              {activeSection === 'Account'        && <AccountSection />}
            </>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
