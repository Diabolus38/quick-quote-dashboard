import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function UpgradeLock({ feature, requiredPlan }) {
  const { profile } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRequestUpgrade = async () => {
    setSending(true);
    try {
      await fetch('https://estimator-widget-production.up.railway.app/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'team@aiworldpartners.com',
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
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '2px dashed #e8ede8',
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
      <h3
        style={{
          color: '#0d1117',
          fontSize: '16px',
          fontWeight: 700,
          marginBottom: '8px',
          margin: '0 0 8px 0',
        }}
      >
        {feature} — {requiredPlan} plan only
      </h3>
      <p
        style={{
          color: '#9ca3af',
          fontSize: '13px',
          lineHeight: 1.6,
          marginBottom: '24px',
          margin: '0 0 24px 0',
        }}
      >
        Upgrade your plan to unlock this feature and grow your business with QuickQuote360.
      </p>
      <div>
        <button
          onClick={() => window.open('https://quickquote360.com/pricing', '_blank')}
          style={{
            backgroundColor: '#0d1f12',
            color: 'white',
            borderRadius: '10px',
            padding: '10px 24px',
            fontSize: '13.5px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            marginRight: '8px',
          }}
        >
          See Plans
        </button>
        <button
          onClick={handleRequestUpgrade}
          disabled={sending || sent}
          style={{
            backgroundColor: '#a3e635',
            color: '#0d1f12',
            borderRadius: '10px',
            padding: '10px 24px',
            fontSize: '13.5px',
            fontWeight: 600,
            border: 'none',
            cursor: sending || sent ? 'default' : 'pointer',
          }}
        >
          {sending ? 'Sending...' : 'Request Upgrade'}
        </button>
      </div>
      {sent && (
        <p style={{ color: 'green', marginTop: '12px', fontSize: '13px' }}>
          Request sent! We will contact you shortly.
        </p>
      )}
    </div>
  );
}
