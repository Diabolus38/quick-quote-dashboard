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
  const [agreedToTerms,    setAgreedToTerms]    = useState(false);
  const [error,            setError]            = useState('');
  const [loading,          setLoading]          = useState(false);
  const [emailSent,        setEmailSent]        = useState(false);

  async function handleSubmit() {
    console.log("SUBMIT TRIGGERED");
    setError('');

    if (!agreedToTerms) {
      setError('You must agree to the terms to create an account.');
      return;
    }
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

    try {
      const { data: clientData, error: clientError } = await supabase.from('clients').insert({
        name:   fullName.trim(),
        email:  email.trim(),
        plan:   'starter',
        active: true,
      }).select('id').single();

      if (clientError || !clientData?.id) {
        console.error('Failed to create client row', clientError);
      } else {
        const { error: profileLinkError } = await supabase
          .from('profiles')
          .update({ client_id: clientData.id })
          .eq('id', user.id);

        if (profileLinkError) {
          console.error('Failed to link client_id to profile', profileLinkError);
        }

        await Promise.all([
          supabase.from('client_settings').insert({
            client_id:         clientData.id,
            branding:          {},
            pdf_content:       {},
            email_settings:    {},
            language_settings: {},
          }).then(({ error }) => {
            if (error) console.error('Failed to create client_settings', error);
          }),
          supabase.from('client_pricing').insert({
            client_id:       clientData.id,
            base_prices:     { bdt: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }, wc: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }, wc_bdt: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } },
            fixed_costs:     { planning: 0, establishment_zone1: 0, establishment_zone2: 0, de_establishment: 0, admin: 0, inspection: 0 },
            per_meter_costs: { gravity_pipe: 0, pressure_pipe: 0, protection_pipe: 0, cable: 0, makadam: 0, labor: 0 },
            addons:          { pump_well: 0, double_pump: 0, telescope_cover: 0, lawn_restoration_base: 0, mass_removal: 0, transport: 0 },
            rot_enabled:     false,
            rot_percentage:  30,
            currency:        'SEK',
          }).then(({ error }) => {
            if (error) console.error('Failed to create client_pricing', error);
          }),
        ]);
      }
    } catch (err) {
      console.error('Failed to create client row', err);
    }

    setEmailSent(true);
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

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
                <input type="checkbox" id="agreeTerms" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: '3px', cursor: 'pointer', accentColor: PRIMARY, flexShrink: 0 }} />
                <label htmlFor="agreeTerms" style={{ fontSize: '13px', color: '#4b5563', fontFamily: FONT, lineHeight: '1.5', cursor: 'pointer' }}>
                  By creating an account you agree to our{' '}
                  <button type="button" onClick={() => window.open('/terms', '_blank')}
                    style={{ background: 'none', border: 'none', color: PRIMARY, fontWeight: '600', cursor: 'pointer', fontFamily: FONT, fontSize: '13px', padding: 0 }}>
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button type="button" onClick={() => window.open('/privacy', '_blank')}
                    style={{ background: 'none', border: 'none', color: PRIMARY, fontWeight: '600', cursor: 'pointer', fontFamily: FONT, fontSize: '13px', padding: 0 }}>
                    Privacy Policy
                  </button>
                  .
                </label>
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
