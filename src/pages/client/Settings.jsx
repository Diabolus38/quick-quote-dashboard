import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ClientLayout from '../../ClientLayout';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '24px', marginBottom: '16px' };

/* ── shared helpers ─────────────────────────────────────────── */

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

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: value ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s' }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: value ? '21px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
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

function getInitials(name) {
  if (!name) return 'CL';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ── 1. Branding ─────────────────────────────────────────────── */

function BrandingSection({ initialSettings }) {
  const { profile } = useAuth();
  const clientId = profile?.client_id;
  const b = initialSettings?.branding || {};

  const [primaryColor, setPrimaryColor] = useState(b.primary_color || '#166534');
  const [colorHex,     setColorHex]     = useState(b.primary_color || '#166534');
  const [launcherText, setLauncherText] = useState(b.launcher_text || 'Get an instant estimate');
  const [companyName,  setCompanyName]  = useState(b.company_name  || '');
  const [saveMsg, flash] = useSaveMsg();

  async function handleSave() {
    await supabase.from('client_settings')
      .update({ branding: { primary_color: primaryColor, launcher_text: launcherText, company_name: companyName } })
      .eq('client_id', clientId);
    flash();
  }

  return (
    <>
      <SectionHeader title="Branding" subtitle="Customize how your tool looks." />

      <SettingsCard title="Company Logo">
        <FieldRow label="Company Logo">
          <input type="file" accept="image/*" style={{ fontSize: '13px', color: '#374151', fontFamily: FONT }} />
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Recommended: PNG or SVG, max 2MB</p>
        </FieldRow>
      </SettingsCard>

      <SettingsCard title="Colors">
        <FieldRow label="Primary Color">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="color" value={primaryColor}
              onChange={e => { setPrimaryColor(e.target.value); setColorHex(e.target.value); }}
              style={{ width: '42px', height: '36px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
            <input type="text" value={colorHex}
              onChange={e => { setColorHex(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) setPrimaryColor(e.target.value); }}
              style={{ width: '120px', border: '1px solid #d1d5db', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'monospace', backgroundColor: '#fff' }} />
          </div>
        </FieldRow>
      </SettingsCard>

      <SettingsCard title="Tool Text">
        <FieldRow label="Launcher Button Text"><TextInput value={launcherText} onChange={setLauncherText} /></FieldRow>
        <FieldRow label="Company Name in Tool"><TextInput value={companyName}  onChange={setCompanyName}  /></FieldRow>
      </SettingsCard>

      <SaveButton onClick={handleSave} saveMsg={saveMsg} />
    </>
  );
}

/* ── 2. Email Settings ───────────────────────────────────────── */

function EmailSection({ initialSettings }) {
  const { profile } = useAuth();
  const clientId = profile?.client_id;
  const es = initialSettings?.email_settings || {};

  const [senderName,   setSenderName]   = useState(es.sender_name      || '');
  const [replyTo,      setReplyTo]      = useState(es.reply_to         || '');
  const [notifEmail,   setNotifEmail]   = useState(es.internal_email   || '');
  const [sendCustomer, setSendCustomer] = useState(es.send_customer    ?? true);
  const [custSubject,  setCustSubject]  = useState(es.customer_subject || 'Your estimate from {company}');
  const [custBody,     setCustBody]     = useState(es.customer_body    || '');
  const [sendInternal, setSendInternal] = useState(es.send_internal    ?? true);
  const [saveMsg, flash] = useSaveMsg();
  const [testEmailMsg, setTestEmailMsg] = useState('');

  async function handleTestEmail() {
    try {
      const res = await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifEmail || 'test@example.com', name: 'Test', pdfBase64: '' }),
      });
      setTestEmailMsg(res.ok ? 'Test email sent!' : 'Failed to send.');
    } catch {
      setTestEmailMsg('Failed to send.');
    }
    setTimeout(() => setTestEmailMsg(''), 3000);
  }

  async function handleSave() {
    await supabase.from('client_settings').update({
      email_settings: { sender_name: senderName, reply_to: replyTo, internal_email: notifEmail,
        customer_subject: custSubject, customer_body: custBody, send_customer: sendCustomer, send_internal: sendInternal },
    }).eq('client_id', clientId);
    flash();
  }

  return (
    <>
      <SectionHeader title="Email Settings" subtitle="Control how emails are sent to you and your customers." />
      <SettingsCard title="Sender Info">
        <FieldRow label="Sender Name">                  <TextInput value={senderName}  onChange={setSenderName}  /></FieldRow>
        <FieldRow label="Reply-to Email">               <TextInput value={replyTo}     onChange={setReplyTo}     /></FieldRow>
        <FieldRow label="Internal Notification Email">  <TextInput value={notifEmail}  onChange={setNotifEmail}  /></FieldRow>
      </SettingsCard>
      <SettingsCard title="Customer Email">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Toggle value={sendCustomer} onChange={setSendCustomer} />
          <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: FONT }}>Send customer email after estimate</span>
        </div>
        {sendCustomer && (
          <>
            <FieldRow label="Subject Line"><TextInput value={custSubject} onChange={setCustSubject} /></FieldRow>
            <FieldRow label="Body">
              <Textarea value={custBody} onChange={setCustBody} placeholder="Write your customer email body here..." />
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>Available variables: {'{name}'}, {'{price}'}, {'{municipality}'}</p>
            </FieldRow>
          </>
        )}
      </SettingsCard>
      <SettingsCard title="Internal Notification">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Toggle value={sendInternal} onChange={setSendInternal} />
          <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: FONT }}>Send internal notification on new lead</span>
        </div>
      </SettingsCard>
      <SettingsCard title="Test Email">
        <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: '#6b7280', fontFamily: FONT }}>Send a test email to verify your settings.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" onClick={handleTestEmail}
            style={{ border: `1px solid ${PRIMARY}`, color: PRIMARY, backgroundColor: '#fff', borderRadius: '10px', padding: '9px 20px', fontSize: '13.5px', cursor: 'pointer', fontFamily: FONT, fontWeight: '500' }}>
            Send Test Email
          </button>
          {testEmailMsg && <span style={{ fontSize: '13px', fontWeight: '600', color: testEmailMsg.includes('Failed') ? '#dc2626' : '#16a34a', fontFamily: FONT }}>{testEmailMsg}</span>}
        </div>
      </SettingsCard>
      <SaveButton onClick={handleSave} saveMsg={saveMsg} />
    </>
  );
}

/* ── 3. Languages ────────────────────────────────────────────── */

const LANGUAGES = ['English', 'Svenska', 'Deutsch', 'Français'];

function LanguagesSection({ initialSettings }) {
  const { profile } = useAuth();
  const clientId = profile?.client_id;
  const ls = initialSettings?.language_settings || {};

  const [toolLang,  setToolLang]  = useState(ls.tool_default_language || 'English');
  const [enabled,   setEnabled]   = useState(ls.enabled_languages     || { English: true, Svenska: true, Deutsch: false, Français: false });
  const [dashLang,  setDashLang]  = useState(ls.dashboard_language    || 'English');
  const [saveMsg, flash] = useSaveMsg();

  async function handleSave() {
    await supabase.from('client_settings').update({
      language_settings: { tool_default_language: toolLang, enabled_languages: enabled, dashboard_language: dashLang },
    }).eq('client_id', clientId);
    flash();
  }

  const selStyle = { width: '100%', height: '42px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px', fontSize: '13.5px', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer', outline: 'none' };

  return (
    <>
      <SectionHeader title="Language Settings" />
      <SettingsCard title="Tool Default Language">
        <FieldRow label="Default Language">
          <select value={toolLang} onChange={e => setToolLang(e.target.value)} style={selStyle}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FieldRow>
      </SettingsCard>
      <SettingsCard title="Available Languages">
        {LANGUAGES.map(lang => (
          <div key={lang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f4f6f4' }}>
            <span style={{ fontSize: '13.5px', color: '#374151', fontFamily: FONT }}>{lang}</span>
            <Toggle value={!!enabled[lang]} onChange={() => setEnabled(prev => ({ ...prev, [lang]: !prev[lang] }))} />
          </div>
        ))}
      </SettingsCard>
      <SettingsCard title="Dashboard Language">
        <FieldRow label="Language">
          <select value={dashLang} onChange={e => setDashLang(e.target.value)} style={selStyle}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FieldRow>
      </SettingsCard>
      <SaveButton onClick={handleSave} saveMsg={saveMsg} />
    </>
  );
}

/* ── 4. Embed Code ───────────────────────────────────────────── */

const INSTALL_GUIDES = [
  { title: 'WordPress + Elementor', content: '1. Edit your page in Elementor.\n2. Add an HTML widget.\n3. Paste the script tag above and save.' },
  { title: 'Plain HTML',            content: '1. Open your HTML file.\n2. Find the closing </body> tag.\n3. Paste the script tag just before </body>.' },
  { title: 'Shopify',               content: '1. Go to Online Store → Themes → Edit Code.\n2. Open theme.liquid.\n3. Paste the script tag before </body> and save.' },
  { title: 'Webflow',               content: '1. Go to Project Settings → Custom Code.\n2. Paste in Footer Code.\n3. Save and publish.' },
];

function EmbedCodeSection({ clientId }) {
  const [copied,   setCopied]   = useState(false);
  const [expanded, setExpanded] = useState({});
  const scriptTag = `<script src="https://estimator.quickquote360.com/embed.js?clientId=${clientId || 'CLIENT_ID_HERE'}"></script>`;

  function handleCopy() {
    navigator.clipboard.writeText(scriptTag).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <>
      <SectionHeader title="Embed Code" subtitle="Copy this code and paste it into your website." />
      <SettingsCard>
        <pre style={{ backgroundColor: '#0d1f12', color: '#a3e635', fontFamily: 'monospace', borderRadius: '12px', padding: '20px', fontSize: '13px', wordBreak: 'break-all', whiteSpace: 'pre-wrap', margin: 0 }}>
          {scriptTag}
        </pre>
        <div style={{ marginTop: '12px' }}>
          <button type="button" onClick={handleCopy}
            style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </SettingsCard>
      <SettingsCard>
        <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>How to install</p>
        {INSTALL_GUIDES.map(guide => (
          <div key={guide.title} style={{ borderBottom: '1px solid #f4f6f4' }}>
            <button type="button" onClick={() => setExpanded(prev => ({ ...prev, [guide.title]: !prev[guide.title] }))}
              style={{ width: '100%', textAlign: 'left', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT }}>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#374151' }}>{guide.title}</span>
              <span style={{ fontSize: '16px', color: '#9ca3af', display: 'inline-block', transform: expanded[guide.title] ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
            </button>
            {expanded[guide.title] && (
              <p style={{ margin: '0 0 12px', fontSize: '13.5px', color: '#6b7280', lineHeight: '1.7', whiteSpace: 'pre-line', fontFamily: FONT }}>{guide.content}</p>
            )}
          </div>
        ))}
      </SettingsCard>
    </>
  );
}

/* ── Root component ──────────────────────────────────────────── */

const NAV_ITEMS = ['Branding', 'Email Settings', 'Languages', 'Embed Code'];

export default function ClientSettingsPage() {
  const { profile } = useAuth();
  const clientId = profile?.client_id;

  const [activeSection, setActiveSection] = useState('Branding');
  const [settingsRow,   setSettingsRow]   = useState(null);
  const [dataReady,     setDataReady]     = useState(false);

  useEffect(() => {
    if (!clientId) return;
    async function load() {
      const { data: settings } = await supabase.from('client_settings').select('*').eq('client_id', clientId).maybeSingle();
      setSettingsRow(settings);
      setDataReady(true);
    }
    load();
  }, [clientId]);

  return (
    <ClientLayout title="Settings">
      <div style={{ fontFamily: FONT, display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Side nav */}
        <div style={{ width: '190px', flexShrink: 0, backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '10px', position: 'sticky', top: '80px' }}>
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
              {activeSection === 'Branding'       && <BrandingSection key={clientId} initialSettings={settingsRow} />}
              {activeSection === 'Email Settings' && <EmailSection    key={clientId} initialSettings={settingsRow} />}
              {activeSection === 'Languages'      && <LanguagesSection key={clientId} initialSettings={settingsRow} />}
              {activeSection === 'Embed Code'     && <EmbedCodeSection clientId={clientId} />}
            </>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
