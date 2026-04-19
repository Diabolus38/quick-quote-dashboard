import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import AdminOverview from './pages/AdminOverview';
import Clients from './pages/Clients';
import Estimates from './pages/Estimates';
import Billing from './pages/Billing';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/clients" element={<Clients />} />
        <Route path="/admin/estimates" element={<Estimates />} />
        <Route path="/admin/billing" element={<Billing />} />
      </Routes>
    </BrowserRouter>
  );
}
