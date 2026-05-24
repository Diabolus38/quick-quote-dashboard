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
        navigate('/client');
      }
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT }}>
      <AuthLeft />

      {/* Right panel */}
      <div style={{ flex: 1, backgroundColor: '#f4f6f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxSizing: 'border-box', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

          <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '700', color: '#0d1117' }}>Welcome back</h1>
          <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#9ca3af' }}>Sign in to your dashboard</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <button type="button" onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: PRIMARY, fontFamily: FONT, fontWeight: '500', padding: 0 }}>
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '600', color: '#ffffff', backgroundColor: loading ? '#4b5563' : PRIMARY, border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: loading ? 0.8 : 1 }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            {error && <p style={{ marginTop: '12px', fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>{error}</p>}
          </form>

          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e8ede8' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e8ede8' }} />
          </div>

          <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', textAlign: 'center' }}>
            New client?{' '}
            <button type="button" onClick={() => navigate('/signup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontWeight: '600', fontFamily: FONT, fontSize: '13.5px', padding: 0 }}>
              Create your account →
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}

export function AuthLeft() {
  return (
    <div style={{ flex: 1, backgroundColor: DARK, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 64px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '52px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: DARK }}>Q</div>
        <span style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>QuickQuote360</span>
      </div>

      {/* Tagline */}
      <p style={{ fontSize: '18px', fontWeight: '300', color: '#ffffff', lineHeight: '1.65', maxWidth: '320px', margin: '0 0 36px' }}>
        Turn visitors into qualified leads — automatically.
      </p>

      {/* Bullets */}
      <div style={{ marginBottom: '48px' }}>
        {[
          'Instant estimates for your customers',
          'Leads captured automatically',
          'Full control from your dashboard',
        ].map((bullet, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ color: LIME, fontWeight: '700', fontSize: '15px', lineHeight: 1 }}>✓</span>
            <span style={{ color: '#ffffff', fontSize: '14px', lineHeight: 1.4 }}>{bullet}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '12px', color: '#3d6b42', margin: 0 }}>
        Trusted by wastewater specialists across Sweden
      </p>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px',
};
const inputStyle = {
  width: '100%', padding: '10px 14px', fontSize: '13.5px', color: '#0d1117',
  border: '1px solid #d1d5db', borderRadius: '10px', outline: 'none',
  boxSizing: 'border-box', fontFamily: FONT, backgroundColor: '#fff',
};
