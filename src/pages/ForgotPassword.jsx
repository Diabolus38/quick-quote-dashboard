import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLeft } from '../LoginPage';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      setEmailSent(true);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT }}>
      <AuthLeft />

      {/* Right panel */}
      <div style={{ flex: 1, backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxSizing: 'border-box', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: 'none' }}>

          {emailSent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '48px', margin: '0 0 20px', color: '#0d1f12' }}>✉</p>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0d1117', margin: '0 0 14px' }}>Check your email</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 28px' }}>
                We sent a reset link to <strong>{email}</strong>. Click the link to set a new password.
              </p>
              <button type="button" onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '600', color: '#ffffff', backgroundColor: PRIMARY, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: FONT }}>
                Back to login
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '700', color: '#0d1117' }}>Reset password</h1>
              <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#9ca3af' }}>Enter your email to receive a reset link</p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '24px' }}>
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

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '600', color: '#ffffff', backgroundColor: loading ? '#4b5563' : PRIMARY, border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: loading ? 0.8 : 1 }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>

                {error && <p style={{ marginTop: '12px', fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>{error}</p>}
              </form>

              <p style={{ marginTop: '24px', textAlign: 'center', margin: '24px 0 0' }}>
                <button type="button" onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontWeight: '600', fontFamily: FONT, fontSize: '13.5px', padding: 0 }}>
                  ← Back to login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', fontSize: '13.5px', color: '#0d1117', border: '1px solid #d1d5db', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', fontFamily: FONT, backgroundColor: '#fff' };
