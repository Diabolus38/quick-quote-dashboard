import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

export default function TrialExpiredOverlay({ trialExpired, planEmailSent, sendPlanEmail, clientId, installPreference }) {
  const { profile } = useAuth();
  const [localInstallChoice, setLocalInstallChoice] = useState('self');
  const [redirectingPlan, setRedirectingPlan] = useState(null);

  useEffect(() => {
    if (installPreference) setLocalInstallChoice(installPreference);
  }, [installPreference]);

  if (!trialExpired) return null;

  async function choosePlan(planKey) {
    if (!clientId) return;
    await supabase.from('clients').update({ plan: planKey }).eq('id', clientId);
    await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('client_id', clientId);
    window.location.reload();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,31,18,0.97)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, overflowY: 'auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff' }}>Quick Quote</span>
        <span style={{ display: 'block', fontSize: '22px', fontWeight: '800', color: '#a3e635' }}>360</span>
      </div>
      <h2 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: '800', color: '#ffffff', fontFamily: FONT }}>Your free trial has ended</h2>
      <p style={{ margin: '0 0 40px', fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontFamily: FONT }}>Choose a plan to continue using QuickQuote360</p>

      {/* Plan cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { name: 'Growth',     planKey: 'growth',     price: '3,000 kr', sub: '/mo',       features: ['30 estimates/month', 'Lead management', 'Export CSV', 'Municipality settings'],  btnBg: '#166534', btnColor: '#fff',    btnLabel: 'Choose Plan' },
          { name: 'Scale',      planKey: 'scale',      price: '6,000 kr', sub: '/mo',       features: ['75 estimates/month', 'Full branding', 'PDF customization', 'Priority support'],   btnBg: '#a3e635', btnColor: '#0d1f12', btnLabel: 'Choose Plan' },
          { name: 'Enterprise', planKey: 'enterprise', price: 'Custom', sub: ' pricing',  features: ['Unlimited estimates', 'White-label option', 'API access', 'Dedicated support'],  btnBg: '#0d1f12', btnColor: '#fff',    btnLabel: 'Contact Us'  },
        ].map(plan => (
          <div key={plan.name} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', width: '220px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>{plan.name}</p>
            <p style={{ margin: '0 0 16px', fontFamily: FONT }}>
              <span style={{ fontSize: '28px', fontWeight: '800', color: '#0d1117' }}>{plan.price}</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#9ca3af' }}>{plan.sub}</span>
            </p>
            <ul style={{ margin: '0 0 20px', paddingLeft: '16px', fontSize: '12px', color: '#374151', lineHeight: '1.8', fontFamily: FONT }}>
              {plan.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <button type="button"
              disabled={redirectingPlan === plan.planKey}
              onClick={async () => {
                if (plan.planKey === 'enterprise') { sendPlanEmail(plan.name); return; }
                setRedirectingPlan(plan.planKey);
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  const res = await fetch('https://estimator-widget-production.up.railway.app/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                    body: JSON.stringify({ clientId, email: profile?.email, planKey: plan.planKey, billingInterval: 'month', installType: installPreference || 'none' }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                  else { console.error('No checkout URL:', data); setRedirectingPlan(null); }
                } catch (err) { console.error(err); setRedirectingPlan(null); }
              }}
              style={{ width: '100%', backgroundColor: plan.btnBg, color: plan.btnColor, border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13.5px', fontWeight: '600', cursor: redirectingPlan === plan.planKey ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: redirectingPlan === plan.planKey ? 0.7 : 1 }}>
              {redirectingPlan === plan.planKey ? 'Redirecting...' : plan.btnLabel}
            </button>
          </div>
        ))}
      </div>

      {planEmailSent && (
        <p style={{ marginTop: '24px', fontSize: '14px', color: '#a3e635', fontWeight: '600', fontFamily: FONT }}>We will be in touch shortly!</p>
      )}

      {/* Install preference reminder (only shown when previously set during signup) */}
      {installPreference && (
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>Based on your selection during signup</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { key: 'self',     label: 'Self-Install',     sub: '2,490 kr one-time' },
              { key: 'assisted', label: 'Assisted Install', sub: '9,990 kr one-time' },
            ].map(ic => (
              <div key={ic.key} onClick={() => setLocalInstallChoice(ic.key)}
                style={{ border: `2px solid ${localInstallChoice === ic.key ? '#ffffff' : 'rgba(255,255,255,0.2)'}`, borderRadius: '12px', padding: '12px 24px', cursor: 'pointer', backgroundColor: localInstallChoice === ic.key ? 'rgba(255,255,255,0.08)' : 'transparent', minWidth: '150px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 2px', fontWeight: '600', color: '#ffffff', fontSize: '13px', fontFamily: FONT }}>{ic.label}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontFamily: FONT }}>{ic.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <hr style={{ width: '320px', border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '32px 0 20px' }} />
      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: FONT, textAlign: 'center' }}>Need help or think this is a mistake?</p>
      <button
        type="button"
        onClick={() => window.open('https://quickquote360.com/support', '_blank')}
        style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '12px', fontFamily: FONT }}
      >
        Contact Support
      </button>
    </div>
  );
}
