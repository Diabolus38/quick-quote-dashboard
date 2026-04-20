import { useState } from 'react';
import Layout from '../Layout';

const ACCENT = '#0d3d2a';

const navItems = [
  'General',
  'Profile',
  'Pricing Defaults',
  'Notifications',
  'Integrations',
  'Security',
  'Danger Zone',
];

export default function Settings() {
  const [activeNav, setActiveNav] = useState('General');

  return (
    <Layout title="Settings">
      {/* Escape Layout's 32px padding to fill the full content area */}
      <div style={{
        margin: '-32px',
        height: 'calc(100% + 64px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <TopBar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <LeftPanel activeNav={activeNav} onNavChange={setActiveNav} />
          <RightPanel />
        </div>
      </div>
    </Layout>
  );
}

/* ── Top bar ── */

function TopBar() {
  return (
    <div style={{
      height: '52px', flexShrink: 0,
      backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', gap: '16px',
    }}>
      {/* Left: breadcrumb icon */}
      <span style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1 }}>⚙</span>

      {/* Center: unsaved changes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '14px', color: '#d97706', lineHeight: 1 }}>ⓘ</span>
        <span style={{ fontSize: '13px', color: '#d97706' }}>Unsaved changes</span>
      </div>

      {/* Right: Discard + Save */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="button" style={{
          border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#374151',
          borderRadius: '8px', padding: '7px 16px', fontSize: '13px',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Discard
        </button>
        <button type="button" style={{
          border: 'none', backgroundColor: ACCENT, color: '#fff',
          borderRadius: '8px', padding: '7px 16px', fontSize: '13px', fontWeight: '600',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Save
        </button>
      </div>
    </div>
  );
}

/* ── Left nav panel ── */

function LeftPanel({ activeNav, onNavChange }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      width: '220px', flexShrink: 0,
      borderRight: '1px solid #f0f0f0', padding: '20px 0',
      backgroundColor: '#fff', overflowY: 'auto',
    }}>
      <p style={{
        margin: '0 0 8px', padding: '0 20px',
        fontSize: '10px', fontWeight: '600', color: '#9ca3af',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        Settings
      </p>

      {navItems.map((item) => {
        const active  = activeNav === item;
        const isHov   = hovered === item;
        return (
          <div
            key={item}
            role="button"
            tabIndex={0}
            onClick={() => onNavChange(item)}
            onMouseEnter={() => setHovered(item)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '9px 20px', fontSize: '13.5px', cursor: 'pointer',
              borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
              color: active ? ACCENT : '#6b7280',
              fontWeight: active ? '600' : '400',
              backgroundColor: active ? '#f0fdf4' : isHov ? '#f9fafb' : 'transparent',
              userSelect: 'none',
              transition: 'background-color 0.12s, color 0.12s',
            }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
}

/* ── Right content panel ── */

function RightPanel() {
  const [toggles, setToggles] = useState({
    estimates: true,
    invoice:   false,
    client:    true,
  });

  const flip = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{
      flex: 1, padding: '32px', backgroundColor: '#fafafa', overflowY: 'auto',
    }}>
      {/* Section title */}
      <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '700', color: '#0d1117', letterSpacing: '-0.3px' }}>
        General
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: '13px', color: '#9ca3af' }}>
        Manage your account settings and preferences.
      </p>

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

      {/* Danger zone */}
      <DangerZone />
    </div>
  );
}

/* ── Sub-section header ── */

function SubSection({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#0d1117' }}>{title}</p>
      <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{subtitle}</p>
    </div>
  );
}

/* ── Account details card ── */

function AccountCard() {
  const rows = [
    { icon: '◉', title: 'Admin User',       sub: 'admin@quickquote360.com · Super Admin' },
    { icon: '◎', title: 'Company Address',  sub: 'Stockholm, Sweden' },
  ];

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 20px',
          borderBottom: i < rows.length - 1 ? '1px solid #f7f7f7' : 'none',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '8px',
            backgroundColor: '#f3f4f6', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', color: '#6b7280',
          }}>
            {row.icon}
          </div>
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

/* ── Defaults form ── */

function DefaultsForm() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Row 1: two fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormSelect label="Fixed Monthly Fee *" defaultValue="990 kr">
          <option>990 kr</option>
          <option>1,490 kr</option>
          <option>1,990 kr</option>
        </FormSelect>
        <FormSelect label="Fee Per Estimate *" defaultValue="12 kr">
          <option>12 kr</option>
          <option>15 kr</option>
          <option>20 kr</option>
        </FormSelect>
      </div>

      {/* Row 2: full-width */}
      <FormSelect label="Default Currency *">
        <option>Swedish Krona (SEK kr)</option>
        <option>Euro (EUR €)</option>
        <option>US Dollar (USD $)</option>
      </FormSelect>

      {/* Row 3: prefix + suffix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Prefix</label>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: '1px solid #e5e7eb', borderRadius: '8px',
            height: '40px', overflow: 'hidden', backgroundColor: '#fff',
          }}>
            <span style={{
              padding: '0 12px', fontSize: '13px', color: '#9ca3af',
              backgroundColor: '#f9fafb', height: '100%',
              display: 'flex', alignItems: 'center',
              borderRight: '1px solid #e5e7eb', flexShrink: 0,
            }}>
              #
            </span>
            <input
              type="text"
              style={{
                flex: 1, border: 'none', outline: 'none',
                padding: '0 12px', fontSize: '13px', fontFamily: 'inherit',
                backgroundColor: '#fff', color: '#0d1117',
              }}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Suffix</label>
          <input
            type="text"
            style={{
              width: '100%', height: '40px', boxSizing: 'border-box',
              border: '1px solid #e5e7eb', borderRadius: '8px',
              padding: '0 12px', fontSize: '13px', fontFamily: 'inherit',
              outline: 'none', backgroundColor: '#fff', color: '#0d1117',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function FormSelect({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select style={{
        width: '100%', height: '40px', boxSizing: 'border-box',
        border: '1px solid #e5e7eb', borderRadius: '8px',
        padding: '0 12px', fontSize: '13px', fontFamily: 'inherit',
        backgroundColor: '#fff', color: '#0d1117',
        cursor: 'pointer', outline: 'none',
      }}>
        {children}
      </select>
    </div>
  );
}

/* ── Notifications card ── */

function NotificationsCard({ toggles, onFlip }) {
  const rows = [
    { key: 'estimates', label: 'New estimate submitted',  desc: 'Get notified when a client generates a new estimate'  },
    { key: 'invoice',   label: 'Invoice overdue',         desc: 'Alert when a client invoice becomes overdue'           },
    { key: 'client',    label: 'New client added',        desc: 'Notification when a new client is created'             },
  ];

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '0 20px' }}>
      {rows.map((row, i) => (
        <div key={row.key} style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '14px 0',
          borderBottom: i < rows.length - 1 ? '1px solid #f7f7f7' : 'none',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#0d1117' }}>{row.label}</p>
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
    <div
      onClick={onToggle}
      style={{
        width: '36px', height: '20px', borderRadius: '10px', flexShrink: 0,
        backgroundColor: active ? ACCENT : '#e5e7eb',
        position: 'relative', cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', top: '2px',
        left: active ? '18px' : '2px',
        width: '16px', height: '16px', borderRadius: '50%',
        backgroundColor: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  );
}

/* ── Danger zone ── */

function DangerZone() {
  return (
    <div style={{ marginTop: '28px' }}>
      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>Danger Zone</p>
      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#9ca3af' }}>These actions are irreversible.</p>
      <div style={{ backgroundColor: '#fff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#0d1117' }}>Reset All Data</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Permanently delete all clients, estimates, and invoices.</p>
          </div>
          <button type="button" style={{
            border: '1px solid #dc2626', color: '#dc2626', backgroundColor: '#fff',
            borderRadius: '8px', padding: '6px 16px', fontSize: '13px',
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Shared styles ── */

const labelStyle = {
  display: 'block',
  fontSize: '12px', fontWeight: '500', color: '#374151',
  marginBottom: '6px',
};
