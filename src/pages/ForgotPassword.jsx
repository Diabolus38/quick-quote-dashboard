import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif" },
    card: { backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '48px 40px 40px', width: '100%', maxWidth: '400px', boxSizing: 'border-box' },
    logoText: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px', letterSpacing: '-0.5px' },
    subtitle:  { fontSize: '14px', color: '#6b7280', margin: '0 0 36px', letterSpacing: '0.4px', textTransform: 'uppercase' },
    label:     { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
    input:     { width: '100%', padding: '10px 14px', fontSize: '14px', color: '#111827', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' },
    fieldGroup: { marginBottom: '20px' },
    button: { width: '100%', padding: '11px 0', fontSize: '14px', fontWeight: '600', color: '#ffffff', backgroundColor: '#111827', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', letterSpacing: '0.2px', opacity: loading ? 0.7 : 1 },
    errorText: { marginTop: '12px', fontSize: '13px', color: '#dc2626', textAlign: 'center' },
    backRow:   { marginTop: '20px', fontSize: '13px', color: '#6b7280', textAlign: 'center' },
    link:      { color: '#111827', fontWeight: '600', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontSize: '13px', fontFamily: 'inherit' },
    confirmWrapper: { textAlign: 'center' },
    confirmIcon:    { fontSize: '48px', color: '#0d3d2a', margin: '0 0 20px' },
    confirmTitle:   { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 16px' },
    confirmMessage: { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 28px' },
  };

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
    <div style={styles.page}>
      <div style={styles.card}>
        {emailSent ? (
          <div style={styles.confirmWrapper}>
            <p style={styles.confirmIcon}>✉</p>
            <p style={styles.confirmTitle}>Check your email</p>
            <p style={styles.confirmMessage}>
              We sent a reset link to <strong>{email}</strong>. Click the link to set a new password.
            </p>
            <button type="button" style={styles.button} onClick={() => navigate('/login')}>
              Back to login
            </button>
          </div>
        ) : (
          <>
            <p style={styles.logoText}>Quick Quote 360</p>
            <p style={styles.subtitle}>Reset your password</p>

            <form onSubmit={handleSubmit}>
              <div style={styles.fieldGroup}>
                <label style={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  style={styles.input}
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              {error && <p style={styles.errorText}>{error}</p>}
            </form>

            <p style={styles.backRow}>
              <button type="button" style={styles.link} onClick={() => navigate('/login')}>
                ← Back to login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
