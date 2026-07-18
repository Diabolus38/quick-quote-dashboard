import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const LIME = '#a3e635';
const PRIMARY = '#166534';
const DARK = '#0d1f12';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (profileData?.role === 'super_admin') {
        navigate('/admin');
      } else {
        const pendingPlan = localStorage.getItem('qq360_pending_plan');
        if (pendingPlan && pendingPlan !== 'free_trial') {
          window.location.href = '/signup/confirm';
        } else {
          navigate('/client');
        }
      }
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT }}>

      {/* LEFT — Form panel */}
      <div style={{ width: '420px', flexShrink: 0, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 44px', position: 'relative' }}>

        {/* Brand top left */}
        <div style={{ position: 'absolute', top: '20px', left: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/qq360-logo.png" alt="QuickQuote360" style={{ width: '28px', height: '28px', borderRadius: '7px', objectFit: 'contain' }} />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a2e', fontFamily: FONT }}>QuickQuote360</span>
        </div>

        {/* Dot grid background behind icon */}
        <div style={{ position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '100px', backgroundImage: 'radial-gradient(circle, #c8d8e8 1.2px, transparent 1.2px)', backgroundSize: '20px 20px', opacity: 0.5, pointerEvents: 'none' }} />

        {/* Top icon */}
        <div style={{ width: '64px', height: '64px', backgroundColor: PRIMARY, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', boxShadow: '0 8px 24px rgba(22,101,52,0.28)', position: 'relative', zIndex: 1 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polyline points="7 10 10 13 17 8"/></svg>
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '800', color: '#1a1a2e', textAlign: 'center', fontFamily: FONT }}>Login to your account!</h1>
        <p style={{ margin: '0 0 22px', fontSize: '12px', color: '#9090a8', textAlign: 'center', lineHeight: '1.55', maxWidth: '280px', fontFamily: FONT }}>Get instant estimates, capture leads automatically, and grow your business.</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#3d3d5c', marginBottom: '4px', fontFamily: FONT }}>Email</label>
            <div style={{ position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8b8cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input type="email" placeholder="eg. daniel@avloppsservice.se" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', border: '1.5px solid #ebebf5', borderRadius: '9px', padding: '9px 12px 9px 32px', fontSize: '12.5px', color: '#1a1a2e', background: '#f9f9fc', outline: 'none', boxSizing: 'border-box', fontFamily: FONT }} />
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#3d3d5c', marginBottom: '4px', fontFamily: FONT }}>Password</label>
            <div style={{ position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b8b8cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <input type="password" placeholder="••••••••••••" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', border: '1.5px solid #ebebf5', borderRadius: '9px', padding: '9px 12px 9px 32px', fontSize: '12.5px', color: '#1a1a2e', background: '#f9f9fc', outline: 'none', boxSizing: 'border-box', fontFamily: FONT }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6b6b8a', fontFamily: FONT, cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '12px', height: '12px', accentColor: PRIMARY }} /> Remember me
            </label>
            <button type="button" onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: PRIMARY, fontFamily: FONT, fontWeight: '600', padding: 0 }}>Forgot Password?</button>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', fontSize: '13px', fontWeight: '700', color: '#ffffff', backgroundColor: loading ? '#4b5563' : PRIMARY, border: 'none', borderRadius: '9px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT, marginBottom: '13px' }}>
            {loading ? 'Signing in…' : 'Login'}
          </button>

          {error && <p style={{ marginTop: '-8px', marginBottom: '10px', fontSize: '12px', color: '#dc2626', textAlign: 'center', fontFamily: FONT }}>{error}</p>}
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', marginBottom: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#ebebf5' }} />
          <span style={{ fontSize: '10.5px', color: '#b8b8cc', whiteSpace: 'nowrap', fontFamily: FONT }}>Or login with</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#ebebf5' }} />
        </div>

        <div style={{ display: 'flex', gap: '9px', width: '100%' }}>
          {[
            <svg key="g" viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
            <svg key="a" viewBox="0 0 24 24" width="18" height="18" fill="#000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>,
            <svg key="m" viewBox="0 0 24 24" width="18" height="18"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#00A4EF" d="M13 1h10v10H13z"/><path fill="#7FBA00" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
          ].map((icon, i) => (
            <div key={i} style={{ flex: 1, border: '1.5px solid #ebebf5', borderRadius: '9px', padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', cursor: 'pointer' }}>
              {icon}
            </div>
          ))}
        </div>

        <p style={{ margin: '14px 0 0', fontSize: '11px', color: '#6b6b8a', textAlign: 'center', fontFamily: FONT }}>
          New client?{' '}
          <button type="button" onClick={() => navigate('/signup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontWeight: '700', fontFamily: FONT, fontSize: '11px', padding: 0 }}>
            Create your account →
          </button>
        </p>
      </div>

      {/* RIGHT — Visual panel */}
      <div style={{ flex: 1, background: 'linear-gradient(160deg, #e8f0fb 0%, #dce8f8 50%, #d0e0f5 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '32px 0 28px', overflow: 'hidden', position: 'relative' }}>

        {/* Top title */}
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <p style={{ fontSize: '18px', fontWeight: '800', color: '#1a2a5e', margin: '0 0 4px', fontFamily: FONT }}>
            Estimates. Leads. Growth.{' '}
            <span style={{ color: PRIMARY }}>Everywhere.</span>
          </p>
        </div>

        {/* Orbit diagram */}
        <div style={{ position: 'relative', width: '320px', height: '320px', flexShrink: 0 }}>
          {/* 3 orbit rings */}
          {[320, 210, 118].map((size, i) => (
            <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: `${size}px`, height: `${size}px`, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.75)', transform: 'translate(-50%,-50%)', boxShadow: 'inset 0 0 0 0.5px rgba(100,140,200,0.15)' }} />
          ))}

          {/* Center hub */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '72px', height: '72px', background: PRIMARY, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: `0 6px 24px rgba(22,101,52,0.4), 0 0 0 10px rgba(22,101,52,0.1)` }}>
            <img src="/qq360-logo.png" alt="QQ360" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          </div>

          {/* Floating icon bubbles — circular white circles */}
          {[
            { top: '-22px', left: '50%', ml: '-22px', icon: '📊', color: '#166534', label: 'Leads' },
            { top: '13%', left: '-22px', icon: '👤', color: '#1d4ed8', label: 'Clients' },
            { top: '13%', right: '-22px', icon: '💰', color: '#b45309', label: 'Pricing' },
            { bottom: '13%', left: '-22px', icon: '📄', color: '#7c3aed', label: 'PDF' },
            { bottom: '13%', right: '-22px', icon: '🔔', color: '#dc2626', label: 'Alerts' },
            { bottom: '-22px', left: '50%', ml: '-22px', icon: '📍', color: '#0369a1', label: 'Areas' },
            { top: '22%', left: '50%', ml: '-16px', mt: '-16px', small: true, icon: '✓', color: '#166534' },
          ].map((item, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: item.top, bottom: item.bottom,
              left: item.left, right: item.right,
              marginLeft: item.ml, marginTop: item.mt,
              width: item.small ? '32px' : '44px',
              height: item.small ? '32px' : '44px',
              borderRadius: '50%',
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2,
              boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
              fontSize: item.small ? '14px' : '20px',
            }}>
              {item.icon}
            </div>
          ))}
        </div>

        {/* Bottom copy */}
        <p style={{ fontSize: '11.5px', color: '#4a6080', textAlign: 'center', padding: '0 32px', lineHeight: '1.6', margin: 0, fontFamily: FONT }}>
          Compatible with <strong style={{ fontStyle: 'italic', color: '#2a3a5e' }}>WordPress, Squarespace, Webflow</strong> and most website builders for instant estimates anywhere online.
        </p>
      </div>
    </div>
  );
}

export function AuthLeft() {
  return null;
}
