import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ClientLayout from '../../ClientLayout';

/* ── shared helpers ─────────────────────────────────────────── */

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117' }}>{title}</h1>
      {subtitle && <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>{subtitle}</p>}
    </div>
  );
}

function SettingsCard({ title, children, style = {} }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '14px', padding: '20px', marginBottom: '16px', ...style }}>
      {title && <p style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>{title}</p>}
      {children}
    </div>
  );
}

function SaveButton({ onClick }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
      <button type="button" onClick={onClick} style={{ backgroundColor: '#0d3d2a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
        Save
      </button>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: value ? '#0d3d2a' : '#e5e7eb', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background-color 0.2s' }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: value ? '23px' : '3px', transition: 'left 0.2s' }} />
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder = '' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'inherit' }}
    />
  );
}

function Textarea({ value, onChange, placeholder = '', rows = 5 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ width: '100%', boxSizing: 'border-box', minHeight: '100px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#0d1117', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
    />
  );
}

function PriceInput({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: '80px', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px', fontSize: '13px', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
    />
  );
}

/* ── 1. Branding ─────────────────────────────────────────────── */

function BrandingSection({ profile }) {
  const [primaryColor, setPrimaryColor] = useState('#0d3d2a');
  const [colorHex,     setColorHex]     = useState('#0d3d2a');
  const [launcherText, setLauncherText] = useState('Get an instant estimate');
  const [companyName,  setCompanyName]  = useState(profile?.full_name || '');

  return (
    <>
      <SectionHeader title="Branding" subtitle="Customize how your tool looks." />

      <SettingsCard title="Company Logo">
        <FieldRow label="Company Logo">
          <input type="file" accept="image/*" style={{ fontSize: '13px', color: '#374151' }} />
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' }}>Recommended: PNG or SVG, max 2MB</p>
        </FieldRow>
      </SettingsCard>

      <SettingsCard title="Colors">
        <FieldRow label="Primary Color">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="color"
              value={primaryColor}
              onChange={e => { setPrimaryColor(e.target.value); setColorHex(e.target.value); }}
              style={{ width: '42px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
            />
            <input
              type="text"
              value={colorHex}
              onChange={e => { setColorHex(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) setPrimaryColor(e.target.value); }}
              style={{ width: '120px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'monospace' }}
            />
          </div>
        </FieldRow>
      </SettingsCard>

      <SettingsCard title="Tool Text">
        <FieldRow label="Launcher Button Text">
          <TextInput value={launcherText} onChange={setLauncherText} />
        </FieldRow>
        <FieldRow label="Company Name in Tool">
          <TextInput value={companyName} onChange={setCompanyName} />
        </FieldRow>
      </SettingsCard>

      <SaveButton />
    </>
  );
}

/* ── 2. Pricing ──────────────────────────────────────────────── */

function PricingSection() {
  const systemRows = ['BDT', 'WC only', 'WC+BDT'];
  const households = [1, 2, 3, 4, 5];

  const [baseGrid, setBaseGrid] = useState(
    systemRows.map(() => households.map(() => ''))
  );

  const [fixedCosts, setFixedCosts] = useState([
    { label: 'Planning/Municipality Application', value: '' },
    { label: 'Establishment Zone 1',              value: '' },
    { label: 'Establishment Zone 2',              value: '' },
    { label: 'De-establishment',                  value: '' },
    { label: 'Admin Fee',                         value: '' },
    { label: 'Inspection of Existing Well',       value: '' },
  ]);

  const [perMeter, setPerMeter] = useState([
    { label: 'Gravity Pipe per meter',  value: '' },
    { label: 'Pressure Pipe per meter', value: '' },
    { label: 'Protection Pipe per meter', value: '' },
    { label: 'Electric Cable per meter', value: '' },
    { label: 'Makadam per ton',         value: '' },
    { label: 'Labor Rate per hour',     value: '' },
  ]);

  const [addOns, setAddOns] = useState([
    { label: 'Pump Well',              value: '' },
    { label: 'Double Pump',            value: '' },
    { label: 'Telescope + Well Cover', value: '' },
    { label: 'Lawn Restoration Base',  value: '' },
    { label: 'Mass Removal',           value: '' },
    { label: 'Transport',              value: '' },
  ]);

  const [rotEnabled, setRotEnabled] = useState(false);
  const [rotPercent,  setRotPercent]  = useState('30');
  const [currency,    setCurrency]    = useState('SEK');

  function updateGrid(ri, ci, val) {
    setBaseGrid(prev => prev.map((row, r) => row.map((cell, c) => (r === ri && c === ci) ? val : cell)));
  }
  function updateList(setter, i, val) {
    setter(prev => prev.map((item, idx) => idx === i ? { ...item, value: val } : item));
  }

  function LabeledPriceRow({ items, setter }) {
    return items.map((item, i) => (
      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f7f7f7' }}>
        <span style={{ fontSize: '13px', color: '#374151' }}>{item.label}</span>
        <PriceInput value={item.value} onChange={val => updateList(setter, i, val)} />
      </div>
    ));
  }

  return (
    <>
      <SectionHeader title="Pricing" subtitle="Set your pricing for the estimator tool." />

      <SettingsCard title="Base System Prices">
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 80px)', gap: '8px', alignItems: 'center' }}>
            <div />
            {households.map(h => (
              <div key={h} style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', textAlign: 'center' }}>{h} hh</div>
            ))}
            {systemRows.map((row, ri) => (
              <>
                <div key={row} style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{row}</div>
                {households.map((_, ci) => (
                  <PriceInput key={ci} value={baseGrid[ri][ci]} onChange={val => updateGrid(ri, ci, val)} />
                ))}
              </>
            ))}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Fixed Costs">
        <LabeledPriceRow items={fixedCosts} setter={setFixedCosts} />
      </SettingsCard>

      <SettingsCard title="Per Meter Costs">
        <LabeledPriceRow items={perMeter} setter={setPerMeter} />
      </SettingsCard>

      <SettingsCard title="Add-on Services">
        <LabeledPriceRow items={addOns} setter={setAddOns} />
      </SettingsCard>

      <SettingsCard title="ROT Deduction">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: rotEnabled ? '14px' : 0 }}>
          <Toggle value={rotEnabled} onChange={setRotEnabled} />
          <span style={{ fontSize: '13px', color: '#374151' }}>ROT Deduction {rotEnabled ? 'enabled' : 'disabled'}</span>
        </div>
        {rotEnabled && (
          <FieldRow label="Deduction Percentage">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PriceInput value={rotPercent} onChange={setRotPercent} />
              <span style={{ fontSize: '13px', color: '#6b7280' }}>%</span>
            </div>
          </FieldRow>
        )}
      </SettingsCard>

      <SettingsCard title="Currency">
        <FieldRow label="Currency">
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'inherit', backgroundColor: '#fff' }}>
            {['SEK', 'EUR', 'GBP', 'NOK', 'DKK'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FieldRow>
      </SettingsCard>

      <SaveButton />
    </>
  );
}

/* ── 3. PDF Content ──────────────────────────────────────────── */

function PDFSection() {
  const [intro,       setIntro]       = useState('');
  const [systemDesc,  setSystemDesc]  = useState('');
  const [serviceAg,   setServiceAg]   = useState('');
  const [payTerms,    setPayTerms]    = useState('');
  const [legal,       setLegal]       = useState('');
  const [sigName,     setSigName]     = useState('');
  const [sigTitle,    setSigTitle]    = useState('');
  const [sigPhone,    setSigPhone]    = useState('');
  const [sigEmail,    setSigEmail]    = useState('');

  return (
    <>
      <SectionHeader title="PDF Content" subtitle="Edit the text sections of your generated PDF." />

      {[
        { label: 'Introduction Text',  value: intro,      onChange: setIntro      },
        { label: 'System Description', value: systemDesc, onChange: setSystemDesc },
        { label: 'Service Agreement',  value: serviceAg,  onChange: setServiceAg  },
        { label: 'Payment Terms',      value: payTerms,   onChange: setPayTerms   },
        { label: 'Legal Reservations', value: legal,      onChange: setLegal      },
      ].map(s => (
        <SettingsCard key={s.label} title={s.label}>
          <Textarea value={s.value} onChange={s.onChange} />
        </SettingsCard>
      ))}

      <SettingsCard title="Signature Block">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FieldRow label="Name">    <TextInput value={sigName}  onChange={setSigName}  /> </FieldRow>
          <FieldRow label="Title">   <TextInput value={sigTitle} onChange={setSigTitle} /> </FieldRow>
          <FieldRow label="Phone">   <TextInput value={sigPhone} onChange={setSigPhone} /> </FieldRow>
          <FieldRow label="Email">   <TextInput value={sigEmail} onChange={setSigEmail} /> </FieldRow>
        </div>
      </SettingsCard>

      <SaveButton />
    </>
  );
}

/* ── 4. Email Settings ───────────────────────────────────────── */

function EmailSection() {
  const [senderName,     setSenderName]     = useState('');
  const [replyTo,        setReplyTo]        = useState('');
  const [notifEmail,     setNotifEmail]     = useState('');
  const [sendCustomer,   setSendCustomer]   = useState(true);
  const [custSubject,    setCustSubject]    = useState('Your estimate from {company}');
  const [custBody,       setCustBody]       = useState('');
  const [sendInternal,   setSendInternal]   = useState(true);

  return (
    <>
      <SectionHeader title="Email Settings" subtitle="Control how emails are sent to you and your customers." />

      <SettingsCard title="Sender Info">
        <FieldRow label="Sender Name"><TextInput value={senderName}   onChange={setSenderName}   /></FieldRow>
        <FieldRow label="Reply-to Email"><TextInput value={replyTo}   onChange={setReplyTo}       /></FieldRow>
        <FieldRow label="Internal Notification Email"><TextInput value={notifEmail} onChange={setNotifEmail} /></FieldRow>
      </SettingsCard>

      <SettingsCard title="Customer Email">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Toggle value={sendCustomer} onChange={setSendCustomer} />
          <span style={{ fontSize: '13px', color: '#374151' }}>Send customer email after estimate</span>
        </div>
        {sendCustomer && (
          <>
            <FieldRow label="Subject Line"><TextInput value={custSubject} onChange={setCustSubject} /></FieldRow>
            <FieldRow label="Body">
              <Textarea value={custBody} onChange={setCustBody} placeholder="Write your customer email body here..." />
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                Available variables: {'{name}'}, {'{price}'}, {'{municipality}'}
              </p>
            </FieldRow>
          </>
        )}
      </SettingsCard>

      <SettingsCard title="Internal Notification">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Toggle value={sendInternal} onChange={setSendInternal} />
          <span style={{ fontSize: '13px', color: '#374151' }}>Send internal notification on new lead</span>
        </div>
      </SettingsCard>

      <SettingsCard title="Test Email">
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#6b7280' }}>Send a test email to verify your settings.</p>
        <button type="button" style={{ border: '1px solid #0d3d2a', color: '#0d3d2a', backgroundColor: '#fff', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Send Test Email
        </button>
      </SettingsCard>

      <SaveButton />
    </>
  );
}

/* ── 5. Municipalities ───────────────────────────────────────── */

const ALL_MUNICIPALITIES = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'];

function MunicipalitiesSection() {
  const [search,        setSearch]        = useState('');
  const [covered,       setCovered]       = useState([]);
  const [notCoveredMsg, setNotCoveredMsg] = useState('We currently do not cover your municipality.');

  const filtered = ALL_MUNICIPALITIES.filter(m =>
    m.toLowerCase().includes(search.toLowerCase()) &&
    !covered.find(c => c.name === m)
  );
  const showDropdown = search.length > 0 && filtered.length > 0;

  function addMunicipality(name) {
    setCovered(prev => [...prev, { name, zone: '1' }]);
    setSearch('');
  }

  function setZone(name, zone) {
    setCovered(prev => prev.map(c => c.name === name ? { ...c, zone } : c));
  }

  function remove(name) {
    setCovered(prev => prev.filter(c => c.name !== name));
  }

  return (
    <>
      <SectionHeader title="Municipalities" subtitle="Select which Swedish municipalities you cover." />

      <SettingsCard>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search municipality..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', height: '42px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0 16px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
          />
          {showDropdown && (
            <div style={{ position: 'absolute', top: '46px', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 10, overflow: 'hidden' }}>
              {filtered.map(m => (
                <div
                  key={m}
                  onClick={() => addMunicipality(m)}
                  style={{ padding: '10px 16px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          {covered.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No municipalities added yet. Search above to add.</p>
          ) : (
            covered.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f7f7f7' }}>
                <span style={{ flex: 1, fontSize: '13px', color: '#0d1117', fontWeight: '500' }}>{c.name}</span>
                {['1', '2'].map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZone(c.name, z)}
                    style={{
                      padding: '4px 12px', fontSize: '12px', fontWeight: '600',
                      borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
                      border: c.zone === z ? 'none' : '1px solid #e5e7eb',
                      backgroundColor: c.zone === z ? (z === '1' ? '#0d3d2a' : '#1d4ed8') : '#fff',
                      color: c.zone === z ? '#fff' : '#6b7280',
                    }}
                  >
                    Zone {z}
                  </button>
                ))}
                <button type="button" onClick={() => remove(c.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#dc2626', lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', fontWeight: '500', marginBottom: '6px' }}>
            Message shown when municipality is not covered
          </label>
          <TextInput value={notCoveredMsg} onChange={setNotCoveredMsg} />
        </div>
      </SettingsCard>
    </>
  );
}

/* ── 6. Languages ────────────────────────────────────────────── */

const LANGUAGES = ['English', 'Svenska', 'Deutsch', 'Français'];

function LanguagesSection() {
  const [toolLang,       setToolLang]       = useState('English');
  const [enabled,        setEnabled]        = useState({ English: true, Svenska: true, Deutsch: false, Français: false });
  const [dashLang,       setDashLang]       = useState('English');

  function toggleLang(lang) {
    setEnabled(prev => ({ ...prev, [lang]: !prev[lang] }));
  }

  const selectStyle = { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: '#0d1117', outline: 'none', fontFamily: 'inherit', backgroundColor: '#fff' };

  return (
    <>
      <SectionHeader title="Language Settings" />

      <SettingsCard title="Tool Default Language">
        <FieldRow label="Default Language">
          <select value={toolLang} onChange={e => setToolLang(e.target.value)} style={selectStyle}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FieldRow>
      </SettingsCard>

      <SettingsCard title="Available Languages">
        {LANGUAGES.map(lang => (
          <div key={lang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f7f7f7' }}>
            <span style={{ fontSize: '13px', color: '#374151' }}>{lang}</span>
            <Toggle value={!!enabled[lang]} onChange={() => toggleLang(lang)} />
          </div>
        ))}
      </SettingsCard>

      <SettingsCard title="Dashboard Language">
        <FieldRow label="Language">
          <select value={dashLang} onChange={e => setDashLang(e.target.value)} style={selectStyle}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </FieldRow>
      </SettingsCard>

      <SaveButton />
    </>
  );
}

/* ── 7. Embed Code ───────────────────────────────────────────── */

const INSTALL_GUIDES = [
  {
    title: 'WordPress + Elementor',
    content: '1. Edit your page in Elementor.\n2. Add an HTML widget to the page.\n3. Paste the script tag above into the widget and save.',
  },
  {
    title: 'Plain HTML',
    content: '1. Open your HTML file in a text editor.\n2. Locate the closing </body> tag.\n3. Paste the script tag just before </body> and publish.',
  },
  {
    title: 'Shopify',
    content: '1. Go to Online Store → Themes → Edit Code.\n2. Open theme.liquid.\n3. Paste the script tag before </body> and save.',
  },
  {
    title: 'Webflow',
    content: '1. Go to Project Settings → Custom Code.\n2. Paste the script tag in the Footer Code section.\n3. Save and publish your site.',
  },
];

function EmbedCodeSection({ clientId }) {
  const [copied,   setCopied]   = useState(false);
  const [expanded, setExpanded] = useState({});

  const scriptTag = `<script src="https://estimator.quickquote360.com/embed.js?clientId=${clientId || 'CLIENT_ID_HERE'}"></script>`;

  function handleCopy() {
    navigator.clipboard.writeText(scriptTag).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleExpand(title) {
    setExpanded(prev => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <>
      <SectionHeader title="Embed Code" subtitle="Copy this code and paste it into your website." />

      <SettingsCard>
        <pre style={{ backgroundColor: '#1a1f2e', color: '#67e8f9', fontFamily: 'monospace', borderRadius: '12px', padding: '20px', fontSize: '13px', wordBreak: 'break-all', whiteSpace: 'pre-wrap', margin: 0 }}>
          {scriptTag}
        </pre>
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{ backgroundColor: '#0d3d2a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </SettingsCard>

      <SettingsCard>
        <p style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>How to install</p>
        {INSTALL_GUIDES.map(guide => (
          <div key={guide.title} style={{ borderBottom: '1px solid #f7f7f7' }}>
            <button
              type="button"
              onClick={() => toggleExpand(guide.title)}
              style={{ width: '100%', textAlign: 'left', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit' }}
            >
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{guide.title}</span>
              <span style={{ fontSize: '16px', color: '#9ca3af', transform: expanded[guide.title] ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>▾</span>
            </button>
            {expanded[guide.title] && (
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                {guide.content}
              </p>
            )}
          </div>
        ))}
      </SettingsCard>
    </>
  );
}

/* ── Root component ──────────────────────────────────────────── */

const NAV_ITEMS = ['Branding', 'Pricing', 'PDF Content', 'Email Settings', 'Municipalities', 'Languages', 'Embed Code'];

export default function ClientSettingsPage() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('Branding');

  return (
    <ClientLayout title="Settings">
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Left nav */}
        <div style={{ width: '180px', flexShrink: 0, backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '14px', padding: '8px', position: 'sticky', top: '80px' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveSection(item)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '9px 12px', marginBottom: '2px',
                fontSize: '13px',
                fontWeight: activeSection === item ? '600' : '400',
                color: activeSection === item ? '#0d3d2a' : '#6b7280',
                backgroundColor: activeSection === item ? '#f0fdf4' : 'transparent',
                border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeSection === 'Branding'       && <BrandingSection profile={profile} />}
          {activeSection === 'Pricing'        && <PricingSection />}
          {activeSection === 'PDF Content'    && <PDFSection />}
          {activeSection === 'Email Settings' && <EmailSection />}
          {activeSection === 'Municipalities' && <MunicipalitiesSection />}
          {activeSection === 'Languages'      && <LanguagesSection />}
          {activeSection === 'Embed Code'     && <EmbedCodeSection clientId={profile?.client_id} />}
        </div>

      </div>
    </ClientLayout>
  );
}
