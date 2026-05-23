import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './LoginPage';
import SignupPage from './pages/SignupPage';
import AdminOverview from './pages/AdminOverview';
import Clients from './pages/Clients';
import Estimates from './pages/Estimates';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import ClientOverview from './pages/client/ClientOverview';
import ClientEstimates from './pages/client/ClientEstimates';
import ClientCustomers from './pages/client/ClientCustomers';
import ClientSettings from './pages/client/ClientSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Super-admin protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <AdminOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/estimates"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Estimates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Client protected */}
          <Route
            path="/client"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/estimates"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientEstimates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/customers"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientCustomers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/settings"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
