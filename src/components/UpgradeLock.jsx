import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

const BADGE_STYLES = {
  growth: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  scale:  { backgroundColor: '#dcfce7', color: '#166534' },
};

export default function UpgradeLock({ feature, requiredPlan }) {
  const { profile } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const badge = BADGE_STYLES[requiredPlan] || BADGE_STYLES.growth;
  const planLabel = requiredPlan === 'scale' ? 'Scale' : 'Growth';

  const handleRequestUpgrade = async () => {
    setSending(true);
    try {
      await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'team@quickquote360.com',
          subject: 'Upgrade Request from ' + profile?.full_name,
          body:
            'Client ' +
            profile?.full_name +
            ' (' +
            profile?.email +
            ') has requested an upgrade to ' +
            requiredPlan +
            ' plan to access: ' +
            feature +
            '. Client ID: ' +
            profile?.client_id,
        }),
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 128px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: '48px 40px', textAlign: 'center', maxWidth: '480px', width: '100%', fontFamily: FONT }}>

        {/* Padlock icon in gray circle */}
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Feature name */}
        <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700, color: '#0d1117' }}>
          {feature}
        </h3>

        {/* Plan badge */}
        <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '16px', ...badge }}>
          Available on {planLabel} plan
        </span>

        {/* Description */}
        <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: '14px', lineHeight: 1.6 }}>
          This feature is not included in your current plan. Upgrade to unlock it and get more out of QuickQuote360.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.open('https://quickquote360.com/pricing', '_blank')}
            style={{ backgroundColor: '#0d1f12', color: 'white', borderRadius: '10px', padding: '10px 24px', fontSize: '13.5px', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: FONT }}
          >
            See Plans
          </button>
          <button
            onClick={handleRequestUpgrade}
            disabled={sending || sent}
            style={{ backgroundColor: '#a3e635', color: '#0d1f12', borderRadius: '10px', padding: '10px 24px', fontSize: '13.5px', fontWeight: 600, border: 'none', cursor: sending || sent ? 'default' : 'pointer', fontFamily: FONT }}
          >
            {sending ? 'Sending...' : 'Request Upgrade'}
          </button>
        </div>

        {sent && (
          <p style={{ color: '#16a34a', marginTop: '14px', fontSize: '13px', fontWeight: 600 }}>
            Request sent! We will contact you shortly.
          </p>
        )}
      </div>
    </div>
  );
}
