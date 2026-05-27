import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public
import LoginPage      from './LoginPage';
import SignupPage     from './pages/SignupPage';
import ForgotPassword from './pages/ForgotPassword';

// Admin pages
import AdminOverview from './pages/AdminOverview';
import Clients       from './pages/Clients';
import ClientDetail  from './pages/admin/ClientDetail';
import SuperAdmin    from './pages/admin/SuperAdmin';
import AllLeads      from './pages/admin/AllLeads';
import Estimates     from './pages/Estimates';
import Billing       from './pages/Billing';
import Settings      from './pages/Settings';

// Client pages
import ClientOverview  from './pages/client/ClientOverview';
import Leads           from './pages/client/Leads';
import LeadDetail      from './pages/client/LeadDetail';
import ClientEstimates from './pages/client/ClientEstimates';
import ClientCustomers from './pages/client/ClientCustomers';
import ClientSettings  from './pages/client/Settings';
import QuestionEditor  from './pages/client/QuestionEditor';
import Pricing         from './pages/client/Pricing';
import PdfContent      from './pages/client/PdfContent';
import Municipalities  from './pages/client/Municipalities';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public ── */}
          <Route path="/"                element={<Navigate to="/login" replace />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ── Super-admin protected ── */}
          <Route path="/admin"             element={<ProtectedRoute requiredRole="super_admin"><AdminOverview /></ProtectedRoute>} />
          <Route path="/admin/clients"     element={<ProtectedRoute requiredRole="super_admin"><Clients /></ProtectedRoute>} />
          <Route path="/admin/clients/:id" element={<ProtectedRoute requiredRole="super_admin"><ClientDetail /></ProtectedRoute>} />
          <Route path="/admin/super"       element={<ProtectedRoute requiredRole="super_admin"><SuperAdmin /></ProtectedRoute>} />
          <Route path="/admin/leads"       element={<ProtectedRoute requiredRole="super_admin"><AllLeads /></ProtectedRoute>} />
          <Route path="/admin/leads/:id"   element={<ProtectedRoute requiredRole="super_admin"><AllLeads /></ProtectedRoute>} />
          <Route path="/admin/estimates"   element={<ProtectedRoute requiredRole="super_admin"><Estimates /></ProtectedRoute>} />
          <Route path="/admin/billing"     element={<ProtectedRoute requiredRole="super_admin"><Billing /></ProtectedRoute>} />
          <Route path="/admin/settings"    element={<ProtectedRoute requiredRole="super_admin"><Settings /></ProtectedRoute>} />

          {/* ── Client protected ── */}
          <Route path="/client"             element={<ProtectedRoute requiredRole="client"><ClientOverview /></ProtectedRoute>} />
          <Route path="/client/leads"       element={<ProtectedRoute requiredRole="client"><Leads /></ProtectedRoute>} />
          <Route path="/client/leads/:id"   element={<ProtectedRoute requiredRole="client"><LeadDetail /></ProtectedRoute>} />
          <Route path="/client/estimates"   element={<ProtectedRoute requiredRole="client"><ClientEstimates /></ProtectedRoute>} />
          <Route path="/client/customers"   element={<ProtectedRoute requiredRole="client"><ClientCustomers /></ProtectedRoute>} />
          <Route path="/client/settings"    element={<ProtectedRoute requiredRole="client"><ClientSettings /></ProtectedRoute>} />
          <Route path="/client/questions"      element={<ProtectedRoute requiredRole="client"><QuestionEditor /></ProtectedRoute>} />
          <Route path="/client/pricing"        element={<ProtectedRoute requiredRole="client"><Pricing /></ProtectedRoute>} />
          <Route path="/client/pdf"            element={<ProtectedRoute requiredRole="client"><PdfContent /></ProtectedRoute>} />
          <Route path="/client/municipalities" element={<ProtectedRoute requiredRole="client"><Municipalities /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
