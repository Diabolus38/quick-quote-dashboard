// REQUIRED: In Supabase Dashboard → Authentication → URL Configuration
// Add to Redirect URLs: https://dashboard.quickquote360.com/signup/confirm
// Set Site URL to: https://dashboard.quickquote360.com

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

export default function SignupConfirm() {
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleConfirm() {
      const pendingPlan    = localStorage.getItem('qq360_pending_plan');
      const pendingBilling = localStorage.getItem('qq360_pending_billing');
      const pendingEmail   = localStorage.getItem('qq360_pending_email');

      if (!pendingPlan || pendingPlan === 'free_trial') {
        localStorage.removeItem('qq360_pending_plan');
        localStorage.removeItem('qq360_pending_billing');
        localStorage.removeItem('qq360_pending_email');
        window.location.href = '/client';
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Session not found. Please sign in again.');
        return;
      }

      try {
        const res = await fetch('https://estimator-widget-production.up.railway.app/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId:        user.id,
            email:           pendingEmail || user.email,
            planKey:         pendingPlan,
            billingInterval: pendingBilling || 'monthly',
            installType:     'none',
          }),
        });
        const data = await res.json();
        if (data.url) {
          localStorage.removeItem('qq360_pending_plan');
          localStorage.removeItem('qq360_pending_billing');
          localStorage.removeItem('qq360_pending_email');
          window.location.href = data.url;
        } else {
          setError('Failed to redirect to payment. Please contact team@aiworldpartners.com');
        }
      } catch {
        setError('Failed to redirect to payment. Please contact team@aiworldpartners.com');
      }
    }

    handleConfirm();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: '24px', fontWeight: '800', color: PRIMARY, margin: '0 0 8px', letterSpacing: '-0.5px' }}>QuickQuote360</p>
      {error ? (
        <p style={{ fontSize: '14px', color: '#dc2626', marginTop: '12px', textAlign: 'center', maxWidth: '360px', lineHeight: '1.6' }}>{error}</p>
      ) : (
        <>
          <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 0 24px' }}>Setting up your account...</p>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e8ede8', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </>
      )}
    </div>
  );
}
