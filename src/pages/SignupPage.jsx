import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLeft } from '../LoginPage';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

export default function SignupPage() {
  const navigate = useNavigate();

  const [fullName,         setFullName]         = useState('');
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [error,            setError]            = useState('');
  const [loading,          setLoading]          = useState(false);
  const [emailSent,        setEmailSent]        = useState(false);

  async function handleSubmit() {
    console.log("SUBMIT TRIGGERED");
    setError('');

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    console.log("Starting signup with:", email);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    console.log("SignUp response:", signUpData, signUpError);
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const user = signUpData?.user;
    if (!user) {
      setError('Signup failed. Please try again.');
      setLoading(false);
      return;
    }

    await supabase.from('profiles').insert({
      id:        user.id,
      full_name: fullName.trim(),
      email:     email.trim(),
      role:      'client',
    });

    setEmailSent(true);
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT }}>
      <AuthLeft />

      {/* Right panel */}
      <div style={{ flex: 1, backgroundColor: '#f4f6f4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', boxSizing: 'border-box', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

          {emailSent ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '48px', margin: '0 0 20px', color: '#0d1f12' }}>✉</p>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0d1117', margin: '0 0 14px' }}>Check your email</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 10px' }}>
                We sent a confirmation link to <strong>{email}</strong>. Please click the link to activate your account.
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 28px' }}>Once confirmed, click below to sign in.</p>
              <button type="button" onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '600', color: '#ffffff', backgroundColor: PRIMARY, border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: FONT }}>
                Go to login
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '700', color: '#0d1117' }}>Create your account</h1>
              <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#9ca3af' }}>Start your free trial today</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Full name</label>
                <input type="text" placeholder="Jane Smith" autoComplete="name" value={fullName}
                  onChange={e => setFullName(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" placeholder="jane@example.com" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Password</label>
                <input type="password" placeholder="••••••••" autoComplete="new-password" value={password}
                  onChange={e => setPassword(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Confirm password</label>
                <input type="password" placeholder="••••••••" autoComplete="new-password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
              </div>

              <button type="button" disabled={loading} onClick={handleSubmit}
                style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: '600', color: '#ffffff', backgroundColor: loading ? '#4b5563' : PRIMARY, border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT, opacity: loading ? 0.8 : 1 }}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>

              {error && <p style={{ marginTop: '12px', fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>{error}</p>}

              <p style={{ marginTop: '24px', fontSize: '13.5px', color: '#4b5563', textAlign: 'center', margin: '24px 0 0' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontWeight: '600', fontFamily: FONT, fontSize: '13.5px', padding: 0 }}>
                  Sign in
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
