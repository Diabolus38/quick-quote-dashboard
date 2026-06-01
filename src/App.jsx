import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorHandler from './components/GlobalErrorHandler';
import ConfigStatusProvider from './context/ConfigStatusContext';

// Public
import LoginPage      from './LoginPage';
import SignupPage     from './pages/SignupPage';
import ForgotPassword from './pages/ForgotPassword';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy  from './pages/PrivacyPolicy';
import CookieBanner   from './components/CookieBanner';

// Admin pages
import AdminOverview from './pages/AdminOverview';
import Clients       from './pages/Clients';
import ClientDetail  from './pages/admin/ClientDetail';
import SuperAdmin    from './pages/admin/SuperAdmin';
import AllLeads        from './pages/admin/AllLeads';
import AdminLeadDetail from './pages/admin/AdminLeadDetail';
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
    <ErrorBoundary>
      <GlobalErrorHandler />
      <BrowserRouter>
        <AuthProvider>
          <ConfigStatusProvider>
          <Routes>
            {/* ── Public ── */}
            <Route path="/"                element={<ErrorBoundary><Navigate to="/login" replace /></ErrorBoundary>} />
            <Route path="/login"           element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
            <Route path="/signup"          element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
            <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
            <Route path="/terms"           element={<ErrorBoundary><TermsOfService /></ErrorBoundary>} />
            <Route path="/privacy"         element={<ErrorBoundary><PrivacyPolicy /></ErrorBoundary>} />

            {/* ── Super-admin protected ── */}
            <Route path="/admin"             element={<ErrorBoundary><ProtectedRoute requiredRole="super_admin"><AdminOverview /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/admin/clients"     element={<ErrorBoundary><ProtectedRoute requiredRole="super_admin"><Clients /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/admin/clients/:id" element={<ErrorBoundary><ProtectedRoute requiredRole="super_admin"><ClientDetail /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/admin/super"       element={<ErrorBoundary><ProtectedRoute requiredRole="super_admin"><SuperAdmin /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/admin/leads"       element={<ErrorBoundary><ProtectedRoute requiredRole="super_admin"><AllLeads /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/admin/leads/:id"   element={<ErrorBoundary><ProtectedRoute requiredRole="super_admin"><AdminLeadDetail /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/admin/estimates"   element={<ErrorBoundary><ProtectedRoute requiredRole="super_admin"><Estimates /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/admin/billing"     element={<ErrorBoundary><ProtectedRoute requiredRole="super_admin"><Billing /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/admin/settings"    element={<ErrorBoundary><ProtectedRoute requiredRole="super_admin"><Settings /></ProtectedRoute></ErrorBoundary>} />

            {/* ── Client protected ── */}
            <Route path="/client"             element={<ErrorBoundary><ProtectedRoute requiredRole="client"><ClientOverview /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/client/leads"       element={<ErrorBoundary><ProtectedRoute requiredRole="client"><Leads /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/client/leads/:id"   element={<ErrorBoundary><ProtectedRoute requiredRole="client"><LeadDetail /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/client/estimates"   element={<ErrorBoundary><ProtectedRoute requiredRole="client"><ClientEstimates /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/client/customers"   element={<ErrorBoundary><ProtectedRoute requiredRole="client"><ClientCustomers /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/client/settings"    element={<ErrorBoundary><ProtectedRoute requiredRole="client"><ClientSettings /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/client/questions"      element={<ErrorBoundary><ProtectedRoute requiredRole="client"><QuestionEditor /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/client/pricing"        element={<ErrorBoundary><ProtectedRoute requiredRole="client"><Pricing /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/client/pdf"            element={<ErrorBoundary><ProtectedRoute requiredRole="client"><PdfContent /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/client/municipalities" element={<ErrorBoundary><ProtectedRoute requiredRole="client"><Municipalities /></ProtectedRoute></ErrorBoundary>} />
          </Routes>
          </ConfigStatusProvider>
        </AuthProvider>
        <CookieBanner />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
