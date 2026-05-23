import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
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
