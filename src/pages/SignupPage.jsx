import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SignupPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
      padding: '48px 40px 40px',
      width: '100%',
      maxWidth: '400px',
      boxSizing: 'border-box',
    },
    logoText: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#111827',
      margin: '0 0 4px',
      letterSpacing: '-0.5px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: '0 0 36px',
      letterSpacing: '0.4px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      fontSize: '14px',
      color: '#111827',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.15s',
    },
    fieldGroup: {
      marginBottom: '20px',
    },
    button: {
      width: '100%',
      padding: '11px 0',
      fontSize: '14px',
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#111827',
      border: 'none',
      borderRadius: '8px',
      cursor: loading ? 'not-allowed' : 'pointer',
      marginTop: '8px',
      letterSpacing: '0.2px',
      opacity: loading ? 0.7 : 1,
    },
    errorText: {
      marginTop: '12px',
      fontSize: '13px',
      color: '#dc2626',
      textAlign: 'center',
    },
    signInRow: {
      marginTop: '20px',
      fontSize: '13px',
      color: '#6b7280',
      textAlign: 'center',
    },
    link: {
      color: '#111827',
      fontWeight: '600',
      textDecoration: 'none',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      padding: 0,
      fontSize: '13px',
    },
    confirmWrapper: {
      textAlign: 'center',
    },
    confirmIcon: {
      fontSize: '48px',
      color: '#0d3d2a',
      margin: '0 0 20px',
    },
    confirmTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#111827',
      margin: '0 0 16px',
    },
    confirmMessage: {
      fontSize: '14px',
      color: '#6b7280',
      lineHeight: '1.6',
      margin: '0 0 12px',
    },
    confirmSub: {
      fontSize: '14px',
      color: '#6b7280',
      margin: '0 0 28px',
    },
  };

  async function handleSubmit() {
    console.log("SUBMIT TRIGGERED");
    setError('');

    // Client-side validation
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

    // Create auth user
    console.log("Starting signup with:", email);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
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

    setEmailSent(true);
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {emailSent ? (
          <div style={styles.confirmWrapper}>
            <p style={styles.confirmIcon}>✉</p>
            <p style={styles.confirmTitle}>Check your email</p>
            <p style={styles.confirmMessage}>
              We sent a confirmation link to <strong>{email}</strong>. Please click the link to activate your account before signing in.
            </p>
            <p style={styles.confirmSub}>Once confirmed, click below to sign in.</p>
            <button type="button" style={styles.button} onClick={() => navigate('/login')}>
              Go to login
            </button>
          </div>
        ) : (
          <>
            <p style={styles.logoText}>Quick Quote 360</p>
            <p style={styles.subtitle}>Create your account</p>

            <div>
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Jane Smith"
                  style={styles.input}
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  style={styles.input}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  style={styles.input}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  style={styles.input}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="button" style={styles.button} disabled={loading} onClick={handleSubmit}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              {error && <p style={styles.errorText}>{error}</p>}
            </div>

            <p style={styles.signInRow}>
              Already have an account?{' '}
              <button style={styles.link} onClick={() => navigate('/login')}>
                Sign in
              </button>
            </p>
          </>
        )}

      </div>
    </div>
  );
}
