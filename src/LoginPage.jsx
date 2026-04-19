import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
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
      cursor: 'pointer',
      marginTop: '8px',
      letterSpacing: '0.2px',
    },
    adminNote: {
      marginTop: '16px',
      fontSize: '12px',
      color: '#9ca3af',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.logoText}>Quick Quote 360</p>
        <p style={styles.subtitle}>Dashboard</p>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="admin@example.com"
            style={styles.input}
            autoComplete="email"
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            style={styles.input}
            autoComplete="current-password"
          />
        </div>

        <button type="button" style={styles.button} onClick={() => navigate('/admin')}>Sign in</button>

        <p style={styles.adminNote}>Admin access only</p>
      </div>
    </div>
  );
}
