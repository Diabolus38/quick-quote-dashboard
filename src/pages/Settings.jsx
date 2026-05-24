import { useState } from 'react';
import Layout from '../Layout';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const NAV_ITEMS = ['General', 'Profile', 'Pricing Defaults', 'Notifications', 'Integrations', 'Security', 'Danger Zone'];

const CARD = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e8ede8', boxShadow: '0 2px 12px rgba(13,31,18,0.06)', padding: '24px' };

export default function Settings() {
  const [activeNav, setActiveNav] = useState('General');

  return (
    <Layout title="Settings">
      <div style={{ margin: '-32px', height: 'calc(100% + 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
        <TopBar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <LeftPanel activeNav={activeNav} onNavChange={setActiveNav} />
          <RightPanel />
        </div>
      </div>
    </Layout>
  );
}

function TopBar() {
  return (
    <div style={{ height: '56px', flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e8ede8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: '16px', fontFamily: FONT }}>
      <span style={{ fontSize: '15px', color: '#9ca3af' }}>⚙</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '14px', color: '#d97706' }}>ⓘ</span>
        <span style={{ fontSize: '13px', color: '#d97706', fontWeight: '500' }}>Unsaved changes</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" style={{ border: '1px solid #e8ede8', backgroundColor: '#fff', color: '#374151', borderRadius: '10px', padding: '7px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>Discard</button>
        <button type="button" style={{ border: 'none', backgroundColor: PRIMARY, color: '#fff', borderRadius: '10px', padding: '7px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>Save</button>
      </div>
    </div>
  );
}

function LeftPanel({ activeNav, onNavChange }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid #e8ede8', padding: '20px 0', backgroundColor: '#fff', overflowY: 'auto', fontFamily: FONT }}>
      <p style={{ margin: '0 0 10px', padding: '0 20px', fontSize: '10px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Settings</p>
      {NAV_ITEMS.map(item => {
        const active = activeNav === item;
        const isHov  = hovered === item;
        return (
          <div key={item} role="button" tabIndex={0}
            onClick={() => onNavChange(item)}
            onMouseEnter={() => setHovered(item)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: active ? '10px 17px' : '10px 20px',
              fontSize: '13.5px', cursor: 'pointer',
              borderLeft: active ? `3px solid ${PRIMARY}` : '3px solid transparent',
              color: active ? PRIMARY : isHov ? '#0d1117' : '#6b7280',
              fontWeight: active ? '600' : '400',
              backgroundColor: active ? '#f0fdf4' : isHov ? '#f9fbf9' : 'transparent',
              userSelect: 'none', transition: 'all 0.12s', fontFamily: FONT,
            }}>
            {item}
          </div>
        );
      })}
    </div>
  );
}

function RightPanel() {
  const [toggles, setToggles] = useState({ estimates: true, invoice: false, client: true });
  const flip = key => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ flex: 1, padding: '32px', backgroundColor: '#f4f6f4', overflowY: 'auto', fontFamily: FONT }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117' }}>General</h2>
      <p style={{ margin: '0 0 28px', fontSize: '13.5px', color: '#9ca3af' }}>Manage your account settings and preferences.</p>

      {/* Account details */}
      <SubSection title="Account details" subtitle="Your basic account information." />
      <AccountCard />

      {/* Pricing defaults */}
      <div style={{ marginTop: '28px' }}>
        <SubSection title="Pricing Defaults" subtitle="Set default pricing for new clients." />
        <DefaultsForm />
      </div>

      {/* Notifications */}
      <div style={{ marginTop: '28px' }}>
        <SubSection title="Notifications" subtitle="Control when and how you receive alerts." />
        <NotificationsCard toggles={toggles} onFlip={flip} />
      </div>

      <DangerZone />
    </div>
  );
}

function SubSection({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>{title}</p>
      <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{subtitle}</p>
    </div>
  );
}

function AccountCard() {
  const rows = [
    { icon: '◉', title: 'Admin User',      sub: 'admin@quickquote360.com · Super Admin' },
    { icon: '◎', title: 'Company Address', sub: 'Stockholm, Sweden'                     },
  ];
  return (
    <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px', borderBottom: i < rows.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#f4f6f4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#6b7280' }}>{row.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>{row.title}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{row.sub}</p>
          </div>
          <span style={{ fontSize: '16px', color: '#9ca3af', cursor: 'pointer' }}>✎</span>
        </div>
      ))}
    </div>
  );
}

function DefaultsForm() {
  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormSelect label="Fixed Monthly Fee *">
          <option>990 kr</option><option>1,490 kr</option><option>1,990 kr</option>
        </FormSelect>
        <FormSelect label="Fee Per Estimate *">
          <option>12 kr</option><option>15 kr</option><option>20 kr</option>
        </FormSelect>
      </div>
      <FormSelect label="Default Currency *">
        <option>Swedish Krona (SEK kr)</option><option>Euro (EUR €)</option><option>US Dollar (USD $)</option>
      </FormSelect>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Prefix</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '10px', height: '42px', overflow: 'hidden', backgroundColor: '#fff' }}>
            <span style={{ padding: '0 12px', fontSize: '13px', color: '#9ca3af', backgroundColor: '#f9fbf9', height: '100%', display: 'flex', alignItems: 'center', borderRight: '1px solid #d1d5db', flexShrink: 0 }}>#</span>
            <input type="text" style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: '13.5px', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117' }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Suffix</label>
          <input type="text" style={{ width: '100%', height: '42px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px', fontSize: '13.5px', fontFamily: FONT, outline: 'none', backgroundColor: '#fff', color: '#0d1117' }} />
        </div>
      </div>
    </div>
  );
}

function FormSelect({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select style={{ width: '100%', height: '42px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px', fontSize: '13.5px', fontFamily: FONT, backgroundColor: '#fff', color: '#0d1117', cursor: 'pointer', outline: 'none' }}>
        {children}
      </select>
    </div>
  );
}

function NotificationsCard({ toggles, onFlip }) {
  const rows = [
    { key: 'estimates', label: 'New estimate submitted', desc: 'Get notified when a client generates a new estimate' },
    { key: 'invoice',   label: 'Invoice overdue',        desc: 'Alert when a client invoice becomes overdue' },
    { key: 'client',    label: 'New client added',       desc: 'Notification when a new client is created' },
  ];
  return (
    <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
      {rows.map((row, i) => (
        <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 22px', borderBottom: i < rows.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: '600', color: '#0d1117' }}>{row.label}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{row.desc}</p>
          </div>
          <Toggle active={toggles[row.key]} onToggle={() => onFlip(row.key)} />
        </div>
      ))}
    </div>
  );
}

function Toggle({ active, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width: '40px', height: '22px', borderRadius: '11px', flexShrink: 0, backgroundColor: active ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
      <div style={{ position: 'absolute', top: '3px', left: active ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
    </div>
  );
}

function DangerZone() {
  return (
    <div style={{ marginTop: '28px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>Danger Zone</p>
      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#9ca3af' }}>These actions are irreversible.</p>
      <div style={{ ...CARD, border: '1px solid #fee2e2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: '600', color: '#0d1117' }}>Reset All Data</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Permanently delete all clients, estimates, and invoices.</p>
          </div>
          <button type="button" style={{ border: '1px solid #dc2626', color: '#dc2626', backgroundColor: '#fff', borderRadius: '10px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0 }}>Reset</button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' };
