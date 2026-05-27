import { useState, useEffect } from 'react';
import Layout from '../Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const CARD = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  padding: '24px',
  marginBottom: '16px',
};

const NAV_ITEMS = ['Profile', 'Notifications', 'Danger Zone'];

function Toggle({ active, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width: '40px', height: '22px', borderRadius: '11px', flexShrink: 0, backgroundColor: active ? PRIMARY : '#e5e7eb', position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s' }}>
      <div style={{ position: 'absolute', top: '3px', left: active ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
    </div>
  );
}

function SaveButton({ onClick, saveMsg, label = 'Save' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
      <button type="button" onClick={onClick}
        style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
        {label}
      </button>
      {saveMsg && <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', fontFamily: FONT }}>{saveMsg}</span>}
    </div>
  );
}

/* ── 1. Profile ──────────────────────────────────────────────── */

function ProfileSection() {
  const { profile } = useAuth();
  const [fullName,      setFullName]      = useState('');
  const [saveMsg,       setSaveMsg]       = useState('');
  const [avatarSaveMsg, setAvatarSaveMsg] = useState('');

  const initials = (() => {
    const name = profile?.full_name;
    if (!name) return 'AD';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  })();

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !profile?.id) return;
    const path = `${profile.id}/${file.name}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { setAvatarSaveMsg('Upload failed.'); setTimeout(() => setAvatarSaveMsg(''), 3000); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id);
    setAvatarSaveMsg('Photo saved!');
    setTimeout(() => { window.location.reload(); }, 1000);
  }

  async function handleSave() {
    if (!profile?.id) return;
    await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', profile.id);
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  const inp = {
    width: '100%', boxSizing: 'border-box', height: '42px',
    border: '1px solid #d1d5db', borderRadius: '10px', padding: '0 14px',
    fontSize: '13.5px', fontFamily: FONT, outline: 'none',
    color: '#0d1117', backgroundColor: '#fff',
  };
  const lbl = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: FONT };

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Profile</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Manage your account details.</p>
      </div>

      <div style={CARD}>
        <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600', color: '#111827', fontFamily: FONT }}>Profile Photo</p>
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>This photo appears in the top bar of your dashboard.</p>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginBottom: '12px', display: 'block' }} />
          : <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', marginBottom: '12px', fontFamily: FONT }}>{initials}</div>
        }
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', backgroundColor: '#fff', fontFamily: FONT, color: '#374151' }}>
            Choose photo
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </label>
          {avatarSaveMsg && <span style={{ fontSize: '13px', fontWeight: '600', color: avatarSaveMsg.includes('failed') || avatarSaveMsg.includes('Failed') ? '#dc2626' : '#16a34a', fontFamily: FONT }}>{avatarSaveMsg}</span>}
        </div>
      </div>

      <div style={CARD}>
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Full Name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" style={inp} />
        </div>
        <div>
          <label style={lbl}>Email</label>
          <input type="email" value={profile?.email || ''} readOnly
            style={{ ...inp, backgroundColor: '#f9fbf9', color: '#9ca3af', cursor: 'not-allowed' }} />
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>
            Contact support to change your email address.
          </p>
        </div>
        <SaveButton onClick={handleSave} saveMsg={saveMsg} />
      </div>
    </>
  );
}

/* ── 2. Notifications ────────────────────────────────────────── */

function NotificationsSection() {
  const [toggles, setToggles] = useState({ estimates: true, client: true, invoice: false });
  const [saveMsg, setSaveMsg] = useState('');
  const flip = key => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  function handleSave() {
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  }

  const rows = [
    { key: 'estimates', label: 'New estimate submitted', desc: 'Get notified when a client generates a new estimate' },
    { key: 'client',   label: 'New client added',       desc: 'Notification when a new client is created'          },
    { key: 'invoice',  label: 'Invoice overdue',        desc: 'Alert when a client invoice becomes overdue'         },
  ];

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Notifications</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>Control when and how you receive alerts.</p>
      </div>

      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 22px', borderBottom: i < rows.length - 1 ? '1px solid #f4f6f4' : 'none' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>{row.label}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>{row.desc}</p>
            </div>
            <Toggle active={toggles[row.key]} onToggle={() => flip(row.key)} />
          </div>
        ))}
      </div>

      <SaveButton onClick={handleSave} saveMsg={saveMsg} />
    </>
  );
}

/* ── 3. Danger Zone ──────────────────────────────────────────── */

function DangerZoneSection() {
  function handleReset() {
    if (window.confirm('Are you sure? This cannot be undone.')) {
      alert('This feature is coming soon.');
    }
  }

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: '700', color: '#dc2626', fontFamily: FONT }}>Danger Zone</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontFamily: FONT }}>These actions are irreversible.</p>
      </div>

      <div style={{ ...CARD, border: '1px solid #fee2e2' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: '600', color: '#0d1117', fontFamily: FONT }}>Reset All Demo Data</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>
              Permanently delete all clients, estimates, and invoices.
            </p>
          </div>
          <button type="button" onClick={handleReset}
            style={{ border: '1px solid #dc2626', color: '#dc2626', backgroundColor: '#fff', borderRadius: '10px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', flexShrink: 0, fontWeight: '500' }}>
            Reset
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Root ────────────────────────────────────────────────────── */

export default function Settings() {
  const [activeNav, setActiveNav] = useState('Profile');
  const [hovered,   setHovered]   = useState(null);

  return (
    <Layout title="Settings">
      <div style={{ fontFamily: FONT, display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

        {/* Side nav */}
        <div style={{ width: '200px', flexShrink: 0, backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '10px', position: 'sticky', top: '80px' }}>
          <p style={{ margin: '0 0 8px', padding: '0 8px', fontSize: '10px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: FONT }}>Settings</p>
          {NAV_ITEMS.map(item => {
            const active = activeNav === item;
            const isHov  = hovered === item;
            return (
              <button key={item} type="button"
                onClick={() => setActiveNav(item)}
                onMouseEnter={() => setHovered(item)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: active ? '9px 11px' : '9px 14px',
                  marginBottom: '2px',
                  fontSize: '13.5px', fontWeight: active ? '600' : '400',
                  color: active ? PRIMARY : isHov ? '#0d1117' : '#6b7280',
                  backgroundColor: active ? '#f0fdf4' : isHov ? '#f9fbf9' : 'transparent',
                  border: 'none',
                  borderLeft: active ? `3px solid ${PRIMARY}` : '3px solid transparent',
                  borderRadius: active ? '0 8px 8px 0' : '8px',
                  cursor: 'pointer', fontFamily: FONT,
                }}>
                {item}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeNav === 'Profile'       && <ProfileSection />}
          {activeNav === 'Notifications' && <NotificationsSection />}
          {activeNav === 'Danger Zone'   && <DangerZoneSection />}
        </div>

      </div>
    </Layout>
  );
}
