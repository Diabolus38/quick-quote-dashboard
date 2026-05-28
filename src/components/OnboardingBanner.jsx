import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const LIME = '#a3e635';
const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function OnboardingBanner() {
  const { profile } = useAuth();
  const navigate    = useNavigate();

  const [visible,  setVisible]  = useState(false);
  const [checklist, setChecklist] = useState(null);

  useEffect(() => {
    if (!profile?.client_id) return;

    const dismissKey = `qq360_onboarding_dismissed_${profile.client_id}`;
    if (localStorage.getItem(dismissKey)) return;

    async function fetchStatus() {
      const [settingsRes, pricingRes] = await Promise.all([
        supabase.from('client_settings').select('branding').eq('client_id', profile.client_id).single(),
        supabase.from('client_pricing').select('base_prices').eq('client_id', profile.client_id).single(),
      ]);

      const branding   = settingsRes.data?.branding;
      const basePrices = pricingRes.data?.base_prices;

      const brandingDone = !!(branding && branding.company_name);
      const pricingDone  = !!(basePrices && Object.values(basePrices).some(v => Number(v) > 0));

      const items = [
        { label: 'Set up your branding',    done: brandingDone, route: '/client/settings'  },
        { label: 'Configure your pricing',  done: pricingDone,  route: '/client/pricing'   },
        { label: 'Customize your questions', done: false,        route: '/client/questions' },
        { label: 'Install on your website', done: false,        route: '/client/settings'  },
      ];

      if (items.every(i => i.done)) return;

      setChecklist(items);
      setVisible(true);
    }

    fetchStatus();
  }, [profile?.client_id]);

  function dismiss() {
    const dismissKey = `qq360_onboarding_dismissed_${profile.client_id}`;
    localStorage.setItem(dismissKey, 'true');
    setVisible(false);
  }

  if (!visible || !checklist) return null;

  return (
    <div style={{ backgroundColor: '#0d1f12', borderRadius: '16px', padding: '24px', marginBottom: '24px', position: 'relative', fontFamily: FONT }}>

      {/* Dismiss button */}
      <button type="button" onClick={dismiss}
        style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '18px', cursor: 'pointer', lineHeight: 1, padding: '4px 8px', borderRadius: '6px' }}>
        ×
      </button>

      <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
        Get started with QuickQuote360
      </p>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
        Complete your setup to start capturing leads
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {checklist.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {item.done ? (
              <span style={{ fontSize: '16px', color: LIME, flexShrink: 0, width: '20px', textAlign: 'center' }}>✓</span>
            ) : (
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0, display: 'inline-block' }} />
            )}

            <span style={{
              fontSize: '13.5px',
              color: item.done ? 'rgba(255,255,255,0.4)' : '#ffffff',
              textDecoration: item.done ? 'line-through' : 'none',
              flex: 1,
            }}>
              {item.label}
            </span>

            {!item.done && (
              <button type="button" onClick={() => navigate(item.route)}
                style={{ background: 'none', border: 'none', color: LIME, fontSize: '16px', cursor: 'pointer', padding: '2px 6px', borderRadius: '6px', lineHeight: 1, flexShrink: 0 }}>
                →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
