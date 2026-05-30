import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
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

  if (requiredRole === 'super_admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/client" replace />;
  }

  if (requiredRole === 'client' && profile?.role !== 'client' && profile?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
