import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [clientActive, setClientActive] = useState(true);
  const [checkingActive, setCheckingActive] = useState(false);

  useEffect(() => {
    if (!profile?.client_id || profile?.role === 'super_admin') return;
    setCheckingActive(true);
    supabase.from('clients').select('active').eq('id', profile.client_id).single()
      .then(({ data }) => {
        if (data && data.active === false) setClientActive(false);
        setCheckingActive(false);
      });
  }, [profile?.client_id]);

  if (loading || checkingActive) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: FONT }}>
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px' }}>Quick Quote</span>
            <span style={{ display: 'block', fontSize: '22px', fontWeight: '800', color: '#a3e635', letterSpacing: '-0.5px' }}>360</span>
          </div>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e8ede8', borderTopColor: '#166534', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      </>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated but profile hasn't loaded yet (e.g. right after email
  // confirmation while the SIGNED_IN handler creates rows). Show spinner, not a redirect.
  if (profile === null) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: FONT }}>
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px' }}>Quick Quote</span>
            <span style={{ display: 'block', fontSize: '22px', fontWeight: '800', color: '#a3e635', letterSpacing: '-0.5px' }}>360</span>
          </div>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e8ede8', borderTopColor: '#166534', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
      </>
    );
  }

  if (profile?.role === 'super_admin') {
    return children;
  }

  if (requiredRole === 'super_admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/client" replace />;
  }

  if (requiredRole === 'client' && profile?.role !== 'client' && profile?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!clientActive && profile?.role === 'client') {
    return (
      <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px' }}>Quick Quote</span>
          <span style={{ display: 'block', fontSize: '22px', fontWeight: '800', color: '#a3e635', letterSpacing: '-0.5px' }}>360</span>
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: '700', color: '#0d1117', fontFamily: FONT }}>Account Deactivated</h2>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#6b7280', textAlign: 'center', maxWidth: '400px', lineHeight: '1.6', fontFamily: FONT }}>
          Your account has been deactivated. Please contact <strong>support@quickquote360.com</strong> to reactivate.
        </p>
        <button type="button" onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
          style={{ backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: FONT }}>
          Logout
        </button>
      </div>
    );
  }

  return children;
}
