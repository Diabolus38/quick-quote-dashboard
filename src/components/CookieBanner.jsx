import { useState } from 'react';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('qq360_cookie_consent'));

  if (!visible) return null;

  function handleAccept() {
    localStorage.setItem('qq360_cookie_consent', 'true');
    setVisible(false);
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      backgroundColor: '#0d1f12',
      padding: '14px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      fontFamily: FONT,
    }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#e5e7eb', fontFamily: FONT, flex: 1 }}>
        We use essential cookies to keep you logged in. No tracking or advertising cookies.
      </p>
      <button type="button" onClick={handleAccept}
        style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
        OK, got it
      </button>
    </div>
  );
}
