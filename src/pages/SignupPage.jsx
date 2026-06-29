import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthLeft } from '../LoginPage';

const FONT    = "'Plus Jakarta Sans', system-ui, sans-serif";
const PRIMARY = '#166534';

const PLAN_CARDS = [
  { key: 'free_trial', name: 'Free Trial', monthlyPrice: 'Free',         yearlyPrice: 'Free',         subtext: 'Full Scale features, no credit card required' },
  { key: 'starter',    name: 'Starter',    monthlyPrice: '1,400 kr/mo',  yearlyPrice: '14,000 kr/yr', subtext: 'No dashboard access, unlimited estimates'     },
  { key: 'growth',     name: 'Growth',     monthlyPrice: '3,000 kr/mo',  yearlyPrice: '30,000 kr/yr', subtext: 'Full dashboard, 30 estimates/mo'              },
  { key: 'scale',      name: 'Scale',      monthlyPrice: '6,000 kr/mo',  yearlyPrice: '60,000 kr/yr', subtext: 'Everything, 75 estimates/mo'                  },
];

export default function SignupPage() {
  const navigate = useNavigate();

  const [fullName,        setFullName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms,   setAgreedToTerms]   = useState(false);
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [emailSent,       setEmailSent]       = useState(false);
  const [selectedPlan,    setSelectedPlan]    = useState('growth');
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [redirecting,     setRedirecting]     = useState(false);

  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (['starter', 'growth', 'scale', 'free_trial'].includes(planParam)) setSelectedPlan(planParam);
  }, []);

  async function handleSubmit() {
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

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), selected_plan: selectedPlan } },
    });

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

    localStorage.setItem('qq360_pending_plan',    selectedPlan);
    localStorage.setItem('qq360_pending_billing', billingInterval);
    localStorage.setItem('qq360_pending_email',   email.trim());
    setEmailSent(true);
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT }}>
      <AuthLeft />

      {/* Right panel */}
      <div style={{ flex: 1, backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', overflowY: 'auto' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '480px', boxSizing: 'border-box', boxShadow: '0 4px 32px rgba(0,0,0,0.10)', border: 'none' }}>

          {emailSent ? (
            /* ── Check-your-email screen ── */
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
            /* ── Signup form ── */
            <>
              <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '700', color: '#0d1117' }}>Create your account</h1>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#9ca3af' }}>Start your free trial today</p>

              {/* Plan selection */}
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Choose Your Plan</p>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {PLAN_CARDS.map(p => (
                    <div key={p.key} onClick={() => setSelectedPlan(p.key)}
                      style={{
                        border:          `2px solid ${selectedPlan === p.key ? (p.key === 'free_trial' ? '#a3e635' : PRIMARY) : (p.key === 'free_trial' ? '#a3e635' : '#e8ede8')}`,
                        borderRadius:    '12px',
                        padding:         '16px',
                        cursor:          'pointer',
                        position:        'relative',
                        backgroundColor: '#fff',
                      }}>
                      {p.key === 'free_trial' && (
                        <span style={{ position: 'absolute', top: '-8px', right: '12px', backgroundColor: '#a3e635', color: '#0d1f12', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px' }}>
                          NO CREDIT CARD
                        </span>
                      )}
                      {selectedPlan === p.key && (
                        <span style={{ position: 'absolute', top: '8px', right: '10px', color: p.key === 'free_trial' ? '#3f6212' : PRIMARY, fontWeight: '700', fontSize: '13px' }}>✓</span>
                      )}
                      <p style={{ margin: '0 0 2px', fontWeight: '700', color: '#0d1117', fontSize: '13px' }}>{p.name}</p>
                      <p style={{ margin: '0 0 4px', fontWeight: '800', color: '#0d1117', fontSize: '15px' }}>
                        {p.key === 'free_trial' ? p.monthlyPrice : (billingInterval === 'yearly' ? p.yearlyPrice : p.monthlyPrice)}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>{p.subtext}</p>
                    </div>
                  ))}
                </div>
                {selectedPlan !== 'free_trial' && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                    {[['monthly', 'Monthly'], ['yearly', 'Yearly (save ~17%)']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setBillingInterval(val)}
                        style={{ backgroundColor: billingInterval === val ? PRIMARY : '#fff', color: billingInterval === val ? '#fff' : '#374151', border: billingInterval === val ? 'none' : '1px solid #e8ede8', borderRadius: '20px', padding: '6px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                {loading ? (redirecting ? 'Redirecting to payment...' : 'Creating account…') : 'Create account'}
              </button>

              <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center', fontFamily: FONT }}>
                By signing up you agree to our{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY, textDecoration: 'none', fontWeight: '600' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY, textDecoration: 'none', fontWeight: '600' }}>Privacy Policy</a>.
              </p>

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
const inputStyle  = { width: '100%', padding: '10px 14px', fontSize: '13.5px', color: '#0d1117', border: '1px solid #d1d5db', borderRadius: '10px', outline: 'none', boxSizing: 'border-box', fontFamily: FONT, backgroundColor: '#fff' };
