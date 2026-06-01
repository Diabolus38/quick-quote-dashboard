import { useState, useEffect } from 'react';

export default function GlobalErrorHandler() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let timer;

    function handleUnhandledRejection(event) {
      console.error('Unhandled promise rejection:', event.reason);
      setShowToast(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowToast(false), 5000);
    }

    function handleError(event) {
      console.error('Unhandled error:', event.error || event.message);
      setShowToast(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowToast(false), 5000);
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      clearTimeout(timer);
    };
  }, []);

  if (!showToast) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, backgroundColor: '#dc2626', color: '#fff', borderRadius: '12px', padding: '14px 20px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '360px' }}>
      <span style={{ flex: 1 }}>An unexpected error occurred. Please refresh if something looks wrong.</span>
      <button type="button" onClick={() => setShowToast(false)}
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}>
        ✕
      </button>
    </div>
  );
}
