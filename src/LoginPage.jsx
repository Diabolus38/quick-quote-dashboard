import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, profile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      textTransform: 'uppercase',
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
    adminNote: {
      marginTop: '16px',
      fontSize: '12px',
      color: '#9ca3af',
      textAlign: 'center',
    },
    signUpRow: {
      marginTop: '12px',
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
    errorText: {
      marginTop: '12px',
      fontSize: '13px',
      color: '#dc2626',
      textAlign: 'center',
    },
  };

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

    // Re-fetch the profile directly here so we can redirect immediately
    // without waiting for onAuthStateChange to propagate through context.
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
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.logoText}>Quick Quote 360</p>
        <p style={styles.subtitle}>Dashboard</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              style={styles.input}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ ...styles.label, marginBottom: 0 }} htmlFor="password">Password</label>
              <button type="button" onClick={() => navigate('/forgot-password')} style={{ ...styles.link, fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              style={styles.input}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {error && <p style={styles.errorText}>{error}</p>}
        </form>

        <p style={styles.adminNote}>Admin access only</p>
        <p style={styles.signUpRow}>
          New client?{' '}
          <button style={styles.link} onClick={() => navigate('/signup')}>
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
