import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorHandler from './components/GlobalErrorHandler';
import ConfigStatusProvider from './context/ConfigStatusContext';
import CookieBanner from './components/CookieBanner';
import LoginPage from './LoginPage';

// Public
const SignupPage     = lazy(() => import('./pages/SignupPage'));
const SignupConfirm  = lazy(() => import('./pages/SignupConfirm'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy  = lazy(() => import('./pages/PrivacyPolicy'));
const InstallGuide   = lazy(() => import('./pages/InstallGuide'));

// Admin pages
const AdminOverview  = lazy(() => import('./pages/AdminOverview'));
const Clients        = lazy(() => import('./pages/Clients'));
const ClientDetail   = lazy(() => import('./pages/admin/ClientDetail'));
const SuperAdmin     = lazy(() => import('./pages/admin/SuperAdmin'));
const AllLeads       = lazy(() => import('./pages/admin/AllLeads'));
const AdminLeadDetail = lazy(() => import('./pages/admin/AdminLeadDetail'));
const Estimates      = lazy(() => import('./pages/Estimates'));
const Billing        = lazy(() => import('./pages/Billing'));
const Settings       = lazy(() => import('./pages/Settings'));

// Client pages
const ClientOverview  = lazy(() => import('./pages/client/ClientOverview'));
const Leads           = lazy(() => import('./pages/client/Leads'));
const LeadDetail      = lazy(() => import('./pages/client/LeadDetail'));
const ClientEstimates = lazy(() => import('./pages/client/ClientEstimates'));
const ClientCustomers = lazy(() => import('./pages/client/ClientCustomers'));
const ClientSettings  = lazy(() => import('./pages/client/Settings'));
const QuestionEditor  = lazy(() => import('./pages/client/QuestionEditor'));
const Pricing         = lazy(() => import('./pages/client/Pricing'));
const PdfContent      = lazy(() => import('./pages/client/PdfContent'));
const Municipalities  = lazy(() => import('./pages/client/Municipalities'));

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";

const suspenseFallback = (
  <>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <span style={{ fontSize: '22px', fontWeight: '800', color: '#0d1117', letterSpacing: '-0.5px' }}>Quick Quote</span>
          <span style={{ display: 'block', fontSize: '22px', fontWeight: '800', color: '#a3e635', letterSpacing: '-0.5px' }}>360</span>
        </div>
        <div style={{ width: '32px', height: '32px', border: '3px solid #e8ede8', borderTopColor: '#166634', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    </div>
  </>
);

export default function App() {
  return (
    <ErrorBoundary>
      <GlobalErrorHandler />
      <BrowserRouter>
        <AuthProvider>
          <ConfigStatusProvider>
          <Suspense fallback={suspenseFallback}>
          <Routes>
            {/* ── Public ── */}
            <Route path="/"                element={<ErrorBoundary><Navigate to="/login" replace /></ErrorBoundary>} />
            <Route path="/login"           element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
            <Route path="/signup"          element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
            <Route path="/signup/confirm"  element={<ErrorBoundary><SignupConfirm /></ErrorBoundary>} />
            <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
            <Route path="/terms"           element={<ErrorBoundary><TermsOfService /></ErrorBoundary>} />
            <Route path="/privacy"         element={<ErrorBoundary><PrivacyPolicy /></ErrorBoundary>} />
            <Route path="/install-guide"   element={<ErrorBoundary><InstallGuide /></ErrorBoundary>} />

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
          </Suspense>
          </ConfigStatusProvider>
        </AuthProvider>
        <CookieBanner />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
