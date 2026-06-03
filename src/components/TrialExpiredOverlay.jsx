const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function TrialExpiredOverlay({ trialExpired, planEmailSent, sendPlanEmail }) {
  if (!trialExpired) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(13,31,18,0.97)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff' }}>Quick Quote</span>
        <span style={{ display: 'block', fontSize: '22px', fontWeight: '800', color: '#a3e635' }}>360</span>
      </div>
      <h2 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: '800', color: '#ffffff', fontFamily: FONT }}>Your free trial has ended</h2>
      <p style={{ margin: '0 0 40px', fontSize: '15px', color: 'rgba(255,255,255,0.7)', fontFamily: FONT }}>Choose a plan to continue using QuickQuote360</p>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { name: 'Growth',     price: '$300', sub: '/mo',       features: ['30 estimates/month','Lead management','Export CSV','Municipality settings'],   btnBg: '#166534', btnColor: '#fff',    btnLabel: 'Choose Plan' },
          { name: 'Scale',      price: '$600', sub: '/mo',       features: ['75 estimates/month','Full branding','PDF customization','Priority support'],    btnBg: '#a3e635', btnColor: '#0d1f12', btnLabel: 'Choose Plan' },
          { name: 'Enterprise', price: 'Custom', sub: ' pricing', features: ['Unlimited estimates','White-label option','API access','Dedicated support'],   btnBg: '#0d1f12', btnColor: '#fff',    btnLabel: 'Contact Us'  },
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
            <button type="button" onClick={() => sendPlanEmail(plan.name)}
              style={{ width: '100%', backgroundColor: plan.btnBg, color: plan.btnColor, border: 'none', borderRadius: '10px', padding: '10px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
              {plan.btnLabel}
            </button>
          </div>
        ))}
      </div>
      {planEmailSent && (
        <p style={{ marginTop: '24px', fontSize: '14px', color: '#a3e635', fontWeight: '600', fontFamily: FONT }}>We will be in touch shortly!</p>
      )}
    </div>
  );
}
