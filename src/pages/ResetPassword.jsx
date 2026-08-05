import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLeft } from '../LoginPage';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [ready,    setReady]    = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      setChecking(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setDone(true);
      setLoading(false);
      setTimeout(() => navigate('/login'), 2500);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT }}>
      <AuthLeft />

      <div style={{ flex: 1, backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxSizing: 'border-box', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: 'none' }}>

          {checking ? (
            <p style={{ textAlign: 'center', fontSize: '13.5px', color: '#9ca3af' }}>Verifying your link…</p>
          ) : !ready ? (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0d1117', margin: '0 0 14px' }}>Link expired</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 28px' }}>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <button type="button" onClick={() => navigate('/forgot-password')}
                style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '600', color: '#ffffff', backgroundColor: PRIMARY, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: FONT }}>
                Request new link
              </button>
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '48px', margin: '0 0 20px', color: '#0d1f12' }}>✓</p>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0d1117', margin: '0 0 14px' }}>Password updated</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                Redirecting you to login…
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '700', color: '#0d1117' }}>Set a new password</h1>
              <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#9ca3af' }}>Choose a new password for your account</p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={labelStyle}>New password</label>
                  <input type="password" placeholder="••••••••" autoComplete="new-password"
                    value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Confirm password</label>
                  <input type="password" placeholder="••••••••" autoComplete="new-password"
                    value={confirm} onChange={e => setConfirm(e.target.value)} required style={inputStyle} />
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '600', color: '#ffffff', backgroundColor: loading ? '#4b5563' : PRIMARY, border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: loading ? 0.8 : 1 }}>
                  {loading ? 'Updating…' : 'Update password'}
                </button>

                {error && <p style={{ marginTop: '12px', fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>{error}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', fontSize: '13.5px', color: '#0d1117', border: '1px solid #d1d5db', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', fontFamily: FONT, backgroundColor: '#fff' };
