import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          <div>
            <span style={{ color: '#0d1117', fontSize: '22px', fontWeight: '800' }}>Quick Quote</span>
            <span style={{ display: 'block', color: '#a3e635', fontSize: '22px', fontWeight: '800' }}>360</span>
          </div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90vw', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', textAlign: 'center', marginTop: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              ✕
            </div>
            <h2 style={{ color: '#0d1117', fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>Something went wrong</h2>
            <p style={{ color: '#6b7280', fontSize: '13.5px', lineHeight: '1.6', margin: '0 0 20px' }}>
              This page encountered an error. Try refreshing — if the problem persists contact support@quickquote360.com.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button type="button" onClick={() => window.location.reload()}
                style={{ backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' }}>
                Refresh Page
              </button>
              <button type="button" onClick={() => { window.location.href = '/'; }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', marginTop: '8px' }}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
