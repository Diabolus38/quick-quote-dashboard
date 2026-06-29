// REQUIRED: In Supabase Dashboard → Authentication → URL Configuration
// Redirect URLs must include: https://dashboard.quickquote360.com/signup/confirm
// Site URL must be: https://dashboard.quickquote360.com

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

export default function SignupConfirm() {
  const [status, setStatus] = useState('Verifying your account...');
  const [error,  setError]  = useState('');

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

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) {
        setError('Your session has expired. Please go back and sign in.');
        return;
      }

      setStatus('Setting up your account...');

      // CRITICAL: We need profile.client_id — NOT user.id.
      // user.id is the Supabase auth UUID.
      // profile.client_id is the clients table UUID. These are DIFFERENT UUIDs.
      // Poll until ensureNewUserData has created and linked the client row.
      let clientId = null;
      for (let attempt = 0; attempt < 30; attempt++) {
        try {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('client_id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileRow?.client_id) {
            const { data: clientRow } = await supabase
              .from('clients')
              .select('id')
              .eq('id', profileRow.client_id)
              .maybeSingle();

            if (clientRow?.id) {
              clientId = clientRow.id;
              break;
            }
          }
        } catch (e) {
          // Network error — keep trying
        }

        if (attempt === 6)  setStatus('Almost ready...');
        if (attempt === 14) setStatus('Still working...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Last resort: create the client row ourselves if polling timed out
      if (!clientId) {
        setStatus('Finalizing your account...');
        const fullName  = user.user_metadata?.full_name || '';
        const userEmail = pendingEmail || user.email;

        try {
          const { data: upsertData } = await supabase
            .from('clients')
            .upsert(
              { name: fullName || userEmail, email: userEmail, plan: pendingPlan, active: true },
              { onConflict: 'email', ignoreDuplicates: false }
            )
            .select('id')
            .single();

          if (upsertData?.id) {
            clientId = upsertData.id;
            await supabase.from('profiles').update({ client_id: clientId }).eq('id', user.id);
            await supabase.from('client_settings').upsert(
              { client_id: clientId, branding: {}, pdf_content: {}, email_settings: {}, language_settings: {} },
              { onConflict: 'client_id', ignoreDuplicates: true }
            );
            await supabase.from('client_pricing').upsert(
              { client_id: clientId, base_prices: {}, fixed_costs: {}, per_meter_costs: {}, addons: {}, rot_enabled: false, rot_percentage: 30, currency: 'SEK' },
              { onConflict: 'client_id', ignoreDuplicates: true }
            );
          }
        } catch (e) {
          console.error('Last resort client creation failed:', e);
        }
      }

      if (!clientId) {
        try {
          await fetch('https://estimator-widget-production.up.railway.app/send-simple-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'team@aiworldpartners.com',
              subject: 'CRITICAL: Account setup failed before Stripe payment',
              text: 'User ' + (pendingEmail || user.email) + ' (auth ID: ' + user.id + ') confirmed email for plan ' + pendingPlan + ' but client row could not be created. They never reached Stripe. Manual fix required.'
            })
          });
        } catch (e) { /* email failed */ }

        setError('We could not complete your account setup. Our team has been notified and will contact you within 24 hours. You can also email team@aiworldpartners.com directly.');
        return;
      }

      setStatus('Redirecting to payment...');

      try {
        const res = await fetch('https://estimator-widget-production.up.railway.app/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId:        clientId,
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
          setError('Payment page could not be loaded. Please contact team@aiworldpartners.com');
        }
      } catch {
        setError('Payment page could not be loaded. Please contact team@aiworldpartners.com');
      }
    }

    handleConfirm();
  }, []);

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
