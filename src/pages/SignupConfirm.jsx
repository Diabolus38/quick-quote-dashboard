import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

export default function SignupConfirm() {
  const { profile, loading } = useAuth();
  const [status,    setStatus]    = useState('Setting up your account...');
  const [error,     setError]     = useState('');
  const [cancelled, setCancelled] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      localStorage.removeItem('qq360_pending_plan');
      localStorage.removeItem('qq360_pending_billing');
      localStorage.removeItem('qq360_pending_email');
      window.location.href = '/client';
      return;
    }
    if (params.get('checkout') === 'cancelled') {
      setCancelled(true);
      return;
    }

    // Wait for AuthContext to finish loading
    if (loading) return;

    // Prevent double execution
    if (hasRun.current) return;
    hasRun.current = true;

    const pendingPlan    = localStorage.getItem('qq360_pending_plan');
    const pendingBilling = localStorage.getItem('qq360_pending_billing');
    const pendingEmail   = localStorage.getItem('qq360_pending_email');

    // Free trial — go straight to dashboard
    if (!pendingPlan || pendingPlan === 'free_trial') {
      localStorage.removeItem('qq360_pending_plan');
      localStorage.removeItem('qq360_pending_billing');
      localStorage.removeItem('qq360_pending_email');
      window.location.href = '/client';
      return;
    }

    // Get clientId from AuthContext profile — this is set by ensureNewUserData
    // which AuthContext already ran. We never need to poll Supabase ourselves.
    const clientId = profile?.client_id;

    if (!clientId) {
      // AuthContext finished but client_id is still null — something went wrong in ensureNewUserData
      setError('We could not complete your account setup. Please contact team@aiworldpartners.com with your email address and we will fix this within 24 hours.');
      // Send alert
      fetch('https://estimator-widget-production.up.railway.app/send-simple-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'team@aiworldpartners.com',
          subject: 'CRITICAL: SignupConfirm - client_id null after AuthContext loaded',
          text: 'A user tried to sign up for plan ' + pendingPlan + ' (email: ' + (pendingEmail || 'unknown') + ') but profile.client_id is null after AuthContext finished loading. ensureNewUserData likely failed. Manual fix required in Supabase.'
        })
      }).catch(() => {});
      return;
    }

    // We have the correct client_id from AuthContext — send to Stripe
    setStatus('Redirecting to payment...');

    fetch('https://estimator-widget-production.up.railway.app/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId:        clientId,
        email:           pendingEmail || profile?.email,
        planKey:         pendingPlan,
        billingInterval: pendingBilling || 'monthly',
        installType:     'none',
      }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Payment page could not be loaded. Please contact team@aiworldpartners.com');
      }
    })
    .catch(() => {
      setError('Payment page could not be loaded. Please contact team@aiworldpartners.com');
    });

  }, [loading, profile]);

  if (cancelled) {
    const pendingPlan    = localStorage.getItem('qq360_pending_plan');
    const pendingBilling = localStorage.getItem('qq360_pending_billing');
    const pendingEmail   = localStorage.getItem('qq360_pending_email');
    function retryPayment() {
      const clientId = profile?.client_id;
      if (!clientId || !pendingPlan) { setError('Session expired. Please sign up again.'); setCancelled(false); return; }
      setCancelled(false);
      setStatus('Redirecting to payment...');
      fetch('https://estimator-widget-production.up.railway.app/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, email: pendingEmail || profile?.email, planKey: pendingPlan, billingInterval: pendingBilling || 'monthly', installType: 'none' }),
      })
      .then(r => r.json())
      .then(data => { if (data.url) { window.location.href = data.url; } else { setError('Payment page could not be loaded. Please contact team@aiworldpartners.com'); } })
      .catch(() => { setError('Payment page could not be loaded. Please contact team@aiworldpartners.com'); });
    }
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
        <p style={{ fontSize: '26px', fontWeight: '800', color: PRIMARY, margin: '0 0 8px', letterSpacing: '-0.5px' }}>QuickQuote360</p>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 24px' }}>
          <p style={{ fontSize: '15px', color: '#374151', marginTop: '16px', lineHeight: '1.7' }}>Payment was not completed. Your account is ready — you just need to complete checkout to activate it.</p>
          <button onClick={retryPayment} style={{ marginTop: '20px', display: 'inline-block', padding: '10px 28px', backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Complete payment</button>
          <br />
          <a href="/signup" style={{ marginTop: '16px', display: 'inline-block', fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>Start over</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: '26px', fontWeight: '800', color: PRIMARY, margin: '0 0 8px', letterSpacing: '-0.5px' }}>QuickQuote360</p>
      {error ? (
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 24px' }}>
          <p style={{ fontSize: '14px', color: '#dc2626', marginTop: '16px', lineHeight: '1.7' }}>{error}</p>
          <a href="/signup" style={{ marginTop: '20px', display: 'inline-block', fontSize: '13px', color: PRIMARY, fontWeight: '600', textDecoration: 'none' }}>← Back to signup</a>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 0 24px' }}>{status}</p>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e8ede8', borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </>
      )}
    </div>
  );
}
