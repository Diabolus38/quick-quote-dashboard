import { useState } from 'react';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('qq360_cookies_accepted'));

  if (!visible) return null;

  function handleAccept() {
    localStorage.setItem('qq360_cookies_accepted', 'true');
    setVisible(false);
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e8ede8',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      padding: '16px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      fontFamily: FONT,
    }}>
      <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', fontFamily: FONT, flex: 1 }}>
        We use essential cookies only for authentication. No tracking or advertising.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button type="button" onClick={() => window.open('/privacy', '_blank')}
          style={{ border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: FONT }}>
          Learn More
        </button>
        <button type="button" onClick={handleAccept}
          style={{ backgroundColor: PRIMARY, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
          Accept
        </button>
      </div>
    </div>
  );
}
