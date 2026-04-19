import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
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
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/clients" element={<Clients />} />
        <Route path="/admin/estimates" element={<Estimates />} />
        <Route path="/admin/billing" element={<Billing />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/client" element={<ClientOverview />} />
        <Route path="/client/estimates" element={<ClientEstimates />} />
        <Route path="/client/customers" element={<ClientCustomers />} />
        <Route path="/client/settings" element={<ClientSettings />} />
      </Routes>
    </BrowserRouter>
  );
}
